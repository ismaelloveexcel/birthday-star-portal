import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { applyPlatformCommand } from '@/lib/rsse/applyPlatformCommand'
import { log } from '@/lib/rsse/observability'

function verifySignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature) return false
  const hmac = createHmac('sha256', secret)
  hmac.update(rawBody)
  const digest = Buffer.from(hmac.digest('hex'), 'utf8')
  const sig = Buffer.from(signature, 'utf8')
  if (digest.length !== sig.length) return false
  return timingSafeEqual(digest, sig)
}

/** Extract session id from Lemon custom_data or meta */
function extractSessionId(obj: unknown): string | null {
  if (!obj || typeof obj !== 'object') return null
  const o = obj as Record<string, unknown>
  const meta = o.meta
  if (meta && typeof meta === 'object') {
    const custom = (meta as Record<string, unknown>).custom_data
    if (custom && typeof custom === 'object') {
      const sid = (custom as Record<string, unknown>).session_id
      if (typeof sid === 'string') return sid
    }
  }
  const cd = o.custom_data
  if (cd && typeof cd === 'object') {
    const sid = (cd as Record<string, unknown>).session_id
    if (typeof sid === 'string') return sid
  }
  return null
}

function extractOrderId(obj: unknown): string | null {
  if (!obj || typeof obj !== 'object') return null
  const o = obj as Record<string, unknown>
  const data = o.data
  if (data && typeof data === 'object') {
    const id = (data as Record<string, unknown>).id
    if (typeof id === 'string' || typeof id === 'number') return String(id)
  }
  return null
}

export async function POST(req: Request) {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET?.trim()
  const rawBody = await req.text()
  const sig = req.headers.get('x-signature')

  if (process.env.NODE_ENV === 'production' && !secret) {
    log('error', 'webhook_misconfigured', { message: 'missing LEMON_SQUEEZY_WEBHOOK_SECRET' })
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  }

  if (secret && !verifySignature(rawBody, sig, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  if (!secret && process.env.NODE_ENV !== 'production') {
    log('warn', 'webhook_unsigned_dev', {})
  }

  let body: unknown
  try {
    body = JSON.parse(rawBody) as unknown
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const b = body as Record<string, unknown>
  const eventName = typeof b.meta === 'object' && b.meta && 'event_name' in b.meta
    ? String((b.meta as Record<string, unknown>).event_name)
    : ''

  if (!eventName.includes('order_paid')) {
    return NextResponse.json({ ok: true, ignored: true })
  }

  const sessionId = extractSessionId(body)
  const orderId = extractOrderId(body)
  const attrs =
    b.data && typeof b.data === 'object'
      ? ((b.data as Record<string, unknown>).attributes as Record<
          string,
          unknown
        > | undefined)
      : undefined
  const paid = attrs?.status === 'paid'
  if (!sessionId || !orderId || !paid) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  await applyPlatformCommand({
    type: 'EMIT_EXPERIENCE_EVENT',
    sessionId,
    idempotencyKey: `lemon:order:${orderId}`,
    payload: {
      entitlementFulfillment: true,
      providerOrderId: orderId,
    },
  })

  return NextResponse.json({ ok: true })
}
