const _rawBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;
const _rawCheckoutUrl = process.env.NEXT_PUBLIC_CHECKOUT_URL;
const _isProd = process.env.NODE_ENV === "production";
const PRODUCT_PRICE = "$9.99";

if (
  _isProd &&
  (!_rawBaseUrl || _rawBaseUrl === "http://localhost:3000")
) {
  console.warn(
    "[config] NEXT_PUBLIC_BASE_URL is not set (or still points to localhost) in a production build. " +
      "Set it in your Vercel environment variables to your real domain, e.g. https://yourdomain.com"
  );
}

if (_isProd && (!_rawCheckoutUrl || _rawCheckoutUrl === "#")) {
  console.warn(
    "[config] NEXT_PUBLIC_CHECKOUT_URL is not set in a production build. " +
      "Set it in your Vercel environment variables to your checkout URL."
  );
}

export const config = {
  PRODUCT_NAME: "By Ismael",
  PRODUCT_EDITION: "By Ismael",
  BRAND_NAME: "By Ismael",
  BRAND_TAGLINE: "Premium digital experiences for moments that matter.",
  PRICE: PRODUCT_PRICE,
  LAUNCH_BADGE: "Now open — all categories",
  SUPPORT_EMAIL: "hello@byismael.com",
  BASE_URL: _rawBaseUrl ?? "http://localhost:3000",
  CHECKOUT_URL: _rawCheckoutUrl ?? "#",
};

export const CHECKOUT_URLS = {
  INVITE_SINGLE: "https://byismael.lemonsqueezy.com/checkout/buy/invite-single",
  INVITE_5PACK: "https://byismael.lemonsqueezy.com/checkout/buy/invite-5pack",
  INVITE_UNLIMITED: "https://byismael.lemonsqueezy.com/checkout/buy/invite-unlimited",
  GIFT_STANDARD: "https://byismael.lemonsqueezy.com/checkout/buy/gift-standard",
  GIFT_PREMIUM: "https://byismael.lemonsqueezy.com/checkout/buy/gift-premium",
  GAME_MAIN: "https://byismael.lemonsqueezy.com/checkout/buy/game-main",
  GAME_JOIN: "https://byismael.lemonsqueezy.com/checkout/buy/game-join",
} as const;
