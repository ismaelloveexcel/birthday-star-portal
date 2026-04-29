import type { MetadataRoute } from "next";
import { config } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = config.BASE_URL.replace(/\/$/, "");
  return [
    {
      url: `${base}/`,
      priority: 1.0,
    },
    {
      url: `${base}/success`,
      priority: 0.3,
    },
    {
      url: `${base}/pack`,
      priority: 0.3,
    },
  ];
}
