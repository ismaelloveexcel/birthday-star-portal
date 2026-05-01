import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { config } from "@/lib/config";
import { getMissionCountdownLabel, getPackPreviewData } from "@/lib/experience/packPreview";
import { formatDate } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const encoded = request.nextUrl.searchParams.get("data");
  const preview = getPackPreviewData(encoded);
  const countdown = getMissionCountdownLabel(preview.partyDate);
  const ageLine = preview.age ? `Turning ${preview.age}` : "Birthday Mission";
  const detailLine = [formatDate(preview.partyDate), preview.location].filter(Boolean).join(" · ");
  const nameFontSize = preview.childName.length > 24 ? 58 : preview.childName.length > 16 ? 74 : 98;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #050818 0%, #0a1238 48%, #261052 100%)",
          color: "#f7f9ff",
          fontFamily: "Arial, Helvetica, sans-serif",
          padding: 72,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              "radial-gradient(circle at 18% 24%, rgba(79, 195, 247, 0.32), transparent 24%), radial-gradient(circle at 82% 18%, rgba(255, 213, 79, 0.2), transparent 20%), radial-gradient(circle at 72% 82%, rgba(124, 77, 255, 0.34), transparent 28%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            display: "flex",
            right: -90,
            top: 70,
            width: 420,
            height: 420,
            borderRadius: 420,
            border: "24px solid rgba(79, 195, 247, 0.24)",
            boxShadow: "0 0 90px rgba(79, 195, 247, 0.35)",
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
          <div style={{ display: "flex", fontSize: 26, letterSpacing: 5, textTransform: "uppercase", color: "#a8b4d4" }}>
            {config.BRAND_NAME}
          </div>
          <div
            style={{
              display: "flex",
              padding: "12px 20px",
              borderRadius: 999,
              background: "rgba(255, 213, 79, 0.14)",
              border: "1px solid rgba(255, 213, 79, 0.48)",
              color: "#ffd54f",
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            {countdown}
          </div>
        </div>
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", fontSize: 32, color: "#4fc3f7", letterSpacing: 7, textTransform: "uppercase" }}>
            Mission Access Granted
          </div>
          <div
            style={{
              display: "flex",
              width: 860,
              fontSize: nameFontSize,
              lineHeight: 0.95,
              fontWeight: 900,
              letterSpacing: 2,
              textShadow: "0 0 34px rgba(79, 195, 247, 0.65)",
            }}
          >
            {`Captain ${preview.childName}`}
          </div>
          <div style={{ display: "flex", gap: 18, alignItems: "center", fontSize: 34, color: "#e8eaf6" }}>
            <span>{ageLine}</span>
            <span style={{ color: "#ffd54f" }}>•</span>
            <span>{preview.favoriteThing}</span>
          </div>
          {detailLine && (
            <div style={{ display: "flex", fontSize: 28, color: "#a8b4d4", maxWidth: 900 }}>
              {detailLine}
            </div>
          )}
        </div>
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 18, color: "#a8b4d4", fontSize: 24 }}>
          <div style={{ display: "flex", width: 72, height: 6, borderRadius: 999, background: "#4fc3f7" }} />
          <span>Open the portal. Read the briefing. Complete the Cadet Challenge.</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
