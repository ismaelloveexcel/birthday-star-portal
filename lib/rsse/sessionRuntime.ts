import type { SessionRuntimeState } from './contracts'
import { computeDerivedFlags } from './derivedFlags'
import type { RsseMemoryStore } from './memoryPersistence'
import { reconcileCachedStatus } from './snapshots'

export function loadPlayers(store: RsseMemoryStore, sessionId: string) {
  return [...store.sessionPlayers.values()].filter((p) => p.sessionId === sessionId)
}

export function loadEvents(store: RsseMemoryStore, sessionId: string) {
  return [...store.sessionEvents.values()]
    .filter((e) => e.sessionId === sessionId)
    .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
}

export function loadSessionRuntime(
  store: RsseMemoryStore,
  sessionId: string,
): SessionRuntimeState | null {
  const session = store.socialSessions.get(sessionId)
  if (!session) return null
  const snap = store.sessionSnapshots.get(sessionId) ?? null
  if (!snap) return null
  const activePlayers = loadPlayers(store, sessionId)
  const events = loadEvents(store, sessionId)
  const lastEvent = events.length ? events[events.length - 1]! : null
  const latestSeq = lastEvent?.sequenceNumber ?? 0
  const { repaired, status } = reconcileCachedStatus(
    session,
    snap.sequenceNumber,
    latestSeq,
  )
  const sessionFixed = repaired ? { ...session, status } : session
  const base: Omit<SessionRuntimeState, 'derivedFlags'> = {
    session: sessionFixed,
    snapshot: snap,
    activePlayers,
    lastEvent,
  }
  return {
    ...base,
    derivedFlags: computeDerivedFlags(base),
  }
}
