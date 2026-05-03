import Link from "next/link";
import { config } from "@/lib/config";
import { CreateRoomClient } from "./CreateRoomClient";

export default function CreateRoomPage() {
  return (
    <main id="main" className="min-h-screen bg-stone-950 text-stone-100">
      <div className="mx-auto flex max-w-lg flex-col gap-10 px-6 py-20">
        <header className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
            Private room
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-medium tracking-tight text-stone-50 md:text-4xl">
            Create a private room
          </h1>
          <p className="text-sm leading-relaxed text-stone-400">
            Invite your group. Run a synchronized session. Structure first —
            experiences plug in later.
          </p>
        </header>
        <CreateRoomClient />
        <p className="text-xs text-stone-600">
          <Link
            href="/"
            className="underline decoration-stone-600 underline-offset-4 hover:text-stone-400"
          >
            Back home
          </Link>
          <span className="mx-2">·</span>
          <span>{config.BASE_URL.replace(/^https?:\/\//, "")}</span>
        </p>
      </div>
    </main>
  );
}
