import { afterEach, describe, it, expect, vi } from "vitest";
import { GET } from "@/app/api/rsse/health/route";
import { computeRsseHealth } from "@/lib/rsse/rsseHealth";
import { getRssePersistenceMode } from "@/lib/rsse/persistence/factory";

describe("getRssePersistenceMode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns memory when DATABASE_URL is unset", () => {
    vi.stubEnv("DATABASE_URL", "");
    expect(getRssePersistenceMode()).toBe("memory");
  });

  it("returns postgres when DATABASE_URL is set", () => {
    vi.stubEnv("DATABASE_URL", "postgres://localhost:5432/testdb");
    expect(getRssePersistenceMode()).toBe("postgres");
  });
});

describe("computeRsseHealth", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 503 and ok false in production when DATABASE_URL is missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_CHECKOUT_URL", "https://checkout.example/buy/1");
    const { httpStatus, body } = await computeRsseHealth();
    expect(httpStatus).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.databaseConfigured).toBe(false);
    expect(JSON.stringify(body)).not.toMatch(/postgres:\/\//i);
    expect(JSON.stringify(body)).not.toMatch(/DATABASE_URL/);
  });

  it("returns 200 in development without DATABASE_URL (memory mode)", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_CHECKOUT_URL", "");
    const { httpStatus, body } = await computeRsseHealth();
    expect(httpStatus).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.persistence).toBe("memory");
  });

  it("treats # as an unconfigured checkout URL", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_CHECKOUT_URL", "#");
    const { httpStatus, body } = await computeRsseHealth();
    expect(httpStatus).toBe(200);
    expect(body.checkoutConfigured).toBe(false);
  });
});

describe("GET /api/rsse/health", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("response JSON does not include secrets or raw DATABASE_URL", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_CHECKOUT_URL", "https://checkout.example/buy/1");
    const res = await GET();
    const text = await res.text();
    expect(text).not.toMatch(/postgres:\/\//i);
    expect(text).not.toMatch(/DATABASE_URL/);
    expect(res.status).toBe(503);
  });
});
