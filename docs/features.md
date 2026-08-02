# Feature Catalog — The Web Foundry

A reference list of everything the website factory can offer a client, split by how
sure-footed we are building it. Use this when an intake answer or a customer
requirement doesn't map cleanly to what's already in `cowork-intake-brief.md` —
check here first before treating it as new work.

## How to use this

- **Integrated** = spec'd, built, and proven (at least in the showcase). We know the
  cost, the limitations, and the embed/build pattern. Applying it to a new client is
  mostly configuration, not invention.
- **Future Consideration** = a real option we could offer, but it hasn't been spec'd,
  built, or tested here yet. Saying yes to a client on one of these means budgeting
  extra build/testing time and updating this doc once it's proven — at which point it
  gets promoted to Integrated.
- When a customer requirement doesn't fit *either* list, it's genuinely new — flag it
  as an Open Question in the Build Plan per `cowork-intake-brief.md`.

---

## Integrated

### Static site (Astro + Coolify)
- **What it does:** Fast, mobile-first static site. Every client is a fork of this
  template repo, deployed via Coolify on the shared VPS, auto-deploys on `git push`.
- **Limitations:** No server-side logic — anything dynamic has to be a third-party
  embed (booking, ordering, payments) or a Sanity-fetched value baked in at build
  time. No user accounts/logins.
- **Cost:** $0 marginal — one VPS hosts 20–30 sites. No per-site hosting bill to pass
  through beyond the standard hosting/support invoice.
- **Spec:** `AGENTS.md` (Stack); `docs/operations-runbook.md` (Multi-Tenant Architecture).

### Sanity CMS (client self-editing)
- **What it does:** Client edits specific content types (hours, gallery, services,
  team, testimonials, events, menu PDF) through Sanity Studio without touching code.
  A webhook triggers a Coolify rebuild on publish.
- **Limitations:** Only build schemas for content the client actually wants to edit —
  everything else is hardcoded to keep the Studio simple. Not a general-purpose CMS;
  no page-builder, no arbitrary new page types without a code change.
- **Cost:** Free tier covers all current client sites.
- **Spec:** `AGENTS.md` (Architecture, Sanity CMS); `cowork-intake-brief.md` (Sanity
  Content Types).

### Contact forms (Cloudflare Worker)
- **What it does:** Shared Worker handles all client contact/quote/booking-inquiry
  forms — Turnstile bot check, CORS lockdown per domain, email via Resend (internal
  notification + branded confirmation to submitter). Per-site routing via `site_id` →
  KV lookup.
- **Limitations:** JSON POST only (no multipart/file uploads through this path). No
  `to_email` override — destination is resolved server-side to prevent spoofing.
- **Cost:** $0 — one Worker + Resend account serves every client.
- **Spec:** `docs/operations-runbook.md` (Contact Forms & Security).

### Booking — Calendly (embed)
- **What it does:** Inline or popup Calendly widget, theme-matched to the client's
  palette via URL color params.
- **Limitations:** Free tier = **one event type only**. Multi-service clients (salon:
  cut/color/spa) need a paid Calendly seat (~$10–16/mo, client's cost) to get separate
  booking pages per service. Free tier also has no automated reminder workflows and
  keeps Calendly branding on the widget.
- **Cost:** $0 to us; $0–16/mo to the client depending on their service complexity.
- **Our own free event type is spoken for.** TWF's single free-tier event
  (`calendly.com/foundrysolutionsllc/30min`) is shared between the MAB Properties
  showing scheduler and the Lumière salon demo. Renaming it is fine; **changing its
  URL slug breaks both**. A second TWF-owned event type would mean a paid seat.
- **Alternative if the limitation bites:** see Cal.com under Future Consideration.
- **Spec:** `docs/showcase-enhancements-proposal.md` (P1d — salon Calendly embed,
  incl. color theming); `docs/cowork-intake-brief.md` (Booking / Reservations).

### Online ordering — Foundry-built pre-order form
- **What it does:** A structured pre-order form on our own Cloudflare Worker pipeline
  — items, pickup date, pickup window, occasion, allergy notes — that emails the
  client a ticketed order with a customer-facing reference (`SC-XXXXXX`). Same
  Turnstile + honeypot + JSON-POST pattern as every other form we ship.
- **Limitations:** Not a cart and not a checkout. No line-item pricing, no inventory,
  no payment — the customer pays at pickup. Best for menus where the client wants to
  confirm each order by hand anyway. Pair with a Stripe Payment Link if they want
  prepayment for large or custom orders.
- **Cost:** $0 forever. No third-party account, no vendor risk, and we own the whole
  path — which is exactly why it now leads the ordering ladder (see below).
- **Spec:** `src/pages/showcase/bakery.astro` (`#order` section) — the reference
  implementation.

### Ordering — which rung to reach for

Recommend in this order:

1. **Foundry-built pre-order form** (above) — the default. Right for bakeries, cafés,
   caterers, and any client with a small or stable menu who confirms orders manually.
2. **Square Online free plan** — when the client wants a genuine cart, real online
   payment, or already runs Square POS in-store. See Future Consideration below.
3. **Paid ordering SaaS** (Flipdish, UpMenu, ChowNow, Toast) — only when the client
   needs delivery dispatch or deep POS integration *and* will pay for it. None of
   these has a built/tested embed pattern here yet.

### Menu — PDF in Sanity
- **What it does:** Client uploads a PDF via Sanity, site links/embeds it. Best for
  menus that rarely change.
- **Limitations:** Not structured data — no per-item pricing display, filtering, etc.
- **Cost:** $0.
- **Spec:** `docs/cowork-intake-brief.md` (Menu Approach table).

### Menu — custom Sanity schema
- **What it does:** Structured `menuItems` content type the client edits directly,
  one login, no PDF re-uploads.
- **Limitations:** More build time up front than the PDF route; only worth it when
  the client explicitly wants frequent, self-serve menu edits without a dedicated
  ordering tool.
- **Cost:** $0 recurring; more build time at setup.
- **Spec:** `docs/cowork-intake-brief.md` (Sanity Content Types, Menu Approach table).

### Payments — Stripe Payment Links
- **What it does:** "Pay your invoice" (service businesses) or gift card sales.
  Payment Link created in the *client's own* Stripe account, linked from the site —
  no checkout server on our side, ever.
- **Limitations:** Static links only (no cart, no line-item checkout) — fine for
  invoice-style or fixed-amount payments, not for a full storefront.
- **Cost:** Stripe's standard processing fees to the client; $0 to us.
- **Spec:** `docs/cowork-intake-brief.md` (Payments); `docs/showcase-enhancements-proposal.md`.

### Cloudflare Email Routing (general inbox)
- **What it does:** Forwards specific addresses (e.g. `hello@domain.com`) to a
  personal inbox. Separate from form-submission email, which goes through the Worker
  + Resend.
- **Limitations:** No catch-all — only explicitly configured addresses forward, to
  avoid spam/typo inboxes.
- **Cost:** $0 (Cloudflare free tier).
- **Spec:** `docs/operations-runbook.md` (DNS & Email Setup).

---

## Future Consideration

### Booking — Cal.com
- **What it would add:** Unlimited event types on the free tier — directly solves
  Calendly's biggest gap for multi-service clients (a salon could have separate
  cut/color/spa booking pages at $0 instead of upgrading to paid Calendly). Open
  source, so self-hosting is possible later for zero branding/zero recurring cost,
  though that cuts against our "embed it, don't run it" model and probably isn't
  worth the added ops burden.
- **Why it's not Integrated:** No embed pattern, color theming, or client account
  workflow has been built or tested here — Calendly's is (see above). Cal.com's
  hosted product is also less mature/battle-tested than Calendly's, which matters for
  a template getting forked 20–30 times; more exposure to breaking embed changes.
- **When to reach for it:** A client needs 2+ distinct bookable services and doesn't
  want to pay for Calendly's upgrade. Budget time to build and test the embed pattern
  before promising it — it isn't a drop-in swap yet.

### Booking — Acuity / Square Appointments / OpenTable / Resy
- **What it would add:** Support for clients who already use one of these platforms
  instead of Calendly.
- **Why it's not Integrated:** `intake-form.md` asks about them, but no embed pattern
  has actually been built/tested for any of them here — only Calendly has a proven
  spec.
- **When to reach for it:** Client already has a paid account and doesn't want to
  switch. Treat as a one-off embed build the first time; document the pattern here
  once proven.

### Online ordering — Square Online
- **What it would add:** A genuine cart and real online payment — the rung above our
  own pre-order form. Free plan, $0/mo, 2.9% + $0.30 per order, no commissions on
  direct orders. Especially good when the client already runs Square POS in-store,
  since menu and inventory stay in one system.
- **Why it's not Integrated:** No pattern has been built/tested here yet. Note it is a
  **link-out, not an embed** — Square Online is a hosted store on its own URL, so it
  works like our Stripe Payment Link pattern rather than a widget dropped into a page.
  It also requires the client to activate a real Square account with business and
  banking details, which is a heavier lift than pasting a snippet.
- **When to reach for it:** Client wants customers to pay online at order time, wants
  a real cart, or already uses Square POS.
- **TWF demo storefront:** *(record the `*.square.site` URL here once it exists.)* It
  is a standalone sales asset to open alongside the bakery demo — deliberately **not**
  linked from the Concept page, since Sweet Crumb is fictional and that store takes
  real orders.

---

## Discontinued

### Online ordering — GloriaFood *(dead — do not propose)*
- **Status:** Oracle acquired GloriaFood and is **retiring it on 30 April 2027**. It no
  longer accepts new signups, so it is unavailable to us and to any new client.
- **Why this entry still exists:** GloriaFood was previously the *default* ordering
  recommendation across this doc, the onboarding skill, `cowork-intake-brief.md`, and
  `intake-form.md`. It is kept here so nobody rediscovers the old advice and re-proposes
  it. If a client already uses GloriaFood, they need a migration plan before Apr 2027.
- **What replaced it:** the ordering ladder under "Ordering — which rung to reach for".

### Blog / news section
- **What it would add:** Ongoing posts (news, specials, updates).
- **Why it's not Integrated:** Explicitly out of scope today — no schema, no
  templates, no routing pattern exists.
- **When to reach for it:** A client asks for one. Flag as an Open Question for Dreux
  per `cowork-intake-brief.md` rather than committing to it in the Build Plan.
