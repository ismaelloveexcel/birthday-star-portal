"use client";

import { useMemo, useState } from "react";
import BirthdayPortal from "@/components/BirthdayPortal";
import CreateForm from "@/features/create/CreateForm";
import { spaceMissionExperience } from "@/lib/experience/spaceMission";
import { config } from "@/lib/config";

export default function HomePage() {
  const [showDemo, setShowDemo] = useState(false);

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
    <main>
      {/* === Nav === */}
      <header className="sticky top-0 z-40 backdrop-blur" style={{ background: "rgba(5,8,24,0.65)" }}>
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="font-display tracking-widest text-star">{config.BRAND_NAME}</div>
          <a href="#form" className="btn-secondary" style={{ minHeight: 40, padding: "0.4rem 1rem" }}>
            Get the Portal
          </a>
        </div>
      </header>

      {/* === Hero === */}
      <section className="section relative text-center" aria-labelledby="hero-heading">
        <div className="star-field" aria-hidden="true" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="badge-pill mb-6">
            <span aria-hidden="true">🚀 </span>
            {config.LAUNCH_BADGE}
          </div>
          <h1 id="hero-heading" className="font-display text-3xl md:text-6xl leading-tight text-glow">
            Your child becomes the hero. Their guests become the crew. One link does it all.
          </h1>
          <p className="mt-6 text-comet md:text-lg max-w-2xl mx-auto">
            Create a magical birthday mission portal with a cinematic Captain Reveal,
            mission countdown, RSVP action, and a playable quiz your guests can screenshot
            and share.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#demo" className="btn-primary">
              See a Live Mission Demo →
            </a>
            <a href="#form" className="btn-secondary">
              Create My Portal — {config.PRICE}
            </a>
          </div>
        </div>
      </section>

      {/* === Trust Signals === */}
      <section className="section" aria-label="Trust signals">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            {["🔒 Secure Payhip checkout", "↩ 14-day refund", "📱 Works on any phone — no app"].map((t) => (
              <div key={t} className="card py-4 px-3 text-sm md:text-base">
                {t}
              </div>
            ))}
          </div>
          <blockquote className="card mt-8 p-6 text-center max-w-2xl mx-auto">
            <p className="text-star italic">
              “Zara&apos;s guests thought it was the coolest invite they&apos;d ever seen.”
            </p>
            <div className="text-comet text-sm mt-3">— Priya, mum of a 6-year-old</div>
          </blockquote>
        </div>
      </section>

      {/* === How It Works === */}
      <section className="section" aria-labelledby="how-heading">
        <div className="max-w-4xl mx-auto">
          <h2 id="how-heading" className="font-display text-2xl md:text-3xl text-center text-glow mb-10">
            HOW IT WORKS
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              "Fill in your child's birthday details — takes 2 minutes.",
              "Pay once — $14. No subscription.",
              "Get your magic link. Share it with every guest.",
            ].map((step, i) => (
              <div key={i} className="card p-6">
                <div
                  className="font-display text-2xl mb-2"
                  style={{ color: "var(--color-plasma)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === Live Demo === */}
      <section id="demo" className="section" aria-labelledby="demo-heading">
        <div className="max-w-3xl mx-auto text-center">
          <h2 id="demo-heading" className="font-display text-2xl md:text-3xl text-glow mb-6">
            Try a live mission before you buy
          </h2>
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
        {showDemo && (
          <div className="mt-10 max-w-5xl mx-auto rounded-2xl overflow-hidden border border-white/10">
            <BirthdayPortal experience={spaceMissionExperience} {...demoData} />
          </div>
        )}
      </section>

      <CreateForm />

      {/* === Final CTA === */}
      <section className="section text-center" aria-labelledby="final-cta-heading">
        <div className="max-w-2xl mx-auto card p-8">
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
