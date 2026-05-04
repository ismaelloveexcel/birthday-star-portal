import { afterEach, describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/webhooks/lemon-squeezy/route";

describe("POST /api/webhooks/lemon-squeezy", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 503 in production when webhook secret is missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("LEMON_SQUEEZY_WEBHOOK_SECRET", "");
    const req = new Request("http://localhost/api/webhooks/lemon-squeezy", {
      method: "POST",
      body: "{}",
    });
    const res = await POST(req);
    expect(res.status).toBe(503);
    const j = (await res.json()) as { code?: string };
    expect(j.code).toBe("webhook_misconfigured");
  });

  it("returns ignored for non-order_paid events in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("LEMON_SQUEEZY_WEBHOOK_SECRET", "");
    const body = JSON.stringify({
      meta: { event_name: "subscription_created" },
    });
    const req = new Request("http://localhost/api/webhooks/lemon-squeezy", {
      method: "POST",
      body,
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const j = (await res.json()) as { ignored?: boolean };
    expect(j.ignored).toBe(true);
  });
});
