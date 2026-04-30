"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import BirthdayPortal from "./BirthdayPortal";
import { config } from "@/lib/config";
import { validateForm, hasErrors, type FormData, type FormErrors } from "@/lib/validation";
import { copyToClipboard, pingEvent } from "@/lib/utils";

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

const DRAFT_KEY = "bdp_draft";
const SESSION_KEY = "bdp_session";

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

function isValidDraft(value: unknown): value is FormData {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.childName === "string" &&
    typeof v.age === "string" &&
    typeof v.partyDate === "string" &&
    typeof v.partyTime === "string" &&
    typeof v.location === "string" &&
    typeof v.parentContact === "string" &&
    typeof v.favoriteThing === "string" &&
    typeof v.funFact1 === "string" &&
    typeof v.funFact2 === "string" &&
    typeof v.funFact3 === "string" &&
    typeof v.timezone === "string"
  );
}

export default function PortalLanding() {
  const [showDemo, setShowDemo] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const draftHydrated = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Hydrate from localStorage draft on mount, only if no completed session exists.
  // All storage access is wrapped in try/catch — Safari Private Mode and
  // some in-app browsers throw on localStorage access.
  useEffect(() => {
    try {
      const session = localStorage.getItem(SESSION_KEY);
      if (session) {
        draftHydrated.current = true;
        return;
      }
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) {
        draftHydrated.current = true;
        return;
      }
      const parsed = JSON.parse(raw) as unknown;
      if (isValidDraft(parsed)) {
        setForm(parsed);
        setDraftRestored(true);
      }
    } catch {
      // Silent — draft restore is a nice-to-have, not a blocker.
    } finally {
      draftHydrated.current = true;
    }
  }, []);

  // Debounced save of the current form to localStorage on every change.
  // Skip until after hydration so we never overwrite a stored draft with the
  // empty initial form.
  useEffect(() => {
    if (!draftHydrated.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
      } catch {
        // Silent — see hydration note above.
      }
    }, 250);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [form]);

  function startOver() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // Silent.
    }
    setForm(emptyForm());
    setErrors({});
    setDraftRestored(false);
  }

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
    setStorageError(false);
    const serialised = JSON.stringify(form);
    let saved = false;
    try {
      localStorage.setItem(SESSION_KEY, serialised);
      saved = true;
    } catch {
      // localStorage failed (e.g. Safari Private Mode) — try sessionStorage
      try {
        sessionStorage.setItem(SESSION_KEY, serialised);
        saved = true;
      } catch {
        // both storage APIs unavailable
      }
    }
    if (!saved) {
      setSubmitting(false);
      setStorageError(true);
      return;
    }
    // Clear the auto-saved draft now that the form has been committed.
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // Silent.
    }
    // No-PII conversion ping (only sent if NEXT_PUBLIC_PING_URL is configured).
    pingEvent("portal_form_submit");
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
            <BirthdayPortal {...demoData} />
          </div>
        )}
      </section>

      {/* === Form === */}
      <section id="form" className="section" aria-labelledby="form-heading">
        <div className="max-w-2xl mx-auto">
          <h2 id="form-heading" className="font-display text-2xl md:text-3xl text-center text-glow mb-8">
            Create your child&apos;s birthday mission
          </h2>
          {draftRestored && (
            <div
              className="card p-4 mb-4 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              role="status"
            >
              <span className="text-star">
                We restored your details from earlier.
              </span>
              <button
                type="button"
                onClick={startOver}
                className="btn-secondary"
                style={{ minHeight: 48, padding: "0.35rem 0.9rem", fontSize: "0.85rem" }}
              >
                Start over
              </button>
            </div>
          )}
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
                placeholder="+971 50 123 4567 or you@example.com"
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
            <p className="text-xs text-comet text-center pt-2">
              Secure checkout · 14-day refund · Link arrives instantly.
            </p>
            {storageError && (
              <div
                role="alert"
                className="card p-4 mt-3 text-sm"
                style={{ borderColor: "var(--color-danger)" }}
              >
                <p className="font-semibold mb-2" style={{ color: "var(--color-danger)" }}>
                  ⚠️ Your browser is blocking this page from saving your details.
                </p>
                <p className="text-comet mb-3">
                  This happens in Safari Private Mode and some in-app browsers (Instagram,
                  Facebook, TikTok). Please open this page in Safari or Chrome to continue.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ minHeight: 40, padding: "0.4rem 1rem", fontSize: "0.85rem" }}
                    onClick={async () => {
                      const ok = await copyToClipboard(window.location.href);
                      if (ok) {
                        alert("Link copied! Paste it in Safari or Chrome.");
                      } else {
                        alert(
                          "Could not copy automatically. Please copy the address bar URL manually."
                        );
                      }
                    }}
                  >
                    📋 Copy link to open in Safari/Chrome
                  </button>
                  <a
                    href={`mailto:${config.SUPPORT_EMAIL}?subject=${encodeURIComponent(
                      "Birthday Portal — storage error"
                    )}&body=${encodeURIComponent(
                      "Hi, I could not complete checkout because my browser blocked the form from saving data (storage error).\n\nPlease reply and I will send my party details so you can set up my portal manually.\n\nThank you!"
                    )}`}
                    className="btn-secondary"
                    style={{ minHeight: 40, padding: "0.4rem 1rem", fontSize: "0.85rem" }}
                  >
                    ✉️ Email support
                  </a>
                </div>
              </div>
            )}
          </form>
        </div>
      </section>

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
