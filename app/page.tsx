"use client";

import { useMemo, useState } from "react";
import BirthdayPortal from "@/components/BirthdayPortal";
import { config } from "@/lib/config";
import { validateForm, hasErrors, type FormData, type FormErrors } from "@/lib/validation";

const TIMEZONES = [
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
];

function emptyForm(): FormData {
  return {
    childName: "",
    age: "",
    partyDate: "",
    partyTime: "",
    location: "",
    parentContact: "",
    favoriteThing: "",
    funFact1: "",
    funFact2: "",
    funFact3: "",
    timezone: "Asia/Dubai",
  };
}

export default function HomePage() {
  const [showDemo, setShowDemo] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

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

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateForm(form);
    setErrors(errs);
    if (hasErrors(errs)) {
      // focus first error field
      const firstKey = Object.keys(errs)[0];
      if (firstKey) {
        const el = document.getElementById(`field-${firstKey}`);
        el?.focus();
      }
      return;
    }
    setSubmitting(true);
    try {
      localStorage.setItem("bdp_session", JSON.stringify(form));
    } catch {
      // ignore — error state on /success will handle it
    }
    window.location.href = config.CHECKOUT_URL;
  }

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
      <section className="section relative text-center">
        <div className="star-field" aria-hidden />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="badge-pill mb-6">🚀 {config.LAUNCH_BADGE}</div>
          <h1 className="font-display text-3xl md:text-6xl leading-tight text-glow">
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
      <section className="section">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            {["🔒 Secure checkout", "👤 No account required", "📱 Works on any device"].map((t) => (
              <div key={t} className="card py-4 px-3 text-sm md:text-base">
                {t}
              </div>
            ))}
          </div>
          <blockquote className="card mt-8 p-6 text-center max-w-2xl mx-auto">
            <p className="text-star italic">
              “Zara&apos;s guests thought it was the coolest invite they&apos;d ever seen.”
            </p>
            <div className="text-comet text-sm mt-3">— Priya, mum of 6</div>
          </blockquote>
        </div>
      </section>

      {/* === How It Works === */}
      <section className="section">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl text-center text-glow mb-10">
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
      <section id="demo" className="section">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-2xl md:text-3xl text-glow mb-6">
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
            <BirthdayPortal {...demoData} />
          </div>
        )}
      </section>

      {/* === Form === */}
      <section id="form" className="section">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl text-center text-glow mb-8">
            Create your child&apos;s birthday mission
          </h2>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Field
              id="field-childName"
              label="Child's name *"
              error={errors.childName}
            >
              <input
                id="field-childName"
                className={`input ${errors.childName ? "input-error" : ""}`}
                placeholder="e.g. Ayaan"
                value={form.childName}
                onChange={(e) => update("childName", e.target.value)}
              />
            </Field>

            <Field
              id="field-age"
              label="Age they are turning *"
              error={errors.age}
            >
              <input
                id="field-age"
                type="number"
                min={1}
                max={15}
                className={`input ${errors.age ? "input-error" : ""}`}
                value={form.age}
                onChange={(e) => update("age", e.target.value)}
              />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field
                id="field-partyDate"
                label="Party date *"
                error={errors.partyDate}
              >
                <input
                  id="field-partyDate"
                  type="date"
                  className={`input ${errors.partyDate ? "input-error" : ""}`}
                  value={form.partyDate}
                  onChange={(e) => update("partyDate", e.target.value)}
                />
              </Field>
              <Field
                id="field-partyTime"
                label="Party time *"
                error={errors.partyTime}
              >
                <input
                  id="field-partyTime"
                  type="time"
                  className={`input ${errors.partyTime ? "input-error" : ""}`}
                  value={form.partyTime}
                  onChange={(e) => update("partyTime", e.target.value)}
                />
              </Field>
            </div>

            <Field
              id="field-location"
              label="Party location *"
              error={errors.location}
            >
              <input
                id="field-location"
                className={`input ${errors.location ? "input-error" : ""}`}
                placeholder="e.g. Fun Planet, Abu Dhabi"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
              />
            </Field>

            <Field
              id="field-parentContact"
              label="Your WhatsApp or email *"
              error={errors.parentContact}
            >
              <input
                id="field-parentContact"
                className={`input ${errors.parentContact ? "input-error" : ""}`}
                placeholder="For guests to RSVP to you"
                value={form.parentContact}
                onChange={(e) => update("parentContact", e.target.value)}
              />
            </Field>

            <Field
              id="field-favoriteThing"
              label="Their favourite thing *"
              error={errors.favoriteThing}
            >
              <input
                id="field-favoriteThing"
                className={`input ${errors.favoriteThing ? "input-error" : ""}`}
                placeholder="e.g. rockets, dinosaurs, unicorns"
                value={form.favoriteThing}
                onChange={(e) => update("favoriteThing", e.target.value)}
              />
            </Field>

            <Field id="field-funFact1" label="Fun fact 1 *" error={errors.funFact1}>
              <input
                id="field-funFact1"
                className={`input ${errors.funFact1 ? "input-error" : ""}`}
                placeholder="e.g. once stayed awake for 24 hours straight"
                value={form.funFact1}
                onChange={(e) => update("funFact1", e.target.value)}
              />
            </Field>
            <Field id="field-funFact2" label="Fun fact 2 *" error={errors.funFact2}>
              <input
                id="field-funFact2"
                className={`input ${errors.funFact2 ? "input-error" : ""}`}
                placeholder="e.g. can name every planet in order"
                value={form.funFact2}
                onChange={(e) => update("funFact2", e.target.value)}
              />
            </Field>
            <Field id="field-funFact3" label="Fun fact 3 *" error={errors.funFact3}>
              <input
                id="field-funFact3"
                className={`input ${errors.funFact3 ? "input-error" : ""}`}
                placeholder="e.g. thinks they invented dancing"
                value={form.funFact3}
                onChange={(e) => update("funFact3", e.target.value)}
              />
            </Field>

            <Field id="field-timezone" label="Timezone" error={errors.timezone}>
              <select
                id="field-timezone"
                className="input"
                value={form.timezone}
                onChange={(e) => update("timezone", e.target.value)}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </Field>

            <p className="text-xs text-comet pt-2">
              Only include details you are comfortable sharing with invited guests.
            </p>
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? "Launching…" : `Launch My Birthday Mission — ${config.PRICE} →`}
            </button>
          </form>
        </div>
      </section>

      {/* === Final CTA === */}
      <section className="section text-center">
        <div className="max-w-2xl mx-auto card p-8">
          <h2 className="font-display text-2xl md:text-3xl text-glow mb-3">
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

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children}
      {error && (
        <div className="field-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
