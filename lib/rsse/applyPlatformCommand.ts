import type {
  PlatformCommand,
  PlatformResponse,
  SessionEvent,
  SessionRuntimeState,
  SessionResultRow,
  SocialSession,
} from './contracts'
import { computeDerivedFlags } from './derivedFlags'
import {
  applyMonetizationDecision,
  defaultMonetizationPolicy,
} from './monetizationPolicy'
import { log } from './observability'
import { broadcastSessionUpdate } from './realtime'
import { RsseError } from './errors'
import { placeholderExperienceAdapter } from './experienceAdapter'
import {
  applyEventsToRuntime,
  initialRuntimeForNewSession,
} from './reducer'
import { buildSessionResultSummary } from './results'
import { getRssePersistence } from './persistence/factory'
import type { RsseTransaction } from './persistence/types'

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

function validateSequence(
  cmd: PlatformCommand,
  runtime: SessionRuntimeState | null,
  latestFromStore?: number,
) {
  if (!needsSequenceCheck(cmd) || !runtime) return
  const latest = Math.max(
    runtime.lastEvent?.sequenceNumber ?? 0,
    latestFromStore ?? 0,
  )
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
  tx: RsseTransaction,
): Promise<Omit<SessionEvent, 'sequenceNumber' | 'createdAt'>[]> {
  if (cmd.type === 'CREATE_SESSION') {
    throw new RsseError('Use create branch', 'event_rejected')
  }
  if (!cmd.sessionId) {
    throw new RsseError('sessionId required', 'event_rejected', { command: cmd.type })
  }
  const sessionId = cmd.sessionId
  const rt = runtime ?? (await tx.loadRuntime(sessionId))
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
    const players = await tx.loadPlayers(sessionId)
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
      if (cmd.source !== 'lemon_webhook') {
        throw new RsseError('Entitlement fulfillment requires trusted source', 'event_rejected', {
          command: cmd.type,
        })
      }
      const orderId =
        typeof p.providerOrderId === 'string' ? p.providerOrderId : ''
      if (!orderId) {
        throw new RsseError('Missing order id', 'event_rejected', { command: cmd.type })
      }
      const existingOrder = await tx.findEntitlementByProviderOrderId(orderId)
      if (existingOrder) {
        if (existingOrder.sessionId !== sessionId) {
          throw new RsseError(
            'Provider order already fulfilled for another session',
            'entitlement_conflict',
          )
        }
        return []
      }
      if (cmd.idempotencyKey) {
        const existingKey = await tx.findEntitlementByIdempotencyKey(
          cmd.idempotencyKey,
        )
        if (existingKey) {
          if (existingKey.sessionId !== sessionId) {
            throw new RsseError(
              'Entitlement idempotency key already used for another session',
              'entitlement_conflict',
            )
          }
          if (existingKey.providerOrderId === orderId) {
            return []
          }
          throw new RsseError(
            'Command idempotency key already used for a different provider order',
            'idempotency_conflict',
          )
        }
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
    const players = await tx.loadPlayers(cmd.sessionId)
    const events = await tx.loadEventsOrdered(cmd.sessionId)
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') ??
      'https://example.com'
    const nextSeq = (await tx.getLatestSequenceNumber(cmd.sessionId)) + 1
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

async function createSessionDraft(
  cmd: PlatformCommand,
  tx: RsseTransaction,
): Promise<{
  session: SocialSession
  drafts: Omit<SessionEvent, 'sequenceNumber' | 'createdAt'>[]
}> {
  const ts = nowIso()
  let code = shortCode()
  while (await tx.isShortCodeTaken(code)) {
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

async function persistAfterReduce(
  tx: RsseTransaction,
  adjusted: SessionEvent[],
  finalRuntime: Omit<SessionRuntimeState, 'derivedFlags'>,
  opts?: { shortCode?: string; isCreate?: boolean },
): Promise<void> {
  const sorted = [...adjusted].sort((a, b) => a.sequenceNumber - b.sequenceNumber)
  if (opts?.isCreate) {
    await tx.insertSocialSession(finalRuntime.session)
    await tx.lockSessionForWrite(finalRuntime.session.id)
    if (opts.shortCode) {
      await tx.registerShortCodeIndex(opts.shortCode, finalRuntime.session.id)
    }
  } else {
    await tx.updateSocialSession(finalRuntime.session)
  }
  for (const ev of sorted) {
    if (ev.eventType === 'player_joined') {
      const pid = ev.payload.playerId as string
      const pl = finalRuntime.activePlayers.find((p) => p.id === pid)
      if (pl) await tx.upsertPlayer(pl)
    }
    await tx.insertEvent(ev)
  }
  await tx.upsertSnapshot(finalRuntime.snapshot)
}

function buildResponse(final: SessionRuntimeState, events: SessionEvent[]): PlatformResponse {
  return {
    status: final.session.status,
    snapshot: final.snapshot,
    events,
    derivedFlags: computeDerivedFlags(final),
  }
}

type CommandTransactionResult = {
  response: PlatformResponse
  broadcastRuntime: SessionRuntimeState | null
  broadcastEvents: SessionEvent[]
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

  const persistence = getRssePersistence()
  const txResult = await persistence.withTransaction<CommandTransactionResult>(async (tx) => {
    const idKey =
      command.type === 'CREATE_SESSION'
        ? idempotencyKeyCreate(command)
        : idempotencyKeySession(command)
    const cached = await tx.getIdempotencyResponse(idKey)
    if (cached) {
      log('info', 'idempotency_hit', { sessionId: command.sessionId })
      return {
        response: cached,
        broadcastRuntime: null,
        broadcastEvents: [],
      }
    }

    let runtime: SessionRuntimeState | null = null
    let latestSeqLocked = 0

    if (command.sessionId) {
      await tx.lockSessionForWrite(command.sessionId)
      if (command.idempotencyKey) {
        const dup = await tx.findEventBySessionIdempotency(
          command.sessionId,
          command.idempotencyKey,
        )
        if (dup) {
          const rt = await tx.loadRuntime(command.sessionId)
          if (rt) {
            const all = await tx.loadEventsOrdered(command.sessionId)
            const resp = buildResponse(
              rt,
              all.filter((e) => e.sequenceNumber >= dup.sequenceNumber),
            )
            await tx.setIdempotencyResponse(idKey, resp)
            return {
              response: resp,
              broadcastRuntime: null,
              broadcastEvents: [],
            }
          }
        }
      }
      runtime = await tx.loadRuntime(command.sessionId)
      latestSeqLocked = await tx.getLatestSequenceNumber(command.sessionId)
      validateSequence(command, runtime, latestSeqLocked)
    }

    let drafts: Omit<SessionEvent, 'sequenceNumber' | 'createdAt'>[] = []
    let newSession: SocialSession | null = null

    try {
      if (command.type === 'CREATE_SESSION') {
        const created = await createSessionDraft(command, tx)
        newSession = created.session
        drafts = created.drafts
      } else {
        drafts = await buildProposedDrafts(command, runtime, tx)
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

    const fulfillmentDuplicateNoop =
      command.type === 'EMIT_EXPERIENCE_EVENT' &&
      (command.payload as Record<string, unknown> | undefined)
        ?.entitlementFulfillment === true &&
      drafts.length === 0

    if (fulfillmentDuplicateNoop && command.sessionId && runtime) {
      const noopResponse = buildResponse(runtime, [])
      await tx.setIdempotencyResponse(idKey, noopResponse)
      log('info', 'command_applied_duplicate_fulfillment_noop', {
        sessionId: command.sessionId,
        latencyMs: Date.now() - started,
      })
      return {
        response: noopResponse,
        broadcastRuntime: null,
        broadcastEvents: [],
      }
    }

    const sessionId =
      command.type === 'CREATE_SESSION' ? newSession!.id : command.sessionId!

    const startSeq =
      command.type === 'CREATE_SESSION'
        ? 1
        : (await tx.getLatestSequenceNumber(sessionId)) + 1

    const proposed = assignSequences(drafts, startSeq)

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

    const next = applyEventsToRuntime(workingBase, proposed)
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

    const finalBase = workingBase
    const finalRuntime = applyEventsToRuntime(finalBase, adjusted)

    for (const ev of adjusted) {
      if (ev.eventType === 'results_generated') {
        const summary = ev.payload.summary as Record<string, unknown>
        const slug = crypto.randomUUID().slice(0, 8)
        const shareText =
          typeof (summary as { shareText?: string }).shareText === 'string'
            ? (summary as { shareText: string }).shareText
            : ''
        const row: SessionResultRow = {
          id: crypto.randomUUID(),
          sessionId: ev.sessionId,
          summary,
          shareText,
          publicSlug: slug,
          createdAt: ev.createdAt,
        }
        await tx.insertSessionResult(row)
      }
      if (ev.eventType === 'waitlist_joined') {
        const email = typeof ev.payload.email === 'string' ? ev.payload.email : 'unknown'
        const wid = crypto.randomUUID()
        await tx.insertWaitlist({
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
        await tx.insertEntitlement({
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

    await persistAfterReduce(tx, adjusted, finalRuntime, {
      isCreate: command.type === 'CREATE_SESSION',
      shortCode:
        command.type === 'CREATE_SESSION' ? newSession?.shortCode : undefined,
    })

    const runtimeWithFlags = {
      ...finalRuntime,
      derivedFlags: computeDerivedFlags(finalRuntime),
    }
    const txResponse = buildResponse(runtimeWithFlags, adjusted)

    await tx.setIdempotencyResponse(idKey, txResponse)

    log('info', 'command_applied', {
      sessionId: finalRuntime.session.id,
      latencyMs: Date.now() - started,
      stateAfter: finalRuntime.session.status,
    })

    return {
      response: txResponse,
      broadcastRuntime: adjusted.length > 0 ? runtimeWithFlags : null,
      broadcastEvents: adjusted,
    }
  })

  // Broadcast AFTER the transaction has committed so realtime side-effects never
  // roll back with the DB transaction, and a broadcast failure cannot fail the
  // command response that has already been persisted and returned.
  if (txResult.broadcastRuntime && txResult.broadcastEvents.length > 0) {
    try {
      await broadcastSessionUpdate(
        txResult.broadcastRuntime,
        txResult.broadcastEvents,
      )
    } catch (broadcastErr) {
      const message =
        broadcastErr instanceof Error ? broadcastErr.message : String(broadcastErr)
      log('warn', 'realtime_broadcast_failed', {
        sessionId: txResult.response.snapshot.sessionId,
        message,
      })
    }
  }

  return txResult.response
}
