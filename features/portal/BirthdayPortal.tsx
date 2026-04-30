"use client";

import { useState } from "react";
import { interpolate } from "@/lib/interpolate";
import { config } from "@/lib/config";
import { sectionRegistry } from "./sectionRegistry";
import type { Experience } from "./types";

export interface BirthdayPortalProps {
  experience: Experience;
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

export default function BirthdayPortal(props: BirthdayPortalProps) {
  const {
    experience,
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

  const [score, setScore] = useState<number | null>(null);

  function t(key: string, vars?: Record<string, string>): string {
    const template = experience.copy[key] ?? key;
    return vars ? interpolate(template, vars) : template;
  }

  const sectionProps = {
    t,
    childName,
    age,
    partyDate,
    partyTime,
    location,
    parentContact,
    favoriteThing,
    funFacts,
    timezone,
    isDemo,
    score,
    onScore: setScore,
  };

  return (
    <div className="relative overflow-hidden" style={{ background: "var(--color-void)" }}>
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

      {experience.sections.map((section) => {
        const SectionComponent = sectionRegistry[section.type];
        if (!SectionComponent) return null;
        return <SectionComponent key={section.type} {...sectionProps} />;
      })}

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
    </div>
  );
}
