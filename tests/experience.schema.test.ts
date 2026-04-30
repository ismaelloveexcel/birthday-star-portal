import { describe, expect, it } from "vitest";
import spaceMission from "@/content/experiences/space-mission.json";
import { experienceSchema } from "@/lib/schemas/experience";

describe("experienceSchema", () => {
  it("parses the space-mission baseline config", () => {
    const parsed = experienceSchema.safeParse(spaceMission);
    expect(parsed.success).toBe(true);
  });

  it("preserves the current section ordering baseline", () => {
    const experience = experienceSchema.parse(spaceMission);
    expect(experience.sections.map((section) => section.type)).toEqual([
      "demoBanner",
      "portalIgnition",
      "captainReveal",
      "missionBriefing",
      "countdown",
      "rsvp",
      "quiz",
      "badge",
      "starLog",
      "viralLoop",
      "demoCta",
    ]);
  });
});