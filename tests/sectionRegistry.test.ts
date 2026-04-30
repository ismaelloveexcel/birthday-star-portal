import { describe, it, expect } from "vitest";
import spaceMission from "@/content/experiences/space-mission.json";
import type { Experience } from "@/features/portal/types";

const experience = spaceMission as Experience;

describe("space-mission experience", () => {
  it("has a valid id", () => {
    expect(experience.id).toBe("space-mission");
  });

  it("has non-empty sections array", () => {
    expect(Array.isArray(experience.sections)).toBe(true);
    expect(experience.sections.length).toBeGreaterThan(0);
  });

  it("each section has a string type", () => {
    for (const section of experience.sections) {
      expect(typeof section.type).toBe("string");
      expect(section.type.length).toBeGreaterThan(0);
    }
  });

  it("contains the expected section types in order", () => {
    const types = experience.sections.map((s) => s.type);
    expect(types).toEqual([
      "portal-ignition",
      "captain-reveal",
      "mission-briefing",
      "countdown",
      "rsvp",
      "cadet-challenge",
      "space-badge",
      "star-log",
      "viral-loop",
    ]);
  });

  it("has a copy record with string values", () => {
    expect(typeof experience.copy).toBe("object");
    for (const [key, value] of Object.entries(experience.copy)) {
      expect(typeof key).toBe("string");
      expect(typeof value).toBe("string");
    }
  });

  it("has copy for every expected key", () => {
    const expectedKeys = [
      "portalIgnition.heading",
      "portalIgnition.subtitle",
      "captainReveal.eyebrow",
      "captainReveal.srOnly",
      "captainReveal.line1",
      "captainReveal.line2",
      "captainReveal.subtitle",
      "missionBriefing.eyebrow",
      "missionBriefing.heading",
      "missionBriefing.intro",
      "missionBriefing.dateLabel",
      "missionBriefing.timeLabel",
      "missionBriefing.locationLabel",
      "missionBriefing.themeLabel",
      "countdown.heading",
      "rsvp.heading",
      "rsvp.subtitle",
      "cadetChallenge.heading",
      "cadetChallenge.subtitle",
      "starLog.eyebrow",
      "starLog.heading",
      "starLog.subtitle",
      "starLog.seal",
      "viralLoop.message",
      "viralLoop.cta",
    ];
    for (const key of expectedKeys) {
      expect(experience.copy).toHaveProperty(key);
      expect(typeof experience.copy[key]).toBe("string");
    }
  });
});
