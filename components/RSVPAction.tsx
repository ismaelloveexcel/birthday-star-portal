"use client";

import { config } from "@/lib/config";
import { interpolate } from "@/lib/experience/interpolate";
import type { Experience } from "@/lib/schemas/experience";
import { detectContactType, sanitizePhoneForWhatsApp } from "@/lib/utils";

interface RSVPActionProps {
  parentContact: string;
  childName: string;
  copy: Experience["copy"]["rsvp"];
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RSVPAction({ parentContact, childName, copy }: RSVPActionProps) {
  const type = detectContactType(parentContact);
  const message = interpolate(copy.messageTemplate, { childName });

  const waNumber = sanitizePhoneForWhatsApp(parentContact);
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;

  // Only use parentContact as the mailto recipient when it is a valid email;
  // otherwise fall back to the configured support address so we never produce
  // an invalid mailto link or allow `?`/`&` injection from untrusted contact data.
  const trimmedContact = (parentContact || "").trim();
  const isValidEmail = EMAIL_REGEX.test(trimmedContact);
  const mailRecipient = isValidEmail ? trimmedContact : config.SUPPORT_EMAIL;
  const mailtoUrl = `mailto:${encodeURIComponent(mailRecipient)}?subject=${encodeURIComponent(
    interpolate(copy.emailSubjectTemplate, { childName })
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
          {copy.whatsappCta}
        </a>
      )}
      {showEmail && (
        <a href={mailtoUrl} className="btn-secondary">
          {copy.emailCta}
        </a>
      )}
    </div>
  );
}
