const _rawBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;
const _rawCheckoutUrl = process.env.NEXT_PUBLIC_CHECKOUT_URL;
const _isProd = process.env.NODE_ENV === "production";
const PRODUCT_PRICE = "$14";

if (
  _isProd &&
  (!_rawBaseUrl || _rawBaseUrl === "http://localhost:3000")
) {
  throw new Error(
    "[config] NEXT_PUBLIC_BASE_URL is not set (or still points to localhost) in a production build. " +
      "Set it in your Vercel environment variables to your real domain, e.g. https://yourdomain.com"
  );
}

if (_isProd && (!_rawCheckoutUrl || _rawCheckoutUrl === "#")) {
  throw new Error(
    "[config] NEXT_PUBLIC_CHECKOUT_URL is not set in a production build. " +
      "Set it in your Vercel environment variables to your Payhip product URL."
  );
}

export const config = {
  PRODUCT_NAME: "Birthday Star Portal",
  PRODUCT_EDITION: "Space Mission Edition",
  BRAND_NAME: "Wandering Dodo",
  BRAND_TAGLINE: "Premium digital birthday experiences.",
  PRICE: PRODUCT_PRICE,
  LAUNCH_BADGE: `Launch price — ${PRODUCT_PRICE}`,
  SUPPORT_EMAIL: "support@wanderingdodo.com",
  BASE_URL: _rawBaseUrl ?? "http://localhost:3000",
  CHECKOUT_URL: _rawCheckoutUrl ?? "#",
};
