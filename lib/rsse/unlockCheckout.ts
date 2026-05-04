export type ResolveUnlockCheckoutResult =
  | { ok: true; checkoutUrl: string; mode: 'checkout' | 'placeholder' }
  | { ok: false; status: number; error: string; code: string }

export function configuredCheckoutUrl(): string | null {
  const trimmed = process.env.NEXT_PUBLIC_CHECKOUT_URL?.trim()
  if (!trimmed || trimmed === '#') return null
  return trimmed
}

/**
 * Resolves checkout URL for `/api/sessions/unlock`.
 * Production requires `NEXT_PUBLIC_CHECKOUT_URL`; non-production may use a placeholder URL.
 */
export function resolveUnlockCheckoutEnv(): ResolveUnlockCheckoutResult {
  const checkoutUrl = configuredCheckoutUrl()
  if (process.env.NODE_ENV === 'production' && !checkoutUrl) {
    return {
      ok: false,
      status: 503,
      error: 'Checkout URL is not configured',
      code: 'checkout_misconfigured',
    }
  }
  return {
    ok: true,
    checkoutUrl: checkoutUrl ?? 'https://example.com/checkout-placeholder',
    mode: checkoutUrl ? 'checkout' : 'placeholder',
  }
}
