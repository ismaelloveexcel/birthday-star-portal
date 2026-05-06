import Link from "next/link";
import { config } from "@/lib/config";
import { arcadeRegistry, districtName, worldDistricts } from "@/lib/world/arcades";

function stateLabel(state: string): string {
  return state.slice(0, 1).toUpperCase() + state.slice(1);
}

export default function WorldPage() {
  return (
    <main id="main" className="world-page">
      <header className="site-header">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="font-display tracking-widest text-star">
            {config.BRAND_NAME}
          </Link>
          <Link href="/#form" className="btn-secondary" style={{ minHeight: 40, padding: "0.4rem 1rem" }}>
            Create gift
          </Link>
        </div>
      </header>

      <section className="section world-hero" aria-labelledby="world-heading">
        <div className="star-field" aria-hidden="true" />
        <div className="max-w-6xl mx-auto world-hero-grid">
          <div className="world-hero-copy">
            <p className="eyebrow mb-4">Gift arcade world</p>
            <h1 id="world-heading" className="font-display text-4xl md:text-6xl text-glow leading-tight">
              A world of personal arcade gifts, starting with birthdays.
            </h1>
            <p className="text-comet md:text-xl mt-6 world-lede">
              The games can evolve later. The platform frame is here: one open arcade, visible locked arcades, and environments that can expand from Dubai to Mauritius.
            </p>
            <div className="hero-action-row mt-8">
              <Link href="/#form" className="btn-primary">
                Create first gift
              </Link>
              <Link href="/#demo" className="btn-secondary">
                Try birthday arcade
              </Link>
            </div>
          </div>
          <div className="world-map" aria-label="Dubai arcade world preview">
            <div className="world-road" />
            <div className="world-tower tower-a">
              <span>Birthday</span>
            </div>
            <div className="world-tower tower-b is-locked">
              <span>Memory</span>
            </div>
            <div className="world-tower tower-c is-locked">
              <span>Couples</span>
            </div>
            <div className="world-water" />
          </div>
        </div>
      </section>

      <section className="section pt-0" aria-labelledby="district-heading">
        <div className="max-w-6xl mx-auto">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow mb-3">World environments</p>
              <h2 id="district-heading" className="font-display text-2xl md:text-4xl text-glow">
                Places first, game mechanics later.
              </h2>
            </div>
          </div>
          <div className="world-district-grid mt-10">
            {worldDistricts.map((district) => (
              <article key={district.id} className="world-district-card">
                <span className="demo-game-accent">{district.status}</span>
                <h3 className="font-display text-2xl text-star mt-3">{district.name}</h3>
                <p className="text-comet mt-3">{district.description}</p>
                <div className="world-signal">{district.signal}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section pt-0" aria-labelledby="arcades-heading">
        <div className="max-w-6xl mx-auto">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow mb-3">Arcade registry</p>
              <h2 id="arcades-heading" className="font-display text-2xl md:text-4xl text-glow">
                One playable arcade, three expandable doors.
              </h2>
            </div>
          </div>
          <div className="world-arcade-grid mt-10">
            {arcadeRegistry.map((arcade) => (
              <article key={arcade.id} className={`world-arcade-card is-${arcade.state}`}>
                <div>
                  <div className="world-arcade-topline">
                    <span>{districtName(arcade.districtId)}</span>
                    <strong>{stateLabel(arcade.state)}</strong>
                  </div>
                  <h3 className="font-display text-xl text-star mt-4">{arcade.name}</h3>
                  <p className="text-comet mt-3">{arcade.description}</p>
                </div>
                <div>
                  <span className="world-game-slot">{arcade.gameSlot}</span>
                  <Link href={arcade.href} className={arcade.state === "open" ? "btn-primary" : "btn-secondary"}>
                    {arcade.cta}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}