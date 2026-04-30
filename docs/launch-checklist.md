# Birthday Star Portal Launch Checklist

Use this checklist before turning on paid traffic.

## Product setup

1. Set `NEXT_PUBLIC_BASE_URL` in Vercel to your real domain.
2. Set `NEXT_PUBLIC_CHECKOUT_URL` in Vercel to your Payhip or Lemon Squeezy product URL.
3. Confirm the checkout product redirects to `https://yourdomain.com/success` after payment.
4. Confirm the product price in the payment platform matches the price shown on the landing page.
5. If using Payhip, configure an order bump for a deluxe printable add-on if you plan to upsell one.

## Pre-launch validation

1. Run `npm test`.
2. Run `npm run lint`.
3. Run `npm run build` with production env vars set.
4. Run `npm run smoke` against the production build.
5. Open the landing page on mobile and desktop and confirm the main CTA, demo, and form render correctly.

## Manual checkout checks

1. Complete one test order in Safari or Chrome.
2. Verify the recovery code appears before checkout.
3. Verify `/success` generates the portal link automatically after payment.
4. Copy the portal link and open it on a second device.
5. Simulate lost browser storage by opening `/success` in a separate browser and verify recovery-code restore still works.

## Go-live checks

1. Add the live site URL to your social bio, profile link, or ad destination.
2. Tail the optional `NEXT_PUBLIC_PING_URL` receiver if one is configured.
3. Keep the support inbox open for the first 10 orders.
4. Keep the lost-link and refund templates ready to paste.

## Stop-ship conditions

Do not send paid traffic yet if any of these fail:

1. `/success` cannot generate a portal link after a successful payment.
2. The recovery code does not restore the portal link.
3. The checkout product redirects anywhere other than `/success`.
4. The shareable `/pack?data=...` link does not open on a second device.