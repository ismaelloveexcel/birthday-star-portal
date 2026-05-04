import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Lemon Squeezy signs the raw body with HMAC SHA256; `X-Signature` is the hex digest.
 * @see https://docs.lemonsqueezy.com/help/webhooks/signing-requests
 */
export function verifyLemonSqueezyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader) return false
  const hmac = createHmac('sha256', secret)
  hmac.update(rawBody)
  const expectedHex = hmac.digest('hex')
  try {
    const sigBuf = Buffer.from(signatureHeader, 'utf8')
    const expBuf = Buffer.from(expectedHex, 'utf8')
    if (sigBuf.length !== expBuf.length) return false
    return timingSafeEqual(sigBuf, expBuf)
  } catch {
    return false
  }
}

function readSessionIdFromCustomData(custom: unknown): string | null {
  if (!custom || typeof custom !== 'object') return null
  const sid = (custom as Record<string, unknown>).session_id
  return typeof sid === 'string' && sid.length > 0 ? sid : null
}

/** Stable idempotency key for order-paid fulfillment (one command per provider order). */
export function lemonFulfillmentIdempotencyKey(providerOrderId: string): string {
  return `lemon:order:${providerOrderId}`
}

export type ParsedLemonWebhook = {
  eventName: string
  sessionId: string | null
  providerOrderId: string | null
  orderPaid: boolean
}

/**
 * Read session id from `meta.custom_data` or top-level `custom_data` (Lemon payload shapes vary).
 */
export function parseLemonWebhookBody(body: unknown): ParsedLemonWebhook {
  if (!body || typeof body !== 'object') {
    return { eventName: '', sessionId: null, providerOrderId: null, orderPaid: false }
  }
  const b = body as Record<string, unknown>
  const meta =
    b.meta && typeof b.meta === 'object'
      ? (b.meta as Record<string, unknown>)
      : null
  const eventName =
    meta && typeof meta.event_name === 'string' ? meta.event_name : ''

  let sessionId: string | null = null
  if (meta?.custom_data != null) {
    sessionId = readSessionIdFromCustomData(meta.custom_data)
  }
  if (!sessionId && b.custom_data != null) {
    sessionId = readSessionIdFromCustomData(b.custom_data)
  }

  const data =
    b.data && typeof b.data === 'object'
      ? (b.data as Record<string, unknown>)
      : null
  const providerOrderId =
    data && (typeof data.id === 'string' || typeof data.id === 'number')
      ? String(data.id)
      : null

  const attrs =
    data?.attributes && typeof data.attributes === 'object'
      ? (data.attributes as Record<string, unknown>)
      : undefined
  const status = attrs && typeof attrs.status === 'string' ? attrs.status : null
  const orderPaid = status === 'paid'

  return { eventName, sessionId, providerOrderId, orderPaid }
}
