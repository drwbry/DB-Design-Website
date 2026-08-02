# Showcase Enhancements — Plan v2 (Stripe & Calendly APPROVED)

> **Status update 2026-08-01 — Batch 1 built.** P1b (plumber Stripe), P1d (salon
> Calendly), and P2a (bakery pre-order form) are implemented and live in the template.
> **P2b (GloriaFood) is cancelled** — the product is discontinued; see the superseded
> notice below. Two conventions in this document have also been overruled by what
> actually shipped:
>
> - **The per-page `CONFIG` block is superseded.** All fork-swappable values live in
>   central `src/config/site.js`, per the onboarding skill and as proven on MAB
>   Properties. Demo integrations sit at `siteConfig.showcase.<demo>.integrations.*`;
>   forking lifts that block up to a top-level `siteConfig.integrations`.
> - **Ungated integrations omit their section entirely** rather than rendering a
>   "coming soon" card. A Concept page must never look half-built to a prospect.

**Status:** Stripe + Calendly integrations approved by Dreux (2026-07-06).
~~GloriaFood embed pending Dreux account setup (free — see research below).~~ *(cancelled — product discontinued)*
**Stripe account:** `foundrysolutionsllc@gmail.com` (use **test mode** for demo links).

**Constraints (unchanged):** static Astro only; every feature = (a) JSON form to the
existing shared Cloudflare Worker, (b) client-side third-party embed, or (c) Sanity
field (webhook → Coolify rebuild). Demo integrations run on TWF-owned accounts and
must actually work. Match each page's existing design system.

**Template-ability rule (applies to every feature):** each showcase page gets a
`CONFIG` block — a small set of `const`s at the top of the frontmatter (or a clearly
marked constants section in the inline script) holding every fork-swappable value:
`SITE_ID`, `TO_EMAIL`, `WORKER_URL`, `STRIPE_PAYMENT_LINK`, `CALENDLY_URL`,
`PHONE`, business name. **No integration URL or routing value may appear inline in
markup/JS below the CONFIG block.** Forking a client site = edit CONFIG + branding.

---

## ~~Ordering-solution research (answers "is GloriaMenus free?")~~ — SUPERSEDED 2026-08-01

> **This entire section is obsolete. Do not act on it.** GloriaFood was discontinued by
> Oracle and retires 30 April 2027; it accepts no new signups. The whole recommendation
> ladder below (GloriaFood free → GloriaFood + card payments → Square Online) is dead at
> rung one and two. The current ladder lives in `docs/features.md` under
> "Ordering — which rung to reach for": Foundry-built pre-order form → Square Online free
> plan → paid SaaS. Kept here only so the reasoning trail stays readable.

The intake brief's "GloriaMenus ~$30/mo" was wrong on both name and price. The product
is **GloriaFood** — and its **core online ordering (and table reservations) is free
forever**: unlimited orders, no commissions, no setup fee; the restaurant confirms
orders on a free phone/tablet app and customers pay at pickup. The ~$29/mo figure is
their **optional online-card-payments add-on** (other add-ons: sales website $9/mo,
branded app $59/mo — we need neither; we ARE the website).

**Recommendation ladder for zero-tech-budget clients (now reflected in
`docs/cowork-intake-brief.md`):**

1. **GloriaFood free tier** — default for restaurants/bakeries/cafés wanting ordering.
   $0/mo, pay-at-pickup. Embed = one script/button snippet on `/menu` or `/order`.
2. **GloriaFood + card payments ($29/mo)** — only when the client insists on prepaid
   orders. Their Stripe connects; money flows direct to client.
3. **Square Online (free plan)** — alternative when the client *already runs Square
   POS* (transaction fees only, menu syncs from their POS).

So GloriaFood **is** the cost-efficient answer — better than we thought, since $0
covers the realistic bakery case.

Sources: [gloriafood.com/pricing](https://www.gloriafood.com/pricing),
[gloriafood.com](https://www.gloriafood.com/),
[g2.com GloriaFood pricing](https://www.g2.com/products/gloriafood/pricing).

---

## Batch 1 (build next, in order)

| # | Page | Feature | Mechanism | Blocked on Dreux? |
|---|------|---------|-----------|-------------------|
| P0 | all 4 forms | Form-reliability compliance | Worker | no |
| P1a | plumber | Service-request ticket form | Worker | no |
| P1b ✅ | plumber | "Pay Your Invoice" — Stripe Payment Link | link-out | yes — create link (5 min, below) |
| P1c | bakery | Specials → Sanity-driven | Sanity | no |
| P1d ✅ | salon | Calendly booking embed | embed | yes — create event (10 min, below) |

**✅ = built 2026-08-01.** P2a (bakery pre-order form) was also built in that pass and
is now the bakery's ordering mechanism. **P2b (GloriaFood embed) is cancelled** — see
the superseded notice above.

Later: P3 salon gift-card Payment Link · P3 salon services→Sanity · P3 bakery dead
menu-tab scaffold cleanup (`bakery.astro:10`).

**Decision recorded — no `restaurant.astro`:** bakery is the food-service exemplar.
Every food pattern (CMS menu, specials, ordering embed, pre-orders) fits it; a fourth
page duplicates mechanism classes, costs hub-grid + maintenance, and reservations are
mechanically identical to the salon's Calendly embed. Revisit only if full-service
restaurant prospects become a real segment.

---

## Dreux setup tasks (do before/independent of the build; Sonnet builds with placeholders)

1. **Stripe (foundrysolutionsllc@gmail.com, TEST mode):** create Payment Link —
   "Peak Flow Plumbing — Invoice Payment"; *customer chooses amount*; add custom text
   field "Invoice #". Paste URL into plumber CONFIG (`STRIPE_PAYMENT_LINK`).
2. **Calendly (free account):** event "Lumière Salon — Consultation", 30 min, cap
   ~3/day. Paste scheduling URL into salon CONFIG (`CALENDLY_URL`).
3. ~~*(Later, P2b)* GloriaFood free account + "Sweet Crumb Bakery" demo menu; grab the
   ordering-widget snippet.~~ **Cancelled** — GloriaFood is discontinued. The bakery
   now uses a Foundry-built pre-order form (P2a), which needs no account at all.
   Optionally set up a free Square Online storefront as a standalone sales asset;
   record its URL in `docs/features.md`.

Sonnet must build every integration against CONFIG constants with placeholder values
(`"REPLACE_ME_STRIPE_LINK"` etc.) and a loud `<!-- TODO(dreux) -->` comment, so the
build never blocks on these.

---

## Build specs (kept terse — reuse each page's existing tokens/classes)

### P0 — form compliance (hub + bakery + plumber + salon)

Per `docs/operations-runbook.md`, in each form/script: add hidden `site_id`
(`web-foundry-hub` / `demo-bakery` / `demo-plumber` / `demo-salon`). Do not add
client-supplied `to_email`; the Worker resolves recipients server-side. Gate success
on `res.ok === true` (keep body-`success` check as AND); on failure call
`turnstile.reset()` and keep form visible. Hub modal is also covered by the homepage
spec §9 — don't double-build; do hub last, skip if the rebrand pass already landed it.

### P1a — plumber service-request form

Extend `#plumber-contact-form` (keep navy styling/input classes):

- Fields: name*, phone*, email, `service_type` select (the six service-card names +
  "Something else"), `urgency` radio pills (`Emergency — right now` / `Today` /
  `This week` / `Flexible`; selected state = `--orange` bg, white text), `address` (street
  or ZIP)*, `time_window` select (Morning / Afternoon / Evening / Any), description textarea.
- `subject: "Service Request — Peak Flow Plumbing"`; add `ticket_id` = `'PF-' +
  Date.now().toString(36).toUpperCase()` to payload; success message shows it:
  "Request received — ticket **{id}**. We'll confirm your window shortly."
- Urgency = Emergency: reveal a pulsing tel: button ("Don't wait — call (555) 123-4567",
  reuse `.btn-emergency`) above submit; form stays usable.
- Each `.service-card` gets a "Request this service →" link (orange, small) that
  scrolls to the form and preselects `service_type` (tiny inline JS).
- Helper text: photos by reply email (Worker is JSON-only — no file uploads).

### P1b — plumber "Pay Your Invoice" section

New section between Hours and Emergency; navy bg, Bebas `section-title` "PAY YOUR
INVOICE", orange `section-tag` "Settle Up Online". Two columns (stack ≤768px): left —
copy "Have an invoice from us? Pay it online in under a minute. Secure checkout by
Stripe." + trust row (🔒 "Cards, Apple Pay, Google Pay — PCI-compliant"); right — card
(`rgba(255,255,255,0.04)` bg, orange left border like `.trust-badge`) with
`.btn-call`-styled anchor "Pay Invoice →" → `CONFIG.STRIPE_PAYMENT_LINK`, new tab.
Small print: "Demo checkout (test mode) — try card 4242 4242 4242 4242."

### P1c — bakery Sanity specials

- Studio (`studio/`): add `specials` array field to the `bakeryMenu` schema — items:
  `emoji` (string), `name` (string, required), `description` (string), `price` (string),
  `availableNote` (string, optional); validation max 3.
- `bakery.astro`: extend the existing GROQ fetch; render `.special-card`s from data,
  keeping the current three hardcoded cards as the fallback when Sanity returns none
  (same pattern as plumber hours). `availableNote` renders in `.special-card__desc`
  line 2. No new CSS needed.
- Deploy schema (`npx sanity deploy` / `deploy_schema`) + seed one published document
  so the live demo shows Sanity data.

### P1d — salon Calendly embed

Restructure `#book` into two columns (stack ≤768px), keeping section header/copy:

- **Left — "Book instantly":** Calendly inline widget div + script
  (script src `assets.calendly.com/assets/external/widget.js`), URL =
  `CONFIG.CALENDLY_URL + '?hide_gdpr_banner=1&background_color=1c1410&text_color=e8d5c4&primary_color=c9a96e'`,
  height ~660px, wrapped in a 1px `--border-gold` frame. Caption (`--blush-muted`,
  0.8rem): "Demo calendar — go ahead, book a slot."
- **Right — existing inquiry form** retitled "Prefer to ask first?" (keep all P0 fixes).
- Calendly script loads lazily (IntersectionObserver or `loading` on scroll) so the
  espresso hero stays fast.

### Copy guardrail (all pages)

Showcase business copy is fictional-business voice — fine as is. Any copy referring to
**The Web Foundry itself** (DBCredit, hub, footers) must never say "free"; the service
has a small fee — community-project pricing, not a giveaway.

---

## Onboarding-skill updates (same PR as the build, per `docs/operations-runbook.md`)

Update `~/.claude/skills/web-foundry-onboarding/SKILL.md` + `docs/intake-form.md`:

- ~~GloriaMenus → **GloriaFood**, free core tier; recommendation ladder above.~~ *(Done differently: GloriaFood is discontinued. The skill now carries the pre-order form → Square Online → paid SaaS ladder instead.)*
- Stripe Payment Link pattern (invoice pay / gift cards): client creates link in their
  Stripe (or we assist), we paste one URL into CONFIG.
- Calendly embed pattern incl. color-param theming.
- CONFIG-block fork convention as the standard for all client templates.
- Worker form types: `service-request` (ticket_id), `pre-order` (order_id);
  `site_id` now baseline in every template form.
