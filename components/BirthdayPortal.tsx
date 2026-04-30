"use client";

import { useState } from "react";
import { sectionRegistry } from "@/features/portal/sectionRegistry";
import type { Experience } from "@/lib/schemas/experience";

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

  return (
    <div className="relative overflow-hidden" style={{ background: "var(--color-void)" }}>
      {experience.sections.map((section) => {
        const Section = sectionRegistry[section.type];

        return (
          <Section
            key={section.id}
            context={{
              experience,
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
              onQuizComplete: setScore,
            }}
            props={section.props}
          />
        );
      })}
    </div>
  );
}
