import { NextResponse } from 'next/server'
import { z } from 'zod'
import { applyPlatformCommand } from '@/lib/rsse/applyPlatformCommand'
import { mapRsseError } from '@/lib/rsse/apiErrors'

export const runtime = 'nodejs'

const commandSchema = z.object({
  type: z.enum([
    'CREATE_SESSION',
    'JOIN_SESSION',
    'START_SESSION',
    'EMIT_EXPERIENCE_EVENT',
    'REQUEST_UNLOCK',
    'COMPLETE_SESSION',
    'ARCHIVE_SESSION',
  ]),
  sessionId: z.string().uuid().optional(),
  playerId: z.string().uuid().optional(),
  idempotencyKey: z.string().min(8).max(200),
  lastSeenSequenceNumber: z.number().int().nonnegative().optional(),
  payload: z.any().optional(),
})

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const parsed = commandSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.message },
        { status: 400 },
      )
    }
    const res = await applyPlatformCommand({
      type: parsed.data.type,
      sessionId: parsed.data.sessionId,
      playerId: parsed.data.playerId,
      idempotencyKey: parsed.data.idempotencyKey,
      lastSeenSequenceNumber: parsed.data.lastSeenSequenceNumber,
      payload: parsed.data.payload as Record<string, unknown> | undefined,
    })
    return NextResponse.json(res)
  } catch (e) {
    return mapRsseError(e)
  }
}
