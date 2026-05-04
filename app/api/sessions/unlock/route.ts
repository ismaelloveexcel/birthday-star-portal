import { NextResponse } from 'next/server'
import { z } from 'zod'
import { applyPlatformCommand } from '@/lib/rsse/applyPlatformCommand'
import { mapRsseError } from '@/lib/rsse/apiErrors'
import { resolveUnlockCheckoutEnv } from '@/lib/rsse/unlockCheckout'

const bodySchema = z.object({
  sessionId: z.string().uuid(),
  playerId: z.string().uuid().optional(),
  idempotencyKey: z.string().min(8).max(200),
  lastSeenSequenceNumber: z.number().int().nonnegative().optional(),
})

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.message },
        { status: 400 },
      )
    }

    const checkout = resolveUnlockCheckoutEnv()
    if (!checkout.ok) {
      return NextResponse.json(
        { error: checkout.error, code: checkout.code },
        { status: checkout.status },
      )
    }

    await applyPlatformCommand({
      type: 'REQUEST_UNLOCK',
      sessionId: parsed.data.sessionId,
      playerId: parsed.data.playerId,
      idempotencyKey: parsed.data.idempotencyKey,
      lastSeenSequenceNumber: parsed.data.lastSeenSequenceNumber,
    })

    return NextResponse.json({
      checkoutUrl: checkout.checkoutUrl,
      mode: checkout.mode,
    })
  } catch (e) {
    return mapRsseError(e)
  }
}
