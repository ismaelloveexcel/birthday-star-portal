import { interpolate } from "@/lib/experience/interpolate";
import type { ExperienceQuizQuestion } from "@/lib/schemas/experience";

export interface QuizQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
}

interface BuildQuizQuestionsInput {
  childName: string;
  age: string;
  favoriteThing: string;
  funFacts: [string, string, string];
  location: string;
  questions: ExperienceQuizQuestion[];
}

function shuffle<T>(arr: T[], seed: number): T[] {
  const copy = arr.slice();
  let state = seed || 1;
  for (let index = copy.length - 1; index > 0; index--) {
    state = (state * 9301 + 49297) % 233280;
    const swapIndex = Math.floor((state / 233280) * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function buildQuizQuestions(input: BuildQuizQuestionsInput): QuizQuestion[] {
  const ageNumber = Math.max(1, parseInt(input.age, 10) || 1);
  const ageMinusOne = Math.max(1, ageNumber - 1);
  const agePlusTwo = ageNumber + 2;
  const favoriteThing = input.favoriteThing.trim().toLowerCase();

  const vars = {
    age: String(ageNumber),
    ageMinusOne: String(ageMinusOne === ageNumber ? ageNumber + 1 : ageMinusOne),
    agePlusTwo: String(agePlusTwo),
    childName: input.childName,
    favoriteThing: input.favoriteThing,
    funFact1: input.funFacts[0],
    funFact2: input.funFacts[1],
    funFact3: input.funFacts[2],
    location: input.location,
  };

  return input.questions.map((question, index) => {
    const correct = interpolate(question.correctAnswerTemplate, vars);
    const fallbackWrongAnswers = question.wrongAnswers.map((answer) => interpolate(answer, vars));
    const wrongAnswers = question.legacyBehavior?.wrongAnswersByFavoriteThing[favoriteThing]
      ?.map((answer) => interpolate(answer, vars)) ?? fallbackWrongAnswers;
    const options = shuffle([correct, ...wrongAnswers], (input.childName.length + 1) * (index + 7));

    return {
      prompt: interpolate(question.promptTemplate, vars),
      options,
      correctIndex: options.indexOf(correct),
    };
  });
}