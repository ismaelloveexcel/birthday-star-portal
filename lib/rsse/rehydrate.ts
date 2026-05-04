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

/** Authoritative runtime plus optional delta events for catch-up after `lastSeenSequenceNumber`. */
export type RehydrateSessionResult = SessionRuntimeState & {
  eventsAfterLastSeen: SessionEvent[]
}

/**
 * Read ordered session events with `sequence_number` strictly greater than `afterSequence`.
 */
export async function loadEventsAfterSequence(
  sessionId: string,
  afterSequence: number,
): Promise<SessionEvent[]> {
  return getRssePersistence().readEventsAfterSequence(sessionId, afterSequence)
}

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
 * When `lastSeenSequenceNumber` is set, also loads persisted events after that sequence
 * (for client catch-up; snapshot + session row remain authoritative).
 */
export async function rehydrateSession(input: {
  sessionId: string
  lastSeenSequenceNumber?: number
}): Promise<RehydrateSessionResult> {
  const persistence = getRssePersistence()
  const rt = await persistence.loadRuntime(input.sessionId)
  if (!rt) {
    throw new Error('Session not found')
  }
  const after = input.lastSeenSequenceNumber
  const eventsAfterLastSeen =
    after === undefined
      ? []
      : await persistence.readEventsAfterSequence(input.sessionId, after)
  return { ...rt, eventsAfterLastSeen }
}
