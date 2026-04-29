import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#4fc3f7",
          color: "#050818",
          fontFamily: "Orbitron, sans-serif",
          fontWeight: 800,
          fontSize: 22,
        }}
      >
        B
      </div>
    ),
    { ...size }
  );
}
