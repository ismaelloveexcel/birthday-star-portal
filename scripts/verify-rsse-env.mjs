/**
 * RSSE deployment environment verifier. Does NOT print secret values.
 *
 * Profile detection order:
 *   1. RSSE_ENV
 *   2. VERCEL_ENV  (Vercel injects "production" | "preview" | "development")
 *   3. NODE_ENV
 *
 * Profiles:
 *   production              → all vars required; webhook secret is ERROR if missing
 *   staging / preview       → all vars required; webhook secret is WARN if missing
 *   development / (other)   → vars optional; missing items are WARN only
 */

function detectProfile() {
  const raw = (
    process.env.RSSE_ENV ??
    process.env.VERCEL_ENV ??
    process.env.NODE_ENV ??
    'development'
  ).toLowerCase()

  if (raw === 'production') return 'production'
  if (raw === 'staging' || raw === 'preview') return 'staging'
  return 'development'
}

function safeOrigin(envKey) {
  const v = process.env[envKey]?.trim()
  if (!v) return '(missing)'
  try {
    return new URL(v).origin
  } catch {
    return '(invalid URL)'
  }
}

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL?.trim())
}

function hasPublicBase() {
  return Boolean(process.env.NEXT_PUBLIC_BASE_URL?.trim())
}

function hasCheckoutUrl() {
  const v = process.env.NEXT_PUBLIC_CHECKOUT_URL?.trim()
  return Boolean(v && v !== '#')
}

function hasWebhookSecret() {
  return Boolean(process.env.LEMON_SQUEEZY_WEBHOOK_SECRET?.trim())
}

function hasSmokeBase() {
  return Boolean(process.env.SMOKE_BASE_URL?.trim())
}

function main() {
  const profile = detectProfile()
  const isProd = profile === 'production'
  const isStaging = profile === 'staging'
  const isDeployed = isProd || isStaging // staging and production both require deployed vars

  console.log(`verify-rsse-env: profile=${profile}`)

  let exitCode = 0

  const line = (status, msg) => console.log(`${status.padEnd(7)} ${msg}`)

  // --- DATABASE_URL ---
  if (hasDatabaseUrl()) {
    line('OK', 'DATABASE_URL is set (value hidden)')
  } else if (isDeployed) {
    line('ERROR', `DATABASE_URL is required in ${profile}`)
    exitCode = 1
  } else {
    line('WARN', 'DATABASE_URL unset (in-memory RSSE for local dev)')
  }

  // --- NEXT_PUBLIC_BASE_URL ---
  if (hasPublicBase()) {
    line('OK', `NEXT_PUBLIC_BASE_URL -> ${safeOrigin('NEXT_PUBLIC_BASE_URL')}`)
  } else if (isDeployed) {
    line('ERROR', `NEXT_PUBLIC_BASE_URL is required in ${profile}`)
    exitCode = 1
  } else {
    line('WARN', 'NEXT_PUBLIC_BASE_URL unset')
  }

  // --- NEXT_PUBLIC_CHECKOUT_URL ---
  if (hasCheckoutUrl()) {
    line('OK', `NEXT_PUBLIC_CHECKOUT_URL -> ${safeOrigin('NEXT_PUBLIC_CHECKOUT_URL')}`)
  } else if (isDeployed) {
    line('ERROR', `NEXT_PUBLIC_CHECKOUT_URL is required in ${profile} (non-empty, not #)`)
    exitCode = 1
  } else {
    line('WARN', 'NEXT_PUBLIC_CHECKOUT_URL unset or placeholder #')
  }

  // --- LEMON_SQUEEZY_WEBHOOK_SECRET ---
  if (hasWebhookSecret()) {
    line('OK', 'LEMON_SQUEEZY_WEBHOOK_SECRET is set (value hidden)')
  } else if (isProd) {
    line('ERROR', 'LEMON_SQUEEZY_WEBHOOK_SECRET is required in production')
    exitCode = 1
  } else if (isStaging) {
    line('WARN', 'LEMON_SQUEEZY_WEBHOOK_SECRET unset in staging (webhook smoke tests will be skipped)')
  } else {
    line('WARN', 'LEMON_SQUEEZY_WEBHOOK_SECRET unset (webhooks unsigned / disabled in dev)')
  }

  // --- SMOKE_BASE_URL (informational) ---
  if (hasSmokeBase()) {
    line('OK', `SMOKE_BASE_URL -> ${safeOrigin('SMOKE_BASE_URL')}`)
  } else {
    line('WARN', 'SMOKE_BASE_URL unset (smoke:rsse defaults to http://localhost:3000)')
  }

  console.log(
    'Note: NEXT_PUBLIC_* values are public in the browser. LEMON_SQUEEZY_WEBHOOK_SECRET must stay server-only (never NEXT_PUBLIC_*).',
  )

  if (exitCode === 0) {
    console.log('verify-rsse-env: OK')
  } else {
    console.error('verify-rsse-env: FAILED (fix errors above)')
  }
  process.exit(exitCode)
}

main()
