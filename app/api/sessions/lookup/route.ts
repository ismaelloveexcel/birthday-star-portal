import { NextResponse } from 'next/server'
import { findSessionIdByShortCode } from '@/lib/rsse/persistence/factory'
import { loadSessionRuntimeFromPersistence } from '@/lib/rsse/sessionRuntime'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')?.toLowerCase()
  if (!code) {
    return NextResponse.json({ error: 'code required' }, { status: 400 })
  }
  const sid = await findSessionIdByShortCode(code)
  if (!sid) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
  const rt = await loadSessionRuntimeFromPersistence(sid)
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
