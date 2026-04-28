"use client";

import { useEffect, useState } from "react";
import { formatPartyDate } from "@/lib/utils";

interface CountdownProps {
  partyDate: string;
  partyTime: string;
  timezone?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
}

function calc(target: Date): TimeLeft {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    done: false,
  };
}

export default function Countdown({ partyDate, partyTime, timezone }: CountdownProps) {
  const [left, setLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const target = formatPartyDate(partyDate, partyTime, timezone);
    setLeft(calc(target));
    const id = setInterval(() => setLeft(calc(target)), 1000);
    return () => clearInterval(id);
  }, [partyDate, partyTime, timezone]);

  if (!left) {
    return (
      <div className="text-comet font-display tracking-widest">Loading…</div>
    );
  }

  if (left.done) {
    return (
      <div className="font-display text-2xl md:text-3xl text-glow text-center">
        THE BIRTHDAY MISSION HAS LAUNCHED! 🚀
      </div>
    );
  }

  const cells: Array<[string, number]> = [
    ["Days", left.days],
    ["Hours", left.hours],
    ["Minutes", left.minutes],
    ["Seconds", left.seconds],
  ];

  return (
    <div className="grid grid-cols-4 gap-3 md:gap-5 max-w-2xl mx-auto">
      {cells.map(([label, value]) => (
        <div
          key={label}
          className="card flex flex-col items-center justify-center py-4 md:py-6"
        >
          <div className="font-display text-3xl md:text-5xl text-glow tabular-nums">
            {String(value).padStart(2, "0")}
          </div>
          <div className="mt-1 text-xs md:text-sm uppercase tracking-widest text-comet">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
