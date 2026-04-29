const _rawBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;
const _isProd = process.env.NODE_ENV === "production";

if (
  _isProd &&
  (!_rawBaseUrl || _rawBaseUrl === "http://localhost:3000")
) {
  throw new Error(
    "[config] NEXT_PUBLIC_BASE_URL is not set (or still points to localhost) in a production build. " +
      "Set it in your Vercel environment variables to your real domain, e.g. https://yourdomain.com"
  );
}

export const config = {
  PRODUCT_NAME: "Birthday Star Portal",
  PRODUCT_EDITION: "Space Mission Edition",
  BRAND_NAME: "Wandering Dodo",
  BRAND_TAGLINE: "Premium digital birthday experiences.",
  PRICE: "$14",
  LAUNCH_BADGE: "Early Access — $14",
  SUPPORT_EMAIL: "support@wanderingdodo.com",
  BASE_URL: _rawBaseUrl ?? "http://localhost:3000",
  CHECKOUT_URL: process.env.NEXT_PUBLIC_CHECKOUT_URL ?? "#",
};
