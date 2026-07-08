# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

**Central config** lives in `src/config/site.js`. Use it for fork-swappable values that are shared across Astro config, pages, layouts, and client-side JS: domain, site name, contact email, Worker URL, Turnstile site key, hub `site_id`, showcase demo `site_id`s, and form subject lines. Do not hardcode those values in individual form scripts.

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

## Contact Forms & Security

All forms POST to a **shared Cloudflare Worker** (`worker/index.js`) deployed at `web-foundry-form-relay.cincinnati-web-foundry.workers.dev`. The Worker handles email delivery via Resend (internal notification + branded confirmation to submitter).

### Required form reliability rules (for every new client)

- Include a hidden `site_id` field (client slug) on every form. The Worker resolves the
  destination inbox server-side from KV via `site_id` (fallback: its `TO_EMAIL` env var).
  Do **not** add a `to_email` field — the Worker deliberately ignores client-supplied
  recipients (spoofing risk), so the field does nothing except leak into the
  notification email as a stray row.
- Submit as JSON (`Content-Type: application/json`) to the Worker, not multipart `FormData`.
- Frontend must only show success UI when `response.ok === true`.
- On failure, keep the form visible, show inline error, and refresh Turnstile token.
- Verify Worker CORS includes every live origin (`https://domain`, `https://www.domain` when used).

**Security layers:**
- **Cloudflare Turnstile** — bot verification widget on every form, token verified server-side in Worker
- **CORS lockdown** — Worker only accepts requests from domains listed in `ALLOWED_ORIGINS` env var
- **Honeypot** — hidden `botcheck` checkbox catches naive bots

**Worker env vars** (set via `wrangler secret put`):
- `TURNSTILE_SECRET_KEY` — Cloudflare Turnstile server key
- `ALLOWED_ORIGINS` — comma-separated allowed domains (e.g. `https://cincinnatiwebfoundry.com,http://localhost:4321`)
- `RESEND_API_KEY` — Resend email API key
- `TO_EMAIL` — internal notification recipient
- `ENFORCE_TURNSTILE` — optional strict mode (`true` to hard-fail invalid/missing Turnstile; default launch-safe mode is unset/false)

**Deploy Worker:** `cd worker && npx wrangler deploy`

### Post-deploy form smoke test (mandatory)

1. Submit one real form on the live domain.
2. Confirm internal notification reaches client inbox.
3. Confirm submitter confirmation email arrives.
4. If either fails, run:

```bash
cd worker
npx wrangler tail --format pretty --sampling-rate 0.99
```

## Keeping the Onboarding Skill Current

The client onboarding process is captured in `~/.claude/skills/web-foundry-onboarding/SKILL.md`. **Any time you make a change that affects how a new client site is spun up, update the skill immediately.** This includes:

- Changes to the Worker (new env vars, KV structure, form fields, deploy commands)
- Sanity schema or dataset conventions
- Coolify deployment steps or env var names
- Turnstile configuration
- DNS or domain setup changes
- New lessons learned from real onboardings

Also update `docs/cowork-intake-brief.md` and `docs/intake-form.md` if the changes affect what Cowork needs to know or what we ask clients.

## Adding a New Showcase Page

1. Copy the structure of an existing showcase page in `src/pages/showcase/`
2. Pick a distinct aesthetic (fonts, palette, motion style) — use the **frontend-design** skill for design guidance
3. Link from `index.astro` — add a new `.project-card` in the showcase grid
4. Add the matching color swatches and mock wireframe CSS using the `.project-card__mock--[name]` pattern
5. Add a Turnstile widget (`<div class="cf-turnstile" data-sitekey="..." data-theme="auto">`) inside the contact form

## DNS & Email Setup

All domains use **Cloudflare for DNS management** and **Cloudflare Email Routing** for email forwarding (beyond form submissions).

### DNS Migration Process
1. Add domain to Cloudflare (creates nameserver pair)
2. Update domain registrar nameservers to point to Cloudflare
3. Cloudflare auto-imports existing DNS records (no data loss)
4. Verify Resend DKIM/SPF/MX records are present and verified

### Email Routing via Cloudflare
**For form submissions:** Cloudflare Worker + Resend (handled by `worker/index.js`)
**For general inbox forwarding:** Cloudflare Email Routing with routing rules
- Example: `hello@domain.com` → personal Gmail inbox
- Uses "Send to email" action (not Worker)
- No catch-all rules — only forward specific addresses to avoid spam/typos

**Why Cloudflare:**
- Single source of truth for DNS + email routing
- Auto-migrates records on nameserver switch
- Email Routing is free tier included
- Scales across all client sites

## Multi-Tenant Architecture (Website Factory)

This codebase is designed as a **base template** for spinning up client websites. The target is 20–30 static sites on a single 4-core/8GB VPS.

**Model:**
- Each client = 1 static Astro site forked from this template repo
- All sites share one Cloudflare Worker for form handling (serverless, zero VPS cost)
- Client sites use standard routes (`/menu`, `/services`, `/testimonials`) not `/showcase`
- Each client gets their own domain, GitHub repo, Coolify deployment, and Sanity dataset

**Scaling the Worker:**
- Add each new client domain to the Worker's `ALLOWED_ORIGINS`
- Every form must include a `site_id`; store per-site config (destination email, business name, brand colors, site URL) in Cloudflare KV

**Coolify tips:**
- Queue builds (don't run concurrent) to avoid CPU spikes from 3–4 simultaneous `npm run build`
- Each static site uses ~0 RAM at runtime (nginx serves files) — VPS headroom stays high
