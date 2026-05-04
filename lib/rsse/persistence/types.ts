import type {
  Entitlement,
  PlatformResponse,
  SessionEvent,
  SessionPlayer,
  SessionResultRow,
  SessionRuntimeState,
  SessionStateSnapshot,
  SocialSession,
  WaitlistRow,
} from '../contracts'

/**
 * Transaction-scoped RSSE persistence (single writer per command).
 * Implementations must honor Postgres SERIALIZABLE semantics via row locks where needed.
 */
export interface RsseTransaction {
  lockSessionForWrite(sessionId: string): Promise<void>

  getLatestSequenceNumber(sessionId: string): Promise<number>

  getIdempotencyResponse(cacheKey: string): Promise<PlatformResponse | null>
  setIdempotencyResponse(cacheKey: string, response: PlatformResponse): Promise<void>

  findEventBySessionIdempotency(
    sessionId: string,
    idempotencyKey: string,
  ): Promise<SessionEvent | null>

  loadRuntime(sessionId: string): Promise<SessionRuntimeState | null>
  loadPlayers(sessionId: string): Promise<SessionPlayer[]>
  loadEventsOrdered(sessionId: string): Promise<SessionEvent[]>

  isShortCodeTaken(shortCode: string): Promise<boolean>

  insertSocialSession(s: SocialSession): Promise<void>
  updateSocialSession(s: SocialSession): Promise<void>
  upsertSnapshot(snap: SessionStateSnapshot): Promise<void>
  insertEvent(ev: SessionEvent): Promise<void>
  upsertPlayer(pl: SessionPlayer): Promise<void>
  insertSessionResult(row: SessionResultRow): Promise<void>
  insertWaitlist(row: WaitlistRow): Promise<void>
  insertEntitlement(row: Entitlement): Promise<void>

  /** In-memory index only; no-op for SQL (lookup uses social_sessions.short_code). */
  registerShortCodeIndex(shortCode: string, sessionId: string): Promise<void>
}

export interface RssePersistence {
  withTransaction<T>(fn: (tx: RsseTransaction) => Promise<T>): Promise<T>

  resolveShortCodeToSessionId(shortCode: string): Promise<string | null>
  loadRuntime(sessionId: string): Promise<SessionRuntimeState | null>
  findSessionResultByPublicSlug(slug: string): Promise<SessionResultRow | null>
  findLatestSessionResultBySessionId(
    sessionId: string,
  ): Promise<SessionResultRow | null>
  insertWaitlistGlobal(row: WaitlistRow): Promise<void>

  /** Read-only: ordered events (e.g. results page). */
  readEventsOrdered(sessionId: string): Promise<SessionEvent[]>

  /** Events strictly after `afterSequence` (for rehydration / client catch-up). */
  readEventsAfterSequence(
    sessionId: string,
    afterSequence: number,
  ): Promise<SessionEvent[]>
}
