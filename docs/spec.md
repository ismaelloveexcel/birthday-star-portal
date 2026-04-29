You are building the flagship product for Wandering Dodo.

Read every instruction fully before writing any code.
Do not skip sections.
Do not add features not listed here.
Do not remove features that are listed here.

---

# PRODUCT

Name: Birthday Star Portal
Edition: Space Mission Edition
Brand: Wandering Dodo
Brand Tagline: Premium digital birthday experiences.
Launch Price: $14

---

# POSITIONING

This is NOT a generic birthday invitation generator.
This is a premium magical playable birthday world for kids.

Core Promise:
Your child becomes the hero.
Their guests become the crew.
One link does it all.

Target Buyer: Parents planning kids' birthday parties.

---

# WHAT NOT TO BUILD

Do not build any of the following under any circumstance:

- User auth, login, accounts
- Dashboard or admin panel
- Database (Postgres, Supabase, Firebase, Prisma, Drizzle, SQLite)
- Redis or Upstash
- Webhooks
- Payment API calls of any kind
- JWT or signed tokens
- Order verification
- PDF export
- AI image generation
- AI text generation
- Public leaderboard
- Guest tracking database
- Multiple themes or theme selector
- Tabs layout in portal (must be cinematic vertical scroll only)
- Dynamic [id] routes
- Treasure hunt mechanic
- Complex game engine
- Subscription billing
- Analytics dashboard
- Multiple products or editions in UI
- Canvas, Pixi.js, Babylon.js, A-Frame, React Native, Expo
- Framer Motion, GSAP, or any heavy animation library

---

# TECH STACK

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- Pure CSS animations only
- Vercel deployment
- One static checkout URL from environment variable (Payhip or Lemon Squeezy static link)

---

# PAYMENT — V1 SIMPLIFIED

This is intentional. Do not add complexity.

Do NOT implement:
- Any payment platform API calls
- Webhooks
- Order verification
- Redis or any session storage service
- JWT or encrypted tokens
- Any database

USE THIS FLOW:

Step 1: Parent fills form on landing page.

Step 2: On form submit, save form data to localStorage:
  localStorage.setItem('bdp_session', JSON.stringify(formData))

Step 3: Redirect parent to checkout URL from env:
  window.location.href = process.env.NEXT_PUBLIC_CHECKOUT_URL

Step 4: After payment, platform redirects parent to /success.

Step 5: /success reads localStorage:
  const raw = localStorage.getItem('bdp_session')
  const data = JSON.parse(raw)

Step 6: /success generates portal link:
  const encoded = btoa(JSON.stringify(data))
  const portalUrl = `${BASE_URL}/pack?data=${encoded}`

Step 7: /success shows:
  - "Open My Birthday Star Portal" button
  - Copy link button
  - Friendly message: "Share this link with your guests. Save it — this is your portal link."

Step 8: /pack reads data param, decodes, renders full Birthday Star Portal.

The app does not care which payment platform is used.
It only reads NEXT_PUBLIC_CHECKOUT_URL from env.
This can be a Payhip link or a Lemon Squeezy static product link.

Add this comment in /success and /pack — do not build it:
// TODO v2: Replace localStorage + encoded URL with verified payment token after first sales.

---

# FILE STRUCTURE

Create exactly this structure:

birthday-star-portal/
├── app/
│   ├── page.tsx
│   ├── success/
│   │   └── page.tsx
│   └── pack/
│       └── page.tsx
│
├── components/
│   ├── BirthdayPortal.tsx
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
├── public/
│   └── og-space.png  (placeholder — create a simple dark space-themed static OG image)
│
├── .env.local.example
└── vercel.json

Do not create:
- lib/lemon.ts
- lib/redis.ts
- lib/token.ts
- Any API routes
- Any /api/ folder

---

# CONFIG

Create lib/config.ts:

export const config = {
  PRODUCT_NAME: "Birthday Star Portal",
  PRODUCT_EDITION: "Space Mission Edition",
  BRAND_NAME: "Wandering Dodo",
  BRAND_TAGLINE: "Premium digital birthday experiences.",
  PRICE: "$14",
  LAUNCH_BADGE: "Early Access — $14",
  SUPPORT_EMAIL: "support@wanderingdodo.com",
  BASE_URL: process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000",
  CHECKOUT_URL: process.env.NEXT_PUBLIC_CHECKOUT_URL ?? "#",
};

---

# ENV VARIABLES

Create .env.local.example with exactly:

NEXT_PUBLIC_CHECKOUT_URL=https://payhip.com/b/YOUR_PRODUCT_ID
NEXT_PUBLIC_BASE_URL=https://yourdomain.com

That is all. Two variables. Nothing else.

---

# ROUTES

## Route 1: app/page.tsx — Landing Page

This page contains in order:
1. Navigation bar — brand name "Wandering Dodo" top left
2. Hero section
3. Trust signals
4. How it works — 3 steps
5. Live demo section
6. Form section
7. Final CTA section
8. Footer

### Hero Section

Headline:
"Your child becomes the hero. Their guests become the crew. One link does it all."

Subheadline:
"Create a magical birthday mission portal with a cinematic Captain Reveal, mission countdown, RSVP action, and a playable quiz your guests can screenshot and share."

CTA button:
"See a Live Mission Demo →"
(scrolls to demo section)

Secondary CTA:
"Create My Portal — $14"

Launch badge near CTA:
"🚀 Early Access — $14"

### Trust Signals

Show three trust badges:
- "Secure checkout"
- "No account required"
- "Works on any device"

Parent testimonial:
"Zara's guests thought it was the coolest invite they'd ever seen."
— Priya, mum of 6

### How It Works

Three steps, visually numbered:
1. Fill in your child's birthday details — takes 2 minutes.
2. Pay once — $14. No subscription.
3. Get your magic link. Share it with every guest.

### Live Demo Section

Heading: "Try a live mission before you buy"

Button: "Launch Demo Portal →"

Clicking this button renders BirthdayPortal in demo mode directly on the page (not a new tab).
The demo portal is fully interactive.

Demo hardcoded data:
  childName: "Zara"
  age: "6"
  partyDate: today + 14 days (calculate dynamically using new Date())
  partyTime: "15:00"
  location: "Star Base HQ"
  parentContact: "demo@wanderingdodo.com"
  favoriteThing: "rockets"
  funFacts: [
    "once ate a whole cake by herself",
    "thinks she can talk to dolphins",
    "is already planning her next birthday"
  ]
  timezone: "Asia/Dubai"
  isDemo: true

When BirthdayPortal is in demo mode (isDemo === true):
- Show sticky bar fixed at top of portal:
  "👀 This is a demo — Create yours for $14  [Create My Portal →]"
  This bar must not block content but remain visible throughout.
- At the very bottom of demo portal, show CTA overlay:
  "Ready to launch your own birthday mission?"
  Button: "Create My Portal — $14 →"

### Form Section

Heading: "Create your child's birthday mission"

Form fields in this order:
- Child's name* (text, placeholder: "e.g. Ayaan")
- Age they are turning* (number, min 1, max 15)
- Party date* (date input)
- Party time* (time input)
- Party location* (text, placeholder: "e.g. Fun Planet, Abu Dhabi")
- Your WhatsApp or email* (text, placeholder: "For guests to RSVP to you")
- Their favourite thing* (text, placeholder: "e.g. rockets, dinosaurs, unicorns")
- Fun fact 1* (text, placeholder: "e.g. once stayed awake for 24 hours straight")
- Fun fact 2* (text, placeholder: "e.g. can name every planet in order")
- Fun fact 3* (text, placeholder: "e.g. thinks they invented dancing")
- Timezone (select, optional, default "Asia/Dubai")

Privacy note above submit button:
"Only include details you are comfortable sharing with invited guests."

Submit button:
"Launch My Birthday Mission — $14 →"

On submit:
1. Validate all required fields — show inline errors if missing
2. Save to localStorage: localStorage.setItem('bdp_session', JSON.stringify(formData))
3. Redirect to: process.env.NEXT_PUBLIC_CHECKOUT_URL

Do NOT ask for:
- Photo upload
- School name
- Home address
- Medical or allergy information
- Guest names or list

### Footer

"© Wandering Dodo. Premium digital birthday experiences."
Support: support@wanderingdodo.com

---

## Route 2: app/success/page.tsx — Post-Payment Page

This page renders after Payhip/Lemon Squeezy redirects parent back.

On mount:
1. Read localStorage: const raw = localStorage.getItem('bdp_session')
2. If raw is null or invalid JSON: show error state (see Error States)
3. Parse data
4. Generate: const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(data))))
5. Generate: const portalUrl = `${config.BASE_URL}/pack?data=${encoded}`
6. Render success state

Success state UI:
- Headline: "🚀 Your birthday mission is ready!"
- Subline: "Save this link — it's your portal. Share it with every guest."
- Warning: "Important: Save your link now. Bookmark it or send it to yourself."
- Large button: "Open My Birthday Star Portal →" (opens portalUrl in new tab)
- Copy link button: copies portalUrl to clipboard, shows "Copied!" confirmation
- WhatsApp share button: opens wa.me with pre-filled text:
  "🚀 Here's Captain [childName]'s Birthday Mission portal! Open it to see the mission briefing, countdown, and complete the Cadet Challenge: [portalUrl]"

Error state (if localStorage is empty or invalid):
- Heading: "We couldn't find your mission details."
- Body: "This can happen if you opened this page in a different browser or cleared your browser data."
- Instructions: "Please contact us at support@wanderingdodo.com with your payment receipt and we will help you manually."
- Do NOT show a broken page. Keep it calm and space-themed.

---

## Route 3: app/pack/page.tsx — Shareable Birthday Star Portal

This is the page guests open.

On mount:
1. Read: const params = new URLSearchParams(window.location.search)
2. Read: const encoded = params.get('data')
3. If missing: show "Mission Access Denied" error page
4. Decode: const data = JSON.parse(decodeURIComponent(escape(atob(encoded))))
5. If decode fails (malformed data): show "Mission Access Denied" error page
6. If valid: render full BirthdayPortal with decoded data

Dynamic metadata for this page (use Next.js generateMetadata or head tags):
- title: "🚀 You're invited to Captain [childName]'s Birthday Mission!"
- description: "Accept your mission briefing. Cadet training required."
- og:title: same as title
- og:description: same as description
- og:image: /og-space.png (static asset)

Since data is in URL params and generateMetadata runs server-side, extract childName from the encoded data param if possible for dynamic title. If not possible without full decode on server, use a static fallback title: "🚀 You're invited to a Birthday Mission!"

Error page for missing/invalid token:
- Space-themed design
- Heading: "Mission Access Denied"
- Subline: "This portal link appears to be incomplete or has been modified."
- Body: "If you're a guest, please ask the birthday parent to share the link again. If you're the parent, please check your purchase confirmation page or contact support@wanderingdodo.com"
- Do NOT show a React error or stack trace

---

# COMPONENTS

## components/BirthdayPortal.tsx

Props:
```typescript
interface BirthdayPortalProps {
  childName: string;
  age: string;
  partyDate: string;
  partyTime: string;
  location: string;
  parentContact: string;
  favoriteThing: string;
  funFacts: [string, string, string];
  timezone?: string;
  isDemo?: boolean;
}
```

This component renders the full cinematic vertical scroll portal.
It is used in:
- /pack page (isDemo: false) — full portal for guests
- Landing page demo section (isDemo: true) — with sticky demo bar

The portal must be a cinematic vertical scroll. NOT tabs. NOT accordion. NOT sections hidden behind buttons.
Each section flows naturally into the next like a film sequence.

### Section 1: Cosmic Portal Ignition

Full-width opening animation.
CSS-only particle stars or stardust effect.
Central glowing portal ring that pulses.
Text appears after brief animation:
"MISSION ACCESS GRANTED"
Then:
"Initiating birthday mission sequence..."
This is the hook. It must feel cinematic.

### Section 2: Captain Reveal

Large dramatic text reveal:
"CAPTAIN [CHILDNAME]'S"
"[AGE]TH BIRTHDAY MISSION"

This is the viral moment. Make it screenshot-worthy.
Large display font. Glowing. Staggered letter or word animation.
Subtext: "A special mission briefing has been prepared for all crew members."

### Section 3: Galactic Mission Briefing

Mission-style card. Styled like an official space briefing document.

Text:
"ATTENTION CREW"
"You are hereby invited to join Captain [childName]'s [age]th Birthday Mission."

Mission details grid:
- 📅 Mission Date: [formatted partyDate]
- ⏰ Launch Time: [partyTime]
- 📍 Mission Base: [location]
- 🎖 Mission Theme: Space Mission Edition

### Section 4: Orbiting Launch Countdown

Heading: "MISSION LAUNCH COUNTDOWN"

Show a visually styled countdown to partyDate + partyTime.
Display: Days / Hours / Minutes / Seconds
Update every second using setInterval.

If partyDate + partyTime is in the past:
Show: "THE BIRTHDAY MISSION HAS LAUNCHED! 🚀"

Use timezone prop for accurate countdown.
Default timezone: "Asia/Dubai"

Style: circular orbit ring around countdown numbers if achievable with CSS.
Fallback: large digital-clock style numbers with glow effect.

### Section 5: Forcefield Crew Check-In

Heading: "FORCEFIELD CREW CHECK-IN"
Subheading: "Confirm your mission attendance"

No backend. Client-side only.

Detect parentContact type:
- If it contains "@": show email RSVP button
- If it starts with "+" or is numeric: show WhatsApp RSVP button
- Show both if unsure

WhatsApp button:
Opens: https://wa.me/[parentContact]?text=[prefilled]
Prefilled text: "Hi! We confirm that we are joining Captain [childName]'s birthday mission! 🚀"

Email button:
Opens: mailto:[parentContact]?subject=RSVP: Captain [childName]'s Birthday Mission&body=Hi! We confirm that we are joining Captain [childName]'s birthday mission! 🚀

Button labels:
"✅ Confirm via WhatsApp"
"✅ Confirm via Email"

### Section 6: Cadet Challenge Badge System

Heading: "CADET CHALLENGE"
Subheading: "Complete your training to earn Space Badges"

This is a client-side quiz. No backend. Score tracked in component state.
5 questions. One answer per question. Selected answer highlights. Cannot change after selecting.
Show all 5 questions then a "Submit Mission" button. OR show one at a time — your choice based on what looks better.

Questions and correct answers:

Q1: "How old is Captain [childName] turning?"
Correct: [age]
Wrong options: [age-1] and [age+2] (handle edge cases — age cannot go below 1)

Q2: "What is Captain [childName]'s favourite thing?"
Correct: [favoriteThing]
Wrong options: "dinosaurs" and "unicorns"
(If favoriteThing is "dinosaurs", use "dragons" and "unicorns" instead)
(If favoriteThing is "unicorns", use "dinosaurs" and "rockets" instead)

Q3: "Which secret star log belongs to Captain [childName]?"
Correct: funFacts[0]
Wrong options: two static made-up fun facts:
  - "once tried to teach a fish to sing"
  - "believes they invented the high five"

Q4: "Where is the mission taking place?"
Correct: [location]
Wrong options: "Galaxy Garden" and "Moon Base Camp"

Q5: "Which mission are you joining today?"
Correct: "Space Mission Edition"
Wrong options: "Ocean Explorer Edition" and "Jungle Safari Edition"

Shuffle answer options for each question.
Show 3 options per question (1 correct + 2 wrong).

After submit: pass score to SpaceBadge component.

### Section 7: Space Badge Certificate

Render SpaceBadge component with score and childName.

See SpaceBadge component spec below.

### Section 8: Secret Star Log

Heading: "SECRET STAR LOG"
Subheading: "Classified mission intelligence — for crew eyes only"

Show a premium card revealing funFacts[1]:
"[funFacts[1]]"

Style as a classified document card with a seal or stamp.
Subtle reveal animation.

### Section 9: Viral Loop Footer

At the very bottom of every portal:
Space-themed subtle section (not a banner, not an ad):

"✨ Want to create a magical birthday mission for your child?"
"Create your own Birthday Star Portal →"
Link: config.BASE_URL (homepage)

This must look themed and intentional, not like an affiliate link.
Wandering Dodo wordmark in small caps below this.

---

## components/SpaceBadge.tsx

Props:
```typescript
interface SpaceBadgeProps {
  score: number;       // 0–5
  childName: string;
  totalQuestions: number; // always 5
}
```

Renders the post-quiz badge certificate.

Layout:
- Badge-style card, premium design
- Stars or rank icon representing score (e.g. 5 stars for 5/5)
- Large text: "SPACE CADET CERTIFICATE"
- "You earned [score]/5 Space Badges"
- Child's mission name: "Captain [childName]'s Birthday Mission"
- Mission edition: "Space Mission Edition"
- Small "Wandering Dodo" wordmark in corner

Score-based message:
- 5/5: "MISSION COMMANDER — Perfect score, elite cadet!"
- 4/5: "STAR NAVIGATOR — Excellent mission knowledge!"
- 3/5: "SPACE CADET — Mission accepted!"
- 2/5 or below: "JUNIOR RECRUIT — Keep training, the mission needs you!"

Share buttons below badge:

WhatsApp share:
Text: "I earned [score]/5 Space Badges at Captain [childName]'s Birthday Mission! 🚀 [BASE_URL]"
Use navigator.share if available.
Fallback if navigator.share unavailable: show "Copy caption" button.
Pre-filled caption for copy: same text as above.

---

## components/Countdown.tsx

Props:
```typescript
interface CountdownProps {
  partyDate: string;
  partyTime: string;
  timezone?: string;
}
```

Calculates and displays live countdown.
Updates every second using setInterval.
Cleans up interval on unmount.
Handles past dates gracefully.

---

## components/RSVPAction.tsx

Props:
```typescript
interface RSVPActionProps {
  parentContact: string;
  childName: string;
}
```

Renders WhatsApp and/or email RSVP buttons based on parentContact format.

---

# DESIGN REQUIREMENTS

## Overall Aesthetic

Premium dark space theme.
NOT childish. NOT cartoonish. NOT clipart.
Cinematic. Like a premium sci-fi film UI crossed with a luxury product.
Think: dark deep space background, glowing elements, stardust texture, sharp typography.

This must look filmable for TikTok and Instagram Reels.
The Captain Reveal section especially must be screenshot-worthy.

## Typography

Use Google Fonts. Import in layout or globals.
Display font (headings, Captain Reveal): Orbitron — a space-appropriate geometric display font.
Body font (descriptions, mission text): DM Sans or Syne — clean, modern, readable.
Do NOT use: Inter, Roboto, Arial, system fonts, Space Grotesk.

## Colour Palette

Use CSS variables defined in globals.css:

--color-void: #050818         /* deepest background */
--color-space: #0a0f2c        /* card backgrounds */
--color-nebula: #0d1f4c       /* elevated surfaces */
--color-star: #e8eaf6         /* primary text */
--color-comet: #a8b4d4        /* secondary text */
--color-plasma: #4fc3f7       /* primary accent — electric blue */
--color-nova: #7c4dff         /* secondary accent — deep violet */
--color-gold: #ffd700         /* badge gold */
--color-success: #00e676      /* confirmation green */
--color-danger: #ff5252       /* error red */

Apply these consistently. No hardcoded hex values outside globals.css.

## Animations

CSS-only. No animation libraries.

Required animations:
- Star field background: animated CSS stars (use pseudo-elements or keyframes)
- Portal glow pulse on Section 1
- Captain Reveal text: staggered fade-in + slight upward translate
- Countdown numbers: smooth digit transitions
- Card entrance: fade-in + translate-y on scroll into view (use IntersectionObserver or CSS scroll-driven animations if available)
- Button hover: glow pulse on hover
- Badge reveal: scale-in animation

Performance rule:
No janky animations on mobile Safari.
All animations must use transform and opacity only (no layout-triggering properties).
Use will-change sparingly.

## Mobile First

Design for 390px width first.
Large tap targets (minimum 48px height for all buttons).
Readable font sizes on mobile (minimum 16px body).
No horizontal scroll.
Test all tap interactions for mobile usability.

## Form Design

Clean. Spacious. Dark inputs with subtle border.
Floating labels or clearly placed labels above inputs.
Visible focus ring on inputs (use --color-plasma glow).
Inline error messages below each field (not alert popups).
Large submit button — full width on mobile.

---

# VALIDATION

Create lib/validation.ts.

Validate on form submit. Return field-level errors.

Rules:
- childName: required, max 30 chars
- age: required, number, min 1, max 15
- partyDate: required, must be a valid date, must not be more than 2 years in the past
- partyTime: required, valid time format
- location: required, max 100 chars
- parentContact: required, must be a valid email OR a phone number starting with + or containing only digits/spaces/dashes (min 7 chars)
- favoriteThing: required, max 50 chars
- funFact1: required, max 150 chars
- funFact2: required, max 150 chars
- funFact3: required, max 150 chars

---

# ERROR STATES

All error states must be space-themed. No plain white pages with raw error text.

### Missing /pack data

Heading: "MISSION ACCESS DENIED"
Body: "This portal link appears to be incomplete or has been modified."
Subtext: "If you are a guest, please ask the birthday parent to share the link again. If you are the parent, check your purchase confirmation or contact support@wanderingdodo.com"

### Malformed /pack data

Heading: "MISSION ACCESS DENIED"
Body: "This link has been modified and cannot be opened."
Subtext: "Please ask the birthday parent for the original link."

### Missing localStorage on /success

Heading: "We couldn't find your mission details."
Body: "This can happen if you opened this page in a different browser or cleared your browser data."
Subtext: "Please contact support@wanderingdodo.com with your payment receipt and we will generate your portal link manually."

---

# UTILS

Create lib/utils.ts with:

- encodePortalData(data: object): string
  btoa(unescape(encodeURIComponent(JSON.stringify(data))))

- decodePortalData(encoded: string): object | null
  try { return JSON.parse(decodeURIComponent(escape(atob(encoded)))) } catch { return null }

- formatDate(dateString: string): string
  Returns human-readable date: "Saturday, 12 June 2026"

- formatPartyDate(dateString: string, timeString: string, timezone: string): Date
  Returns a Date object for countdown calculation

- detectContactType(contact: string): 'whatsapp' | 'email' | 'both'
  Returns contact type for RSVPAction component

- copyToClipboard(text: string): Promise<boolean>
  Uses navigator.clipboard.writeText, returns success boolean

---

# VERCEL DEPLOYMENT

Create vercel.json:
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next"
}

---

# LOCAL SETUP

After generating all files, provide:

1. Exact commands to run locally:
   npm install
   cp .env.local.example .env.local
   (fill in env variables)
   npm run dev

2. Exact env variables with explanations:
   NEXT_PUBLIC_CHECKOUT_URL — your Payhip or Lemon Squeezy static product link
   NEXT_PUBLIC_BASE_URL — your deployed domain (use http://localhost:3000 for local)

3. Vercel deployment steps:
   - Push to GitHub
   - Connect repo to Vercel
   - Add env variables in Vercel dashboard
   - Deploy

4. Payment platform setup:
   Option A — Payhip:
   - Create account at payhip.com
   - Add Product → Digital Download → "Birthday Star Portal" → $14
   - Settings → set Thank You / Redirect URL to: https://yourdomain.com/success
   - Copy product link → paste as NEXT_PUBLIC_CHECKOUT_URL

   Option B — Lemon Squeezy (static link only):
   - Create product in Lemon Squeezy dashboard
   - Set price to $14
   - Under Checkout Settings → set Redirect URL to: https://yourdomain.com/success
   - Copy the static product link → paste as NEXT_PUBLIC_CHECKOUT_URL

---

# MANUAL TEST CHECKLIST

After build is complete, verify each item:

Landing:
[ ] Landing page loads on mobile (390px)
[ ] All 3 trust badges visible
[ ] Testimonial displays
[ ] "See a Live Mission Demo" button opens demo portal
[ ] Demo sticky bar visible throughout demo scroll
[ ] Demo countdown counts down to correct date
[ ] Demo quiz completes and shows badge
[ ] Demo viral CTA appears at bottom
[ ] Form fields all render
[ ] Form validation shows inline errors for missing fields
[ ] Form validation rejects invalid parentContact
[ ] Form submit saves to localStorage correctly
[ ] Form submit redirects to NEXT_PUBLIC_CHECKOUT_URL

Success:
[ ] /success reads localStorage and generates portal URL
[ ] Portal URL is correct /pack?data=... format
[ ] "Open My Birthday Star Portal" opens correct link
[ ] Copy link button copies URL and shows confirmation
[ ] WhatsApp share button opens WhatsApp with prefilled text
[ ] Error state renders if localStorage is empty

Pack (valid portal):
[ ] /pack?data=... decodes and renders portal
[ ] Section 1 portal animation plays
[ ] Section 2 Captain Reveal shows childName and age
[ ] Section 3 Mission Briefing shows date, time, location
[ ] Section 4 Countdown counts correctly in given timezone
[ ] Section 5 WhatsApp RSVP button opens correct wa.me link
[ ] Section 5 Email RSVP button opens correct mailto link
[ ] Section 6 Quiz renders all 5 questions
[ ] Section 6 Quiz scoring is correct
[ ] Section 7 Badge shows correct score and rank
[ ] Section 7 WhatsApp share button works
[ ] Section 7 Copy caption fallback works on desktop
[ ] Section 8 Secret Star Log reveals funFacts[1]
[ ] Section 9 Viral loop footer appears with correct link

Pack (invalid portal):
[ ] /pack with no data param shows Mission Access Denied page
[ ] /pack with malformed data param shows Mission Access Denied page

Mobile:
[ ] No horizontal scroll on any page
[ ] All buttons meet 48px minimum tap target
[ ] Animations do not jank on mobile Safari
[ ] Font sizes are readable (min 16px body)

---

# KNOWN ACCEPTABLE LIMITATIONS FOR V1

Document these in a README section — do not fix them:

1. Payment bypass is technically possible by navigating directly to /success. Acceptable at launch stage with zero traffic.
2. localStorage is cleared if parent uses a different browser or private browsing mode. Error state handles this gracefully.
3. Portal link contains all party data in base64 — visible to technical users who decode the URL. Data is party invite details only — this is intentional for v1.
4. No portal link recovery if parent loses the link. Manual support via email handles edge cases.
5. No analytics. You will not know how many portals have been generated.

Upgrade path (do not build now):
// TODO v2: Replace localStorage + base64 URL with verified payment token flow
// Trigger: first 5-10 paid sales confirm product demand
// Adds: Lemon Squeezy API verification, Upstash Redis session, signed/encrypted JWT token

---

# FINAL RULES

Build exactly what is described here.
Do not add features not listed.
Do not remove features that are listed.
Do not use tabs in the portal.
Do not use any animation library.
Do not connect to any external API.
Do not create any database.
Do not create any API routes.
Do not add auth.
Do not add a dashboard.

The product is:
Birthday Star Portal — Space Mission Edition
By Wandering Dodo

One form. One payment. One magic link. One birthday mission.
