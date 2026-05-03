import Link from "next/link";
import { notFound } from "next/navigation";
import { findSessionIdByShortCode } from "@/lib/rsse/applyPlatformCommand";
import { getRsseStore } from "@/lib/rsse/memoryPersistence";
import {
  loadEvents,
  loadSessionRuntime,
} from "@/lib/rsse/sessionRuntime";
import { findLatestSessionResultBySessionId } from "@/lib/rsse/queries";
import { ResultsActions } from "./ResultsActions";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const sid = findSessionIdByShortCode(code.toLowerCase());
  if (!sid) notFound();
  const store = getRsseStore();
  const rt = loadSessionRuntime(store, sid);
  if (!rt) notFound();
  const result = findLatestSessionResultBySessionId(sid);
  const events = loadEvents(store, sid).filter((e) =>
    ["checkpoint_reached", "session_unlocked", "session_shared", "host_started"].includes(
      e.eventType,
    ),
  );

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  const shareUrl = result ? `${baseUrl}/${code}/results?r=${result.publicSlug}` : `${baseUrl}/${code}/results`;

  return (
    <main id="main" className="min-h-screen bg-stone-950 text-stone-100">
      <div className="mx-auto flex max-w-lg flex-col gap-10 px-6 py-16">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Results</p>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-medium text-stone-50">
            Session summary
          </h1>
        </header>

        {result ? (
          <section className="space-y-4 rounded-md border border-stone-800 bg-stone-900/40 p-5 text-sm text-stone-300">
            <p className="whitespace-pre-wrap text-stone-200">
              {result.shareText ?? ""}
            </p>
            <dl className="grid grid-cols-2 gap-2 text-xs text-stone-500">
              <dt>Participants</dt>
              <dd className="text-stone-300">
                {String((result.summary as { playerCount?: number }).playerCount ?? "—")}
              </dd>
              <dt>Checkpoints</dt>
              <dd className="text-stone-300">
                {String((result.summary as { checkpointCount?: number }).checkpointCount ?? "—")}
              </dd>
            </dl>
          </section>
        ) : (
          <p className="text-sm text-stone-500">
            No results yet. Complete the session from the runtime harness first.
          </p>
        )}

        <section className="space-y-2">
          <h2 className="text-xs font-medium uppercase tracking-wider text-stone-500">
            Key moments
          </h2>
          <ul className="list-inside list-disc text-sm text-stone-400">
            {events.length === 0 ? (
              <li>No milestone events recorded.</li>
            ) : (
              events.map((e) => (
                <li key={e.id}>
                  {e.eventType}
                  {e.eventType === "checkpoint_reached" &&
                  typeof e.payload.label === "string"
                    ? `: ${e.payload.label}`
                    : ""}
                </li>
              ))
            )}
          </ul>
        </section>

        <ResultsActions
          sessionId={sid}
          shortCode={code}
          shareUrl={shareUrl}
          lastSequence={rt.lastEvent?.sequenceNumber ?? 0}
        />

        <section className="space-y-3 rounded-md border border-stone-800 p-5">
          <h2 className="text-xs font-medium uppercase tracking-wider text-stone-500">
            Replay intent
          </h2>
          <p className="text-sm text-stone-400">
            When experiences ship, this slot will start a fresh private run with the same group
            pattern.
          </p>
        </section>

        <Link href="/create" className="text-xs text-stone-500 underline">
          Create another room
        </Link>
      </div>
    </main>
  );
}
