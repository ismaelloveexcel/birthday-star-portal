import { z } from "zod";

const paletteSchema = z.object({
  void: z.string().min(1),
  nova: z.string().min(1),
  plasma: z.string().min(1),
  gold: z.string().min(1),
  comet: z.string().min(1),
  star: z.string().min(1),
  success: z.string().min(1),
  danger: z.string().min(1),
});

const sectionTypeSchema = z.enum([
  "demoBanner",
  "portalIgnition",
  "captainReveal",
  "choice",
  "missionBriefing",
  "countdown",
  "rsvp",
  "quiz",
  "badge",
  "starLog",
  "viralLoop",
  "demoCta",
]);

const sectionPropValueSchema = z.union([z.string(), z.number(), z.boolean()]);

const quizQuestionSchema = z.object({
  id: z.string().min(1),
  promptTemplate: z.string().min(1),
  correctAnswerTemplate: z.string().min(1),
  wrongAnswers: z.array(z.string().min(1)).length(2),
  legacyBehavior: z
    .object({
      wrongAnswersByFavoriteThing: z.record(z.string(), z.array(z.string().min(1)).length(2)),
    })
    .optional(),
});

export const experienceSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  flow: z.array(z.string().min(1)).min(1),
  theme: z.object({
    editionName: z.string().min(1),
    roleName: z.string().min(1),
    palette: paletteSchema,
    fonts: z
      .object({
        display: z.string().min(1),
        body: z.string().min(1),
      })
      .optional(),
  }),
  sections: z.array(
    z.object({
      id: z.string().min(1),
      type: sectionTypeSchema,
      props: z.record(z.string(), sectionPropValueSchema).default({}),
    })
  ),
  copy: z.object({
    demoBanner: z.object({
      labelTemplate: z.string().min(1),
      ctaLabel: z.string().min(1),
    }),
    portalIgnition: z.object({
      heading: z.string().min(1),
      subheading: z.string().min(1),
    }),
    captainReveal: z.object({
      eyebrow: z.string().min(1),
      screenReaderTitleTemplate: z.string().min(1),
      titleTemplate: z.string().min(1),
      subtitleTemplate: z.string().min(1),
      description: z.string().min(1),
    }),
    missionBriefing: z.object({
      eyebrow: z.string().min(1),
      heading: z.string().min(1),
      invitationTemplate: z.string().min(1),
      labels: z.object({
        missionDate: z.string().min(1),
        launchTime: z.string().min(1),
        missionBase: z.string().min(1),
        missionTheme: z.string().min(1),
      }),
    }),
    countdown: z.object({
      heading: z.string().min(1),
      timezoneTemplate: z.string().min(1),
    }),
    rsvp: z.object({
      heading: z.string().min(1),
      description: z.string().min(1),
      whatsappCta: z.string().min(1),
      emailCta: z.string().min(1),
      messageTemplate: z.string().min(1),
      emailSubjectTemplate: z.string().min(1),
    }),
    starLog: z.object({
      eyebrow: z.string().min(1),
      heading: z.string().min(1),
      description: z.string().min(1),
      quoteTemplate: z.string().min(1),
      sealTemplate: z.string().min(1),
    }),
    viralLoop: z.object({
      prompt: z.string().min(1),
      ctaLabel: z.string().min(1),
      brandFooter: z.string().min(1),
    }),
    demoCta: z.object({
      heading: z.string().min(1),
      ctaLabelTemplate: z.string().min(1),
    }),
  }),
  quiz: z.object({
    heading: z.string().min(1),
    description: z.string().min(1),
    questionLabelTemplate: z.string().min(1),
    submitLabel: z.string().min(1),
    incompleteLabel: z.string().min(1),
    questions: z.array(quizQuestionSchema).min(1),
  }),
  badge: z.object({
    eyebrow: z.string().min(1),
    heading: z.string().min(1),
    earnedTemplate: z.string().min(1),
    missionLineTemplate: z.string().min(1),
    shareLabel: z.string().min(1),
    copyLabel: z.string().min(1),
    copiedLabel: z.string().min(1),
    shareCaptionTemplate: z.string().min(1),
    ranks: z
      .array(
        z.object({
          minScore: z.number().int().nonnegative(),
          title: z.string().min(1),
          line: z.string().min(1),
        })
      )
      .min(1),
  }),
});

export type Experience = z.infer<typeof experienceSchema>;
export type ExperienceSectionType = z.infer<typeof sectionTypeSchema>;
export type ExperienceQuizQuestion = z.infer<typeof quizQuestionSchema>;