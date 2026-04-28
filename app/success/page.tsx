"use client";

// TODO v2: Replace localStorage + encoded URL with verified payment token after first sales.

import { useEffect, useState } from "react";
import { config } from "@/lib/config";
import { copyToClipboard, encodePortalData, sanitizePhoneForWhatsApp, detectContactType } from "@/lib/utils";
import type { FormData } from "@/lib/validation";

interface State {
  status: "loading" | "ok" | "error";
  data?: FormData;
  url?: string;
}

export default function SuccessPage() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("bdp_session");
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
    } catch {
      setState({ status: "error" });
    }
  }, []);

  if (state.status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center px-5">
        <div className="text-comet font-display tracking-widest">
          PREPARING YOUR PORTAL…
        </div>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="min-h-screen flex items-center justify-center px-5 text-center">
        <div className="star-field" aria-hidden />
        <div className="relative z-10 card p-8 max-w-md">
          <h1 className="font-display text-2xl text-glow mb-3">
            We couldn&apos;t find your mission details.
          </h1>
          <p className="text-comet mb-3">
            This can happen if you opened this page in a different browser or
            cleared your browser data.
          </p>
          <p className="text-comet text-sm">
            Please contact us at{" "}
            <a className="underline" href={`mailto:${config.SUPPORT_EMAIL}`}>
              {config.SUPPORT_EMAIL}
            </a>{" "}
            with your payment receipt and we will help you manually.
          </p>
        </div>
      </main>
    );
  }

  const data = state.data!;
  const url = state.url!;
  const contactType = detectContactType(data.parentContact);
  const waNumber = sanitizePhoneForWhatsApp(data.parentContact);
  const waText = `🚀 Here's Captain ${data.childName}'s Birthday Mission portal! Open it to see the mission briefing, countdown, and complete the Cadet Challenge: ${url}`;
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}`;
  const showWhatsApp = contactType === "whatsapp" || contactType === "both";

  async function handleCopy() {
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <main className="min-h-screen relative">
      <div className="star-field" aria-hidden />
      <div className="section relative z-10 max-w-2xl mx-auto text-center">
        <h1 className="font-display text-3xl md:text-4xl text-glow mb-3">
          🚀 Your birthday mission is ready!
        </h1>
        <p className="text-comet mb-2">
          Save this link — it&apos;s your portal. Share it with every guest.
        </p>
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
        </div>
      </div>
    </main>
  );
}
