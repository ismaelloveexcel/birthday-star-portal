export interface Section {
  type: string;
}

export interface Experience {
  id: string;
  sections: Section[];
  copy: Record<string, string>;
}

/** All runtime data passed to each section renderer. */
export interface SectionRenderProps {
  /** Resolves a copy key from the experience, interpolating {{vars}}. */
  t: (key: string, vars?: Record<string, string>) => string;
  childName: string;
  age: string;
  partyDate: string;
  partyTime: string;
  location: string;
  parentContact: string;
  favoriteThing: string;
  funFacts: [string, string, string];
  timezone: string;
  isDemo: boolean;
  score: number | null;
  onScore: (s: number) => void;
}
