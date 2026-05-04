import { describe, it, expect, beforeEach } from "vitest";
import pg from "pg";
import { applyPlatformCommand } from "@/lib/rsse/applyPlatformCommand";
import { getRssePersistence, resetRssePersistenceSingleton } from "@/lib/rsse/persistence/factory";

const databaseUrl = process.env.DATABASE_URL?.trim();

async function countEntitlements(sessionId: string): Promise<number> {
  const client = new pg.Client({ connectionString: databaseUrl! });
  await client.connect();
  try {
    const r = await client.query(
      `SELECT count(*)::int AS c FROM entitlements WHERE session_id = $1::uuid`,
      [sessionId],
    );
    return r.rows[0]!.c as number;
  } finally {
    await client.end();
  }
}

async function countSessionUnlockedEvents(sessionId: string): Promise<number> {
  const client = new pg.Client({ connectionString: databaseUrl! });
  await client.connect();
  try {
    const r = await client.query(
      `SELECT count(*)::int AS c FROM session_events
       WHERE session_id = $1::uuid AND event_type = 'session_unlocked'`,
      [sessionId],
    );
    return r.rows[0]!.c as number;
  } finally {
    await client.end();
  }
}

async function latestMaxSequence(p: ReturnType<typeof getRssePersistence>, sessionId: string) {
  const evs = await p.readEventsOrdered(sessionId);
  return evs.reduce((m, e) => Math.max(m, e.sequenceNumber), 0);
}

describe.skipIf(!databaseUrl)("RSSE Postgres integration", () => {
  beforeEach(() => {
    resetRssePersistenceSingleton();
  });

  it("create → short code → join → start → checkpoint → complete; sequences ordered; idempotency does not duplicate rows", async () => {
    const p = getRssePersistence();
    const idemCreate = `ig-create-${crypto.randomUUID()}`;
    const r1 = await applyPlatformCommand({
      type: "CREATE_SESSION",
      idempotencyKey: idemCreate,
    });
    const sid = r1.snapshot.sessionId;
    const short = r1.events.find((e) => e.eventType === "session_created")?.payload
      .shortCode as string;
    expect(await p.resolveShortCodeToSessionId(short.toLowerCase())).toBe(sid);

    const joined = await applyPlatformCommand({
      type: "JOIN_SESSION",
      sessionId: sid,
      idempotencyKey: `ig-join-${crypto.randomUUID()}`,
      payload: { displayName: "Host", avatarEmoji: "*" },
    });
    const host = joined.events.find((e) => e.eventType === "player_joined")?.payload
      .playerId as string;
    let last = await latestMaxSequence(p, sid);

    await applyPlatformCommand({
      type: "START_SESSION",
      sessionId: sid,
      playerId: host,
      idempotencyKey: `ig-start-${crypto.randomUUID()}`,
      lastSeenSequenceNumber: last,
    });
    last = await latestMaxSequence(p, sid);

    await applyPlatformCommand({
      type: "EMIT_EXPERIENCE_EVENT",
      sessionId: sid,
      playerId: host,
      idempotencyKey: `ig-ckpt-${crypto.randomUUID()}`,
      lastSeenSequenceNumber: last,
      payload: { label: "smoke-checkpoint" },
    });
    last = await latestMaxSequence(p, sid);

    await applyPlatformCommand({
      type: "COMPLETE_SESSION",
      sessionId: sid,
      playerId: host,
      idempotencyKey: `ig-done-${crypto.randomUUID()}`,
      lastSeenSequenceNumber: last,
    });

    const evs = await p.readEventsOrdered(sid);
    for (let i = 1; i < evs.length; i++) {
      expect(evs[i]!.sequenceNumber).toBeGreaterThan(evs[i - 1]!.sequenceNumber);
    }

    const nEventsBefore = evs.length;
    await applyPlatformCommand({
      type: "CREATE_SESSION",
      idempotencyKey: idemCreate,
    });
    const nEventsAfter = (await p.readEventsOrdered(sid)).length;
    expect(nEventsAfter).toBe(nEventsBefore);
  });

  it("duplicate provider_order_id fulfillment does not create a second entitlement row", async () => {
    const p = getRssePersistence();
    const c = await applyPlatformCommand({
      type: "CREATE_SESSION",
      idempotencyKey: `ig-unlock-${crypto.randomUUID()}`,
    });
    const sid = c.snapshot.sessionId;
    const payId = `ls-order-${crypto.randomUUID()}`;
    let last = await latestMaxSequence(p, sid);

    await applyPlatformCommand({
      type: "EMIT_EXPERIENCE_EVENT",
      sessionId: sid,
      idempotencyKey: "fulfill-a",
      lastSeenSequenceNumber: last,
      payload: { entitlementFulfillment: true, providerOrderId: payId },
    });
    expect(await countEntitlements(sid)).toBe(1);
    expect(await countSessionUnlockedEvents(sid)).toBe(1);

    last = await latestMaxSequence(p, sid);
    const dup = await applyPlatformCommand({
      type: "EMIT_EXPERIENCE_EVENT",
      sessionId: sid,
      idempotencyKey: "fulfill-b",
      lastSeenSequenceNumber: last,
      payload: { entitlementFulfillment: true, providerOrderId: payId },
    });
    expect(await countEntitlements(sid)).toBe(1);
    expect(await countSessionUnlockedEvents(sid)).toBe(1);
    expect(dup.events).toEqual([]);
  });
});
