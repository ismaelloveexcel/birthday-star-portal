import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-5 text-center relative">
      <div className="star-field" aria-hidden />
      <div className="relative z-10 card p-8 max-w-md">
        <h1 className="font-display text-2xl md:text-3xl text-glow mb-3">
          LOST IN DEEP SPACE
        </h1>
        <p className="text-comet mb-6">
          This page drifted out of the mission radius.
        </p>
        <Link href="/" className="btn-primary">
          Return to base
        </Link>
      </div>
    </main>
  );
}
