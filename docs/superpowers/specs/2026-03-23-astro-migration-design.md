# DB Design Website — Astro Migration Spec

**Date:** 2026-03-23
**Goal:** Migrate the static HTML/CSS/JS site to Astro (static output) with layouts, key shared components, and the approved bakery menu redesign implemented as part of the migration.

---

## Scope

- Full site migration: hub page + all three showcase pages
- Astro structure only — no Sanity CMS integration in this migration
- Bakery page built to the approved redesign spec (`docs/superpowers/specs/2026-03-23-bakery-menu-redesign.md`) and implementation plan (`docs/superpowers/plans/2026-03-23-bakery-menu-redesign.md`)
- Plumber and salon pages ported as-is
- Visual design unchanged across all pages

---

## Versions

- **Node:** `.nvmrc` contains `24` (current environment). `package.json` `engines` field: `{ "node": "^20.0.0 || ^22.0.0 || ^24.0.0" }` — supports Node 20, 22, and 24.
- **Astro:** 5.x latest stable. **Do not re-scaffold if `package-lock.json` already exists** — use the existing Astro 5.x environment and run `npm install` to restore dependencies.

---

## Project Structure

```
src/
  layouts/
    BaseLayout.astro        ← <html>, <head>, preconnect hints, meta, shared.css, shared.js
    ShowcaseLayout.astro    ← wraps BaseLayout; renders BackButton + slot + DBCredit
  components/
    BackButton.astro        ← .back-btn; accepts color + background props
    DBCredit.astro          ← .db-credit footer div; no props
  pages/
    index.astro             ← hub page (uses BaseLayout)
    showcase/
      bakery.astro          ← approved redesign (uses ShowcaseLayout)
      plumber.astro         ← as-is port (uses ShowcaseLayout)
      salon.astro           ← as-is port (uses ShowcaseLayout)
  styles/
    shared.css              ← moved from styles/shared.css
    hub.css                 ← moved from styles/hub.css
  scripts/
    shared.js               ← moved from js/shared.js (Astro-bundled)
    main.js                 ← moved from js/main.js (Astro-bundled)
```

URLs are unchanged: `/` for hub, `/showcase/bakery`, `/showcase/plumber`, `/showcase/salon`.

**Note on `public/`:** The current static site has no local image or font assets (all images are Unsplash CDN URLs). Check for a favicon at the project root and move it to `public/` if one exists. Otherwise `public/` is initially empty.

---

## Layouts

### BaseLayout.astro

Props: `title: string`, `description?: string`

- Renders the full `<html lang="en">` document shell
- `<head>` contains (in order):
  - `<meta charset="UTF-8" />`
  - `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`
  - `<title>{title}</title>`
  - If `description` prop is provided: `<meta name="description" content={description} />`. If omitted, the tag is not rendered.
  - Google Fonts preconnect hints (`fonts.googleapis.com`, `fonts.gstatic.com`) — placed **before** the `head` slot so preconnects are always established early, reducing FOUT on all pages
  - `<slot name="head" />` — allows pages to inject additional `<head>` content (used by `index.astro` for hub font `<link>` tags; showcase pages inject their own font `<link>` tags here instead of relying solely on CSS `@import`, which loads fonts later and worsens FOUT)
- Imports `shared.css` in frontmatter: `import '../styles/shared.css'`
- Imports `shared.js` via a `<script>` tag in the component: `import '../scripts/shared.js'` inside a `<script>` block — Astro bundles it as a deferred ES module. The `DOMContentLoaded` listener inside `shared.js` is safe: Astro emits `type="module"` scripts which are deferred, and `DOMContentLoaded` fires *after* deferred/module scripts execute, so the listener registers before the event fires.
- `<slot />` in `<body>` for page content

### ShowcaseLayout.astro

Props: `title: string`, `description?: string`, `backColor: string`, `backBg: string`

- Wraps `BaseLayout`, passing `title` and `description` through
- Body structure inside the `<slot />` it passes to `BaseLayout` (in order):
  1. `<BackButton color={backColor} background={backBg} />` — rendered first
  2. `<slot />` — showcase page content
  3. `<DBCredit />` — rendered last
- Does **not** separately load `shared.js` — `BaseLayout` handles it

---

## Components

### BackButton.astro

Props: `color: string`, `background: string`

Renders the `.back-btn` anchor pointing to `/` (root-relative — correct in Astro's routing). The SVG arrow and "DB Design" text are included in the component markup (identical to the current static files). The `color` and `background` props are applied as inline styles on the anchor element, overriding the base `.back-btn` rules from `shared.css`. Border is not a prop — it is handled by each showcase page's `.back-btn` rule in their `<style is:global>` block.

Prop values per page:

| Page | `backColor` | `backBg` | Border (in page `<style is:global>`) |
|------|-------------|----------|--------------------------------------|
| `bakery.astro` | `#4A3728` | `rgba(253, 246, 236, 0.85)` | `1px solid var(--border)` |
| `plumber.astro` | `#FFFFFF` | `#1A2744` | `none` |
| `salon.astro` | `#E8D5C4` | `rgba(28, 20, 16, 0.85)` | `1px solid var(--border)` |

For the bakery page: the bakery implementation plan rewrites all CSS from scratch. The agent must ensure the new `<style is:global>` block in `bakery.astro` includes a `.back-btn { border: 1px solid var(--border); }` rule. This rule exists in the current `bakery.html` and must be carried forward — it is not part of `shared.css`.

### DBCredit.astro

No props. Renders:

```html
<div class="db-credit">
  Website rebuilt by <a href="/">DB Design</a> as part of our AI vibe coding volunteer initiative.
</div>
```

The href is `/` (root-relative), not `../index.html`. Astro's static routing resolves `/` to the hub page correctly. The `.db-credit` element is styled per-page via each showcase page's `<style is:global>` block — no styles live in this component file.

---

## CSS Strategy

- `shared.css` — imported in `BaseLayout.astro` frontmatter (`import '../styles/shared.css'`). Applies globally to all pages.
- `hub.css` — imported in `index.astro` frontmatter only (`import '../styles/hub.css'`). Must not be imported in `BaseLayout` — it would bleed onto showcase pages.
- **Hub fonts (Playfair Display, DM Sans):** `index.astro` injects Google Fonts `<link>` tags via `<link slot="head" ...>` into `BaseLayout`'s named head slot. These tags live only in `index.astro`.
- **Showcase page fonts:** Each showcase page injects its own Google Fonts `<link>` tags via `<link slot="head" ...>` into `ShowcaseLayout` → `BaseLayout`'s named head slot. This ensures fonts load early (before CSS is parsed), reducing FOUT. Any existing CSS `@import url(...)` for fonts in the showcase `<style is:global>` blocks should be removed to avoid duplicate requests.
- Each showcase page's existing `<style>` block moves verbatim into its `.astro` file wrapped in `<style is:global>`. Astro scopes `<style>` blocks by default, which breaks `:root` CSS custom property declarations and global class selectors — `is:global` bypasses scoping entirely, preserving identical behavior to the current static files.

---

## JS Strategy

Scripts live in `src/scripts/` and are imported into Astro `<script>` blocks. Astro bundles them as deferred ES modules — minified, content-hashed, and deduplicated across pages.

- **`shared.js`** — imported in `BaseLayout.astro` via `<script>` block: `import '../scripts/shared.js'`. Runs on every page. The `DOMContentLoaded` listener inside is safe with Astro's module bundling (see BaseLayout section above).
- **`main.js`** — imported in `index.astro` via `<script>` block: `import '../scripts/main.js'`. Hub only.
- **Bakery inline scripts** (date rendering, tab scroll, IntersectionObserver) — defined in the bakery implementation plan; used verbatim in `bakery.astro` with `<script is:inline>`. These manipulate specific DOM elements by ID and are placed at the bottom of the body (DOM already available), so `is:inline` is correct here. These are the scripts from the **implementation plan**, not from the current `bakery.html` (which has only a nav scroll listener).

---

## Bakery Page

`bakery.astro` uses `ShowcaseLayout` with:

```astro
<ShowcaseLayout
  title="Sweet Crumb Bakery — Rebuilt by DB Design"
  description="Sweet Crumb Bakery — artisan baked goods and café in the heart of our community."
  backColor="#4A3728"
  backBg="rgba(253, 246, 236, 0.85)"
>
```

Page content follows the approved bakery redesign spec and implementation plan in full:
1. Slim split hero (copy left, photo right, gradient caption overlay)
2. Today's Specials strip
3. Tabbed menu with sticky tab bar (Pastries / Breads / Sandwiches / Beverages)
4. About section with square photo
5. Hours section

All HTML from the bakery redesign implementation plan is used verbatim. Astro-specific adaptations only:
- File extension `.astro` instead of `.html`
- `<style>` → `<style is:global>` (ensure `.back-btn` border rule is included — see BackButton section)
- Inline `<script>` → `<script is:inline>`
- Remove `<link rel="stylesheet" href="../styles/shared.css">` — provided by `BaseLayout`
- Remove `<script src="../js/shared.js"></script>` — provided by `BaseLayout`
- Remove `.back-btn` markup — rendered by `ShowcaseLayout` via `BackButton`
- Remove `.db-credit` markup — rendered by `ShowcaseLayout` via `DBCredit`

Plumber and salon receive the same structural treatment — port as-is, no redesign.

---

## Build & Deploy

- **Astro config:** `output: 'static'`, `outDir: 'dist'`
- **Build command:** `npm run build` — matches Coolify config, no changes needed
- **Output directory:** `dist` — matches Coolify config

### Files deleted after migration

Once `npm run dev` shows the site working correctly across all pages:
- `styles/` directory (contents moved to `src/styles/`)
- `js/` directory (contents moved to `src/scripts/`)
- `index.html`
- `showcase/` directory (contents moved to `src/pages/showcase/`)

Git history preserves all originals.

---

## Out of Scope

- Sanity CMS integration (separate future migration)
- Any visual design changes to plumber or salon pages
- Mobile refinements beyond those specified in the bakery redesign spec
- New showcase pages
- TypeScript configuration (plain JS is fine for this migration)
