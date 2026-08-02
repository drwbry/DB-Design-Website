# Phase 0–1 — Discovery, Planning, and Sign-Off

## Contents

- Phase 0 discovery
- Business and site requirements
- Content, forms, design, and technical inputs
- Phase 1 Site Plan
- Approval gate

## Preserved Playbook

## Phase 0 — Discovery [MANUAL]

**Do not skip or rush this phase.** Incomplete discovery = rework mid-build.

Present these questions to the user/client and record all answers before moving to Phase 1.

### Business Profile
- What kind of business is it? (restaurant, café, service trade, salon, retail, etc.)
- What is the #1 goal of the website? (get phone calls, online bookings, walk-ins, etc.)
- Who is their customer? (neighborhood families, professionals, tourists, etc.)

### Site Structure — Pages & Sections
- What pages do they need? Common options by type:
  - **Restaurant/café:** Home, Menu, About, Contact, (Reservations?)
  - **Service trade:** Home, Services, About, Contact, (Testimonials?)
  - **Salon/spa:** Home, Services, Gallery, Booking, About, Contact
  - **Retail:** Home, Products/Offerings, About, Contact
- Do they need a blog or news section? *(We don't currently support this — flag if yes)*
- Do they need online booking or reservations? *(Third-party embed — default to **Calendly free tier** unless the client already uses Acuity, Square Appointments, Resy, OpenTable, etc. The embed is themed to the site palette via Calendly's color URL params — see Phase 4e.)*
- Any other special pages or functionality?

### Menu & Ordering (if applicable — restaurants, cafés, bakeries, bars)
Determine which approach fits:

| Scenario | Solution |
|----------|----------|
| Menu never/rarely changes | PDF uploaded to Sanity — client replaces PDF when needed |
| Menu changes frequently (weekly specials, prices) | Custom Sanity menu/specials schema (see the bakery showcase's Sanity-driven specials) |
| Client wants one system to log into | Custom Sanity menu schema |
| Client wants customers to order ahead for pickup | **Foundry-built pre-order form** — the default. Our own Worker: items, pickup date/window, occasion, allergy notes, emailed with an order reference. $0, no third-party account, no vendor risk. Reference build: the bakery showcase's `#order` section |
| Client wants a real cart / payment at order time | **Square Online free plan** — $0/mo, 2.9% + $0.30 per order. A hosted store we **link out to**, not an embed. Client must activate a real Square account (business + banking details) |
| Client already runs Square POS | **Square Online free plan** — same as above, and their menu/inventory stays in one system |
| Client needs delivery dispatch or deep POS integration | Paid SaaS (Flipdish, UpMenu, ChowNow, Toast) — only if they'll pay. No embed pattern built here yet; budget time |

> **GloriaFood is discontinued.** Oracle is retiring it 30 April 2027 and it accepts no
> new signups. Never recommend it. If a prospect already uses it, they need a migration
> plan before that date — that's a real reason to talk to them.

Ask:
- Do they have an existing menu? Format?
- How often does the menu change?
- Do they want customers to order online, or just view the menu?
- If ordering: pay at pickup (our pre-order form, $0) or pay at order time (Square Online, per-transaction fee)?
- Do they want QR code menus?

### Payments & Money Collection (service trades, salons)
Static sites collect money via **Stripe Payment Links** — one URL, zero server code, created in the *client's own* Stripe account:

- **Invoice payment** (plumbers, contractors): Payment Link with *customer chooses amount* + a custom "Invoice #" text field → "Pay Your Invoice" section on the site
- **Gift cards** (salons, restaurants): Payment Link(s) with fixed amounts ($50/$100/$150)

Ask:
- Do they send invoices today? Would "pay your invoice online" help? (huge for trades)
- Would they sell gift cards?
- Do they have a Stripe account, or need help creating one? (money flows directly to the client — never through TWF)

### Content — What Goes in Sanity
Only put content in Sanity that the **client will actually edit themselves**. Everything else is hardcoded.

Ask for each:
- **Business hours** — will they change them? → Sanity `hours[]` schema
- **Gallery / photos** — will they add new photos themselves? → Sanity `gallery[]` schema
- **Services list** — will they add/remove services? → Sanity schema
- **Team members** — do they want to manage staff bios? → Sanity schema
- **Testimonials** — will they add reviews over time? → Sanity schema
- **Menu** — see menu decision above
- **Hero text / tagline** — do they want to edit homepage copy? → Sanity (optional, simple)
- **Contact info / address** — phone, address, hours — these almost always change → Sanity

### Forms
- What forms do they need? (Contact, quote request, booking inquiry, etc.)
- How many destination emails? (one inbox, or multiple people get notified?)
- Do they want an auto-reply sent to people who submit? *(Yes — already built into Worker)*

### Design Inputs
- Do they have an existing logo? (file format?)
- Do they have brand colors or a color palette?
- Do they have professional photos, or do we need to source stock?
- Any reference websites they love the look of?
- Tone/aesthetic: (warm & cozy, sleek & modern, bold & industrial, luxe & minimal, etc.)

### Technical
- Do they have an existing domain, or does one need to be registered?
- Who currently manages their DNS? (GoDaddy, Namecheap, Cloudflare, their old web developer?) *(We always migrate to Cloudflare — this just tells us whose nameservers to change)*
- Do they need a professional email address forwarded to their personal inbox? (e.g. `hello@domain.com` → Gmail) *(Cloudflare Email Routing — free, no Google Workspace needed)*
- Do they have an existing website? (any content to migrate?)
- Will the client edit content themselves in Sanity, or does Dreux handle all updates?
  *(If client self-edits → plan time for a Sanity walkthrough after launch)*

**If a site already exists on the target domain, this is a TAKEOVER — ask these too, then work
the Migration Track above:**

- **Does anyone use email on this domain?** (`@theirdomain.com` addresses) *(If yes: which
  provider — Microsoft 365, Google Workspace, other? This is the highest-risk part of the job.)*
- Do they use any marketing or SaaS platforms that send mail as their domain? (HubSpot,
  Mailchimp, Salesforce, Atlassian, Zendesk) *(Each has its own DKIM records that must survive.)*
- Does the current site get meaningful traffic, or rank for anything? *(Sets redirect-map scope.)*
- Is a brief window of downtime on the domain acceptable during cutover? *(Usually yes; get it
  said out loud.)*
- Who has the registrar login, and is 2FA on it? *(Registrar access is the real control point.)*
- Are there other domains pointing at this one? *(Look each up — don't take the description at
  face value.)*
- Who currently hosts the site, and when can that account be cancelled? *(Not until redirects
  are verified.)*

---

## Phase 1 — Planning & Sign-Off [MANUAL]

Review all Phase 0 answers and produce a **Site Plan** before touching any code. Present this to the user for explicit approval.

The Site Plan must confirm:

```
Client slug:         [kebab-case]
Business name:       [display name]
Domain:              [domain.com]
Client email:        [notification destination]

Pages:               / (home), /menu, /services, /about, /privacy ...
Sections on home:    hero, hours, gallery, contact form ...

Sanity content types:
  - hours (yes/no)
  - gallery (yes/no)
  - menu: pdf | sanity-schema | none
  - services (yes/no)
  - testimonials (yes/no)
  - contact info (yes/no)
  - [other]

Forms:               contact | quote | booking | service-request | pre-order
Form fields:         name, email, phone, message, [custom fields]
Turnstile site key:  [created in Phase 5d — leave blank until then]

Third-party integrations (each is one URL/snippet in `src/config/site.js`):
  - Booking:         Calendly URL: [scheduling link] | other platform | none
  - Ordering:        pre-order form (default) | Square Online store URL | none
  - Invoice pay:     Stripe Payment Link URL (client's Stripe): [link] | none
  - Gift cards:      Stripe Payment Link URL(s): [links] | none

DNS/Email:
  - DNS:             Cloudflare (nameservers updated at registrar in Phase 7)
  - Email routing:   hello@domain.com → client@gmail.com | none

Design:
  - Palette:         [colors]
  - KV brandColor:   [primary accent hex — email wordmark/rule/CTA; see Phase 5a]
  - KV headerBg:     [darkest surface hex (header/hero bg) — email header + heading; must be dark enough to read on white; see Phase 5a]
  - Fonts:           [headings / body]
  - Aesthetic:       [description]
  - Photos:          existing | stock | TBD

Assets needed before build:
  - [ ] Logo file
  - [ ] Brand photos
  - [ ] Menu PDF (if applicable)
  - [ ] Copy / written content
```

**Do not start Phase 3 (Repo Fork) or Phase 4 (Build) until the user has reviewed and approved this plan.**

---
