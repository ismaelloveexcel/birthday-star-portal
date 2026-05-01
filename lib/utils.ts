export type ContactType = "whatsapp" | "email" | "both";

export function encodePortalData(data: object): string {
  if (typeof window === "undefined") {
    return Buffer.from(JSON.stringify(data), "utf-8").toString("base64");
  }
  return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
}

export function decodePortalData<T = unknown>(encoded: string): T | null {
  try {
    const normalized = encoded.replace(/ /g, "+");
    if (typeof Buffer !== "undefined") {
      const json = Buffer.from(normalized, "base64").toString("utf-8");
      return JSON.parse(json) as T;
    }
    if (typeof atob === "function") {
      return JSON.parse(decodeURIComponent(escape(atob(normalized)))) as T;
    }
    return null;
  } catch {
    return null;
  }
}

export function formatDate(dateString: string): string {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatPartyDate(
  dateString: string,
  timeString: string,
  timezone: string = "Asia/Dubai"
): Date {
  const safeDate = dateString || new Date().toISOString().slice(0, 10);
  const safeTime = timeString || "00:00";
  const safeTZ = timezone || "Asia/Dubai";

  // Parse wall-clock parts
  const [year, month, day] = safeDate.split("-").map(Number);
  const [hour, minute] = safeTime.split(":").map(Number);
  // Strategy: find the UTC instant that corresponds to year/month/day hour:minute
  // in the given IANA timezone.
  //
  // We use Intl.DateTimeFormat with timeZoneName:'longOffset' to read back the
  // UTC offset that applies to any given candidate UTC timestamp, then iterate
  // once (handles DST transitions correctly).

  function getOffsetMs(utcMs: number): number {
    try {
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: safeTZ,
        timeZoneName: "longOffset",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).formatToParts(new Date(utcMs));

      const get = (type: string) => {
        const p = parts.find((x) => x.type === type);
        return p ? p.value : "";
      };

      // timeZoneName looks like "GMT+05:30" or "GMT-04:00" or "GMT"
      const tzName = get("timeZoneName");
      const match = tzName.match(/GMT([+-])(\d{2}):(\d{2})/);
      if (!match) return 0; // UTC
      const sign = match[1] === "+" ? 1 : -1;
      return sign * (Number(match[2]) * 60 + Number(match[3])) * 60 * 1000;
    } catch {
      // Invalid IANA timezone or unsupported runtime — fall back to local offset
      return -new Date(utcMs).getTimezoneOffset() * 60 * 1000;
    }
  }

  // First approximation: treat wall-clock time as UTC
  const wallAsUtcMs = Date.UTC(year, month - 1, day, hour, minute);

  // Get the offset at that rough UTC time and subtract to get target UTC ms
  const offsetMs = getOffsetMs(wallAsUtcMs - getOffsetMs(wallAsUtcMs));

  return new Date(wallAsUtcMs - offsetMs);
}

export function detectContactType(contact: string): ContactType {
  if (!contact) return "both";
  const trimmed = contact.trim();
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  // Phone: must start with + and have at least 7 actual digits
  const isPhone =
    /^\+[\d\s\-()]{6,}$/.test(trimmed) &&
    trimmed.replace(/[^\d]/g, "").length >= 7;
  if (isEmail && !isPhone) return "email";
  if (isPhone && !isEmail) return "whatsapp";
  if (isEmail && isPhone) return "email";
  return "both";
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function sanitizePhoneForWhatsApp(contact: string): string {
  // wa.me requires digits only (no leading +)
  return (contact || "").replace(/[^\d]/g, "");
}

export function buildPortalShareText(childName: string, url: string): string {
  const safeName = (childName || "your child").trim();
  const safeUrl = (url || "").trim();

  return [
    `🚀 Here's Captain ${safeName}'s Birthday Mission portal! Open it to see the mission briefing, countdown, and complete the Cadet Challenge: ${safeUrl}`,
    "Made with Birthday Star Portal — wanderingdodo.com",
  ].join("\n\n");
}

export function buildPortalTeaserText(childName: string, url: string): string {
  const safeName = (childName || "your child").trim();
  const safeUrl = (url || "").trim();

  return [
    `A secret birthday transmission has been prepared for Captain ${safeName}. Mission access opens here: ${safeUrl}`,
    "Do not brief the crew too early.",
  ].join("\n\n");
}

/**
 * Best-effort, no-PII conversion ping.
 *
 * - Reads NEXT_PUBLIC_PING_URL at call time. If unset, does nothing.
 * - Uses navigator.sendBeacon so it never blocks navigation.
 * - Payload is a single JSON line with only `{ event, ts }` — no party
 *   details, no contact info, no IDs of any kind.
 * - All errors are swallowed silently — telemetry must never break checkout.
 */
export function pingEvent(event: string): void {
  try {
    const url = process.env.NEXT_PUBLIC_PING_URL;
    if (!url) return;
    if (typeof navigator === "undefined" || typeof navigator.sendBeacon !== "function") {
      return;
    }
    const body = JSON.stringify({ event, ts: Date.now() });
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(url, blob);
  } catch {
    // Silent — telemetry is best-effort.
  }
}
