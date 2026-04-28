import type { Metadata } from "next";
import "./globals.css";
import { config } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(config.BASE_URL),
  title: `${config.PRODUCT_NAME} — ${config.PRODUCT_EDITION}`,
  description:
    "Your child becomes the hero. Their guests become the crew. One link does it all.",
  openGraph: {
    title: `${config.PRODUCT_NAME} — ${config.PRODUCT_EDITION}`,
    description:
      "Your child becomes the hero. Their guests become the crew. One link does it all.",
    images: ["/og-space.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;800&family=DM+Sans:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
