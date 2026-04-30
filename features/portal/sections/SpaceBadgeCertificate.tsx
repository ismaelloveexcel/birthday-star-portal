import SpaceBadge from "@/components/SpaceBadge";

interface SpaceBadgeCertificateProps {
  score: number;
  childName: string;
}

export default function SpaceBadgeCertificate({ score, childName }: SpaceBadgeCertificateProps) {
  return (
    <section className="section" aria-label="Space Cadet Certificate">
      <SpaceBadge score={score} childName={childName} totalQuestions={5} />
    </section>
  );
}
