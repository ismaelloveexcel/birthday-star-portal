import type {
  SessionEvent,
  SessionPlayer,
  SessionRuntimeState,
  SessionStateSnapshot,
  SocialSession,
} from './contracts'
import { computeDerivedFlags } from './derivedFlags'
import { getRssePersistence } from './persistence/factory'
import { applyEventsToRuntime } from './reducer'

/**
 * Replays persisted events onto a snapshot baseline (tests + offline merge).
 */
export function replayDelta(
  baseSession: SocialSession,
  baseSnapshot: SessionStateSnapshot,
  basePlayers: SessionPlayer[],
  deltaEvents: SessionEvent[],
): Omit<SessionRuntimeState, 'derivedFlags'> {
  return applyEventsToRuntime(
    {
      session: baseSession,
      snapshot: baseSnapshot,
      activePlayers: basePlayers,
      lastEvent: null,
    },
    deltaEvents,
  )
}

/**
 * Loads authoritative runtime from the latest snapshot and session row.
 */
export async function rehydrateSession(input: {
  sessionId: string
  lastSeenSequenceNumber?: number
}): Promise<SessionRuntimeState> {
  const rt = await getRssePersistence().loadRuntime(input.sessionId)
  if (!rt) {
    throw new Error('Session not found')
  }
  void input.lastSeenSequenceNumber
  return rt
}
