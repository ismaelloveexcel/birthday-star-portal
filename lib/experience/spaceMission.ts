import rawExperience from "@/content/experiences/space-mission.json";
import { experienceSchema } from "@/lib/schemas/experience";

export const spaceMissionExperience = experienceSchema.parse(rawExperience);