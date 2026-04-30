"use client";

import { useState } from "react";
import { config } from "@/lib/config";
import { interpolate } from "@/lib/experience/interpolate";
import type { Experience } from "@/lib/schemas/experience";
import { copyToClipboard } from "@/lib/utils";

interface SpaceBadgeProps {
  score: number;
  childName: string;
  totalQuestions: number;
  badgeCopy: Experience["badge"];
  editionName: string;
}

function rankFor(score: number, badgeCopy: Experience["badge"]): { title: string; line: string } {
  const ranks = badgeCopy.ranks.slice().sort((left, right) => right.minScore - left.minScore);
  return ranks.find((rank) => score >= rank.minScore) ?? ranks[ranks.length - 1];
}

export default function SpaceBadge({ score, childName, totalQuestions, badgeCopy, editionName }: SpaceBadgeProps) {
  const rank = rankFor(score, badgeCopy);
  const [copied, setCopied] = useState(false);

  const caption = interpolate(badgeCopy.shareCaptionTemplate, {
    baseUrl: config.BASE_URL,
    childName,
    score: String(score),
    totalQuestions: String(totalQuestions),
  });

  async function handleShare() {
    if (typeof navigator !== "undefined" && (navigator as Navigator & { share?: (d: ShareData) => Promise<void> }).share) {
      try {
        await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share({
          title: "Birthday Mission",
          text: caption,
        });
        return;
      } catch {
        /* fall through to copy */
      }
    }
    const ok = await copyToClipboard(caption);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const stars = Array.from({ length: totalQuestions }, (_, i) => i < score);

  return (
    <div className="card p-6 md:p-10 max-w-xl mx-auto text-center scale-in relative overflow-hidden" aria-labelledby="space-badge-heading">
      <div
        aria-hidden="true"
        className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-30"
        style={{
          background:
            "radial-gradient(circle, var(--color-gold), transparent 60%)",
        }}
      />
      <div className="text-xs uppercase tracking-widest text-comet mb-2">
        {badgeCopy.eyebrow}
      </div>

      <h3 id="space-badge-heading" className="font-display text-2xl md:text-3xl text-glow mb-4">
        {badgeCopy.heading}
      </h3>

      <div className="flex justify-center gap-1 mb-4 text-2xl" role="img" aria-label={`${score} out of ${totalQuestions} stars`}>
        {stars.map((on, i) => (
          <span key={i} aria-hidden="true" style={{ color: on ? "var(--color-gold)" : "rgba(168,180,212,0.3)" }}>
            ★
          </span>
        ))}
      </div>

      <div className="font-display text-xl mb-1" style={{ color: "var(--color-gold)" }}>
        {rank.title}
      </div>
      <div className="text-comet mb-4">{rank.line}</div>

      <div className="text-star mb-1">
        {interpolate(badgeCopy.earnedTemplate, {
          score: String(score),
          totalQuestions: String(totalQuestions),
        })}
      </div>
      <div className="text-comet text-sm">
        {interpolate(badgeCopy.missionLineTemplate, {
          childName,
          editionName,
        })}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={handleShare} className="btn-primary">
          {badgeCopy.shareLabel}
        </button>
        <button
          onClick={async () => {
            const ok = await copyToClipboard(caption);
            if (ok) {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }
          }}
          className="btn-secondary"
        >
          {copied ? badgeCopy.copiedLabel : badgeCopy.copyLabel}
        </button>
      </div>

      <div className="absolute bottom-2 right-3 text-[10px] uppercase tracking-widest text-comet">
        {config.BRAND_NAME}
      </div>
    </div>
  );
}
