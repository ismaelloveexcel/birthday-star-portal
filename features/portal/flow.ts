export interface FlowState {
  stepId: string;
  history: string[];
  answers: Record<string, unknown>;
}

export function createInitialFlowState(flow: string[]): FlowState {
  return {
    stepId: flow[0] ?? "",
    history: [],
    answers: {},
  };
}

export function next(state: FlowState, flow: string[]): FlowState {
  const currentIndex = flow.indexOf(state.stepId);
  if (currentIndex === -1 || currentIndex >= flow.length - 1) return state;

  return {
    ...state,
    stepId: flow[currentIndex + 1],
    history: [...state.history, state.stepId],
  };
}

export function back(state: FlowState): FlowState {
  const previous = state.history[state.history.length - 1];
  if (!previous) return state;

  return {
    ...state,
    stepId: previous,
    history: state.history.slice(0, -1),
  };
}

export function setAnswer(state: FlowState, key: string, value: unknown): FlowState {
  return {
    ...state,
    answers: {
      ...state.answers,
      [key]: value,
    },
  };
}

export function choose(
  state: FlowState,
  flow: string[],
  key: string,
  value: unknown,
  targetStepId: string
): FlowState {
  if (!flow.includes(targetStepId)) return state;

  return {
    stepId: targetStepId,
    history: [...state.history, state.stepId],
    answers: {
      ...state.answers,
      [key]: value,
    },
  };
}

export type FlowAction =
  | { type: "next" }
  | { type: "back" }
  | { type: "setAnswer"; key: string; value: unknown }
  | { type: "choose"; key: string; value: unknown; targetStepId: string }
  | { type: "restart" };

export function createFlowReducer(flow: string[]) {
  return (state: FlowState, action: FlowAction): FlowState => {
    switch (action.type) {
      case "next":
        return next(state, flow);
      case "back":
        return back(state);
      case "setAnswer":
        return setAnswer(state, action.key, action.value);
      case "choose":
        return choose(state, flow, action.key, action.value, action.targetStepId);
      case "restart":
        return createInitialFlowState(flow);
      default:
        return state;
    }
  };
}