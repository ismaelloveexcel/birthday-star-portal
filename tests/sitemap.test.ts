import { describe, expect, it } from "vitest";
import sitemap, { seoRoutes } from "@/app/sitemap";
import { config } from "@/lib/config";

describe("sitemap", () => {
  it("includes the static SEO growth routes", () => {
    const urls = sitemap().map((entry) => entry.url);
    const base = config.BASE_URL.replace(/\/$/, "");

    for (const route of seoRoutes) {
      expect(urls).toContain(`${base}${route}`);
    }
  });
});