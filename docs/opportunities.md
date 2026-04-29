# Birthday Star Portal — Opportunity Audit

A strategic audit of the v1 codebase, scoped to a one-person side-project for
a "wandering dodo" brand with zero ops budget. Recommendations are ranked
within each section (top of list = ship first). Every item is labelled with
**Effort** (S/M/L), **Risk**, and **Envelope** (`v1` = fits the spec's
"WHAT NOT TO BUILD" constraints; `Phase 2+` = breaks the envelope).

---

## 1. Reduce manual intervention

Today the founder still touches: support inbox triage (lost-link recovery is
the *only* documented support path — `README.md` Known Limitation #4),
manual smoke testing (`README.md` Phase 1 manual smoke test, 9 checkboxes),
copy/price/badge edits in `lib/config.ts`, refund replies, and any
conversion read-out from `NEXT_PUBLIC_PING_URL` (which today writes to
nothing).

1. **Self-serve lost-link recovery on `/success`.** What: detect the
   `?recover=1` query param on `/success/page.tsx`, render a 3-field form
   (child name + party date + email-or-phone used at checkout), recompute
   the same base64 payload from `localStorage` *or* the form, regenerate
   the link. Why: the README explicitly names this as the only inbound
   support category; one form kills it. Effort: S. Risk: low — pure client
   logic, no DB. Envelope: v1.
2. **Daily funnel digest from `NEXT_PUBLIC_PING_URL`.** Stand up a
   Cloudflare Worker (free tier) that accepts the existing `{event, ts}`
   POST, appends to Workers KV, and at 09:00 UAE time emails a 4-line
   digest via Resend. Today the ping endpoint is configured to "200 OK
   and discard"; the founder has no idea what converts. Effort: S.
   Envelope: v1 (the receiver is outside this repo).
3. **Templated refund + lost-link replies in `docs/support/`.** Three
   markdown templates kill the per-incident writing tax. Effort: S.
   Envelope: v1.
4. **One-command smoke test: `npm run smoke`.** A script that boots
   `next start` and curls `/`, `/success?_test=1`, and `/pack?data=<fixture>`,
   grepping each for a known string. Replaces 9 manual checkboxes in the
   README. Effort: M. Envelope: v1.
5. **Move copy out of `lib/config.ts` into `content/copy.json`.** Lets a
   non-coder VA edit price/badge/testimonials in the GitHub web UI.
   Effort: S. Envelope: v1.

## 2. Make the product more magical

The unlock moment is a 6-year-old opening the link. Everything below
compounds *that* moment without breaking the no-DB, no-AI, no-heavy-libs
rules in `docs/spec.md`.

1. **Per-child WhatsApp/iMessage preview card via `next/og`.** What:
   `app/pack/opengraph-image.tsx` (dynamic, reads the same base64 payload
   `generateMetadata` already decodes in `app/pack/page.tsx`) that
   composites "🚀 Captain {NAME} · Mission T-{N} days" over a star field.
   Why: today the `og:image` is the static landing card — every WhatsApp
   share looks identical and generic. A personalised preview is the single
   highest-CTR change available and uses Vercel's already-bundled
   `next/og`. Effort: S. Risk: low — `next/og` is already in use for
   `app/opengraph-image.tsx` and `app/icon.tsx`. Envelope: v1.
2. **Printable Mission Badge PDF, generated client-side in the browser.**
   What: a "Print my badge" button on `/pack` that uses `pdf-lib` to fill
   a pre-baked single-page A4 PDF template with the captain's name + age,
   then triggers a download. Why: the spec bans server-side PDF export
   and AI image gen; client-side `pdf-lib` violates neither (it ships ~250
   KB to the browser only when the button is clicked, via dynamic
   `import()`). Adds a fridge-door artefact that survives the party.
   Effort: M. Risk: medium — bundle weight; mitigated by lazy import.
   Envelope: v1.
3. **Personalised mission-control transmission — but as text-with-effects,
   not TTS.** What: on portal open, type out the captain's mission
   briefing one character at a time over a low-volume looping ambient
   `.ogg` (CC0, ~30 KB). Why: AI text/speech generation is banned by the
   spec; a CSS typewriter animation + one static audio file delivers 80%
   of the "transmission" feeling with 0% of the cost or compliance risk.
   Effort: S. Risk: low. Envelope: v1.
4. **Haptic tick on the countdown for mobile.** In `Countdown.tsx`, call
   `navigator.vibrate(8)` per tick when `prefers-reduced-motion: no-preference`
   and the document is visible. iOS ignores silently (acceptable). Effort:
   S. Envelope: v1.
5. **Hidden second mission via Konami code.** Keystroke listener on `/pack`
   for `↑↑↓↓←→←→ba` reveals a harder `QuizGame` and a "Galactic Captain"
   badge. Parents talk about it on Reddit. Effort: S. Envelope: v1.
6. **Honest perf budget.** Enforce a 200 KB JS budget on `/pack` via a CI
   check on `next build` route sizes. The target buyer is a parent on a
   £100 Android in a Dubai mall; every magical idea must survive that
   budget or get cut. Items 1–4 fit; item 2 only fits behind `import()`.
   Effort: S. Envelope: v1.

## 3. Out-of-the-box concepts

1. **Gifting layer.** What: a `?gift=1` flag on the form that swaps the
   "parentContact" field for "recipient parent's WhatsApp" plus a "from"
   line, and on `/success` shows two links: the portal link *and* a
   pre-composed WhatsApp message addressed to the recipient parent ("Hi,
   I bought you a Birthday Star Portal for [child]'s party — here's the
   link, full instructions inside."). Why: grandparents are the highest-
   AOV buyer in kids' goods and they currently bounce because the form
   asks for *their* contact. Minimum UX change is one checkbox. Effort:
   S. Risk: low. Envelope: v1.
2. **Post-party loop: the "Mission Recap" page.** What: 24h after
   `partyDate`, the portal auto-switches to a recap view ("Mission
   accomplished! Captain {NAME} is now 7. Same time next year?") with a
   single CTA to bookmark a calendar `.ics` for "12 months from today —
   start planning Captain {NAME}'s next mission." Why: birthdays repeat;
   the only churn-free SKU in this category is the *same buyer next
   year*. The `.ics` is generated client-side, no email capture needed,
   no DB. Effort: M. Risk: low. Envelope: v1.
3. **Viral coefficient lever inside the existing WhatsApp share.** What:
   append a footer line to the pre-composed `waText` in
   `app/success/page.tsx`: "Made with Birthday Star Portal —
   wanderingdodo.com". The current message ends at the URL. Why: every
   guest opening the link sees the brand twice (in the WhatsApp preview
   *and* in the share text), turning every paid customer into ~10–30
   impressions. Effort: trivial. Risk: low — keep it short to avoid
   feeling spammy. Envelope: v1.
4. **Three adjacent SKUs that reuse 80% of this codebase**, ranked by
   TAM × build-cost:
   - **First Day of School Portal** — same form, swap "captain" for
     "explorer", "mission" for "expedition". TAM: every K-3 parent,
     globally, every August/September. Build cost: a `theme` URL param
     and one alternate copy file. **Highest ROI of the three.**
   - **Tooth Fairy Letter Portal** — micro-SKU at $4, impulse buy, same
     base64-link mechanic, no countdown component, adds a one-shot
     "letter from the tooth fairy" page. TAM smaller but conversion
     higher (it's $4).
   - **Ramadan Mission Portal** (UAE/UK Muslim families, founder's
     geography) — 30-day countdown swapped in for the party countdown,
     daily good-deed quiz instead of a one-shot quiz. Seasonal but
     defensible — almost no Western competition in this niche.

   All three reuse `BirthdayPortal.tsx`, `Countdown.tsx`, and
   `QuizGame.tsx` with content swaps only. Envelope: v1 for the first
   two; the daily-quiz mechanic in #3 needs a tiny client-side date
   gating helper but no DB.

## 4. Inspiration repos & products

All verified to have a commit within the last 12 months via GitHub MCP
search on 2026-04-29.

1. [`vercel/satori`](https://github.com/vercel/satori) — already used
   transitively via `next/og`. The README's "Fonts" section is the exact
   reference for the `next/font/local` migration in §5.1.
2. [`kvnang/workers-og`](https://github.com/kvnang/workers-og) — Satori
   running on Cloudflare Workers. Steal: the worker template if the
   per-child OG card in §2.1 ever needs to move off Vercel's serverless
   limits.
3. [`benvinegar/counterscale`](https://github.com/benvinegar/counterscale)
   — self-hosted scalable analytics on Cloudflare Workers + Workers
   Analytics Engine. Steal: the "deploy a tracker in 5 minutes, $0/mo"
   pattern as the receiver for `NEXT_PUBLIC_PING_URL` (§1.2).
4. [`umami-software/umami`](https://github.com/umami-software/umami) —
   self-hosted privacy-first web analytics. Steal: the dashboard layout
   if the digest email in §1.2 ever grows into a UI. Heavier than
   Counterscale; only worth it past ~1k DAU.
5. [`plausible/plausible-tracker`](https://github.com/plausible/plausible-tracker)
   — 1 KB analytics tracker. Steal: the API ergonomics for a future
   replacement of `pingEvent()` in `lib/utils.ts`.
6. [`4lejandrito/next-plausible`](https://github.com/4lejandrito/next-plausible)
   — Plausible integration for Next.js with `<PlausibleProvider>` and
   custom event hooks. Steal: the proxy-rewrite pattern for first-party
   analytics that doesn't get adblocked.
7. [`onetimesecret/onetimesecret`](https://github.com/onetimesecret/onetimesecret)
   — the canonical "one link, no account, opens once" UX. Steal: the
   recipient-side reveal animation and the "this link expires when
   opened" copy patterns for §3.2's recap reveal.
8. [`diegomura/react-pdf`](https://github.com/diegomura/react-pdf) —
   declarative PDF generation in React (~600 KB minified, heavier than
   `pdf-lib`). Steal: layout primitives if §2.2's badge grows into a
   multi-page activity pack monetised separately (§6.3).
9. [`Hopding/pdf-lib`](https://github.com/Hopding/pdf-lib) — the
   recommended dependency for §2.2. Lightweight, tree-shakeable, runs in
   the browser without a worker.
10. [`catdad/canvas-confetti`](https://github.com/catdad/canvas-confetti)
    — 12.5k stars, one-file confetti. Steal: the `import('canvas-confetti')`
    dynamic-load pattern for the candle-blow-out moment on `/pack`
    without inflating the initial bundle.
11. [`chroline/lynk`](https://github.com/chroline/lynk) — open-source
    "link in bio" clone in Next.js. Steal: the no-account customisation
    flow as a reference for §3.1's gifting flow.
12. [`resend/resend-node`](https://github.com/resend/resend-node) —
    official Node SDK; free tier is 100 emails/day, plenty for §1.2 and
    §6.4.
13. [`burke-software/GlitchTip`](https://github.com/burke-software/GlitchTip)
    — Sentry-API-compatible error tracking, self-hostable on Fly.io free
    tier. Steal: the docker-compose.yml for §7's error tracking.

## 5. Process & developer-experience simplifications

1. **`next/font/local` with two committed `.woff2` files.** What: download
   `Orbitron-700.woff2` and `DMSans-Regular.woff2` (subset to Latin) into
   `public/fonts/`, replace `next/font/google` in `app/layout.tsx` with
   `next/font/local`. Why: this is the unblock for the "Phase 1.1: launch
   polish #6" Known Limitation in `README.md` — the sandboxed CI can't
   reach `fonts.googleapis.com`, and the runtime fetch is the documented
   risk. Two woff2 files (~30 KB each, subsetted) is the cheapest
   permanent fix. Effort: S (half-day). Risk: low. Envelope: v1.
2. **Kill `vercel.json`.** What: the file currently configures
   `framework: nextjs` and the build command — both Vercel auto-detects
   from `package.json`. Delete it. Why: every config file is a future
   merge conflict. Effort: trivial. Risk: low — verify on a preview
   deploy first. Envelope: v1.
3. **Single Playwright smoke test on CI for the 3 routes.** What: one
   `tests/e2e/smoke.spec.ts` that runs `next start` in the background and
   asserts `/`, `/success?_test=1`, and `/pack?data=<fixture>` all
   render their h1 without console errors. Why: replaces 6 of the 9
   manual checkboxes in `README.md`. **Not** premature — the manual
   checklist is *already* a tax. Effort: M. Risk: low — Playwright on
   CI is well-trodden. Envelope: v1.
4. **Defer the ESLint 9 flat-config migration.** What: leave `eslint@8`
   pinned until `eslint-config-next` ships first-class flat-config
   support without a shim. Why: zero user value, real breakage risk; the
   migration is mechanical when the upstream is ready. Effort: skip.
   Envelope: v1.
5. **Add `engines` to `package.json`.** What: `"engines": { "node":
   ">=20" }`. Why: the CI uses Node 20; nothing in `package.json`
   declares it, so a contributor on Node 18 will hit confusing build
   errors. Effort: trivial. Risk: none. Envelope: v1.

## 6. Monetisation upgrades

Ranked by expected revenue lift per hour of build time.

1. **Order-bump at Payhip checkout: "Deluxe Mission Pack PDF" at $6.**
   What: Payhip natively supports order bumps with no API; configure in
   the dashboard. The PDF is the same `pdf-lib`-generated badge from §2.2
   plus 4 colouring pages (founder draws once, ships forever). Why:
   highest margin (100% gross), zero fulfilment, attaches to an already-
   committed buyer. Industry conversion on order bumps is 20–40%; at
   $14 base + 30% × $6 bump, AOV becomes ~$15.80, a +13% lift.
   Effort: S. Risk: low. Envelope: v1.
2. **Price ladder: $14 single / $24 single+printable pack / $39
   three-pack.** What: three Payhip products, three `NEXT_PUBLIC_CHECKOUT_URL`
   variants, a one-screen "pick your mission" intermediary on the form
   submit. Why: anchoring lifts the $14 SKU's perceived value; the
   three-pack is the gifting/grandparent SKU (§3.1 dependency). Effort:
   M. Risk: low — Payhip supports this without API work. Envelope: v1.
3. **Annual reminder loop.** What: capture parent email at checkout
   (Payhip already does this; surface it on `/success` with a
   pre-checked "remind me 11 months from now" checkbox), and on tick run
   a Cloudflare Worker cron that hits Resend. Why: the same buyer next
   year is the cheapest sale this business will ever make. Open rates
   on year-anniversary "your kid is turning {AGE+1}" emails are above
   60% in lifecycle benchmarks. Effort: M. Risk: low; needs a privacy
   line in the footer. Envelope: Phase 2+ (introduces a tiny
   Worker+Resend stack — pays back inside 5 reminder-driven repeat
   sales).
4. **B2B SKU: school/venue 20-pack at $199.** What: one Payhip product,
   delivers a CSV of 20 single-use codes + a "redeem at
   wanderingdodo.com/redeem" landing page. Codes are pre-baked base64
   payloads with a `?code=` slot the parent fills. Why: kids' party
   venues in Dubai/London do 5–20 parties a month; even one venue
   account is 12× the AOV of a retail buyer. Effort: M. Risk: medium —
   redemption UX needs care to stay no-DB. Envelope: Phase 2+ (the code
   list lives in `public/codes.csv` checked into the repo, which is
   ugly but envelope-compliant).
5. **Affiliate row on `/pack` recap (§3.2).** One card linking to a
   hand-picked Amazon UAE/UK party-supplies wishlist via the founder's
   affiliate tag. Zero ops, ~3% on impulse buys. Effort: S. Envelope: v1.
6. **Payhip multi-currency.** Enable "Display prices in customer's local
   currency" in Payhip Settings, and update the `$14` label in
   `lib/config.ts` to "from $14". The audience straddles AED/GBP/USD and
   the current label is friction in the UAE. Effort: S. Envelope: v1.
7. **Honest urgency only.** In `BirthdayPortal.tsx`, if `partyDate` is
   within 7 days, prepend a factual banner: "Your party is in N days —
   generate now so guests have time to RSVP." True, so not sleazy;
   converts the procrastinators. Effort: S. Envelope: v1.

## 7. General upgrades & enhancements

1. **Performance budget.** LCP ≤ 2.5 s on a throttled "Slow 4G" profile
   against a £100 Android. Add `.lighthouserc.json` and a CI step.
   Justifies (or kills) every magical idea in §2.
2. **Per-locale `<html lang>`.** Today `app/layout.tsx` hardcodes
   `lang="en"`. If §3.4 (B2B in MENA) or the Ramadan SKU lands, this
   needs to become route-driven.
3. **Document dark-mode-only as a brand choice.** One line in
   `docs/spec.md` so the next agent doesn't "fix" it.
4. **Reduced-motion audit.** Verify §2.4 haptics, §2.3 typewriter, and
   any §6 confetti respect `prefers-reduced-motion`.
5. **Self-hosted error tracking.** GlitchTip on a Fly.io free VM, point
   `@sentry/nextjs` at it. $0/mo, captures iOS-Safari edge cases the
   founder will never reproduce locally.
6. **Screen-reader pass on `/pack`.** The Phase 1 checklist tested the
   landing page only; tab order through `BirthdayPortal.tsx` is the
   highest-value follow-up.
7. **`security.txt` + `/privacy`.** `public/.well-known/security.txt`
   pointing at `support@wanderingdodo.com`, plus a one-paragraph privacy
   page (no DB → genuinely simple to write).

## 8. Recommended next-3-sprints sequencing

If I were the founder, the next 6 things I would ship, in order:

1. **`next/font/local` + two committed woff2 files** (§5.1) — kills the
   README's Phase 1.1 Known Limitation, unblocks the sandboxed CI, and
   is half a day of work. Do this first or every later change carries
   the same CI risk.
2. **Per-child `next/og` WhatsApp preview card** (§2.1) — single highest
   visible-quality lift available, zero new infra, ships the same
   afternoon as #1.
3. **Self-serve lost-link recovery on `/success`** (§1.1) — eliminates
   the only inbound support category named in `README.md`. One file
   touched.
4. **Payhip multi-currency + honest urgency banner** (§6.6 + §6.7) — two
   dashboard toggles and one banner; together they should move
   conversion 5–10% on the founder's existing traffic without writing a
   line of new product code.
5. **Order-bump at checkout + the `pdf-lib` Mission Badge** (§6.1 +
   §2.2) — the badge is the bump's deliverable. Highest revenue-per-
   hour-of-build of anything in this audit. Ship together.
6. **Daily funnel digest from `NEXT_PUBLIC_PING_URL`** (§1.2) — only
   item that requires standing up infra outside this repo, deferred to
   sprint 3 because the previous five all generate the data this digest
   will then summarise.

Everything else in this document is real, but it can wait until these six
have landed and the founder has data on which one moved the needle.
