import type { Metadata } from "next";
import SeoLandingPage from "@/components/SeoLandingPage";
import { config } from "@/lib/config";

export const metadata: Metadata = {
  title: `Space Birthday Invitation | ${config.PRODUCT_NAME}`,
  description:
    "Create a Space Mission birthday invitation where your child becomes Captain and guests open a countdown, RSVP, quiz, and badge.",
  alternates: {
    canonical: `${config.BASE_URL.replace(/\/$/, "")}/space-birthday-invitation`,
  },
};

export default function SpaceBirthdayInvitationPage() {
  return (
    <SeoLandingPage
      eyebrow="Space birthday invitation"
      title="Turn a space birthday party into a playable mission invite."
      intro="The Space Mission Edition makes the birthday child Captain, then gives guests a mission briefing, countdown, RSVP action, Cadet Challenge quiz, and Space Badge."
      searchIntent="For space-themed parties that need an invite guests will actually open."
      currentPath="/space-birthday-invitation"
      proofPoints={[
        "The theme is already built into the portal, so parents do not need to design from scratch.",
        "The mission story supports the real party details instead of hiding them.",
        "The badge and guest share caption help the invite travel beyond the first parent group.",
      ]}
    />
  );
}
