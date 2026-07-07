# Cowork Stack Brief — The Web Foundry

This document gives Cowork the context it needs to turn a completed client intake form into a Build Plan. Feed this once as background context — it doesn't change per client.

---

## What We Build

Static websites for local Cincinnati small businesses. Fast, mobile-first, designed to convert visitors into customers (calls, bookings, walk-ins). Free build, ~$20/month ongoing hosting.

---

## Stack & What It Means for Build Plans

| Layer | Tech | What Cowork needs to know |
|-------|------|---------------------------|
| Framework | Astro (static) | Every page is a file — all routes must be defined in the Build Plan |
| CMS | Sanity.io | Only build schemas for content the client will edit themselves. Everything else is hardcoded. |
| Forms | Cloudflare Worker | Pre-built. Just need: form type, destination email, and a site ID slug. |
| Hosting | Coolify on VPS | Need domain + DNS access before launch. |

---

## Key Decisions Cowork Makes From Intake Answers

### Menu Approach (restaurants, cafés, bakeries, bars)
Map the client's intake answers to one of these:

| Client said... | Recommend |
|---------------|-----------|
| Menu rarely changes + has a PDF | **PDF in Sanity** — simple upload, client replaces when needed |
| Menu changes often + wants one login | **Custom Sanity menu schema** — we build it, client edits in CMS |
| Menu changes often + wants QR codes or a dedicated tool | **GloriaFood** (free core ordering/reservations; optional $29/mo online-card-payments add-on) — we embed it on the site |
| No menu | Skip entirely |

### Sanity Content Types
For each content type the client checked as "I want to update myself," include it in the Build Plan as a Sanity schema. Common ones:

- `hours` — business hours (day, open, close, closed flag)
- `gallery` — photos with alt text (max 5)
- `menuPdf` — PDF file upload
- `menuItems` — structured menu (only if custom Sanity menu chosen)
- `services` — name, description, optional price
- `team` — name, role, photo, bio
- `testimonials` — quote, author, optional star rating
- `events` — name, date, description

If the client said "I'd rather have you handle all updates," minimize Sanity schemas — maybe just hours and contact info.

### Booking / Reservations
If the client needs booking, note which third-party platform in the Build Plan. We embed it (iframe or script), not build it. Common platforms: Calendly, Acuity, Square Appointments, OpenTable, Resy.

### Blog
We don't currently build blogs. If the client requested one, flag it in the Build Plan as an open question for Dreux to review.

---

## Build Plan Output Template

After reviewing a client's intake form, Cowork generates this structured document. This feeds directly into Claude Code's onboarding skill.

```
# Build Plan — [Business Name]

## Client Info
- Business name:       [display name]
- Client slug:         [kebab-case, e.g. riverside-coffee-co]
- Domain:              [domain.com]
- Domain registrar:    [GoDaddy / Namecheap / etc. / unknown]
- DNS access:          [yes / no / unknown]
- Notification email:  [where form submissions go]
- Additional emails:   [any CC recipients, or none]

## Pages
[List all routes with a brief description of purpose]
- / (home) — hero, about blurb, [hours/gallery/services], contact form
- /menu — [PDF embed / GloriaMenus embed / structured menu]
- /services — [service list with prices]
- /about — [team, story]
- [etc.]

## Sanity Content Types to Build
- hours: yes/no
- gallery: yes/no
- menu: none | pdf | sanity-schema | gloriaMenus
- services: yes/no
- team: yes/no
- testimonials: yes/no
- events: yes/no
- [other]: [describe]

## Forms
- Type: contact | quote-request | booking-inquiry
- Destination: [email]
- Custom fields beyond name/email/phone/message: [list or none]

## Third-Party Embeds
- [Platform name + purpose, or "none"]

## Design Direction
- Palette:     [from brand colors, or suggested based on vibe]
- Aesthetic:   [warm & cozy / sleek & modern / etc.]
- Logo:        [has file / needs one / low-quality — needs work]
- Photos:      [client has / needs stock / needs photography]
- References:  [URLs they shared, or none]

## Assets Needed Before Build
- [ ] Logo file (SVG or high-res PNG)
- [ ] Brand photos
- [ ] Written copy (about, services, etc.)
- [ ] Menu PDF (if applicable)
- [ ] Booking platform account / embed code (if applicable)

## Open Questions for Dreux
[Anything ambiguous, unusual, or that Cowork couldn't resolve]

## Client Post-Launch
- Self-editing in Sanity: yes/no
- Sanity walkthrough needed: yes/no
```
