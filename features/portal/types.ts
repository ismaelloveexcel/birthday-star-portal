export interface BirthdayPortalProps {
  childName: string;
  age: string;
  partyDate: string;
  partyTime: string;
  location: string;
  parentContact: string;
  favoriteThing: string;
  funFacts: [string, string, string];
  timezone?: string;
  isDemo?: boolean;
}
