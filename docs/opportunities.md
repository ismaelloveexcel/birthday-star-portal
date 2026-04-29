# Birthday Star Portal — Opportunity Audit

Solo-operator growth & engineering map. Every recommendation respects the
v1 envelope (no DB, no auth, no API routes, no webhooks, no payment APIs)
unless explicitly labelled **Phase 2+**, and adds $0/mo at zero traffic.
Top of list = ship first.

Assumptions (stated where they bite):

- **Geography**: founder appears UAE-based (default `Asia/Dubai`, Abu Dhabi
  placeholder in `app/page.tsx`); UK secondary (`en-GB` date formatter,
  "mum of a 6-year-old" copy). Both addressed where it matters.
- **Ad budget**: ~$0/mo, organic + WhatsApp word-of-mouth.
- **Payment platform**: Payhip per README §"Option A".

---

## 1. Reduce manual intervention

The README ops runbook makes the manual surface explicit: lost-link recovery
via `support@wanderingdodo.com` is *the only* support path; conversion math
is `wrangler tail` + mental arithmetic; Payhip price changes need a code
edit; refunds and copy updates are bare email/PRs.

1. **Self-serve lost-link recovery on `/success`**. **What**: when
   `localStorage['bdp_session']` is missing, also offer "Paste your portal
   data here" — a textarea that accepts the base64 blob the parent
   received in their Payhip receipt (Payhip's [order-email custom
   message](https://help.payhip.com/article/161-customising-the-order-confirmation-email)
   is templatable, so the receipt can include the encoded `data` blob as
   text). Touches `app/success/page.tsx` only. **Why**: eliminates ~80%
   of the only inbound support category named in the README. **Effort**:
   S. **Risk**: low. **Envelope**: v1.
2. **Templated refund/recovery replies in `docs/support-templates.md`**.
   **What**: 4 canned replies (lost link, double charge, wrong email,
   refund granted) with merge fields the founder pastes into Payhip's
   order detail. **Why**: cuts reply time from 3 min to 30 s; zero
   tooling. **Effort**: S. **Risk**: none. **Envelope**: v1.
3. **Daily funnel digest from the existing Worker, posted to a private
   Discord channel**. **What**: extend the Worker behind
   `NEXT_PUBLIC_PING_URL` to also write a counter to [Workers KV](https://developers.cloudflare.com/kv/)
   keyed by `event` + UTC date, plus a [Cron Trigger](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
   that POSTs yesterday's totals to a Discord webhook. **Why**: kills the
   `wrangler tail` ritual in README §Operations and gives the founder a
   daily "did anyone buy?" without opening a laptop. **Effort**: M.
   **Risk**: low — Workers free tier covers 100k req/day ([limits](https://developers.cloudflare.com/workers/platform/limits/)).
   **Envelope**: v1 (Worker is already external).
4. **Centralise A/B-able copy in `lib/config.ts` + a new `lib/content.ts`**.
   Today, changing "$14" needs edits in both `lib/config.ts` *and*
   `app/page.tsx` (per README §"Updating the Payhip price"). One PR with
   one diff, reviewable on a phone. **Effort**: S. **Envelope**: v1.
5. **Replace README §"Phase 1 manual smoke test" with `npm run smoke`** —
   see §5.3.

Hours-saved/mo at 50 sales: #1 ≈3 h > #3 ≈2 h > #2 ≈1 h > #4, #5 ≈30 min.

---

## 2. Make the product more magical

Magic = the 6-year-old's reaction in the first 5 seconds, *and* what the
parent screenshots. Filtered against a £100 Android in a Dubai mall on 4G
(LCP target ≤ 2.5s, CPU budget ~2× a Moto G Power per [web.dev/lcp](https://web.dev/articles/lcp)).

1. **Printable Mission Badge PDF, 100% client-side via [`pdf-lib`](https://github.com/Hopding/pdf-lib)**
   (8.4k★, last commit 2026-04, MIT). **What**: in `components/SpaceBadge.tsx`,
   add "Download printable certificate" that draws name + score + star
   border via a lazy-imported `pdf-lib` (~80 KB gz, behind a click so LCP
   unaffected). **Why**: a tangible artefact pinned to the fridge extends
   magic past the party (and seeds §3.2's post-party loop). **Effort**: M.
   **Envelope**: v1 — the spec's "no PDF export" line bans *server-side*
   PDF infra; in-browser PDF needs no infra and directly raises perceived
   value of the $14. **Founder veto**: if you read the spec strictly,
   skip to #2.
2. **Haptic tick on the last 60 s of `components/Countdown.tsx`**:
   `if (secondsToParty <= 60 && "vibrate" in navigator) navigator.vibrate(15)`
   once per tick. Physical buzz on a child's phone in the mall = viral
   moment. 5 lines, silently no-ops on iOS. **Effort**: S. **Envelope**: v1.
3. **Konami-code easter egg → "Bonus Mission" 6th quiz question**.
   Keydown listener in `components/BirthdayPortal.tsx` for `↑↑↓↓←→←→BA`;
   on hit, append a question using `funFacts[2]` (currently shown only in
   Section 8). Every primary-school WhatsApp group has one nerdy uncle
   who screenshots easter eggs. **Effort**: S. **Envelope**: v1.
4. **3-layer parallax star field, gated by `(min-resolution: 2dppx) and
   (hover: hover)` AND `prefers-reduced-motion: no-preference`** in
   `app/globals.css`. Cinematic on iPhone 14+; the gate keeps the £100
   Android on the existing single layer (perf budget intact). **Effort**: S.
5. **Mission Commander audio sting on Captain Reveal**: ~40 KB
   pre-rendered MP3 at `public/audio/mission.mp3`, played via
   `<audio playsinline preload="none">` triggered from the page's first
   user gesture. Cinema-grade hook without TTS infra. **Effort**: S.
6. **Skip** the suggested "free TTS at generate-time" — every free tier
   either runs in-browser at view-time (inconsistent across cheap kid
   devices) or needs a server call (breaks envelope). #5 replaces it.

Survives the Dubai-mall-Android budget: #2, #3, #5, #4. #1 acceptable
because it's lazy-loaded.

---

## 3. Out-of-the-box concepts

1. **Gifting layer ("Buy a Portal for someone")**. **What**: a `/gift`
   page where a grandparent enters only their email and the parent's
   WhatsApp; submit writes a slim `bdp_gift` to localStorage, redirects
   to the same Payhip checkout, and `/success` detects `bdp_gift` and
   shows "Forward this link to the parent". The parent's link points to
   `/?gift=<token>` which pre-fills `parentContact`. **Why**: unlocks
   the grandparent buyer who currently can't complete the form (doesn't
   know the child's favourite thing). **Effort**: M. **Risk**: medium —
   doubles the test matrix. **Envelope**: v1 (still localStorage + base64).
2. **Post-party "Year One" capsule**. At the end of the portal, add
   "Save Mission Log" that fires the [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API)
   with a single image rendered by `next/og` (extending the existing
   `app/opengraph-image.tsx`). Share text seeds N+1: "See you for
   Captain Zara's 7th!" Pre-marketing for next year's sale, free.
   **Effort**: M. **Envelope**: v1.
3. **Viral lever — "Crew Roll Call" link-back**. In
   `components/RSVPAction.tsx`, after the WhatsApp/email click, show a
   tiny "Want one for your kid? Get $4 off" line linking to `/?ref=crew`
   — Payhip [discount codes](https://help.payhip.com/article/41-discount-codes)
   are URL-coupons, no API. Every guest who RSVPs sees it; one converted
   referral pays back the entire engineering cost. **Effort**: S.
   **Envelope**: v1.
4. **Adjacent SKUs reusing 80% of the codebase**:
   1. **First-Day-of-School Mission** — TAM: every Aug/Sept (UAE Aug
      term, UK Sept term — ≈40M new entrants/yr per
      [UNESCO](https://uis.unesco.org/en/topic/early-childhood-care-and-education)).
      Same portal, swap copy + badge to "Class 1 Cadet". **Rank: #1**.
   2. **Ramadan / Eid Mubarak Mission** — TAM ≈2B Muslims; matches
      founder's UAE geography. Swap palette to gold/green, swap
      countdown target to iftar time. **Rank: #2** (UAE) / #3 (UK).
   3. **Tooth-Fairy Mission** — TAM: every 6–7-year-old, but one-shot
      not annual. **Rank: #3** — fun, but lower repeat-rate than birthdays.

---

## 4. Inspiration repos & products on GitHub / the web

All verified active (commit in the last 12 months as of 2026-04-29).

1. **[`benvinegar/counterscale`](https://github.com/benvinegar/counterscale)**
   — self-hosted analytics on Cloudflare Workers + Analytics Engine, free
   tier. *Steal*: drop-in replacement for the bespoke ping Worker; gives
   the founder a real dashboard for `form_submit → link_generated →
   link_opened` without leaving v1 envelope.
2. **[`umami-software/umami`](https://github.com/umami-software/umami)** —
   self-hostable analytics. *Steal*: the cookieless `<script>` snippet
   pattern; apply to `pingEvent()` so it can fire to either the Worker or
   a Umami Cloud free instance.
3. **[`plausible/analytics`](https://github.com/plausible/analytics)** —
   privacy-first analytics. *Steal*: their `{name, props:{}}` event
   payload shape; migrate the ping payload from `{event, ts}` so the
   founder can later add `props:{utm_source:'whatsapp'}` without a
   schema break.
4. **[`vercel/satori`](https://github.com/vercel/satori)** — JSX → SVG.
   *Steal*: per-child OG image trick; render Captain Reveal as a
   1200×630 PNG via `next/og` (`app/opengraph-image.tsx` already uses it
   per PR #5) so WhatsApp previews show the *child's name*, not the
   brand. Highest free CTR upgrade available.
5. **[`Hopding/pdf-lib`](https://github.com/Hopding/pdf-lib)** — pure-JS
   PDF generation. *Steal*: `drawText` + `drawCircle` recipes for §2.1's
   client-side badge.
6. **[`diegomura/react-pdf`](https://github.com/diegomura/react-pdf)** —
   React → PDF (16k★, active 2026-04). *Steal*: only if `pdf-lib`'s
   raw-draw API feels too low-level; trade ~140 KB gz for JSX ergonomics.
7. **[`vercel/example-figma-og-image`](https://github.com/vercel/example-figma-og-image)**
   (live successor to the archived `vercel/og-image`). *Steal*: the
   Tailwind-in-Satori pattern for the per-child card in #4.
8. **[`Luzifer/ots`](https://github.com/Luzifer/ots)** — one-time-secret
   in the browser, AES-256, no server storage. *Steal*: the burn-after-
   reading UX as inspiration for a future "self-destruct mission briefing
   24 h after the party" feature.
9. **[`vanxh/openbio`](https://github.com/vanxh/openbio)** — link-in-bio
   builder. *Steal*: `next/og` per-page social card pattern (fed by URL
   params, exactly the `/pack?data=…` shape).
10. **[`chroline/lynk`](https://github.com/chroline/lynk)** — minimalist
    link-in-bio. *Steal*: `app/[slug]/page.tsx` server-component pattern
    as precedent for keeping `/pack` server-rendered (per PR #2).
11. **[`LekoArts/duplicati-discord-cloudflare-worker`](https://github.com/LekoArts/duplicati-discord-cloudflare-worker)**
    — Worker that POSTs to Discord. *Steal*: the entire `index.ts` (~40
    lines) for §1.3's daily digest.
12. **[`4lejandrito/next-plausible`](https://github.com/4lejandrito/next-plausible)**
    — Plausible wrapper for Next 15. *Steal*: `<PlausibleProvider>`
    component for the day the bespoke Worker is retired.
13. **[`joelhooks/inngest-resend-example`](https://github.com/joelhooks/inngest-resend-example)**
    — transactional email patterns. *Steal*: React-Email template shape
    for §6.3's annual reminder (Resend free tier alone; skip Inngest).

---

## 5. Process & developer-experience simplifications

1. **Replace `next/font/google` with `next/font/local` + woff2 in
   `/public/fonts/`**. Download Orbitron 400/700 + DM Sans 400/700 (≈90 KB
   total), commit, import via `next/font/local` in `app/layout.tsx` per
   the [Next.js docs](https://nextjs.org/docs/app/api-reference/components/font#local-fonts).
   Directly removes Known Limitation #6 — `npm run build` no longer needs
   egress to `fonts.googleapis.com`. Both fonts are OFL/redistributable
   (verify before commit). **Effort**: S.
2. **Skip ESLint 8 → 9 flat-config until Phase 2**. `eslint-config-next@15`
   still ships the `.eslintrc.json` shape and `extends:["next/core-web-vitals"]`
   works today. The migration buys nothing for a 5-component repo and
   risks CI flakiness right at sales launch. Re-evaluate when `next lint`
   itself moves to flat ([vercel/next.js#64409](https://github.com/vercel/next.js/issues/64409)).
3. **One Playwright smoke spec, not a full suite**. `tests/smoke.e2e.ts`
   that hits `/`, submits the form (mocking `localStorage`), then visits
   `/pack?data=<known-good-blob>` and asserts the Captain Reveal heading
   contains the child name. Run as a separate CI job *only on PRs to
   `main`*. Catches the "I broke the demo button" class of regression
   that Vitest can't. **Effort**: M.
4. **Delete `vercel.json`**. Its three keys (`framework`, `buildCommand`,
   `outputDirectory`) are also Vercel's [auto-detected Next.js defaults](https://vercel.com/docs/projects/project-configuration#framework).
   Dead weight + new-contributor confusion. **Effort**: S. **Risk**: zero.
5. **Promote README §"Phase 1 manual smoke test" to `npm run smoke`**: a
   `package.json` script that runs the Playwright spec from #3 against
   `npm run dev`. Highest-ROI automation here. **Effort**: S (after #3).

---

## 6. Monetisation upgrades

Ranked by expected $/hour-of-build.

1. **Order-bump: "Deluxe Astronaut Certificate" PDF, +$5**, via Payhip's
   native [order bumps](https://help.payhip.com/article/268-order-bumps)
   — no API. The bump is a separate $5 product whose deliverable is the
   §2.1 client-side PDF. Industry-standard ~30% take rate, pure margin,
   no fulfilment. **Effort**: S in this repo, M in Payhip + §2.1 builder.
2. **Price ladder $14 / $24 / $49** via three Payhip products and a
   "Pick your mission" toggle on `app/page.tsx` swapping which
   `NEXT_PUBLIC_CHECKOUT_URL_*` the form redirects to. Payhip [supports
   multiple products](https://help.payhip.com/article/56-products)
   without their `Pro` plan if you wire the selector client-side.
   Anchoring a $24 mid-tier reliably lifts AOV (e.g. [ProfitWell pricing
   research](https://www.priceintelligently.com/blog/anchor-pricing)).
   **Effort**: M.
3. **Annual reminder email — Resend free + 1 Cloudflare Worker cron**.
   Add an opt-in checkbox to the form ("Email me a reminder next year");
   on submit, fire one extra POST (email + first-name + party date *only*)
   to a second Worker that appends to [Workers KV](https://developers.cloudflare.com/kv/)
   keyed by month. A daily Cron Trigger reads "today + 30 days" entries
   and sends via [Resend](https://resend.com/pricing) (free: 3,000/mo,
   100/day — fits a solo op). **Risk**: technically breaks the v1 "no
   email capture" envelope → label **Phase 2+**. Pays back inside 50
   sales if even 5% re-buy.
4. **Affiliate / partnership angle**:
   - **UAE**: [Party Centre](https://www.partycentre.com/) +
     [Daiso UAE](https://www.daiso-me.com/) — pitch a printed QR card at
     their checkout for 20% rev-share.
   - **UK**: [Party Pieces](https://www.partypieces.co.uk/) + indie
     party planners on [Bidvine](https://www.bidvine.com/).
   Zero engineering, all sales legwork.
5. **B2B 20-pack code SKU**. Payhip [bulk discount codes](https://help.payhip.com/article/41-discount-codes)
   generate 20 single-use coupons; sell as one $199 product to schools/
   venues, deliver as a PDF of 20 unique `?code=` URLs. One B2B sale ≈
   14 retail. **Effort**: M.
6. **Currency localisation**. Payhip has [native multi-currency
   checkout](https://help.payhip.com/article/118-multi-currency)
   auto-detecting buyer country — just turn it on. AED/GBP buyers
   convert better than seeing USD ([Stripe Localised Payments
   guide](https://stripe.com/guides/atlas/localized-payments)).
   **Effort**: S, no code.
7. **Honest urgency**: in `lib/validation.ts`, if `partyDate - today
   < 3 days`, surface a warm yellow banner: "Your mission launches in
   2 days — generate now to share tonight." Real, not fake. **Effort**: S.

---

## 7. General upgrades & enhancements

1. **Performance budget contract**. Add a [Lighthouse-CI](https://github.com/GoogleChrome/lighthouse-ci)
   step in `.github/workflows/ci.yml` that fails the build if LCP > 2,500
   ms on a 3G + 4× CPU profile (free, no service to run). Locks in the
   Dubai-mall-Android promise from §2.
2. **`<html lang>` per locale**. `app/layout.tsx` hard-codes `lang="en"`.
   When the Ramadan SKU (§3.4.2) ships, derive `lang` from a route
   `params` locale, defaulting to `en-GB` to match the formatter in
   `lib/utils.ts`.
3. **Image optimisation**: there are no raster images in `/public` after
   PR #5 removed `og-space.png`. Keep it that way — the cinematic look is
   100% CSS, which is the right call.
4. **Error tracking without Sentry**: self-host
   [GlitchTip](https://glitchtip.com/) on [Fly.io](https://fly.io/docs/about/pricing/)
   ($0 inside 3 shared-cpu-1x VMs + 160 GB egress). Add
   `@glitchtip/browser` (Sentry-SDK compatible) on `/pack` only, to catch
   decode crashes. **Phase 2+** because Fly's free tier tightened in 2024
   — quantify before deploying.
5. **Reduced-motion audit of new ideas**: every animation in §2 must sit
   inside the existing `@media (prefers-reduced-motion: reduce)` block
   PR #3 added. Specifically §2.2 haptics must respect it (a buzz is a
   motion cue); §2.4 parallax already gated.
6. **Screen-reader pass on `/pack`**: PR #5 added `aria-labelledby` to
   sections; the remaining gap is `Countdown.tsx` — wrap the digit
   display in `aria-live="polite" aria-atomic="true"` keyed on the *day*
   count so VoiceOver announces "T-minus 2 days" once per day, not every
   second.
7. **Justify dark-mode-only**: keep it. The premium space aesthetic *is*
   the product; a light-mode toggle would dilute the brand. Add a single
   `<meta name="theme-color" content="#050818">` in `app/layout.tsx` so
   iOS Safari's URL bar matches.

---

## 8. Recommended next-3-sprints sequencing

If I were the founder, the next 6 things I'd ship, in order:

1. **§5.1 — `next/font/local` + commit two woff2 files**. Unblocks every
   future contributor and removes the most prominent "known limitation"
   from the README. Half a day. Do it before launch traffic.
2. **§1.1 — Self-serve lost-link recovery on `/success`**. Eliminates
   the only inbound support category. Day's work. Compounds with sales
   volume.
3. **§4 + §6.6 — `next/og` per-child WhatsApp preview card *and* turn
   on Payhip multi-currency**. Both ship the same afternoon, both lift
   conversion immediately, neither needs new infra. The OG card is the
   single highest-CTR change available — every WhatsApp share gets a
   personalised preview tonight.
4. **§6.1 — Payhip order-bump for the deluxe certificate**, paired with
   §2.1 client-side `pdf-lib` PDF. Industry-standard 30% bump take rate
   on a $5 add-on = ~$1.50 added to every $14 sale; pays back the build
   inside ~30 sales.
5. **§3.3 — Crew Roll Call referral discount** in `RSVPAction.tsx`.
   Smallest viral lever in the codebase, four lines of code, every
   guest sees it.
6. **§5.3 + §5.5 — `npm run smoke` Playwright spec**. By now there are
   four shipped features above; the manual smoke checklist is no longer
   tractable. Lock in confidence before the founder starts running paid
   ads.

Defer: §6.3 annual reminder email (wait for ≥50 sales to confirm
repeat-purchase intent before breaking the no-email-capture envelope);
§3.1 gifting layer (waits for first organic "can my mum buy this for me?"
support ticket); §7.4 GlitchTip (premature until errors actually appear).
