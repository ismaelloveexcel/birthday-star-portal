import { afterEach, describe, it, expect, vi } from "vitest";
import {
  resolveUnlockCheckoutEnv,
  withCheckoutSessionData,
} from "@/lib/rsse/unlockCheckout";

describe("resolveUnlockCheckoutEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns placeholder mode when checkout URL is unset in non-production", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_CHECKOUT_URL", "");
    const r = resolveUnlockCheckoutEnv();
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.mode).toBe("placeholder");
      expect(r.checkoutUrl).toContain("example.com");
    }
  });

  it("returns checkout mode when URL is configured", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_CHECKOUT_URL", "https://pay.example/buy/1");
    const r = resolveUnlockCheckoutEnv();
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.mode).toBe("checkout");
      expect(r.checkoutUrl).toBe("https://pay.example/buy/1");
    }
  });

  it("adds Lemon custom session data when session id is provided", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv(
      "NEXT_PUBLIC_CHECKOUT_URL",
      "https://pay.example/buy/1?discount=VIP",
    );
    const r = resolveUnlockCheckoutEnv(
      "11111111-1111-1111-1111-111111111111",
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      const url = new URL(r.checkoutUrl);
      expect(url.searchParams.get("discount")).toBe("VIP");
      expect(url.searchParams.get("checkout[custom][session_id]")).toBe(
        "11111111-1111-1111-1111-111111111111",
      );
    }
  });

  it("can append custom session data to a checkout URL", () => {
    const url = new URL(
      withCheckoutSessionData(
        "https://pay.example/buy/1",
        "22222222-2222-2222-2222-222222222222",
      ),
    );
    expect(url.searchParams.get("checkout[custom][session_id]")).toBe(
      "22222222-2222-2222-2222-222222222222",
    );
  });

  it("fails in production when checkout URL is missing", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_CHECKOUT_URL", "");
    const r = resolveUnlockCheckoutEnv();
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.status).toBe(503);
      expect(r.code).toBe("checkout_misconfigured");
    }
  });

  it("treats # as unconfigured in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_CHECKOUT_URL", "#");
    const r = resolveUnlockCheckoutEnv();
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.status).toBe(503);
      expect(r.code).toBe("checkout_misconfigured");
    }
  });
});
