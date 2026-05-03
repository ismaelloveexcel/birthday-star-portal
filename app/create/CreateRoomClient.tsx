"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateRoomClient() {
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
    const res = await fetch("/api/sessions/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idempotencyKey: idem,
        title: (fd.get("title") as string) || undefined,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setErr(j.error ?? "Could not create room");
      return;
    }
    const data = (await res.json()) as { shortCode: string };
    router.push(`/${data.shortCode}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="title" className="text-xs font-medium text-stone-500">
          Title (optional)
        </label>
        <input
          id="title"
          name="title"
          maxLength={120}
          className="w-full rounded-md border border-stone-800 bg-stone-900 px-3 py-2 text-sm text-stone-100 outline-none ring-stone-600 focus:ring-1"
          placeholder="Friday group"
        />
      </div>
      {err ? (
        <p className="text-sm text-amber-400" role="alert">
          {err}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-md bg-stone-100 px-4 py-3 text-sm font-medium text-stone-950 transition hover:bg-white disabled:opacity-50"
      >
        {busy ? "Creating…" : "Create room"}
      </button>
    </form>
  );
}
