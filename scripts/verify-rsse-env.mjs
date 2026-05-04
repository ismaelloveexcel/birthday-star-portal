/**
 * RSSE deployment environment checks. Does not print secret values.
 *
 * Production (NODE_ENV=production):
 *   Required: DATABASE_URL, NEXT_PUBLIC_BASE_URL, NEXT_PUBLIC_CHECKOUT_URL
 *   Optional: LEMON_SQUEEZY_WEBHOOK_SECRET, SMOKE_BASE_URL (warnings only)
 *
 * Non-production: missing DATABASE_URL is a warning; public URLs warn if unset.
 */

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
  const production = process.env.NODE_ENV === 'production'
  console.log(`verify-rsse-env: NODE_ENV=${production ? 'production' : process.env.NODE_ENV || 'development'}`)

  let exitCode = 0

  const line = (status, msg) => console.log(`${status.padEnd(7)} ${msg}`)

  if (hasDatabaseUrl()) {
    line('OK', 'DATABASE_URL is set (value hidden)')
  } else if (production) {
    line('ERROR', 'DATABASE_URL is required in production')
    exitCode = 1
  } else {
    line('WARN', 'DATABASE_URL unset (in-memory RSSE for local dev)')
  }

  if (hasPublicBase()) {
    line('OK', `NEXT_PUBLIC_BASE_URL -> ${safeOrigin('NEXT_PUBLIC_BASE_URL')}`)
  } else if (production) {
    line('ERROR', 'NEXT_PUBLIC_BASE_URL is required in production')
    exitCode = 1
  } else {
    line('WARN', 'NEXT_PUBLIC_BASE_URL unset')
  }

  if (hasCheckoutUrl()) {
    line('OK', `NEXT_PUBLIC_CHECKOUT_URL -> ${safeOrigin('NEXT_PUBLIC_CHECKOUT_URL')}`)
  } else if (production) {
    line('ERROR', 'NEXT_PUBLIC_CHECKOUT_URL is required in production (non-empty, not #)')
    exitCode = 1
  } else {
    line('WARN', 'NEXT_PUBLIC_CHECKOUT_URL unset or placeholder #')
  }

  if (hasWebhookSecret()) {
    line('OK', 'LEMON_SQUEEZY_WEBHOOK_SECRET is set (value hidden)')
  } else {
    line('WARN', 'LEMON_SQUEEZY_WEBHOOK_SECRET unset (webhooks unsigned / disabled in dev)')
  }

  if (hasSmokeBase()) {
    line('OK', `SMOKE_BASE_URL -> ${safeOrigin('SMOKE_BASE_URL')}`)
  } else {
    line('WARN', 'SMOKE_BASE_URL unset (smoke:rsse defaults to http://localhost:3000)')
  }

  console.log(
    'Note: NEXT_PUBLIC_* values are public in the browser. LEMON_SQUEEZY_WEBHOOK_SECRET must stay server-only (never NEXT_PUBLIC_).',
  )

  if (exitCode === 0) {
    console.log('verify-rsse-env: OK')
  } else {
    console.error('verify-rsse-env: FAILED (fix errors above)')
  }
  process.exit(exitCode)
}

main()
