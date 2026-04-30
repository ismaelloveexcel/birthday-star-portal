import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";
import { formSchema } from "@/lib/validation";

const payloadSchema = z.object({
  guestId: z.string().min(1),
  experienceId: z.string().min(1),
  data: formSchema,
  exp: z.number().int().positive(),
});

export type PortalTokenPayload = z.infer<typeof payloadSchema>;

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, "base64").toString("utf-8");
}

function getSecret(): string {
  const secret = process.env.TOKEN_SECRET;
  if (!secret) {
    throw new Error("[token] TOKEN_SECRET is required to sign and verify portal tokens.");
  }
  return secret;
}

function signValue(encodedPayload: string): string {
  return createHmac("sha256", getSecret()).update(encodedPayload).digest("base64url");
}

export function signPortalToken(payload: PortalTokenPayload): string {
  const normalizedPayload = payloadSchema.parse(payload);
  const encodedPayload = toBase64Url(JSON.stringify(normalizedPayload));
  const signature = signValue(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyPortalToken(token: string): PortalTokenPayload | null {
  try {
    const [encodedPayload, receivedSignature] = token.split(".");
    if (!encodedPayload || !receivedSignature) return null;

    const expectedSignature = signValue(encodedPayload);
    const receivedBuffer = Buffer.from(receivedSignature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (receivedBuffer.length !== expectedBuffer.length) return null;
    if (!timingSafeEqual(receivedBuffer, expectedBuffer)) return null;

    const parsed = payloadSchema.parse(JSON.parse(fromBase64Url(encodedPayload)) as unknown);
    if (parsed.exp * 1000 < Date.now()) return null;

    return parsed;
  } catch {
    return null;
  }
}