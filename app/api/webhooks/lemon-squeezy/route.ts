import { NextResponse } from 'next/server'
import { applyPlatformCommand } from '@/lib/rsse/applyPlatformCommand'
import { RsseError } from '@/lib/rsse/errors'
import {
  lemonFulfillmentIdempotencyKey,
  parseLemonWebhookBody,
  verifyLemonSqueezyWebhookSignature,
} from '@/lib/rsse/lemonSqueezyWebhook'
import { log } from '@/lib/rsse/observability'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET?.trim()
  const rawBody = await req.text()
  const sig = req.headers.get('x-signature')

  if (process.env.NODE_ENV === 'production' && !secret) {
    log('error', 'webhook_misconfigured', {
      message: 'missing LEMON_SQUEEZY_WEBHOOK_SECRET',
    })
    return NextResponse.json(
      { ok: false, error: 'Webhook not configured', code: 'webhook_misconfigured' },
      { status: 503 },
    )
  }

  if (secret && !verifyLemonSqueezyWebhookSignature(rawBody, sig, secret)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid signature', code: 'invalid_signature' },
      { status: 401 },
    )
  }

  if (!secret && process.env.NODE_ENV !== 'production') {
    log('warn', 'webhook_unsigned_dev', {})
  }

  let body: unknown
  try {
    body = JSON.parse(rawBody) as unknown
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON', code: 'invalid_json' },
      { status: 400 },
    )
  }

  const parsed = parseLemonWebhookBody(body)
  if (!parsed.eventName.includes('order_paid')) {
    return NextResponse.json({
      ok: true,
      ignored: true,
      reason: 'unsupported_event',
    })
  }

  if (!parsed.sessionId) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: 'missing_session_id',
    })
  }

  if (!parsed.providerOrderId || !parsed.orderPaid) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: 'not_paid_or_missing_order',
    })
  }

  try {
    await applyPlatformCommand({
      type: 'EMIT_EXPERIENCE_EVENT',
      sessionId: parsed.sessionId,
      idempotencyKey: lemonFulfillmentIdempotencyKey(parsed.providerOrderId),
      source: 'lemon_webhook',
      payload: {
        entitlementFulfillment: true,
        providerOrderId: parsed.providerOrderId,
      },
    })
  } catch (e) {
    if (e instanceof RsseError) {
      const status =
        e.code === 'entitlement_conflict' || e.code === 'sync_lag_detected'
          ? 409
          : 400
      return NextResponse.json(
        {
          ok: false,
          rejected: true,
          error: e.message,
          code: e.code,
        },
        { status },
      )
    }
    log('error', 'webhook_fulfillment_failed', { message: String(e) })
    return NextResponse.json(
      { ok: false, error: 'Fulfillment failed', code: 'internal_error' },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, accepted: true })
}
