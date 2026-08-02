# Phase 2–3 — Sanity and Repository Setup

## Contents

- Phase 2 Sanity setup
- Repository creation
- Showcase harvesting and cleanup
- Central configuration
- Assets
- Project instructions

## Preserved Playbook

## Phase 2 — Sanity Setup [MANUAL]

**Pause and present these instructions to the user.**

Each client gets their own isolated Sanity project — no shared projects. This prevents clients from interfering with each other's content.

### Step 1: Create a new Sanity project

In [sanity.io/manage](https://sanity.io/manage):

1. Click **Create new project**
2. Name it: `[Business Display Name]` (e.g. "Brys Party", "Peak Flow Plumbing")
3. Dataset name: `production`
4. Plan: **Free** (sufficient for all client sites)
5. After creation, copy the **Project ID** (shown on the project overview page — a short alphanumeric string like `abc1def2`)

Record the project ID — you'll need it in Phase 3 and Phase 6.

### Step 2: Invite client as Editor (if client will self-edit)

In the new project → **Members** → **Invite**:
- Role: **Editor**
- They create a free Sanity account and only see their own project

### Step 3: Note the studio URL

The studio will be deployed in Phase 4b. The URL will be:
```
https://[client-slug].sanity.studio
```

**Wait for confirmation that the project exists and you have the Project ID before proceeding.**

---

## Phase 3 — Fork & Configure Repo [MANUAL + automated]

### Step 1: Create repo from template [MANUAL]

**Present to user:** Go to `github.com/drwbry/The-Web-Foundry` → click **Use this template** → **Create a new repository**. Name it `[client-slug]-website`, set to **Private**.

> **Note:** GitHub does not allow forking your own repo into the same account. The template repo has "Template repository" enabled in Settings, so use "Use this template" instead.

Then clone into the **clients directory** — all client repos live under `~/projects/the-web-foundry/clients/`:
```bash
git clone git@github.com:drwbry/[client-slug]-website.git ~/projects/the-web-foundry/clients/[client-slug]-website
cd ~/projects/the-web-foundry/clients/[client-slug]-website
npm install
```

**Directory convention** (matches the workspace-level `AGENTS.md` rules):
```
~/projects/the-web-foundry/
├── db-design-website/       # ← Template repo local clone (GitHub: drwbry/The-Web-Foundry)
├── clients/
│   ├── itadata-website/
│   ├── terrys-lawncare-website/
│   └── [client-slug]-website/
```

All client sites go under `~/projects/the-web-foundry/clients/`. This keeps client repos grouped together and separate from the template as you scale to 20-30 sites.

**Wait for confirmation that the repo is cloned before proceeding.**

### Step 2: Harvest the matching showcase page, then clean up [automated]

**The showcase pages are intentionally industry templates.** Before deleting anything, pick the one matching the client's industry and copy it as the starting point for their homepage — it already carries a complete, proven design system (palette tokens, fonts, section rhythm) and a working Worker form:

| Client industry | Start from | What it demonstrates |
|-----------------|-----------|----------------------|
| Trades / home services (plumber, HVAC, lawn care, electrician) | `src/pages/showcase/plumber.astro` | Emergency CTA, trust badges, animated stats bar, Sanity hours, service cards, **Stripe "Pay Your Invoice" section** |
| Food service (bakery, café, restaurant, bar) | `src/pages/showcase/bakery.astro` | Sanity PDF menu, daily-specials strip, warm artisan aesthetic, **pre-order form with order reference** |
| Appointments / beauty (salon, spa, barber, studio) | `src/pages/showcase/salon.astro` | Service+price grid, Sanity gallery, **two-column booking: lazy-loaded Calendly + inquiry form** |

Each demo carries a working reference implementation of its industry's signature mechanism, so forking gives you the pattern rather than a blank section. Demo integration values live at `siteConfig.showcase.<demo>.integrations.*`; **forking means lifting that block up to a top-level `siteConfig.integrations`**, the flat shape the client repos use.
| None of the above | Nearest aesthetic match, or fresh through the `design exploration` capability | — |

Copy it to `src/pages/index.astro` (overwriting the hub page), then re-skin: each showcase page defines its full palette as CSS custom properties in `:root {}` at the top of its `<style>` block — swap those token values for the client's palette, swap the fonts link, and replace the fictional business content. **Do not keep the fictional business's name, phone, address, or Unsplash photos in the shipped site.**

**Then delete the rest:**
- `src/pages/showcase/` (entire directory — after harvesting)
- `src/pages/about.astro` (Web Foundry about page)
- `src/styles/hub.css` (hub page styles — Sora/Plus Jakarta Sans, slate/terracotta; not client branding)
- `src/scripts/main.js` (hub-specific: hamburger, contact modal, hub form submit — the showcase pages carry their own inline form scripts)
- `docs/` (entire directory — Web Foundry internal specs, intake briefs, and Claude Design imports; none of it belongs in a client repo)

> ⚠ **privacy.astro token trap:** `src/pages/privacy.astro` styles reference hub.css tokens (`--ink`, `--accent`, `--muted`, `--cream`). Deleting `hub.css` without re-pointing those breaks the page silently (invisible/unstyled text). Redefine those custom properties with the client's palette in the privacy page's own style block (or the client's global stylesheet) as part of this step. Same applies to any other page that imported `hub.css`.

**Delete showcase-specific Sanity schemas** (after noting any patterns you're reusing — e.g. the bakery's `specials` array or plumber's `hours`):
- `studio/schemaTypes/bakeryMenu.ts`
- `studio/schemaTypes/plumberPage.ts`
- `studio/schemaTypes/salonPage.ts`
- `studio/schemaTypes/aboutPage.ts`

**Keep these files (shared infrastructure):**
- `src/layouts/BaseLayout.astro` (includes Turnstile script + skip link)
- `src/layouts/ShowcaseLayout.astro` (rename to `PageLayout.astro`)
- `src/components/DBCredit.astro` (keep — update link text to `Built with <a href="https://cincinnatiwebfoundry.com">The Web Foundry</a>`; never "volunteer" or "free" language)
- `src/lib/sanityClient.ts` (generic, uses env vars)
- `src/lib/imageUrl.ts` (reusable utility)
- `src/scripts/shared.js` (scroll reveal + counters — auto-initializes)
- `src/styles/shared.css` (global resets, .container, responsive utilities)
- `src/pages/privacy.astro` (update content for client's business + fix tokens per the trap above)
- `playwright` devDependency (used for visual QA in Phase 9 — needs `npx playwright install chromium` once per machine, plus `sudo env "PATH=$PATH" npx playwright install-deps chromium` on a fresh WSL box)

**Delete these (not needed for client sites):**
- `src/components/BackButton.astro` (replaced by site-wide nav bar — see Step 4 below)
- `worker/` (entire directory) — the Worker is a single shared resource deployed only from the template repo. A client fork's copy is a snapshot frozen at fork time; if it's left in place and someone later runs `wrangler deploy` from inside it, `wrangler.toml`'s `name`/`account_id` point at the *same* shared Worker, so the stale snapshot silently overwrites it — regressing any fixes made to the template since that fork was created. Confirmed this happens: an older fork's `index.js` still had the pre-`enforceTurnstile`-fix mandatory-Turnstile logic (see Common Mistakes). Delete it in every new fork; if you're working in an older fork that still has it, delete it there too rather than leaving the trap live.

### Step 2b: Central site config convention [automated]

Every fork-swappable value shared across pages lives in `src/config/site.js` — never inline in markup or form scripts. This file is intentionally JavaScript, not TypeScript, so `astro.config.mjs`, Astro pages/layouts, and bundled client-side JS can all import it.

```javascript
export const siteConfig = {
  siteId: '[client-slug]',
  name: '[Business Display Name]',
  localeLabel: '[City, ST]',
  domain: 'https://[client-domain.com]',
  contactEmail: '[client-email]',
  formWorkerUrl: 'https://web-foundry-form-relay.cincinnati-web-foundry.workers.dev',
  turnstileSiteKey: '[client-turnstile-site-key]',
  formSubjects: {
    contact: 'New Inquiry - [Business Display Name]',
  },
  integrations: {
    calendlyUrl: 'REPLACE_ME', // if booking — TODO(dreux)
    stripePaymentLink: 'REPLACE_ME', // if invoice pay / gift cards — TODO(dreux)
    squareOnlineUrl: 'REPLACE_ME', // if ordering via Square store — TODO(dreux)
  },
};
```

Only include keys the site actually uses. Ordering via our own pre-order form needs no key at all — it runs on the shared Worker like any other form.

**The `REPLACE_ME` gate.** If an integration URL is not available yet, keep a `REPLACE_ME` placeholder with a `TODO(dreux)` comment so the build never blocks on account setup, and gate the markup on it:

```js
const payReady = siteConfig.integrations.stripePaymentLink !== 'REPLACE_ME';
```

Two valid fallback behaviours — pick per site:

- **Omit the section and its nav entry entirely** (`{payReady && (<section>…</section>)}`). Use this on showcase/Concept pages and anywhere a prospect might be looking: a half-built page costs more than a missing one. Reference: `src/pages/showcase/plumber.astro`.
- **Render a graceful "coming soon" card.** Use this on a live client site where the page is linked from nav and must not 404. Reference: `clients/mabassets-website/src/pages/pay-rent.astro`.

Import `siteConfig` anywhere the values are needed:

- `astro.config.mjs`: `site: siteConfig.domain`
- `BaseLayout.astro`: canonical fallback and `og:site_name`
- forms: hidden `site_id`, Turnstile `data-sitekey`, Worker URL, and subject
- nav/footer/privacy pages: business name, domain, contact email
- third-party embeds/links: Calendly, Stripe Payment Links, Square Online store URL

Re-skinning a fork = edit `src/config/site.js`, palette tokens, content, and assets; shared form/site constants should not require hunting through individual pages.

### Step 3: Update configuration files [automated]

**`astro.config.mjs`** — update site URL:
```javascript
import { siteConfig } from './src/config/site.js';

site: siteConfig.domain
```

**`package.json`** — update project name:
```json
"name": "[client-slug]-website"
```

**`src/config/site.js`** — update the central site config:
```javascript
export const siteConfig = {
  siteId: '[client-slug]',
  name: '[Business Display Name]',
  localeLabel: '[City, ST]',
  domain: 'https://[client-domain.com]',
  contactEmail: '[client-email]',
  formWorkerUrl: 'https://web-foundry-form-relay.cincinnati-web-foundry.workers.dev',
  turnstileSiteKey: '[client-turnstile-site-key]',
  formSubjects: {
    contact: 'New Inquiry - [Business Display Name]',
  },
  integrations: {},
};
```

**`.env`** — create/update with client's project ID and dataset:
```
SANITY_PROJECT_ID=[client-project-id]
SANITY_DATASET=production
```

**`studio/sanity.config.ts`** — update project ID and dataset:
```typescript
projectId: '[client-project-id]',
dataset: 'production'
```

**`studio/sanity.cli.ts`** — update project ID, dataset, and studio host (determines the deployed URL):
```typescript
import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '[client-project-id]',
    dataset: 'production'
  },
  studioHost: '[client-slug]'
})
```

> The `studioHost` value sets the subdomain: `[client-slug].sanity.studio`. Use the same kebab-case slug as everywhere else.

**`studio/schemaTypes/index.ts`** — clear the imports and export only the new schemas (created in Phase 4).

### Step 4: Update shared components + create Nav [automated]

**Create `src/components/Nav.astro`** — every client site needs a persistent navigation bar. Build it with:
- Fixed position at top, dark-themed with backdrop blur
- Logo (linked to `/`), page links, and a CTA button (e.g. "Get Estimate", "Book Now")
- Active page highlighting based on `Astro.url.pathname`
- Responsive: hamburger menu on mobile (≤768px) with slide-down link list
- Style it using the client's palette (CSS custom properties)

**`src/layouts/BaseLayout.astro`** — update:
- Import and render `<Nav />` inside `<body>` before `<slot />`
- Canonical URL fallback to client domain
- `og:site_name` to client's business name

**`src/layouts/PageLayout.astro`** — update:
- Remove `BackButton` import and usage (nav bar replaces it)
- Remove `backColor`/`backBg` props — no longer needed
- Keep `DBCredit` at the bottom

**`src/components/DBCredit.astro`** — replace entirely with the standard Web Foundry footer. This is a self-contained component with its own `<style>` block — no per-page `.db-credit` overrides needed. Structure:

```html
<footer class="wf-footer">
  <div class="container wf-footer__inner">
    <p class="wf-footer__built">
      Built with
      <a href="https://cincinnatiwebfoundry.com" class="wf-footer__logo">
        <span class="wf-footer__primary">The Web</span>
        <span class="wf-footer__secondary">Foundry</span>
      </a>
    </p>
    <nav class="wf-footer__links" aria-label="Footer">
      <a href="/privacy">Privacy Policy</a>
    </nav>
  </div>
</footer>
```

Style the footer with the **client's** palette (it lives on their site) — the Web Foundry link itself is plain text, no special brand treatment needed. If you want the brand mark, it's a small bordered square with a "W" in it (see the hub site's `.footer__mark`), accent color `#b45a3c`. The component includes all its own styles. **Do not add `.db-credit` CSS overrides in individual pages, and never use the words "free" or "volunteer" in the badge or footer copy.**

### Step 5: Add client assets [MANUAL]

**Present to user:** Add these files to the repo:
- `public/favicon.svg` (or `.ico`) — client's favicon
- `public/logo.svg` (or `.png`) — client's logo
- Any brand images to `public/images/`

**Wait for confirmation before starting Phase 4.**

### Step 6: Set up cross-agent project context [automated]

Each client repo needs canonical `AGENTS.md` guidance so Codex and Claude Code receive the same project context. Create `AGENTS.md` in the repo root with:

```markdown
# [Business Display Name] Project Instructions

## What This Is

Client website for **[Business Display Name]** — built and maintained by The Web Foundry Cincinnati.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Astro (static output) |
| CMS | Sanity.io (project `[client-project-id]`, dataset `production`) |
| Hosting | Coolify on OVHcloud VPS |
| Deploy | GitHub → Coolify auto-deploy on push |
| Forms | Shared Cloudflare Worker (`web-foundry-form-relay`) |

- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Local dev:** `npm run dev` → `http://localhost:4321`

## Site Info

- **Client slug:** `[client-slug]`
- **Domain:** `[client-domain.com]`
- **Sanity project ID:** `[client-project-id]`
- **Sanity dataset:** `production`
- **Sanity Studio:** `[client-slug].sanity.studio`

## Pages

[List routes from the approved Site Plan, e.g.:]
- `/` — Home (hero, hours, gallery, contact form)
- `/menu` — Menu (PDF embed from Sanity)
- `/about` — About the business
- `/privacy` — Privacy policy

## Sanity Content Types

[List which schemas exist and what they control, e.g.:]
- `businessHours` — 7-day hours with open/close/closed fields
- `gallery` — Photo gallery (max 5 images with alt text)
- `menuPdf` — Uploadable PDF menu

## Contact Form

- Posts to: `https://web-foundry-form-relay.cincinnati-web-foundry.workers.dev`
- `site_id`: `[client-slug]`
- Turnstile site key: `[client-turnstile-site-key]` (created in Phase 5d — each client gets their own widget)
- Form submissions go to: `[client-email]`

## Design

- **Palette:** [list CSS custom properties and their values]
- **Fonts:** [heading font] + [body font]
- **Aesthetic:** [description from Site Plan]

## Template Origin

Forked from `drwbry/The-Web-Foundry`. Shared infrastructure (scroll reveal, counters, Sanity client, image URL builder) comes from the template. See the template repo's `AGENTS.md` for details on shared utilities.
```

Then create a sibling `CLAUDE.md` containing:

```markdown
@AGENTS.md
```

Add content below the import only for genuinely Claude-specific behavior. Tailor `AGENTS.md` to match the approved Site Plan from Phase 1. This gives Codex and Claude Code the same durable context in future sessions without requiring the template repo or onboarding skill.

---
