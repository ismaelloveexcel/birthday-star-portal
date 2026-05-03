import type { PlatformCommand, SessionRuntimeState } from './contracts'
import type { SessionEvent } from './contracts'

export type MonetizationDecision =
  | { action: 'ALLOW' }
  | { action: 'LOCK_SESSION'; priceCents: number; reason: string }
  | { action: 'BLOCK_EVENT'; reason: string }

export interface MonetizationPolicy {
  evaluate(input: {
    previous: SessionRuntimeState
    next: SessionRuntimeState
    command: PlatformCommand
    events: SessionEvent[]
  }): MonetizationDecision
}

const DEFAULT_LOCK_CENTS = 499

/**
 * Structural v1: lock when unlock is requested and session not yet entitled.
 * Does not read payment providers; never touches DB.
 */
export const defaultMonetizationPolicy: MonetizationPolicy = {
  evaluate({ next, command, events }) {
    if (command.type !== 'REQUEST_UNLOCK') {
      return { action: 'ALLOW' }
    }
    const hasUnlockEvent = events.some(
      (e) =>
        e.eventType === 'session_unlocked' ||
        e.eventType === 'unlock_requested',
    )
    if (next.session.isUnlocked || next.session.status !== 'locked_active') {
      return { action: 'ALLOW' }
    }
    if (hasUnlockEvent && !next.session.isUnlocked) {
      return {
        action: 'LOCK_SESSION',
        priceCents: DEFAULT_LOCK_CENTS,
        reason: 'unlock_pending_entitlement',
      }
    }
    return { action: 'ALLOW' }
  },
}

export function applyMonetizationDecision(
  proposedEvents: SessionEvent[],
  decision: MonetizationDecision,
  ctx: { sessionId: string; playerId: string | null; now: string },
): SessionEvent[] {
  if (decision.action === 'ALLOW') {
    return proposedEvents
  }
  if (decision.action === 'BLOCK_EVENT') {
    return proposedEvents.filter(
      (e) =>
        e.eventType !== 'unlock_requested' &&
        e.eventType !== 'experience_event_emitted',
    )
  }
  const maxSeq = proposedEvents.reduce(
    (m, e) => Math.max(m, e.sequenceNumber),
    0,
  )
  const lockEvent: SessionEvent = {
    id: crypto.randomUUID(),
    sessionId: ctx.sessionId,
    playerId: ctx.playerId,
    eventType: 'session_locked',
    payload: {
      priceCents: decision.priceCents,
      reason: decision.reason,
    },
    sequenceNumber: maxSeq + 1,
    idempotencyKey: null,
    createdAt: ctx.now,
  }
  return [...proposedEvents, lockEvent]
}
