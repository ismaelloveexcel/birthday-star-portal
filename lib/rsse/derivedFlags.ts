import type { SessionDerivedFlags, SessionRuntimeState } from './contracts'

export function computeDerivedFlags(
  input: Pick<
    SessionRuntimeState,
    'session' | 'snapshot' | 'activePlayers'
  >,
): SessionDerivedFlags {
  const { session, activePlayers } = input
  const count = activePlayers.length
  const atCapacity = count >= session.maxPlayers
  const isHostPresent =
    session.hostPlayerId != null &&
    activePlayers.some((p) => p.id === session.hostPlayerId)

  const isJoinable =
    (session.status === 'lobby' || session.status === 'created') &&
    !atCapacity

  const isLocked = session.status === 'locked_active'

  const canStart =
    session.status === 'lobby' &&
    isHostPresent &&
    count > 0

  const canComplete =
    session.status === 'active' || session.status === 'locked_active'

  const hasActivePlayers = count > 0

  const requiresPayment =
    session.status === 'locked_active' && !session.isUnlocked

  return {
    isJoinable,
    isLocked,
    canStart,
    canComplete,
    hasActivePlayers,
    requiresPayment,
  }
}
