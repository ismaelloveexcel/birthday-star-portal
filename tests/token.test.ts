import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signPortalToken, verifyPortalToken, type PortalTokenPayload } from "@/lib/token/sign";

function buildPayload(): PortalTokenPayload {
  return {
    guestId: "guest-zara",
    experienceId: "space-mission",
    exp: Math.floor(Date.now() / 1000) + 3600,
    data: {
      childName: "Zara",
      age: "6",
      partyDate: "2030-06-15",
      partyTime: "15:00",
      location: "Star Base HQ",
      parentContact: "parent@example.com",
      favoriteThing: "rockets",
      funFact1: "once ate a whole cake by herself",
      funFact2: "thinks she can talk to dolphins",
      funFact3: "is already planning her next birthday",
      timezone: "Asia/Dubai",
    },
  };
}

describe("portal token signing", () => {
  const originalSecret = process.env.TOKEN_SECRET;

  beforeEach(() => {
    process.env.TOKEN_SECRET = "test-secret-for-vitest";
  });

  afterEach(() => {
    process.env.TOKEN_SECRET = originalSecret;
    vi.useRealTimers();
  });

  it("round-trips a signed payload", () => {
    const token = signPortalToken(buildPayload());
    expect(verifyPortalToken(token)).toEqual(buildPayload());
  });

  it("rejects a tampered token", () => {
    const token = signPortalToken(buildPayload());
    const [payload, signature] = token.split(".");
    const tamperedPayload = `${payload.slice(0, -1)}A.${signature}`;
    expect(verifyPortalToken(tamperedPayload)).toBeNull();
  });

  it("rejects an expired token", () => {
    vi.useFakeTimers();
    const now = new Date("2030-06-15T12:00:00.000Z");
    vi.setSystemTime(now);
    const token = signPortalToken({
      ...buildPayload(),
      exp: Math.floor(now.getTime() / 1000) - 1,
    });
    expect(verifyPortalToken(token)).toBeNull();
  });
});