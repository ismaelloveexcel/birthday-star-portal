/**
 * Read-only RSSE schema verification for Postgres/Supabase.
 * Requires DATABASE_URL. Does not create or alter tables.
 *
 * Checks:
 *   - Required tables exist
 *   - Required indexes and unique constraints exist
 *   - Critical NOT NULL columns are present on key tables
 *   - Foreign keys for session_events.session_id and entitlements.session_id
 *   - Placeholder seed row exists in experience_types
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

/**
 * Columns that must be NOT NULL in their respective tables.
 * [table, column]
 */
const REQUIRED_NOT_NULL_COLUMNS = [
  // session_events -- idempotency and ordering columns must never be nullable
  ['session_events', 'session_id'],
  ['session_events', 'event_type'],
  ['session_events', 'sequence_number'],
  ['session_events', 'payload'],
  // social_sessions -- core status columns
  ['social_sessions', 'short_code'],
  ['social_sessions', 'status'],
  ['social_sessions', 'is_unlocked'],
  // session_state_snapshots -- state must never be null
  ['session_state_snapshots', 'session_id'],
  ['session_state_snapshots', 'state'],
  ['session_state_snapshots', 'sequence_number'],
  // entitlements
  ['entitlements', 'session_id'],
  ['entitlements', 'type'],
  // platform_idempotency
  ['platform_idempotency', 'response_json'],
]

/**
 * Foreign keys that must exist.
 * [table, column, referenced_table, referenced_column]
 */
const REQUIRED_FOREIGN_KEYS = [
  ['session_events', 'session_id', 'social_sessions', 'id'],
  ['entitlements', 'session_id', 'social_sessions', 'id'],
]

function fail(msg) {
  console.error('verify-rsse-db: FAIL -- ' + msg)
  process.exit(1)
}

function warn(msg) {
  console.warn('verify-rsse-db: WARN -- ' + msg)
}

async function main() {
  const url = process.env.DATABASE_URL?.trim()
  if (!url) {
    fail('DATABASE_URL is required.')
  }

  const client = new pg.Client({ connectionString: url })
  await client.connect()

  try {
    // 1. Tables
    for (const table of REQUIRED_TABLES) {
      const r = await client.query(
        `SELECT 1 FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = $1`,
        [table],
      )
      if (r.rowCount === 0) {
        fail('missing table: public.' + table)
      }
    }
    console.log('  tables: ' + REQUIRED_TABLES.length + ' present')

    // 2. Indexes
    const idx = await client.query(
      `SELECT indexname FROM pg_indexes WHERE schemaname = 'public'`,
    )
    const idxNames = new Set(idx.rows.map((row) => row.indexname))

    for (const name of REQUIRED_INDEXES) {
      if (!idxNames.has(name)) {
        fail('missing index: ' + name)
      }
    }
    for (const name of REQUIRED_UNIQUE_INDEXES) {
      if (!idxNames.has(name)) {
        fail('missing unique index (constraint): ' + name)
      }
    }
    console.log(
      '  indexes: ' + (REQUIRED_INDEXES.length + REQUIRED_UNIQUE_INDEXES.length) + ' present',
    )

    // 3. NOT NULL columns
    let notNullPassed = 0
    for (const [table, column] of REQUIRED_NOT_NULL_COLUMNS) {
      const r = await client.query(
        `SELECT is_nullable
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name   = $1
           AND column_name  = $2`,
        [table, column],
      )
      if (r.rowCount === 0) {
        fail('column not found: public.' + table + '.' + column)
      }
      const nullable = r.rows[0].is_nullable === 'YES'
      if (nullable) {
        fail('column must be NOT NULL: public.' + table + '.' + column)
      }
      notNullPassed++
    }
    console.log('  not-null constraints: ' + notNullPassed + ' checked and present')

    // 4. Foreign keys
    let fkPassed = 0
    for (const [table, column, refTable, refColumn] of REQUIRED_FOREIGN_KEYS) {
      const r = await client.query(
        `SELECT 1
         FROM information_schema.referential_constraints rc
         JOIN information_schema.key_column_usage kcu
           ON kcu.constraint_name = rc.constraint_name
          AND kcu.constraint_schema = rc.constraint_schema
         JOIN information_schema.key_column_usage kcu2
           ON kcu2.constraint_name = rc.unique_constraint_name
          AND kcu2.constraint_schema = rc.unique_constraint_schema
          AND kcu2.ordinal_position = kcu.position_in_unique_constraint
         WHERE kcu.table_schema  = 'public'
           AND kcu.table_name    = $1
           AND kcu.column_name   = $2
           AND kcu2.table_name   = $3
           AND kcu2.column_name  = $4`,
        [table, column, refTable, refColumn],
      )
      if (r.rowCount === 0) {
        const r2 = await client.query(
          `SELECT 1
           FROM pg_constraint c
           JOIN pg_class t  ON t.oid  = c.conrelid
           JOIN pg_class ft ON ft.oid = c.confrelid
           JOIN pg_attribute a  ON a.attrelid  = t.oid  AND a.attnum = ANY(c.conkey)
           JOIN pg_attribute fa ON fa.attrelid = ft.oid AND fa.attnum = ANY(c.confkey)
           WHERE c.contype = 'f'
             AND t.relname   = $1
             AND a.attname   = $2
             AND ft.relname  = $3
             AND fa.attname  = $4`,
          [table, column, refTable, refColumn],
        )
        if (r2.rowCount === 0) {
          warn('foreign key not found: ' + table + '.' + column + ' -> ' + refTable + '.' + refColumn)
        } else {
          fkPassed++
        }
      } else {
        fkPassed++
      }
    }
    console.log(
      '  foreign keys: ' + fkPassed + '/' + REQUIRED_FOREIGN_KEYS.length + ' confirmed',
    )

    // 5. Seed
    const ph = await client.query(
      `SELECT id, name FROM experience_types WHERE id = $1`,
      ['placeholder'],
    )
    if (ph.rowCount === 0) {
      fail("missing experience_types row id = 'placeholder' (run migration 002 seed)")
    }
    console.log('  seed: placeholder experience_types row present (' + ph.rows[0].name + ')')

    console.log('verify-rsse-db: OK')
  } finally {
    await client.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
