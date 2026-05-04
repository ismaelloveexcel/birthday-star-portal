import { describe, it, expect, beforeEach } from "vitest";
import { applyPlatformCommand } from "@/lib/rsse/applyPlatformCommand";
import { findSessionIdByShortCode, resetRssePersistenceSingleton } from "@/lib/rsse/persistence/factory";
import { resetRsseStore, getRsseStore } from "@/lib/rsse/memoryPersistence";
import { isTransitionAllowed, allowedTransitions } from "@/lib/rsse/stateMachine";
import { computeDerivedFlags } from "@/lib/rsse/derivedFlags";
import { applyMonetizationDecision } from "@/lib/rsse/monetizationPolicy";
import { RsseError } from "@/lib/rsse/errors";
import { replayDelta } from "@/lib/rsse/rehydrate";
import { buildSessionResultSummary } from "@/lib/rsse/results";
import type { SessionEvent, SocialSession, SessionStateSnapshot } from "@/lib/rsse/contracts";
import { createInitialSnapshot } from "@/lib/rsse/snapshots";
import { loadSessionRuntime } from "@/lib/rsse/sessionRuntime";

beforeEach(() => {
  resetRssePersistenceSingleton();
  resetRsseStore();
});

describe("stateMachine", () => {
  it("allows valid transitions", () => {
    expect(isTransitionAllowed("lobby", "active")).toBe(true);
    expect(isTransitionAllowed("active", "completed")).toBe(true);
  });
  it("rejects invalid transitions", () => {
    expect(isTransitionAllowed("completed", "active")).toBe(false);
    expect(isTransitionAllowed("expired", "active")).toBe(false);
    expect(isTransitionAllowed("archived", "active")).toBe(false);
  });
  it("matches allowedTransitions table shape", () => {
    expect(allowedTransitions.archived).toEqual([]);
  });
});

describe("applyPlatformCommand", () => {
  it("emits events and updates snapshot on create", async () => {
    const r = await applyPlatformCommand({
      type: "CREATE_SESSION",
      idempotencyKey: "idem-create-1",
    });
    expect(r.status).toBe("lobby");
    expect(r.events.some((e) => e.eventType === "session_created")).toBe(true);
    expect(r.snapshot.sequenceNumber).toBeGreaterThan(0);
  });

  it("idempotency prevents duplicate create side effects", async () => {
    const a = await applyPlatformCommand({
      type: "CREATE_SESSION",
      idempotencyKey: "idem-create-2",
    });
    const b = await applyPlatformCommand({
      type: "CREATE_SESSION",
      idempotencyKey: "idem-create-2",
    });
    expect(a.snapshot.sessionId).toBe(b.snapshot.sessionId);
    const store = getRsseStore();
    const count = [...store.sessionEvents.values()].filter(
      (e) => e.sessionId === a.snapshot.sessionId,
    ).length;
    expect(count).toBe(2);
  });

  it("rejects stale sequence on live mutation", async () => {
    const c = await applyPlatformCommand({
      type: "CREATE_SESSION",
      idempotencyKey: "idem-seq-a",
    });
    const sid = c.snapshot.sessionId;
    const short =
      c.events.find((e) => e.eventType === "session_created")?.payload
        .shortCode;
    expect(typeof short).toBe("string");
    await applyPlatformCommand({
      type: "JOIN_SESSION",
      sessionId: sid,
      idempotencyKey: "join-1",
      payload: { displayName: "A", avatarEmoji: "*" },
    });
    await expect(
      applyPlatformCommand({
        type: "JOIN_SESSION",
        sessionId: sid,
        idempotencyKey: "join-2",
        lastSeenSequenceNumber: 0,
        payload: { displayName: "B", avatarEmoji: "*" },
      }),
    ).rejects.toThrow(RsseError);
  });
});

describe("derivedFlags", () => {
  it("computes joinable and host start", async () => {
    const c = await applyPlatformCommand({
      type: "CREATE_SESSION",
      idempotencyKey: "df-1",
    });
    const sid = c.snapshot.sessionId;
    await applyPlatformCommand({
      type: "JOIN_SESSION",
      sessionId: sid,
      idempotencyKey: "df-join",
      payload: { displayName: "Host", avatarEmoji: "*" },
    });
    const store = getRsseStore();
    const rt = loadSessionRuntime(store, sid)!;
    const flags = computeDerivedFlags(rt);
    expect(flags.isJoinable).toBe(true);
    expect(flags.canStart).toBe(true);
  });
});

describe("monetizationPolicy", () => {
  it("can append session_locked without touching entitlements store in policy", () => {
    const proposed: SessionEvent[] = [
      {
        id: "1",
        sessionId: "s",
        playerId: null,
        eventType: "unlock_requested",
        payload: {},
        sequenceNumber: 1,
        idempotencyKey: null,
        createdAt: new Date().toISOString(),
      },
    ];
    const out = applyMonetizationDecision(
      proposed,
      {
        action: "LOCK_SESSION",
        priceCents: 100,
        reason: "test",
      },
      { sessionId: "s", playerId: null, now: new Date().toISOString() },
    );
    expect(out.some((e) => e.eventType === "session_locked")).toBe(true);
  });

  it("default policy locks when unlock requested in locked flow", async () => {
    const c = await applyPlatformCommand({
      type: "CREATE_SESSION",
      idempotencyKey: "m-1",
    });
    const sid = c.snapshot.sessionId;
    const j = await applyPlatformCommand({
      type: "JOIN_SESSION",
      sessionId: sid,
      idempotencyKey: "m-j",
      payload: { displayName: "H", avatarEmoji: "*" },
    });
    const host = j.events.find((e) => e.eventType === "player_joined")?.payload
      .playerId as string;
    let last = j.lastEvent?.sequenceNumber ?? j.events.at(-1)!.sequenceNumber;
    await applyPlatformCommand({
      type: "START_SESSION",
      sessionId: sid,
      playerId: host,
      idempotencyKey: "m-start",
      lastSeenSequenceNumber: last,
    });
    const evs = [...getRsseStore().sessionEvents.values()].filter((e) => e.sessionId === sid);
    const mx = Math.max(...evs.map((e) => e.sequenceNumber));
    await applyPlatformCommand({
      type: "REQUEST_UNLOCK",
      sessionId: sid,
      playerId: host,
      idempotencyKey: "m-unlock",
      lastSeenSequenceNumber: mx,
    });
    const names = [...getRsseStore().sessionEvents.values()]
      .filter((e) => e.sessionId === sid)
      .map((e) => e.eventType);
    expect(names).toContain("session_locked");
  });
});

describe("replayDelta / results", () => {
  it("replays delta after snapshot baseline", () => {
    const session: SocialSession = {
      id: "s",
      shortCode: "abc",
      experienceTypeId: "placeholder",
      hostPlayerId: null,
      status: "active",
      title: null,
      maxPlayers: 8,
      isUnlocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
    };
    const snap: SessionStateSnapshot = {
      ...createInitialSnapshot("s", null, 2),
      state: { checkpointCount: 1, unlockCount: 0 },
    };
    const delta: SessionEvent[] = [
      {
        id: "e3",
        sessionId: "s",
        playerId: null,
        eventType: "checkpoint_reached",
        payload: { label: "x" },
        sequenceNumber: 3,
        idempotencyKey: null,
        createdAt: new Date().toISOString(),
      },
    ];
    const out = replayDelta(session, snap, [], delta);
    expect(out.snapshot.state.checkpointCount).toBe(2);
  });

  it("builds results summary from generic events", () => {
    const now = new Date().toISOString();
    const events: SessionEvent[] = [
      {
        id: "1",
        sessionId: "s",
        playerId: null,
        eventType: "host_started",
        payload: {},
        sequenceNumber: 1,
        idempotencyKey: null,
        createdAt: now,
      },
      {
        id: "2",
        sessionId: "s",
        playerId: null,
        eventType: "checkpoint_reached",
        payload: {},
        sequenceNumber: 2,
        idempotencyKey: null,
        createdAt: now,
      },
      {
        id: "3",
        sessionId: "s",
        playerId: null,
        eventType: "session_completed",
        payload: {},
        sequenceNumber: 3,
        idempotencyKey: null,
        createdAt: now,
      },
    ];
    const s = buildSessionResultSummary({
      sessionId: "s",
      shortCode: "abc",
      status: "completed",
      playerCount: 3,
      events,
      baseUrl: "https://example.com/create",
    });
    expect(s.checkpointCount).toBe(1);
    expect(s.shareText).toContain("3 people joined");
  });
});

describe("findSessionIdByShortCode", () => {
  it("resolves short code after create", async () => {
    const c = await applyPlatformCommand({
      type: "CREATE_SESSION",
      idempotencyKey: "sc-1",
    });
    const short = c.events.find((e) => e.eventType === "session_created")?.payload
      .shortCode as string;
    const sid = await findSessionIdByShortCode(short);
    expect(sid).toBe(c.snapshot.sessionId);
  });
});
