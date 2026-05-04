import { NextResponse } from 'next/server'
import { computeRsseHealth } from '@/lib/rsse/rsseHealth'

/** RSSE health pings Postgres via `pg`; must not run on Edge. */
export const runtime = 'nodejs'

export async function GET() {
  const { httpStatus, body } = await computeRsseHealth()
  return NextResponse.json(body, { status: httpStatus })
}
