// TODO v2: Replace localStorage + encoded URL with verified payment token after first sales.

import type { Metadata } from "next";
import { decodePortalData } from "@/lib/utils";
import PackClient from "./PackClient";

interface PortalData {
  childName?: string;
  age?: string;
  partyDate?: string;
  partyTime?: string;
  location?: string;
  parentContact?: string;
  favoriteThing?: string;
  funFact1?: string;
  funFact2?: string;
  funFact3?: string;
  timezone?: string;
}

type SearchParams = Promise<{ data?: string | string[] }>;

function getDataParam(params: { data?: string | string[] }): string | undefined {
  const v = params.data;
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export async function generateMetadata(
  { searchParams }: { searchParams: SearchParams }
): Promise<Metadata> {
  const params = await searchParams;
  const encoded = getDataParam(params);
  let title = "🚀 You're invited to a Birthday Mission!";
  if (encoded) {
    const data = decodePortalData<PortalData>(encoded);
    if (data && data.childName) {
      title = `🚀 You're invited to Captain ${data.childName}'s Birthday Mission!`;
    }
  }
  const description = "Accept your mission briefing. Cadet training required.";
  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

export default async function PackPage(
  { searchParams }: { searchParams: SearchParams }
) {
  const params = await searchParams;
  const encoded = getDataParam(params);
  return <PackClient encoded={encoded ?? null} />;
}
