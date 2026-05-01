import type { MetadataRoute } from "next";
import { config } from "@/lib/config";

export const seoRoutes = [
  "/playable-birthday-invitation",
  "/whatsapp-birthday-invitation",
  "/space-birthday-invitation",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = config.BASE_URL.replace(/\/$/, "");
  return [
    {
      url: `${base}/`,
      priority: 1.0,
    },
    ...seoRoutes.map((route) => ({
      url: `${base}${route}`,
      priority: 0.7,
    })),
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
