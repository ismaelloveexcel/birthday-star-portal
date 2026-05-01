# Birthday Star Portal Launch Checklist

Use this checklist before turning on paid traffic.

## Product setup

1. Set `NEXT_PUBLIC_BASE_URL` in Vercel to your real domain.
2. Set `NEXT_PUBLIC_CHECKOUT_URL` in Vercel to your Payhip/external checkout product URL. Production builds fail if this is missing or `#`.
3. Confirm the checkout product redirects to `https://yourdomain.com/success` after payment.
4. Confirm the product price in the payment platform matches the price shown on the landing page.
5. Leave `NEXT_PUBLIC_PING_URL` blank unless you have an optional no-PII POST receiver ready.

## Pre-launch validation

1. Run `npm test`.
2. Run `npm run lint`.
3. Run `npm run build` with production env vars set.
4. Run `npm run smoke` against the production build.
5. Open the landing page on mobile and desktop and confirm the main CTA, demo, and form render correctly.
6. Confirm the repo does not require `TOKEN_SECRET`; v1 uses `/success` and `/pack?data=...`, not signed `/e/...` links.

## Manual checkout checks

1. Complete one test order in Safari or Chrome.
2. Verify the recovery code appears before checkout.
3. Verify `/success` generates the portal link automatically after payment.
4. Copy the portal link and open it on a second device.
5. Simulate lost browser storage by opening `/success` in a separate browser and verify recovery-code restore still works.
6. Confirm the recovered link opens as `/pack?data=...` on a second device.

## Go-live checks

1. Add the live site URL to your social bio, profile link, or ad destination.
2. Tail the optional `NEXT_PUBLIC_PING_URL` receiver if one is configured.
3. Keep the support inbox open for the first 10 orders.
4. Keep the lost-link and refund templates ready to paste.

## Before global promotion

1. Payhip checkout tested end-to-end, including redirect back to `/success`.
2. Multi-currency display checked in Payhip if enabled.
3. Refund and support templates ready.
4. Homepage checked on mobile with the live demo, form, and checkout CTA visible.
5. SEO pages reviewed: `/playable-birthday-invitation`, `/whatsapp-birthday-invitation`, and `/space-birthday-invitation`.
6. First 10 outreach contacts prepared before posting publicly.

## Known v1 risks to accept before launch

1. No database, authentication, payment API, webhook, order verification, or dashboard exists in v1.
2. A determined user can bypass payment because the active model is static checkout → `/success` → `/pack?data=...`.
3. Portal data is encoded into the share URL. Treat it as party invite information suitable for guests, not private account data.
4. Recovery is browser/recovery-code based. If the customer loses both the portal link and recovery code, support must rebuild manually.

## Stop-ship conditions

Do not send paid traffic yet if any of these fail:

1. `/success` cannot generate a portal link after a successful payment.
2. The recovery code does not restore the portal link.
3. The checkout product redirects anywhere other than `/success`.
4. The shareable `/pack?data=...` link does not open on a second device.
5. `npm test`, `npm run build`, or `npm run smoke` fails.