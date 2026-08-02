# The Web Foundry Template Instructions

## What This Is

A showcase website for **The Web Foundry** (Cincinnati locale), a community initiative that rebuilds outdated local business websites using AI vibe coding. The site demonstrates capabilities and serves as a template for future client sites. The overarching brand is "The Web Foundry" — Cincinnati is the current locale, with potential future expansion to other locales (e.g. Brown County, IN) each getting their own site with minor localization.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Astro (static output) |
| CMS | Sanity.io (embedded Studio) |
| Hosting | Coolify on OVHcloud VPS |
| Deploy | GitHub → Coolify auto-deploy on push |

- **Build command:** `npm run build`
- **Output directory:** `dist`

## Running Locally

```bash
npm run dev
```
Then visit `http://localhost:4321`

## Site Structure

```
├── src/
│   ├── pages/
│   │   ├── index.astro                  # Main hub page
│   │   └── showcase/
│   │       ├── bakery.astro             # Sweet Crumb Bakery (warm artisan)
│   │       ├── plumber.astro            # Peak Flow Plumbing (industrial bold)
│   │       └── salon.astro             # Lumière Salon & Spa (chic luxury)
│   ├── layouts/
│   │   ├── BaseLayout.astro             # Shared HTML shell
│   │   └── ShowcaseLayout.astro         # Wrapper for showcase pages
│   ├── components/
│   │   ├── BackButton.astro             # Fixed top-left back button for showcase pages
│   │   └── DBCredit.astro              # "Built with The Web Foundry" pill badge
│   ├── scripts/
│   │   ├── shared.js                    # IntersectionObserver scroll reveal + counter animation
│   │   └── main.js                      # Hub-specific: 3D magnetic card tilt, nav blur, parallax
│   ├── config/
│   │   └── site.js                      # Central site/form/showcase constants
│   ├── styles/
│   │   ├── shared.css                   # Global reset, scroll-reveal utility classes, .back-btn
│   │   └── hub.css                      # Hub page design tokens + all component styles
│   └── lib/
│       ├── sanityClient.ts              # Sanity client (useCdn: false — critical for fresh build-time data)
│       └── imageUrl.ts                  # @sanity/image-url builder
├── studio/                              # Sanity Studio (deployed at cincinnati-web-foundry.sanity.studio)
└── public/
```

## Architecture

**Hub page** (`index.astro`) uses `BaseLayout`, loads `hub.css` and `main.js`.

**Showcase pages** use `ShowcaseLayout`, which wraps content with `BackButton` and `DBCredit`. All page-specific styles live in a `<style>` block using CSS custom properties at `:root`.

**Central config** lives in `src/config/site.js`. Use it for fork-swappable values that are shared across Astro config, pages, layouts, and client-side JS: domain, site name, contact email, Worker URL, Turnstile site key, hub `site_id`, showcase demo `site_id`s, form subject lines, and third-party integration URLs. Do not hardcode those values in individual form scripts.

### Work-card previews

Every card in the hub's `#work` and `#concepts` grids shows a real screenshot — client sites from `src/assets/work/`, concept demos from `src/assets/concepts/`. Run `npm run shots` to recapture both sets, then commit the PNGs. It is a manual step, never part of `npm run build`.

The concept cards previously used hand-built CSS mockups of each demo. Those were a second copy of the design and drifted out of sync every time a demo page changed, so they were replaced with screenshots. **Do not reintroduce a mocked-up preview in markup** — recapture instead. After any material change to a demo page or a client site, re-run `npm run shots`.

The capture is 1024x640 at 2x, so text stays legible when the shot is scaled into the ~368x250 card slot. `npm run shots` builds first and serves the concept pages from a local `astro preview` on port 4331; the client phase needs the three live client sites reachable.

### Showcase integrations

Each demo carries the signature mechanism for its industry, so a fork inherits a working reference implementation:

| Demo | Mechanism | Config key |
|------|-----------|-----------|
| bakery | Pre-order form (our own Worker — no third party) | none needed |
| plumber | "Pay Your Invoice" Stripe Payment Link | `showcase.plumber.integrations.stripePaymentLink` |
| salon | Calendly booking embed, lazy-loaded | `showcase.salon.integrations.calendlyUrl` |

Three rules govern these:

- **Gate on `REPLACE_ME`.** Unconfigured integrations are omitted entirely — section *and* nav entry — so the page still reads as complete. Never render a "coming soon" placeholder on a Concept page; a prospect is looking at it.
- **Forking lifts the block.** Moving a demo into a client site means copying that demo's `integrations` block up to a top-level `siteConfig.integrations`, the flat shape the client repos use.
- **The salon's Calendly event is shared with MAB Properties** (`calendly.com/foundrysolutionsllc/30min`). Calendly's free tier allows exactly one event type. Renaming it is fine; **changing its URL slug breaks MAB's `/rentals` page.**

**The demos deliberately have no `WEB_FOUNDRY_SITES` KV entry.** With no entry, the Worker's fallback path brands demo confirmation emails as The Web Foundry and appends the Foundry CTA block — so a prospect who tests a demo form gets a sales touch. This is intentional; do not "fix" it by adding KV entries. One consequence: the bakery pre-order's `order_id` appears in the internal notification but not in the submitter's confirmation, which uses the generic template.

For online ordering generally, see the ladder in `docs/features.md`. **GloriaFood is discontinued** (Oracle; retires 30 Apr 2027) — do not recommend it to any client.

`shared.js` auto-initializes on `DOMContentLoaded` — no manual calls needed. It wires up scroll reveal and counters automatically by querying the DOM for `.reveal` and `[data-count]`.

**Sanity CMS** is used for dynamic content fetched at build time:
- Bakery: PDF menu URL (`menuPdf` field)
- Plumber: business hours with 7-day default fallback
- Salon: gallery images with emoji fallback (max 5)

A Sanity webhook triggers a Coolify rebuild on publish (Create + Update, filter: `!(_id in path("drafts.**"))`).

For a visual overview of how the whole website factory fits together, open `docs/website-factory-map.html` in a browser. It maps the stack, intake inputs, build/deploy flows, form routing, and Sanity update loop.

## Shared Utilities (shared.css + shared.js)

**Scroll reveal** — add `.reveal` to any element. Modifier classes change the entrance direction:
- `.reveal--left` / `.reveal--right` — slide in from side
- `.reveal--scale` — scale up from 92%
- `.reveal-delay-1` through `.reveal-delay-6` — stagger by 0.1s increments

**Counter animation** — add `data-count="42"` (integer) or `data-count="4.9"` (float) to any element. `shared.js` animates it from 0 when scrolled into view.

**Layout / components:**
- `.container` — centered max-width 1200px wrapper with horizontal padding
- `BackButton.astro` — fixed top-left back button for showcase pages (styled per-page via `color`/`background`)
- `DBCredit.astro` — "Built with The Web Foundry" pill badge
- `.hide-mobile` / `.hide-desktop` — responsive visibility toggles (breakpoint: 768px)

## Design System

### Hub Page (index.astro)
- **Colors**: `#181c28` ink bg, `#b45a3c` terracotta accent, `#eee9e1` cream
- **Fonts**: `Sora` (display) + `Plus Jakarta Sans` (body)

### Showcase Pages
| Page | Palette | Fonts |
|------|---------|-------|
| bakery.astro | Cream `#FDF6EC`, Terracotta `#C9926B`, Sage `#7A9E82` | Cormorant Garamond + Nunito |
| plumber.astro | Navy `#1A2744`, Orange `#FF6B2B`, Light `#F5F5F5` | Bebas Neue + Inter |
| salon.astro | Espresso `#1C1410`, Blush `#E8D5C4`, Champagne `#C9A96E` | Bodoni Moda + Raleway |

Each showcase page defines its full palette as CSS custom properties in its `<style>` block — search for `:root {` within the file to find them.


## Operational Runbooks

Before changing forms, the shared Worker, client onboarding, showcase setup, DNS/email, or multi-tenant deployment, read `docs/operations-runbook.md`. Its safety checks and verification steps are mandatory. The form Worker is shared production infrastructure, so verify repository drift and deployment scope before any Worker deploy.

The version-controlled source for the cross-agent onboarding workflow is `skills/web-foundry-onboarding/`. User-level Codex and Claude Code skill entries should symlink to that same directory so the workflow cannot drift between agents. Update and validate the canonical skill whenever onboarding conventions change.
