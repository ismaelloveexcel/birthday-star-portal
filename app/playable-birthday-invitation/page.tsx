import type { Metadata } from "next";
import SeoLandingPage from "@/components/SeoLandingPage";
import { config } from "@/lib/config";

export const metadata: Metadata = {
  title: `Playable Birthday Invitation | ${config.PRODUCT_NAME}`,
  description:
    "Create a playable birthday invite with a hero reveal, countdown, RSVP, quiz, badge, and one shareable guest link.",
  alternates: {
    canonical: `${config.BASE_URL.replace(/\/$/, "")}/playable-birthday-invitation`,
  },
};

export default function PlayableBirthdayInvitationPage() {
  return (
    <SeoLandingPage
      eyebrow="Playable birthday invitation"
      title="A playable birthday invite where your child becomes the hero."
      intro="Birthday Star Portal turns a party invite into a mini mission guests can open on their phone: hero reveal, countdown, RSVP, quiz, badge, and one shareable link."
      searchIntent="For parents who want more than a flat image invite."
      currentPath="/playable-birthday-invitation"
      proofPoints={[
        "Guests get something to open, tap, and remember before party day.",
        "Parents still keep the setup simple: one form, one checkout, one link.",
        "The portal is built for mobile sharing, so it fits everyday family and parent-group planning.",
      ]}
    />
  );
}
