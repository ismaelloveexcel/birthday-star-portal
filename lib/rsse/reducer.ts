import type {
  SessionEvent,
  SessionPlayer,
  SessionRuntimeState,
  SessionStateSnapshot,
  SnapshotState,
  SocialSession,
} from './contracts'
import { createInitialSnapshot, reduceSnapshotState } from './snapshots'
import { isTransitionAllowed } from './stateMachine'
import { RsseError } from './errors'

function cloneSession(s: SocialSession): SocialSession {
  return { ...s }
}

function nextSnapshot(
  prev: SessionStateSnapshot,
  state: SnapshotState,
  lastEventId: string | null,
  sequenceNumber: number,
): SessionStateSnapshot {
  return {
    ...prev,
    state,
    lastEventId,
    sequenceNumber,
    createdAt: new Date().toISOString(),
  }
}

export function applyEventsToRuntime(
  base: Omit<SessionRuntimeState, 'derivedFlags'>,
  events: SessionEvent[],
): Omit<SessionRuntimeState, 'derivedFlags'> {
  let session = cloneSession(base.session)
  let snapshot = { ...base.snapshot }
  let snapshotState = { ...base.snapshot.state }
  const playersById = new Map(
    base.activePlayers.map((p) => [p.id, { ...p }]),
  )
  let lastEvent = base.lastEvent

  for (const ev of events) {
    lastEvent = ev
    switch (ev.eventType) {
      case 'session_created':
        break
      case 'session_opened':
        if (!isTransitionAllowed(session.status, 'lobby')) {
          throw new RsseError('Invalid transition to lobby', 'invalid_transition', {
            stateBefore: session.status,
            attemptedState: 'lobby',
          })
        }
        session = { ...session, status: 'lobby', updatedAt: ev.createdAt }
        break
      case 'player_joined': {
        const pid = typeof ev.payload.playerId === 'string' ? ev.payload.playerId : null
        const displayName =
          typeof ev.payload.displayName === 'string' ? ev.payload.displayName : 'Player'
        const avatarEmoji =
          typeof ev.payload.avatarEmoji === 'string' ? ev.payload.avatarEmoji : '*'
        const role =
          ev.payload.role === 'host' ? 'host' : ('player' as SessionPlayer['role'])
        if (!pid) break
        const pl: SessionPlayer = {
          id: pid,
          sessionId: session.id,
          displayName,
          avatarEmoji,
          role,
          joinedAt: ev.createdAt,
          lastSeenAt: ev.createdAt,
        }
        playersById.set(pid, pl)
        if (role === 'host' || session.hostPlayerId == null) {
          session = {
            ...session,
            hostPlayerId: session.hostPlayerId ?? pid,
            updatedAt: ev.createdAt,
          }
        }
        break
      }
      case 'host_started':
        if (!isTransitionAllowed(session.status, 'active')) {
          throw new RsseError('Cannot start from current state', 'invalid_transition', {
            stateBefore: session.status,
            attemptedState: 'active',
          })
        }
        session = { ...session, status: 'active', updatedAt: ev.createdAt }
        snapshotState = reduceSnapshotState(snapshotState, [ev])
        break
      case 'checkpoint_reached':
      case 'experience_event_emitted':
        snapshotState = reduceSnapshotState(snapshotState, [ev])
        break
      case 'unlock_requested':
        if (session.status === 'active') {
          if (!isTransitionAllowed(session.status, 'locked_active')) {
            throw new RsseError('Cannot lock from state', 'invalid_transition')
          }
          session = { ...session, status: 'locked_active', updatedAt: ev.createdAt }
        }
        snapshotState = reduceSnapshotState(snapshotState, [ev])
        break
      case 'unlock_clicked':
        snapshotState = reduceSnapshotState(snapshotState, [ev])
        break
      case 'session_locked':
        if (
          session.status === 'active' &&
          isTransitionAllowed(session.status, 'locked_active')
        ) {
          session = { ...session, status: 'locked_active', updatedAt: ev.createdAt }
        } else if (session.status === 'locked_active') {
          session = { ...session, updatedAt: ev.createdAt }
        }
        break
      case 'session_unlocked':
        session = {
          ...session,
          isUnlocked: true,
          status: session.status === 'locked_active' ? 'active' : session.status,
          updatedAt: ev.createdAt,
        }
        snapshotState = reduceSnapshotState(snapshotState, [ev])
        break
      case 'session_completed':
        if (!isTransitionAllowed(session.status, 'completed')) {
          throw new RsseError('Cannot complete', 'invalid_transition', {
            stateBefore: session.status,
            attemptedState: 'completed',
          })
        }
        session = { ...session, status: 'completed', updatedAt: ev.createdAt }
        snapshotState = reduceSnapshotState(snapshotState, [ev])
        break
      case 'session_archived':
        if (!isTransitionAllowed(session.status, 'archived')) {
          throw new RsseError('Cannot archive', 'invalid_transition')
        }
        session = { ...session, status: 'archived', updatedAt: ev.createdAt }
        break
      case 'session_expired':
        if (isTransitionAllowed(session.status, 'expired')) {
          session = { ...session, status: 'expired', updatedAt: ev.createdAt }
        }
        break
      case 'results_generated':
      case 'session_shared':
      case 'waitlist_joined':
      case 'session_failure_detected':
        break
      default:
        break
    }

    snapshot = nextSnapshot(
      snapshot,
      snapshotState,
      ev.id,
      ev.sequenceNumber,
    )
  }

  return {
    session,
    snapshot,
    activePlayers: [...playersById.values()],
    lastEvent,
  }
}

export function initialRuntimeForNewSession(
  session: SocialSession,
  firstEventId: string,
): Omit<SessionRuntimeState, 'derivedFlags'> {
  const snap = createInitialSnapshot(session.id, firstEventId, 0)
  return {
    session,
    snapshot: snap,
    activePlayers: [],
    lastEvent: null,
  }
}
