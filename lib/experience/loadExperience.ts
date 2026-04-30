import princessQuest from "@/content/experiences/princess-quest.json";
import spaceMission from "@/content/experiences/space-mission.json";
import { experienceSchema, type Experience } from "@/lib/schemas/experience";

const experiences: Record<string, Experience> = {
  "space-mission": experienceSchema.parse(spaceMission),
  "princess-quest": experienceSchema.parse(princessQuest),
};

export function loadExperience(experienceId: string): Experience | null {
  return experiences[experienceId] ?? null;
}