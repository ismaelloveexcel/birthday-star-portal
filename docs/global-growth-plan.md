# Global Growth Plan

Birthday Star Portal stays intentionally simple for global launch: one static Payhip checkout, one success page, one `/pack?data=...` guest link, no backend, and manual founder operations until demand is proven.

## Payhip Global Setup Checklist

1. Confirm the Payhip product name is `Birthday Star Portal` and the live price matches `config.PRICE` in `lib/config.ts`.
2. Set the Payhip redirect/thank-you URL to `https://yourdomain.com/success`.
3. Add the support email and refund terms to the Payhip product page.
4. Enable Payhip's local currency display if available, then run one test checkout from a private/incognito browser.
5. Keep the app as a single static checkout URL in `NEXT_PUBLIC_CHECKOUT_URL`; do not add payment APIs or webhooks.
6. Save a clean test recovery code and portal link for support rehearsals.

## Multi-Currency Recommendation

Turn on Payhip multi-currency display if it is available in the account settings. Keep the website copy simple with one launch price, and let checkout show familiar local currency to buyers in the UAE, UK, India, US, Singapore, Australia, and other markets.

Do not build currency selection inside the app yet. That adds maintenance without proving demand.

## Suggested Order Bump

Use Payhip's native order bump for a `Deluxe Mission Pack` at a small add-on price. Keep it external to checkout.

Suggested contents:
- Printable mission certificate
- Party countdown poster
- Space badge sheet
- Simple activity page
- Parent setup note

Do not generate PDFs in the app. Upload a static PDF/product asset in Payhip only after the pack exists.

## Suggested Future Bundle

Keep these as Payhip products or bundles, not in-app tier selection, until the single SKU has sales.

- Single portal: current launch price from `config.PRICE`
- Portal + printable pack: higher bundled price
- Three-pack gift bundle: for siblings, cousins, and repeat parent groups

## What Not To Monetise Yet

Do not add accounts, editable portals, guest tracking, RSVP dashboards, affiliate codes, subscriptions, theme marketplaces, AI invite generation, or payment verification. These are only worth revisiting after repeated paid demand and support patterns are visible.

## First 14 Days

Day 1: Verify the live checkout, recovery code, success page, pack link, support inbox, refund template, and Payhip receipt email.

Day 2: Build a list of 30 parent contacts across WhatsApp, school groups, family groups, and local communities.

Day 3: Send 10 warm DMs with the demo link and ask one question: would this make a birthday invite feel easier or more exciting?

Day 4: Post one parent-community message in a relevant group where promotion is allowed.

Day 5: Record three short screen videos: hero reveal, countdown/RSVP, and quiz badge.

Day 6: Contact five party venues or planners with a simple demo link and contact-only offer.

Day 7: Review Payhip visits, checkout starts, completed purchases, refunds, and support messages.

Day 8: Update the homepage only if the same confusion appears three or more times.

Day 9: Send a second batch of 10 DMs to parents in another geography or community.

Day 10: Post one short video hook and one still image of the portal preview.

Day 11: Ask first buyers for a one-line reaction and permission to paraphrase it.

Day 12: Contact five more venues, entertainers, or party planners.

Day 13: Review which market responded best: UAE, UK, India, US, Singapore, Australia, or another parent cluster.

Day 14: Decide one next test: more outreach, Payhip order bump, or better demo video. Do not build backend features yet.

## Short-Form Video Hooks

- "I turned my child's birthday invite into a playable space mission."
- "Instead of sending another flat invite, send guests a mission link."
- "This birthday invite has a captain reveal, countdown, RSVP, quiz, and badge."
- "Parents: here is the invite link kids actually want to open."
- "A WhatsApp birthday invite, but make the birthday child the hero."

## Parent-Community Post Templates

Template 1:

Hi everyone, I am testing a playful birthday invite called Birthday Star Portal. It creates one shareable link with a hero reveal, countdown, RSVP, quiz, and badge for the birthday child. Here is the demo: [demo link]

Would this be useful for a 5-9 year old party, or is a normal image invite enough?

Template 2:

I built a mobile-first birthday invite for parents who organise parties through WhatsApp groups. The child becomes Captain, guests open the mission, and the parent still gets one simple share link. Demo: [demo link]

I would love feedback from anyone planning a birthday soon.

## WhatsApp DM Scripts

Warm parent DM:

Hi [Name], quick parent question. I made a playable birthday invite where the child becomes the hero and guests open one mission link with countdown, RSVP, quiz, and badge. Could I send you the demo and ask if it would work for your family?

After demo:

Thank you for looking. What was clearer: the idea, the demo, or the final share link? I am trying to make it easy for busy parents before promoting it more widely.

Buyer follow-up:

Thank you for buying Birthday Star Portal. Please save your portal link and recovery code. If anything feels unclear before sharing it with guests, reply here and I will help.

## Venue And Party-Planner Outreach

Subject: Playable birthday invite for your party clients

Hi [Name],

I run Birthday Star Portal by Wandering Dodo. It is a playable birthday invite parents can share before the party: hero reveal, countdown, RSVP, quiz, badge, and one guest link.

I am looking for a few venues and planners who want a simple digital add-on for clients. There is no dashboard or integration. You can send parents the demo link, and I can handle setup/support by email while this is early.

Demo: [demo link]

Would this be useful for your party packages?

Thanks,
[Founder name]

## Contact-Only Partner Approach

Keep partners simple at launch:
- One demo link
- One email address
- One Payhip checkout link
- Manual relationship tracking in a spreadsheet
- No partner dashboard
- No affiliate tracking system
- No discount-code database
- No revenue-share automation until partner demand is real

Suggested spreadsheet columns: partner name, city/country, contact, date contacted, reply, next step, notes, estimated monthly parties.

## Metrics To Track Manually

From Payhip:
- Product page visits
- Checkout starts if available
- Completed purchases
- Refunds
- Order-bump take rate if enabled
- Buyer country/currency if available

From optional no-PII ping logs:
- `portal_form_submit`
- `portal_link_generated`
- `portal_link_opened`

Manual founder notes:
- Top source of buyers
- Repeated questions
- Recovery-code support cases
- Time spent per customer
- Which outreach script got replies
- Which geography responded best

Use these numbers to decide the next external experiment before adding app complexity.
