# Cursor Build Prompt: RSSE Foundation Phase

You are building the next foundation for this repository. Do not build games, arcade UI, catalogs, avatars, social graphs, prompt banks, or fake content. Build the reusable private-room runtime that future high-quality social experiences will plug into later.

Current product direction:

> Play It Forward is becoming a private social experience platform. This phase builds RSSE: a deterministic real-time social session runtime with monetized state transitions, strict state governance, sharing, results, and waitlist capture.

The game/experience layer is intentionally deferred. The product should feel like a working private-room engine, not an empty games platform.

## Absolute Rules

1. Commands are intent. Events are facts.
2. All session mutation goes through `applyPlatformCommand()`.
3. No route, UI component, experience adapter, realtime helper, monetization helper, or webhook may mutate session lifecycle state directly.
4. No state transition without an event.
5. Snapshots are written only by the platform engine after a successful command.
6. Realtime updates are eventually consistent and never authoritative.
7. Derived flags are computed, never stored.
8. Monetization reacts to events; it must not shape experience event generation.
9. Experiences are pure state machines: same input state plus same command/event means same output events.
10. Every external action must use idempotency keys.
11. Every live-state modifying command must include sequence checks when a session already exists.
12. Do not introduce games, arcade browsing, content menus, catalog cards, world UI, currency, or fake engagement numbers.
13. Preserve existing repository behavior unless a change is required for this RSSE phase. Do not rewrite unrelated landing/product code.

## First Step: Inspect Existing Repo

Before writing code, inspect:

- `package.json`
- `app/`
- `lib/`
- `features/`
- `components/`
- `docs/`
- `tests/`
- existing config and validation utilities

Follow existing Next.js App Router, TypeScript, Tailwind, and test conventions. Keep changes focused and easy to review.

## Core Mental Model

Runtime loop:

```text
Client intent
→ PlatformCommand
→ validation: state + sequence + idempotency
→ SessionEvent emitted as fact
→ snapshot/status update
→ monetization policy reacts
→ realtime broadcast
→ client rehydrates from snapshot
```

This phase proves the infrastructure with a minimal placeholder session flow:

```text
create room
join room
presence
host starts session
generic checkpoint emitted
optional structural lock/unlock
complete session
generate generic result
share link
waitlist capture
```

No game mechanics.

## Database / Persistence Model

Implement this data model in the project’s chosen persistence style. If Supabase migrations are already used, add migrations. If this repo does not yet contain Supabase wiring, create typed SQL migration files under a clear `supabase/migrations/` or `db/migrations/` path and add the runtime TypeScript interfaces so implementation can proceed cleanly.

Required tables:

```sql
CREATE TABLE experience_types (
  id text PRIMARY KEY,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'inactive',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE social_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  short_code text UNIQUE NOT NULL,
  experience_type_id text REFERENCES experience_types(id),
  host_player_id uuid,
  status text NOT NULL DEFAULT 'created',
  title text,
  max_players int NOT NULL DEFAULT 8,
  is_unlocked boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + interval '24 hours'
);

CREATE TABLE session_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES social_sessions(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  avatar_emoji text NOT NULL DEFAULT '*',
  role text NOT NULL DEFAULT 'player',
  joined_at timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now()
);

CREATE TABLE session_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES social_sessions(id) ON DELETE CASCADE,
  player_id uuid REFERENCES session_players(id),
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  sequence_number bigint NOT NULL,
  idempotency_key text,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX session_events_session_sequence_idx
ON session_events(session_id, sequence_number);

CREATE UNIQUE INDEX session_events_idempotency_idx
ON session_events(session_id, idempotency_key)
WHERE idempotency_key IS NOT NULL;

CREATE TABLE session_state_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES social_sessions(id) ON DELETE CASCADE,
  state jsonb NOT NULL,
  last_event_id uuid REFERENCES session_events(id),
  sequence_number bigint NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX session_state_snapshots_session_id_idx
ON session_state_snapshots(session_id);

CREATE TABLE entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES social_sessions(id) ON DELETE CASCADE,
  experience_type_id text REFERENCES experience_types(id),
  type text NOT NULL,
  unlocked_by_player_id uuid REFERENCES session_players(id),
  amount_cents int,
  provider text,
  provider_order_id text UNIQUE,
  idempotency_key text,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX entitlements_idempotency_idx
ON entitlements(idempotency_key)
WHERE idempotency_key IS NOT NULL;

CREATE TABLE session_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES social_sessions(id) ON DELETE CASCADE,
  summary jsonb NOT NULL DEFAULT '{}',
  share_text text,
  public_slug text UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  session_id uuid REFERENCES social_sessions(id) ON DELETE SET NULL,
  experience_type_id text,
  category text,
  source text,
  interest text,
  group_size int,
  created_at timestamptz DEFAULT now()
);
```

Notes:

- Use `*` as the default avatar if the database/file encoding makes emoji defaults awkward. UI can still allow emoji input.
- `session_events.sequence_number` is per session, assigned inside the same transaction that persists the event.
- `social_sessions.status` is cached query truth. The latest snapshot is runtime truth. Events are immutable audit/rebuild truth.
- If snapshot and `social_sessions.status` disagree, the engine should repair cached status from snapshot and emit `session_failure_detected` with `snapshot_status_mismatch`.

## Session Status

Create shared types in `lib/rsse/contracts.ts`:

```ts
export type SessionStatus =
  | 'created'
  | 'lobby'
  | 'active'
  | 'locked_active'
  | 'completed'
  | 'archived'
  | 'expired'
```

Status meaning:

- `created`: room exists but is not fully open yet
- `lobby`: players can join and host can start
- `active`: session is running
- `locked_active`: session is live but progression is locked pending entitlement/unlock
- `completed`: session finished and results are available
- `archived`: old session, view-only
- `expired`: abandoned or timed out

Allowed transitions in `lib/rsse/stateMachine.ts`:

```ts
export const allowedTransitions: Record<SessionStatus, SessionStatus[]> = {
  created: ['lobby', 'expired'],
  lobby: ['active', 'expired'],
  active: ['locked_active', 'completed', 'expired'],
  locked_active: ['active', 'completed', 'expired'],
  completed: ['archived'],
  archived: [],
  expired: [],
}
```

Disallowed:

- `completed -> active`
- `expired -> active`
- `archived -> active`
- any lifecycle mutation outside `applyPlatformCommand()`

## Commands vs Events

Commands are intent. Events are facts.

Create:

```text
lib/rsse/contracts.ts
lib/rsse/commands.ts
lib/rsse/events.ts
lib/rsse/stateMachine.ts
lib/rsse/applyPlatformCommand.ts
lib/rsse/snapshots.ts
lib/rsse/derivedFlags.ts
lib/rsse/monetizationPolicy.ts
lib/rsse/realtime.ts
lib/rsse/rehydrate.ts
lib/rsse/results.ts
lib/rsse/observability.ts
lib/rsse/errors.ts
```

Required command types:

```ts
export type PlatformCommandType =
  | 'CREATE_SESSION'
  | 'JOIN_SESSION'
  | 'START_SESSION'
  | 'EMIT_EXPERIENCE_EVENT'
  | 'REQUEST_UNLOCK'
  | 'COMPLETE_SESSION'
  | 'ARCHIVE_SESSION'
```

Required event types:

```ts
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
```

Core command shape:

```ts
export type PlatformCommand = {
  type: PlatformCommandType
  sessionId?: string
  playerId?: string
  idempotencyKey: string
  lastSeenSequenceNumber?: number
  payload?: Record<string, unknown>
}
```

Core response shape:

```ts
export type PlatformResponse = {
  status: SessionStatus
  snapshot: SessionStateSnapshot
  events: SessionEvent[]
  derivedFlags: SessionDerivedFlags
}
```

Derived flags:

```ts
export type SessionDerivedFlags = {
  isJoinable: boolean
  isLocked: boolean
  canStart: boolean
  canComplete: boolean
  hasActivePlayers: boolean
  requiresPayment: boolean
}
```

Derived flags are computed only. Never store them.

## Single Writer: `applyPlatformCommand()`

Implement `lib/rsse/applyPlatformCommand.ts` as the only session state writer.

Skeleton:

```ts
export async function applyPlatformCommand(
  command: PlatformCommand,
): Promise<PlatformResponse> {
  return withTransaction(async (tx) => {
    const runtime = await loadRuntimeState(tx, command)

    validateIdempotency(runtime, command)
    validateSequence(runtime, command)
    validateCommandAllowed(runtime, command)

    const proposedEvents = buildEventsFromCommand(runtime, command)
    const nextRuntime = reduceEvents(runtime, proposedEvents)

    const monetizationDecision = evaluateMonetization({
      previous: runtime,
      next: nextRuntime,
      command,
      events: proposedEvents,
    })

    const finalEvents = applyMonetizationDecision(
      proposedEvents,
      monetizationDecision,
    )

    const finalRuntime = reduceEvents(runtime, finalEvents)

    await persistEvents(tx, finalEvents)
    await persistSnapshot(tx, finalRuntime.snapshot)
    await persistSessionStatus(tx, finalRuntime.session.status)

    await broadcastSessionUpdate(finalRuntime, finalEvents)
    await logCommandExecution(command, runtime, finalRuntime)

    return {
      status: finalRuntime.session.status,
      snapshot: finalRuntime.snapshot,
      events: finalEvents,
      derivedFlags: computeDerivedFlags(finalRuntime),
    }
  })
}
```

Adapt the transaction helper to the repository’s actual persistence layer. If no DB client exists yet, implement the types, command reducer, and testable in-memory/store adapter boundaries first, then wire persistence behind an interface.

## Runtime vs Persisted State

Create runtime state type:

```ts
export type SessionRuntimeState = {
  session: SocialSession
  snapshot: SessionStateSnapshot
  activePlayers: SessionPlayer[]
  lastEvent: SessionEvent | null
  derivedFlags: SessionDerivedFlags
}
```

Persisted state:

- `social_sessions`
- `session_players`
- `session_events`
- `session_state_snapshots`
- `entitlements`
- `session_results`

Do not let UI/routes infer lifecycle from raw tables. Use runtime state returned by RSSE functions.

## Event Ordering and Idempotency

Requirements:

- Assign `sequence_number` per session inside the same transaction that inserts events.
- Reject stale commands where `lastSeenSequenceNumber` is behind the latest event sequence, except for commands explicitly safe to retry/reconnect.
- Use idempotency keys for create, join, unlock, webhook, completion, result generation, sharing, and waitlist actions.
- If an idempotency key already exists, return the existing resulting state rather than duplicating side effects.

## Monetization Policy

Create `lib/rsse/monetizationPolicy.ts`.

V1 policy can be simple and structural. Do not implement final pricing UX unless needed. The key is boundary discipline.

```ts
export type MonetizationDecision =
  | { action: 'ALLOW' }
  | { action: 'LOCK_SESSION'; priceCents: number; reason: string }
  | { action: 'BLOCK_EVENT'; reason: string }

export interface MonetizationPolicy {
  evaluate(input: {
    previous: SessionRuntimeState
    next: SessionRuntimeState
    command: PlatformCommand
    events: SessionEvent[]
  }): MonetizationDecision
}
```

Rules:

- Monetization reacts after event proposal/reduction.
- Monetization may cause platform events such as `session_locked`.
- Monetization must not mutate DB directly.
- Payment/webhook code only creates/updates entitlements through RSSE command flow or a narrow entitlement service that emits `session_unlocked` through RSSE.

## Realtime Contract

Create `lib/rsse/realtime.ts`.

Realtime event names:

```ts
export type RealtimeChannelEvent =
  | 'session.updated'
  | 'player.joined'
  | 'player.left'
  | 'session.locked'
  | 'session.unlocked'
  | 'session.completed'
  | 'session.failure_detected'
```

Rules:

- Only RSSE engine broadcasts realtime events.
- Realtime updates are never authoritative.
- Dropped messages must be safe.
- Reconnect rebuilds from snapshot plus events since last sequence.

## Rehydration Contract

Create `lib/rsse/rehydrate.ts`.

Reconnect/session load flow:

```text
1. Load session_state_snapshot.
2. Fetch events after lastSeenSequenceNumber.
3. Replay minimal delta into runtime state.
4. Reconcile presence/active players.
5. Return runtime state + derived flags.
```

Skeleton:

```ts
export async function rehydrateSession(input: {
  sessionId: string
  lastSeenSequenceNumber?: number
}): Promise<SessionRuntimeState> {
  const snapshot = await loadLatestSnapshot(input.sessionId)
  const events = await loadEventsAfterSequence({
    sessionId: input.sessionId,
    sequenceNumber: input.lastSeenSequenceNumber ?? snapshot.sequenceNumber,
  })
  const runtime = replayDelta(snapshot, events)
  const activePlayers = await reconcilePresence(input.sessionId)

  return {
    ...runtime,
    activePlayers,
    derivedFlags: computeDerivedFlags({ ...runtime, activePlayers }),
  }
}
```

## Failure Protocol

Create `lib/rsse/errors.ts`.

Failure codes:

```ts
export type SessionFailureCode =
  | 'event_rejected'
  | 'invalid_transition'
  | 'payment_failed'
  | 'sync_lag_detected'
  | 'snapshot_status_mismatch'
  | 'idempotency_conflict'
```

Emit `session_failure_detected` with payload:

```ts
{
  code: SessionFailureCode
  message: string
  command?: PlatformCommandType
  stateBefore?: unknown
  attemptedState?: unknown
}
```

Do not add failure as a top-level lifecycle status in v1 unless the session is truly expired/archived.

## Observability

Create `lib/rsse/observability.ts` with structured logging:

```ts
log({
  sessionId,
  eventType,
  latencyMs,
  stateBefore,
  stateAfter,
  source,
})
```

At minimum, log:

- command received
- command rejected
- transition applied
- snapshot written
- idempotency conflict
- sequence mismatch
- entitlement created
- session unlocked
- results generated

Prefer the repo’s existing analytics pattern if one exists. Otherwise keep a tiny local abstraction that can later be wired to analytics.

## API Routes

Build these routes. Each must call the RSSE command layer or narrow services that use it. Validate input with existing validation patterns or `zod`.

```text
/api/sessions/create
/api/sessions/join
/api/sessions/command
/api/sessions/unlock
/api/webhooks/lemon-squeezy
/api/waitlist
```

Route behavior:

### `/api/sessions/create`

Creates a private room and returns `{ sessionId, shortCode, snapshot, derivedFlags }`.

Command: `CREATE_SESSION`.

Events: `session_created`, `session_opened` if moving to lobby immediately.

### `/api/sessions/join`

Body: `{ shortCode, displayName, avatarEmoji, idempotencyKey, lastSeenSequenceNumber? }`.

Validates:

- session exists
- joinable
- max players not exceeded
- display name 1-20 chars

Command: `JOIN_SESSION`.

Event: `player_joined`.

### `/api/sessions/command`

Generic command endpoint for start, generic experience event, complete, archive.

Accepts `PlatformCommand` and returns `PlatformResponse`.

### `/api/sessions/unlock`

Creates checkout URL or returns structural placeholder if payment env is not configured.

Must not mutate lifecycle directly. It can emit `unlock_clicked` / `unlock_requested` via RSSE.

### `/api/webhooks/lemon-squeezy`

Validates signature if webhook secret exists. If env is missing, fail safely in production.

On paid order:

- create entitlement idempotently
- emit `session_unlocked`
- transition `locked_active -> active` through RSSE

### `/api/waitlist`

Validates email, stores waitlist row, emits/logs `waitlist_joined` if session_id is present.

## Screens

Build minimal screens. They should look polished, quiet, and utilitarian. No fake games.

```text
/create
/[code]
/[code]/join
/[code]/session
/[code]/results
```

Screen behavior:

### `/create`

Create a private session. Copy should be structure-first:

```text
Create a private room
Invite your group
Run a synchronized session
```

No game promises.

### `/[code]`

Session landing/lobby router. Show status-aware entry:

- lobby: player list and start option for host
- active/locked_active: continue to session
- completed: view results
- expired/archived: view-only or expired message

### `/[code]/join`

Join form:

- display name
- avatar emoji options
- join button

No payment copy.

### `/[code]/session`

Generic runtime surface:

```text
Private session active
Checkpoint reached
Session locked
Session unlocked
Session complete
```

Host/player controls may trigger:

- start
- emit checkpoint
- request unlock
- complete

This is a structural test harness, not a game.

### `/[code]/results`

Public/shareable results page.

Show:

- session summary
- participants count
- key generic events
- share button/link
- replay intent CTA placeholder
- waitlist capture

Results page rule:

Allowed:

- share
- replay intent
- single future-experience teaser
- email capture

Disallowed:

- game catalog
- multiple game options
- arcade browsing
- world navigation
- fake content hierarchy

## Results Engine

Create `lib/rsse/results.ts`.

Generate a generic summary from session + events:

```ts
type SessionResultSummary = {
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
```

Share text should be generic:

```text
We ran a private Play It Forward session.

{playerCount} people joined.
{checkpointCount} moments completed.

Create your own private room:
{url}
```

No game-specific claims.

## Experience Adapter Boundary

Add the interface but do not build real experiences.

```ts
export interface ExperienceAdapter {
  start(input: ExperienceAdapterInput): Promise<ExperienceAdapterOutput>
  handleCommand(input: ExperienceAdapterCommandInput): Promise<ExperienceAdapterOutput>
  getStateHint(input: ExperienceStateHintInput): Promise<ExperienceStateHint>
}
```

Rules:

- adapters are pure state machines
- adapters emit proposed experience events
- adapters do not mutate session status
- adapters do not create entitlements
- adapters do not broadcast realtime
- adapters do not generate public results directly

V1 can include a `placeholderExperienceAdapter` that emits generic checkpoint events only.

## Tests

Add focused tests under `tests/` for the kernel. Use Vitest.

Minimum tests:

- allowed transitions pass
- invalid transitions reject
- command emits event and updates snapshot
- idempotency prevents duplicate event effects
- stale sequence rejects live mutation
- derived flags compute correctly
- monetization decision can lock session without direct DB mutation
- rehydration applies event delta after snapshot
- results summary builds from generic events

Do not attempt to test external Lemon Squeezy networking. Test webhook handler parsing/idempotency with local fixtures if feasible.

## Verification

Run:

```bash
npm run test
npm run build
```

Known repo build note: production `next build` may require `NEXT_PUBLIC_BASE_URL` and `NEXT_PUBLIC_CHECKOUT_URL` to be set to non-local placeholder values. If needed, run build with:

```bash
$env:NEXT_PUBLIC_BASE_URL='https://example.com'; $env:NEXT_PUBLIC_CHECKOUT_URL='https://payhip.com/b/smoke-test'; npm run build
```

On Windows PowerShell, use semicolons, not `&&`.

## Final Report Required

When done, report:

- files created/changed
- commands run and result
- any spec deviations and why
- any missing environment variables
- how to manually test create → join → start → checkpoint → lock/unlock → complete → results

## Non-Goals For This Phase

Do not build:

- The Verdict
- Blind Crown
- any game mechanics
- arcade UI
- game catalog
- fake engagement stats
- multiple game cards
- prompt banks
- avatar marketplace
- social graph
- chat
- coins/currency
- creator tools
- recommendation system

This phase is complete when the private-room runtime works end to end with generic checkpoints, strict command/event/snapshot governance, sharing/results, waitlist capture, tests, and a clean path for future experience adapters.