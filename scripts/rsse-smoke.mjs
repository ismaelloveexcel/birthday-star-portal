#!/usr/bin/env node
/**
 * RSSE end-to-end smoke via public HTTP APIs (no browser).
 *
 * Env:
 *   SMOKE_BASE_URL               — default http://localhost:3000
 *   SMOKE_USE_LEMON_WEBHOOK=1    — fulfill via signed POST /api/webhooks/lemon-squeezy first
 *   LEMON_SQUEEZY_WEBHOOK_SECRET — required when SMOKE_USE_LEMON_WEBHOOK=1
 *
 * Usage:
 *   npm run dev
 *   npm run smoke:rsse
 *
 *   $env:SMOKE_BASE_URL='https://staging.example'; npm run smoke:rsse
 */

import { createHmac } from 'node:crypto'
import {
  eventOfType,
  latestSequenceFromResponse,
  requireField,
} from './rsse-smoke-helpers.mjs'

const base = (process.env.SMOKE_BASE_URL || 'http://localhost:3000').replace(
  /\/$/,
  '',
)

const useWebhook =
  String(process.env.SMOKE_USE_LEMON_WEBHOOK || '').trim() === '1'
const webhookSecret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET?.trim()

const runId = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
const TOTAL_STEPS = useWebhook ? 11 : 10

/** @type {string} */
let stepLabel = ''

function fail(msg) {
  console.error(msg)
  process.exit(1)
}

/**
 * @param {string} method
 * @param {string} path
 * @param {Record<string, unknown> | undefined} body
 */
async function requestJson(method, path, body) {
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`
  /** @type {RequestInit} */
  const init = {
    method,
    headers: { Accept: 'application/json' },
  }
  if (body !== undefined && method !== 'GET' && method !== 'HEAD') {
    init.headers = {
      ...init.headers,
      'Content-Type': 'application/json',
    }
    init.body = JSON.stringify(body)
  }
  const res = await fetch(url, init)
  const text = await res.text()
  /** @type {unknown} */
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { _parseError: true, _raw: text.slice(0, 200) }
  }
  return { ok: res.ok, status: res.status, json }
}

/**
 * @param {{ ok: boolean; status: number; json: unknown }} result
 * @param {string} step
 */
function assertOk(result, step) {
  if (!result.ok) {
    const j = result.json && typeof result.json === 'object'
      ? /** @type {Record<string, unknown>} */ (result.json)
      : {}
    const msg =
      (typeof j.error === 'string' && j.error) ||
      (typeof j.code === 'string' && j.code) ||
      `HTTP ${result.status}`
    throw new Error(`RSSE smoke failed at ${step}: ${msg}`)
  }
  return result.json
}

/** @param {string} rawBody @param {string} sig */
async function postRawWebhook(rawBody, sig) {
  const url = `${base}/api/webhooks/lemon-squeezy`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Signature': sig,
    },
    body: rawBody,
  })
  const text = await res.text()
  /** @type {unknown} */
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { _parseError: true }
  }
  return { ok: res.ok, status: res.status, json }
}

/**
 * @param {string} shortCode
 * @param {number} cur
 */
async function syncMaxSeqFromLookup(shortCode, cur) {
  const r = await requestJson(
    'GET',
    `/api/sessions/lookup?code=${encodeURIComponent(shortCode)}`,
    undefined,
  )
  const j = assertOk(r, 'lookup (sequence sync)')
  return Math.max(cur, latestSequenceFromResponse(j))
}

/** @param {number} i @param {string} msg */
function logStep(i, msg) {
  console.log(`[${i}/${TOTAL_STEPS}] ${msg}`)
}

async function probeRsseHealth() {
  const r = await requestJson('GET', '/api/rsse/health', undefined)
  if (r.status === 404) {
    console.log('[health] /api/rsse/health not found (skipped)')
    return
  }
  if (!r.ok) {
    const j =
      r.json && typeof r.json === 'object'
        ? /** @type {Record<string, unknown>} */ (r.json)
        : {}
    const hint =
      (typeof j.error === 'string' && j.error) ||
      (typeof j.message === 'string' && j.message) ||
      `HTTP ${r.status}`
    fail(`RSSE smoke: /api/rsse/health failed — ${hint}`)
  }
  const j =
    r.json && typeof r.json === 'object'
      ? /** @type {Record<string, unknown>} */ (r.json)
      : {}
  if (j.ok === false) {
    fail(
      `RSSE smoke: /api/rsse/health reports ok=false (persistence=${String(j.persistence)}, databaseConfigured=${String(j.databaseConfigured)})`,
    )
  }
  console.log(
    `[health] ok=${String(j.ok)} persistence=${String(j.persistence)} databaseConfigured=${String(j.databaseConfigured)} checkoutConfigured=${String(j.checkoutConfigured)}`,
  )
}

async function main() {
  console.log(`RSSE smoke against ${base}`)
  await probeRsseHealth()

  if (useWebhook && !webhookSecret) {
    fail(
      'RSSE smoke: SMOKE_USE_LEMON_WEBHOOK=1 requires LEMON_SQUEEZY_WEBHOOK_SECRET',
    )
  }

  let si = 0

  try {
    si += 1
    stepLabel = `[${si}/${TOTAL_STEPS}] create`
    const createRes = await requestJson('POST', '/api/sessions/create', {
      idempotencyKey: `smoke-create-${runId}`,
      title: 'Smoke room',
      maxPlayers: 8,
    })
    const created = assertOk(createRes, stepLabel)
    requireField(created.sessionId, 'sessionId')
    requireField(created.shortCode, 'shortCode')
    const sessionId = String(created.sessionId)
    const shortCode = String(created.shortCode).toLowerCase()
    let maxSeq = latestSequenceFromResponse(created)
    logStep(si, `create session OK (${sessionId.slice(0, 8)}…)`)

    si += 1
    stepLabel = `[${si}/${TOTAL_STEPS}] join`
    const joinRes = await requestJson('POST', '/api/sessions/join', {
      shortCode,
      displayName: 'Smoke Host',
      avatarEmoji: '*',
      idempotencyKey: `smoke-join-${runId}`,
      lastSeenSequenceNumber: maxSeq,
    })
    const joined = assertOk(joinRes, stepLabel)
    const playerId = String(
      requireField(joined.playerId, 'host playerId from join'),
    )
    maxSeq = Math.max(maxSeq, latestSequenceFromResponse(joined))
    logStep(si, 'join host OK')

    si += 1
    stepLabel = `[${si}/${TOTAL_STEPS}] start`
    const startRes = await requestJson('POST', '/api/sessions/command', {
      type: 'START_SESSION',
      sessionId,
      playerId,
      idempotencyKey: `smoke-start-${runId}`,
      lastSeenSequenceNumber: maxSeq,
    })
    const started = assertOk(startRes, stepLabel)
    if (!eventOfType(started, 'host_started')) {
      throw new Error('expected host_started in command response')
    }
    maxSeq = Math.max(maxSeq, latestSequenceFromResponse(started))
    logStep(si, 'start session OK')

    si += 1
    stepLabel = `[${si}/${TOTAL_STEPS}] checkpoint`
    const ckRes = await requestJson('POST', '/api/sessions/command', {
      type: 'EMIT_EXPERIENCE_EVENT',
      sessionId,
      playerId,
      idempotencyKey: `smoke-ckpt-${runId}`,
      lastSeenSequenceNumber: maxSeq,
      payload: { label: 'smoke-checkpoint' },
    })
    const ck = assertOk(ckRes, stepLabel)
    if (!eventOfType(ck, 'checkpoint_reached')) {
      throw new Error('expected checkpoint_reached event')
    }
    maxSeq = Math.max(maxSeq, latestSequenceFromResponse(ck))
    logStep(si, 'emit checkpoint OK')

    si += 1
    stepLabel = `[${si}/${TOTAL_STEPS}] unlock`
    const unlockRes = await requestJson('POST', '/api/sessions/unlock', {
      sessionId,
      playerId,
      idempotencyKey: `smoke-unlock-req-${runId}`,
      lastSeenSequenceNumber: maxSeq,
    })
    assertOk(unlockRes, stepLabel)
    maxSeq = await syncMaxSeqFromLookup(shortCode, maxSeq)
    logStep(si, 'request unlock OK (sequence synced via lookup)')

    const providerOrderId = `smoke-order-${runId}`

    if (useWebhook) {
      si += 1
      stepLabel = `[${si}/${TOTAL_STEPS}] webhook fulfill`
      const whPayload = {
        meta: {
          event_name: 'order_paid',
          custom_data: { session_id: sessionId },
        },
        data: {
          id: providerOrderId,
          attributes: { status: 'paid' },
        },
      }
      const rawBody = JSON.stringify(whPayload)
      const sig = createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex')
      const wh1 = await postRawWebhook(rawBody, sig)
      assertOk(wh1, stepLabel)
      logStep(si, 'webhook order_paid OK')

      si += 1
      stepLabel = `[${si}/${TOTAL_STEPS}] webhook retry`
      const wh2 = await postRawWebhook(rawBody, sig)
      assertOk(wh2, stepLabel)
      logStep(si, 'webhook retry OK (idempotent HTTP)')

      si += 1
      stepLabel = `[${si}/${TOTAL_STEPS}] command fulfill dedupe`
      maxSeq = await syncMaxSeqFromLookup(shortCode, maxSeq)
      const f2 = await requestJson('POST', '/api/sessions/command', {
        type: 'EMIT_EXPERIENCE_EVENT',
        sessionId,
        idempotencyKey: `smoke-fulfill-postwebhook-${runId}`,
        lastSeenSequenceNumber: maxSeq,
        payload: {
          entitlementFulfillment: true,
          providerOrderId,
        },
      })
      const fulfillB = assertOk(f2, stepLabel)
      const evB = /** @type {Record<string, unknown>} */ (fulfillB).events
      if (!Array.isArray(evB) || evB.length !== 0) {
        throw new Error(
          'expected command fulfillment after webhook to return events: []',
        )
      }
      logStep(si, 'command dedupe after webhook OK (events empty)')
    } else {
      si += 1
      stepLabel = `[${si}/${TOTAL_STEPS}] fulfill A`
      const f1 = await requestJson('POST', '/api/sessions/command', {
        type: 'EMIT_EXPERIENCE_EVENT',
        sessionId,
        idempotencyKey: `smoke-fulfill-a-${runId}`,
        lastSeenSequenceNumber: maxSeq,
        payload: {
          entitlementFulfillment: true,
          providerOrderId,
        },
      })
      const fulfillA = assertOk(f1, stepLabel)
      if (!eventOfType(fulfillA, 'session_unlocked')) {
        throw new Error('expected session_unlocked in first fulfillment response')
      }
      maxSeq = Math.max(maxSeq, latestSequenceFromResponse(fulfillA))
      logStep(si, 'fulfillment A OK (session_unlocked present)')

      si += 1
      stepLabel = `[${si}/${TOTAL_STEPS}] fulfill B (dedupe)`
      const f2 = await requestJson('POST', '/api/sessions/command', {
        type: 'EMIT_EXPERIENCE_EVENT',
        sessionId,
        idempotencyKey: `smoke-fulfill-b-${runId}`,
        lastSeenSequenceNumber: maxSeq,
        payload: {
          entitlementFulfillment: true,
          providerOrderId,
        },
      })
      const fulfillB = assertOk(f2, stepLabel)
      const evB = /** @type {Record<string, unknown>} */ (fulfillB).events
      if (!Array.isArray(evB) || evB.length !== 0) {
        throw new Error('expected duplicate fulfillment to return events: []')
      }
      logStep(si, 'fulfillment dedupe OK (events empty)')
    }

    maxSeq = await syncMaxSeqFromLookup(shortCode, maxSeq)

    si += 1
    stepLabel = `[${si}/${TOTAL_STEPS}] complete`
    const doneRes = await requestJson('POST', '/api/sessions/command', {
      type: 'COMPLETE_SESSION',
      sessionId,
      playerId,
      idempotencyKey: `smoke-complete-${runId}`,
      lastSeenSequenceNumber: maxSeq,
    })
    const done = assertOk(doneRes, stepLabel)
    if (!eventOfType(done, 'session_completed')) {
      throw new Error('expected session_completed')
    }
    maxSeq = Math.max(maxSeq, latestSequenceFromResponse(done))
    logStep(si, 'complete session OK')

    si += 1
    stepLabel = `[${si}/${TOTAL_STEPS}] lookup`
    const lookRes = await requestJson(
      'GET',
      `/api/sessions/lookup?code=${encodeURIComponent(shortCode)}`,
      undefined,
    )
    const look = assertOk(lookRes, stepLabel)
    if (String(look.sessionId) !== sessionId) {
      throw new Error('lookup sessionId mismatch')
    }
    logStep(si, `lookup OK (status=${String(look.status)})`)

    const resultsEv = eventOfType(done, 'results_generated')
    const summary =
      resultsEv &&
      typeof resultsEv.payload === 'object' &&
      resultsEv.payload &&
      typeof /** @type {Record<string, unknown>} */ (resultsEv.payload).summary ===
        'object'
        ? /** @type {Record<string, unknown>} */ (
            /** @type {Record<string, unknown>} */ (resultsEv.payload).summary
          )
        : null
    const publicSlug =
      summary && typeof summary.publicSlug === 'string'
        ? summary.publicSlug
        : null
    if (publicSlug) {
      const pageUrl = `${base}/${encodeURIComponent(shortCode)}/results`
      const pageRes = await fetch(pageUrl, { method: 'GET' })
      if (pageRes.ok) {
        console.log(
          `[info] results page GET OK (${pageRes.status}) ${base}/${shortCode}/results`,
        )
      } else {
        console.log(
          `[skip] results page returned ${pageRes.status} (non-fatal)`,
        )
      }
    } else {
      console.log(
        '[skip] no publicSlug in API payload — results page fetch skipped (expected)',
      )
    }

    si += 1
    stepLabel = `[${si}/${TOTAL_STEPS}] waitlist`
    const email = `rsse-smoke-${runId}@example.com`
    const wlRes = await requestJson('POST', '/api/waitlist', {
      email,
      idempotencyKey: `smoke-wl-${runId}`,
      source: 'rsse-smoke',
    })
    assertOk(wlRes, stepLabel)
    logStep(si, `waitlist OK (${email})`)

    console.log('RSSE smoke OK')
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error(stepLabel ? `${stepLabel}: ${msg}` : msg)
    process.exit(1)
  }
}

main()
