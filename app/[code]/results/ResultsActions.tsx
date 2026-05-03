"use client";

import { useState } from "react";

export function ResultsActions({
  sessionId,
  shortCode,
  shareUrl,
  lastSequence,
}: {
  sessionId: string;
  shortCode: string;
  shareUrl: string;
  lastSequence: number;
}) {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState<string | null>(null);

  async function share() {
    const idem =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(Date.now());
    const pid =
      typeof window !== "undefined"
        ? sessionStorage.getItem(`rsse:player:${sessionId}`)
        : null;
    await fetch("/api/sessions/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "EMIT_EXPERIENCE_EVENT",
        sessionId,
        playerId: pid ?? undefined,
        idempotencyKey: idem,
        lastSeenSequenceNumber: lastSequence,
        payload: { shareSession: true },
      }),
    });
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function waitlist(e: React.FormEvent) {
    e.preventDefault();
    setSent(null);
    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        sessionId,
        source: "results",
      }),
    });
    if (!res.ok) {
      setSent("Could not save");
      return;
    }
    setSent("Saved");
    setEmail("");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => void share()}
          className="rounded-md bg-stone-100 py-2 text-sm font-medium text-stone-950 hover:bg-white"
        >
          {copied ? "Link copied" : "Copy share link"}
        </button>
        <p className="break-all text-xs text-stone-600">{shareUrl}</p>
      </div>

      <form onSubmit={waitlist} className="space-y-3">
        <label className="block text-xs font-medium text-stone-500" htmlFor="wl">
          Stay in the loop
        </label>
        <div className="flex gap-2">
          <input
            id="wl"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-w-0 flex-1 rounded-md border border-stone-800 bg-stone-900 px-3 py-2 text-sm outline-none ring-stone-600 focus:ring-1"
            placeholder="you@example.com"
          />
          <button
            type="submit"
            className="shrink-0 rounded-md border border-stone-600 px-3 py-2 text-sm text-stone-200 hover:border-stone-400"
          >
            Send
          </button>
        </div>
        {sent ? <p className="text-xs text-stone-500">{sent}</p> : null}
      </form>
    </div>
  );
}
