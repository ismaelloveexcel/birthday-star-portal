import { createHmac } from "node:crypto";
import { describe, it, expect } from "vitest";
import {
  lemonFulfillmentIdempotencyKey,
  parseLemonWebhookBody,
  verifyLemonSqueezyWebhookSignature,
} from "@/lib/rsse/lemonSqueezyWebhook";

describe("lemonSqueezyWebhook", () => {
  it("verifyLemonSqueezyWebhookSignature accepts valid hex signature", () => {
    const secret = "test-secret";
    const raw = '{"hello":1}';
    const sig = createHmac("sha256", secret).update(raw).digest("hex");
    expect(verifyLemonSqueezyWebhookSignature(raw, sig, secret)).toBe(true);
    expect(verifyLemonSqueezyWebhookSignature(raw, "deadbeef", secret)).toBe(false);
  });

  it("parseLemonWebhookBody reads session id, order id, and paid status", () => {
    const body = {
      meta: {
        event_name: "order_paid",
        custom_data: { session_id: "11111111-1111-1111-1111-111111111111" },
      },
      data: {
        id: "ord_123",
        attributes: { status: "paid" },
      },
    };
    const p = parseLemonWebhookBody(body);
    expect(p.eventName).toContain("order_paid");
    expect(p.sessionId).toBe("11111111-1111-1111-1111-111111111111");
    expect(p.providerOrderId).toBe("ord_123");
    expect(p.orderPaid).toBe(true);
  });

  it("parseLemonWebhookBody reads custom_data at top level", () => {
    const body = {
      meta: { event_name: "order_paid" },
      custom_data: { session_id: "22222222-2222-2222-2222-222222222222" },
      data: { id: 99, attributes: { status: "paid" } },
    };
    const p = parseLemonWebhookBody(body);
    expect(p.sessionId).toBe("22222222-2222-2222-2222-222222222222");
    expect(p.providerOrderId).toBe("99");
  });

  it("lemonFulfillmentIdempotencyKey is stable per order id", () => {
    expect(lemonFulfillmentIdempotencyKey("ord_1")).toBe("lemon:order:ord_1");
  });
});
