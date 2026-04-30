/**
 * Pure state machine for the Birthday Portal step-by-step flow.
 *
 * No React or DOM imports — this module is safe to import in any context
 * (tests, server components, client components) and is fully unit-testable.
 */

export type StepId =
  | "ignition"
  | "reveal"
  | "briefing"
  | "countdown"
  | "rsvp"
  | "quiz"
  | "badge"
  | "starlog"
  | "done";

/** Ordered list of all portal steps. */
export const STEPS: readonly StepId[] = [
  "ignition",
  "reveal",
  "briefing",
  "countdown",
  "rsvp",
  "quiz",
  "badge",
  "starlog",
  "done",
] as const;

export type State = {
  /** The currently visible step. */
  stepId: StepId;
  /** Stack of previously visited steps — supports Back navigation. */
  history: StepId[];
  /** Arbitrary user answers keyed by string (e.g. quizScore). */
  answers: Record<string, unknown>;
};

export type PortalEvent =
  | { type: "NEXT" }
  | { type: "BACK" }
  | { type: "ANSWER"; key: string; value: unknown }
  | { type: "QUIZ_COMPLETE"; score: number };

/** Returns the default starting state. */
export function initialState(): State {
  return { stepId: "ignition", history: [], answers: {} };
}

/** Pure transition function — given a state and an event, returns the next state. */
export function transition(state: State, event: PortalEvent): State {
  switch (event.type) {
    case "NEXT": {
      const idx = STEPS.indexOf(state.stepId);
      if (idx < 0 || idx >= STEPS.length - 1) return state;
      const next = STEPS[idx + 1];
      return {
        ...state,
        stepId: next,
        history: [...state.history, state.stepId],
      };
    }

    case "BACK": {
      if (state.history.length === 0) return state;
      const prev = state.history[state.history.length - 1];
      return {
        ...state,
        stepId: prev,
        history: state.history.slice(0, -1),
      };
    }

    case "ANSWER": {
      return {
        ...state,
        answers: { ...state.answers, [event.key]: event.value },
      };
    }

    case "QUIZ_COMPLETE": {
      return {
        ...state,
        stepId: "badge",
        history: [...state.history, state.stepId],
        answers: { ...state.answers, quizScore: event.score },
      };
    }
  }
}

/** True when the Back button should be available. */
export function canGoBack(state: State): boolean {
  return state.history.length > 0;
}

/** True when a NEXT event would change the step. */
export function canGoNext(state: State): boolean {
  const idx = STEPS.indexOf(state.stepId);
  return idx >= 0 && idx < STEPS.length - 1;
}

/** 0-based index of the current step within STEPS. */
export function stepIndex(state: State): number {
  return STEPS.indexOf(state.stepId);
}
