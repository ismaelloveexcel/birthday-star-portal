# Birthday Star Portal — Space Mission Edition

By **Wandering Dodo** — Premium digital birthday experiences.

> Your child becomes the hero. Their guests become the crew. One link does it all.

A premium, cinematic, mobile-first birthday mission portal built with Next.js 15 and pure CSS animations. Parents fill a single form, pay once ($14), and receive a magic shareable link that opens an interactive Space Mission portal for every guest.

---

## Tech stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Pure CSS animations (no animation libraries)
- Static checkout link (Payhip or Lemon Squeezy)

No database. No auth. No API routes. No webhooks.

---

## Local setup

```bash
npm install
cp .env.local.example .env.local
# fill in your env vars (see below)
npm run dev
```

Open <http://localhost:3000>.

---

## Environment variables

Only **two** variables are used:

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_CHECKOUT_URL` | Static product link (Payhip or Lemon Squeezy) the form redirects to on submit. |
| `NEXT_PUBLIC_BASE_URL`     | The deployed domain, used to build the shareable `/pack?data=…` link. Use `http://localhost:3000` locally. |

Example `.env.local`:

```
NEXT_PUBLIC_CHECKOUT_URL=https://payhip.com/b/YOUR_PRODUCT_ID
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

---

## Deployment (Vercel)

1. Push this repo to GitHub.
2. Import the repo into Vercel.
3. In the Vercel project settings, add both env variables above.
4. Deploy. The included `vercel.json` already configures the framework and build command.

---

## Payment platform setup

The app reads **one** static checkout URL from `NEXT_PUBLIC_CHECKOUT_URL`. There is no API integration — the payment platform redirects the parent back to `/success` after checkout, and `/success` reads the form data from `localStorage` to build the portal link.

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

---

## Payment flow (v1)

1. Parent fills the form on the landing page.
2. On submit, form data is saved to `localStorage` under key `bdp_session`.
3. Parent is redirected to `NEXT_PUBLIC_CHECKOUT_URL`.
4. Payment platform redirects back to `/success`.
5. `/success` reads `bdp_session` from `localStorage`, base64-encodes the JSON, and builds `${BASE_URL}/pack?data=...`.
6. `/pack` decodes the URL data and renders the full Birthday Star Portal for every guest.

---

## Project structure

```
app/
  layout.tsx
  page.tsx                # landing + live demo + form
  globals.css             # CSS variables, fonts, animations
  success/page.tsx        # post-payment "your link is ready" page
  pack/
    page.tsx              # server component, generateMetadata
    PackClient.tsx        # decodes URL data, renders portal

components/
  BirthdayPortal.tsx      # 9-section cinematic vertical scroll portal
  Countdown.tsx
  RSVPAction.tsx
  QuizGame.tsx
  SpaceBadge.tsx

lib/
  config.ts
  utils.ts
  validation.ts

public/
  og-space.png            # OG image
```

---

## Known limitations (v1)

These are intentional v1 trade-offs. They are documented and acceptable at launch stage with low traffic.

1. **Payment bypass is technically possible** by navigating directly to `/success`. Acceptable while traffic is small.
2. **`localStorage` is browser-scoped.** If a parent uses a different browser or private browsing mode between form submission and the `/success` redirect, the link cannot be generated automatically. The `/success` error state explains this and offers manual support.
3. **Portal data is base64-encoded in the URL.** A technical user can decode it. The data is only party invite details (name, age, location, fun facts) — this is intentional for v1.
4. **No portal link recovery** if a parent loses the link. Manual support via email handles edge cases.
5. **No analytics.** You will not know how many portals have been generated.

### v2 upgrade path (not built now)

```ts
// TODO v2: Replace localStorage + base64 URL with verified payment token flow.
// Trigger: first 5–10 paid sales confirm product demand.
// Adds: Lemon Squeezy API verification, Upstash Redis session, signed/encrypted JWT token.
```

---

## Manual test checklist

### Landing
- [ ] Landing page loads on mobile (390px)
- [ ] All 3 trust badges visible
- [ ] Testimonial displays
- [ ] "See a Live Mission Demo" button opens demo portal
- [ ] Demo sticky bar visible throughout demo scroll
- [ ] Demo countdown counts down to correct date
- [ ] Demo quiz completes and shows badge
- [ ] Demo viral CTA appears at bottom
- [ ] Form fields all render
- [ ] Form validation shows inline errors for missing fields
- [ ] Form validation rejects invalid parentContact
- [ ] Form submit saves to localStorage correctly
- [ ] Form submit redirects to NEXT_PUBLIC_CHECKOUT_URL

### Success
- [ ] /success reads localStorage and generates portal URL
- [ ] Portal URL is correct `/pack?data=...` format
- [ ] "Open My Birthday Star Portal" opens correct link
- [ ] Copy link button copies URL and shows confirmation
- [ ] WhatsApp share button opens WhatsApp with prefilled text
- [ ] Error state renders if localStorage is empty

### Pack (valid portal)
- [ ] /pack?data=... decodes and renders portal
- [ ] Section 1 portal animation plays
- [ ] Section 2 Captain Reveal shows childName and age
- [ ] Section 3 Mission Briefing shows date, time, location
- [ ] Section 4 Countdown counts correctly
- [ ] Section 5 WhatsApp RSVP button opens correct wa.me link
- [ ] Section 5 Email RSVP button opens correct mailto link
- [ ] Section 6 Quiz renders all 5 questions
- [ ] Section 6 Quiz scoring is correct
- [ ] Section 7 Badge shows correct score and rank
- [ ] Section 7 WhatsApp share button works
- [ ] Section 7 Copy caption fallback works on desktop
- [ ] Section 8 Secret Star Log reveals funFacts[1]
- [ ] Section 9 Viral loop footer appears with correct link

### Pack (invalid portal)
- [ ] /pack with no data param shows Mission Access Denied page
- [ ] /pack with malformed data param shows Mission Access Denied page

### Mobile
- [ ] No horizontal scroll on any page
- [ ] All buttons meet 48px minimum tap target
- [ ] Animations do not jank on mobile Safari
- [ ] Font sizes are readable (min 16px body)
