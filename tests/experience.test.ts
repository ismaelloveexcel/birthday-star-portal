import { describe, it, expect } from "vitest";
import { ExperienceSchema } from "@/lib/experience/schema";
import { interpolate } from "@/lib/experience/interpolate";
import spaceMission from "@/lib/experience/space-mission.json";

// ---------------------------------------------------------------------------
// interpolate helper
// ---------------------------------------------------------------------------

describe("interpolate", () => {
  it("substitutes a single placeholder", () => {
    expect(interpolate("Hello, {{name}}!", { name: "Ayaan" })).toBe(
      "Hello, Ayaan!"
    );
  });

  it("substitutes multiple different placeholders", () => {
    expect(
      interpolate("Captain {{childName}}'s {{ageOrdinal}} Birthday Mission", {
        childName: "Sofia",
        ageOrdinal: "7TH",
      })
    ).toBe("Captain Sofia's 7TH Birthday Mission");
  });

  it("substitutes the same placeholder appearing more than once", () => {
    expect(
      interpolate("{{x}} and {{x}}", { x: "rocket" })
    ).toBe("rocket and rocket");
  });

  it("leaves unknown placeholders untouched", () => {
    expect(interpolate("Hello, {{unknown}}!", {})).toBe(
      "Hello, {{unknown}}!"
    );
  });

  it("returns the template unchanged when vars is empty and there are no placeholders", () => {
    expect(interpolate("No placeholders here.", {})).toBe(
      "No placeholders here."
    );
  });

  it("handles an empty template", () => {
    expect(interpolate("", { name: "x" })).toBe("");
  });

  it("handles a template that is only a placeholder", () => {
    expect(interpolate("{{price}}", { price: "$14" })).toBe("$14");
  });
});

// ---------------------------------------------------------------------------
// ExperienceSchema
// ---------------------------------------------------------------------------

describe("ExperienceSchema", () => {
  it("successfully parses space-mission.json", () => {
    const result = ExperienceSchema.safeParse(spaceMission);
    if (!result.success) {
      // Surface validation errors for easier debugging
      console.error(result.error.format());
    }
    expect(result.success).toBe(true);
  });

  it("exposes the correct slug", () => {
    const exp = ExperienceSchema.parse(spaceMission);
    expect(exp.slug).toBe("space-mission");
  });

  it("exposes all 9 sections in order", () => {
    const exp = ExperienceSchema.parse(spaceMission);
    expect(exp.sections).toHaveLength(9);
    expect(exp.sections[0].type).toBe("portalIgnition");
    expect(exp.sections[8].type).toBe("viralLoop");
  });

  it("exposes 5 quiz questions", () => {
    const exp = ExperienceSchema.parse(spaceMission);
    expect(exp.quiz.questions).toHaveLength(5);
  });

  it("rejects an experience missing required fields", () => {
    const result = ExperienceSchema.safeParse({ id: "x", slug: "x" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid slug (uppercase)", () => {
    const result = ExperienceSchema.safeParse({
      ...spaceMission,
      slug: "Space-Mission",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid slug (spaces)", () => {
    const result = ExperienceSchema.safeParse({
      ...spaceMission,
      slug: "space mission",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a section with an unknown type", () => {
    const badSections = [
      ...spaceMission.sections,
      { id: "sx", type: "unknownType", props: {} },
    ];
    const result = ExperienceSchema.safeParse({
      ...spaceMission,
      sections: badSections,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a quiz question with no options", () => {
    const badQuiz = {
      questions: [{ id: "q1", prompt: "What?", options: [] }],
    };
    const result = ExperienceSchema.safeParse({
      ...spaceMission,
      quiz: badQuiz,
    });
    expect(result.success).toBe(false);
  });

  it("defaults section props to an empty object when omitted", () => {
    const minimalSection = {
      id: "sx",
      type: "portalIgnition" as const,
    };
    const withMinimalSection = ExperienceSchema.parse({
      ...spaceMission,
      sections: [minimalSection],
    });
    expect(withMinimalSection.sections[0].props).toEqual({});
  });
});
