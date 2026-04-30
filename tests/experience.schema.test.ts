import { describe, expect, it } from "vitest";
import princessQuest from "@/content/experiences/princess-quest.json";
import spaceMission from "@/content/experiences/space-mission.json";
import { experienceSchema } from "@/lib/schemas/experience";

describe("experienceSchema", () => {
  it("parses the shipped experience configs", () => {
    expect(experienceSchema.safeParse(spaceMission).success).toBe(true);
    expect(experienceSchema.safeParse(princessQuest).success).toBe(true);
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

  it("includes a flow path that references configured sections", () => {
    const experience = experienceSchema.parse(spaceMission);
    const sectionIds = new Set(experience.sections.map((section) => section.id));
    expect(experience.flow.every((stepId) => sectionIds.has(stepId))).toBe(true);
  });

  it("keeps the default space experience unchanged", () => {
    const experience = experienceSchema.parse(spaceMission);
    expect(experience.quiz.questions[4].correctAnswerTemplate).toBe("Space Mission Edition");
  });
});