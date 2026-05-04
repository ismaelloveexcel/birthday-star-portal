export type ResolveUnlockCheckoutResult =
  | { ok: true; checkoutUrl: string; mode: 'checkout' | 'placeholder' }
  | { ok: false; status: number; error: string; code: string }

/**
 * Resolves checkout URL for `/api/sessions/unlock`.
 * Production requires `NEXT_PUBLIC_CHECKOUT_URL`; non-production may use a placeholder URL.
 */
export function resolveUnlockCheckoutEnv(): ResolveUnlockCheckoutResult {
  const trimmed = process.env.NEXT_PUBLIC_CHECKOUT_URL?.trim()
  const configured = Boolean(trimmed)
  if (process.env.NODE_ENV === 'production' && !configured) {
    return {
      ok: false,
      status: 503,
      error: 'Checkout URL is not configured',
      code: 'checkout_misconfigured',
    }
  }
  return {
    ok: true,
    checkoutUrl: configured ? trimmed! : 'https://example.com/checkout-placeholder',
    mode: configured ? 'checkout' : 'placeholder',
  }
}
