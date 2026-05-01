import { describe, expect, it } from "vitest";
import {
  buildPackOgImageUrl,
  getMissionCountdownLabel,
  getPackPreviewData,
} from "@/lib/experience/packPreview";
import { encodePortalData } from "@/lib/utils";

describe("pack preview helpers", () => {
  it("extracts personalized preview fields from encoded portal data", () => {
    const encoded = encodePortalData({
      childName: "Zara",
      age: "6",
      partyDate: "2026-06-15",
      favoriteThing: "rockets",
    });

    expect(getPackPreviewData(encoded)).toEqual({
      childName: "Zara",
      age: "6",
      partyDate: "2026-06-15",
      favoriteThing: "rockets",
    });
  });

  it("falls back when preview data is missing or malformed", () => {
    expect(getPackPreviewData("not-base64")).toEqual({
      childName: "Birthday Star",
      age: "",
      partyDate: "",
      favoriteThing: "birthday magic",
    });
  });

  it("builds an encoded social image URL", () => {
    const url = buildPackOgImageUrl("https://example.com", "abc+/=");

    expect(url).toBe("https://example.com/pack/og?data=abc%2B%2F%3D");
  });

  it("labels the mission countdown from the party date", () => {
    const now = new Date("2026-06-10T12:00:00.000Z");

    expect(getMissionCountdownLabel("2026-06-15", now)).toBe("Mission T-5 days");
    expect(getMissionCountdownLabel("2026-06-11", now)).toBe("Mission launches tomorrow");
    expect(getMissionCountdownLabel("2026-06-10", now)).toBe("Mission launches today");
    expect(getMissionCountdownLabel("2026-06-09", now)).toBe("Mission accomplished");
  });
});
