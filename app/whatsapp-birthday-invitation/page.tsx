import type { Metadata } from "next";
import SeoLandingPage from "@/components/SeoLandingPage";
import { config } from "@/lib/config";

export const metadata: Metadata = {
  title: `WhatsApp Birthday Invitation | ${config.PRODUCT_NAME}`,
  description:
    "A mobile-first birthday invitation link made for WhatsApp sharing, with a hero reveal, countdown, RSVP, quiz, and badge.",
  alternates: {
    canonical: `${config.BASE_URL.replace(/\/$/, "")}/whatsapp-birthday-invitation`,
  },
};

export default function WhatsAppBirthdayInvitationPage() {
  return (
    <SeoLandingPage
      eyebrow="WhatsApp birthday invitation"
      title="A birthday invite link made for family chats and parent groups."
      intro="Birthday Star Portal gives parents one polished link to share on WhatsApp, SMS, email, or any guest chat, with a playable mission behind the preview."
      searchIntent="For busy parents sharing party details across countries, schools, and family groups."
      proofPoints={[
        "The guest link opens on mobile without an account or app install.",
        "Parents can copy a short guest message or share directly to WhatsApp.",
        "The invite still includes the practical pieces: date, time, location, RSVP, and a countdown.",
      ]}
    />
  );
}
