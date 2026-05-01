import { decodePortalData } from "@/lib/utils";

export interface PackPreviewData {
  childName: string;
  age: string;
  partyDate: string;
  favoriteThing: string;
}

interface RawPreviewData {
  childName?: string;
  age?: string;
  partyDate?: string;
  favoriteThing?: string;
}

const FALLBACK_PREVIEW: PackPreviewData = {
  childName: "Birthday Star",
  age: "",
  partyDate: "",
  favoriteThing: "birthday magic",
};

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function getPackPreviewData(encoded: string | null | undefined): PackPreviewData {
  if (!encoded) return FALLBACK_PREVIEW;

  const decoded = decodePortalData<RawPreviewData>(encoded);
  if (!decoded || typeof decoded !== "object") return FALLBACK_PREVIEW;

  return {
    childName: clean(decoded.childName) || FALLBACK_PREVIEW.childName,
    age: clean(decoded.age),
    partyDate: clean(decoded.partyDate),
    favoriteThing: clean(decoded.favoriteThing) || FALLBACK_PREVIEW.favoriteThing,
  };
}

export function getMissionCountdownLabel(partyDate: string, now = new Date()): string {
  if (!partyDate) return "Mission briefing unlocked";

  const target = new Date(`${partyDate}T00:00:00`);
  if (Number.isNaN(target.getTime())) return "Mission briefing unlocked";

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.ceil((target.getTime() - startOfToday.getTime()) / 86_400_000);

  if (diffDays > 1) return `Mission T-${diffDays} days`;
  if (diffDays === 1) return "Mission launches tomorrow";
  if (diffDays === 0) return "Mission launches today";
  return "Mission accomplished";
}

export function buildPackOgImageUrl(baseUrl: string, encoded: string | null | undefined): string {
  const url = new URL("/pack/og", baseUrl);
  if (encoded) {
    url.searchParams.set("data", encoded);
  }
  return url.toString();
}
