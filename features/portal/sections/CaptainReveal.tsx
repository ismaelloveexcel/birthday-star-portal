interface CaptainRevealProps {
  childName: string;
  ageOrdinal: string;
  upperName: string;
}

export default function CaptainReveal({ childName, ageOrdinal, upperName }: CaptainRevealProps) {
  return (
    <section className="section relative text-center" aria-labelledby="captain-reveal-heading">
      <div className="star-field" aria-hidden="true" />
      <div className="relative z-10">
        <div className="text-comet text-xs uppercase tracking-widest mb-4 fade-up">
          Captain Reveal
        </div>
        <h1 className="font-display text-4xl md:text-7xl leading-tight text-glow captain-reveal-line">
          <span className="sr-only" id="captain-reveal-heading">
            Captain {childName}&apos;s {ageOrdinal} Birthday Mission
          </span>
          {("CAPTAIN " + upperName + "'S").split("").map((c, i) => (
            <span key={i} aria-hidden="true" style={{ animationDelay: `${0.05 * i}s` }}>
              {c === " " ? "\u00A0" : c}
            </span>
          ))}
        </h1>
        <h2
          className="font-display text-3xl md:text-6xl mt-3 text-glow-violet captain-reveal-line"
          style={{ color: "var(--color-nova)" }}
          aria-hidden="true"
        >
          {(`${ageOrdinal} BIRTHDAY MISSION`).split("").map((c, i) => (
            <span key={i} style={{ animationDelay: `${0.6 + 0.05 * i}s` }}>
              {c === " " ? "\u00A0" : c}
            </span>
          ))}
        </h2>
        <p className="mt-6 text-comet max-w-xl mx-auto fade-up" style={{ animationDelay: "1.4s" }}>
          A special mission briefing has been prepared for all crew members.
        </p>
      </div>
    </section>
  );
}
