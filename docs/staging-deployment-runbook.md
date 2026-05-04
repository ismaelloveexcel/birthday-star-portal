# Staging deployment runbook (RSSE)

Practical steps to deploy RSSE to **staging** (Vercel + Supabase/Postgres) and prove the full HTTP loop before production.

## 1. Purpose

Deploy the app to a **staging** Vercel project, wire **Postgres** (Supabase recommended), apply migrations, set env vars, then prove:

**create -> join -> start -> checkpoint -> unlock -> public fulfillment blocked -> complete -> waitlist**

With `SMOKE_USE_LEMON_WEBHOOK=1`, smoke also proves **signed webhook fulfill -> webhook retry -> public fulfillment blocked**.

Use `/api/rsse/health` and `npm run smoke:rsse` as automated gates. This runbook does not replace `docs/rsse-production-readiness.md` (RSSE behavior and idempotency); it focuses on **repeatable deploy steps**.

## 2. Prerequisites

| Requirement | Notes |
|-------------|--------|
| GitHub access | Repo pushed; Vercel connected to the branch you deploy (often `main`). |
| Vercel project | Staging project or Preview env with production-like env vars. |
| Supabase (or Postgres) | Empty DB or dedicated staging DB; not shared with untrusted data if you can avoid it. |
| Node **20** | `package.json` has `"engines": { "node": ">=20 <21" }`. Use `nvm`, `fnm`, or Volta on macOS/Linux; on Windows use the Node 20 LTS installer or `nvm-windows`. |

PowerShell is used below. On macOS/Linux, translate ` $env:VAR='value'` to `export VAR=value`.

## 3. Supabase setup

1. **Create a project** in [Supabase](https://supabase.com) (or use an existing staging Postgres).
2. **Connection string (serverless)**  
   Prefer the **pooled** URI for serverless (Vercel): often port **6543** and query params such as `?pgbouncer=true` when the host documents them. Use the **direct** URI only if your host/runbook says so (migrations, long sessions). Copy the URI from **Project Settings → Database**; never commit it to git.
3. **Apply migrations in order** (SQL editor, `psql`, or Supabase migration runner):

   - `db/migrations/001_rsse_foundation.sql`
   - `db/migrations/002_rsse_idempotency_and_seed.sql`

4. **Confirm seed** — `experience_types` must include a row with `id = 'placeholder'`:

   ```sql
   SELECT id, name, status FROM experience_types WHERE id = 'placeholder';
   ```

   Expect one row (seeded by `002_rsse_idempotency_and_seed.sql`).

## 4. Vercel environment variables

### Required (staging should mirror production constraints)

| Variable | Role |
|----------|------|
| `DATABASE_URL` | Postgres connection URI for RSSE persistence. |
| `NEXT_PUBLIC_BASE_URL` | Public origin of the deployed site (no secrets). |
| `NEXT_PUBLIC_CHECKOUT_URL` | Checkout URL used by unlock flow; must be non-empty and not `#` in production builds. |

### Recommended

| Variable | Role |
|----------|------|
| `LEMON_SQUEEZY_WEBHOOK_SECRET` | Verifies Lemon Squeezy webhook `X-Signature`. In **production** `NODE_ENV`, the webhook route returns **503** if unset. |

### Smoke harness only (local shell, not required on Vercel)

| Variable | Role |
|----------|------|
| `SMOKE_BASE_URL` | Origin for `npm run smoke:rsse` when not using default `http://localhost:3000`. |
| `SMOKE_USE_LEMON_WEBHOOK` | Optional; set with secret to exercise signed webhook path in smoke. |

### Security warnings

- **Do not** put secrets in `NEXT_PUBLIC_*` variables — they are exposed to the browser bundle.
- **`LEMON_SQUEEZY_WEBHOOK_SECRET`** must stay **server-only** (Vercel “Encrypted” / not prefixed with `NEXT_PUBLIC_`).

## 5. Local preflight

From the repo root (`birthday-star-portal/`):

```powershell
npm install
npm run test
npm run verify:env
```

Production-style build (config guards need real-looking public URLs):

```powershell
$env:NEXT_PUBLIC_BASE_URL='https://example.com'
$env:NEXT_PUBLIC_CHECKOUT_URL='https://payhip.com/b/smoke-test'
npm run build
```

Unset the placeholders afterward if they are not your real staging values.

## 6. Database verification

Point `DATABASE_URL` at the **same** database Vercel will use, then:

```powershell
$env:DATABASE_URL='postgres://...'
npm run verify:db
```

Expect exit code **0** and output containing `verify-rsse-db: OK`.  
This script is **read-only** (checks tables, indexes, placeholder row); it does **not** apply migrations.

## 7. Deploy

1. Commit and **push** to the branch Vercel builds (e.g. `main`).
2. Confirm a **green** deployment in the Vercel dashboard.
3. Note the **deployment URL** (Production or Preview), e.g. `https://birthday-star-portal-xxx.vercel.app`.

Set Vercel **Environment Variables** for that project (Preview/Production as appropriate) **before** relying on unlock/webhooks in that environment.

## 8. Health check

Open or `curl`:

```text
https://your-staging-url.example/api/rsse/health
```

**Expected (healthy staging with Postgres):**

- HTTP **200**
- JSON includes:
  - `"ok": true`
  - `"persistence": "postgres"`
  - `"databaseConfigured": true`
  - `"databaseReachable": true`

If `ok` is false or status is **503**, use section 10 before changing application code.

## 9. Smoke test

With the staging app **running** (deployed — no local server needed if URL is public):

```powershell
$env:SMOKE_BASE_URL='https://your-staging-url.example'
npm run smoke:rsse
```

**Expected:** the script completes, confirms public fulfillment commands are rejected, and the final line is:

```text
RSSE smoke OK
```

Smoke requires `/api/rsse/health` to report `persistence: "postgres"`. For local smoke, set `DATABASE_URL` and restart the app before running `npm run smoke:rsse`.

Optional webhook path (requires `LEMON_SQUEEZY_WEBHOOK_SECRET` in the shell matching the deployed project if the smoke hits real signature verification — follow `docs/rsse-production-readiness.md` for details):

```powershell
$env:SMOKE_USE_LEMON_WEBHOOK='1'
$env:LEMON_SQUEEZY_WEBHOOK_SECRET='your-test-secret'
npm run smoke:rsse
```

Webhook smoke proves fulfillment and retry through `/api/webhooks/lemon-squeezy`; the public `/api/sessions/command` path must still reject fulfillment payloads.

## 10. Failure guide

| Symptom | Likely cause | What to do |
|--------|----------------|------------|
| `DATABASE_URL is required` (runtime or verify) | Var missing in Vercel or local shell | Set `DATABASE_URL` in Vercel; redeploy. |
| Health: `databaseReachable: false` | Wrong URI, firewall, pooler params, or DB down | Test URI with `psql` or Supabase “SQL”; check pooler vs direct; see Supabase status. |
| Health: `checkoutConfigured: false` or unlock **503** `checkout_misconfigured` | `NEXT_PUBLIC_CHECKOUT_URL` missing or `#` | Set a real checkout URL in Vercel; rebuild. |
| `verify:db` fails on `platform_idempotency` | Migration **002** not applied | Run `002_rsse_idempotency_and_seed.sql` after **001**. |
| Smoke: stale sequence / sequence mismatch | Client sent `lastSeenSequenceNumber` behind server | Re-run smoke from clean state; ensure no manual DB edits mid-flow. |
| Webhook **401** `invalid_signature` | Body altered, wrong secret, or wrong signing | Match `LEMON_SQUEEZY_WEBHOOK_SECRET` to Lemon dashboard; raw body must be verified as received. |
| `verify:env` **ERROR** in production mode | Missing required var with `NODE_ENV=production` | Set required vars; see section 4. |

## 11. Rollback

- **Application:** In Vercel → **Deployments** → select last known-good deployment → **Promote to Production** (or assign Preview alias). Fastest fix for a bad release.
- **Database:** Avoid **dropping** applied migrations in shared environments. Prefer **forward** migrations (new SQL file) for schema fixes. Rolling back **data** is a separate ops decision.

## 12. Sign-off checklist

Use this before calling staging “RSSE-ready”:

- [ ] Supabase (or Postgres) project created; pooled `DATABASE_URL` chosen for Vercel if documented by host.
- [ ] `001_rsse_foundation.sql` applied.
- [ ] `002_rsse_idempotency_and_seed.sql` applied.
- [ ] `experience_types` contains `placeholder` row.
- [ ] Vercel: `DATABASE_URL`, `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_CHECKOUT_URL` set.
- [ ] Vercel: `LEMON_SQUEEZY_WEBHOOK_SECRET` set if webhooks are tested in staging.
- [ ] No secrets in `NEXT_PUBLIC_*`.
- [ ] `npm run test` passes locally.
- [ ] `npm run verify:env` passes (use production strictness when simulating prod: `$env:NODE_ENV='production'` before verify if you need that check).
- [ ] `npm run verify:db` passes with staging `DATABASE_URL`.
- [ ] Green Vercel deploy; URL recorded.
- [ ] `GET /api/rsse/health` returns `ok: true`, `persistence: "postgres"`, `databaseReachable: true`.
- [ ] `npm run smoke:rsse` with `SMOKE_BASE_URL` set to staging ends with `RSSE smoke OK` and public fulfillment blocked.
- [ ] Optional webhook smoke ends with `RSSE smoke OK` and proves signed fulfillment retry.

---

**Next step after sign-off:** build the first **premium experience** product path, not more RSSE infrastructure, unless a blocker appears in staging.
