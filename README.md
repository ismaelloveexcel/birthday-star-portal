# Birthday Star Portal — Space Mission Edition

## What it is

This is NOT a generic birthday invitation generator. It is a premium magical
playable birthday world for kids: **your child becomes the hero, their guests
become the crew, one link does it all.** Parents fill a single form, pay once
through an external checkout, and receive a magic shareable link that opens an
interactive Space Mission portal — Captain Reveal, mission countdown, RSVP action, and a
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
| `npm run smoke`  | End-to-end smoke test (requires a build) |
| `npm run verify:env` | RSSE deployment env check (see `docs/rsse-production-readiness.md`) |
| `npm run verify:db` | RSSE Postgres schema read-only check (`DATABASE_URL` required) |
| `npm run smoke:rsse` | RSSE HTTP API flow smoke (dev server or `SMOKE_BASE_URL` to staging) |

## Environment variables

| Variable                    | Required | Description                                                                                                          |
| --------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_CHECKOUT_URL`  | Yes      | Static Payhip/external checkout link the form redirects to after the recovery code is shown. Production builds fail if this is missing or `#`. |
| `NEXT_PUBLIC_BASE_URL`      | Yes (in prod) | The deployed origin used to build the shareable `/pack?data=…` link. Use `http://localhost:3000` locally.       |
| `NEXT_PUBLIC_PING_URL`      | No       | Optional endpoint that returns 200 OK to a POST. Used for a no-PII conversion ping. Leave blank to disable.          |

### About `NEXT_PUBLIC_PING_URL`

When set, the app fires a best-effort `navigator.sendBeacon` POST containing exactly
`{ "event": "...", "ts": <unix-ms> }` for two events:

- `portal_form_submit` — right before redirecting to checkout
- `portal_link_generated` — when `/success` finishes building the magic link
- `portal_link_opened` — when a valid `/pack?data=...` portal is opened

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
│   ├── success/page.tsx        # post-payment "your link is ready" page + recovery restore
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
├── docs/global-growth-plan.md  # global promotion and monetisation playbook
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
There is no database, authentication, payment API, webhook, order verification,
or dashboard. The payment platform redirects the parent back to `/success`
after checkout, and `/success` reads the browser-stored form data to build the
shareable `/pack?data=...` portal link. The signed-token `/e/...` experiment
has been removed from the active v1 route surface, so `TOKEN_SECRET` is not
required.

### Solo-operator checklist

1. Set `NEXT_PUBLIC_CHECKOUT_URL` to your Payhip/external checkout product link.
2. Set the product redirect URL to `https://yourdomain.com/success`.
3. Tell customers to fill the form and pay in Safari or Chrome.
4. The app shows a recovery code before payment; customers should save it.
5. In the normal case, `/success` builds the portal link automatically after payment.
6. If checkout returns without the stored form data, the customer pastes the recovery code on `/success`.
7. If they lose both the portal link and the recovery code, handle it manually through support email.

### Payhip setup

1. Create an account at [payhip.com](https://payhip.com).
2. Add a Product → Digital Download → "Birthday Star Portal" → current launch price.
3. Settings → set Thank You / Redirect URL to `https://yourdomain.com/success`.
4. Copy the product link → paste as `NEXT_PUBLIC_CHECKOUT_URL`.

## Known v1 limitations

These are intentional v1 trade-offs. They are documented and acceptable at
launch stage with low traffic.

1. Payment bypass is technically possible because v1 uses a static external
   checkout and does not verify orders. Acceptable at launch stage; handle abuse
   manually until there is proof of demand.
2. `localStorage` can fail if the parent uses a different browser, an in-app
   browser, or private browsing mode. The checkout flow now recommends Safari
   or Chrome and shows a recovery code as a fallback.
3. Portal link contains all party data in base64 — visible to technical users
   who decode the URL. Data is party invite details only — this is intentional
   for v1.
4. Portal recovery is browser-based in v1. The recovery code handles the main
   checkout handoff failure, but manual support via email is still needed if the
   customer loses both the link and the recovery code.
5. No detailed analytics. At most, the app can send optional no-PII
   conversion pings when `NEXT_PUBLIC_PING_URL` is configured.
6. Fonts are served from files committed in `app/fonts/` via `next/font/local`.
   No outbound network access is required at build time.

## Roadmap

- **Later, after proof of demand:** consider a verified token flow. Do not add
   database/auth/payment API/webhooks until the static checkout model has sales.

## Smoke test

Run after every production build to verify the main routes and OG preview respond
correctly. Production builds require real-looking `NEXT_PUBLIC_BASE_URL` and
`NEXT_PUBLIC_CHECKOUT_URL` values because config guards prevent dead launch
settings.

```bash
npm run build && npm run smoke
```

`npm run smoke` boots `next start` on a random free port, GETs `/`,
`/success?_test=1`, `/pack?data=<fixture>`, and `/pack/og?data=<fixture>`.
It verifies that the HTML routes contain known strings and that the OG route
returns an image content type. It exits non-zero on any miss.

Checks performed automatically:

- `/` returns a page containing "Birthday Star Portal"
- `/success?_test=1` returns a page containing "PREPARING YOUR PORTAL"
- `/pack?data=<fixture>` returns a page containing "MISSION ACCESS GRANTED"
- `/pack/og?data=<fixture>` returns an `image/*` content type

## Operations

Live ops runbook for v1. Owner: Wandering Dodo. Customer-facing recovery
inbox: **support@wanderingdodo.com** (the only path until later verified
verified payment handling — anyone who loses their portal link must email this
address to be reissued one manually).

Related operator docs:

- `docs/launch-checklist.md` — go-live checklist for payment, redirect, recovery, and smoke validation.
- `docs/support-templates.md` — ready-to-paste replies for lost-link, checkout handoff, and refund requests.
- `docs/global-growth-plan.md` — Payhip global selling, order-bump ideas, outreach scripts, and manual metrics.
- `docs/launch-assets.md` — ready-to-use video scripts, hooks, DMs, community posts, and outreach copy.
- `docs/manual-metrics-template.md` — simple daily table for manual source, purchase, support, and refund tracking.

## Global growth / monetisation

The v1 monetisation model stays deliberately light: one static Payhip/external
checkout URL, optional Payhip-native order bump copy, and manual founder-led
outreach. There are no bundles, dashboards, affiliate codes, payment APIs, or
PDF generation in the app.

See `docs/global-growth-plan.md` for the 14-day global promotion plan,
multi-currency recommendation, venue/party-planner outreach, parent-community
templates, and manual metrics to track from Payhip plus optional no-PII pings.
Use `docs/launch-assets.md` for daily copy and `docs/manual-metrics-template.md`
to review traction without adding analytics infrastructure.

### Reading conversion-funnel pings (Cloudflare Worker)

The optional `NEXT_PUBLIC_PING_URL` endpoint receives `sendBeacon` POSTs of
the shape `{ "event": "...", "ts": <unix-ms> }` for three events:
`portal_form_submit`, `portal_link_generated`, `portal_link_opened`. The
production endpoint is a Cloudflare Worker that writes one log line per
request.

To compute conversion rate while tailing live traffic:

1. Open the Cloudflare dashboard → Workers & Pages → select the ping
   Worker → **Logs** → **Begin log stream** (or use `wrangler tail
   <worker-name> --format pretty` from a local checkout of the Worker repo
   to pull a live tail). Both surfaces are live streams — they show events
   as they happen and do not back-fill history.
2. Count occurrences of each `event` value across the tailing window. The
   funnel is `portal_form_submit` → `portal_link_generated` →
   `portal_link_opened`. `link_generated / form_submit` is the checkout
   completion rate; `link_opened / link_generated` is the share-and-open
   rate.
3. There is no per-user identifier in the payload, so these are aggregate
   counts only — that is intentional (see "Known v1 limitations").

For a historical window (e.g. the last 24 h) the live tail is not enough.
Either keep `wrangler tail` running and aggregate the captured output
locally, or — if the Worker has been configured to forward logs to
Workers Logpush / an R2 bucket / an external sink — query that sink
instead. v1 does not ship a built-in historical dashboard.

If the Worker is ever swapped for a different ping endpoint, update
`NEXT_PUBLIC_PING_URL` in the Vercel project settings; no code change is
required.

### Updating the Payhip price

Visible price copy is controlled in `lib/config.ts` as `config.PRICE`. To
change the live price:

1. Log into [payhip.com](https://payhip.com) → Products → "Birthday Star
   Portal" → Edit.
2. Update the price and save.
3. Update `PRICE` in `lib/config.ts` and ship that as a normal PR. The
   `NEXT_PUBLIC_CHECKOUT_URL` value does not need to change.

### Rolling back a bad Vercel deploy

If a deploy regresses production, open the Vercel dashboard → the
`birthday-star-portal` project → **Deployments**, find the last known-good
deployment (look for the green check and a recent timestamp before the
regression), open its menu, and choose **Promote to Production**. This is
an instant alias swap — no rebuild — and is the fastest recovery path.
Once production is stable, revert or fix the offending commit on `main` so
the next deploy is healthy.
