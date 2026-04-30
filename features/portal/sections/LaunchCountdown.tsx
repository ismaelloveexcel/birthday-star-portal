import Countdown from "@/components/Countdown";

interface LaunchCountdownProps {
  partyDate: string;
  partyTime: string;
  timezone: string;
}

export default function LaunchCountdown({ partyDate, partyTime, timezone }: LaunchCountdownProps) {
  return (
    <section className="section text-center" aria-labelledby="countdown-heading">
      <h3 id="countdown-heading" className="font-display text-2xl md:text-3xl text-glow mb-8">
        MISSION LAUNCH COUNTDOWN
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
