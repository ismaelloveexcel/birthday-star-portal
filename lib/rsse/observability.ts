type LogLevel = 'info' | 'warn' | 'error'

export type RsseLogPayload = {
  sessionId?: string
  eventType?: string
  latencyMs?: number
  stateBefore?: unknown
  stateAfter?: unknown
  source?: string
  message?: string
  command?: string
  code?: string
}

export function log(
  level: LogLevel,
  action: string,
  payload: RsseLogPayload,
): void {
  const line = JSON.stringify({ level, action, ts: new Date().toISOString(), ...payload })
  if (level === 'error') {
    console.error(line)
  } else if (level === 'warn') {
    console.warn(line)
  } else {
    console.info(line)
  }
}
