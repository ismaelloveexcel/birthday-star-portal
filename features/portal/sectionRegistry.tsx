"use client";

import dynamic from "next/dynamic";
import Countdown from "@/components/Countdown";
import RSVPAction from "@/components/RSVPAction";
import SpaceBadge from "@/components/SpaceBadge";
import { config } from "@/lib/config";
import { buildQuizQuestions } from "@/lib/experience/buildQuizQuestions";
import { interpolate } from "@/lib/experience/interpolate";
import { formatDate } from "@/lib/utils";
import type { Experience, ExperienceSectionType } from "@/lib/schemas/experience";

const QuizGame = dynamic(() => import("@/components/QuizGame"), { ssr: false });

export interface PortalSectionContext {
  experience: Experience;
  childName: string;
  age: string;
  partyDate: string;
  partyTime: string;
  location: string;
  parentContact: string;
  favoriteThing: string;
  funFacts: [string, string, string];
  timezone: string;
  isDemo: boolean;
  answers: Record<string, unknown>;
  score: number | null;
  onQuizComplete: (score: number) => void;
  onChoiceSelect: (key: string, value: string, targetStepId: string) => void;
}

interface PortalSectionProps {
  context: PortalSectionContext;
  props: Record<string, string | number | boolean>;
}

function templateVars(context: PortalSectionContext) {
  return {
    age: context.age,
    ageOrdinal: `${context.age}TH`,
    baseUrl: config.BASE_URL,
    brandName: context.experience.copy.viralLoop.brandFooter,
    childName: context.childName,
    editionName: context.experience.theme.editionName,
    favoriteThing: context.favoriteThing,
    funFact1: context.funFacts[0],
    funFact2: context.funFacts[1],
    funFact3: context.funFacts[2],
    location: context.location,
    missionPath: typeof context.answers.missionPath === "string" ? context.answers.missionPath : "secret star trail",
    price: config.PRICE,
    score: context.score === null ? "" : String(context.score),
    timezone: context.timezone,
    totalQuestions: String(context.experience.quiz.questions.length),
    upperChildName: context.childName.toUpperCase(),
  };
}

function propText(props: Record<string, string | number | boolean>, key: string, fallback = ""): string {
  const value = props[key];
  return typeof value === "string" ? value : fallback;
}

function DemoBannerSection({ context }: PortalSectionProps) {
  if (!context.isDemo) return null;

  return (
    <div
      className="sticky top-0 z-30 w-full text-center text-sm md:text-base px-3 py-2 flex flex-wrap items-center justify-center gap-2"
      style={{
        background: "rgba(124, 77, 255, 0.18)",
        borderBottom: "1px solid rgba(124,77,255,0.45)",
        backdropFilter: "blur(8px)",
      }}
    >
      <span>{interpolate(context.experience.copy.demoBanner.labelTemplate, templateVars(context))}</span>
      <a href="#form" className="btn-secondary" style={{ minHeight: 36, padding: "0.35rem 0.9rem" }}>
        {context.experience.copy.demoBanner.ctaLabel}
      </a>
    </div>
  );
}

function PortalIgnitionSection({ context }: PortalSectionProps) {
  return (
    <section
      className="section relative flex flex-col items-center justify-center min-h-[80vh] text-center"
      aria-labelledby="portal-ignition-heading"
    >
      <div className="star-field" aria-hidden="true" />
      <div className="relative z-10 flex flex-col items-center">
        <div className="portal-ring mb-8" aria-hidden="true" />
        <div id="portal-ignition-heading" className="font-display text-2xl md:text-4xl text-glow fade-up">
          {context.experience.copy.portalIgnition.heading}
        </div>
        <div className="mt-3 text-comet fade-up" style={{ animationDelay: "0.4s" }}>
          {context.experience.copy.portalIgnition.subheading}
        </div>
      </div>
    </section>
  );
}

function CaptainRevealSection({ context }: PortalSectionProps) {
  const vars = templateVars(context);

  return (
    <section className="section relative text-center" aria-labelledby="captain-reveal-heading">
      <div className="star-field" aria-hidden="true" />
      <div className="relative z-10">
        <div className="text-comet text-xs uppercase tracking-widest mb-4 fade-up">
          {context.experience.copy.captainReveal.eyebrow}
        </div>
        <h1 className="font-display text-4xl md:text-7xl leading-tight text-glow captain-reveal-line">
          <span className="sr-only" id="captain-reveal-heading">
            {interpolate(context.experience.copy.captainReveal.screenReaderTitleTemplate, vars)}
          </span>
          <span aria-hidden="true" className="captain-reveal-text">
            {interpolate(context.experience.copy.captainReveal.titleTemplate, vars)}
          </span>
        </h1>
        <h2
          className="font-display text-3xl md:text-6xl mt-3 text-glow-violet captain-reveal-line"
          style={{ color: "var(--color-nova)" }}
          aria-hidden="true"
        >
          <span className="captain-reveal-text is-delayed">
            {interpolate(context.experience.copy.captainReveal.subtitleTemplate, vars)}
          </span>
        </h2>
        <p className="mt-6 text-comet max-w-xl mx-auto fade-up" style={{ animationDelay: "1.4s" }}>
          {context.experience.copy.captainReveal.description}
        </p>
      </div>
    </section>
  );
}

function ChoiceSection({ context, props }: PortalSectionProps) {
  const vars = templateVars(context);
  const answerKey = propText(props, "answerKey", "missionPath");
  const options = [
    {
      label: propText(props, "optionOneLabel"),
      value: propText(props, "optionOneValue"),
      target: propText(props, "optionOneTarget"),
      line: propText(props, "optionOneLine"),
    },
    {
      label: propText(props, "optionTwoLabel"),
      value: propText(props, "optionTwoValue"),
      target: propText(props, "optionTwoTarget"),
      line: propText(props, "optionTwoLine"),
    },
  ].filter((option) => option.label && option.value && option.target);

  return (
    <section className="section" aria-labelledby="choice-heading">
      <div className="star-field" aria-hidden="true" />
      <div className="relative z-10 max-w-2xl mx-auto card p-6 md:p-10 fade-up">
        <div className="text-xs uppercase tracking-widest text-comet">
          {interpolate(propText(props, "eyebrow", "Mission choice"), vars)}
        </div>
        <h3 id="choice-heading" className="font-display text-2xl md:text-3xl text-glow mt-2 mb-3">
          {interpolate(propText(props, "heading", "Choose your mission path"), vars)}
        </h3>
        <p className="text-comet mb-6">
          {interpolate(propText(props, "description", "Pick the route that feels most like the birthday star."), vars)}
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => context.onChoiceSelect(answerKey, option.value, option.target)}
              className="choice-card"
            >
              <span>{interpolate(option.label, vars)}</span>
              <strong>{interpolate(option.line, vars)}</strong>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function MissionBriefingSection({ context }: PortalSectionProps) {
  const vars = templateVars(context);

  return (
    <section className="section" aria-labelledby="briefing-heading">
      <div className="max-w-2xl mx-auto card p-6 md:p-10 fade-up">
        <div className="text-xs uppercase tracking-widest text-comet">
          {context.experience.copy.missionBriefing.eyebrow}
        </div>
        <h3 id="briefing-heading" className="font-display text-2xl md:text-3xl text-glow mt-2 mb-2">
          {context.experience.copy.missionBriefing.heading}
        </h3>
        <p className="text-star/90 mb-6">
          {interpolate(context.experience.copy.missionBriefing.invitationTemplate, vars)}
        </p>
        <div className="grid sm:grid-cols-2 gap-3 text-sm md:text-base">
          <div className="card p-4">
            <div className="text-comet text-xs uppercase tracking-widest">
              <span aria-hidden="true">📅 </span>{context.experience.copy.missionBriefing.labels.missionDate}
            </div>
            <div className="mt-1">{formatDate(context.partyDate)}</div>
          </div>
          <div className="card p-4">
            <div className="text-comet text-xs uppercase tracking-widest">
              <span aria-hidden="true">⏰ </span>{context.experience.copy.missionBriefing.labels.launchTime}
            </div>
            <div className="mt-1">{context.partyTime}</div>
          </div>
          <div className="card p-4">
            <div className="text-comet text-xs uppercase tracking-widest">
              <span aria-hidden="true">📍 </span>{context.experience.copy.missionBriefing.labels.missionBase}
            </div>
            <div className="mt-1">{context.location}</div>
          </div>
          <div className="card p-4">
            <div className="text-comet text-xs uppercase tracking-widest">
              <span aria-hidden="true">🎖 </span>{context.experience.copy.missionBriefing.labels.missionTheme}
            </div>
            <div className="mt-1">{context.experience.theme.editionName}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CountdownSection({ context }: PortalSectionProps) {
  return (
    <section className="section text-center" aria-labelledby="countdown-heading">
      <h3 id="countdown-heading" className="font-display text-2xl md:text-3xl text-glow mb-8">
        {context.experience.copy.countdown.heading}
      </h3>
      <div className="relative inline-block w-full">
        <Countdown partyDate={context.partyDate} partyTime={context.partyTime} timezone={context.timezone} />
      </div>
      <div className="mt-3 text-xs text-comet">
        {interpolate(context.experience.copy.countdown.timezoneTemplate, templateVars(context))}
      </div>
    </section>
  );
}

function RsvpSection({ context }: PortalSectionProps) {
  return (
    <section className="section text-center" aria-labelledby="rsvp-heading">
      <h3 id="rsvp-heading" className="font-display text-2xl md:text-3xl text-glow mb-2">
        {context.experience.copy.rsvp.heading}
      </h3>
      <p className="text-comet mb-6">{context.experience.copy.rsvp.description}</p>
      <RSVPAction
        parentContact={context.parentContact}
        childName={context.childName}
        copy={context.experience.copy.rsvp}
      />
    </section>
  );
}

function QuizSection({ context }: PortalSectionProps) {
  const questions = buildQuizQuestions({
    childName: context.childName,
    age: context.age,
    favoriteThing: context.favoriteThing,
    funFacts: context.funFacts,
    location: context.location,
    questions: context.experience.quiz.questions,
  });

  return (
    <section className="section" aria-labelledby="cadet-challenge-heading">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h3 id="cadet-challenge-heading" className="font-display text-2xl md:text-3xl text-glow">
            {context.experience.quiz.heading}
          </h3>
          <p className="text-comet mt-2">
            {context.experience.quiz.description}
          </p>
        </div>
        <QuizGame
          questions={questions}
          questionLabelTemplate={context.experience.quiz.questionLabelTemplate}
          submitLabel={context.experience.quiz.submitLabel}
          incompleteLabel={context.experience.quiz.incompleteLabel}
          onComplete={context.onQuizComplete}
        />
      </div>
    </section>
  );
}

function BadgeSection({ context, props }: PortalSectionProps) {
  if (context.score === null) return null;

  return (
    <section className="section" aria-label="Space Cadet Certificate">
      <SpaceBadge
        score={context.score}
        childName={context.childName}
        totalQuestions={context.experience.quiz.questions.length}
        badgeCopy={context.experience.badge}
        editionName={context.experience.theme.editionName}
      />
    </section>
  );
}

function StarLogSection({ context }: PortalSectionProps) {
  return (
    <section className="section" aria-labelledby="star-log-heading">
      <div className="max-w-xl mx-auto card p-6 md:p-8 relative overflow-hidden fade-up">
        <div
          aria-hidden="true"
          className="absolute -top-10 -left-10 w-32 h-32 rounded-full opacity-30"
          style={{
            background:
              "radial-gradient(circle, var(--color-nova), transparent 60%)",
          }}
        />
        <div className="text-xs uppercase tracking-widest text-comet">
          {context.experience.copy.starLog.eyebrow}
        </div>
        <h3 id="star-log-heading" className="font-display text-xl md:text-2xl text-glow-violet mt-1 mb-3">
          {context.experience.copy.starLog.heading}
        </h3>
        <p className="text-comet text-sm mb-4">
          {context.experience.copy.starLog.description}
        </p>
        <blockquote
          className="border-l-2 pl-4 italic text-star"
          style={{ borderColor: "var(--color-gold)" }}
        >
          {interpolate(context.experience.copy.starLog.quoteTemplate, templateVars(context))}
        </blockquote>
        <div className="mt-4 text-right text-xs uppercase tracking-widest text-comet">
          <span aria-hidden="true">★ </span>
          {interpolate(context.experience.copy.starLog.sealTemplate, templateVars(context))}
        </div>
      </div>
    </section>
  );
}

function ViralLoopSection({ context }: PortalSectionProps) {
  return (
    <section className="section text-center" aria-labelledby="viral-loop-heading">
      <div className="max-w-md mx-auto">
        <p id="viral-loop-heading" className="text-star/90">
          {context.experience.copy.viralLoop.prompt}
        </p>
        <a
          href={config.BASE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary mt-4"
        >
          {context.experience.copy.viralLoop.ctaLabel}
        </a>
        <div className="mt-6 text-xs uppercase tracking-widest text-comet">
          {context.experience.copy.viralLoop.brandFooter}
        </div>
      </div>
    </section>
  );
}

function DemoCtaSection({ context }: PortalSectionProps) {
  if (!context.isDemo) return null;

  return (
    <section className="section text-center" aria-labelledby="demo-cta-heading">
      <div className="max-w-md mx-auto card p-6">
        <h4 id="demo-cta-heading" className="font-display text-xl text-glow mb-3">
          {context.experience.copy.demoCta.heading}
        </h4>
        <a href="#form" className="btn-primary">
          {interpolate(context.experience.copy.demoCta.ctaLabelTemplate, templateVars(context))}
        </a>
      </div>
    </section>
  );
}

export const sectionRegistry: Record<ExperienceSectionType, (props: PortalSectionProps) => JSX.Element | null> = {
  demoBanner: DemoBannerSection,
  portalIgnition: PortalIgnitionSection,
  captainReveal: CaptainRevealSection,
  choice: ChoiceSection,
  missionBriefing: MissionBriefingSection,
  countdown: CountdownSection,
  rsvp: RsvpSection,
  quiz: QuizSection,
  badge: BadgeSection,
  starLog: StarLogSection,
  viralLoop: ViralLoopSection,
  demoCta: DemoCtaSection,
};