"use client";

import { useMemo, useState } from "react";
import BirthdayPortal from "@/components/BirthdayPortal";
import DodoGuide from "@/components/DodoGuide";
import CreateForm from "@/features/create/CreateForm";
import { spaceMissionExperience } from "@/lib/experience/spaceMission";
import { config } from "@/lib/config";

export default function HomePage() {
  const [showDemo, setShowDemo] = useState(false);

  const demoGames = [
    {
      title: "Captain Reveal",
      blurb: "The birthday child opens the portal as the hero of the mission.",
      accent: "Hero Moment",
      glyph: "story",
    },
    {
      title: "Mission Countdown",
      blurb: "Guests see the launch date, time, location, and RSVP action in one mobile-friendly flow.",
      accent: "Party Ready",
      glyph: "rocket",
    },
    {
      title: "Cadet Challenge",
      blurb: "A personalised quiz turns the invite into a playful badge-earning moment guests can share.",
      accent: "Quiz Badge",
      glyph: "quiz",
    },
  ];

  const demoData = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return {
      childName: "Zara",
      age: "6",
      partyDate: `${yyyy}-${mm}-${dd}`,
      partyTime: "15:00",
      location: "Star Base HQ",
      parentContact: "demo@wanderingdodo.com",
      favoriteThing: "rockets",
      funFacts: [
        "once ate a whole cake by herself",
        "thinks she can talk to dolphins",
        "is already planning her next birthday",
      ] as [string, string, string],
      timezone: "Asia/Dubai",
      isDemo: true,
    };
  }, []);

  return (
    <main id="main">
      <header className="site-header">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <div className="font-display tracking-widest text-star">{config.BRAND_NAME}</div>
            <div className="text-comet text-xs md:text-sm">Character-led birthday experiences, not another template shop</div>
          </div>
          <a href="#form" className="btn-secondary" style={{ minHeight: 40, padding: "0.4rem 1rem" }}>
            Get the Portal
          </a>
        </div>
      </header>

      <section className="section hero-section" aria-labelledby="hero-heading">
        <div className="star-field" aria-hidden="true" />
        <div className="premium-particle-field" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="hero-haze" aria-hidden="true" />
        <div className="hero-grid max-w-6xl mx-auto relative z-10">
          <div className="hero-copy">
            <div className="badge-pill mb-6">
              <span aria-hidden="true">✦</span>
              Premium launch studio - {config.PRICE} first edition
            </div>
            <DodoGuide
              mood="excited"
              message="Let's build one unforgettable birthday mission."
              className="mobile-inline-dodo"
            />
            <p className="eyebrow mb-4">Birthday Star Portal</p>
            <h1 id="hero-heading" className="font-display text-4xl md:text-7xl leading-tight text-glow hero-title">
              A playable birthday invite where your child becomes the hero.
            </h1>
            <p className="mt-6 text-comet md:text-xl max-w-2xl hero-subcopy">
              Create one magical link with a hero reveal, party countdown, RSVP, quiz, badge, and personalised WhatsApp preview.
            </p>
            <div className="hero-action-row mt-8">
              <a href="#demo" className="btn-primary">
                Try the Live Mission →
              </a>
              <a href="#form" className="btn-secondary">
                Create My Portal — {config.PRICE}
              </a>
            </div>
            <div className="hero-micro-demo hero-micro-inline">
              <span className="hero-micro-kicker">Live preview</span>
              <strong>Tap choices. Unlock Captain Zara.</strong>
              <div className="hero-micro-actions" aria-hidden="true">
                <span>Open comet vault</span>
                <span>Follow star trail</span>
              </div>
            </div>
            <div className="hero-proof-grid mt-10">
              <div className="hero-proof-card">
                <span className="hero-proof-kicker">Different from Evite</span>
                <p>Not a marketplace of thousands of templates. One guided premium birthday world.</p>
              </div>
              <div className="hero-proof-card">
                <span className="hero-proof-kicker">Different from Canva</span>
                <p>No design tool learning curve. Answer a few questions and share the final link.</p>
              </div>
            </div>
          </div>

          <div className="hero-stage premium-hero-stage" aria-hidden="true">
            <div className="hero-stage-orbit orbit-a" />
            <div className="hero-stage-orbit orbit-b" />
            <div className="hero-portal-shell">
              <DodoGuide
                mood="celebrating"
                message="The birthday child becomes Captain. Guests become the crew."
                className="hero-dodo-art"
              />
              <div className="hero-portal-core" />
              <div className="hero-captain-card">
                <div className="hero-captain-visor" />
                <div className="hero-captain-copy">
                  <span>Active product</span>
                  <strong>Birthday Star Portal</strong>
                </div>
              </div>
              <div className="hero-signal-card signal-top">
                <span>Guest path</span>
                <strong>Open link, RSVP, play quiz</strong>
              </div>
              <div className="hero-signal-card signal-bottom">
                <span>Output</span>
                <strong>One polished share link</strong>
              </div>
              <div className="hero-micro-demo">
                <span className="hero-micro-kicker">Live preview</span>
                <strong>Tap choices. Unlock Captain Zara.</strong>
                <div className="hero-micro-actions" aria-hidden="true">
                  <span>Open comet vault</span>
                  <span>Follow star trail</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="demo" className="section" aria-labelledby="demo-heading">
        <div className="max-w-6xl mx-auto demo-shell">
          <div className="demo-copy">
            <p className="eyebrow mb-3">Live demo</p>
            <h2 id="demo-heading" className="font-display text-2xl md:text-4xl text-glow mb-4">
              Try the mission before you buy
            </h2>
            <p className="text-comet max-w-xl">
              See the actual portal moments guests receive: Captain Reveal, Mission Countdown, RSVP, Cadet Challenge, and badge.
            </p>
          </div>
          {!showDemo && (
            <button
              type="button"
              onClick={() => setShowDemo(true)}
              className="btn-primary"
            >
              Launch Demo Portal →
            </button>
          )}
        </div>
        <div className="max-w-6xl mx-auto demo-games-grid">
          {demoGames.map((game) => (
            <div key={game.title} className="demo-game-card">
              <div className={`demo-game-art demo-game-art-${game.glyph}`} aria-hidden="true">
                <span />
              </div>
              <span className="demo-game-accent">{game.accent}</span>
              <h3 className="font-display text-xl text-star mt-3">{game.title}</h3>
              <p className="text-comet mt-3">{game.blurb}</p>
            </div>
          ))}
        </div>
        {showDemo && (
          <div className="mt-10 max-w-5xl mx-auto rounded-2xl overflow-hidden border border-white/10 demo-frame">
            <BirthdayPortal experience={spaceMissionExperience} {...demoData} />
          </div>
        )}
      </section>

      <section className="section" aria-labelledby="how-heading">
        <div className="max-w-6xl mx-auto">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow mb-3">Mission sequence</p>
              <h2 id="how-heading" className="font-display text-2xl md:text-4xl text-glow">
                From briefing to blast-off in three clean steps
              </h2>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mt-10">
            {[
              "Fill in your child's birthday details — takes 2 minutes.",
              "Pay once — $14. No subscription.",
              "Get your magic link. Share it with every guest.",
            ].map((step, i) => (
              <div key={i} className="sequence-card">
                <div className="sequence-index">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section pt-0" aria-label="Trust signals">
        <div className="max-w-6xl mx-auto mission-ribbon">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
            {["Secure Payhip checkout", "14-day refund", "No account or app", "Works on WhatsApp"].map((t) => (
              <div key={t} className="mission-ribbon-card">
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section story-section" aria-labelledby="guests-heading">
        <div className="max-w-6xl mx-auto story-grid">
          <div className="story-panel story-panel-quote">
            <p className="eyebrow mb-4">What guests receive</p>
            <h2 id="guests-heading" className="font-display text-3xl md:text-5xl text-glow mb-6">
              One link that feels like a birthday mission, not a plain invite.
            </h2>
            <blockquote className="story-quote">
              <p className="text-star italic">
                “Zara&apos;s guests thought it was the coolest invite they&apos;d ever seen.”
              </p>
              <div className="text-comet text-sm mt-3">— Priya, mum of a 6-year-old</div>
            </blockquote>
          </div>
          <div className="story-panel story-panel-dossier">
            <div className="dossier-head">
              <span className="eyebrow">Guest output</span>
              <strong>Ready to share after checkout</strong>
            </div>
            <ul className="story-list">
              <li>Personalised WhatsApp preview</li>
              <li>Hero portal reveal</li>
              <li>RSVP action for parents</li>
              <li>Playable Cadet Challenge quiz</li>
              <li>Shareable Space Badge caption</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section dossier-section" aria-label="Mission briefing and form">
        <div className="max-w-6xl mx-auto dossier-grid">
          <div className="mission-brief-card">
            <p className="eyebrow mb-3">Mission briefing</p>
            <h2 className="font-display text-2xl md:text-4xl text-glow mb-4">
              Build the portal like a mission dossier, not a boring booking form.
            </h2>
            <p className="text-comet mb-6">
              The smoothest checkout path is Safari or Chrome. Before payment, the portal also gives you a recovery code so the magic link can still be restored if the browser handoff goes sideways.
            </p>
            <div className="briefing-points">
              <div className="briefing-point">
                <strong>2 minutes to set up</strong>
                <span>One parent completes one form and gets one link to share.</span>
              </div>
              <div className="briefing-point">
                <strong>Recovery path built in</strong>
                <span>Checkout failures do not force you into webhook or backend complexity.</span>
              </div>
              <div className="briefing-point">
                <strong>Instant guest experience</strong>
                <span>The final link opens on mobile without any app install or account creation.</span>
              </div>
            </div>
          </div>
          <div className="form-stage">
            <CreateForm />
          </div>
        </div>
      </section>

      <section className="section text-center" aria-labelledby="final-cta-heading">
        <div className="max-w-4xl mx-auto final-cta-panel">
          <h2 id="final-cta-heading" className="font-display text-2xl md:text-3xl text-glow mb-3">
            One form. One payment. One magic link.
          </h2>
          <p className="text-comet mb-6">
            Give your child a birthday they&apos;ll talk about long after the candles
            are out.
          </p>
          <a href="#form" className="btn-primary">
            Create My Portal — {config.PRICE} →
          </a>
        </div>
      </section>

      {/* === Footer === */}
      <footer className="px-5 py-10 border-t border-white/10 text-center text-comet text-sm">
        <div>© {config.BRAND_NAME}. {config.BRAND_TAGLINE}</div>
        <div className="mt-1">
          Support:{" "}
          <a className="underline" href={`mailto:${config.SUPPORT_EMAIL}`}>
            {config.SUPPORT_EMAIL}
          </a>
        </div>
      </footer>
    </main>
  );
}
