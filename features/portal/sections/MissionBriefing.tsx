import { config } from "@/lib/config";
import { formatDate } from "@/lib/utils";

interface MissionBriefingProps {
  childName: string;
  age: string;
  partyDate: string;
  partyTime: string;
  location: string;
}

export default function MissionBriefing({
  childName,
  age,
  partyDate,
  partyTime,
  location,
}: MissionBriefingProps) {
  return (
    <section className="section" aria-labelledby="briefing-heading">
      <div className="max-w-2xl mx-auto card p-6 md:p-10 fade-up">
        <div className="text-xs uppercase tracking-widest text-comet">
          Classified · Galactic Mission Briefing
        </div>
        <h3 id="briefing-heading" className="font-display text-2xl md:text-3xl text-glow mt-2 mb-2">
          ATTENTION CREW
        </h3>
        <p className="text-star/90 mb-6">
          You are hereby invited to join Captain {childName}&apos;s {age}th Birthday Mission.
        </p>
        <div className="grid sm:grid-cols-2 gap-3 text-sm md:text-base">
          <div className="card p-4">
            <div className="text-comet text-xs uppercase tracking-widest">
              <span aria-hidden="true">📅 </span>Mission Date
            </div>
            <div className="mt-1">{formatDate(partyDate)}</div>
          </div>
          <div className="card p-4">
            <div className="text-comet text-xs uppercase tracking-widest">
              <span aria-hidden="true">⏰ </span>Launch Time
            </div>
            <div className="mt-1">{partyTime}</div>
          </div>
          <div className="card p-4">
            <div className="text-comet text-xs uppercase tracking-widest">
              <span aria-hidden="true">📍 </span>Mission Base
            </div>
            <div className="mt-1">{location}</div>
          </div>
          <div className="card p-4">
            <div className="text-comet text-xs uppercase tracking-widest">
              <span aria-hidden="true">🎖 </span>Mission Theme
            </div>
            <div className="mt-1">{config.PRODUCT_EDITION}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
