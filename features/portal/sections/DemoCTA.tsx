import { config } from "@/lib/config";

export default function DemoCTA() {
  return (
    <section className="section text-center" aria-labelledby="demo-cta-heading">
      <div className="max-w-md mx-auto card p-6">
        <h4 id="demo-cta-heading" className="font-display text-xl text-glow mb-3">
          Ready to launch your own birthday mission?
        </h4>
        <a href="#form" className="btn-primary">
          Create My Portal — {config.PRICE} →
        </a>
      </div>
    </section>
  );
}
