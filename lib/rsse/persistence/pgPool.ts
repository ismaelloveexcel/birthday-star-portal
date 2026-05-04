import { Pool } from 'pg'

let pool: Pool | null = null

export function getPgPool(connectionString: string): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30_000,
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
