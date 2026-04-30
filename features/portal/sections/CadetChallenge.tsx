import QuizGame from "@/components/QuizGame";

interface CadetChallengeProps {
  childName: string;
  age: string;
  favoriteThing: string;
  funFacts: [string, string, string];
  location: string;
  onComplete: (score: number) => void;
}

export default function CadetChallenge({
  childName,
  age,
  favoriteThing,
  funFacts,
  location,
  onComplete,
}: CadetChallengeProps) {
  return (
    <section className="section" aria-labelledby="cadet-challenge-heading">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h3 id="cadet-challenge-heading" className="font-display text-2xl md:text-3xl text-glow">
            CADET CHALLENGE
          </h3>
          <p className="text-comet mt-2">
            Complete your training to earn Space Badges
          </p>
        </div>
        <QuizGame
          childName={childName}
          age={age}
          favoriteThing={favoriteThing}
          funFacts={funFacts}
          location={location}
          onComplete={onComplete}
        />
      </div>
    </section>
  );
}
