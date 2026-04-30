import { describe, expect, it } from "vitest";
import { interpolate } from "@/lib/experience/interpolate";

describe("interpolate", () => {
  it("replaces moustache-style tokens from the provided map", () => {
    expect(
      interpolate("Captain {{childName}} is turning {{age}}", {
        childName: "Zara",
        age: "6",
      })
    ).toBe("Captain Zara is turning 6");
  });

  it("trims token whitespace inside moustache braces", () => {
    expect(interpolate("{{ childName }}", { childName: "Alex" })).toBe("Alex");
  });

  it("replaces missing tokens with an empty string", () => {
    expect(interpolate("Captain {{childName}}", {})).toBe("Captain ");
  });
});