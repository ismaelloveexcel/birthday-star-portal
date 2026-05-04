import type { RssePersistence } from './types'
import { createMemoryPersistence } from './memoryAdapter'
import { createPostgresPersistence } from './postgresAdapter'
import { resetPgPoolForTests } from './pgPool'

let cached: RssePersistence | null = null

/**
 * RSSE persistence: Postgres when `DATABASE_URL` is set, otherwise in-memory (dev/tests).
 * Production requires `DATABASE_URL` so sessions survive restarts.
 */
export function getRssePersistence(): RssePersistence {
  if (cached) return cached
  const url = process.env.DATABASE_URL?.trim()
  if (url) {
    cached = createPostgresPersistence(url)
    return cached
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'DATABASE_URL must be set in production for RSSE session persistence.',
    )
  }
  cached = createMemoryPersistence()
  return cached
}

/** Vitest / isolated runs: reset singleton + memory store via memoryPersistence.resetRsseStore */
export function resetRssePersistenceSingleton(): void {
  cached = null
  resetPgPoolForTests()
}

export async function findSessionIdByShortCode(
  shortCode: string,
): Promise<string | null> {
  return getRssePersistence().resolveShortCodeToSessionId(shortCode)
}
