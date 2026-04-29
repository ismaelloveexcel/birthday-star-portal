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
`{ "event": "...", "ts": <unix-ms> }` for two events:

- `portal_form_submit` — right before redirecting to checkout
- `portal_link_generated` — when `/success` finishes building the magic link

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
6. `npm run build` requires outbound network access to `fonts.googleapis.com`
   the first time it runs in a given environment. `app/layout.tsx` uses
   `next/font/google` (Orbitron + DM Sans), which Next 15 fetches at build
   time and caches inside `.next/cache`. Vercel and standard GitHub-hosted
   runners can reach Google Fonts so this is invisible in real CI and
   production. Restricted sandboxes that block egress to `fonts.googleapis.com`
   cannot run `next build` without first warming the `.next/cache` directory
   from an environment that does have network. Next 15 exposes no
   `next.config.js` switch to point `next/font/google` at preexisting font
   files, and switching fonts or adding a font-loading library is explicitly
   out of scope for v1. Revisit if a different host platform is adopted.

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
