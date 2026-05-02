import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { config } from "@/lib/config";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
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
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body>
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
