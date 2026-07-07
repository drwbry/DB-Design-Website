# Showcase Enhancements Proposal — Industry-Specific Functionality

**Status:** Proposal for review — no implementation yet. Written 2026-07-06 against
`src/pages/showcase/{plumber,bakery,salon}.astro`.

**Purpose:** the showcase pages must prove a static Astro site supports *real industry
functionality*, not just aesthetics. Every item below is achievable with exactly three
mechanisms (per constraints): (a) a static form POSTing JSON to the existing shared
Cloudflare Worker, (b) a client-side third-party embed, or (c) a Sanity-driven content
field (webhook → Coolify rebuild already wired). All demo integrations must actually
work using accounts **The Web Foundry owns** — no dead mockups, no "client account
required" placeholders.

---

## Priority overview

| # | Page | Feature | Mechanism | Effort | External dependency |
|---|------|---------|-----------|--------|---------------------|
| P0 | all four forms | Form-reliability compliance fixes | Worker (existing) | S | none |
| P1 | plumber | Service-request ticket form | Worker | M | none |
| P1 | plumber | "Pay Your Invoice" via Stripe Payment Link | embed/link | S–M | TWF Stripe account (test mode), free |
| P1 | salon | Real booking embed (Calendly) | embed | S | TWF-owned free Calendly account |
| P1 | bakery | Specials → Sanity-driven | Sanity | M | none |
| P2 | bakery | Pre-order form (pickup orders) | Worker | M | none |
| P2 | bakery | GloriaMenus ordering embed | embed | S | TWF GloriaMenus demo account (~$30/mo or trial) — **your call** |
| P3 | salon | Gift cards via Stripe Payment Link | embed/link | S | reuses plumber's Stripe setup |
| P3 | salon | Services → Sanity `services` schema | Sanity | S | none |
| P3 | bakery | Clean up empty structured-menu scaffold | code hygiene | XS | none |

Recommended first batch if you confirm scope: **P0 + the three P1s** (each showcase
page gains one flagship "a static site can do *that*?" feature).

---

## P0 — Cross-cutting: form-reliability compliance (all four forms)

The hub modal + all three showcase forms predate the deployment guardrails now in
CLAUDE.md, and since these pages are **forkable client templates, every fork inherits
the gaps**:

1. No hidden `site_id` / `to_email` routing fields (required rule).
2. Success UI gates on `data.success` from the body, not `response.ok === true`.
3. On failure, the consumed Turnstile token is never refreshed (`turnstile.reset()`),
   so the user's retry silently fails verification.

Fix all four in one pass (suggested `site_id`s: `web-foundry-hub`, `demo-bakery`,
`demo-plumber`, `demo-salon`). Small, mechanical, highest leverage per line changed.

---

## Peak Flow Plumbing (`plumber.astro`) — service business exemplar

Already good: emergency CTA, trust badges, animated stats bar, Sanity hours, contact
form. What's missing is the *workflow* story: a customer with a problem, and a customer
with a bill.

### P1a — Service-request ticket form (replaces "describe the issue" free-text)

Upgrade the existing contact form into a structured **Request Service** form — same
Worker, same pattern, richer payload:

- **Fields:** name*, phone*, email, service type (select mirroring the six service
  cards + "Something else"), urgency (radio: `Emergency — right now` / `Today` /
  `This week` / `Flexible`), street address or ZIP*, preferred time window (morning /
  afternoon / evening), description textarea.
- **Ticket number, client-side:** generate `PF-{base36 timestamp}` on submit, include
  it in the JSON payload (`ticket_id`) and show it in the success state: *"Request
  received — your ticket is **PF-K3X9Q**. We'll confirm your window shortly."* Zero
  backend; it just threads the email conversation and *feels* like a real dispatch
  system — which is exactly the demo point.
- **Emergency routing UX:** selecting `Emergency — right now` swaps the submit button
  for a pulsing "Don't wait — call (555) 123-4567" tel: button (reuses
  `.btn-emergency` styles) while keeping the form usable. Realistic and shows conversion
  thinking.
- **Deep links from service cards:** each `.service-card` gets a "Request this
  service →" link that scrolls to the form and preselects the service type (few lines
  of inline JS). Cards stop being decorative.
- **Design:** existing navy contact section, existing input styles; urgency radios as
  segmented pills using `--orange` for the selected state.
- **Explicit non-goal:** photo attachments — the Worker is a JSON→email relay; file
  upload would need R2 or multipart handling. Note "text description now, photos by
  reply email" in the helper text.

### P1b — "Pay Your Invoice" section (Stripe Payment Link)

New section between Hours and the emergency banner: **"PAY YOUR INVOICE"** (Bebas
headline per house style, navy bg, orange accent).

- **Mechanism:** one **Stripe Payment Link** created in the TWF Stripe account —
  *customer chooses amount* enabled, plus a Payment Link **custom field** for
  "Invoice #". That combination is exactly "pay what your invoice says" with zero
  server code. For the demo, create it in **test mode** and label the section
  "Demo — use card 4242 4242 4242 4242"; a fork for a real client swaps in their live
  link URL and deletes the demo note. No client account needed for the showcase to
  function.
- **Layout:** left column — short copy ("Have an invoice from us? Pay it online in
  under a minute. Secure checkout by Stripe.") + trust line (lock icon, "PCI-compliant
  · cards, Apple Pay, Google Pay"); right column — a card with invoice-number
  illustration and a `.btn-call`-styled "Pay Invoice →" anchor opening the Payment
  Link in a new tab.
- **Why not embedded Stripe Checkout/Elements:** requires a server to mint sessions.
  Payment Links are the static-first answer and match the CLAUDE.md scaling doctrine.

### P2 — smaller plumber ideas (flag only)

- Static reviews strip (3 quotes + Google star badge) under the stats bar — trust
  signals are this industry's currency. Content could later be a Sanity `testimonials`
  schema (already a standard type in the intake brief).
- "Service area" ZIP checker: client-side JS against a hardcoded ZIP list, instant
  "✓ We cover 45202" feedback. Cheap, delightful, fully static.

---

## Sweet Crumb Bakery (`bakery.astro`) — food-service exemplar

Already good: Sanity PDF menu, a **hardcoded** Today's Specials strip, warm design.
Two gaps: specials aren't client-editable (undermines the CMS demo story), and there's
no path from "menu" to "order".

### P1c — Specials become Sanity-driven

The specials strip already exists visually — make it real:

- **Schema:** add `specials` array to the existing `bakeryMenu` document (or a
  `dailySpecials` doc): `emoji` (string), `name`, `description`, `price` (string),
  optional `availableNote` ("Tue/Thu/Sat only"). Cap at 3 items (same pattern as the
  salon gallery's max-5).
- **Page:** render from Sanity with the current three cards as the hardcoded fallback
  (identical pattern to plumber hours / salon gallery). Publish → webhook → Coolify
  rebuild, already wired.
- **Demo value:** this is the single best live-demo moment for food prospects —
  *"watch me change today's special from my phone, and the site updates itself."*

### P2a — Pre-order / order-ahead form (Worker)

Real small bakeries take pre-orders; a form genuinely covers the workflow:

- New **"Order Ahead"** section (anchor the nav's currently-dead `Order Now` pill to
  it — right now it points at `#hours`, which is a bug in demo terms).
- **Fields:** name*, phone*, email*, pickup date (min tomorrow, client-side) + time
  select within business hours, order textarea ("6 almond croissants, 1 walnut rye"),
  optional occasion select (birthday/event/just because 🧁). `subject: "Pre-Order —
  Sweet Crumb Bakery"`, `order_id` generated client-side like the plumber ticket.
- Success copy sets expectations honestly: *"Order received! We'll confirm by text
  within the hour. Nothing is charged until pickup."* — which is also exactly how most
  real small bakeries want it (no payment integration to reconcile).

### P2b — GloriaMenus embed (decision needed from you)

The intake brief's sanctioned path for "menu changes often + wants a dedicated
tool/QR" is a **GloriaMenus embed (~$30/mo)**. To demo it honestly the showcase needs
a **TWF-owned GloriaMenus account** with a "Sweet Crumb" demo menu embedded in the
menu section (tabs scaffold already exists to house it or be replaced by it).
- **Recommendation:** hold this until the $30/mo (or trial availability) is worth it —
  the Sanity specials + pre-order form already prove the food-service story. Add the
  embed when a real restaurant prospect is in the pipeline. If you'd rather have it
  now, say so and it goes in the first batch.

### Decision: enhance `bakery.astro` vs. new `restaurant.astro`

**Recommendation: enhance bakery; do not build restaurant.astro now.** Reasoning:

1. Every food-service pattern we can demo (CMS menu, specials, ordering embed,
   pre-orders, hours) fits naturally on the bakery — a fourth page would demonstrate
   the *same mechanism classes*, just restyled.
2. A fourth showcase costs hub-grid redesign (3-card grid → 4), a fourth palette/mock,
   and permanent maintenance surface, while diluting the "three businesses, three
   aesthetics" line.
3. The one genuinely distinct restaurant pattern — **reservations** (OpenTable/Resy) —
   is mechanically identical to the salon's booking embed (P1d below), so the
   capability still gets demonstrated.
4. Revisit only if Cincinnati full-service-restaurant prospects become a real segment;
   then a `restaurant.astro` with a Resy/OpenTable embed + GloriaMenus becomes a
   sales-call asset worth its upkeep.

### P3 — hygiene

`bakery.astro` line 10 declares an empty `categories` array, so the sticky tab bar
renders as an empty bordered strip and the structured-menu loop renders nothing.
Either wire it to a Sanity `menuItems` schema or remove the scaffold until needed.

---

## Lumière Salon & Spa (`salon.astro`) — appointment business exemplar

Already good: services with prices, Sanity gallery, luxe design. The gap is glaring in
demo terms: the nav says **"Book Now"** but lands on… a contact form. Appointment
booking is *the* thing every salon/barber/studio prospect will ask about.

### P1d — Real booking embed (Calendly)

- **Mechanism:** TWF-owned **free Calendly account**, event type "Lumière Salon —
  Consultation" (30 min). Embed via Calendly's inline widget (script + div) inside the
  `#book` section; free tier, functions end-to-end, and a fork swaps one URL per the
  intake brief's embed doctrine (Calendly is first in its listed platforms).
- **Design integration:** Calendly's inline widget accepts `background_color`,
  `text_color`, `primary_color` URL params — set espresso `1C1410` / blush `E8D5C4` /
  champagne `C9A96E` so it sits inside the aesthetic rather than looking bolted on.
  Frame it in a 1px `--border-gold` card.
- **Restructure `#book`:** two columns — left: the embed ("Book instantly"); right:
  the existing inquiry form retitled **"Prefer to ask first?"** (it keeps the Worker
  demo alive and models the real-world pair: instant booking + human inquiry).
- Demo note under the embed: "Demo calendar — bookings land on The Web Foundry's
  calendar, feel free to try it." (Real bookings arriving is the *point*; pick a
  Calendly event with generous availability and auto-decline… actually simpler: set
  the event's daily cap to a few slots.)

### P3 — smaller salon ideas (flag only)

- **Gift cards:** a second Stripe Payment Link (fixed amounts $50/$100/$150) —
  reuses the plumber Stripe setup verbatim; salon gift cards are a real revenue line.
  Cheap to add once P1b exists.
- **Services from Sanity:** move the six hardcoded service cards to the standard
  `services` schema (name/description/price) from the intake brief — lets the demo
  show price edits, and dogfoods the schema clients actually get.

---

## What this set proves, per prospect type

- **Trades/home services:** dispatch-style ticketing + online invoice payment, no backend.
- **Food service:** phone-editable specials, order-ahead, (optionally) full ordering embed.
- **Appointments/beauty:** real-time booking inside a fully static page.
- **Everyone:** every page becomes a copy-paste-ready template where the "integration"
  is one URL or one Sanity schema swap at fork time.

## Onboarding-skill follow-through (per CLAUDE.md)

When implemented, the following must be reflected in
`~/.claude/skills/web-foundry-onboarding/SKILL.md` and the intake docs:
- Stripe Payment Link pattern (invoice pay / gift cards) as a standard offering + the
  "swap link URL at fork" step.
- Calendly embed color-param theming pattern.
- New Sanity types: `specials`; `services` moving from "common" to "demonstrated".
- New form types for the Worker docs: `service-request` (ticket_id), `pre-order`
  (order_id) — and the `site_id`/`to_email` compliance fix as template baseline.

---

**Awaiting your scope confirmation before any implementation.** Suggested batch 1:
P0 + P1a–P1d. Decisions needed from you: (1) approve batch, (2) GloriaMenus demo
account now or later, (3) confirm TWF Stripe (test mode) + free Calendly accounts are
okay to set up.
