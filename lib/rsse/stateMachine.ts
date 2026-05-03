import type { SessionStatus } from './contracts'

export const allowedTransitions: Record<SessionStatus, SessionStatus[]> = {
  created: ['lobby', 'expired'],
  lobby: ['active', 'expired'],
  active: ['locked_active', 'completed', 'expired'],
  locked_active: ['active', 'completed', 'expired'],
  completed: ['archived'],
  archived: [],
  expired: [],
}

export function isTransitionAllowed(
  from: SessionStatus,
  to: SessionStatus,
): boolean {
  return allowedTransitions[from]?.includes(to) ?? false
}
