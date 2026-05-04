import { getRssePersistenceMode } from './persistence/factory'
import { configuredCheckoutUrl } from './unlockCheckout'

export type RsseHealthBody = {
  ok: boolean
  service: 'rsse'
  persistence: 'postgres' | 'memory'
  production: boolean
  databaseConfigured: boolean
  checkoutConfigured: boolean
  webhookSecretConfigured: boolean
  /** `true` when ping succeeded, `false` when configured but ping failed, `null` when not attempted */
  databaseReachable: boolean | null
  timestamp: string
}

async function pingDatabase(): Promise<boolean> {
  const url = process.env.DATABASE_URL?.trim()
  if (!url) return false
  const { getPgPool } = await import('./persistence/pgPool')
  const pool = getPgPool(url)
  const r = await pool.query('SELECT 1 AS ok')
  return (r.rowCount ?? 0) > 0
}

/**
 * Read-only RSSE health snapshot for `/api/rsse/health`. Does not mutate session data.
 * Does not expose env values or connection strings.
 */
export async function computeRsseHealth(): Promise<{
  httpStatus: number
  body: RsseHealthBody
}> {
  const production = process.env.NODE_ENV === 'production'
  const databaseConfigured = Boolean(process.env.DATABASE_URL?.trim())
  const checkoutConfigured = Boolean(configuredCheckoutUrl())
  const webhookSecretConfigured = Boolean(
    process.env.LEMON_SQUEEZY_WEBHOOK_SECRET?.trim(),
  )
  const persistence = getRssePersistenceMode()

  let databaseReachable: boolean | null = null
  if (databaseConfigured) {
    try {
      databaseReachable = await pingDatabase()
    } catch {
      databaseReachable = false
    }
  }

  if (production && !databaseConfigured) {
    return {
      httpStatus: 503,
      body: {
        ok: false,
        service: 'rsse',
        persistence: 'memory',
        production,
        databaseConfigured: false,
        checkoutConfigured,
        webhookSecretConfigured,
        databaseReachable: null,
        timestamp: new Date().toISOString(),
      },
    }
  }

  const ok =
    !(production && !checkoutConfigured) &&
    (databaseConfigured ? databaseReachable === true : true)

  return {
    httpStatus: ok ? 200 : 503,
    body: {
      ok,
      service: 'rsse',
      persistence,
      production,
      databaseConfigured,
      checkoutConfigured,
      webhookSecretConfigured,
      databaseReachable,
      timestamp: new Date().toISOString(),
    },
  }
}
