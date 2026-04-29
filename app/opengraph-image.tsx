import { ImageResponse } from "next/og";

// Route segment config — Edge runtime is required for ImageResponse.
export const runtime = "edge";

// Image metadata picked up by Next.js file conventions.
export const alt = "Birthday Star Portal — Space Mission Edition";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
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
          background: "linear-gradient(135deg, #050818 0%, #0a0e2e 100%)",
          color: "#e8eaf6",
          fontFamily: "Orbitron, sans-serif",
          padding: 80,
          position: "relative",
        }}
      >
        <div
          style={{
            fontSize: 84,
            fontWeight: 800,
            letterSpacing: 4,
            textAlign: "center",
            textShadow: "0 0 24px rgba(79, 195, 247, 0.7)",
          }}
        >
          Birthday Star Portal
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 40,
            color: "#7c4dff",
            letterSpacing: 6,
            textShadow: "0 0 16px rgba(124, 77, 255, 0.5)",
          }}
        >
          Space Mission Edition
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 48,
            left: 64,
            fontSize: 22,
            color: "#a8b4d4",
            letterSpacing: 4,
            textTransform: "lowercase",
          }}
        >
          wandering dodo
        </div>
      </div>
    ),
    { ...size }
  );
}
