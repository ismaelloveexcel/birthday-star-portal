export default function PortalIgnition() {
  return (
    <section
      className="section relative flex flex-col items-center justify-center min-h-[80vh] text-center"
      aria-labelledby="portal-ignition-heading"
    >
      <div className="star-field" aria-hidden="true" />
      <div className="relative z-10 flex flex-col items-center">
        <div className="portal-ring mb-8" aria-hidden="true" />
        <div id="portal-ignition-heading" className="font-display text-2xl md:text-4xl text-glow fade-up">
          MISSION ACCESS GRANTED
        </div>
        <div className="mt-3 text-comet fade-up" style={{ animationDelay: "0.4s" }}>
          Initiating birthday mission sequence…
        </div>
      </div>
    </section>
  );
}
