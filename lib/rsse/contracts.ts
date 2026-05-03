export type SessionStatus =
  | 'created'
  | 'lobby'
  | 'active'
  | 'locked_active'
  | 'completed'
  | 'archived'
  | 'expired'

export type PlatformCommandType =
  | 'CREATE_SESSION'
  | 'JOIN_SESSION'
  | 'START_SESSION'
  | 'EMIT_EXPERIENCE_EVENT'
  | 'REQUEST_UNLOCK'
  | 'COMPLETE_SESSION'
  | 'ARCHIVE_SESSION'

export type SessionEventType =
  | 'session_created'
  | 'session_opened'
  | 'player_joined'
  | 'host_started'
  | 'experience_event_emitted'
  | 'checkpoint_reached'
  | 'unlock_requested'
  | 'session_locked'
  | 'unlock_clicked'
  | 'session_unlocked'
  | 'session_completed'
  | 'results_generated'
  | 'session_shared'
  | 'waitlist_joined'
  | 'session_archived'
  | 'session_expired'
  | 'session_failure_detected'

export type SocialSession = {
  id: string
  shortCode: string
  experienceTypeId: string | null
  hostPlayerId: string | null
  status: SessionStatus
  title: string | null
  maxPlayers: number
  isUnlocked: boolean
  createdAt: string
  updatedAt: string
  expiresAt: string
}

export type SessionPlayer = {
  id: string
  sessionId: string
  displayName: string
  avatarEmoji: string
  role: 'host' | 'player'
  joinedAt: string
  lastSeenAt: string
}

export type SessionEvent = {
  id: string
  sessionId: string
  playerId: string | null
  eventType: SessionEventType
  payload: Record<string, unknown>
  sequenceNumber: number
  idempotencyKey: string | null
  createdAt: string
}

export type SessionStateSnapshot = {
  id: string
  sessionId: string
  state: SnapshotState
  lastEventId: string | null
  sequenceNumber: number
  createdAt: string
}

/** JSON persisted in session_state_snapshots.state */
export type SnapshotState = {
  checkpointCount: number
  unlockCount: number
  startedAt?: string
  completedAt?: string
  lastCheckpointLabel?: string
}

export type SessionDerivedFlags = {
  isJoinable: boolean
  isLocked: boolean
  canStart: boolean
  canComplete: boolean
  hasActivePlayers: boolean
  requiresPayment: boolean
}

export type PlatformCommand = {
  type: PlatformCommandType
  sessionId?: string
  playerId?: string
  idempotencyKey: string
  lastSeenSequenceNumber?: number
  payload?: Record<string, unknown>
}

export type PlatformResponse = {
  status: SessionStatus
  snapshot: SessionStateSnapshot
  events: SessionEvent[]
  derivedFlags: SessionDerivedFlags
}

export type SessionRuntimeState = {
  session: SocialSession
  snapshot: SessionStateSnapshot
  activePlayers: SessionPlayer[]
  lastEvent: SessionEvent | null
  derivedFlags: SessionDerivedFlags
}

export type Entitlement = {
  id: string
  sessionId: string
  experienceTypeId: string | null
  type: string
  unlockedByPlayerId: string | null
  amountCents: number | null
  provider: string | null
  providerOrderId: string | null
  idempotencyKey: string | null
  createdAt: string
}

export type SessionResultRow = {
  id: string
  sessionId: string
  summary: Record<string, unknown>
  shareText: string | null
  publicSlug: string
  createdAt: string
}

export type WaitlistRow = {
  id: string
  email: string
  sessionId: string | null
  experienceTypeId: string | null
  category: string | null
  source: string | null
  interest: string | null
  groupSize: number | null
  createdAt: string
}

export type ExperienceAdapterInput = {
  sessionId: string
  snapshot: SessionStateSnapshot
  players: SessionPlayer[]
}

export type ExperienceAdapterOutput = {
  proposedEvents: Omit<SessionEvent, 'id' | 'sequenceNumber' | 'createdAt'>[]
}

export type ExperienceAdapterCommandInput = ExperienceAdapterInput & {
  commandPayload: Record<string, unknown> | undefined
  actingPlayerId: string | null
}

export type ExperienceStateHintInput = ExperienceAdapterInput

export type ExperienceStateHint = {
  checkpointCount: number
  canEmitCheckpoint: boolean
}

export interface ExperienceAdapter {
  start(input: ExperienceAdapterInput): Promise<ExperienceAdapterOutput>
  handleCommand(
    input: ExperienceAdapterCommandInput,
  ): Promise<ExperienceAdapterOutput>
  getStateHint(input: ExperienceStateHintInput): Promise<ExperienceStateHint>
}
