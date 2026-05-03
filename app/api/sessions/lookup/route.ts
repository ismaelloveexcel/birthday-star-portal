import { NextResponse } from 'next/server'
import { findSessionIdByShortCode } from '@/lib/rsse/applyPlatformCommand'
import { getRsseStore } from '@/lib/rsse/memoryPersistence'
import { loadSessionRuntime } from '@/lib/rsse/sessionRuntime'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')?.toLowerCase()
  if (!code) {
    return NextResponse.json({ error: 'code required' }, { status: 400 })
  }
  const sid = findSessionIdByShortCode(code)
  if (!sid) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
  const rt = loadSessionRuntime(getRsseStore(), sid)
  if (!rt) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
  return NextResponse.json({
    sessionId: rt.session.id,
    shortCode: rt.session.shortCode,
    status: rt.session.status,
    snapshot: rt.snapshot,
    derivedFlags: rt.derivedFlags,
    lastSequence: rt.lastEvent?.sequenceNumber ?? 0,
  })
}
