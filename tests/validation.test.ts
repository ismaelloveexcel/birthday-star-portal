import { describe, it, expect } from "vitest";
import { validateForm, hasErrors, type FormData } from "@/lib/validation";

function validForm(): FormData {
  return {
    childName: "Ayaan",
    age: "6",
    partyDate: "2099-06-15",
    partyTime: "15:00",
    location: "Star Base HQ",
    parentContact: "parent@example.com",
    favoriteThing: "rockets",
    funFact1: "once stayed awake all night",
    funFact2: "can name every planet",
    funFact3: "thinks they invented dancing",
    timezone: "Asia/Dubai",
  };
}

describe("validateForm — happy path", () => {
  it("returns no errors for a fully valid form", () => {
    expect(validateForm(validForm())).toEqual({});
    expect(hasErrors(validateForm(validForm()))).toBe(false);
  });

  it("accepts a + country-code phone in parentContact", () => {
    const f = validForm();
    f.parentContact = "+971 50 123 4567";
    expect(validateForm(f)).toEqual({});
  });
});

describe("validateForm — childName", () => {
  it("rejects empty childName", () => {
    const f = validForm();
    f.childName = "";
    expect(validateForm(f).childName).toBe("Required");
  });
  it("rejects childName longer than 30 characters", () => {
    const f = validForm();
    f.childName = "a".repeat(31);
    expect(validateForm(f).childName).toBe("Max 30 characters");
  });
});

describe("validateForm — age", () => {
  it("rejects empty age", () => {
    const f = validForm();
    f.age = "";
    expect(validateForm(f).age).toBe("Required");
  });
  it("rejects non-integer age", () => {
    const f = validForm();
    f.age = "5.5";
    expect(validateForm(f).age).toBe("Must be a whole number");
  });
  it("rejects ages below 1 or above 15", () => {
    const f = validForm();
    f.age = "0";
    expect(validateForm(f).age).toBe("Must be between 1 and 15");
    f.age = "16";
    expect(validateForm(f).age).toBe("Must be between 1 and 15");
  });
});

describe("validateForm — partyDate", () => {
  it("rejects empty partyDate", () => {
    const f = validForm();
    f.partyDate = "";
    expect(validateForm(f).partyDate).toBe("Required");
  });
  it("rejects unparseable partyDate", () => {
    const f = validForm();
    f.partyDate = "not-a-date";
    expect(validateForm(f).partyDate).toBe("Invalid date");
  });
  it("rejects dates more than 2 years in the past", () => {
    const f = validForm();
    f.partyDate = "1990-01-01";
    expect(validateForm(f).partyDate).toBe("Date is more than 2 years in the past");
  });
});

describe("validateForm — partyTime", () => {
  it("rejects empty partyTime", () => {
    const f = validForm();
    f.partyTime = "";
    expect(validateForm(f).partyTime).toBe("Required");
  });
  it("rejects malformed partyTime", () => {
    const f = validForm();
    f.partyTime = "3pm";
    expect(validateForm(f).partyTime).toBe("Invalid time");
  });
});

describe("validateForm — location", () => {
  it("rejects empty location", () => {
    const f = validForm();
    f.location = "";
    expect(validateForm(f).location).toBe("Required");
  });
  it("rejects location longer than 100 characters", () => {
    const f = validForm();
    f.location = "x".repeat(101);
    expect(validateForm(f).location).toBe("Max 100 characters");
  });
});

describe("validateForm — parentContact (+ phone rule from Phase 0)", () => {
  it("rejects empty contact", () => {
    const f = validForm();
    f.parentContact = "";
    expect(validateForm(f).parentContact).toBe("Required");
  });
  it("rejects free text", () => {
    const f = validForm();
    f.parentContact = "call me later";
    expect(validateForm(f).parentContact).toMatch(/valid email or phone/);
  });
  it("rejects a phone without a leading +", () => {
    const f = validForm();
    f.parentContact = "971501234567";
    expect(validateForm(f).parentContact).toMatch(/valid email or phone/);
  });
  it("rejects a + phone with fewer than 7 digits", () => {
    const f = validForm();
    f.parentContact = "+12345";
    expect(validateForm(f).parentContact).toMatch(/valid email or phone/);
  });
  it("accepts a + phone with formatting", () => {
    const f = validForm();
    f.parentContact = "+44 (20) 7946-0123";
    expect(validateForm(f).parentContact).toBeUndefined();
  });
});

describe("validateForm — favoriteThing and funFacts", () => {
  it("rejects empty favoriteThing", () => {
    const f = validForm();
    f.favoriteThing = "";
    expect(validateForm(f).favoriteThing).toBe("Required");
  });
  it("rejects favoriteThing longer than 50 characters", () => {
    const f = validForm();
    f.favoriteThing = "x".repeat(51);
    expect(validateForm(f).favoriteThing).toBe("Max 50 characters");
  });
  it("rejects empty funFacts", () => {
    const f = validForm();
    f.funFact1 = "";
    f.funFact2 = "";
    f.funFact3 = "";
    const errors = validateForm(f);
    expect(errors.funFact1).toBe("Required");
    expect(errors.funFact2).toBe("Required");
    expect(errors.funFact3).toBe("Required");
  });
  it("rejects funFacts longer than 150 characters", () => {
    const f = validForm();
    f.funFact1 = "x".repeat(151);
    expect(validateForm(f).funFact1).toBe("Max 150 characters");
  });
});

describe("hasErrors", () => {
  it("returns false for an empty errors object", () => {
    expect(hasErrors({})).toBe(false);
  });
  it("returns true when at least one error is present", () => {
    expect(hasErrors({ childName: "Required" })).toBe(true);
  });
});
