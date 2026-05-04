import Link from "next/link";
import { notFound } from "next/navigation";
import { findSessionIdByShortCode } from "@/lib/rsse/persistence/factory";
import { JoinRoomForm } from "./JoinRoomForm";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const sid = await findSessionIdByShortCode(code.toLowerCase());
  if (!sid) notFound();

  return (
    <main id="main" className="min-h-screen bg-stone-950 text-stone-100">
      <div className="mx-auto flex max-w-lg flex-col gap-8 px-6 py-16">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Join</p>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-medium text-stone-50">
            Enter the room
          </h1>
          <p className="text-sm text-stone-400">Choose a display name and optional emoji.</p>
        </header>
        <JoinRoomForm shortCode={code} />
        <Link href={`/${code}`} className="text-xs text-stone-500 underline underline-offset-4">
          Back to room
        </Link>
      </div>
    </main>
  );
}
