/**
 * Read-only RSSE schema verification for Postgres/Supabase.
 * Requires DATABASE_URL. Does not create or alter tables.
 */
import pg from 'pg'

const REQUIRED_TABLES = [
  'experience_types',
  'social_sessions',
  'session_players',
  'session_events',
  'session_state_snapshots',
  'entitlements',
  'session_results',
  'waitlist',
  'platform_idempotency',
]

const REQUIRED_INDEXES = [
  'session_events_session_sequence_idx',
  'session_events_idempotency_idx',
  'session_state_snapshots_session_id_idx',
  'entitlements_idempotency_idx',
]

/** Unique constraints implemented as indexes in Postgres (pg_indexes). */
const REQUIRED_UNIQUE_INDEXES = [
  'social_sessions_short_code_key',
  'entitlements_provider_order_id_key',
  'session_results_public_slug_key',
]

function fail(msg) {
  console.error(`verify-rsse-db: ${msg}`)
  process.exit(1)
}

async function main() {
  const url = process.env.DATABASE_URL?.trim()
  if (!url) {
    fail('DATABASE_URL is required.')
  }

  const client = new pg.Client({ connectionString: url })
  await client.connect()

  try {
    for (const table of REQUIRED_TABLES) {
      const r = await client.query(
        `SELECT 1 FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = $1`,
        [table],
      )
      if (r.rowCount === 0) {
        fail(`missing table: public.${table}`)
      }
    }

    const idx = await client.query(
      `SELECT indexname FROM pg_indexes WHERE schemaname = 'public'`,
    )
    const names = new Set(idx.rows.map((row) => row.indexname))

    for (const name of REQUIRED_INDEXES) {
      if (!names.has(name)) {
        fail(`missing index: ${name}`)
      }
    }
    for (const name of REQUIRED_UNIQUE_INDEXES) {
      if (!names.has(name)) {
        fail(`missing unique index (constraint): ${name}`)
      }
    }

    const ph = await client.query(
      `SELECT id, name FROM experience_types WHERE id = $1`,
      ['placeholder'],
    )
    if (ph.rowCount === 0) {
      fail("missing experience_types row id = 'placeholder' (run migration 002 seed)")
    }

    console.log('verify-rsse-db: OK')
    console.log(`  tables: ${REQUIRED_TABLES.length} present`)
    console.log(
      `  indexes: ${REQUIRED_INDEXES.length + REQUIRED_UNIQUE_INDEXES.length} RSSE uniqueness checks present`,
    )
    console.log(`  seed: placeholder experience_types row present (${ph.rows[0].name})`)
  } finally {
    await client.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
