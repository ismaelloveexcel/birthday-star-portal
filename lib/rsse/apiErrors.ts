import { NextResponse } from 'next/server'
import { RsseError } from './errors'

export function jsonError(
  status: number,
  message: string,
  code?: string,
): NextResponse {
  return NextResponse.json({ error: message, code }, { status })
}

export function mapRsseError(e: unknown): NextResponse {
  if (e instanceof RsseError) {
    const status =
      e.code === 'sync_lag_detected'
        ? 409
        : e.code === 'idempotency_conflict'
          ? 409
          : 400
    return jsonError(status, e.message, e.code)
  }
  if (e instanceof Error) {
    return jsonError(500, e.message)
  }
  return jsonError(500, 'Unexpected error')
}
