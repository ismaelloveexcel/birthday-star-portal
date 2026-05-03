import Link from "next/link";
import { notFound } from "next/navigation";
import { findSessionIdByShortCode } from "@/lib/rsse/applyPlatformCommand";
import { getRsseStore } from "@/lib/rsse/memoryPersistence";
import { loadSessionRuntime } from "@/lib/rsse/sessionRuntime";

export default async function SessionLobbyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const sid = findSessionIdByShortCode(code.toLowerCase());
  if (!sid) notFound();
  const rt = loadSessionRuntime(getRsseStore(), sid);
  if (!rt) notFound();

  const { status, shortCode } = rt.session;
  const players = rt.activePlayers.length;

  return (
    <main id="main" className="min-h-screen bg-stone-950 text-stone-100">
      <div className="mx-auto flex max-w-lg flex-col gap-8 px-6 py-16">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Room</p>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-medium text-stone-50">
            {shortCode}
          </h1>
          <p className="text-sm text-stone-400">Status: {status}</p>
          <p className="text-sm text-stone-500">{players} in room</p>
        </header>

        <nav className="flex flex-col gap-3 text-sm">
          {(status === "lobby" || status === "created") && (
            <Link
              href={`/${code}/join`}
              className="rounded-md bg-stone-100 px-4 py-3 text-center font-medium text-stone-950 hover:bg-white"
            >
              Join this room
            </Link>
          )}
          {(status === "active" || status === "locked_active") && (
            <Link
              href={`/${code}/session`}
              className="rounded-md bg-stone-100 px-4 py-3 text-center font-medium text-stone-950 hover:bg-white"
            >
              Continue session
            </Link>
          )}
          {status === "completed" && (
            <Link
              href={`/${code}/results`}
              className="rounded-md bg-stone-100 px-4 py-3 text-center font-medium text-stone-950 hover:bg-white"
            >
              View results
            </Link>
          )}
          {(status === "expired" || status === "archived") && (
            <p className="text-sm text-stone-500">
              This session is {status}. Open a new room from the home flow.
            </p>
          )}
        </nav>
      </div>
    </main>
  );
}
