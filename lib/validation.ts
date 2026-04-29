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

export function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.childName.trim()) errors.childName = "Required";
  else if (data.childName.length > 30)
    errors.childName = "Max 30 characters";

  if (!data.age.toString().trim()) errors.age = "Required";
  else {
    const n = Number(data.age);
    if (!Number.isFinite(n) || !Number.isInteger(n))
      errors.age = "Must be a whole number";
    else if (n < 1 || n > 15) errors.age = "Must be between 1 and 15";
  }

  if (!data.partyDate.trim()) errors.partyDate = "Required";
  else {
    const d = new Date(data.partyDate);
    if (Number.isNaN(d.getTime())) errors.partyDate = "Invalid date";
    else {
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      if (d < twoYearsAgo)
        errors.partyDate = "Date is more than 2 years in the past";
    }
  }

  if (!data.partyTime.trim()) errors.partyTime = "Required";
  else if (!/^\d{2}:\d{2}$/.test(data.partyTime))
    errors.partyTime = "Invalid time";

  if (!data.location.trim()) errors.location = "Required";
  else if (data.location.length > 100)
    errors.location = "Max 100 characters";

  if (!data.parentContact.trim()) errors.parentContact = "Required";
  else {
    const c = data.parentContact.trim();
    const isEmail = EMAIL_RE.test(c);
    const isPhone = PHONE_RE.test(c) && c.replace(/[^\d]/g, "").length >= 7;
    if (!isEmail && !isPhone)
      errors.parentContact =
        "Must be a valid email or phone with + country code (e.g. +971 50 123 4567)";
  }

  if (!data.favoriteThing.trim()) errors.favoriteThing = "Required";
  else if (data.favoriteThing.length > 50)
    errors.favoriteThing = "Max 50 characters";

  for (const key of ["funFact1", "funFact2", "funFact3"] as const) {
    const v = data[key];
    if (!v.trim()) errors[key] = "Required";
    else if (v.length > 150) errors[key] = "Max 150 characters";
  }

  return errors;
}

export function hasErrors(errors: FormErrors): boolean {
  return Object.keys(errors).length > 0;
}
