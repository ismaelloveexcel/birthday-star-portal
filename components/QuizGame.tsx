"use client";

import { useState } from "react";
import { interpolate } from "@/lib/experience/interpolate";
import type { QuizQuestion } from "@/lib/experience/buildQuizQuestions";

interface QuizGameProps {
  questions: QuizQuestion[];
  questionLabelTemplate: string;
  submitLabel: string;
  incompleteLabel: string;
  onComplete: (score: number) => void;
}

export default function QuizGame(props: QuizGameProps) {
  const { incompleteLabel, onComplete, questionLabelTemplate, questions, submitLabel } = props;
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
            {interpolate(questionLabelTemplate, {
              current: String(qi + 1),
              total: String(questions.length),
            })}
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
            {submitLabel}
          </button>
          {!allAnswered && (
            <div className="text-comet text-sm mt-2">
              {incompleteLabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
