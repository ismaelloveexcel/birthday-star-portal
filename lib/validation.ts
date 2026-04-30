import { z } from "zod";

export const formSchema = z
  .object({
    childName: z.string(),
    age: z.string(),
    partyDate: z.string(),
    partyTime: z.string(),
    location: z.string(),
    parentContact: z.string(),
    favoriteThing: z.string(),
    funFact1: z.string(),
    funFact2: z.string(),
    funFact3: z.string(),
    timezone: z.string(),
  })
  .superRefine((data, ctx) => {
    if (!data.childName.trim()) ctx.addIssue({ code: "custom", path: ["childName"], message: "Required" });
    else if (data.childName.length > 30) ctx.addIssue({ code: "custom", path: ["childName"], message: "Max 30 characters" });

    if (!data.age.trim()) ctx.addIssue({ code: "custom", path: ["age"], message: "Required" });
    else {
      const number = Number(data.age);
      if (!Number.isFinite(number) || !Number.isInteger(number)) {
        ctx.addIssue({ code: "custom", path: ["age"], message: "Must be a whole number" });
      } else if (number < 1 || number > 15) {
        ctx.addIssue({ code: "custom", path: ["age"], message: "Must be between 1 and 15" });
      }
    }

    if (!data.partyDate.trim()) ctx.addIssue({ code: "custom", path: ["partyDate"], message: "Required" });
    else {
      const date = new Date(data.partyDate);
      if (Number.isNaN(date.getTime())) {
        ctx.addIssue({ code: "custom", path: ["partyDate"], message: "Invalid date" });
      } else {
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        if (date < twoYearsAgo) {
          ctx.addIssue({ code: "custom", path: ["partyDate"], message: "Date is more than 2 years in the past" });
        }
      }
    }

    if (!data.partyTime.trim()) ctx.addIssue({ code: "custom", path: ["partyTime"], message: "Required" });
    else if (!/^\d{2}:\d{2}$/.test(data.partyTime)) {
      ctx.addIssue({ code: "custom", path: ["partyTime"], message: "Invalid time" });
    }

    if (!data.location.trim()) ctx.addIssue({ code: "custom", path: ["location"], message: "Required" });
    else if (data.location.length > 100) {
      ctx.addIssue({ code: "custom", path: ["location"], message: "Max 100 characters" });
    }

    if (!data.parentContact.trim()) ctx.addIssue({ code: "custom", path: ["parentContact"], message: "Required" });
    else {
      const contact = data.parentContact.trim();
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
      const isPhone = /^\+[\d\s\-()]{6,}$/.test(contact) && contact.replace(/[^\d]/g, "").length >= 7;
      if (!isEmail && !isPhone) {
        ctx.addIssue({
          code: "custom",
          path: ["parentContact"],
          message: "Must be a valid email or phone with + country code (e.g. +971 50 123 4567)",
        });
      }
    }

    if (!data.favoriteThing.trim()) ctx.addIssue({ code: "custom", path: ["favoriteThing"], message: "Required" });
    else if (data.favoriteThing.length > 50) {
      ctx.addIssue({ code: "custom", path: ["favoriteThing"], message: "Max 50 characters" });
    }

    for (const key of ["funFact1", "funFact2", "funFact3"] as const) {
      const value = data[key];
      if (!value.trim()) {
        ctx.addIssue({ code: "custom", path: [key], message: "Required" });
      } else if (value.length > 150) {
        ctx.addIssue({ code: "custom", path: [key], message: "Max 150 characters" });
      }
    }
  });

export type FormData = z.infer<typeof formSchema>;

export type FormErrors = Partial<Record<keyof FormData, string>>;

export const EMPTY_FORM_DATA: FormData = {
  childName: "",
  age: "",
  partyDate: "",
  partyTime: "",
  location: "",
  parentContact: "",
  favoriteThing: "",
  funFact1: "",
  funFact2: "",
  funFact3: "",
  timezone: "Asia/Dubai",
};

export function validateForm(data: FormData): FormErrors {
  const result = formSchema.safeParse(data);
  if (result.success) return {};

  const errors: FormErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof FormData | undefined;
    if (!key || errors[key]) continue;
    errors[key] = issue.message;
  }

  return errors;
}

export function hasErrors(errors: FormErrors): boolean {
  return Object.keys(errors).length > 0;
}
