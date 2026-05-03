import type {
  Entitlement,
  SessionEvent,
  SessionPlayer,
  SessionResultRow,
  SessionStateSnapshot,
  SocialSession,
  WaitlistRow,
} from './contracts'
import type { PlatformResponse } from './contracts'

export type ExperienceTypeRow = {
  id: string
  name: string
  status: string
  createdAt: string
}

export class RsseMemoryStore {
  experienceTypes = new Map<string, ExperienceTypeRow>()
  socialSessions = new Map<string, SocialSession>()
  /** shortCode -> sessionId */
  shortCodeIndex = new Map<string, string>()
  sessionPlayers = new Map<string, SessionPlayer>()
  sessionEvents = new Map<string, SessionEvent>()
  /** sessionId -> event ids sorted by sequence at query time */
  sessionSnapshots = new Map<string, SessionStateSnapshot>()
  entitlements = new Map<string, Entitlement>()
  sessionResults = new Map<string, SessionResultRow>()
  waitlist = new Map<string, WaitlistRow>()
  /** idempotency: composite key -> cached response JSON */
  idempotencyCache = new Map<string, PlatformResponse>()
}

let globalStore = new RsseMemoryStore()

export function getRsseStore(): RsseMemoryStore {
  return globalStore
}

export function resetRsseStore(): void {
  globalStore = new RsseMemoryStore()
  seedExperienceTypes(globalStore)
}

function seedExperienceTypes(store: RsseMemoryStore): void {
  const now = new Date().toISOString()
  store.experienceTypes.set('placeholder', {
    id: 'placeholder',
    name: 'Placeholder experience',
    status: 'active',
    createdAt: now,
  })
}

seedExperienceTypes(globalStore)

let chain: Promise<unknown> = Promise.resolve()

export async function withRsseTransaction<T>(
  fn: (store: RsseMemoryStore) => Promise<T>,
): Promise<T> {
  const run = chain.then(() => fn(globalStore))
  chain = run.catch(() => undefined)
  return run as Promise<T>
}
