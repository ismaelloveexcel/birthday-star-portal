import { describe, expect, it, vi } from "vitest";

async function loadConfig() {
  vi.resetModules();
  return import("@/lib/config");
}

describe("config production guards", () => {
  it("does not throw in production when checkout URL is missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://example.com");
    vi.stubEnv("NEXT_PUBLIC_CHECKOUT_URL", "#");

    await expect(loadConfig()).resolves.toBeDefined();

    vi.unstubAllEnvs();
  });

  it("allows the v1 static checkout URL when production env is complete", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://example.com");
    vi.stubEnv("NEXT_PUBLIC_CHECKOUT_URL", "https://byismael.lemonsqueezy.com/checkout/buy/example");

    const { config } = await loadConfig();

    expect(config.BASE_URL).toBe("https://example.com");
    expect(config.CHECKOUT_URL).toBe("https://byismael.lemonsqueezy.com/checkout/buy/example");

    vi.unstubAllEnvs();
  });
});