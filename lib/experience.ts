// Types and helpers for config-driven experience editions.

export interface QuizQuestionTemplate {
  prompt: string;
  correct: string;
  wrong: string[];
}

export interface ExperienceConfig {
  id: string;
  name: string;
  quiz: {
    questions: QuizQuestionTemplate[];
  };
}

export interface QuizQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
}

export interface QuizTemplateVars {
  childName: string;
  age: string;
  favoriteThing: string;
  funFact1: string;
  location: string;
}

// Deterministic seeded shuffle — same algorithm as the original QuizGame component.
function shuffle<T>(arr: T[], seed: number): T[] {
  const a = arr.slice();
  let s = seed || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildTemplateVars(v: QuizTemplateVars): Record<string, string> {
  const ageNum = Math.max(1, parseInt(v.age, 10) || 1);
  const ageMinus = Math.max(1, ageNum - 1);
  const agePlusTwo = ageNum + 2;
  const agePrev = String(ageMinus === ageNum ? ageNum + 1 : ageMinus);

  const fav = v.favoriteThing.trim().toLowerCase();
  let favoriteThingWrong1: string;
  let favoriteThingWrong2: string;
  if (fav === "dinosaurs") {
    favoriteThingWrong1 = "dragons";
    favoriteThingWrong2 = "unicorns";
  } else if (fav === "unicorns") {
    favoriteThingWrong1 = "dinosaurs";
    favoriteThingWrong2 = "rockets";
  } else {
    favoriteThingWrong1 = "dinosaurs";
    favoriteThingWrong2 = "unicorns";
  }

  return {
    "{{childName}}": v.childName,
    "{{age}}": String(ageNum),
    "{{agePrev}}": agePrev,
    "{{agePlusTwo}}": String(agePlusTwo),
    "{{favoriteThing}}": v.favoriteThing,
    "{{favoriteThingWrong1}}": favoriteThingWrong1,
    "{{favoriteThingWrong2}}": favoriteThingWrong2,
    "{{funFact1}}": v.funFact1,
    "{{location}}": v.location,
  };
}

function interpolate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (acc, [token, value]) => acc.split(token).join(value),
    template
  );
}

/**
 * Resolve question templates against runtime vars and return shuffled QuizQuestion[].
 * The shuffle is seeded from the child's name length for deterministic server/client parity.
 */
export function buildQuizQuestions(
  templates: QuizQuestionTemplate[],
  vars: QuizTemplateVars
): QuizQuestion[] {
  const tv = buildTemplateVars(vars);
  return templates.map((t, idx) => {
    const prompt = interpolate(t.prompt, tv);
    const correct = interpolate(t.correct, tv);
    const wrong: [string, string] = [
      interpolate(t.wrong[0] ?? "", tv),
      interpolate(t.wrong[1] ?? "", tv),
    ];
    const all = [correct, ...wrong];
    // Seed per question using name length + index — same formula as original component.
    const seed = (vars.childName.length + 1) * (idx + 7);
    const shuffled = shuffle(all, seed);
    return {
      prompt,
      options: shuffled,
      correctIndex: shuffled.indexOf(correct),
    };
  });
}
