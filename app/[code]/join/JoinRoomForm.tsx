"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const PRESETS = ["*", "★", "◎", "◇"];

export function JoinRoomForm({ shortCode }: { shortCode: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const idem =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(Date.now());
    const res = await fetch("/api/sessions/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shortCode,
        displayName: fd.get("displayName") as string,
        avatarEmoji: (fd.get("avatarEmoji") as string) || "*",
        idempotencyKey: idem,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setErr(j.error ?? "Could not join");
      return;
    }
    const data = (await res.json()) as { playerId: string; sessionId: string };
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`rsse:player:${data.sessionId}`, data.playerId);
    }
    router.push(`/${shortCode}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="displayName" className="text-xs font-medium text-stone-500">
          Display name
        </label>
        <input
          id="displayName"
          name="displayName"
          required
          minLength={1}
          maxLength={20}
          className="w-full rounded-md border border-stone-800 bg-stone-900 px-3 py-2 text-sm outline-none ring-stone-600 focus:ring-1"
        />
      </div>
      <fieldset className="space-y-2">
        <legend className="text-xs font-medium text-stone-500">Mark</legend>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((ch) => (
            <label
              key={ch}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-stone-800 px-3 py-2 text-sm has-[:checked]:border-stone-400"
            >
              <input type="radio" name="avatarEmoji" value={ch} defaultChecked={ch === "*"} />
              <span className="font-mono">{ch}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {err ? (
        <p className="text-sm text-amber-400" role="alert">
          {err}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-md bg-stone-100 py-3 text-sm font-medium text-stone-950 hover:bg-white disabled:opacity-50"
      >
        {busy ? "Joining…" : "Join room"}
      </button>
    </form>
  );
}
