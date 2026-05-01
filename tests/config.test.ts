import { describe, expect, it, vi } from "vitest";

async function loadConfig() {
  vi.resetModules();
  return import("@/lib/config");
}

describe("config production guards", () => {
  it("rejects production builds without a real checkout URL", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://example.com");
    vi.stubEnv("NEXT_PUBLIC_CHECKOUT_URL", "#");

    await expect(loadConfig()).rejects.toThrow("NEXT_PUBLIC_CHECKOUT_URL");

    vi.unstubAllEnvs();
  });

  it("allows the v1 static checkout URL when production env is complete", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://example.com");
    vi.stubEnv("NEXT_PUBLIC_CHECKOUT_URL", "https://payhip.com/b/example");

    const { config } = await loadConfig();

    expect(config.BASE_URL).toBe("https://example.com");
    expect(config.CHECKOUT_URL).toBe("https://payhip.com/b/example");

    vi.unstubAllEnvs();
  });
});