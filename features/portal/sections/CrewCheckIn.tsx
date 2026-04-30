import RSVPAction from "@/components/RSVPAction";

interface CrewCheckInProps {
  parentContact: string;
  childName: string;
}

export default function CrewCheckIn({ parentContact, childName }: CrewCheckInProps) {
  return (
    <section className="section text-center" aria-labelledby="rsvp-heading">
      <h3 id="rsvp-heading" className="font-display text-2xl md:text-3xl text-glow mb-2">
        FORCEFIELD CREW CHECK-IN
      </h3>
      <p className="text-comet mb-6">Confirm your mission attendance</p>
      <RSVPAction parentContact={parentContact} childName={childName} />
    </section>
  );
}
