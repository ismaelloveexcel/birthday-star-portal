import { useId } from "react";

type DodoGuideProps = {
  mood?: "curious" | "excited" | "celebrating";
  message: string;
  label?: string;
  className?: string;
};

export default function DodoGuide({
  mood = "curious",
  message,
  label = "Wandering Dodo",
  className = "",
}: DodoGuideProps) {
  const isCelebrating = mood === "celebrating";
  const isExcited = mood === "excited";
  const svgId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const stageGlowId = `${svgId}-dodo-stage-glow`;
  const bodyId = `${svgId}-dodo-body`;
  const bellyId = `${svgId}-dodo-belly`;
  const wingId = `${svgId}-dodo-wing`;
  const beakId = `${svgId}-dodo-beak`;
  const shadowId = `${svgId}-dodo-soft-shadow`;

  return (
    <div className={`dodo-guide dodo-guide-${mood} ${className}`.trim()}>
      <div className="dodo-guide-bubble">
        <span>{label}</span>
        <strong>{message}</strong>
      </div>
      <svg
        className="dodo-guide-svg"
        viewBox="0 0 420 420"
        role="img"
        aria-label="Wandering Dodo mascot"
      >
        <defs>
          <radialGradient id={stageGlowId} cx="50%" cy="48%" r="54%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.38" />
            <stop offset="48%" stopColor="#69d4ff" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#7c4dff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={bodyId} x1="25%" y1="10%" x2="80%" y2="95%">
            <stop offset="0%" stopColor="#bfe8ff" />
            <stop offset="45%" stopColor="#7da4d7" />
            <stop offset="100%" stopColor="#3d547d" />
          </linearGradient>
          <radialGradient id={bellyId} cx="42%" cy="24%" r="76%">
            <stop offset="0%" stopColor="#fff9e8" />
            <stop offset="62%" stopColor="#ffdca6" />
            <stop offset="100%" stopColor="#efa968" />
          </radialGradient>
          <linearGradient id={wingId} x1="15%" y1="8%" x2="88%" y2="96%">
            <stop offset="0%" stopColor="#8ddaff" />
            <stop offset="100%" stopColor="#5472c8" />
          </linearGradient>
          <linearGradient id={beakId} x1="20%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#ffe28a" />
            <stop offset="54%" stopColor="#ffad4e" />
            <stop offset="100%" stopColor="#e76f37" />
          </linearGradient>
          <filter id={shadowId} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#020617" floodOpacity="0.42" />
          </filter>
        </defs>

        <circle cx="210" cy="210" r="190" fill={`url(#${stageGlowId})`} />
        <path className="dodo-orbit orbit-one" d="M69 217c42-104 212-152 295-64" fill="none" stroke="#69d4ff" strokeWidth="2" strokeOpacity="0.32" />
        <path className="dodo-orbit orbit-two" d="M55 250c79 78 232 83 313-6" fill="none" stroke="#ffd166" strokeWidth="2" strokeOpacity="0.26" />

        {isCelebrating && (
          <g className="dodo-confetti">
            <path d="M89 96l8 19 20-7-13 17 14 17-22-6-9 20-2-22-22-3 20-10z" fill="#ffd166" />
            <path d="M322 92l5 14 15-5-9 13 10 13-16-4-7 15-2-16-16-3 15-8z" fill="#4fc3f7" />
            <circle cx="335" cy="216" r="7" fill="#ff7ab6" />
            <circle cx="78" cy="195" r="5" fill="#00e676" />
          </g>
        )}

        <g className="dodo-character" filter={`url(#${shadowId})`}>
          <ellipse cx="211" cy="353" rx="94" ry="19" fill="#020617" opacity="0.28" />
          <path className="dodo-tail" d="M276 215c34-11 59 0 69 25-31-7-50 4-68 22z" fill={`url(#${wingId})`} />
          <path className="dodo-tail" d="M281 244c37 2 56 20 57 48-26-17-48-14-72-3z" fill="#6f8fe3" opacity="0.86" />
          <ellipse cx="205" cy="229" rx="92" ry="112" fill={`url(#${bodyId})`} />
          <ellipse cx="193" cy="249" rx="55" ry="70" fill={`url(#${bellyId})`} />

          <g className="dodo-wing-left">
            <path d="M121 204c-46 17-58 62-32 101 41-18 58-51 55-94z" fill={`url(#${wingId})`} />
            <path d="M118 229c-18 17-25 35-19 54" fill="none" stroke="#b8ecff" strokeWidth="5" strokeLinecap="round" opacity="0.55" />
            <path d="M136 223c-16 18-21 40-12 60" fill="none" stroke="#b8ecff" strokeWidth="5" strokeLinecap="round" opacity="0.42" />
          </g>
          <g className="dodo-wing-right">
            <path d="M287 199c42 20 52 63 25 100-38-19-54-52-49-93z" fill={`url(#${wingId})`} />
            <path d="M285 225c16 17 21 34 14 53" fill="none" stroke="#b8ecff" strokeWidth="5" strokeLinecap="round" opacity="0.5" />
          </g>

          <circle cx="210" cy="132" r="70" fill={`url(#${bodyId})`} />
          <ellipse cx="188" cy="108" rx="31" ry="18" fill="#d7f6ff" opacity="0.35" />
          <g className="dodo-crest">
            <path d="M184 66c-14-31 13-45 25-16" fill="#91c9ea" />
            <path d="M209 60c-3-35 31-36 28-1" fill="#7da4d7" />
            <path d="M232 68c13-29 42-16 24 13" fill="#5f7fb6" />
          </g>

          {isCelebrating ? (
            <g>
              <path d="M153 126c15-13 32-13 46 0" fill="none" stroke="#19314b" strokeWidth="8" strokeLinecap="round" />
              <path d="M221 126c15-13 32-13 46 0" fill="none" stroke="#19314b" strokeWidth="8" strokeLinecap="round" />
            </g>
          ) : (
            <g className="dodo-eyes">
              <ellipse cx="176" cy="127" rx="21" ry="24" fill="#fff" />
              <ellipse cx="244" cy="127" rx="21" ry="24" fill="#fff" />
              <circle cx={isExcited ? "180" : "179"} cy="130" r="11" fill="#203653" />
              <circle cx={isExcited ? "248" : "241"} cy="130" r="11" fill="#203653" />
              <circle cx="175" cy="122" r="5" fill="#fff" />
              <circle cx="243" cy="122" r="5" fill="#fff" />
            </g>
          )}

          <ellipse cx="164" cy="157" rx="15" ry="8" fill="#ff9fb3" opacity="0.52" />
          <ellipse cx="256" cy="157" rx="15" ry="8" fill="#ff9fb3" opacity="0.52" />
          <path d="M182 151c20-20 56-20 76 0 12 12 3 34-14 34h-48c-17 0-26-22-14-34z" fill={`url(#${beakId})`} />
          <path d="M239 152c18 7 23 24 8 35" fill="none" stroke="#c45a2f" strokeWidth="5" strokeLinecap="round" opacity="0.55" />
          <path d="M195 150c14-10 32-10 48 0" fill="none" stroke="#fff2b8" strokeWidth="4" strokeLinecap="round" opacity="0.7" />

          <path d="M171 330l-14 39m0 0l-20 6m20-6l3 18m-3-18l22 5" fill="none" stroke="#ff9f43" strokeWidth="9" strokeLinecap="round" />
          <path d="M231 331l16 38m0 0l-18 8m18-8l4 18m-4-18l22 2" fill="none" stroke="#ff9f43" strokeWidth="9" strokeLinecap="round" />
        </g>

        <g className="dodo-sparkles">
          <path d="M101 138l5 13 14-4-9 11 9 11-14-4-5 13-4-13-14 4 9-11-9-11 14 4z" fill="#ffd166" />
          <path d="M302 152l4 10 11-3-7 9 7 9-11-3-4 10-3-10-11 3 7-9-7-9 11 3z" fill="#69d4ff" />
          {mood === "curious" && (
            <g>
              <circle cx="310" cy="82" r="25" fill="#fff7d6" />
              <text x="303" y="94" fontSize="38" fontFamily="Arial, sans-serif" fontWeight="800" fill="#4b2e83">?</text>
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}
