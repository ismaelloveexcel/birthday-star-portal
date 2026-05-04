import { Pool } from 'pg'

let pool: Pool | null = null

/**
 * Returns (or lazily creates) the shared Postgres pool.
 *
 * SSL: The `connectionString` (DATABASE_URL) should include `sslmode=require`
 * when connecting to Supabase pooled endpoints. SSL mode is read from the
 * connection string itself — do not hard-code `ssl: { rejectUnauthorized }`
 * here so th