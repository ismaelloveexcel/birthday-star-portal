interface SecretStarLogProps {
  childName: string;
  funFact: string;
}

export default function SecretStarLog({ childName, funFact }: SecretStarLogProps) {
  return (
    <section className="section" aria-labelledby="star-log-heading">
      <div className="max-w-xl mx-auto card p-6 md:p-8 relative overflow-hidden fade-up">
        <div
          aria-hidden="true"
          className="absolute -top-10 -left-10 w-32 h-32 rounded-full opacity-30"
          style={{
            background:
              "radial-gradient(circle, var(--color-nova), transparent 60%)",
          }}
        />
        <div className="text-xs uppercase tracking-widest text-comet">
          <span aria-hidden="true">🛰 </span>Classified
        </div>
        <h3 id="star-log-heading" className="font-display text-xl md:text-2xl text-glow-violet mt-1 mb-3">
          SECRET STAR LOG
        </h3>
        <p className="text-comet text-sm mb-4">
          Classified mission intelligence — for crew eyes only
        </p>
        <blockquote
          className="border-l-2 pl-4 italic text-star"
          style={{ borderColor: "var(--color-gold)" }}
        >
          “{funFact}”
        </blockquote>
        <div className="mt-4 text-right text-xs uppercase tracking-widest text-comet">
          <span aria-hidden="true">★ </span>Mission Seal — Captain {childName}
        </div>
      </div>
    </section>
  );
}
