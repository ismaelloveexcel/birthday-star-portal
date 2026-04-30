import { describe, expect, it } from "vitest";
import { back, createInitialFlowState, next, setAnswer } from "@/features/portal/flow";

describe("portal flow", () => {
  const flow = ["portal-ignition", "captain-reveal", "quiz", "badge", "viral-loop"];

  it("starts at the first configured step", () => {
    expect(createInitialFlowState(flow)).toEqual({
      stepId: "portal-ignition",
      history: [],
      answers: {},
    });
  });

  it("advances through the configured flow order", () => {
    const initial = createInitialFlowState(flow);
    const advanced = next(initial, flow);
    expect(advanced.stepId).toBe("captain-reveal");
    expect(advanced.history).toEqual(["portal-ignition"]);
  });

  it("goes back to the previous step", () => {
    const initial = createInitialFlowState(flow);
    const advanced = next(next(initial, flow), flow);
    expect(back(advanced)).toEqual({
      stepId: "captain-reveal",
      history: ["portal-ignition"],
      answers: {},
    });
  });

  it("stores answers in reducer state", () => {
    const initial = createInitialFlowState(flow);
    expect(setAnswer(initial, "quizScore", 4).answers.quizScore).toBe(4);
  });
});