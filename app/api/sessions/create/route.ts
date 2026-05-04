import { NextResponse } from 'next/server'
import { z } from 'zod'
import { applyPlatformCommand } from '@/lib/rsse/applyPlatformCommand'
import { mapRsseError } from '@/lib/rsse/apiErrors'

export const runtime = 'nodejs'

const bodySchema = z.object({
  title: z.string().max(120).optional(),
  maxPlayers: z.number().int().min(2).max(32).optional(),
  experienceTypeId: z.string().optional(),
  idempotencyKey: z.string().min(8).max(200),
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
    const res = await applyPlatformCommand({
      type: 'CREATE_SESSION',
      idempotencyKey: parsed.data.idempotencyKey,
      payload: {
        title: parsed.data.title,
        maxPlayers: parsed.data.maxPlayers,
        experienceTypeId: parsed.data.experienceTypeId,
      },
    })
    const created = res.events.find((e) => e.eventType === 'session_created')
    const shortCode =
      created && typeof created.payload.shortCode === 'string'
        ? created.payload.shortCode
        : ''
    return NextResponse.json({
      sessionId: res.snapshot.sessionId,
      shortCode,
      snapshot: res.snapshot,
      derivedFlags: res.derivedFlags,
    })
  } catch (e) {
    return mapRsseError(e)
  }
}
