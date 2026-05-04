# RSSE production readiness

Practical checklist for deploying the Birthday Star Portal RSSE layer against Postgres (for example Supabase).

## Environment variables

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | **Yes** in production | Postgres connection URI. `getRssePersistence()` throws in production if unset. Prefer the pooler URL for serverless (for example port `6543`, `?pgbouncer=true`) when applicable. |
| `NEXT_PUBLIC_BASE_URL` | Yes for share links / summaries | Public site origin, no trailing slash issues handled in code where relevant. |
| `NEXT_PUBLIC_CHECKOUT_URL` | **Yes in production** for `/api/sessions/unlock` | Without it, production returns **503** `checkout_misconfigured`. Non-production may use a placeholder URL. |
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
npm run verify:env
```

`verify:env` checks RSSE-related deployment variables (see script output). In `NODE_ENV=production`, missing `DATABASE_URL`, `NEXT_PUBLIC_BASE_URL`, or `NEXT_PUBLIC_CHECKOUT_URL` exits non-zero.

Production-style Next build with placeholder public URLs:

```powershell
$env:NEXT_PUBLIC_BASE_URL='https://example.com'; $env:NEXT_PUBLIC_CHECKOUT_URL='https://payhip.com/b/smoke-test'; npm run build
```

Database schema smoke (only when `DATABASE_URL` is set):

```powershell
npm run verify:db
```

## Deployment verification order

Use this sequence after configuring Supabase (Postgres) and Vercel (or your host):

1. **Set environment variables** on the host (Vercel project / runtime): `DATABASE_URL`, `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_CHECKOUT_URL`, and optionally `LEMON_SQUEEZY_WEBHOOK_SECRET`, `SMOKE_BASE_URL`.
2. **Apply migrations** on the target database (Supabase SQL editor, `psql`, or your runner), in order:
   - `db/migrations/001_rsse_foundation.sql`
   - `db/migrations/002_rsse_idempotency_and_seed.sql`
3. **From your machine** (with `DATABASE_URL` pointing at that DB when running DB checks):

   ```powershell
   npm run verify:env
   npm run verify:db
   ```

4. **Deploy** the app.
5. **Open** `https://<your-host>/api/rsse/health` — JSON should show `ok: true` when the stack is healthy.
6. **Run RSSE smoke** against the deployed origin:

   ```powershell
   $env:SMOKE_BASE_URL='https://your-staging-url.example'; npm run smoke:rsse
   ```

### What good looks like

- **`/api/rsse/health`** — `ok: true`, `persistence: "postgres"`, `databaseReachable: true` (when DB is configured and reachable).
- **`npm run verify:db`** — exits 0 and prints `verify-rsse-db: OK`.
- **`npm run smoke:rsse`** — ends with `RSSE smoke OK`.

## RSSE smoke test

After the app is running, hit the real HTTP APIs in order (create → join → start → checkpoint → unlock → fulfillment → dedupe → complete → lookup → waitlist).

Local (terminal 1):

```powershell
npm run dev
```

Terminal 2:

```powershell
npm run smoke:rsse
```

Optional base URL (defaults to `http://localhost:3000`):

```powershell
$env:SMOKE_BASE_URL='http://127.0.0.1:3000'; npm run smoke:rsse
```

Deployed or staging (server must expose the same routes and env; production needs checkout + DB configured):

```powershell
$env:SMOKE_BASE_URL='https://your-staging-url.example'; npm run smoke:rsse
```

**Optional webhook mode** (signed `order_paid` instead of raw command for the first fulfillment):

```powershell
$env:SMOKE_USE_LEMON_WEBHOOK='1'
$env:LEMON_SQUEEZY_WEBHOOK_SECRET='your-test-secret'
npm run smoke:rsse
```

The script exits non-zero on the first failed step. It does not print secrets.

## Unlock / payment idempotency

- **`provider_order_id`** on `entitlements` is globally unique: one paid order maps to at most one fulfillment row.
- **Same session, same order**: duplicate webhook or client retries (including different per-command `idempotencyKey` values) do **not** append another `session_unlocked` event; `applyPlatformCommand` returns the current runtime with an empty `events` array and caches the platform idempotency response.
- **Cross-session reuse** of the same provider order id raises **`RsseError` / `entitlement_conflict`** (mis-routed webhook or abuse).
- **Webhooks** should call `applyPlatformCommand` only; use a **stable** fulfillment idempotency key derived from the provider order id (see `lemonFulfillmentIdempotencyKey` in `lib/rsse/lemonSqueezyWebhook.ts`).
- **`LEMON_SQUEEZY_WEBHOOK_SECRET`**: in production the webhook route returns **503** if unset; when set, requests must pass **`X-Signature`** verification.

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
- **Command-level fulfillment dedupe** uses `entitlements` lookups before proposing `session_unlocked`; the event stream should stay clean for duplicate same-order retries.
- **Realtime** remains non-authoritative; snapshot + `social_sessions` are authoritative after each command.
