import type {
  SessionEvent,
  SessionPlayer,
  SessionRuntimeState,
  SessionStateSnapshot,
  SocialSession,
} from './contracts'
import { computeDerivedFlags } from './derivedFlags'
import { getRsseStore } from './memoryPersistence'
import { applyEventsToRuntime } from './reducer'
import { loadPlayers, loadSessionRuntime } from './sessionRuntime'

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
 * Realtime deltas are non-authoritative; clients should replace local state from this result.
 */
export async function rehydrateSession(input: {
  sessionId: string
  lastSeenSequenceNumber?: number
}): Promise<SessionRuntimeState> {
  const store = getRsseStore()
  const rt = loadSessionRuntime(store, input.sessionId)
  if (!rt) {
    throw new Error('Session not found')
  }
  const activePlayers = loadPlayers(store, input.sessionId)
  void input.lastSeenSequenceNumber
  return {
    ...rt,
    activePlayers,
    derivedFlags: computeDerivedFlags({ ...rt, activePlayers }),
  }
}
