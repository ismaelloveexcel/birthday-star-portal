import Link from "next/link";
import { notFound } from "next/navigation";
import { findSessionIdByShortCode } from "@/lib/rsse/applyPlatformCommand";
import { SessionHarness } from "./SessionHarness";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  if (!findSessionIdByShortCode(code.toLowerCase())) notFound();

  return (
    <main id="main" className="min-h-screen bg-stone-950 text-stone-100">
      <div className="mx-auto flex max-w-lg flex-col gap-8 px-6 py-16">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Session</p>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-medium text-stone-50">
            Runtime harness
          </h1>
          <p className="text-sm text-stone-500">
            Checkpoint reached · Session locked · Session unlocked · Session complete
          </p>
        </header>
        <SessionHarness code={code} />
        <Link href={`/${code}/results`} className="text-xs text-stone-500 underline">
          Results
        </Link>
      </div>
    </main>
  );
}
