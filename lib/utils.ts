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
  _timezone: string = "Asia/Dubai"
): Date {
  // Combine date and time. Note: timezone is informational — the parent's local
  // device clock is used for the countdown calculation. Storing/applying full
  // tz math would require an additional library, which is out-of-scope for v1.
  const safeDate = dateString || new Date().toISOString().slice(0, 10);
  const safeTime = timeString || "00:00";
  // Build ISO-like string. Browsers parse "YYYY-MM-DDTHH:MM" as local time.
  return new Date(`${safeDate}T${safeTime}`);
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
