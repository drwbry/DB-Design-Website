# Phase 4 — Build and Integrations

## Contents

- Sanity schemas and Studio deployment
- Initial content
- Page implementation and design
- Booking, ordering, and payments
- Contact forms and submission UX
- Local build gate

## Preserved Playbook

## Phase 4 — Build the Site

Only start after Phase 1 sign-off. Build exactly what was approved in the Site Plan — no scope creep.

### 4a: Create Sanity Schemas

Based on the Site Plan's confirmed Sanity content types, create schema files in `studio/schemaTypes/`:

- Name each schema file descriptively (e.g., `businessHours.ts`, `gallery.ts`, `services.ts`)
- Export all schemas from `studio/schemaTypes/index.ts`
- Follow existing schema patterns from the template (see bakeryMenu.ts, plumberPage.ts, salonPage.ts for reference patterns)

**Common schema patterns:**
| Content type | Schema pattern |
|-------------|----------------|
| Business hours | Array of `{ day, closed, open, close }` objects |
| Gallery | Array of `{ image (with hotspot), alt }` objects |
| Services | Array of `{ name, description, price }` objects |
| Menu PDF | Single file field |
| Contact info | Object with `phone`, `email`, `address` fields |
| Testimonials | Array of `{ name, text, rating }` objects |

### 4b: Deploy Sanity Studio [MANUAL]

**Present to user:** The studio has its own `package.json` — install dependencies first, then deploy. **Run this from the client repo** (`~/projects/the-web-foundry/clients/[client-slug]-website`), not the template repo — each client has a separate Sanity project, and running it from the template deploys the *template's own* live studio instead (harmless — schema deploys don't touch documents — but it's not the studio you meant to update, and it's easy to miss the studio host prompt confirming which project you're on):
```bash
cd ~/projects/the-web-foundry/clients/[client-slug]-website/studio
npm install
npx sanity deploy
```

> **Note:** The studio's `npm install` is separate from the root project's. It pulls in the full Sanity CLI and Studio dependencies (~1100 packages). Peer dependency warnings about `@sanity/telemetry` are safe to ignore.

Sanity will prompt: `Studio hostname (must be unique)`. Enter `[client-slug]`. This deploys the studio to `https://[client-slug].sanity.studio` — free, permanent, no maintenance required.

If `sanity.cli.ts` already has `studioHost: '[client-slug]'` set (from Phase 3), the prompt is skipped.

### 4c: Seed Initial Content [MANUAL]

If the client provided content (hours, menu PDF, gallery images, etc.), enter it in the Sanity Studio now so the build has data to work with.

**Present to user:** Go to `https://[client-slug].sanity.studio` and create the initial content documents.

### 4d: Build Pages

- Client pages use standard routes (`/`, `/menu`, `/services`, `/about`, `/privacy`) — NOT `/showcase/`
- **Invoke the `design exploration` capability** using `tool-adapters.md` for all design decisions (palette, fonts, layout, spacing, visual balance). Don't guess at design — record and review the direction before implementation.
- Define full palette as CSS custom properties in `:root {}` at top of each page's `<style>` block
- `useCdn: false` in Sanity client — always (already set in sanityClient.ts)
- All Sanity queries should have **fallback values** in case content hasn't been entered yet — the site must look complete even with an empty Sanity dataset
- Set Astro `trailingSlash` explicitly (`'never'` unless the project has a clear reason otherwise) so sitemap URLs, canonicals, and deployed routes stay consistent
- Update `public/robots.txt` to point at the client's own sitemap URL, never the template domain

**Hero section design:**
- The homepage hero must be visually balanced — avoid text-heavy left-aligned layouts with empty right space
- Options: centered text with decorative flanking elements, split layout with image/illustration on right, full-width centered with background treatment
- Use stock imagery (Unsplash) or SVG illustrations as placeholders if the client hasn't provided photos yet

**Privacy page** — update `privacy.astro` with client's business name and contact info. Keep the generic policy structure.

### 4e: Third-Party Integrations (Booking, Ordering, Payments)

Every integration below is fully static — a client-side embed or a link-out. No server code, ever. All URLs live in `src/config/site.js` (Step 2b).

**Calendly booking embed** (salons, consultants, any appointment business):

```html
<div class="calendly-inline-widget"
  data-url={`${CALENDLY_URL}?hide_gdpr_banner=1&background_color=1c1410&text_color=e8d5c4&primary_color=c9a96e`}
  style="min-width:320px;height:660px;"></div>
<script src="https://assets.calendly.com/assets/external/widget.js" async></script>
```

- Theme it with the client's palette via the `background_color` / `text_color` / `primary_color` params (hex **without** `#`) — it should sit inside the design, not look bolted on. Frame it in a subtle border card.
- The scheduling URL comes from the *client's* Calendly account (free tier is fine). Bookings land on their calendar.
- Load the script lazily (IntersectionObserver) if the embed is below the fold, so it doesn't drag first paint. `widget.js` initialises any `.calendly-inline-widget` it finds when it loads, so injecting the script late is enough — no manual init call. Working example: `src/pages/showcase/salon.astro`.
- Pair it with the inquiry form ("Prefer to ask first?") rather than replacing it.

> **TWF's own free Calendly event type is already spoken for.** Calendly's free tier
> allows exactly **one** event type, and ours (`calendly.com/foundrysolutionsllc/30min`)
> is shared by the MAB Properties showing scheduler *and* the Lumière salon demo.
> Renaming the event is safe; **changing its URL slug breaks both at once** — grep
> `foundrysolutionsllc` across `~/projects/the-web-foundry` before touching it. A second
> TWF-owned event type requires a paid seat. Client sites should always use the
> *client's* own account, which sidesteps this entirely.

**Stripe Payment Link** (invoice pay for trades; gift cards):

- Created in the **client's** Stripe dashboard — Payment Links → New. For invoice pay: enable *customer chooses amount* + add a custom text field "Invoice #". For gift cards: fixed-amount links.
- On the site it's a styled anchor opening in a new tab — e.g. a "Pay Your Invoice" section with trust copy ("Secure checkout by Stripe · cards, Apple Pay, Google Pay").
- Never embed Stripe Checkout/Elements — those need a server to mint sessions. Payment Links are the static-first answer.
- Money flows directly to the client. TWF's Stripe (`foundrysolutionsllc@gmail.com`, test mode) is only for showcase demos.

**Online ordering** (restaurants/cafés/bakeries). Two rungs — start at the first:

*Rung 1 — Foundry-built pre-order form (the default).* No third-party account, no monthly cost, and we own the whole path. Build it as a second form on the shared Worker:

- Fields: name, phone, email, `pickup_date` (set `input.min` to today), `pickup_time` window select, `items` textarea, `occasion` select, `notes` for allergies.
- Add an order reference to the payload and echo it in the success message: `payload.order_id = 'XX-' + Date.now().toString(36).toUpperCase()`. Prefix per client.
- **That reference is a human-readable receipt, not a unique key.** It's millisecond-resolution, so two submissions in the same millisecond collide. Fine for demos and low volume. If the client will treat it as a real order number — reading it back to customers, writing it on a box — append randomness: `+ '-' + Math.random().toString(36).slice(2, 6).toUpperCase()`. The plumber's `ticket_id` has the same shape and the same caveat.
- Give it its own `formSubjects.preorder` entry so notifications are distinguishable from the contact form.
- Same honeypot + `site_id` + Turnstile + JSON-POST rules as any other form.
- Reference implementation: the bakery showcase's `#order` section.
- Note: `order_id` reaches the client's notification email, but **not** the customer's confirmation — that uses the Worker's generic template. Say "we'll confirm by email" rather than promising the reference will appear there.

*Rung 2 — Square Online free plan* (client wants a real cart or payment at order time, or already runs Square POS):

- $0/mo, 2.9% + $0.30 per order, no commissions on direct orders.
- It is a **hosted store on its own URL, so this is a link-out, not an embed** — same shape as the Stripe Payment Link pattern. Store the URL as `integrations.squareOnlineUrl`.
- Heavier lift than it looks: the client must activate a real Square account with business and banking details before the store can go live. Flag that in the Build Plan.

> **Never propose GloriaFood.** Oracle discontinued it; it retires 30 April 2027 and accepts no new signups. If a prospect already runs it, they need a migration plan before that date.

**Sanity-driven specials/features** (the zero-cost "wow" for food clients): a small `specials` array schema (emoji, name, description, price, availableNote — cap at 3) rendered with hardcoded fallbacks. Publish → webhook → rebuild means the client updates today's specials from their phone. Use the bakery showcase's specials strip as the reference implementation.

### 4f: Contact Form — Required Elements

Every contact form must include:

- **Name and email are always required** (`required` attribute)
- **Phone input** uses `type="tel"` with auto-formatting
- **`site_id` hidden field is required** — this is the *only* routing mechanism. The Worker looks `site_id` up in KV to find the client's `toEmail`. There is **no `to_email` form field**: the Worker deliberately ignores client-supplied recipients (otherwise anyone could edit the hidden field and redirect/spam-relay submissions). If it's missing, submissions silently fall back to the Foundry inbox.

```html
<!-- Turnstile script is already loaded by BaseLayout.astro -->
<form id="contact-form" novalidate>
  <!-- Visible form fields — name and email are ALWAYS required -->
  <input type="text" name="name" required>
  <input type="email" name="email" required>
  <input type="tel" name="phone" placeholder="(513) 555-0123">
  <!-- ...other fields as needed... -->
  <textarea name="message" required></textarea>

  <!-- Required hidden/security fields -->
  <input type="hidden" name="site_id" value="[client-slug]">
  <div class="hp-field" aria-hidden="true" style="position:absolute;left:-9999px;opacity:0;pointer-events:none;">
    <label for="botcheck">Leave this field empty</label>
    <input id="botcheck" type="text" name="botcheck" tabindex="-1" autocomplete="off">
  </div>
  <div class="cf-turnstile" data-sitekey="[turnstile-site-key]" data-theme="auto"></div>

  <button type="submit">Send</button>
</form>
```

> **No `action`/`method` attributes** — the Worker only accepts JSON, so a native (non-JS) form post would fail with `Invalid JSON`. Submission is handled entirely by the JS handler in 4g; `subject` is added to the JSON payload there rather than as a hidden field.

**Form fields the Worker expects:**
| Field | Required | Notes |
|-------|----------|-------|
| `name` | Yes | Submitter's full name |
| `email` | Yes | Submitter's email (used for confirmation + reply-to) |
| `phone` | No | Phone number |
| `business_name` | No | Submitter's business |
| `website_url` | No | Submitter's current website |
| `message` | Yes | Inquiry text |
| `subject` | No | Custom email subject line (set in the JS payload) |
| `site_id` | Yes | Routes to correct KV config — **do not forget** |
| `cf-turnstile-response` | Auto | Injected by Turnstile widget |
| `botcheck` | Auto | Honeypot — hidden text input, left empty |

Any additional fields are passed through to the internal notification email as key-value rows — so structured forms (service type, urgency, pickup date, ticket/order IDs generated client-side) all work with zero Worker changes.

### 4g: Form Submission UX

Add client-side JavaScript to handle form submission gracefully (the current hub `src/scripts/main.js` form handler in the template is the reference implementation — the showcase pages carry equivalent inline versions):
- **Phone number auto-formatting** — all `input[type="tel"]` fields auto-format to `(XXX) XXX-XXXX` as the user types (strips non-digits, caps at 10 digits)
- Show a loading state while submitting
- Display success/error messages inline (no page redirect)
- Send **JSON payloads** to the Worker (`Content-Type: application/json`) rather than multipart `FormData`; add `subject` to the payload in JS
- Reset form on success
- On failure: show inline error, keep the form visible, re-enable the button, **and call `window.turnstile.reset()`** — a consumed token is single-use, so without the reset the user's retry silently fails verification
- Only show success state when **`res.ok === true` AND the body reports success**; never hide form or show success on failed requests

### 4h: Verify Local Build

```bash
npm run build
npm run preview
```

Check all pages render, Sanity data appears (or fallbacks work), form posts successfully to the Worker, and no build errors.

---
