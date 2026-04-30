"use client";

import type { ComponentType } from "react";
import Countdown from "@/components/Countdown";
import RSVPAction from "@/components/RSVPAction";
import QuizGame from "@/components/QuizGame";
import SpaceBadge from "@/components/SpaceBadge";
import { config } from "@/lib/config";
import { formatDate } from "@/lib/utils";
import type { SectionRenderProps } from "./types";

function PortalIgnitionSection({ t }: SectionRenderProps) {
  return (
    <section
      className="section relative flex flex-col items-center justify-center min-h-[80vh] text-center"
      aria-labelledby="portal-ignition-heading"
    >
      <div className="star-field" aria-hidden="true" />
      <div className="relative z-10 flex flex-col items-center">
        <div className="portal-ring mb-8" aria-hidden="true" />
        <div id="portal-ignition-heading" className="font-display text-2xl md:text-4xl text-glow fade-up">
          {t("portalIgnition.heading")}
        </div>
        <div className="mt-3 text-comet fade-up" style={{ animationDelay: "0.4s" }}>
          {t("portalIgnition.subtitle")}
        </div>
      </div>
    </section>
  );
}

function CaptainRevealSection({ t, childName, age }: SectionRenderProps) {
  const upperName = childName.toUpperCase();
  const ageOrdinal = `${age}TH`;
  const vars = { childName, upperName, ageOrdinal, age };
  const line1 = t("captainReveal.line1", vars);
  const line2 = t("captainReveal.line2", vars);
  return (
    <section className="section relative text-center" aria-labelledby="captain-reveal-heading">
      <div className="star-field" aria-hidden="true" />
      <div className="relative z-10">
        <div className="text-comet text-xs uppercase tracking-widest mb-4 fade-up">
          {t("captainReveal.eyebrow")}
        </div>
        <h1 className="font-display text-4xl md:text-7xl leading-tight text-glow captain-reveal-line">
          <span className="sr-only" id="captain-reveal-heading">
            {t("captainReveal.srOnly", vars)}
          </span>
          {line1.split("").map((c, i) => (
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
          {line2.split("").map((c, i) => (
            <span key={i} style={{ animationDelay: `${0.6 + 0.05 * i}s` }}>
              {c === " " ? "\u00A0" : c}
            </span>
          ))}
        </h2>
        <p className="mt-6 text-comet max-w-xl mx-auto fade-up" style={{ animationDelay: "1.4s" }}>
          {t("captainReveal.subtitle")}
        </p>
      </div>
    </section>
  );
}

function MissionBriefingSection({ t, childName, age, partyDate, partyTime, location }: SectionRenderProps) {
  const vars = { childName, age };
  return (
    <section className="section" aria-labelledby="briefing-heading">
      <div className="max-w-2xl mx-auto card p-6 md:p-10 fade-up">
        <div className="text-xs uppercase tracking-widest text-comet">
          {t("missionBriefing.eyebrow")}
        </div>
        <h3 id="briefing-heading" className="font-display text-2xl md:text-3xl text-glow mt-2 mb-2">
          {t("missionBriefing.heading")}
        </h3>
        <p className="text-star/90 mb-6">
          {t("missionBriefing.intro", vars)}
        </p>
        <div className="grid sm:grid-cols-2 gap-3 text-sm md:text-base">
          <div className="card p-4">
            <div className="text-comet text-xs uppercase tracking-widest">
              <span aria-hidden="true">📅 </span>{t("missionBriefing.dateLabel")}
            </div>
            <div className="mt-1">{formatDate(partyDate)}</div>
          </div>
          <div className="card p-4">
            <div className="text-comet text-xs uppercase tracking-widest">
              <span aria-hidden="true">⏰ </span>{t("missionBriefing.timeLabel")}
            </div>
            <div className="mt-1">{partyTime}</div>
          </div>
          <div className="card p-4">
            <div className="text-comet text-xs uppercase tracking-widest">
              <span aria-hidden="true">📍 </span>{t("missionBriefing.locationLabel")}
            </div>
            <div className="mt-1">{location}</div>
          </div>
          <div className="card p-4">
            <div className="text-comet text-xs uppercase tracking-widest">
              <span aria-hidden="true">🎖 </span>{t("missionBriefing.themeLabel")}
            </div>
            <div className="mt-1">{config.PRODUCT_EDITION}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CountdownSection({ t, partyDate, partyTime, timezone }: SectionRenderProps) {
  return (
    <section className="section text-center" aria-labelledby="countdown-heading">
      <h3 id="countdown-heading" className="font-display text-2xl md:text-3xl text-glow mb-8">
        {t("countdown.heading")}
      </h3>
      <div className="relative inline-block w-full">
        <Countdown partyDate={partyDate} partyTime={partyTime} timezone={timezone} />
      </div>
      <div className="mt-3 text-xs text-comet">
        Timezone: {timezone}
      </div>
    </section>
  );
}

function RsvpSection({ t, parentContact, childName }: SectionRenderProps) {
  return (
    <section className="section text-center" aria-labelledby="rsvp-heading">
      <h3 id="rsvp-heading" className="font-display text-2xl md:text-3xl text-glow mb-2">
        {t("rsvp.heading")}
      </h3>
      <p className="text-comet mb-6">{t("rsvp.subtitle")}</p>
      <RSVPAction parentContact={parentContact} childName={childName} />
    </section>
  );
}

function CadetChallengeSection({
  t,
  childName,
  age,
  favoriteThing,
  funFacts,
  location,
  onScore,
}: SectionRenderProps) {
  return (
    <section className="section" aria-labelledby="cadet-challenge-heading">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h3 id="cadet-challenge-heading" className="font-display text-2xl md:text-3xl text-glow">
            {t("cadetChallenge.heading")}
          </h3>
          <p className="text-comet mt-2">{t("cadetChallenge.subtitle")}</p>
        </div>
        <QuizGame
          childName={childName}
          age={age}
          favoriteThing={favoriteThing}
          funFacts={funFacts}
          location={location}
          onComplete={onScore}
        />
      </div>
    </section>
  );
}

function SpaceBadgeSection({ score, childName }: SectionRenderProps) {
  if (score === null) return null;
  return (
    <section className="section" aria-label="Space Cadet Certificate">
      <SpaceBadge score={score} childName={childName} totalQuestions={5} />
    </section>
  );
}

function StarLogSection({ t, funFacts, childName }: SectionRenderProps) {
  const vars = { childName };
  return (
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
          <span aria-hidden="true">🛰 </span>{t("starLog.eyebrow")}
        </div>
        <h3 id="star-log-heading" className="font-display text-xl md:text-2xl text-glow-violet mt-1 mb-3">
          {t("starLog.heading")}
        </h3>
        <p className="text-comet text-sm mb-4">{t("starLog.subtitle")}</p>
        <blockquote
          className="border-l-2 pl-4 italic text-star"
          style={{ borderColor: "var(--color-gold)" }}
        >
          &quot;{funFacts[1]}&quot;
        </blockquote>
        <div className="mt-4 text-right text-xs uppercase tracking-widest text-comet">
          <span aria-hidden="true">★ </span>{t("starLog.seal", vars)}
        </div>
      </div>
    </section>
  );
}

function ViralLoopSection({ t }: SectionRenderProps) {
  return (
    <section className="section text-center" aria-labelledby="viral-loop-heading">
      <div className="max-w-md mx-auto">
        <p id="viral-loop-heading" className="text-star/90">
          <span aria-hidden="true">✨ </span>{t("viralLoop.message")}
        </p>
        <a
          href={config.BASE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary mt-4"
        >
          {t("viralLoop.cta")}
        </a>
        <div className="mt-6 text-xs uppercase tracking-widest text-comet">
          {config.BRAND_NAME}
        </div>
      </div>
    </section>
  );
}

export const sectionRegistry: Record<string, ComponentType<SectionRenderProps>> = {
  "portal-ignition": PortalIgnitionSection,
  "captain-reveal": CaptainRevealSection,
  "mission-briefing": MissionBriefingSection,
  countdown: CountdownSection,
  rsvp: RsvpSection,
  "cadet-challenge": CadetChallengeSection,
  "space-badge": SpaceBadgeSection,
  "star-log": StarLogSection,
  "viral-loop": ViralLoopSection,
};
