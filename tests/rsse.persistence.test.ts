import { describe, it, expect, beforeEach } from "vitest";
import { getRssePersistence, resetRssePersistenceSingleton } from "@/lib/rsse/persistence/factory";
import { applyPlatformCommand } from "@/lib/rsse/applyPlatformCommand";
import { resetRsseStore } from "@/lib/rsse/memoryPersistence";
import { rehydrateSession } from "@/lib/rsse/rehydrate";

describe("RSSE persistence factory", () => {
  beforeEach(() => {
    resetRssePersistenceSingleton();
    resetRsseStore();
  });

  it("uses in-memory persistence when DATABASE_URL is unset", async () => {
    const p = getRssePersistence();
    const c = await applyPlatformCommand({
      type: "CREATE_SESSION",
      idempotencyKey: "persistence-factory-1",
    });
    const short = c.events.find((e) => e.eventType === "session_created")?.payload
      .shortCode as string;
    const sid = await p.resolveShortCodeToSessionId(short);
    expect(sid).toBe(c.snapshot.sessionId);
    const rt = await p.loadRuntime(sid);
    expect(rt?.session.shortCode).toBe(short);
  });

  it("readEventsOrdered returns persisted events", async () => {
    const p = getRssePersistence();
    const c = await applyPlatformCommand({
      type: "CREATE_SESSION",
      idempotencyKey: "persistence-read-events",
    });
    const sid = c.snapshot.sessionId;
    const evs = await p.readEventsOrdered(sid);
    expect(evs.length).toBeGreaterThanOrEqual(2);
  });

  it("readEventsAfterSequence returns only later events", async () => {
    const p = getRssePersistence();
    const c = await applyPlatformCommand({
      type: "CREATE_SESSION",
      idempotencyKey: `after-seq-${crypto.randomUUID()}`,
    });
    const sid = c.snapshot.sessionId;
    const ordered = await p.readEventsOrdered(sid);
    const mid = ordered[0]!.sequenceNumber;
    const after = await p.readEventsAfterSequence(sid, mid);
    expect(after.every((e) => e.sequenceNumber > mid)).toBe(true);
    expect(after.length).toBe(ordered.length - 1);
  });

  it("rehydrateSession returns eventsAfterLastSeen when lastSeenSequenceNumber is set", async () => {
    const c = await applyPlatformCommand({
      type: "CREATE_SESSION",
      idempotencyKey: `rehydrate-${crypto.randomUUID()}`,
    });
    const sid = c.snapshot.sessionId;
    const ordered = await getRssePersistence().readEventsOrdered(sid);
    const cut = ordered[0]!.sequenceNumber;
    const r = await rehydrateSession({ sessionId: sid, lastSeenSequenceNumber: cut });
    expect(r.session.id).toBe(sid);
    expect(r.eventsAfterLastSeen.length).toBe(ordered.length - 1);
    expect(r.eventsAfterLastSeen[0]?.sequenceNumber).toBeGreaterThan(cut);
  });

  it("rehydrateSession omits eventsAfterLastSeen when lastSeenSequenceNumber is omitted", async () => {
    const c = await applyPlatformCommand({
      type: "CREATE_SESSION",
      idempotencyKey: `rehydrate-none-${crypto.randomUUID()}`,
    });
    const sid = c.snapshot.sessionId;
    const r = await rehydrateSession({ sessionId: sid });
    expect(r.eventsAfterLastSeen).toEqual([]);
  });
});
