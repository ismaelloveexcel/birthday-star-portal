# RSSE production readiness

Practical checklist for deploying the Birthday Star Portal RSSE layer against Postgres (for example Supabase).

## Environment variables

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | **Yes** in production | Postgres connection URI. `getRssePersistence()` throws in production if unset. Prefer the pooler URL for serverless (for example port `6543`, `?pgbouncer=true`) when applicable. |
| `NEXT_PUBLIC_BASE_URL` | Yes for share links / summaries | Public site origin, no trailing slash issues handled in code where relevant. |
| `NEXT_PUBLIC_CHECKOUT_URL` | Yes for unlock placeholder | Checkout / pay link surfaced to clients. |
| `LEMON_SQUEEZY_WEBHOOK_SECRET` | If webhooks enabled | Verify webhook signatures; keep out of client bundles. |

RSSE behavior is unchanged when checkout/webhook vars are placeholders, but production unlock flows need real values.

## Migrations

Apply **in order**, once per environment. Do not edit already-applied migration files; add new numbered files for schema changes.

1. `db/migrations/001_rsse_foundation.sql` — core tables, uniqueness for events, entitlements, short codes, public slugs.
2. `db/migrations/002_rsse_idempotency_and_seed.sql` — `platform_idempotency` table and `experience_types` seed row `id = placeholder`.

After deploy, confirm schema:

```powershell
npm run verify:db
```

`verify:db` requires `DATABASE_URL` and performs **read-only** checks (tables, key indexes, placeholder row). It does not apply migrations.

## Commands

```powershell
npm install
npm run test
```

Production-style Next build with placeholder public URLs:

```powershell
$env:NEXT_PUBLIC_BASE_URL='https://example.com'; $env:NEXT_PUBLIC_CHECKOUT_URL='https://payhip.com/b/smoke-test'; npm run build
```

Database schema smoke (only when `DATABASE_URL` is set):

```powershell
npm run verify:db
```

## Manual smoke path (API / pages)

1. Create room (`CREATE_SESSION` via your create flow).
2. Join room (`JOIN_SESSION`).
3. Host starts (`START_SESSION`).
4. Emit checkpoint (`EMIT_EXPERIENCE_EVENT` with checkpoint payload).
5. Request unlock (`REQUEST_UNLOCK`) then fulfillment path as implemented (`EMIT_EXPERIENCE_EVENT` with `entitlementFulfillment` when testing payments).
6. Complete (`COMPLETE_SESSION`).
7. Open results for the session / public slug as implemented.
8. Submit global waitlist if testing `insertWaitlistGlobal`.

## Tests and Postgres

- Default `npm run test` does **not** require Postgres.
- `tests/rsse.postgres.integration.test.ts` runs only when `DATABASE_URL` is set. If your shell exports `DATABASE_URL` for local dev, **all** Vitest runs use the Postgres adapter (not the in-memory store); prefer unsetting `DATABASE_URL` for fast unit runs, or run only the integration file when you intend to hit a real DB.

## Known caveats

- **Global waitlist** (`insertWaitlistGlobal` without a session command) is intentionally outside `applyPlatformCommand`; session lifecycle still goes only through commands.
- **`provider_order_id`** is globally unique in `entitlements`. A conflict for a **different** session raises `RsseError` with code `entitlement_conflict` (webhook misconfiguration or fraud signal).
- **Parallel `CREATE_SESSION`** with the same idempotency key can still race without an advisory lock; rare in practice.
- **Duplicate `session_unlocked` events** can still be proposed if a client sends two different command idempotency keys for the same order id; the **entitlement row** stays idempotent; event stream may contain duplicates until command-level dedupe is tightened.
- **Realtime** remains non-authoritative; snapshot + `social_sessions` are authoritative after each command.
