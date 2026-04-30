"use client";

import { useState } from "react";
import type { BirthdayPortalProps } from "./types";
import DemoBanner from "./sections/DemoBanner";
import PortalIgnition from "./sections/PortalIgnition";
import CaptainReveal from "./sections/CaptainReveal";
import MissionBriefing from "./sections/MissionBriefing";
import LaunchCountdown from "./sections/LaunchCountdown";
import CrewCheckIn from "./sections/CrewCheckIn";
import CadetChallenge from "./sections/CadetChallenge";
import SpaceBadgeCertificate from "./sections/SpaceBadgeCertificate";
import SecretStarLog from "./sections/SecretStarLog";
import ViralLoopFooter from "./sections/ViralLoopFooter";
import DemoCTA from "./sections/DemoCTA";

export type { BirthdayPortalProps } from "./types";

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

  const [score, setScore] = useState<number | null>(null);

  const upperName = childName.toUpperCase();
  const ageOrdinal = `${age}TH`;

  return (
    <div className="relative overflow-hidden" style={{ background: "var(--color-void)" }}>
      {isDemo && <DemoBanner />}

      <PortalIgnition />

      <CaptainReveal childName={childName} ageOrdinal={ageOrdinal} upperName={upperName} />

      <MissionBriefing
        childName={childName}
        age={age}
        partyDate={partyDate}
        partyTime={partyTime}
        location={location}
      />

      <LaunchCountdown partyDate={partyDate} partyTime={partyTime} timezone={timezone} />

      <CrewCheckIn parentContact={parentContact} childName={childName} />

      <CadetChallenge
        childName={childName}
        age={age}
        favoriteThing={favoriteThing}
        funFacts={funFacts}
        location={location}
        onComplete={(s) => setScore(s)}
      />

      {score !== null && <SpaceBadgeCertificate score={score} childName={childName} />}

      <SecretStarLog childName={childName} funFact={funFacts[1]} />

      <ViralLoopFooter />

      {isDemo && <DemoCTA />}
    </div>
  );
}
