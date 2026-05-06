import { config } from "@/lib/config";

export type ArcadeState = "open" | "locked" | "planned";

export interface WorldDistrict {
  id: string;
  name: string;
  status: string;
  description: string;
  signal: string;
}

export interface ArcadeDefinition {
  id: string;
  name: string;
  districtId: string;
  state: ArcadeState;
  description: string;
  href: string;
  cta: string;
  gameSlot: string;
}

export const worldDistricts: WorldDistrict[] = [
  {
    id: "dubai",
    name: "Dubai District",
    status: "Foundation world",
    description:
      "A premium night-city hub for polished celebration gifts, birthday missions, and future social arcades.",
    signal: "Skyline gates, lounge arcades, neon walkways",
  },
  {
    id: "mauritius",
    name: "Mauritius Shore",
    status: "Next world",
    description:
      "A warmer island environment for family, romance, vacation, and diaspora gifting paths.",
    signal: "Boardwalk arcades, sunset trails, beach stages",
  },
];

export const arcadeRegistry: ArcadeDefinition[] = [
  {
    id: "birthday-star",
    name: "Birthday Star Arcade",
    districtId: "dubai",
    state: "open",
    description:
      "Personalise a birthday mission, send it as one link, and let the recipient play inside the first arcade.",
    href: "/#form",
    cta: `Create gift - ${config.PRICE}`,
    gameSlot: "birthday-mission-v1",
  },
  {
    id: "memory-vault",
    name: "Memory Vault",
    districtId: "dubai",
    state: "locked",
    description:
      "A future slot for a more emotional shared-memory gift. The mechanic can wait until the idea is sharp.",
    href: "/#form",
    cta: "Research slot",
    gameSlot: "future-memory-game",
  },
  {
    id: "couples-signal",
    name: "Couples Signal",
    districtId: "dubai",
    state: "locked",
    description:
      "A future anniversary or relationship gift arcade, visible in the world but not committed yet.",
    href: "/#form",
    cta: "Locked arcade",
    gameSlot: "future-couples-game",
  },
  {
    id: "island-message-pier",
    name: "Island Message Pier",
    districtId: "mauritius",
    state: "planned",
    description:
      "A Mauritius environment slot for warm family and long-distance celebration gifts.",
    href: "/#form",
    cta: "Planned world",
    gameSlot: "future-island-game",
  },
];

export function districtName(districtId: string): string {
  return worldDistricts.find((district) => district.id === districtId)?.name ?? districtId;
}