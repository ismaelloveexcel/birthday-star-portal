import type { Metadata } from "next";
import { Orbitron, DM_Sans } from "next/font/google";
import "./globals.css";
import { config } from "@/lib/config";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-orbitron",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(config.BASE_URL),
  title: `${config.PRODUCT_NAME} — ${config.PRODUCT_EDITION}`,
  description:
    "Your child becomes the hero. Their guests become the crew. One link does it all.",
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
