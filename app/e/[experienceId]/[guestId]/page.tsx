import BirthdayPortal from "@/components/BirthdayPortal";
import { loadExperience } from "@/lib/experience/loadExperience";
import { verifyPortalToken } from "@/lib/token/sign";

interface SignedPortalPageProps {
  params: Promise<{
    experienceId: string;
    guestId: string;
  }>;
  searchParams: Promise<{
    t?: string | string[];
  }>;
}

function getTokenParam(value: string | string[] | undefined): string | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function InvalidToken() {
  return (
    <main id="main" className="min-h-screen flex items-center justify-center px-5 text-center relative">
      <div className="star-field" aria-hidden />
      <div className="relative z-10 card p-8 max-w-md">
        <h1 className="font-display text-2xl md:text-3xl text-glow mb-3">MISSION ACCESS DENIED</h1>
        <p className="text-comet">
          This portal link is invalid, expired, or no longer matches the requested guest.
        </p>
      </div>
    </main>
  );
}

export default async function SignedPortalPage({ params, searchParams }: SignedPortalPageProps) {
  const routeParams = await params;
  const query = await searchParams;
  const token = getTokenParam(query.t);
  if (!token) return <InvalidToken />;

  const payload = verifyPortalToken(token);
  if (!payload) return <InvalidToken />;
  if (payload.experienceId !== routeParams.experienceId || payload.guestId !== routeParams.guestId) {
    return <InvalidToken />;
  }

  const experience = loadExperience(routeParams.experienceId);
  if (!experience) return <InvalidToken />;

  return (
    <div id="main">
      <BirthdayPortal
        experience={experience}
        childName={payload.data.childName}
        age={payload.data.age}
        partyDate={payload.data.partyDate}
        partyTime={payload.data.partyTime}
        location={payload.data.location}
        parentContact={payload.data.parentContact}
        favoriteThing={payload.data.favoriteThing}
        funFacts={[payload.data.funFact1, payload.data.funFact2, payload.data.funFact3]}
        timezone={payload.data.timezone}
        isDemo={false}
      />
    </div>
  );
}