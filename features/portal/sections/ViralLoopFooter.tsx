import { config } from "@/lib/config";

export default function ViralLoopFooter() {
  return (
    <section className="section text-center" aria-labelledby="viral-loop-heading">
      <div className="max-w-md mx-auto">
        <p id="viral-loop-heading" className="text-star/90">
          <span aria-hidden="true">✨ </span>Want to create a magical birthday mission for your child?
        </p>
        <a
          href={config.BASE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary mt-4"
        >
          Create your own Birthday Star Portal →
        </a>
        <div className="mt-6 text-xs uppercase tracking-widest text-comet">
          {config.BRAND_NAME}
        </div>
      </div>
    </section>
  );
}
