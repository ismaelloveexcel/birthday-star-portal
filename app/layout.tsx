import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { config } from "@/lib/config";

const orbitron = localFont({
  src: [
    { path: "./fonts/Orbitron-400.woff2", weight: "400" },
    { path: "./fonts/Orbitron-600.woff2", weight: "600" },
    { path: "./fonts/Orbitron-700.woff2", weight: "700" },
    { path: "./fonts/Orbitron-800.woff2", weight: "800" },
  ],
  variable: "--font-orbitron",
  display: "swap",
  preload: true,
});

const dmSans = localFont({
  src: [
    { path: "./fonts/DMSans-400.woff2", weight: "400" },
    { path: "./fonts/DMSans-500.woff2", weight: "500" },
    { path: "./fonts/DMSans-700.woff2", weight: "700" },
  ],
  variable: "--font-dm-sans",
  display: "swap",
  preload: false,
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
      <body>
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
