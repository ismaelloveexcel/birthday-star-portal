import type { PlatformCommandType } from './contracts'

export type SessionFailureCode =
  | 'event_rejected'
  | 'invalid_transition'
  | 'payment_failed'
  | 'sync_lag_detected'
  | 'snapshot_status_mismatch'
  | 'idempotency_conflict'

export class RsseError extends Error {
  constructor(
    message: string,
    public readonly code: SessionFailureCode,
    public readonly details?: {
      command?: PlatformCommandType
      stateBefore?: unknown
      attemptedState?: unknown
    },
  ) {
    super(message)
    this.name = 'RsseError'
  }
}
