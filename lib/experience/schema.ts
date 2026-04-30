import { z } from "zod";

// ---------------------------------------------------------------------------
// Theme tokens
// ---------------------------------------------------------------------------

export const ThemeColorsSchema = z.object({
  /** Deep-space background */
  void: z.string(),
  /** Primary accent — bright star white */
  star: z.string(),
  /** Muted text / labels */
  comet: z.string(),
  /** Highlight / CTA accent */
  nova: z.string(),
  /** Secondary accent (plasma blue) */
  plasma: z.string(),
  /** Gold / award colour */
  gold: z.string(),
  /** Success state */
  success: z.string(),
  /** Danger / error state */
  danger: z.string(),
});

export const ThemeFontsSchema = z.object({
  /** Display / heading font family (CSS value) */
  display: z.string(),
  /** Body font family (CSS value) */
  body: z.string(),
});

export const ThemeSchema = z.object({
  colors: ThemeColorsSchema,
  fonts: ThemeFontsSchema,
});

// ---------------------------------------------------------------------------
// Copy — all user-facing strings currently hardcoded in the portal
// ---------------------------------------------------------------------------

export const CopySchema = z.object({
  // Section 1 – Cosmic Portal Ignition
  ignitionHeading: z.string(),
  ignitionSubline: z.string(),

  // Section 2 – Captain Reveal
  captainRevealLabel: z.string(),
  /** Template: "Captain {{childName}}'s {{ageOrdinal}} Birthday Mission" (sr-only) */
  captainRevealSrOnly: z.string(),

  // Section 3 – Mission Briefing
  briefingEyebrow: z.string(),
  briefingHeading: z.string(),
  /** Template: "You are hereby invited to join Captain {{childName}}'s {{age}}th Birthday Mission." */
  briefingBody: z.string(),
  briefingDateLabel: z.string(),
  briefingTimeLabel: z.string(),
  briefingLocationLabel: z.string(),
  briefingThemeLabel: z.string(),

  // Section 4 – Countdown
  countdownHeading: z.string(),

  // Section 5 – RSVP
  rsvpHeading: z.string(),
  rsvpSubline: z.string(),

  // Section 6 – Cadet Challenge
  cadetChallengeHeading: z.string(),
  cadetChallengeSubline: z.string(),

  // Section 8 – Secret Star Log
  starLogEyebrow: z.string(),
  starLogHeading: z.string(),
  starLogSubline: z.string(),
  /** Template: "★ Mission Seal — Captain {{childName}}" */
  starLogSeal: z.string(),

  // Section 9 – Viral Loop Footer
  viralLoopBody: z.string(),
  viralLoopCta: z.string(),

  // Demo banner
  demoBannerText: z.string(),
  demoBannerCta: z.string(),

  // Demo bottom CTA
  demoCTAHeading: z.string(),
  /** Template: "Create My Portal — {{price}} →" */
  demoCTAButton: z.string(),
});

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

export const SectionTypeSchema = z.enum([
  "portalIgnition",
  "captainReveal",
  "missionBriefing",
  "countdown",
  "rsvp",
  "cadetChallenge",
  "spaceBadge",
  "starLog",
  "viralLoop",
  "demoCTA",
]);

export const SectionSchema = z.object({
  /** Stable identifier for this section instance */
  id: z.string().min(1),
  /** Which built-in section component to render */
  type: SectionTypeSchema,
  /** Arbitrary per-section configuration overrides */
  props: z.record(z.string(), z.unknown()).default({}),
});

// ---------------------------------------------------------------------------
// Quiz
// ---------------------------------------------------------------------------

export const QuizQuestionSchema = z.object({
  /** Stable identifier for this question */
  id: z.string().min(1),
  /** Question text — may contain {{childName}}, {{age}}, etc. */
  prompt: z.string().min(1),
  /**
   * Answer options.  The first element is always treated as the correct answer
   * in the static definition; runtime shuffling is the component's concern.
   */
  options: z.array(z.string().min(1)).min(2).max(6),
});

export const QuizSchema = z.object({
  questions: z.array(QuizQuestionSchema).min(1),
});

// ---------------------------------------------------------------------------
// Top-level Experience
// ---------------------------------------------------------------------------

export const ExperienceSchema = z.object({
  /** UUID or other unique identifier */
  id: z.string().min(1),
  /** URL-safe slug used in routing, e.g. "space-mission" */
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase-kebab-case"),
  /** Human-readable edition name, e.g. "Space Mission Edition" */
  name: z.string().min(1),
  theme: ThemeSchema,
  copy: CopySchema,
  /** Ordered list of sections that make up the portal page */
  sections: z.array(SectionSchema).min(1),
  quiz: QuizSchema,
});

// ---------------------------------------------------------------------------
// Inferred TypeScript types
// ---------------------------------------------------------------------------

export type ThemeColors = z.infer<typeof ThemeColorsSchema>;
export type ThemeFonts = z.infer<typeof ThemeFontsSchema>;
export type Theme = z.infer<typeof ThemeSchema>;
export type Copy = z.infer<typeof CopySchema>;
export type SectionType = z.infer<typeof SectionTypeSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type Quiz = z.infer<typeof QuizSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
