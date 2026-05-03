import { getRsseStore } from './memoryPersistence'
import type { SessionResultRow } from './contracts'

export function findSessionResultByPublicSlug(
  slug: string,
): SessionResultRow | null {
  return getRsseStore().sessionResults.get(slug) ?? null
}

export function findLatestSessionResultBySessionId(
  sessionId: string,
): SessionResultRow | null {
  const rows = [...getRsseStore().sessionResults.values()].filter(
    (r) => r.sessionId === sessionId,
  )
  if (rows.length === 0) return null
  rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return rows[0] ?? null
}
