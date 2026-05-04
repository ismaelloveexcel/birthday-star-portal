/**
 * Pure helpers for RSSE HTTP smoke (used by scripts/rsse-smoke.mjs and Vitest).
 */

/**
 * @param {unknown} json
 * @returns {number}
 */
export function latestSequenceFromResponse(json) {
  if (!json || typeof json !== 'object') return 0
  const o = /** @type {Record<string, unknown>} */ (json)
  let m = 0
  if (o.snapshot && typeof o.snapshot === 'object') {
    const sn = /** @type {Record<string, unknown>} */ (o.snapshot).sequenceNumber
    if (typeof sn === 'number') m = Math.max(m, sn)
  }
  if (Array.isArray(o.events)) {
    for (const e of o.events) {
      if (e && typeof e === 'object') {
        const seq = /** @type {Record<string, unknown>} */ (e).sequenceNumber
        if (typeof seq === 'number') m = Math.max(m, seq)
      }
    }
  }
  if (typeof o.lastSequence === 'number') m = Math.max(m, o.lastSequence)
  return m
}

/**
 * @param {unknown} json
 * @param {string} eventType
 * @returns {Record<string, unknown> | undefined}
 */
export function eventOfType(json, eventType) {
  if (!json || typeof json !== 'object') return undefined
  const events = /** @type {Record<string, unknown>} */ (json).events
  if (!Array.isArray(events)) return undefined
  const found = events.find(
    (e) =>
      e &&
      typeof e === 'object' &&
      /** @type {Record<string, unknown>} */ (e).eventType === eventType,
  )
  return found && typeof found === 'object'
    ? /** @type {Record<string, unknown>} */ (found)
    : undefined
}

/**
 * @param {unknown} value
 * @param {string} pathDescription
 * @param {(v: unknown) => boolean} [testFn]
 * @returns {unknown}
 */
export function requireField(value, pathDescription, testFn = (v) => v != null && v !== '') {
  if (!testFn(value)) {
    throw new Error(`missing ${pathDescription}`)
  }
  return value
}
