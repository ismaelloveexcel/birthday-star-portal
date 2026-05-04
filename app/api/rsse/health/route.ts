import { NextResponse } from 'next/server'
import { computeRsseHealth } from '@/lib/rsse/rsseHealth'

export async function GET() {
  const { httpStatus, body } = await computeRsseHealth()
  return NextResponse.json(body, { status: httpStatus })
}
