"use client";

import { detectContactType, sanitizePhoneForWhatsApp } from "@/lib/utils";

interface RSVPActionProps {
  parentContact: string;
  childName: string;
}

export default function RSVPAction({ parentContact, childName }: RSVPActionProps) {
  const type = detectContactType(parentContact);
  const message = `Hi! We confirm that we are joining Captain ${childName}'s birthday mission! 🚀`;

  const waNumber = sanitizePhoneForWhatsApp(parentContact);
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
  const mailtoUrl = `mailto:${parentContact}?subject=${encodeURIComponent(
    `RSVP: Captain ${childName}'s Birthday Mission`
  )}&body=${encodeURIComponent(message)}`;

  // Only show WhatsApp button if we have a usable phone number (7+ digits)
  const showWhatsApp = (type === "whatsapp" || type === "both") && waNumber.length >= 7;
  // Always show email if WhatsApp is unavailable or contact is email-only
  const showEmail = type === "email" || type === "both" || !showWhatsApp;

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
