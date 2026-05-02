import { ImageResponse } from "next/og";
import { config } from "@/lib/config";

// Route segment config — Edge runtime is required for ImageResponse.
export const runtime = "edge";

// Image metadata picked up by Next.js file conventions.
export const alt = "By Ismael";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const OG_TEXT = "By Ismael";

// Fetch a Google Font's binary at edge runtime so satori can render with it.
// Without this, custom font declarations silently fall back to built-ins
// sans-serif, because next/og does not download web fonts on its own.
async function loadGoogleFont(family: string, weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
      family
    )}:wght@${weight}&text=${encodeURIComponent(text)}`;
    const css = await (
      await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } })
    ).text();
    const match = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/);
    if (!match) return null;
    const res = await fetch(match[1]);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const playfair = await loadGoogleFont("Playfair Display", 700, OG_TEXT);
  const fonts = playfair
    ? [{ name: "Playfair Display", data: playfair, style: "normal" as const, weight: 700 as const }]
    : undefined;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#1a0a2e",
          color: "#f5c842",
          fontFamily: "\"Playfair Display\", Georgia, serif",
          padding: 80,
          position: "relative",
        }}
      >
        <div
          style={{
            fontSize: 112,
            fontWeight: 700,
            textAlign: "center",
            textShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
          }}
        >
          {config.BRAND_NAME}
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
