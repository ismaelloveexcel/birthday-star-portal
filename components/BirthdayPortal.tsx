"use client";

import { useReducer, useRef } from "react";
import Countdown from "./Countdown";
import RSVPAction from "./RSVPAction";
import QuizGame from "./QuizGame";
import SpaceBadge from "./SpaceBadge";
import { config } from "@/lib/config";
import { formatDate } from "@/lib/utils";
import {
  initialState,
  transition,
  canGoBack,
  STEPS,
  stepIndex,
  type StepId,
} from "@/features/portal/flow";

export interface BirthdayPortalProps {
  childName: string;
  age: string;
  partyDate: string;
  partyTime: string;
  location: string;
  parentContact: string;
  favoriteThing: string;
  funFacts: [string, string, string];
  timezone?: string;
  isDemo?: boolean;
}

const STEP_LABELS: Record<StepId, string> = {
  ignition: "Ignition",
  reveal: "Captain Reveal",
  briefing: "Mission Briefing",
  countdown: "Countdown",
  rsvp: "Crew Check-In",
  quiz: "Cadet Challenge",
  badge: "Space Badge",
  starlog: "Star Log",
  done: "Mission Complete",
};

export default function BirthdayPortal(props: BirthdayPortalProps) {
  const {
    childName,
    age,
    partyDate,
    partyTime,
    location,
    parentContact,
    favoriteThing,
    funFacts,
    timezone = "Asia/Dubai",
    isDemo = false,
  } = props;

  const [state, dispatch] = useReducer(transition, undefined, initialState);
  const topRef = useRef<HTMLDivElement>(null);

  function go(event: Parameters<typeof transition>[1]) {
    dispatch(event);
    // Scroll the portal container back to its own top (works both standalone
    // and when embedded inside the landing-page demo container).
    setTimeout(() => {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  const step = state.stepId;
  const idx = stepIndex(state);
  const progress = (idx / (STEPS.length - 1)) * 100;
  const quizScore = typeof state.answers.quizScore === "number" ? state.answers.quizScore : 0;

  const upperName = childName.toUpperCase();
  const ageOrdinal = `${age}TH`;

  // Navigation visibility
  // ignition: has its own "Begin Mission" CTA — no nav footer needed.
  // quiz: QuizGame manages its own submission — only Back is shown.
  // done: terminal step — only Back is shown.
  const showBack = step !== "ignition" && canGoBack(state);
  const showNext = step !== "ignition" && step !== "quiz" && step !== "done";

  return (
    <div ref={topRef} className="relative overflow-hidden" style={{ background: "var(--color-void)" }}>
      {/* Demo banner */}
      {isDemo && (
        <div
          className="sticky top-0 z-30 w-full text-center text-sm md:text-base px-3 py-2 flex flex-wrap items-center justify-center gap-2"
          style={{
            background: "rgba(124, 77, 255, 0.18)",
            borderBottom: "1px solid rgba(124,77,255,0.45)",
            backdropFilter: "blur(8px)",
          }}
        >
          <span>👀 This is a demo — Create yours for {config.PRICE}</span>
          <a href="#form" className="btn-secondary" style={{ minHeight: 36, padding: "0.35rem 0.9rem" }}>
            Create My Portal →
          </a>
        </div>
      )}

      {/* Step progress bar */}
      <div
        className="sticky top-0 z-20 w-full"
        style={{ background: "rgba(5,8,24,0.85)", backdropFilter: "blur(8px)" }}
        aria-label={`Step ${idx + 1} of ${STEPS.length}: ${STEP_LABELS[step]}`}
      >
        <div
          className="h-0.5 w-full"
          style={{ background: "rgba(255,255,255,0.08)" }}
          role="progressbar"
          aria-valuenow={idx + 1}
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
        >
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, var(--color-plasma), var(--color-nova))",
            }}
          />
        </div>
        <div className="text-xs uppercase tracking-widest text-center text-comet py-1.5">
          {STEP_LABELS[step]}
          <span className="ml-2 opacity-40">{idx + 1}/{STEPS.length}</span>
        </div>
      </div>

      {/* === Step: ignition === */}
      {step === "ignition" && (
        <section
          className="section relative flex flex-col items-center justify-center min-h-[80vh] text-center"
          aria-labelledby="portal-ignition-heading"
        >
          <div className="star-field" aria-hidden="true" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="portal-ring mb-8" aria-hidden="true" />
            <div id="portal-ignition-heading" className="font-display text-2xl md:text-4xl text-glow fade-up">
              MISSION ACCESS GRANTED
            </div>
            <div className="mt-3 text-comet fade-up" style={{ animationDelay: "0.4s" }}>
              Initiating birthday mission sequence…
            </div>
            <button
              type="button"
              onClick={() => go({ type: "NEXT" })}
              className="btn-primary mt-10 fade-up"
              style={{ animationDelay: "0.8s" }}
            >
              Begin Mission →
            </button>
          </div>
        </section>
      )}

      {/* === Step: reveal === */}
      {step === "reveal" && (
        <section
          className="section relative text-center min-h-[80vh] flex flex-col items-center justify-center"
          aria-labelledby="captain-reveal-heading"
        >
          <div className="star-field" aria-hidden="true" />
          <div className="relative z-10">
            <div className="text-comet text-xs uppercase tracking-widest mb-4 fade-up">
              Captain Reveal
            </div>
            <h1 className="font-display text-4xl md:text-7xl leading-tight text-glow captain-reveal-line">
              <span className="sr-only" id="captain-reveal-heading">
                Captain {childName}&apos;s {ageOrdinal} Birthday Mission
              </span>
              {("CAPTAIN " + upperName + "'S").split("").map((c, i) => (
                <span key={i} aria-hidden="true" style={{ animationDelay: `${0.05 * i}s` }}>
                  {c === " " ? "\u00A0" : c}
                </span>
              ))}
            </h1>
            <h2
              className="font-display text-3xl md:text-6xl mt-3 text-glow-violet captain-reveal-line"
              style={{ color: "var(--color-nova)" }}
              aria-hidden="true"
            >
              {(`${ageOrdinal} BIRTHDAY MISSION`).split("").map((c, i) => (
                <span key={i} style={{ animationDelay: `${0.6 + 0.05 * i}s` }}>
                  {c === " " ? "\u00A0" : c}
                </span>
              ))}
            </h2>
            <p className="mt-6 text-comet max-w-xl mx-auto fade-up" style={{ animationDelay: "1.4s" }}>
              A special mission briefing has been prepared for all crew members.
            </p>
          </div>
        </section>
      )}

      {/* === Step: briefing === */}
      {step === "briefing" && (
        <section className="section" aria-labelledby="briefing-heading">
          <div className="max-w-2xl mx-auto card p-6 md:p-10 fade-up">
            <div className="text-xs uppercase tracking-widest text-comet">
              Classified · Galactic Mission Briefing
            </div>
            <h3 id="briefing-heading" className="font-display text-2xl md:text-3xl text-glow mt-2 mb-2">
              ATTENTION CREW
            </h3>
            <p className="text-star/90 mb-6">
              You are hereby invited to join Captain {childName}&apos;s {age}th Birthday Mission.
            </p>
            <div className="grid sm:grid-cols-2 gap-3 text-sm md:text-base">
              <div className="card p-4">
                <div className="text-comet text-xs uppercase tracking-widest">
                  <span aria-hidden="true">📅 </span>Mission Date
                </div>
                <div className="mt-1">{formatDate(partyDate)}</div>
              </div>
              <div className="card p-4">
                <div className="text-comet text-xs uppercase tracking-widest">
                  <span aria-hidden="true">⏰ </span>Launch Time
                </div>
                <div className="mt-1">{partyTime}</div>
              </div>
              <div className="card p-4">
                <div className="text-comet text-xs uppercase tracking-widest">
                  <span aria-hidden="true">📍 </span>Mission Base
                </div>
                <div className="mt-1">{location}</div>
              </div>
              <div className="card p-4">
                <div className="text-comet text-xs uppercase tracking-widest">
                  <span aria-hidden="true">🎖 </span>Mission Theme
                </div>
                <div className="mt-1">{config.PRODUCT_EDITION}</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* === Step: countdown === */}
      {step === "countdown" && (
        <section className="section text-center" aria-labelledby="countdown-heading">
          <h3 id="countdown-heading" className="font-display text-2xl md:text-3xl text-glow mb-8">
            MISSION LAUNCH COUNTDOWN
          </h3>
          <div className="relative inline-block w-full">
            <Countdown partyDate={partyDate} partyTime={partyTime} timezone={timezone} />
          </div>
          <div className="mt-3 text-xs text-comet">
            Timezone: {timezone}
          </div>
        </section>
      )}

      {/* === Step: rsvp === */}
      {step === "rsvp" && (
        <section className="section text-center" aria-labelledby="rsvp-heading">
          <h3 id="rsvp-heading" className="font-display text-2xl md:text-3xl text-glow mb-2">
            FORCEFIELD CREW CHECK-IN
          </h3>
          <p className="text-comet mb-6">Confirm your mission attendance</p>
          <RSVPAction parentContact={parentContact} childName={childName} />
        </section>
      )}

      {/* === Step: quiz === */}
      {step === "quiz" && (
        <section className="section" aria-labelledby="cadet-challenge-heading">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <h3 id="cadet-challenge-heading" className="font-display text-2xl md:text-3xl text-glow">
                CADET CHALLENGE
              </h3>
              <p className="text-comet mt-2">
                Complete your training to earn Space Badges
              </p>
            </div>
            <QuizGame
              childName={childName}
              age={age}
              favoriteThing={favoriteThing}
              funFacts={funFacts}
              location={location}
              onComplete={(s) => go({ type: "QUIZ_COMPLETE", score: s })}
            />
          </div>
        </section>
      )}

      {/* === Step: badge === */}
      {step === "badge" && (
        <section className="section" aria-label="Space Cadet Certificate">
          <SpaceBadge score={quizScore} childName={childName} totalQuestions={5} />
        </section>
      )}

      {/* === Step: starlog === */}
      {step === "starlog" && (
        <section className="section" aria-labelledby="star-log-heading">
          <div className="max-w-xl mx-auto card p-6 md:p-8 relative overflow-hidden fade-up">
            <div
              aria-hidden="true"
              className="absolute -top-10 -left-10 w-32 h-32 rounded-full opacity-30"
              style={{
                background: "radial-gradient(circle, var(--color-nova), transparent 60%)",
              }}
            />
            <div className="text-xs uppercase tracking-widest text-comet">
              <span aria-hidden="true">🛰 </span>Classified
            </div>
            <h3 id="star-log-heading" className="font-display text-xl md:text-2xl text-glow-violet mt-1 mb-3">
              SECRET STAR LOG
            </h3>
            <p className="text-comet text-sm mb-4">
              Classified mission intelligence — for crew eyes only
            </p>
            <blockquote
              className="border-l-2 pl-4 italic text-star"
              style={{ borderColor: "var(--color-gold)" }}
            >
              &ldquo;{funFacts[1] ?? ""}&rdquo;
            </blockquote>
            <div className="mt-4 text-right text-xs uppercase tracking-widest text-comet">
              <span aria-hidden="true">★ </span>Mission Seal — Captain {childName}
            </div>
          </div>
        </section>
      )}

      {/* === Step: done === */}
      {step === "done" && (
        <>
          <section className="section text-center" aria-labelledby="viral-loop-heading">
            <div className="max-w-md mx-auto">
              <p id="viral-loop-heading" className="text-star/90">
                <span aria-hidden="true">✨ </span>Want to create a magical birthday mission for your child?
              </p>
              <a
                href={config.BASE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary mt-4"
              >
                Create your own Birthday Star Portal →
              </a>
              <div className="mt-6 text-xs uppercase tracking-widest text-comet">
                {config.BRAND_NAME}
              </div>
            </div>
          </section>
          {isDemo && (
            <section className="section text-center" aria-labelledby="demo-cta-heading">
              <div className="max-w-md mx-auto card p-6">
                <h4 id="demo-cta-heading" className="font-display text-xl text-glow mb-3">
                  Ready to launch your own birthday mission?
                </h4>
                <a href="#form" className="btn-primary">
                  Create My Portal — {config.PRICE} →
                </a>
              </div>
            </section>
          )}
        </>
      )}

      {/* Step navigation footer */}
      {(showBack || showNext) && (
        <div className="flex items-center justify-between px-5 pb-12 pt-6 max-w-2xl mx-auto">
          {showBack ? (
            <button
              type="button"
              onClick={() => go({ type: "BACK" })}
              className="btn-secondary"
              style={{ minHeight: 48, padding: "0.5rem 1.25rem" }}
            >
              ← Back
            </button>
          ) : (
            <div />
          )}
          {showNext && (
            <button
              type="button"
              onClick={() => go({ type: "NEXT" })}
              className="btn-primary"
              style={{ minHeight: 48, padding: "0.5rem 1.25rem" }}
            >
              Continue →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
