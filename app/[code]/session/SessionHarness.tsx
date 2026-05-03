"use client";

import { useCallback, useEffect, useState } from "react";

type Lookup = {
  sessionId: string;
  shortCode: string;
  status: string;
  lastSequence: number;
};

export function SessionHarness({ code }: { code: string }) {
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/sessions/lookup?code=${encodeURIComponent(code)}`);
    if (!res.ok) {
      setErr("Room not found");
      return;
    }
    const j = (await res.json()) as Lookup;
    setLookup(j);
    setErr(null);
  }, [code]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function playerId(): string | null {
    if (!lookup || typeof window === "undefined") return null;
    return sessionStorage.getItem(`rsse:player:${lookup.sessionId}`);
  }

  async function send(
    body: Record<string, unknown>,
    idem: string,
  ) {
    if (!lookup) return;
    setMsg(null);
    const pid = playerId();
    const res = await fetch("/api/sessions/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        sessionId: lookup.sessionId,
        playerId: pid ?? undefined,
        idempotencyKey: idem,
        lastSeenSequenceNumber: lookup.lastSequence,
      }),
    });
    const j = (await res.json().catch(() => ({}))) as {
      error?: string;
      lastEvent?: { sequenceNumber: number };
      events?: { sequenceNumber: number }[];
    }
    if (!res.ok) {
      setErr(j.error ?? "Command failed");
      return;
    }
    setErr(null);
    setMsg("Updated");
    await refresh();
  }

  if (err && !lookup) {
    return <p className="text-sm text-amber-400">{err}</p>;
  }
  if (!lookup) {
    return <p className="text-sm text-stone-500">Loading…</p>;
  }

  const busyStatuses = ["completed", "expired", "archived"];
  const locked = lookup.status === "locked_active";

  return (
    <div className="space-y-8">
      <div className="space-y-1 text-sm text-stone-400">
        <p>Private session active</p>
        <p className="text-xs text-stone-600">Room {lookup.shortCode}</p>
        {msg ? <p className="text-stone-300">{msg}</p> : null}
        {err ? <p className="text-amber-400">{err}</p> : null}
      </div>

      {!busyStatuses.includes(lookup.status) ? (
        <div className="flex flex-col gap-3">
          {lookup.status === "lobby" && (
            <button
              type="button"
              className="rounded-md border border-stone-700 py-2 text-sm text-stone-200 hover:border-stone-500"
              onClick={() =>
                void send(
                  { type: "START_SESSION" },
                  `start:${lookup.sessionId}`,
                )
              }
            >
              Start session (host)
            </button>
          )}
          {(lookup.status === "active" || lookup.status === "locked_active") && (
            <>
              <button
                type="button"
                className="rounded-md border border-stone-700 py-2 text-sm text-stone-200 hover:border-stone-500"
                onClick={() =>
                  void send(
                    {
                      type: "EMIT_EXPERIENCE_EVENT",
                      payload: { label: "checkpoint" },
                    },
                    `cp:${Date.now()}`,
                  )
                }
              >
                Emit checkpoint
              </button>
              <button
                type="button"
                className="rounded-md border border-stone-700 py-2 text-sm text-stone-200 hover:border-stone-500"
                onClick={() =>
                  void send(
                    { type: "REQUEST_UNLOCK" },
                    `unlock:${Date.now()}`,
                  )
                }
              >
                Request unlock
              </button>
              {locked ? (
                <button
                  type="button"
                  className="rounded-md border border-amber-900/50 py-2 text-sm text-amber-200/90"
                  onClick={async () => {
                    await fetch("/api/sessions/unlock", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        sessionId: lookup.sessionId,
                        playerId: playerId(),
                        idempotencyKey: `checkout:${Date.now()}`,
                        lastSeenSequenceNumber: lookup.lastSequence,
                      }),
                    });
                    void refresh();
                  }}
                >
                  Open checkout (placeholder)
                </button>
              ) : null}
              <button
                type="button"
                className="rounded-md bg-stone-100 py-2 text-sm font-medium text-stone-950 hover:bg-white"
                onClick={() =>
                  void send(
                    { type: "COMPLETE_SESSION" },
                    `done:${lookup.sessionId}`,
                  )
                }
              >
                Complete session
              </button>
            </>
          )}
        </div>
      ) : (
        <p className="text-sm text-stone-500">Session finished — use results.</p>
      )}
    </div>
  );
}
