"use client";

import { useState } from "react";
import { config } from "@/lib/config";
import { copyToClipboard } from "@/lib/utils";

interface SpaceBadgeProps {
  score: number;
  childName: string;
  totalQuestions: number;
}

function rankFor(score: number): { title: string; line: string } {
  if (score >= 5) return { title: "MISSION COMMANDER", line: "Perfect score, elite cadet!" };
  if (score === 4) return { title: "STAR NAVIGATOR", line: "Excellent mission knowledge!" };
  if (score === 3) return { title: "SPACE CADET", line: "Mission accepted!" };
  return { title: "JUNIOR RECRUIT", line: "Keep training, the mission needs you!" };
}

export default function SpaceBadge({ score, childName, totalQuestions }: SpaceBadgeProps) {
  const rank = rankFor(score);
  const [copied, setCopied] = useState(false);

  const caption = `I earned ${score}/${totalQuestions} Space Badges at Captain ${childName}'s Birthday Mission! 🚀 ${config.BASE_URL}`;

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
        Wandering Dodo · Space Badge Certificate
      </div>

      <h3 id="space-badge-heading" className="font-display text-2xl md:text-3xl text-glow mb-4">
        SPACE CADET CERTIFICATE
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
        You earned <span className="font-display">{score}/{totalQuestions}</span> Space Badges
      </div>
      <div className="text-comet text-sm">
        Captain {childName}&apos;s Birthday Mission · {config.PRODUCT_EDITION}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={handleShare} className="btn-primary">
          📲 Share My Badge
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
          {copied ? "Copied!" : "Copy caption"}
        </button>
      </div>

      <div className="absolute bottom-2 right-3 text-[10px] uppercase tracking-widest text-comet">
        {config.BRAND_NAME}
      </div>
    </div>
  );
}
