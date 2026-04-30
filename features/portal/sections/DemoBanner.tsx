import { config } from "@/lib/config";

export default function DemoBanner() {
  return (
    <div
      className="sticky top-0 z-30 w-full text-center text-sm md:text-base px-3 py-2 flex flex-wrap items-center justify-center gap-2"
      style={{
        background: "rgba(124, 77, 255, 0.18)",
        borderBottom: "1px solid rgba(124,77,255,0.45)",
        backdropFilter: "blur(8px)",
      }}
    >
      <span>👀 This is a demo — Create yours for {config.PRICE}</span>
      <a href="#form" className="btn-secondary" style={{ minHeight: 36, padding: "0.35rem 0.9rem" }}>
        Create My Portal →
      </a>
    </div>
  );
}
