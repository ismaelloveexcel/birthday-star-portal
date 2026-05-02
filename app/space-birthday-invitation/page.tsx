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
      eyebrow="Digital birthday invitation"
      title="Turn a birthday party into a playable digital invitation."
      intro="By Ismael creates a premium birthday invite where guests open a reveal, countdown, RSVP action, quiz, and celebration badge in one link."
      searchIntent="For families that want a premium birthday invite guests will actually open."
      currentPath="/space-birthday-invitation"
      proofPoints={[
        "The experience is already structured, so parents do not need to design from scratch.",
        "The storytelling supports real party details instead of hiding them.",
        "The shareable badge and caption help the invite travel beyond the first parent group.",
      ]}
    />
  );
}
