export type ContactType = "whatsapp" | "email" | "both";

export function encodePortalData(data: object): string {
  if (typeof window === "undefined") {
    return Buffer.from(JSON.stringify(data), "utf-8").toString("base64");
  }
  return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
}

export function decodePortalData<T = unknown>(encoded: string): T | null {
  try {
    if (typeof window === "undefined") {
      const json = Buffer.from(encoded, "base64").toString("utf-8");
      return JSON.parse(json) as T;
    }
    return JSON.parse(decodeURIComponent(escape(atob(encoded)))) as T;
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
  }

  // First approximation: treat wall-clock time as UTC
  const wallAsUtcMs = Date.UTC(year, (month ?? 1) - 1, day, hour, minute);

  // Get the offset at that rough UTC time and subtract to get target UTC ms
  const offsetMs = getOffsetMs(wallAsUtcMs - getOffsetMs(wallAsUtcMs));

  return new Date(wallAsUtcMs - offsetMs);
}

export function detectContactType(contact: string): ContactType {
  if (!contact) return "both";
  const trimmed = contact.trim();
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  const isPhone =
    trimmed.startsWith("+") ||
    /^[\d\s\-()]{7,}$/.test(trimmed);
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
