import { Pool } from 'pg'

let pool: Pool | null = null

/**
 * Returns (or lazily creates) the shared Postgres pool.
 *
 * SSL: The `connectionString` (DATABASE_URL) should include `sslmode=require`
 * when connecting to Supabase pooled endpoints. SSL mode is read from the
 * connection string itself — do not hard-code `ssl: { rejectUnauthorized }`
 * here so that local dev without SSL continues to work.
 */
export function getPgPool(connectionString: string): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30_000,
      // Fail fast if the connection cannot be established rather than hanging.
      connectionTimeoutMillis: 5_000,
    })

    // Apply a per-session statement timeout immediately after each new connection
    // is acquired so that runaway queries cannot hold the pool indefinitely.
    pool.on('connect', (client) => {
      void client.query("SET statement_timeout = '5s'").catch(() => {
        // Non-fatal: if the SET fails (e.g., READ ONLY replica) we continue
        // rather than crashing the pool.
      })
    })
  }
  return pool
}

export function resetPgPoolForTests(): void {
  if (pool) {
    void pool.end()
    pool = null
  }
}
