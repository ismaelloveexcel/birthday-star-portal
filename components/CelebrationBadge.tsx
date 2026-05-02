"use client";

interface CelebrationBadgeProps {
  title: string;
  subtitle: string;
  accentColor?: string;
}

export default function CelebrationBadge({
  title,
  subtitle,
  accentColor = "var(--color-gold)",
}: CelebrationBadgeProps) {
  return (
    <div className="card p-6 md:p-10 max-w-xl mx-auto text-center scale-in relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-30"
        style={{
          background: `radial-gradient(circle, ${accentColor}, transparent 60%)`,
        }}
      />
      <h3 className="font-display text-2xl md:text-3xl mb-3">{title}</h3>
      <p className="text-comet">{subtitle}</p>
    </div>
  );
}
