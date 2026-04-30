"use client";

import { config } from "@/lib/config";
import { copyToClipboard } from "@/lib/utils";
import { type FormData } from "@/lib/validation";
import Field from "./Field";
import { useCheckoutSubmit } from "./useCheckoutSubmit";
import { useDraft } from "./useDraft";

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

export default function CreateForm() {
  const { form, setForm, draftRestored, startOver } = useDraft();
  const {
    errors,
    setErrors,
    submitting,
    storageError,
    handleSubmit,
  } = useCheckoutSubmit(form);

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key]) {
      setErrors((current) => ({ ...current, [key]: undefined }));
    }
  }

  function handleStartOver() {
    startOver();
    setErrors({});
  }

  return (
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
              onClick={handleStartOver}
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
              {TIMEZONES.map((timezone) => (
                <option key={timezone} value={timezone}>
                  {timezone}
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
  );
}