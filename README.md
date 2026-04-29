# Birthday Star Portal — Space Mission Edition

## What it is

This is NOT a generic birthday invitation generator. It is a premium magical
playable birthday world for kids: **your child becomes the hero, their guests
become the crew, one link does it all.** Parents fill a single form, pay once
($14), and receive a magic shareable link that opens an interactive Space
Mission portal — Captain Reveal, mission countdown, RSVP action, and a
playable quiz with a Space Cadet certificate — for every guest. Built by
[Wandering Dodo](https://wanderingdodo.com).

## Quickstart

```bash
npm install
cp .env.local.example .env.local   # then fill in env vars (see below)
npm run dev
```

Open <http://localhost:3000>.

Useful scripts:

| Script           | Purpose                                  |
| ---------------- | ---------------------------------------- |
| `npm run dev`    | Local dev server                         |
| `npm run build`  | Production build                         |
| `npm run lint`   | ESLint (Next core-web-vitals)            |
| `npm test`       | Vitest pure-logic suite                  |

## Environment variables

| Variable                    | Required | Description                                                                                                          |
| --------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_CHECKOUT_URL`  | Yes      | Static product link (Payhip or Lemon Squeezy) the form redirects to on submit.                                       |
| `NEXT_PUBLIC_BASE_URL`      | Yes (in prod) | The deployed origin used to build the shareable `/pack?data=…` link. Use `http://localhost:3000` locally.       |
| `NEXT_PUBLIC_PING_URL`      | No       | Optional endpoint that returns 200 OK to a POST. Used for a no-PII conversion ping. Leave blank to disable.          |

### About `NEXT_PUBLIC_PING_URL`

When set, the app fires a `navigator.sendBeacon` POST containing exactly
`{ "event": "...", "ts": <unix-ms> }` for three events:

- `portal_form_submit` — right before redirecting to checkout
- `portal_link_generated` — when `/success` finishes building the magic link
- `portal_link_opened` — when `/pack` successfully decodes a shared link

**This never sends user data.** No party details, no contact info, no IDs.
If `NEXT_PUBLIC_PING_URL` is unset, no request is made.

## Project structure

```
birthday-star-portal/
├── app/
│   ├── page.tsx                # landing + live demo + form
│   ├── layout.tsx
│   ├── globals.css             # CSS variables, fonts, animations
│   ├── opengraph-image.tsx     # build-time OG image (next/og)
│   ├── icon.tsx                # 32×32 favicon (next/og)
│   ├── robots.ts
│   ├── sitemap.ts
│   ├── success/page.tsx        # post-payment "your link is ready" page
│   └── pack/
│       ├── page.tsx            # server component, generateMetadata
│       └── PackClient.tsx      # decodes URL data, renders portal
│
├── components/
│   ├── BirthdayPortal.tsx      # 9-section cinematic vertical scroll portal
│   ├── Countdown.tsx
│   ├── RSVPAction.tsx
│   ├── QuizGame.tsx
│   └── SpaceBadge.tsx
│
├── lib/
│   ├── config.ts
│   ├── utils.ts
│   └── validation.ts
│
├── tests/                      # Vitest pure-logic suite
│
├── docs/spec.md                # original product spec
├── .env.local.example
└── vercel.json
```

## Deploy to Vercel

- Push this repo to GitHub.
- Import the repo into Vercel (the included `vercel.json` configures the
  framework and build command).
- Add `NEXT_PUBLIC_BASE_URL` and `NEXT_PUBLIC_CHECKOUT_URL` (and optionally
  `NEXT_PUBLIC_PING_URL`) in Vercel project settings, then deploy.

## Payment platform setup

The app reads **one** static checkout URL from `NEXT_PUBLIC_CHECKOUT_URL`.
There is no API integration — the payment platform redirects the parent back
to `/success` after checkout, and `/success` reads the form data from
`localStorage` to build the portal link.

### Option A — Payhip

1. Create an account at [payhip.com](https://payhip.com).
2. Add a Product → Digital Download → "Birthday Star Portal" → $14.
3. Settings → set Thank You / Redirect URL to `https://yourdomain.com/success`.
4. Copy the product link → paste as `NEXT_PUBLIC_CHECKOUT_URL`.

### Option B — Lemon Squeezy (static link only)

1. Create a product in the Lemon Squeezy dashboard.
2. Set the price to $14.
3. Under Checkout Settings → set Redirect URL to `https://yourdomain.com/success`.
4. Copy the static product link → paste as `NEXT_PUBLIC_CHECKOUT_URL`.

## Known v1 limitations

These are intentional v1 trade-offs. They are documented and acceptable at
launch stage with low traffic.

1. Payment bypass is technically possible by navigating directly to
   `/success`. Acceptable at launch stage with zero traffic.
2. `localStorage` is cleared if parent uses a different browser or private
   browsing mode. Error state handles this gracefully.
3. Portal link contains all party data in base64 — visible to technical users
   who decode the URL. Data is party invite details only — this is intentional
   for v1.
4. No portal link recovery if parent loses the link. Manual support via email
   handles edge cases.
5. No detailed analytics. At most, the app can send optional no-PII
   conversion pings when `NEXT_PUBLIC_PING_URL` is configured.
6. `npm run build` requires outbound access to `fonts.googleapis.com` because
   `next/font/google` fetches Orbitron and DM Sans at compile time. This
   works on Vercel (where the build environment has unrestricted egress)
   but fails in offline or egress-restricted sandboxes. There is no
   first-class Next 15 config to persist the font cache between fresh
   builds. Workarounds (switching fonts, swapping in a font-loader
   library, or vendoring the .woff2 files) were intentionally rejected
   for v1 to keep the dependency surface small. Run the production build
   in an environment with network access to Google Fonts.

## Roadmap

- **Phase 2 (after first 10 paid sales):** replace localStorage + base64 URL
  with verified payment token flow.

## Phase 1 manual smoke test

- [ ] Form draft restores after refresh
- [ ] "Start over" clears draft
- [ ] OG image renders correctly when sharing the URL on WhatsApp
- [ ] Favicon appears in browser tab
- [ ] Tabbing through landing page shows visible focus outlines
- [ ] Quiz buttons announce selection to screen readers (test with VoiceOver/NVDA)
- [ ] /robots.txt and /sitemap.xml return 200
- [ ] CI workflow passes on the PR
- [ ] No console errors on /, /success, /pack

## Operations

This is the live ops runbook for whoever is on call after launch. Keep it
short, keep it current.

### Read conversion-rate logs

The app emits three no-PII events via `navigator.sendBeacon` to whatever
URL is set in `NEXT_PUBLIC_PING_URL`. The current ping endpoint is a
Cloudflare Worker that appends each `{ event, ts }` payload to a log
stream.

- Open the Cloudflare dashboard → **Workers & Pages** → select the ping
  worker → **Logs** tab → **Begin log stream** (or **Tail**).
- Filter by event name. Conversion rate is computed as:
  - `link_opened_rate = portal_link_opened / portal_link_generated`
  - `purchase_intent_rate = portal_link_generated / portal_form_submit`
- If the worker is replaced with a different endpoint, update the
  `NEXT_PUBLIC_PING_URL` env var in Vercel and redeploy. There is no
  database — historical numbers live only in the worker's log retention.

### Update the Payhip price

1. Sign in to [payhip.com](https://payhip.com) → **Products** → "Birthday
   Star Portal".
2. Edit the price field, save.
3. The app reads `NEXT_PUBLIC_CHECKOUT_URL` (a static product link), so no
   redeploy is required — Payhip serves the new price on the same URL.
4. If you change the product slug, update `NEXT_PUBLIC_CHECKOUT_URL` in
   Vercel project settings and redeploy.

### Roll back a bad deploy on Vercel

Open the Vercel dashboard → **Deployments** for the project → find the
last known-good deployment (typically the one immediately before the bad
one) → click the three-dot menu → **Promote to Production**. This
instantly aliases the production domain to the older build with no
rebuild, so recovery is roughly 30 seconds. Once the rollback is live,
revert the offending commit on `main` so the next deploy doesn't re-ship
the bug.

### Support inbox

Customer-facing recovery email: **support@wanderingdodo.com**. Until the
Phase 2 verified-token flow ships, this is the **only** recovery path
for parents who lose their magic link — there is no database lookup. Be
ready to manually rebuild a portal link from the parent's order details
on Payhip and email it back.
