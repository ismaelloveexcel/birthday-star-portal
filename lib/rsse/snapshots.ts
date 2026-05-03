import type {
  SessionEvent,
  SessionStateSnapshot,
  SnapshotState,
  SocialSession,
} from './contracts'

const emptySnapshotState = (): SnapshotState => ({
  checkpointCount: 0,
  unlockCount: 0,
})

export function createInitialSnapshot(
  sessionId: string,
  lastEventId: string | null,
  sequenceNumber: number,
): SessionStateSnapshot {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  return {
    id,
    sessionId,
    state: emptySnapshotState(),
    lastEventId,
    sequenceNumber,
    createdAt: now,
  }
}

export function reduceSnapshotState(
  prev: SnapshotState,
  events: SessionEvent[],
): SnapshotState {
  let state = { ...prev }
  for (const ev of events) {
    switch (ev.eventType) {
      case 'host_started':
        state = { ...state, startedAt: ev.createdAt }
        break
      case 'checkpoint_reached':
        state = {
          ...state,
          checkpointCount: state.checkpointCount + 1,
          lastCheckpointLabel:
            typeof ev.payload.label === 'string'
              ? ev.payload.label
              : state.lastCheckpointLabel,
        }
        break
      case 'session_unlocked':
      case 'unlock_clicked':
        state = {
          ...state,
          unlockCount: state.unlockCount + 1,
        }
        break
      case 'session_completed':
        state = { ...state, completedAt: ev.createdAt }
        break
      default:
        break
    }
  }
  return state
}

export function reconcileCachedStatus(
  session: SocialSession,
  snapshotSeq: number,
  latestEventSeq: number,
): { repaired: boolean; status: SocialSession['status'] } {
  if (session.status === 'expired' || session.status === 'archived') {
    return { repaired: false, status: session.status }
  }
  /** Heuristic: if DB status is behind snapshot-driven truth, prefer snapshot-derived lobby/active etc. */
  const mismatch =
    latestEventSeq > 0 &&
    snapshotSeq !== latestEventSeq &&
    session.status === 'created'

  if (mismatch) {
    return { repaired: true, status: 'lobby' }
  }
  return { repaired: false, status: session.status }
}
