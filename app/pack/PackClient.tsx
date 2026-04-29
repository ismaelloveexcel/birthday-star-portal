"use client";

import { useEffect, useMemo } from "react";
import BirthdayPortal from "@/components/BirthdayPortal";
import { decodePortalData, pingEvent } from "@/lib/utils";
import { config } from "@/lib/config";

interface RawData {
  childName?: string;
  age?: string;
  partyDate?: string;
  partyTime?: string;
  location?: string;
  parentContact?: string;
  favoriteThing?: string;
  funFact1?: string;
  funFact2?: string;
  funFact3?: string;
  funFacts?: string[];
  timezone?: string;
}

export default function PackClient({ encoded }: { encoded: string | null }) {
  const result = useMemo(() => {
    if (!encoded) return { ok: false as const, reason: "missing" as const };
    const decoded = decodePortalData<RawData>(encoded);
    if (!decoded) return { ok: false as const, reason: "malformed" as const };

    const required = [
      decoded.childName,
      decoded.age,
      decoded.partyDate,
      decoded.partyTime,
      decoded.location,
      decoded.parentContact,
      decoded.favoriteThing,
    ];
    if (required.some((v) => !v || typeof v !== "string")) {
      return { ok: false as const, reason: "malformed" as const };
    }

    const facts: [string, string, string] = (() => {
      if (Array.isArray(decoded.funFacts) && decoded.funFacts.length === 3) {
        return [
          String(decoded.funFacts[0] ?? ""),
          String(decoded.funFacts[1] ?? ""),
          String(decoded.funFacts[2] ?? ""),
        ];
      }
      return [
        String(decoded.funFact1 ?? ""),
        String(decoded.funFact2 ?? ""),
        String(decoded.funFact3 ?? ""),
      ];
    })();

    if (facts.some((f) => !f)) {
      return { ok: false as const, reason: "malformed" as const };
    }

    return {
      ok: true as const,
      data: {
        childName: decoded.childName!,
        age: decoded.age!,
        partyDate: decoded.partyDate!,
        partyTime: decoded.partyTime!,
        location: decoded.location!,
        parentContact: decoded.parentContact!,
        favoriteThing: decoded.favoriteThing!,
        funFacts: facts,
        timezone: decoded.timezone || "Asia/Dubai",
      },
    };
  }, [encoded]);

  // No-PII conversion ping fired once after a successful decode. Closes the
  // funnel: portal_form_submit → portal_link_generated → portal_link_opened.
  // Silent-skip when NEXT_PUBLIC_PING_URL is unset (handled inside pingEvent).
  useEffect(() => {
    if (result.ok) {
      pingEvent("portal_link_opened");
    }
  }, [result.ok]);

  if (!result.ok) {
    return (
      <main className="min-h-screen flex items-center justify-center px-5 text-center relative">
        <div className="star-field" aria-hidden />
        <div className="relative z-10 card p-8 max-w-md">
          <h1 className="font-display text-2xl md:text-3xl text-glow mb-3">
            MISSION ACCESS DENIED
          </h1>
          <p className="text-comet mb-3">
            {result.reason === "malformed"
              ? "This link has been modified and cannot be opened."
              : "This portal link appears to be incomplete or has been modified."}
          </p>
          <p className="text-comet text-sm">
            If you&apos;re a guest, please ask the birthday parent to share the link
            again. If you&apos;re the parent, please check your purchase confirmation
            page or contact{" "}
            <a className="underline" href={`mailto:${config.SUPPORT_EMAIL}`}>
              {config.SUPPORT_EMAIL}
            </a>
            .
          </p>
        </div>
      </main>
    );
  }

  return <BirthdayPortal {...result.data} isDemo={false} />;
}
