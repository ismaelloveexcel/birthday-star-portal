import type { Pool, PoolClient } from 'pg'
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
import { computeDerivedFlags } from '../derivedFlags'
import { RsseError } from '../errors'
import { reconcileCachedStatus } from '../snapshots'
import type { RssePersistence, RsseTransaction } from './types'
import { getPgPool } from './pgPool'

function iso(v: unknown): string {
  if (v instanceof Date) return v.toISOString()
  if (typeof v === 'string') return v
  return new Date(String(v)).toISOString()
}

function mapSocialSession(r: Record<string, unknown>): SocialSession {
  return {
    id: String(r.id),
    shortCode: String(r.short_code),
    experienceTypeId: r.experience_type_id
      ? String(r.experience_type_id)
      : null,
    hostPlayerId: r.host_player_id ? String(r.host_player_id) : null,
    status: r.status as SocialSession['status'],
    title: r.title != null ? String(r.title) : null,
    maxPlayers: Number(r.max_players),
    isUnlocked: Boolean(r.is_unlocked),
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
    expiresAt: iso(r.expires_at),
  }
}

function mapPlayer(r: Record<string, unknown>): SessionPlayer {
  return {
    id: String(r.id),
    sessionId: String(r.session_id),
    displayName: String(r.display_name),
    avatarEmoji: String(r.avatar_emoji),
    role: r.role === 'host' ? 'host' : 'player',
    joinedAt: iso(r.joined_at),
    lastSeenAt: iso(r.last_seen_at),
  }
}

function mapEvent(r: Record<string, unknown>): SessionEvent {
  return {
    id: String(r.id),
    sessionId: String(r.session_id),
    playerId: r.player_id ? String(r.player_id) : null,
    eventType: r.event_type as SessionEvent['eventType'],
    payload: (r.payload as Record<string, unknown>) ?? {},
    sequenceNumber: Number(r.sequence_number),
    idempotencyKey: r.idempotency_key != null ? String(r.idempotency_key) : null,
    createdAt: iso(r.created_at),
  }
}

function mapSnapshot(r: Record<string, unknown>): SessionStateSnapshot {
  return {
    id: String(r.id),
    sessionId: String(r.session_id),
    state: (r.state as SessionStateSnapshot['state']) ?? {
      checkpointCount: 0,
      unlockCount: 0,
    },
    lastEventId: r.last_event_id ? String(r.last_event_id) : null,
    sequenceNumber: Number(r.sequence_number),
    createdAt: iso(r.created_at),
  }
}

function mapResult(r: Record<string, unknown>): SessionResultRow {
  return {
    id: String(r.id),
    sessionId: String(r.session_id),
    summary: (r.summary as Record<string, unknown>) ?? {},
    shareText: r.share_text != null ? String(r.share_text) : null,
    publicSlug: String(r.public_slug),
    createdAt: iso(r.created_at),
  }
}

export class PostgresRsseTransaction implements RsseTransaction {
  constructor(private readonly client: PoolClient) {}

  async lockSessionForWrite(sessionId: string): Promise<void> {
    const r = await this.client.query(
      `SELECT id FROM social_sessions WHERE id = $1::uuid FOR UPDATE`,
      [sessionId],
    )
    if (r.rowCount === 0) {
      throw new Error(`Session ${sessionId} not found for lock`)
    }
  }

  async getLatestSequenceNumber(sessionId: string): Promise<number> {
    const r = await this.client.query(
      `SELECT COALESCE(MAX(sequence_number), 0)::bigint AS m FROM session_events WHERE session_id = $1::uuid`,
      [sessionId],
    )
    return Number(r.rows[0]?.m ?? 0)
  }

  async getIdempotencyResponse(cacheKey: string): Promise<PlatformResponse | null> {
    const r = await this.client.query(
      `SELECT response_json FROM platform_idempotency WHERE cache_key = $1`,
      [cacheKey],
    )
    if (r.rowCount === 0) return null
    return r.rows[0]!.response_json as PlatformResponse
  }

  async setIdempotencyResponse(
    cacheKey: string,
    response: PlatformResponse,
  ): Promise<void> {
    await this.client.query(
      `INSERT INTO platform_idempotency (cache_key, response_json)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (cache_key) DO UPDATE SET response_json = EXCLUDED.response_json`,
      [cacheKey, JSON.stringify(response)],
    )
  }

  async findEventBySessionIdempotency(
    sessionId: string,
    idempotencyKey: string,
  ): Promise<SessionEvent | null> {
    const r = await this.client.query(
      `SELECT * FROM session_events WHERE session_id = $1::uuid AND idempotency_key = $2 LIMIT 1`,
      [sessionId, idempotencyKey],
    )
    if (r.rowCount === 0) return null
    return mapEvent(r.rows[0] as Record<string, unknown>)
  }

  async loadPlayers(sessionId: string): Promise<SessionPlayer[]> {
    const r = await this.client.query(
      `SELECT * FROM session_players WHERE session_id = $1::uuid ORDER BY joined_at ASC`,
      [sessionId],
    )
    return r.rows.map((row) => mapPlayer(row as Record<string, unknown>))
  }

  async loadEventsOrdered(sessionId: string): Promise<SessionEvent[]> {
    const r = await this.client.query(
      `SELECT * FROM session_events WHERE session_id = $1::uuid ORDER BY sequence_number ASC`,
      [sessionId],
    )
    return r.rows.map((row) => mapEvent(row as Record<string, unknown>))
  }

  async loadRuntime(sessionId: string): Promise<SessionRuntimeState | null> {
    const s = await this.client.query(
      `SELECT * FROM social_sessions WHERE id = $1::uuid`,
      [sessionId],
    )
    if (s.rowCount === 0) return null
    const session = mapSocialSession(s.rows[0] as Record<string, unknown>)

    const snapR = await this.client.query(
      `SELECT * FROM session_state_snapshots WHERE session_id = $1::uuid`,
      [sessionId],
    )
    if (snapR.rowCount === 0) return null
    const snap = mapSnapshot(snapR.rows[0] as Record<string, unknown>)

    const activePlayers = await this.loadPlayers(sessionId)
    const events = await this.loadEventsOrdered(sessionId)
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
    return { ...base, derivedFlags: computeDerivedFlags(base) }
  }

  async isShortCodeTaken(shortCode: string): Promise<boolean> {
    const r = await this.client.query(
      `SELECT 1 FROM social_sessions WHERE lower(short_code) = lower($1) LIMIT 1`,
      [shortCode],
    )
    return (r.rowCount ?? 0) > 0
  }

  async insertSocialSession(s: SocialSession): Promise<void> {
    await this.client.query(
      `INSERT INTO social_sessions (
        id, short_code, experience_type_id, host_player_id, status, title,
        max_players, is_unlocked, created_at, updated_at, expires_at
      ) VALUES (
        $1::uuid, $2, $3, $4::uuid, $5, $6, $7, $8, $9::timestamptz, $10::timestamptz, $11::timestamptz
      )`,
      [
        s.id,
        s.shortCode,
        s.experienceTypeId,
        s.hostPlayerId,
        s.status,
        s.title,
        s.maxPlayers,
        s.isUnlocked,
        s.createdAt,
        s.updatedAt,
        s.expiresAt,
      ],
    )
  }

  async updateSocialSession(s: SocialSession): Promise<void> {
    await this.client.query(
      `UPDATE social_sessions SET
        experience_type_id = $2,
        host_player_id = $3::uuid,
        status = $4,
        title = $5,
        max_players = $6,
        is_unlocked = $7,
        updated_at = $8::timestamptz,
        expires_at = $9::timestamptz
      WHERE id = $1::uuid`,
      [
        s.id,
        s.experienceTypeId,
        s.hostPlayerId,
        s.status,
        s.title,
        s.maxPlayers,
        s.isUnlocked,
        s.updatedAt,
        s.expiresAt,
      ],
    )
  }

  async upsertSnapshot(snap: SessionStateSnapshot): Promise<void> {
    await this.client.query(
      `INSERT INTO session_state_snapshots (id, session_id, state, last_event_id, sequence_number, created_at)
       VALUES ($1::uuid, $2::uuid, $3::jsonb, $4, $5, $6::timestamptz)
       ON CONFLICT (session_id) DO UPDATE SET
         state = EXCLUDED.state,
         last_event_id = EXCLUDED.last_event_id,
         sequence_number = EXCLUDED.sequence_number,
         created_at = EXCLUDED.created_at`,
      [
        snap.id,
        snap.sessionId,
        JSON.stringify(snap.state),
        snap.lastEventId,
        snap.sequenceNumber,
        snap.createdAt,
      ],
    )
  }

  async insertEvent(ev: SessionEvent): Promise<void> {
    await this.client.query(
      `INSERT INTO session_events (
        id, session_id, player_id, event_type, payload, sequence_number, idempotency_key, created_at
      ) VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5::jsonb, $6, $7, $8::timestamptz)`,
      [
        ev.id,
        ev.sessionId,
        ev.playerId,
        ev.eventType,
        JSON.stringify(ev.payload),
        ev.sequenceNumber,
        ev.idempotencyKey,
        ev.createdAt,
      ],
    )
  }

  async upsertPlayer(pl: SessionPlayer): Promise<void> {
    await this.client.query(
      `INSERT INTO session_players (
        id, session_id, display_name, avatar_emoji, role, joined_at, last_seen_at
      ) VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6::timestamptz, $7::timestamptz)
      ON CONFLICT (id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        avatar_emoji = EXCLUDED.avatar_emoji,
        role = EXCLUDED.role,
        last_seen_at = EXCLUDED.last_seen_at`,
      [
        pl.id,
        pl.sessionId,
        pl.displayName,
        pl.avatarEmoji,
        pl.role,
        pl.joinedAt,
        pl.lastSeenAt,
      ],
    )
  }

  async insertSessionResult(row: SessionResultRow): Promise<void> {
    await this.client.query(
      `INSERT INTO session_results (id, session_id, summary, share_text, public_slug, created_at)
       VALUES ($1::uuid, $2::uuid, $3::jsonb, $4, $5, $6::timestamptz)`,
      [
        row.id,
        row.sessionId,
        JSON.stringify(row.summary),
        row.shareText,
        row.publicSlug,
        row.createdAt,
      ],
    )
  }

  async insertWaitlist(row: WaitlistRow): Promise<void> {
    await this.client.query(
      `INSERT INTO waitlist (
        id, email, session_id, experience_type_id, category, source, interest, group_size, created_at
      ) VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9::timestamptz)`,
      [
        row.id,
        row.email,
        row.sessionId,
        row.experienceTypeId,
        row.category,
        row.source,
        row.interest,
        row.groupSize,
        row.createdAt,
      ],
    )
  }

  async insertEntitlement(row: Entitlement): Promise<void> {
    const inserted = await this.client.query(
      `INSERT INTO entitlements (
        id, session_id, experience_type_id, type, unlocked_by_player_id,
        amount_cents, provider, provider_order_id, idempotency_key, created_at
      ) VALUES (
        $1::uuid, $2::uuid, $3, $4, $5::uuid, $6, $7, $8, $9, $10::timestamptz
      )
      ON CONFLICT DO NOTHING
      RETURNING session_id`,
      [
        row.id,
        row.sessionId,
        row.experienceTypeId,
        row.type,
        row.unlockedByPlayerId,
        row.amountCents,
        row.provider,
        row.providerOrderId,
        row.idempotencyKey,
        row.createdAt,
      ],
    )
    if ((inserted.rowCount ?? 0) > 0) return

    const existing = await this.client.query(
      `SELECT session_id FROM entitlements
       WHERE ($1::text IS NOT NULL AND provider_order_id IS NOT DISTINCT FROM $1::text)
          OR ($2::text IS NOT NULL AND idempotency_key IS NOT DISTINCT FROM $2::text)`,
      [row.providerOrderId, row.idempotencyKey],
    )
    if (existing.rowCount === 0) {
      throw new RsseError(
        'Entitlement insert conflicted with an existing row',
        'entitlement_conflict',
      )
    }
    for (const ex of existing.rows) {
      if (String(ex.session_id) !== row.sessionId) {
        throw new RsseError(
          'Entitlement already recorded for a different session',
          'entitlement_conflict',
        )
      }
    }
  }

  async registerShortCodeIndex(
    _shortCode: string,
    _sessionId: string,
  ): Promise<void> {
    void _shortCode
    void _sessionId
    /* short_code is stored on social_sessions */
  }
}

export class PostgresRssePersistence implements RssePersistence {
  constructor(private readonly pool: Pool) {}

  async withTransaction<T>(
    fn: (tx: RsseTransaction) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      const tx = new PostgresRsseTransaction(client)
      const out = await fn(tx)
      await client.query('COMMIT')
      return out
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  }

  async resolveShortCodeToSessionId(
    shortCode: string,
  ): Promise<string | null> {
    const r = await this.pool.query(
      `SELECT id FROM social_sessions WHERE lower(short_code) = lower($1) LIMIT 1`,
      [shortCode],
    )
    if (r.rowCount === 0) return null
    return String(r.rows[0]!.id)
  }

  async loadRuntime(sessionId: string): Promise<SessionRuntimeState | null> {
    const client = await this.pool.connect()
    try {
      const tx = new PostgresRsseTransaction(client)
      return await tx.loadRuntime(sessionId)
    } finally {
      client.release()
    }
  }

  async findSessionResultByPublicSlug(
    slug: string,
  ): Promise<SessionResultRow | null> {
    const r = await this.pool.query(
      `SELECT * FROM session_results WHERE public_slug = $1 LIMIT 1`,
      [slug],
    )
    if (r.rowCount === 0) return null
    return mapResult(r.rows[0] as Record<string, unknown>)
  }

  async findLatestSessionResultBySessionId(
    sessionId: string,
  ): Promise<SessionResultRow | null> {
    const r = await this.pool.query(
      `SELECT * FROM session_results WHERE session_id = $1::uuid ORDER BY created_at DESC LIMIT 1`,
      [sessionId],
    )
    if (r.rowCount === 0) return null
    return mapResult(r.rows[0] as Record<string, unknown>)
  }

  async readEventsOrdered(sessionId: string): Promise<SessionEvent[]> {
    const r = await this.pool.query(
      `SELECT * FROM session_events WHERE session_id = $1::uuid ORDER BY sequence_number ASC`,
      [sessionId],
    )
    return r.rows.map((row) => mapEvent(row as Record<string, unknown>))
  }

  async readEventsAfterSequence(
    sessionId: string,
    afterSequence: number,
  ): Promise<SessionEvent[]> {
    const r = await this.pool.query(
      `SELECT * FROM session_events WHERE session_id = $1::uuid AND sequence_number > $2
       ORDER BY sequence_number ASC`,
      [sessionId, afterSequence],
    )
    return r.rows.map((row) => mapEvent(row as Record<string, unknown>))
  }

  async insertWaitlistGlobal(row: WaitlistRow): Promise<void> {
    await this.pool.query(
      `INSERT INTO waitlist (
        id, email, session_id, experience_type_id, category, source, interest, group_size, created_at
      ) VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9::timestamptz)`,
      [
        row.id,
        row.email,
        row.sessionId,
        row.experienceTypeId,
        row.category,
        row.source,
        row.interest,
        row.groupSize,
        row.createdAt,
      ],
    )
  }
}

export function createPostgresPersistence(connectionString: string): RssePersistence {
  return new PostgresRssePersistence(getPgPool(connectionString))
}
