import type { SessionEvent, SessionRuntimeState } from './contracts'
import { log } from './observability'

export type RealtimeChannelEvent =
  | 'session.updated'
  | 'player.joined'
  | 'player.left'
  | 'session.locked'
  | 'session.unlocked'
  | 'session.completed'
  | 'session.failure_detected'

export type RealtimePayload = {
  channel: string
  event: RealtimeChannelEvent
  sessionId: string
  sequenceNumber: number
  /** Non-authoritative hint for clients */
  hint?: Record<string, unknown>
}

const subscribers = new Set<(p: RealtimePayload) => void>()

export function subscribeRealtime(
  fn: (p: RealtimePayload) => void,
): () => void {
  subscribers.add(fn)
  return () => subscribers.delete(fn)
}

/** Only RSSE engine should call this after successful command. */
export async function broadcastSessionUpdate(
  runtime: SessionRuntimeState,
  events: SessionEvent[],
): Promise<void> {
  const channel = `session:${runtime.session.id}`
  const seq =
    events.length > 0
      ? Math.max(...events.map((e) => e.sequenceNumber))
      : runtime.snapshot.sequenceNumber

  for (const ev of events) {
    const base = { channel, sessionId: runtime.session.id, sequenceNumber: seq }
    let type: RealtimeChannelEvent = 'session.updated'
    if (ev.eventType === 'player_joined') type = 'player.joined'
    if (ev.eventType === 'session_locked') type = 'session.locked'
    if (ev.eventType === 'session_unlocked') type = 'session.unlocked'
    if (ev.eventType === 'session_completed') type = 'session.completed'
    if (ev.eventType === 'session_failure_detected')
      type = 'session.failure_detected'

    const payload: RealtimePayload = {
      ...base,
      event: type,
      hint: { lastEventType: ev.eventType },
    }
    log('info', 'realtime_broadcast', { sessionId: runtime.session.id, eventType: type })
    for (const sub of subscribers) {
      sub(payload)
    }
  }

  if (events.length === 0) {
    const payload: RealtimePayload = {
      channel,
      event: 'session.updated',
      sessionId: runtime.session.id,
      sequenceNumber: seq,
    }
    for (const sub of subscribers) {
      sub(payload)
    }
  }
}
