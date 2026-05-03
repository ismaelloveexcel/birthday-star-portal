import { NextResponse } from 'next/server'
import { z } from 'zod'
import { applyPlatformCommand } from '@/lib/rsse/applyPlatformCommand'
import { findSessionIdByShortCode } from '@/lib/rsse/applyPlatformCommand'
import { mapRsseError } from '@/lib/rsse/apiErrors'

const bodySchema = z.object({
  shortCode: z.string().min(4).max(12),
  displayName: z.string().min(1).max(20),
  avatarEmoji: z.string().max(8).optional(),
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
    const sessionId = findSessionIdByShortCode(
      parsed.data.shortCode.toLowerCase(),
    )
    if (!sessionId) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    const res = await applyPlatformCommand({
      type: 'JOIN_SESSION',
      sessionId,
      idempotencyKey: parsed.data.idempotencyKey,
      lastSeenSequenceNumber: parsed.data.lastSeenSequenceNumber,
      payload: {
        displayName: parsed.data.displayName,
        avatarEmoji: parsed.data.avatarEmoji,
      },
    })
    const joined = res.events.find((e) => e.eventType === 'player_joined')
    const playerId =
      joined && typeof joined.payload.playerId === 'string'
        ? joined.payload.playerId
        : null
    return NextResponse.json({
      sessionId,
      playerId,
      snapshot: res.snapshot,
      derivedFlags: res.derivedFlags,
      events: res.events,
    })
  } catch (e) {
    return mapRsseError(e)
  }
}
