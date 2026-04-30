import { describe, it, expect } from "vitest";
import { interpolate } from "@/lib/interpolate";

describe("interpolate", () => {
  it("replaces a single placeholder", () => {
    expect(interpolate("Hello {{name}}!", { name: "Zara" })).toBe("Hello Zara!");
  });

  it("replaces multiple placeholders", () => {
    expect(
      interpolate("Captain {{childName}}'s {{ageOrdinal}} Birthday Mission", {
        childName: "Zara",
        ageOrdinal: "6TH",
      })
    ).toBe("Captain Zara's 6TH Birthday Mission");
  });

  it("replaces the same placeholder more than once", () => {
    expect(interpolate("{{a}} and {{a}}", { a: "X" })).toBe("X and X");
  });

  it("leaves unknown placeholders unchanged", () => {
    expect(interpolate("Hello {{name}} from {{planet}}", { name: "Zara" })).toBe(
      "Hello Zara from {{planet}}"
    );
  });

  it("returns the template unchanged when vars is empty", () => {
    expect(interpolate("No placeholders here", {})).toBe("No placeholders here");
  });

  it("handles a template with no placeholders", () => {
    expect(interpolate("MISSION ACCESS GRANTED", { name: "Zara" })).toBe(
      "MISSION ACCESS GRANTED"
    );
  });

  it("handles an empty template", () => {
    expect(interpolate("", { name: "Zara" })).toBe("");
  });
});
