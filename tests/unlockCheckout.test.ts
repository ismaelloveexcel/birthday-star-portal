import { afterEach, describe, it, expect, vi } from "vitest";
import { resolveUnlockCheckoutEnv } from "@/lib/rsse/unlockCheckout";

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
