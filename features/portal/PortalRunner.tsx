"use client";

import { useMemo, useReducer } from "react";
import { sectionRegistry, type PortalSectionContext } from "@/features/portal/sectionRegistry";
import { createFlowReducer, createInitialFlowState } from "@/features/portal/flow";
import type { Experience } from "@/lib/schemas/experience";

type PortalRunnerProps = Omit<PortalSectionContext, "score" | "onQuizComplete"> & {
  experience: Experience;
};

export default function PortalRunner({ experience, ...context }: PortalRunnerProps) {
  const flow = experience.flow;
  const reducer = useMemo(() => createFlowReducer(flow), [flow]);
  const [state, dispatch] = useReducer(reducer, flow, createInitialFlowState);

  const currentSection = experience.sections.find((section) => section.id === state.stepId) ?? experience.sections[0];
  const score = typeof state.answers.quizScore === "number" ? state.answers.quizScore : null;
  const currentIndex = flow.indexOf(state.stepId);
  const isLastStep = currentIndex === flow.length - 1;
  const canGoBack = state.history.length > 0;
  const canGoNext = currentSection?.type !== "quiz" || score !== null;
  const Section = currentSection ? sectionRegistry[currentSection.type] : null;
  const demoCtaSection = experience.sections.find((section) => section.type === "demoCta");
  const DemoCta = demoCtaSection ? sectionRegistry[demoCtaSection.type] : null;
  const demoBannerSection = experience.sections.find((section) => section.type === "demoBanner");
  const DemoBanner = demoBannerSection ? sectionRegistry[demoBannerSection.type] : null;

  const sectionContext: PortalSectionContext = {
    ...context,
    experience,
    score,
    onQuizComplete: (nextScore) => {
      dispatch({ type: "setAnswer", key: "quizScore", value: nextScore });
    },
  };

  return (
    <div className="relative overflow-hidden" style={{ background: "var(--color-void)" }}>
      {DemoBanner && demoBannerSection ? (
        <DemoBanner context={sectionContext} props={demoBannerSection.props} />
      ) : null}

      {Section && currentSection ? (
        <Section context={sectionContext} props={currentSection.props} />
      ) : null}

      {isLastStep && context.isDemo && DemoCta && demoCtaSection ? (
        <DemoCta context={sectionContext} props={demoCtaSection.props} />
      ) : null}

      <div className="px-5 pb-10">
        <div className="max-w-3xl mx-auto card p-4 flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="text-xs uppercase tracking-widest text-comet">
            Step {Math.max(currentIndex + 1, 1)} of {flow.length}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => dispatch({ type: canGoBack ? "back" : "restart" })}
              className="btn-secondary"
            >
              {canGoBack ? "Back" : "Restart"}
            </button>
            {!isLastStep ? (
              <button
                type="button"
                onClick={() => dispatch({ type: "next" })}
                disabled={!canGoNext}
                className="btn-primary"
                style={{ opacity: canGoNext ? 1 : 0.5 }}
              >
                Next
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}