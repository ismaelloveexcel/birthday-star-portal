import { describe, it, expect } from "vitest";
import Ajv from "ajv";
import schema from "@/content/experiences/experience.schema.json";
import spaceMission from "@/content/experiences/space-mission.json";
import princessQuest from "@/content/experiences/princess-quest.json";
import { buildQuizQuestions, type ExperienceConfig } from "@/lib/experience";

const ajv = new Ajv();
const validate = ajv.compile(schema);

describe("experience JSON files — parse and schema validation", () => {
  it("space-mission.json parses and validates against the schema", () => {
    expect(spaceMission).toBeTruthy();
    const valid = validate(spaceMission);
    if (!valid) {
      throw new Error(
        "space-mission.json schema errors: " + JSON.stringify(validate.errors, null, 2)
      );
    }
    expect(valid).toBe(true);
  });

  it("princess-quest.json parses and validates against the schema", () => {
    expect(princessQuest).toBeTruthy();
    const valid = validate(princessQuest);
    if (!valid) {
      throw new Error(
        "princess-quest.json schema errors: " + JSON.stringify(validate.errors, null, 2)
      );
    }
    expect(valid).toBe(true);
  });

  it("both editions have distinct ids and names", () => {
    expect(spaceMission.id).not.toBe(princessQuest.id);
    expect(spaceMission.name).not.toBe(princessQuest.name);
  });

  it("each edition has at least 1 quiz question", () => {
    expect(spaceMission.quiz.questions.length).toBeGreaterThan(0);
    expect(princessQuest.quiz.questions.length).toBeGreaterThan(0);
  });
});

describe("buildQuizQuestions — space-mission edition", () => {
  const vars = {
    childName: "Ayaan",
    age: "6",
    favoriteThing: "rockets",
    funFact1: "once stayed awake all night",
    location: "Star Base HQ",
  };

  it("returns the same number of questions as the template", () => {
    const config = spaceMission as ExperienceConfig;
    const questions = buildQuizQuestions(config.quiz.questions, vars);
    expect(questions).toHaveLength(config.quiz.questions.length);
  });

  it("each question has exactly 3 options with a valid correctIndex", () => {
    const config = spaceMission as ExperienceConfig;
    const questions = buildQuizQuestions(config.quiz.questions, vars);
    for (const q of questions) {
      expect(q.options).toHaveLength(3);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(3);
    }
  });

  it("interpolates childName into question prompts", () => {
    const config = spaceMission as ExperienceConfig;
    const questions = buildQuizQuestions(config.quiz.questions, vars);
    const promptsWithName = questions.filter((q) =>
      q.prompt.includes("Ayaan")
    );
    expect(promptsWithName.length).toBeGreaterThan(0);
  });

  it("correct answer appears in options at correctIndex", () => {
    const config = spaceMission as ExperienceConfig;
    const questions = buildQuizQuestions(config.quiz.questions, vars);
    for (const q of questions) {
      const correct = q.options[q.correctIndex];
      expect(correct).toBeTruthy();
      // correctIndex must point to the correct option
      expect(q.options.indexOf(correct)).toBe(q.correctIndex);
    }
  });

  it("age question correct answer matches vars.age", () => {
    const config = spaceMission as ExperienceConfig;
    const questions = buildQuizQuestions(config.quiz.questions, vars);
    const ageQ = questions.find((q) => q.prompt.includes("turning"));
    expect(ageQ).toBeDefined();
    expect(ageQ!.options[ageQ!.correctIndex]).toBe("6");
  });

  it("produces deterministic output for the same inputs", () => {
    const config = spaceMission as ExperienceConfig;
    const a = buildQuizQuestions(config.quiz.questions, vars);
    const b = buildQuizQuestions(config.quiz.questions, vars);
    expect(a).toEqual(b);
  });

  it("favoriteThing wrong answers use dinosaurs/unicorns when favoriteThing is generic", () => {
    const config = spaceMission as ExperienceConfig;
    const questions = buildQuizQuestions(config.quiz.questions, vars); // rockets
    const favQ = questions.find((q) => q.prompt.includes("favourite thing"));
    expect(favQ).toBeDefined();
    const wrongOptions = favQ!.options.filter(
      (_, i) => i !== favQ!.correctIndex
    );
    expect(wrongOptions).toContain("dinosaurs");
    expect(wrongOptions).toContain("unicorns");
  });

  it("favoriteThing wrong answers adapt when favoriteThing is 'dinosaurs'", () => {
    const config = spaceMission as ExperienceConfig;
    const dinVars = { ...vars, favoriteThing: "dinosaurs" };
    const questions = buildQuizQuestions(config.quiz.questions, dinVars);
    const favQ = questions.find((q) => q.prompt.includes("favourite thing"));
    expect(favQ).toBeDefined();
    const wrongOptions = favQ!.options.filter(
      (_, i) => i !== favQ!.correctIndex
    );
    expect(wrongOptions).toContain("dragons");
    expect(wrongOptions).toContain("unicorns");
  });
});

describe("buildQuizQuestions — princess-quest edition", () => {
  const vars = {
    childName: "Sofia",
    age: "7",
    favoriteThing: "unicorns",
    funFact1: "can speak to butterflies",
    location: "Royal Ballroom",
  };

  it("returns the correct number of questions", () => {
    const config = princessQuest as ExperienceConfig;
    const questions = buildQuizQuestions(config.quiz.questions, vars);
    expect(questions).toHaveLength(config.quiz.questions.length);
  });

  it("correct answer appears in options for every question", () => {
    const config = princessQuest as ExperienceConfig;
    const questions = buildQuizQuestions(config.quiz.questions, vars);
    for (const q of questions) {
      expect(q.options[q.correctIndex]).toBeTruthy();
    }
  });

  it("edition name appears as the correct answer for the edition question", () => {
    const config = princessQuest as ExperienceConfig;
    const questions = buildQuizQuestions(config.quiz.questions, vars);
    const editionQ = questions.find((q) =>
      q.prompt.toLowerCase().includes("quest")
    );
    expect(editionQ).toBeDefined();
    expect(editionQ!.options[editionQ!.correctIndex]).toBe("Princess Quest Edition");
  });
});
