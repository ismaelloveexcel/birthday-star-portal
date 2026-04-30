"use client";

import PortalRunner from "@/features/portal/PortalRunner";
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

  return (
    <PortalRunner
      experience={experience}
      childName={childName}
      age={age}
      partyDate={partyDate}
      partyTime={partyTime}
      location={location}
      parentContact={parentContact}
      favoriteThing={favoriteThing}
      funFacts={funFacts}
      timezone={timezone}
      isDemo={isDemo}
    />
  );
}
