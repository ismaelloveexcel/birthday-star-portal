import type {
  PlatformCommand,
  PlatformResponse,
  SessionEvent,
  SessionRuntimeState,
  SocialSession,
} from './contracts'
import { computeDerivedFlags } from './derivedFlags'
import {
  applyMonetizationDecision,
  defaultMonetizationPolicy,
} from './monetizationPolicy'
import { log } from './observability'
import { broadcastSessionUpdate } from './realtime'
import { getRsseStore, withRsseTransaction } from './memoryPersistence'
import { RsseError } from './errors'
import { placeholderExperienceAdapter } from './experienceAdapter'
import {
  applyEventsToRuntime,
  initialRuntimeForNewSession,
} from './reducer'
import { buildSessionResultSummary } from './results'
import {
  loadEvents,
  loadPlayers,
  loadSessionRuntime,
} from './sessionRuntime'

const adapter = placeholderExperienceAdapter

function nowIso(): string {
  return new Date().toISOString()
}

function shortCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz234567'
  let out = ''
  for (let i = 0; i < 6; i++) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

function idempotencyKeyCreate(cmd: PlatformCommand): string {
  return `create:${cmd.idempotencyKey}`
}

function idempotencyKeySession(cmd: PlatformCommand): string {
  return `${cmd.sessionId ?? 'none'}:${cmd.idempotencyKey}`
}

function needsSequenceCheck(cmd: PlatformCommand): boolean {
  return cmd.type !== 'CREATE_SESSION'
}

function latestSequence(store: ReturnType<typeof getRsseStore>, sessionId: string): number {
  let max = 0
  for (const ev of store.sessionEvents.values()) {
    if (ev.sessionId === sessionId && ev.sequenceNumber > max) {
      max = ev.sequenceNumber
    }
  }
  return max
}

function validateSequence(
  cmd: PlatformCommand,
  runtime: SessionRuntimeState | null,
) {
  if (!needsSequenceCheck(cmd) || !runtime) return
  const latest = runtime.lastEvent?.sequenceNumber ?? 0
  if (
    cmd.lastSeenSequenceNumber !== undefined &&
    cmd.lastSeenSequenceNumber < latest
  ) {
    log('warn', 'sequence_mismatch', {
      sessionId: cmd.sessionId,
      command: cmd.type,
      stateBefore: latest,
    })
    throw new RsseError('Stale sequence', 'sync_lag_detected', {
      command: cmd.type,
      stateBefore: latest,
      attemptedState: cmd.lastSeenSequenceNumber,
    })
  }
}

function assignSequences(
  events: Omit<SessionEvent, 'sequenceNumber' | 'createdAt'>[],
  start: number,
): SessionEvent[] {
  const ts = nowIso()
  return events.map((e, i) => ({
    ...e,
    sequenceNumber: start + i,
    createdAt: ts,
  })) as SessionEvent[]
}

function draftEvent(
  partial: Omit<SessionEvent, 'sequenceNumber' | 'createdAt' | 'id'> & { id?: string },
): Omit<SessionEvent, 'sequenceNumber' | 'createdAt'> {
  return {
    id: partial.id ?? crypto.randomUUID(),
    sessionId: partial.sessionId,
    playerId: partial.playerId ?? null,
    eventType: partial.eventType,
    payload: partial.payload,
    idempotencyKey: partial.idempotencyKey ?? null,
  }
}

function renumberMonetizationEvents(events: SessionEvent[]): SessionEvent[] {
  const sorted = [...events].sort((a, b) => a.sequenceNumber - b.sequenceNumber)
  if (sorted.length === 0) return sorted
  const start = sorted[0]!.sequenceNumber
  return sorted.map((e, i) => ({
    ...e,
    sequenceNumber: start + i,
  }))
}

async function buildProposedDrafts(
  cmd: PlatformCommand,
  runtime: SessionRuntimeState | null,
  store: ReturnType<typeof getRsseStore>,
): Promise<Omit<SessionEvent, 'sequenceNumber' | 'createdAt'>[]> {
  if (cmd.type === 'CREATE_SESSION') {
    throw new RsseError('Use create branch', 'event_rejected')
  }
  if (!cmd.sessionId) {
    throw new RsseError('sessionId required', 'event_rejected', { command: cmd.type })
  }
    const sessionId = cmd.sessionId
    const rt = runtime ?? loadSessionRuntime(store, sessionId)
  if (!rt) {
    throw new RsseError('Session not found', 'event_rejected', { command: cmd.type })
  }

  if (cmd.type === 'JOIN_SESSION') {
    const p = cmd.payload ?? {}
    const displayName =
      typeof p.displayName === 'string' ? p.displayName.trim() : ''
    if (displayName.length < 1 || displayName.length > 20) {
      throw new RsseError('Invalid display name', 'event_rejected', { command: cmd.type })
    }
    const avatarEmoji =
      typeof p.avatarEmoji === 'string' && p.avatarEmoji.length > 0
        ? p.avatarEmoji.slice(0, 8)
        : '*'
      const players = loadPlayers(store, sessionId)
    if (players.length >= rt.session.maxPlayers) {
      throw new RsseError('Room full', 'event_rejected', { command: cmd.type })
    }
    const isFirst = players.length === 0
    const playerId = crypto.randomUUID()
    const role = isFirst ? 'host' : 'player'
    return [
      draftEvent({
          sessionId,
        playerId,
        eventType: 'player_joined',
        payload: {
          playerId,
          displayName,
          avatarEmoji,
          role,
        },
        idempotencyKey: cmd.idempotencyKey,
      }),
    ]
  }

  if (cmd.type === 'START_SESSION') {
    if (rt.session.status !== 'lobby') {
      throw new RsseError('Cannot start', 'invalid_transition', {
        command: cmd.type,
        stateBefore: rt.session.status,
      })
    }
    if (!cmd.playerId || cmd.playerId !== rt.session.hostPlayerId) {
      throw new RsseError('Only host can start', 'event_rejected', { command: cmd.type })
    }
    const out = await adapter.start({
      sessionId: rt.session.id,
      snapshot: rt.snapshot,
      players: rt.activePlayers,
    })
    const hostEv = draftEvent({
        sessionId,
      playerId: cmd.playerId,
      eventType: 'host_started',
      payload: {},
      idempotencyKey: cmd.idempotencyKey,
    })
    const rest = out.proposedEvents.map((pe) =>
      draftEvent({
        ...pe,
          sessionId,
        playerId: pe.playerId ?? null,
        eventType: pe.eventType,
        payload: pe.payload,
        idempotencyKey: pe.idempotencyKey ?? null,
      }),
    )
    return [hostEv, ...rest]
  }

  if (cmd.type === 'EMIT_EXPERIENCE_EVENT') {
    const p = cmd.payload ?? {}
    if (p.entitlementFulfillment === true) {
      const orderId =
        typeof p.providerOrderId === 'string' ? p.providerOrderId : ''
      if (!orderId) {
        throw new RsseError('Missing order id', 'event_rejected', { command: cmd.type })
      }
      return [
        draftEvent({
            sessionId,
          playerId: null,
          eventType: 'session_unlocked',
          payload: { providerOrderId: orderId },
          idempotencyKey: cmd.idempotencyKey,
        }),
      ]
    }
    if (p.recordWaitlist === true) {
      const email = typeof p.email === 'string' ? p.email : ''
      return [
        draftEvent({
            sessionId,
          playerId: cmd.playerId ?? null,
          eventType: 'waitlist_joined',
          payload: { email },
          idempotencyKey: cmd.idempotencyKey,
        }),
      ]
    }
    if (p.shareSession === true) {
      return [
        draftEvent({
            sessionId,
          playerId: cmd.playerId ?? null,
          eventType: 'session_shared',
          payload: {},
          idempotencyKey: cmd.idempotencyKey,
        }),
      ]
    }
    const out = await adapter.handleCommand({
      sessionId: rt.session.id,
      snapshot: rt.snapshot,
      players: rt.activePlayers,
      commandPayload: cmd.payload,
      actingPlayerId: cmd.playerId ?? null,
    })
    return out.proposedEvents.map((pe) =>
      draftEvent({
          sessionId,
        playerId: pe.playerId ?? null,
        eventType: pe.eventType,
        payload: pe.payload,
        idempotencyKey: pe.idempotencyKey ?? null,
      }),
    )
  }

  if (cmd.type === 'REQUEST_UNLOCK') {
    return [
      draftEvent({
          sessionId,
        playerId: cmd.playerId ?? null,
        eventType: 'unlock_clicked',
        payload: {},
        idempotencyKey: null,
      }),
      draftEvent({
          sessionId,
        playerId: cmd.playerId ?? null,
        eventType: 'unlock_requested',
        payload: {},
        idempotencyKey: cmd.idempotencyKey,
      }),
    ]
  }

  if (cmd.type === 'COMPLETE_SESSION') {
    const players = loadPlayers(store, cmd.sessionId)
    const events = loadEvents(store, cmd.sessionId)
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') ??
      'https://example.com'
    const nextSeq = latestSequence(store, cmd.sessionId) + 1
    const completedStub: SessionEvent = {
      id: 'temp',
        sessionId,
      playerId: cmd.playerId ?? null,
      eventType: 'session_completed',
      payload: {},
      sequenceNumber: nextSeq,
      idempotencyKey: cmd.idempotencyKey,
      createdAt: nowIso(),
    }
    const summary = buildSessionResultSummary({
      sessionId: rt.session.id,
      shortCode: rt.session.shortCode,
      status: 'completed',
      playerCount: players.length,
      events: [...events, completedStub],
      baseUrl: `${baseUrl}/create`,
    })
    return [
      draftEvent({
          sessionId,
        playerId: cmd.playerId ?? null,
        eventType: 'session_completed',
        payload: {},
        idempotencyKey: cmd.idempotencyKey,
      }),
      draftEvent({
          sessionId,
        playerId: null,
        eventType: 'results_generated',
        payload: { summary },
        idempotencyKey: null,
      }),
    ]
  }

  if (cmd.type === 'ARCHIVE_SESSION') {
    return [
      draftEvent({
          sessionId,
        playerId: cmd.playerId ?? null,
        eventType: 'session_archived',
        payload: {},
        idempotencyKey: cmd.idempotencyKey,
      }),
    ]
  }

  return []
}

function createSessionDraft(
  cmd: PlatformCommand,
  store: ReturnType<typeof getRsseStore>,
): {
  session: SocialSession
  drafts: Omit<SessionEvent, 'sequenceNumber' | 'createdAt'>[]
} {
  const ts = nowIso()
  let code = shortCode()
  while (store.shortCodeIndex.has(code)) {
    code = shortCode()
  }
  const sessionId = crypto.randomUUID()
  const exp = new Date(Date.now() + 24 * 3600 * 1000).toISOString()
  const payload = cmd.payload ?? {}
  const title = typeof payload.title === 'string' ? payload.title : null
  const maxPlayers =
    typeof payload.maxPlayers === 'number' && payload.maxPlayers > 0
      ? Math.min(32, payload.maxPlayers)
      : 8
  const experienceTypeId =
    typeof payload.experienceTypeId === 'string'
      ? payload.experienceTypeId
      : 'placeholder'

  const session: SocialSession = {
    id: sessionId,
    shortCode: code,
    experienceTypeId,
    hostPlayerId: null,
    status: 'created',
    title,
    maxPlayers,
    isUnlocked: false,
    createdAt: ts,
    updatedAt: ts,
    expiresAt: exp,
  }
  return {
    session,
    drafts: [
      draftEvent({
        sessionId,
        playerId: null,
        eventType: 'session_created',
        payload: { shortCode: code },
        idempotencyKey: cmd.idempotencyKey,
      }),
      draftEvent({
        sessionId,
        playerId: null,
        eventType: 'session_opened',
        payload: {},
        idempotencyKey: null,
      }),
    ],
  }
}

function persist(
  store: ReturnType<typeof getRsseStore>,
  events: SessionEvent[],
  finalRuntime: Omit<SessionRuntimeState, 'derivedFlags'>,
  opts?: { shortCode?: string; isCreate?: boolean },
) {
  if (opts?.isCreate && opts.shortCode) {
    store.shortCodeIndex.set(opts.shortCode.toLowerCase(), finalRuntime.session.id)
  }
  store.socialSessions.set(finalRuntime.session.id, finalRuntime.session)
  for (const ev of events) {
    store.sessionEvents.set(ev.id, ev)
    if (ev.eventType === 'player_joined') {
      const pid = ev.payload.playerId as string
      const pl = finalRuntime.activePlayers.find((p) => p.id === pid)
      if (pl) store.sessionPlayers.set(pl.id, pl)
    }
  }
  store.sessionSnapshots.set(finalRuntime.session.id, finalRuntime.snapshot)
}

function buildResponse(final: SessionRuntimeState, events: SessionEvent[]): PlatformResponse {
  return {
    status: final.session.status,
    snapshot: final.snapshot,
    events,
    derivedFlags: computeDerivedFlags(final),
  }
}

export async function applyPlatformCommand(
  command: PlatformCommand,
): Promise<PlatformResponse> {
  const started = Date.now()
  log('info', 'command_received', {
    sessionId: command.sessionId,
    command: command.type,
    source: 'applyPlatformCommand',
  })

  return withRsseTransaction(async (store) => {
    const idKey =
      command.type === 'CREATE_SESSION'
        ? idempotencyKeyCreate(command)
        : idempotencyKeySession(command)
    const cached = store.idempotencyCache.get(idKey)
    if (cached) {
      log('info', 'idempotency_hit', { sessionId: command.sessionId })
      return cached
    }

    let runtime: SessionRuntimeState | null =
      command.sessionId != null
        ? loadSessionRuntime(store, command.sessionId)
        : null

    validateSequence(command, runtime)

    if (command.sessionId && command.idempotencyKey) {
      const dup = [...store.sessionEvents.values()].find(
        (e) =>
          e.sessionId === command.sessionId &&
          e.idempotencyKey === command.idempotencyKey,
      )
      if (dup) {
        const rt = loadSessionRuntime(store, command.sessionId)
        if (rt) {
          const all = loadEvents(store, command.sessionId)
          const resp = buildResponse(rt, all.filter((e) => e.sequenceNumber >= dup.sequenceNumber))
          store.idempotencyCache.set(idKey, resp)
          return resp
        }
      }
    }

    let drafts: Omit<SessionEvent, 'sequenceNumber' | 'createdAt'>[] = []
    let newSession: SocialSession | null = null

    try {
      if (command.type === 'CREATE_SESSION') {
        const created = createSessionDraft(command, store)
        newSession = created.session
        drafts = created.drafts
      } else {
        drafts = await buildProposedDrafts(command, runtime, store)
      }
    } catch (e) {
      if (e instanceof RsseError) {
        log('warn', 'command_rejected', {
          message: e.message,
          code: e.code,
          command: command.type,
        })
      }
      throw e
    }

    const sessionId =
      command.type === 'CREATE_SESSION' ? newSession!.id : command.sessionId!

    const startSeq =
      command.type === 'CREATE_SESSION' ? 1 : latestSequence(store, sessionId) + 1

    let proposed = assignSequences(drafts, startSeq)

    let workingBase: Omit<SessionRuntimeState, 'derivedFlags'>
    if (command.type === 'CREATE_SESSION') {
      const s = newSession!
      workingBase = initialRuntimeForNewSession(s, proposed[0]!.id)
    } else {
      if (!runtime) {
        throw new RsseError('Session missing', 'event_rejected')
      }
      workingBase = {
        session: runtime.session,
        snapshot: runtime.snapshot,
        activePlayers: runtime.activePlayers,
        lastEvent: runtime.lastEvent,
      }
    }

    let next = applyEventsToRuntime(workingBase, proposed)
    const previousRuntime =
      runtime ??
      ({
        ...next,
        derivedFlags: computeDerivedFlags(next),
      } as SessionRuntimeState)

    const monetizationDecision = defaultMonetizationPolicy.evaluate({
      previous: previousRuntime,
      next: {
        ...next,
        derivedFlags: computeDerivedFlags(next),
      } as SessionRuntimeState,
      command,
      events: proposed,
    })

    const adjustedRaw = applyMonetizationDecision(proposed, monetizationDecision, {
      sessionId,
      playerId: command.playerId ?? null,
      now: nowIso(),
    })
    const adjusted = renumberMonetizationEvents(adjustedRaw)

    let finalBase = workingBase
    if (monetizationDecision.action !== 'ALLOW') {
      finalBase = workingBase
    }
    let finalRuntime = applyEventsToRuntime(finalBase, adjusted)

    for (const ev of adjusted) {
      if (ev.eventType === 'results_generated') {
        const summary = ev.payload.summary as Record<string, unknown>
        const slug = crypto.randomUUID().slice(0, 8)
        const shareText =
          typeof (summary as { shareText?: string }).shareText === 'string'
            ? (summary as { shareText: string }).shareText
            : ''
        store.sessionResults.set(slug, {
          id: crypto.randomUUID(),
          sessionId: ev.sessionId,
          summary,
          shareText,
          publicSlug: slug,
          createdAt: ev.createdAt,
        })
      }
      if (ev.eventType === 'waitlist_joined') {
        const email = typeof ev.payload.email === 'string' ? ev.payload.email : 'unknown'
        const wid = crypto.randomUUID()
        store.waitlist.set(wid, {
          id: wid,
          email,
          sessionId: ev.sessionId,
          experienceTypeId: finalRuntime.session.experienceTypeId,
          category: null,
          source: 'session',
          interest: null,
          groupSize: null,
          createdAt: ev.createdAt,
        })
      }
      if (ev.eventType === 'session_unlocked') {
        const orderId = ev.payload.providerOrderId as string | undefined
        const eid = crypto.randomUUID()
        store.entitlements.set(eid, {
          id: eid,
          sessionId: ev.sessionId,
          experienceTypeId: finalRuntime.session.experienceTypeId,
          type: 'unlock',
          unlockedByPlayerId: null,
          amountCents: null,
          provider: 'lemon_squeezy',
          providerOrderId: orderId ?? null,
          idempotencyKey: command.idempotencyKey,
          createdAt: ev.createdAt,
        })
      }
    }

    persist(store, adjusted, finalRuntime, {
      isCreate: command.type === 'CREATE_SESSION',
      shortCode:
        command.type === 'CREATE_SESSION' ? newSession?.shortCode : undefined,
    })

    const response = buildResponse(
      {
        ...finalRuntime,
        derivedFlags: computeDerivedFlags(finalRuntime),
      },
      adjusted,
    )

    store.idempotencyCache.set(idKey, response)

    await broadcastSessionUpdate(
      {
        ...finalRuntime,
        derivedFlags: computeDerivedFlags(finalRuntime),
      },
      adjusted,
    )

    log('info', 'command_applied', {
      sessionId: finalRuntime.session.id,
      latencyMs: Date.now() - started,
      stateAfter: finalRuntime.session.status,
    })

    return response
  })
}

export function findSessionIdByShortCode(shortCode: string): string | null {
  const store = getRsseStore()
  return store.shortCodeIndex.get(shortCode.toLowerCase()) ?? null
}
