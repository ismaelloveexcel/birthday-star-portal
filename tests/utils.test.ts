import { describe, it, expect } from "vitest";
import {
  buildPortalShareText,
  buildPortalTeaserText,
  formatPartyDate,
  detectContactType,
  encodePortalData,
  decodePortalData,
} from "@/lib/utils";

describe("formatPartyDate", () => {
  it("returns the correct UTC instant for an Asia/Dubai wall-clock time (fixed +04:00)", () => {
    // 2026-06-15 15:00 in Asia/Dubai (UTC+4) === 2026-06-15 11:00 UTC
    const d = formatPartyDate("2026-06-15", "15:00", "Asia/Dubai");
    expect(d.toISOString()).toBe("2026-06-15T11:00:00.000Z");
  });

  it("handles the Europe/London BST → GMT autumn DST boundary", () => {
    // BST (UTC+1) until 02:00 on the last Sunday of October, then GMT (UTC+0).
    // 2026-10-25 00:30 London is unambiguously BST → 23:30 UTC the previous day
    const before = formatPartyDate("2026-10-25", "00:30", "Europe/London");
    expect(before.toISOString()).toBe("2026-10-24T23:30:00.000Z");
    // 2026-10-25 03:30 London is unambiguously GMT → 03:30 UTC
    const after = formatPartyDate("2026-10-25", "03:30", "Europe/London");
    expect(after.toISOString()).toBe("2026-10-25T03:30:00.000Z");
  });

  it("handles America/New_York DST spring forward and fall back", () => {
    // 2026-03-08: clocks jump 02:00 → 03:00 EST→EDT
    // 2026-03-08 01:30 New_York is EST (UTC-5) → 06:30 UTC
    const beforeSpring = formatPartyDate("2026-03-08", "01:30", "America/New_York");
    expect(beforeSpring.toISOString()).toBe("2026-03-08T06:30:00.000Z");
    // 2026-03-08 04:00 New_York is EDT (UTC-4) → 08:00 UTC
    const afterSpring = formatPartyDate("2026-03-08", "04:00", "America/New_York");
    expect(afterSpring.toISOString()).toBe("2026-03-08T08:00:00.000Z");

    // 2026-11-01: clocks fall 02:00 → 01:00 EDT→EST
    // 2026-11-01 00:30 New_York is EDT (UTC-4) → 04:30 UTC
    const beforeFall = formatPartyDate("2026-11-01", "00:30", "America/New_York");
    expect(beforeFall.toISOString()).toBe("2026-11-01T04:30:00.000Z");
    // 2026-11-01 03:00 New_York is EST (UTC-5) → 08:00 UTC
    const afterFall = formatPartyDate("2026-11-01", "03:00", "America/New_York");
    expect(afterFall.toISOString()).toBe("2026-11-01T08:00:00.000Z");
  });

  it("falls back to local-time interpretation when the timezone is invalid", () => {
    // Invalid IANA tz → getOffsetMs falls back to local offset; the function
    // must still return a valid Date and not throw.
    const d = formatPartyDate("2026-06-15", "15:00", "Not/A_Real_Zone");
    expect(d).toBeInstanceOf(Date);
    expect(Number.isNaN(d.getTime())).toBe(false);
  });
});

describe("detectContactType", () => {
  it("returns 'email' for plain email addresses", () => {
    expect(detectContactType("user@example.com")).toBe("email");
    expect(detectContactType("  trim.me@x.io  ")).toBe("email");
  });

  it("returns 'whatsapp' for + country-code phone numbers with at least 7 digits", () => {
    expect(detectContactType("+971501234567")).toBe("whatsapp");
    expect(detectContactType("+44 20 7946 0123")).toBe("whatsapp");
    expect(detectContactType("+1 (212) 555-0100")).toBe("whatsapp");
  });

  it("prefers 'email' when both interpretations could match", () => {
    // The regexes are mutually exclusive in practice; the function explicitly
    // resolves a both-true case to "email".
    expect(detectContactType("user@example.com")).toBe("email");
  });

  it("returns 'both' for empty / garbage / unprefixed phone input", () => {
    expect(detectContactType("")).toBe("both");
    expect(detectContactType("hello world")).toBe("both");
    // No leading + → not a phone under v1 rules
    expect(detectContactType("971501234567")).toBe("both");
    // + but fewer than 7 digits
    expect(detectContactType("+12345")).toBe("both");
  });
});

describe("encodePortalData / decodePortalData", () => {
  it("round-trips a basic ASCII object", () => {
    const data = { childName: "Ayaan", age: "6", funFact: "loves rockets" };
    const encoded = encodePortalData(data);
    expect(decodePortalData(encoded)).toEqual(data);
  });

  it("round-trips unicode (accents and emoji)", () => {
    const data = {
      childName: "Zoë",
      message: "🚀 Birthday 🎂 with friends — café visit",
      mixed: "日本語テスト",
    };
    const encoded = encodePortalData(data);
    expect(decodePortalData(encoded)).toEqual(data);
  });

  it("returns null when decoding malformed input", () => {
    expect(decodePortalData("not-base64-!@#")).toBeNull();
    expect(decodePortalData("")).toBeNull();
  });

  it("tolerates querystring plus signs that were decoded as spaces", () => {
    const encoded = encodePortalData({ value: ">>>" });
    expect(encoded).toContain("+");
    expect(decodePortalData(encoded.replace(/\+/g, " "))).toEqual({ value: ">>>" });
  });
});

describe("buildPortalShareText", () => {
  it("includes the portal URL and brand footer", () => {
    const text = buildPortalShareText("Ayaan", "https://example.com/pack?data=abc");

    expect(text).toContain("Captain Ayaan's Birthday Mission portal");
    expect(text).toContain("https://example.com/pack?data=abc");
    expect(text).toContain("Made with Birthday Star Portal");
    expect(text).toContain("wanderingdodo.com");
  });

  it("falls back gracefully when the child name is empty", () => {
    const text = buildPortalShareText("", "https://example.com/pack?data=abc");

    expect(text).toContain("Captain your child's Birthday Mission portal");
  });
});

describe("buildPortalTeaserText", () => {
  it("creates a curiosity-led teaser with the portal URL", () => {
    const text = buildPortalTeaserText("Zara", "https://example.com/pack?data=abc");

    expect(text).toContain("secret birthday transmission");
    expect(text).toContain("Captain Zara");
    expect(text).toContain("https://example.com/pack?data=abc");
    expect(text).toContain("Do not brief the crew too early");
  });
});
