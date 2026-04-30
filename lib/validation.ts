import { z } from "zod";

export interface FormData {
  childName: string;
  age: string;
  partyDate: string;
  partyTime: string;
  location: string;
  parentContact: string;
  favoriteThing: string;
  funFact1: string;
  funFact2: string;
  funFact3: string;
  timezone: string;
}

export type FormErrors = Partial<Record<keyof FormData, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Phone must start with + followed by digits (spaces, dashes, parens allowed); at least 7 digits total enforced below
const PHONE_RE = /^\+[\d\s\-()]{6,}$/;

/** Helper: build a `z.string()` validator from an imperative checker. */
function fieldRule(check: (value: string) => string | undefined) {
  return z.string().superRefine((value, ctx) => {
    const message = check(value);
    if (message) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    }
  });
}

const childNameSchema = fieldRule((v) => {
  if (!v.trim()) return "Required";
  if (v.length > 30) return "Max 30 characters";
});

const ageSchema = fieldRule((v) => {
  if (!v.toString().trim()) return "Required";
  const n = Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return "Must be a whole number";
  if (n < 1 || n > 15) return "Must be between 1 and 15";
});

const partyDateSchema = fieldRule((v) => {
  if (!v.trim()) return "Required";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "Invalid date";
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  if (d < twoYearsAgo) return "Date is more than 2 years in the past";
});

const partyTimeSchema = fieldRule((v) => {
  if (!v.trim()) return "Required";
  if (!/^\d{2}:\d{2}$/.test(v)) return "Invalid time";
});

const locationSchema = fieldRule((v) => {
  if (!v.trim()) return "Required";
  if (v.length > 100) return "Max 100 characters";
});

const parentContactSchema = fieldRule((v) => {
  if (!v.trim()) return "Required";
  const c = v.trim();
  const isEmail = EMAIL_RE.test(c);
  const isPhone = PHONE_RE.test(c) && c.replace(/[^\d]/g, "").length >= 7;
  if (!isEmail && !isPhone) {
    return "Must be a valid email or phone with + country code (e.g. +971 50 123 4567)";
  }
});

const favoriteThingSchema = fieldRule((v) => {
  if (!v.trim()) return "Required";
  if (v.length > 50) return "Max 50 characters";
});

const funFactSchema = fieldRule((v) => {
  if (!v.trim()) return "Required";
  if (v.length > 150) return "Max 150 characters";
});

export const formSchema = z.object({
  childName: childNameSchema,
  age: ageSchema,
  partyDate: partyDateSchema,
  partyTime: partyTimeSchema,
  location: locationSchema,
  parentContact: parentContactSchema,
  favoriteThing: favoriteThingSchema,
  funFact1: funFactSchema,
  funFact2: funFactSchema,
  funFact3: funFactSchema,
  timezone: z.string(),
});

// Canonical field order — used to keep `FormErrors` insertion order stable so
// callers iterating with `Object.keys(errs)[0]` always see the topmost field
// first.
const FIELD_ORDER: ReadonlyArray<keyof FormData> = [
  "childName",
  "age",
  "partyDate",
  "partyTime",
  "location",
  "parentContact",
  "favoriteThing",
  "funFact1",
  "funFact2",
  "funFact3",
  "timezone",
];

export function validateForm(data: FormData): FormErrors {
  const result = formSchema.safeParse(data);
  if (result.success) return {};

  const messages = new Map<keyof FormData, string>();
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof FormData | undefined;
    if (key && !messages.has(key)) {
      messages.set(key, issue.message);
    }
  }

  const errors: FormErrors = {};
  for (const key of FIELD_ORDER) {
    const message = messages.get(key);
    if (message) errors[key] = message;
  }
  return errors;
}

export function hasErrors(errors: FormErrors): boolean {
  return Object.keys(errors).length > 0;
}
