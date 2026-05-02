import Link from "next/link";
import { config } from "@/lib/config";

interface SeoLandingPageProps {
  eyebrow: string;
  title: string;
  intro: string;
  proofPoints: string[];
  searchIntent: string;
  currentPath?: string;
}

const includedMoments = [
  "Hero reveal",
  "Party countdown",
  "RSVP action",
  "Personal quiz",
  "Shareable badge",
  "One guest link",
];

const relatedLinks = [
  { href: "/", label: "Birthday Star Portal home" },
  { href: "/playable-birthday-invitation", label: "Playable birthday invitation" },
  { href: "/whatsapp-birthday-invitation", label: "WhatsApp birthday invitation" },
  { href: "/space-birthday-invitation", label: "Space birthday invitation" },
];

export default function SeoLandingPage({
  eyebrow,
  title,
  intro,
  proofPoints,
  searchIntent,
  currentPath,
}: SeoLandingPageProps) {
  const visibleRelatedLinks = relatedLinks.filter((link) => link.href !== currentPath);

  return (
    <main id="main">
      <header className="site-header">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="font-display tracking-widest text-star">
            {config.BRAND_NAME}
          </Link>
          <Link href="/#form" className="btn-secondary" style={{ minHeight: 40, padding: "0.4rem 1rem" }}>
            Create Portal
          </Link>
        </div>
      </header>

      <section className="section hero-section" aria-labelledby="seo-heading">
        <div className="star-field" aria-hidden="true" />
        <div className="hero-haze" aria-hidden="true" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="max-w-3xl">
            <div className="badge-pill mb-6">
              {config.LAUNCH_BADGE}
            </div>
            <p className="eyebrow mb-4">{eyebrow}</p>
            <h1 id="seo-heading" className="font-display text-4xl md:text-6xl leading-tight text-glow">
              {title}
            </h1>
            <p className="mt-6 text-comet md:text-xl hero-subcopy">
              {intro}
            </p>
            <div className="hero-action-row mt-8">
              <Link href="/#demo" className="btn-primary">
                Try the Live Mission
              </Link>
              <Link href="/#form" className="btn-secondary">
                Create My Portal - {config.PRICE}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section pt-0" aria-labelledby="intent-heading">
        <div className="max-w-6xl mx-auto story-grid">
          <div className="story-panel">
            <p className="eyebrow mb-4">Why it fits</p>
            <h2 id="intent-heading" className="font-display text-2xl md:text-4xl text-glow mb-4">
              {searchIntent}
            </h2>
            <div className="briefing-points">
              {proofPoints.map((point) => (
                <div key={point} className="briefing-point">
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="story-panel">
            <div className="dossier-head">
              <span className="eyebrow">What guests open</span>
              <strong>One shareable birthday mission</strong>
            </div>
            <ul className="story-list">
              {includedMoments.map((moment) => (
                <li key={moment}>{moment}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section pt-0" aria-labelledby="related-heading">
        <div className="max-w-6xl mx-auto story-panel">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow mb-3">Explore invite types</p>
              <h2 id="related-heading" className="font-display text-2xl md:text-3xl text-glow">
                Related birthday invite searches
              </h2>
            </div>
          </div>
          <div className="hero-action-row mt-6">
            {visibleRelatedLinks.map((link) => (
              <Link key={link.href} href={link.href} className="btn-secondary">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section text-center" aria-labelledby="seo-cta-heading">
        <div className="max-w-4xl mx-auto final-cta-panel">
          <h2 id="seo-cta-heading" className="font-display text-2xl md:text-3xl text-glow mb-3">
            See the real portal before you buy.
          </h2>
          <p className="text-comet mb-6">
            Birthday Star Portal works as a mobile-first link for WhatsApp groups, family chats, and party guest lists.
          </p>
          <div className="hero-action-row" style={{ justifyContent: "center" }}>
            <Link href="/#demo" className="btn-primary">
              Open Demo
            </Link>
            <Link href="/#form" className="btn-secondary">
              Start Setup
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
