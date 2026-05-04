import { describe, it, expect, beforeEach } from "vitest";
import { getRssePersistence, resetRssePersistenceSingleton } from "@/lib/rsse/persistence/factory";
import { applyPlatformCommand } from "@/lib/rsse/applyPlatformCommand";
import { resetRsseStore } from "@/lib/rsse/memoryPersistence";

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
});
