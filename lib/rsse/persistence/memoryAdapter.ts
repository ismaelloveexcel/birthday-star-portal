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
import type { RsseMemoryStore } from '../memoryPersistence'
import { getRsseStore, withRsseTransaction } from '../memoryPersistence'
import { reconcileCachedStatus } from '../snapshots'
import type { RssePersistence, RsseTransaction } from './types'

export class MemoryRsseTransaction implements RsseTransaction {
  constructor(private readonly store: RsseMemoryStore) {}

  async lockSessionForWrite(sessionId: string): Promise<void> {
    void sessionId
  }

  async getLatestSequenceNumber(sessionId: string): Promise<number> {
    let max = 0
    for (const ev of this.store.sessionEvents.values()) {
      if (ev.sessionId === sessionId && ev.sequenceNumber > max) max = ev.sequenceNumber
    }
    return max
  }

  async getIdempotencyResponse(cacheKey: string): Promise<PlatformResponse | null> {
    return this.store.idempotencyCache.get(cacheKey) ?? null
  }

  async setIdempotencyResponse(
    cacheKey: string,
    response: PlatformResponse,
  ): Promise<void> {
    this.store.idempotencyCache.set(cacheKey, response)
  }

  async findEventBySessionIdempotency(
    sessionId: string,
    idempotencyKey: string,
  ): Promise<SessionEvent | null> {
    for (const e of this.store.sessionEvents.values()) {
      if (
        e.sessionId === sessionId &&
        e.idempotencyKey === idempotencyKey
      ) {
        return e
      }
    }
    return null
  }

  async loadRuntime(sessionId: string): Promise<SessionRuntimeState | null> {
    const session = this.store.socialSessions.get(sessionId)
    if (!session) return null
    const snap = this.store.sessionSnapshots.get(sessionId) ?? null
    if (!snap) return null
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

  async loadPlayers(sessionId: string): Promise<SessionPlayer[]> {
    return [...this.store.sessionPlayers.values()].filter(
      (p) => p.sessionId === sessionId,
    )
  }

  async loadEventsOrdered(sessionId: string): Promise<SessionEvent[]> {
    return [...this.store.sessionEvents.values()]
      .filter((e) => e.sessionId === sessionId)
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
  }

  async isShortCodeTaken(shortCode: string): Promise<boolean> {
    return this.store.shortCodeIndex.has(shortCode.toLowerCase())
  }

  async insertSocialSession(s: SocialSession): Promise<void> {
    this.store.socialSessions.set(s.id, s)
  }

  async updateSocialSession(s: SocialSession): Promise<void> {
    this.store.socialSessions.set(s.id, s)
  }

  async upsertSnapshot(snap: SessionStateSnapshot): Promise<void> {
    this.store.sessionSnapshots.set(snap.sessionId, snap)
  }

  async insertEvent(ev: SessionEvent): Promise<void> {
    this.store.sessionEvents.set(ev.id, ev)
  }

  async upsertPlayer(pl: SessionPlayer): Promise<void> {
    this.store.sessionPlayers.set(pl.id, pl)
  }

  async insertSessionResult(row: SessionResultRow): Promise<void> {
    this.store.sessionResults.set(row.publicSlug, row)
  }

  async insertWaitlist(row: WaitlistRow): Promise<void> {
    this.store.waitlist.set(row.id, row)
  }

  async findEntitlementByProviderOrderId(
    providerOrderId: string,
  ): Promise<Entitlement | null> {
    for (const ex of this.store.entitlements.values()) {
      if (ex.providerOrderId === providerOrderId) return ex
    }
    return null
  }

  async findEntitlementByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<Entitlement | null> {
    for (const ex of this.store.entitlements.values()) {
      if (ex.idempotencyKey === idempotencyKey) return ex
    }
    return null
  }

  async insertEntitlement(row: Entitlement): Promise<void> {
    for (const ex of this.store.entitlements.values()) {
      if (row.providerOrderId && ex.providerOrderId === row.providerOrderId) {
        if (ex.sessionId !== row.sessionId) {
          throw new RsseError(
            'Entitlement provider_order_id already recorded for another session',
            'entitlement_conflict',
          )
        }
        return
      }
      if (row.idempotencyKey && ex.idempotencyKey === row.idempotencyKey) {
        if (ex.sessionId !== row.sessionId) {
          throw new RsseError(
            'Entitlement idempotency_key already recorded for another session',
            'entitlement_conflict',
          )
        }
        return
      }
    }
    this.store.entitlements.set(row.id, row)
  }

  async registerShortCodeIndex(
    shortCode: string,
    sessionId: string,
  ): Promise<void> {
    this.store.shortCodeIndex.set(shortCode.toLowerCase(), sessionId)
  }
}

export function createMemoryPersistence(): RssePersistence {
  return {
    withTransaction<T>(fn: (tx: RsseTransaction) => Promise<T>): Promise<T> {
      return withRsseTransaction(async () => {
        const tx = new MemoryRsseTransaction(getRsseStore())
        return fn(tx)
      })
    },
    async resolveShortCodeToSessionId(shortCode: string): Promise<string | null> {
      return getRsseStore().shortCodeIndex.get(shortCode.toLowerCase()) ?? null
    },
    async loadRuntime(sessionId: string): Promise<SessionRuntimeState | null> {
      const tx = new MemoryRsseTransaction(getRsseStore())
      return tx.loadRuntime(sessionId)
    },
    async findSessionResultByPublicSlug(
      slug: string,
    ): Promise<SessionResultRow | null> {
      return getRsseStore().sessionResults.get(slug) ?? null
    },
    async findLatestSessionResultBySessionId(
      sessionId: string,
    ): Promise<SessionResultRow | null> {
      const rows = [...getRsseStore().sessionResults.values()].filter(
        (r) => r.sessionId === sessionId,
      )
      if (rows.length === 0) return null
      rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      return rows[0] ?? null
    },
    async insertWaitlistGlobal(row: WaitlistRow): Promise<void> {
      getRsseStore().waitlist.set(row.id, row)
    },
    async readEventsOrdered(sessionId: string): Promise<SessionEvent[]> {
      const tx = new MemoryRsseTransaction(getRsseStore())
      return tx.loadEventsOrdered(sessionId)
    },
    async readEventsAfterSequence(
      sessionId: string,
      afterSequence: number,
    ): Promise<SessionEvent[]> {
      const tx = new MemoryRsseTransaction(getRsseStore())
      const ordered = await tx.loadEventsOrdered(sessionId)
      return ordered.filter((e) => e.sequenceNumber > afterSequence)
    },
  }
}
