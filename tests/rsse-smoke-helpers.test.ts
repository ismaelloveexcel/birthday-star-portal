import { describe, it, expect } from "vitest";
import {
  eventOfType,
  latestSequenceFromResponse,
  requireField,
} from "../scripts/rsse-smoke-helpers.mjs";

describe("rsse-smoke-helpers", () => {
  it("latestSequenceFromResponse uses snapshot, events, and lastSequence", () => {
    expect(
      latestSequenceFromResponse({
        snapshot: { sequenceNumber: 3 },
        events: [{ sequenceNumber: 5 }, { sequenceNumber: 4 }],
        lastSequence: 2,
      }),
    ).toBe(5);
    expect(latestSequenceFromResponse({ lastSequence: 9 })).toBe(9);
    expect(latestSequenceFromResponse({})).toBe(0);
  });

  it("eventOfType finds first matching event", () => {
    const j = {
      events: [
        { eventType: "host_started", sequenceNumber: 1 },
        { eventType: "session_unlocked", sequenceNumber: 2 },
      ],
    };
    expect(eventOfType(j, "session_unlocked")?.sequenceNumber).toBe(2);
    expect(eventOfType(j, "missing")).toBeUndefined();
  });

  it("requireField throws on empty", () => {
    expect(() => requireField("", "x")).toThrow(/missing x/);
    expect(requireField("ok", "x")).toBe("ok");
  });
});
