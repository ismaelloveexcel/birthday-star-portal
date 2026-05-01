"use client";

// TODO v2: Replace localStorage + encoded URL with verified payment token after first sales.

import { useEffect, useState } from "react";
import { config } from "@/lib/config";
import { buildPortalShareText, buildPortalTeaserText, copyToClipboard, decodePortalData, encodePortalData, sanitizePhoneForWhatsApp, detectContactType, pingEvent } from "@/lib/utils";
import type { FormData } from "@/lib/validation";

interface State {
  status: "loading" | "ok" | "error";
  data?: FormData;
  url?: string;
}

export default function SuccessPage() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [copied, setCopied] = useState(false);
  const [guestMessageCopied, setGuestMessageCopied] = useState(false);
  const [teaserCopied, setTeaserCopied] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Try localStorage first; fall back to sessionStorage (set when localStorage was unavailable on checkout)
      const raw =
        localStorage.getItem("bdp_session") ??
        sessionStorage.getItem("bdp_session");
      if (!raw) {
        setState({ status: "error" });
        return;
      }
      const data = JSON.parse(raw) as FormData;
      if (!data || typeof data !== "object" || !data.childName) {
        setState({ status: "error" });
        return;
      }
      const encoded = encodePortalData(data);
      const url = `${config.BASE_URL}/pack?data=${encoded}`;
      setState({ status: "ok", data, url });
      // No-PII conversion ping (only sent if NEXT_PUBLIC_PING_URL is configured).
      pingEvent("portal_link_generated");
    } catch {
      setState({ status: "error" });
    }
  }, []);

  if (state.status === "loading") {
    return (
      <main id="main" className="min-h-screen flex items-center justify-center px-5">
        <div className="text-comet font-display tracking-widest">
          PREPARING YOUR PORTAL…
        </div>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main id="main" className="min-h-screen flex items-center justify-center px-5 text-center">
        <div className="star-field" aria-hidden />
        <div className="relative z-10 card p-8 max-w-md">
          <h1 className="font-display text-2xl text-glow mb-3">
            We couldn&apos;t find your mission details.
          </h1>
          <p className="text-comet mb-3">
            This can happen if you opened this page in a different browser or
            cleared your browser data.
          </p>
          <p className="text-comet text-sm mb-3">
            If you saved your recovery code before payment, paste it below to rebuild your portal link instantly.
          </p>
          <p className="text-comet text-sm">
            Please contact us at{" "}
            <a className="underline" href={`mailto:${config.SUPPORT_EMAIL}`}>
              {config.SUPPORT_EMAIL}
            </a>{" "}
            with your payment receipt and we will help you manually.
          </p>
          <div className="mt-5 text-left">
            <label htmlFor="recovery-code" className="label">
              Recovery code
            </label>
            <textarea
              id="recovery-code"
              className="input"
              style={{ minHeight: 160 }}
              placeholder="Paste the recovery code you copied before payment"
              value={recoveryCode}
              onChange={(event) => {
                setRecoveryCode(event.target.value);
                if (recoveryError) setRecoveryError(null);
              }}
            />
            {recoveryError && (
              <div className="field-error" role="alert">
                {recoveryError}
              </div>
            )}
            <button type="button" className="btn-primary w-full mt-3" onClick={restoreFromRecoveryCode}>
              Restore my portal link
            </button>
          </div>
        </div>
      </main>
    );
  }

  const data = state.data!;
  const url = state.url!;
  const contactType = detectContactType(data.parentContact);
  const waNumber = sanitizePhoneForWhatsApp(data.parentContact);
  const waText = buildPortalShareText(data.childName, url);
  const teaserText = buildPortalTeaserText(data.childName, url);
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}`;
  const teaserWaUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(teaserText)}`;
  const showWhatsApp = contactType === "whatsapp" || contactType === "both";

  async function handleCopy() {
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleTeaserCopy() {
    const ok = await copyToClipboard(teaserText);
    if (ok) {
      setTeaserCopied(true);
      setTimeout(() => setTeaserCopied(false), 2000);
    }
  }

  async function handleGuestMessageCopy() {
    const ok = await copyToClipboard(waText);
    if (ok) {
      setGuestMessageCopied(true);
      setTimeout(() => setGuestMessageCopied(false), 2000);
    }
  }

  function restoreFromRecoveryCode() {
    const encoded = recoveryCode.trim();
    if (!encoded) {
      setRecoveryError("Paste your recovery code first.");
      return;
    }

    const decoded = decodePortalData<FormData>(encoded);
    if (!decoded || typeof decoded !== "object" || !decoded.childName) {
      setRecoveryError("That recovery code is invalid.");
      return;
    }

    setRecoveryError(null);
    setState({
      status: "ok",
      data: decoded,
      url: `${config.BASE_URL}/pack?data=${encoded}`,
    });
  }

  return (
    <main id="main" className="min-h-screen relative">
      <div className="star-field" aria-hidden />
      <div className="section relative z-10 max-w-2xl mx-auto text-center">
        <h1 className="font-display text-3xl md:text-4xl text-glow mb-3">
          🚀 Your birthday mission is ready!
        </h1>
        <p className="text-comet mb-2">
          Save this link — it&apos;s your portal. Share it with every guest.
        </p>
        <div className="card mt-4 p-4 text-left text-sm text-comet">
          <ol className="space-y-2 list-decimal pl-5">
            <li>Open your portal.</li>
            <li>Copy your link.</li>
            <li>Share it with guests.</li>
          </ol>
        </div>
        <div
          className="card p-3 text-xs md:text-sm mt-4 break-all text-comet"
          aria-label="Your portal link"
        >
          {url}
        </div>

        <div
          className="card mt-4 p-4 text-sm"
          style={{
            borderColor: "rgba(255,215,0,0.4)",
            background: "rgba(255,215,0,0.06)",
          }}
        >
          <strong>Important:</strong> Save your link now. Bookmark it or send it
          to yourself.
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            Open My Birthday Star Portal →
          </a>
          <button onClick={handleCopy} className="btn-secondary">
            {copied ? "Copied!" : "Copy link"}
          </button>
          {showWhatsApp && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              📲 Share on WhatsApp
            </a>
          )}
          <button onClick={handleGuestMessageCopy} className="btn-secondary">
            {guestMessageCopied ? "Guest message copied!" : "Copy guest message"}
          </button>
        </div>

        <div className="card mt-6 p-4 text-left">
          <div className="text-xs uppercase tracking-widest text-comet mb-2">
            Anticipation teaser
          </div>
          <p className="text-comet text-sm mb-3">
            Send this first if you want the birthday link to feel like a secret transmission before guests open it.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button type="button" onClick={handleTeaserCopy} className="btn-secondary">
              {teaserCopied ? "Teaser copied!" : "Copy teaser message"}
            </button>
            {showWhatsApp && (
              <a
                href={teaserWaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                Send teaser on WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
