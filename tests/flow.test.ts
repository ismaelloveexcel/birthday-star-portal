import { describe, it, expect } from "vitest";
import {
  initialState,
  transition,
  canGoBack,
  canGoNext,
  stepIndex,
  STEPS,
  type State,
  type StepId,
} from "@/features/portal/flow";

function stateAt(stepId: StepId, history: StepId[] = [], answers: Record<string, unknown> = {}): State {
  return { stepId, history, answers };
}

describe("initialState", () => {
  it("starts at ignition with empty history and answers", () => {
    const s = initialState();
    expect(s.stepId).toBe("ignition");
    expect(s.history).toEqual([]);
    expect(s.answers).toEqual({});
  });
});

describe("NEXT transition", () => {
  it("advances ignition → reveal and records history", () => {
    const s = transition(initialState(), { type: "NEXT" });
    expect(s.stepId).toBe("reveal");
    expect(s.history).toEqual(["ignition"]);
  });

  it("does not advance past the last step (done)", () => {
    const s = stateAt("done");
    expect(transition(s, { type: "NEXT" }).stepId).toBe("done");
  });

  it("advances through every consecutive pair in STEPS", () => {
    for (let i = 0; i < STEPS.length - 1; i++) {
      const from = STEPS[i];
      const to = STEPS[i + 1];
      const next = transition(stateAt(from), { type: "NEXT" });
      expect(next.stepId).toBe(to);
    }
  });
});

describe("BACK transition", () => {
  it("returns to the previous step and pops history", () => {
    let s = initialState();
    s = transition(s, { type: "NEXT" }); // → reveal
    s = transition(s, { type: "BACK" }); // → ignition
    expect(s.stepId).toBe("ignition");
    expect(s.history).toEqual([]);
  });

  it("does nothing when history is empty", () => {
    const s = initialState();
    const next = transition(s, { type: "BACK" });
    expect(next.stepId).toBe("ignition");
    expect(next.history).toEqual([]);
  });

  it("undoes multiple NEXT steps in LIFO order", () => {
    let s = initialState();
    s = transition(s, { type: "NEXT" }); // → reveal
    s = transition(s, { type: "NEXT" }); // → briefing
    s = transition(s, { type: "BACK" }); // → reveal
    expect(s.stepId).toBe("reveal");
    s = transition(s, { type: "BACK" }); // → ignition
    expect(s.stepId).toBe("ignition");
  });
});

describe("ANSWER transition", () => {
  it("stores a value without changing stepId or history", () => {
    const s = transition(initialState(), { type: "ANSWER", key: "rsvpDone", value: true });
    expect(s.answers.rsvpDone).toBe(true);
    expect(s.stepId).toBe("ignition");
    expect(s.history).toEqual([]);
  });

  it("merges answers rather than replacing them", () => {
    let s = transition(initialState(), { type: "ANSWER", key: "a", value: 1 });
    s = transition(s, { type: "ANSWER", key: "b", value: 2 });
    expect(s.answers).toEqual({ a: 1, b: 2 });
  });

  it("overwrites an existing key", () => {
    let s = transition(initialState(), { type: "ANSWER", key: "x", value: "old" });
    s = transition(s, { type: "ANSWER", key: "x", value: "new" });
    expect(s.answers.x).toBe("new");
  });
});

describe("QUIZ_COMPLETE transition", () => {
  it("transitions to badge and stores quizScore in answers", () => {
    const s = transition(stateAt("quiz", ["ignition", "reveal", "briefing", "countdown", "rsvp"]), {
      type: "QUIZ_COMPLETE",
      score: 4,
    });
    expect(s.stepId).toBe("badge");
    expect(s.answers.quizScore).toBe(4);
  });

  it("pushes quiz onto history", () => {
    const s = transition(stateAt("quiz"), { type: "QUIZ_COMPLETE", score: 2 });
    expect(s.history).toContain("quiz");
  });

  it("preserves existing answers alongside quizScore", () => {
    const base = { stepId: "quiz" as StepId, history: [], answers: { rsvpDone: true } };
    const next = transition(base, { type: "QUIZ_COMPLETE", score: 5 });
    expect(next.answers.rsvpDone).toBe(true);
    expect(next.answers.quizScore).toBe(5);
  });
});

describe("canGoBack", () => {
  it("is false when history is empty", () => {
    expect(canGoBack(initialState())).toBe(false);
  });

  it("is true when history has entries", () => {
    const s = transition(initialState(), { type: "NEXT" });
    expect(canGoBack(s)).toBe(true);
  });
});

describe("canGoNext", () => {
  it("is true for the first step (ignition)", () => {
    expect(canGoNext(initialState())).toBe(true);
  });

  it("is false for the last step (done)", () => {
    expect(canGoNext(stateAt("done"))).toBe(false);
  });

  it("is true for every step except done", () => {
    for (const id of STEPS.slice(0, -1)) {
      expect(canGoNext(stateAt(id))).toBe(true);
    }
  });
});

describe("stepIndex", () => {
  it("returns 0 for ignition", () => {
    expect(stepIndex(initialState())).toBe(0);
  });

  it("returns the correct index for every step", () => {
    for (let i = 0; i < STEPS.length; i++) {
      expect(stepIndex(stateAt(STEPS[i]))).toBe(i);
    }
  });
});

describe("full flow walkthrough", () => {
  it("can navigate forward through all steps via NEXT and QUIZ_COMPLETE", () => {
    let s = initialState();
    // ignition → reveal → briefing → countdown → rsvp → quiz
    for (let i = 0; i < 5; i++) {
      s = transition(s, { type: "NEXT" });
    }
    expect(s.stepId).toBe("quiz");

    // Quiz completion jumps to badge
    s = transition(s, { type: "QUIZ_COMPLETE", score: 3 });
    expect(s.stepId).toBe("badge");
    expect(s.answers.quizScore).toBe(3);

    // badge → starlog → done
    s = transition(s, { type: "NEXT" });
    expect(s.stepId).toBe("starlog");
    s = transition(s, { type: "NEXT" });
    expect(s.stepId).toBe("done");
    expect(canGoNext(s)).toBe(false);
  });

  it("can navigate back from done all the way to ignition", () => {
    // Build a state at done with full history
    let s = initialState();
    for (let i = 0; i < STEPS.length - 1; i++) {
      const step = STEPS[i];
      if (step === "quiz") {
        s = transition(s, { type: "QUIZ_COMPLETE", score: 5 });
      } else {
        s = transition(s, { type: "NEXT" });
      }
    }
    expect(s.stepId).toBe("done");

    // Walk all the way back
    while (canGoBack(s)) {
      s = transition(s, { type: "BACK" });
    }
    expect(s.stepId).toBe("ignition");
    expect(s.history).toEqual([]);
  });
});
