"use client";

import { config } from "@/lib/config";
import { detectContactType, sanitizePhoneForWhatsApp } from "@/lib/utils";

interface RSVPActionProps {
  parentContact: string;
  childName: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RSVPAction({ parentContact, childName }: RSVPActionProps) {
  const type = detectContactType(parentContact);
  const message = `Hi! We confirm that we are joining Captain ${childName}'s birthday mission! 🚀`;

  const waNumber = sanitizePhoneForWhatsApp(parentContact);
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;

  // Only use parentContact as the mailto recipient when it is a valid email;
  // otherwise fall back to the configured support address so we never produce
  // an invalid mailto link or allow `?`/`&` injection from untrusted contact data.
  const trimmedContact = (parentContact || "").trim();
  const isValidEmail = EMAIL_REGEX.test(trimmedContact);
  const mailRecipient = isValidEmail ? trimmedContact : config.SUPPORT_EMAIL;
  const mailtoUrl = `mailto:${encodeURIComponent(mailRecipient)}?subject=${encodeURIComponent(
    `RSVP: Captain ${childName}'s Birthday Mission`
  )}&body=${encodeURIComponent(message)}`;

  const showWhatsApp = (type === "whatsapp" || type === "both") && waNumber.length >= 7;
  const showEmail = type === "email" || (!showWhatsApp); // fallback to email

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch">
      {showWhatsApp && (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          ✅ Confirm via WhatsApp
        </a>
      )}
      {showEmail && (
        <a href={mailtoUrl} className="btn-secondary">
          ✅ Confirm via Email
        </a>
      )}
    </div>
  );
}
