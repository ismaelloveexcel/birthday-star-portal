import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { config } from "@/lib/config";

const orbitron = localFont({
  src: [
    { path: "../public/fonts/orbitron-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/orbitron-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/orbitron-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "../public/fonts/orbitron-latin-800-normal.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-orbitron",
  display: "swap",
});

const dmSans = localFont({
  src: [
    { path: "../public/fonts/dm-sans-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/dm-sans-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/dm-sans-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(config.BASE_URL),
  title: `${config.PRODUCT_NAME} — ${config.PRODUCT_EDITION}`,
  description:
    "Your child becomes the hero. Their guests become the crew. One link does it all.",
  alternates: {
    canonical: config.BASE_URL,
  },
  openGraph: {
    title: `${config.PRODUCT_NAME} — ${config.PRODUCT_EDITION}`,
    description:
      "Your child becomes the hero. Their guests become the crew. One link does it all.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${orbitron.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
