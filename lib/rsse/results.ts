import type { SessionEvent, SessionStatus } from './contracts'

export type SessionResultSummary = {
  sessionId: string
  shortCode: string
  status: SessionStatus
  playerCount: number
  startedAt?: string
  completedAt?: string
  checkpointCount: number
  unlockCount: number
  shareText: string
}

export function buildShareText(input: {
  playerCount: number
  checkpointCount: number
  baseUrl: string
}): string {
  const { playerCount, checkpointCount, baseUrl } = input
  return [
    'We ran a private Play It Forward session.',
    '',
    `${playerCount} people joined.`,
    `${checkpointCount} moments completed.`,
    '',
    `Create your own private room:`,
    baseUrl,
  ].join('\n')
}

export function buildSessionResultSummary(input: {
  sessionId: string
  shortCode: string
  status: SessionStatus
  playerCount: number
  events: SessionEvent[]
  baseUrl: string
}): SessionResultSummary {
  let startedAt: string | undefined
  let completedAt: string | undefined
  let checkpointCount = 0
  let unlockCount = 0

  for (const e of input.events) {
    if (e.eventType === 'host_started') startedAt = e.createdAt
    if (e.eventType === 'session_completed') completedAt = e.createdAt
    if (e.eventType === 'checkpoint_reached') checkpointCount += 1
    if (e.eventType === 'session_unlocked' || e.eventType === 'unlock_clicked')
      unlockCount += 1
  }

  const shareText = buildShareText({
    playerCount: input.playerCount,
    checkpointCount,
    baseUrl: input.baseUrl,
  })

  return {
    sessionId: input.sessionId,
    shortCode: input.shortCode,
    status: input.status,
    playerCount: input.playerCount,
    startedAt,
    completedAt,
    checkpointCount,
    unlockCount,
    shareText,
  }
}
