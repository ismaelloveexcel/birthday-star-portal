"use client";

import { useMemo, useState } from "react";

interface QuizGameProps {
  childName: string;
  age: string;
  favoriteThing: string;
  funFacts: [string, string, string];
  location: string;
  onComplete: (score: number) => void;
}

interface Question {
  prompt: string;
  options: string[];
  correctIndex: number;
}

// Deterministic seeded shuffle so server/client render the same order.
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

function buildQuestions(p: Omit<QuizGameProps, "onComplete">): Question[] {
  const ageNum = Math.max(1, parseInt(p.age, 10) || 1);
  const ageMinus = Math.max(1, ageNum - 1);
  const agePlus = ageNum + 2;

  // Q2 fallback wrong options
  const fav = p.favoriteThing.trim().toLowerCase();
  let q2Wrong: string[];
  if (fav === "dinosaurs") q2Wrong = ["dragons", "unicorns"];
  else if (fav === "unicorns") q2Wrong = ["dinosaurs", "rockets"];
  else q2Wrong = ["dinosaurs", "unicorns"];

  const raw: Array<{ prompt: string; correct: string; wrong: [string, string] }> = [
    {
      prompt: `How old is Captain ${p.childName} turning?`,
      correct: String(ageNum),
      wrong: [String(ageMinus === ageNum ? ageNum + 1 : ageMinus), String(agePlus)],
    },
    {
      prompt: `What is Captain ${p.childName}'s favourite thing?`,
      correct: p.favoriteThing,
      wrong: [q2Wrong[0], q2Wrong[1]],
    },
    {
      prompt: `Which secret star log belongs to Captain ${p.childName}?`,
      correct: p.funFacts[0],
      wrong: [
        "once tried to teach a fish to sing",
        "believes they invented the high five",
      ],
    },
    {
      prompt: "Where is the mission taking place?",
      correct: p.location,
      wrong: ["Galaxy Garden", "Moon Base Camp"],
    },
    {
      prompt: "Which mission are you joining today?",
      correct: "Space Mission Edition",
      wrong: ["Ocean Explorer Edition", "Jungle Safari Edition"],
    },
  ];

  return raw.map((q, idx) => {
    const all = [q.correct, ...q.wrong];
    // seed per question using name length + index for stability
    const seed = (p.childName.length + 1) * (idx + 7);
    const shuffled = shuffle(all, seed);
    return {
      prompt: q.prompt,
      options: shuffled,
      correctIndex: shuffled.indexOf(q.correct),
    };
  });
}

export default function QuizGame(props: QuizGameProps) {
  const { onComplete } = props;
  const questions = useMemo(() => buildQuestions(props), [props]);
  const [answers, setAnswers] = useState<Array<number | null>>(
    () => new Array(questions.length).fill(null)
  );
  const [submitted, setSubmitted] = useState(false);

  function pick(qi: number, oi: number) {
    if (submitted) return;
    const next = answers.slice();
    next[qi] = oi;
    setAnswers(next);
  }

  function submit() {
    const score = answers.reduce<number>((acc, a, i) => {
      return acc + (a !== null && a === questions[i].correctIndex ? 1 : 0);
    }, 0);
    setSubmitted(true);
    onComplete(score);
  }

  const allAnswered = answers.every((a) => a !== null);

  return (
    <div className="space-y-6">
      {questions.map((q, qi) => (
        <div key={qi} className="card p-5 md:p-6">
          <div className="text-xs uppercase tracking-widest text-comet mb-2">
            Question {qi + 1} of {questions.length}
          </div>
          <h4 className="font-display text-lg md:text-xl mb-4">{q.prompt}</h4>
          <div className="grid gap-2">
            {q.options.map((opt, oi) => {
              const selected = answers[qi] === oi;
              const isCorrect = oi === q.correctIndex;
              const showResult = submitted && (selected || isCorrect);
              const bg = showResult
                ? isCorrect
                  ? "rgba(0,230,118,0.15)"
                  : selected
                  ? "rgba(255,82,82,0.15)"
                  : "transparent"
                : selected
                ? "rgba(79,195,247,0.18)"
                : "transparent";
              const border = showResult
                ? isCorrect
                  ? "var(--color-success)"
                  : selected
                  ? "var(--color-danger)"
                  : "rgba(168,180,212,0.25)"
                : selected
                ? "var(--color-plasma)"
                : "rgba(168,180,212,0.25)";
              return (
                <button
                  key={oi}
                  type="button"
                  onClick={() => pick(qi, oi)}
                  disabled={submitted}
                  aria-pressed={selected}
                  aria-label={
                    submitted
                      ? `${opt} — ${
                          isCorrect
                            ? "correct answer"
                            : selected
                            ? "incorrect answer"
                            : "not selected"
                        }`
                      : opt
                  }
                  className="text-left rounded-lg px-4 py-3 transition"
                  style={{
                    minHeight: 48,
                    background: bg,
                    border: `1px solid ${border}`,
                    color: "var(--color-star)",
                    cursor: submitted ? "default" : "pointer",
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {!submitted && (
        <div className="text-center">
          <button
            type="button"
            onClick={submit}
            disabled={!allAnswered}
            className="btn-primary"
            style={{ opacity: allAnswered ? 1 : 0.5 }}
          >
            Submit Mission
          </button>
          {!allAnswered && (
            <div className="text-comet text-sm mt-2">
              Answer every question to submit.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
