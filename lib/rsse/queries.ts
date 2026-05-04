import type { SessionResultRow } from './contracts'
import { getRssePersistence } from './persistence/factory'

export async function findSessionResultByPublicSlug(
  slug: string,
): Promise<SessionResultRow | null> {
  return getRssePersistence().findSessionResultByPublicSlug(slug)
}

export async function findLatestSessionResultBySessionId(
  sessionId: string,
): Promise<SessionResultRow | null> {
  return getRssePersistence().findLatestSessionResultBySessionId(sessionId)
}
