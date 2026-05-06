export type ResolveUnlockCheckoutResult =
  | { ok: true; checkoutUrl: string; mode: 'checkout' | 'placeholder' }
  | { ok: false; status: number; error: string; code: string }

export function configuredCheckoutUrl(): string | null {
  const trimmed = process.env.NEXT_PUBLIC_CHECKOUT_URL?.trim()
  if (!trimmed || trimmed === '#') return null
  return trimmed
}

export function withCheckoutSessionData(checkoutUrl: string, sessionId: string): string {
  const url = new URL(checkoutUrl)
  url.searchParams.set('checkout[custom][session_id]', sessionId)
  return url.toString()
}

/**
 * Resolves checkout URL for `/api/sessions/unlock`.
 * Production requires `NEXT_PUBLIC_CHECKOUT_URL`; non-production may use a placeholder URL.
 */
export function resolveUnlockCheckoutEnv(sessionId?: string): ResolveUnlockCheckoutResult {
  const checkoutUrl = configuredCheckoutUrl()
  if (process.env.NODE_ENV === 'production' && !checkoutUrl) {
    return {
      ok: false,
      status: 503,
      error: 'Checkout URL is not configured',
      code: 'checkout_misconfigured',
    }
  }
  const resolvedCheckoutUrl = checkoutUrl ?? 'https://example.com/checkout-placeholder'
  return {
    ok: true,
    checkoutUrl:
      sessionId && checkoutUrl
        ? withCheckoutSessionData(resolvedCheckoutUrl, sessionId)
        : resolvedCheckoutUrl,
    mode: checkoutUrl ? 'checkout' : 'placeholder',
  }
}
