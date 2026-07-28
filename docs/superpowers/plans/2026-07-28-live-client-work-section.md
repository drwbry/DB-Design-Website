# Live Client Work Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the homepage's single `Featured Work` section into a real-client-work section (MAB Properties, Terry's Lawncare, ITA Data — real screenshots, outbound links) followed by a clearly-labelled concepts section holding the three existing showcase demos.

**Architecture:** Client data lives as plain strings in `src/config/site.js`. A manually-run Playwright script captures each live site at a fixed viewport into `src/assets/work/`. `index.astro` maps over the config to render real-client cards that reuse the existing `.work-card` component, with a new `--shot` preview modifier that swaps the hand-built CSS mock for an `<Image>`. The existing demo grid moves into a second `#concepts` section, visually stepped down and explicitly labelled as demonstration builds.

**Tech Stack:** Astro 5 (static output), `astro:assets` (`<Image>`, backed by sharp), Playwright 1.61 (existing devDependency), plain CSS in `src/styles/hub.css`.

**Spec:** `docs/superpowers/specs/2026-07-28-live-client-work-section-design.md`

## Global Constraints

- **No test framework exists in this repo** and none is being added — a static marketing site does not warrant one. Every task's verification is `npm run build` succeeding plus explicit assertions (`grep`) against the emitted `dist/index.html`, with a Playwright visual pass in Task 5. Never claim a step passed without pasting the command output.
- **Copy guardrail** (`docs/showcase-enhancements-proposal.md:150`): copy referring to The Web Foundry itself must **never** describe the service as "free." Community-project pricing, not a giveaway.
- **`src/config/site.js` stays string-only.** It is imported by `astro.config.mjs`, by client-side JS, and (as of Task 1) by a plain Node script. Do **not** add image imports or any Astro-specific import to it — image imports belong in `index.astro` frontmatter.
- **Do not merge before Task 3 is done.** Task 3 carries the concept-page honesty labelling. Real client cards must never ship to production alongside unlabelled fictional businesses.
- **ITA Data points at `itadata.site`, not `itadata.com`.** `.com` still serves the client's old (non-Foundry) site as of 2026-07-28. Do not "helpfully" correct this.
- Client display name is **MAB Properties**. `mabassets` is the slug and domain only.
- Existing conventions in `CLAUDE.md` apply: no `to_email` field on forms, `site_id` on every form, fork-swappable values in `site.js`.

## Prerequisite (blocking Task 2 only)

`mabassets.com` must no longer show the "Welcome! This site is under construction – come back soon!" announcement bar. Dreux updated the Sanity announcement on 2026-07-28 but had not yet pushed/rebuilt. **Before running the capture in Task 2, verify the live site:**

```bash
curl -s -L https://mabassets.com | grep -ci "under construction"
```

Expected `0`. If it returns `1`, stop and wait for the Coolify rebuild. Tasks 1 and 3 do not depend on this and can proceed; only Task 4 needs the resulting screenshots.

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `src/config/site.js` | Modify | Add `clients` array — string-only data for the three live client sites |
| `scripts/capture-shots.mjs` | Create | Manually-run Playwright capture, reads URLs from `site.js` |
| `package.json` | Modify | Add `shots` script |
| `src/assets/work/*.png` | Create | Three committed screenshots |
| `src/pages/index.astro` | Modify | Section split, real-client card markup, nav |
| `src/styles/hub.css` | Modify | `.work-card__preview--shot`, `.concepts`, `.work-card__badge` |
| `src/components/BackButton.astro` | Modify | Return to `/#concepts` |

---

### Task 1: Client config

**Files:**
- Modify: `src/config/site.js`

**Interfaces:**
- Produces: `siteConfig.clients` — array of `{ slug, name, industry, domain, url, blurb, chips }`, all strings/string-arrays. `slug` matches the screenshot filename. Consumed by `scripts/capture-shots.mjs` (Task 2) and `index.astro` (Task 4).

- [ ] **Step 1: Add the `clients` array**

In `src/config/site.js`, insert a `clients` array immediately before the existing `showcase` key:

```js
  // Real client sites, live in production. Rendered as the #work section on the
  // hub homepage. HUB-ONLY — a client fork inherits this and should delete it,
  // same as the `showcase` block below.
  clients: [
    {
      slug: 'mabassets',
      name: 'MAB Properties',
      industry: 'Property Management',
      domain: 'mabassets.com',
      url: 'https://mabassets.com',
      blurb: 'Rental listings the owner updates herself, plus maintenance tickets and showing scheduling.',
      chips: ['Sanity CMS', 'Service Tickets', 'Showing Scheduler'],
    },
    {
      slug: 'terrys-lawncare',
      name: "Terry's Lawncare",
      industry: 'Lawn & Landscaping',
      domain: 'terryslawncare.us',
      url: 'https://terryslawncare.us',
      blurb: 'Group mowing schedule, service pricing, and reviews — all client-editable.',
      chips: ['Mowing Schedule', 'Sanity CMS', 'Estimate Form'],
    },
    {
      // TODO(dreux): after the itadata.com cutover completes, swap `domain` and
      // `url` to itadata.com and re-run `npm run shots`. Do NOT swap early —
      // .com still serves the client's old, pre-Foundry site.
      slug: 'itadata',
      name: 'ITA Data Solutions',
      industry: 'SAP Consulting',
      domain: 'itadata.site',
      url: 'https://itadata.site',
      blurb: 'Enterprise B2B site with gated white papers and a discovery-call funnel.',
      chips: ['White Paper Library', 'Sanity CMS', 'Lead Capture'],
    },
  ],
```

Every chip above corresponds to a feature that is actually live on that site (verified against each client repo's CLAUDE.md). Do not add aspirational chips — notably **not** "Rent Payments" for MAB: its Stripe link is still a `REPLACE_ME` placeholder.

- [ ] **Step 2: Verify the config parses and stays string-only**

Run:
```bash
node -e "
import('./src/config/site.js').then(({siteConfig}) => {
  console.log(siteConfig.clients.length, 'clients');
  for (const c of siteConfig.clients) console.log(c.slug, '→', c.url, '|', c.chips.join(', '));
});
"
```
Expected: `3 clients` then one line per client. Plain Node importing it proves no Astro-only syntax leaked in.

- [ ] **Step 3: Verify the existing build still works**

Run: `npm run build`
Expected: build completes, no errors. (Nothing consumes `clients` yet — this only proves the config edit broke nothing.)

- [ ] **Step 4: Commit**

```bash
git add src/config/site.js
git commit -m "feat: add live client site config"
git push
```

---

### Task 2: Screenshot capture script

**Files:**
- Create: `scripts/capture-shots.mjs`
- Modify: `package.json` (scripts block)
- Create: `src/assets/work/mabassets.png`, `src/assets/work/terrys-lawncare.png`, `src/assets/work/itadata.png`

**Interfaces:**
- Consumes: `siteConfig.clients` from Task 1 — reads `slug` and `url`.
- Produces: three PNGs at 2048×1280 device px, named `<slug>.png`, consumed by Task 4.

- [ ] **Step 1: Confirm the MAB prerequisite is clear**

Run:
```bash
curl -s -L https://mabassets.com | grep -ci "under construction"
```
Expected: `0`. If it returns `1`, stop — the Sanity change has not rebuilt yet. Do not capture.

- [ ] **Step 2: Create the capture script**

Create `scripts/capture-shots.mjs`:

```js
// Manually-run screenshot capture for the live-client work cards.
// NOT part of `npm run build` — a build must never depend on three live
// third-party sites being reachable. Re-run when a client site changes
// materially, then commit the updated PNGs.
//
// Usage: npm run shots
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { siteConfig } from '../src/config/site.js';

const OUT_DIR = fileURLToPath(new URL('../src/assets/work/', import.meta.url));

// 1024 rather than 1440: the card preview slot is ~383x250 CSS px, and a
// 1440-wide capture downscales ~3.8x into it — body text lands around 4px.
// Verified 2026-07-28 against all three sites. See the design spec, section 4.
const VIEWPORT = { width: 1024, height: 640 };

await mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
let failures = 0;

for (const client of siteConfig.clients) {
  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 2 });
  try {
    // 'load', not 'networkidle' — embedded third-party widgets (Calendly,
    // Turnstile) hold connections open and networkidle never fires.
    await page.goto(client.url, { waitUntil: 'load', timeout: 45000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(OUT_DIR, `${client.slug}.png`),
      type: 'png',
    });
    console.log(`✓ ${client.slug}  ←  ${client.url}`);
  } catch (err) {
    failures++;
    console.error(`✗ ${client.slug}  ←  ${client.url}\n  ${err.message}`);
  } finally {
    await page.close();
  }
}

await browser.close();

if (failures > 0) {
  console.error(`\n${failures} capture(s) failed — existing PNGs left untouched.`);
  process.exit(1);
}
console.log(`\nCaptured ${siteConfig.clients.length} screenshots to src/assets/work/`);
```

- [ ] **Step 3: Add the npm script**

In `package.json`, add to the `scripts` block (after `"preview"`):

```json
    "shots": "node scripts/capture-shots.mjs"
```

- [ ] **Step 4: Run the capture**

Run: `npm run shots`

Expected: three `✓` lines and `Captured 3 screenshots to src/assets/work/`. Exit code 0.

If any line shows `✗`, do not proceed — a missing screenshot will fail the Task 4 build.

- [ ] **Step 5: Verify the captured images**

Run:
```bash
ls -la src/assets/work/ && node -e "
const sharp = require('sharp');
for (const f of ['mabassets','terrys-lawncare','itadata'])
  sharp('src/assets/work/'+f+'.png').metadata().then(m => console.log(f, m.width+'x'+m.height));
"
```
Expected: three files, each `2048x1280`.

Then **open each PNG and look at it.** Confirm: fonts rendered (not fallback serif), no cookie banner or chat widget overlaying the hero, no "under construction" text on MAB, desktop nav visible (not a hamburger). If a site renders a hamburger at 1024, bump that site to 1280 per the spec's caveat and re-run.

- [ ] **Step 6: Commit**

```bash
git add scripts/capture-shots.mjs package.json src/assets/work/
git commit -m "feat: add live client site screenshot capture script"
git push
```

---

### Task 3: Section split and concept labelling

**Files:**
- Modify: `src/pages/index.astro:21-26` (nav), `src/pages/index.astro:81-209` (work section)
- Modify: `src/styles/hub.css` (after the `.work-card__link` rule, ~line 686; and the responsive block at 694-701)
- Modify: `src/components/BackButton.astro:4`

**Interfaces:**
- Produces: a `<section class="work" id="work">` containing only the real-clients `.section-header` and an empty `.work-grid` (cards land in Task 4), followed by `<section class="concepts" id="concepts">` containing the three existing demo cards.

- [ ] **Step 1: Replace the section header and open the concepts section**

In `src/pages/index.astro`, replace lines 81-90 (from `<section class="work" id="work">` through the blank line after `<div class="work-grid">`) with:

```astro
  <!-- ── Real client work ── -->
  <section class="work" id="work">
    <div class="container">
      <div class="section-header reveal">
        <span class="section-tag">Our Clients</span>
        <h2 class="section-title">Real Cincinnati businesses. Live today.</h2>
        <p class="section-sub">Sites we built, launched, and still maintain. Click any one to visit it.</p>
      </div>

      <div class="work-grid">
        <!-- Real client cards render here in Task 4 -->
      </div>
    </div>
  </section>

  <!-- ── Concept builds ── -->
  <section class="concepts" id="concepts">
    <div class="container">
      <div class="section-header reveal">
        <span class="section-tag">Concepts</span>
        <h2 class="section-title">What we could build for you.</h2>
        <p class="section-sub">Demonstration builds for invented businesses — different trades, different aesthetics. Every feature in them works: book a slot, send a request, pay a test invoice.</p>
      </div>

      <div class="work-grid">

```

The three existing demo `<a class="work-card">` blocks (originally lines 91-205) now sit inside the concepts grid unchanged. The closing `</div></div></section>` at lines 207-209 closes the concepts section.

- [ ] **Step 2: Add a "Concept" badge to each demo card**

In each of the three demo cards, inside `.work-card__info`, replace the `<div class="work-card__tag">…</div>` line with a tag row carrying the badge. For the bakery card (originally line 117):

```astro
            <div class="work-card__tagrow">
              <span class="work-card__tag">Bakery &amp; Café</span>
              <span class="work-card__badge">Concept</span>
            </div>
```

For the plumber card (originally line 157):

```astro
            <div class="work-card__tagrow">
              <span class="work-card__tag">Home Services</span>
              <span class="work-card__badge">Concept</span>
            </div>
```

For the salon card (originally line 195):

```astro
            <div class="work-card__tagrow">
              <span class="work-card__tag">Beauty &amp; Wellness</span>
              <span class="work-card__badge">Concept</span>
            </div>
```

- [ ] **Step 3: Add the CSS for the concepts section, tag row, and badge**

In `src/styles/hub.css`, insert after the `.work-card__link` rule (ends ~line 686, before the `@media (max-width: 1024px)` block):

```css
/* ============================================================
   CONCEPTS (demonstration builds)
   ============================================================ */
.concepts {
  background: var(--ink);
  border-top: 1px solid var(--hairline);
  padding: 5.5rem 0 6rem;
}

.work-card__tagrow {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
}

/* .work-card__tag carries its own margin-bottom for the real-client cards,
   which have no badge; inside a tagrow the row owns the spacing. */
.work-card__tagrow .work-card__tag {
  margin-bottom: 0;
}

.work-card__badge {
  font-size: 0.5625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #8a94a4;
  background: #f0eee9;
  border-radius: 100px;
  padding: 0.15rem 0.5rem;
}
```

Then in the existing `@media (max-width: 768px)` block (line 694), add `.concepts` alongside `.work`:

```css
  .work,
  .concepts {
    padding: 4rem 0 4.5rem;
  }
```

- [ ] **Step 4: Add the nav entry**

In `src/pages/index.astro`, replace the nav list item at line 22 with two entries:

```astro
        <li><a href="#work" class="nav__link">Our Work</a></li>
        <li><a href="#concepts" class="nav__link">Concepts</a></li>
```

- [ ] **Step 5: Point the showcase back button at the concepts section**

In `src/components/BackButton.astro`, line 4, change the href:

```astro
<a href="/#concepts" class="back-btn" style={`color: ${color}; background: ${background};`}>
```

- [ ] **Step 6: Build and assert the structure**

Run:
```bash
npm run build && \
grep -c 'id="concepts"' dist/index.html && \
grep -c 'work-card__badge' dist/index.html && \
grep -c 'Real Cincinnati businesses' dist/index.html && \
grep -o 'href="/#concepts"' dist/showcase/plumber/index.html
```
Expected: build succeeds, then `1`, `3`, `1`, `href="/#concepts"`.

- [ ] **Step 7: Confirm no orphaned markup**

Run:
```bash
npx astro check 2>&1 | tail -5
```
Expected: no errors. (If `astro check` is not installed it will prompt to install — decline and instead confirm `npm run build` emitted no warnings about unclosed tags.)

- [ ] **Step 8: Commit**

```bash
git add src/pages/index.astro src/styles/hub.css src/components/BackButton.astro
git commit -m "feat: split work section, label concept builds explicitly"
git push
```

---

### Task 4: Real client cards

**Files:**
- Modify: `src/pages/index.astro` (frontmatter + the empty `.work-grid` from Task 3)
- Modify: `src/styles/hub.css` (after the `.work-card__preview--salon` rule, ~line 530)

**Interfaces:**
- Consumes: `siteConfig.clients` (Task 2), `src/assets/work/<slug>.png` (Task 1), the empty real-client `.work-grid` (Task 3).

- [ ] **Step 1: Import the images and build a slug→image map**

In `src/pages/index.astro` frontmatter (lines 1-5), add:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { Image } from 'astro:assets';
import '../styles/hub.css';
import { siteConfig } from '../config/site.js';

// Screenshots are imported here rather than referenced from site.js: that
// config is also loaded by astro.config.mjs, by client-side JS, and by
// scripts/capture-shots.mjs under plain Node, none of which can resolve
// image imports. Keyed by client slug.
import shotMabassets from '../assets/work/mabassets.png';
import shotTerrys from '../assets/work/terrys-lawncare.png';
import shotItadata from '../assets/work/itadata.png';

const clientShots = {
  'mabassets': shotMabassets,
  'terrys-lawncare': shotTerrys,
  'itadata': shotItadata,
};
---
```

- [ ] **Step 2: Render the cards**

Replace the placeholder comment inside the real-client `.work-grid` (Task 3, Step 1) with:

```astro
        {siteConfig.clients.map((client, i) => (
          <a
            href={client.url}
            target="_blank"
            rel="noopener"
            class={`work-card reveal reveal-delay-${i + 1}`}
            aria-label={`Visit ${client.name} at ${client.domain} (opens in a new tab)`}
          >
            <div class="work-card__bar">
              <div class="work-card__dots">
                <span class="work-card__dot work-card__dot--red"></span>
                <span class="work-card__dot work-card__dot--yellow"></span>
                <span class="work-card__dot work-card__dot--green"></span>
              </div>
              <div class="work-card__url">{client.domain}</div>
            </div>
            <div class="work-card__preview work-card__preview--shot">
              <Image src={clientShots[client.slug]} alt="" width={766} height={479} loading="lazy" />
            </div>
            <div class="work-card__info">
              <div class="work-card__tag">{client.industry}</div>
              <h3 class="work-card__name">{client.name}</h3>
              <p class="work-card__desc">{client.blurb}</p>
              <div class="work-card__chips">
                {client.chips.map((chip) => <span class="chip">{chip}</span>)}
              </div>
              <span class="work-card__link">Visit the live site ↗</span>
            </div>
          </a>
        ))}
```

`alt=""` is correct here: the image is decorative relative to the card, whose destination is already stated by the `aria-label`, the visible business name, and the domain in the chrome bar. A described alt would make screen readers announce the same site three times.

- [ ] **Step 3: Add the `--shot` preview CSS**

In `src/styles/hub.css`, insert immediately after the `.work-card__preview--salon` rule (~line 530):

```css
/* Real client cards: a screenshot fills the preview slot instead of the
   hand-built mock markup the concept cards use. */
.work-card__preview--shot {
  padding: 0;
  background: #11141d;
}

.work-card__preview--shot img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
  display: block;
}
```

`.work-card__preview` already sets `height: 250px` and `overflow: hidden` (line 512), so both card types stay the same height.

- [ ] **Step 4: Build and assert the cards rendered**

Run:
```bash
npm run build && \
grep -c 'work-card__preview--shot' dist/index.html && \
grep -c 'target="_blank"' dist/index.html && \
grep -o 'https://mabassets.com\|https://terryslawncare.us\|https://itadata.site' dist/index.html | sort -u && \
grep -c 'itadata.com' dist/index.html
```
Expected: build succeeds, then `3`, `3`, the three URLs listed once each, and `0` for `itadata.com` — that last one is the guard against the premature domain swap.

- [ ] **Step 5: Confirm images were optimized**

Run:
```bash
ls -la dist/_astro/ | grep -i "mabassets\|terrys\|itadata"
```
Expected: three hashed image files. Astro emits webp by default; if they are `.png`, sharp did not run — check that `sharp` resolves (`node -e "require('sharp')"`) before continuing.

- [ ] **Step 6: Commit**

```bash
git add src/pages/index.astro src/styles/hub.css
git commit -m "feat: add live client work cards with real screenshots"
git push
```

---

### Task 5: Visual and accessibility verification

**Files:**
- No source changes expected. Any defect found here is fixed and committed within this task.

**Interfaces:**
- Consumes: the completed build from Task 4.

- [ ] **Step 1: Serve the built site**

Run: `npm run preview`
Note the URL (default `http://localhost:4321`). Leave it running in the background.

- [ ] **Step 2: Capture the page at three widths**

Create `verify-shot.mjs` **at the repo root** — it must live inside the repo so Node resolves `playwright` from `node_modules`; running it from `/tmp` fails with `ERR_MODULE_NOT_FOUND`. It is a throwaway and gets deleted in Step 6 — do **not** commit it, and do not put it in `scripts/`, which is for committed tooling.

```js
import { chromium } from 'playwright';
const browser = await chromium.launch();
for (const width of [375, 768, 1440]) {
  const page = await browser.newPage({ viewport: { width, height: 1400 }, deviceScaleFactor: 1 });
  await page.goto('http://localhost:4321/', { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
  await page.locator('#work').scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `verify-${width}.png`, fullPage: true });
  console.log('captured', width);
  await page.close();
}
await browser.close();
```

Run it, then **open each PNG and look at it.**

- [ ] **Step 3: Check against this list**

- [ ] Real-client row appears **above** the concepts row
- [ ] All three screenshots are legible at card size — headline and nav readable, not blurry
- [ ] Both rows' cards are the same height; screenshots are not stretched or letterboxed
- [ ] The two sections read as distinct (the `--surface` → `--ink` step is visible)
- [ ] Each concept card shows a "Concept" badge next to its industry tag
- [ ] No "under construction" text visible in the MAB screenshot
- [ ] At 375px both grids are single-column and nothing overflows horizontally
- [ ] MAB card reads "MAB Properties", not "MAB Assets"

- [ ] **Step 4: Verify link behavior in a real browser**

With `npm run preview` running, confirm by clicking:
- [ ] Each real-client card opens the live site in a **new** tab
- [ ] Each concept card navigates in the **same** tab to `/showcase/...`
- [ ] The back button on a showcase page returns to the homepage scrolled to the concepts row
- [ ] Nav "Our Work" jumps to real clients; "Concepts" jumps to the demos

- [ ] **Step 5: Accessibility spot-check**

Run:
```bash
grep -o 'aria-label="Visit [^"]*"' dist/index.html
```
Expected: three labels, each naming the business and saying "opens in a new tab".

Then tab through the two grids with the keyboard and confirm each card takes focus with a visible ring (`.work-card:focus-visible` is defined at `hub.css:474`).

- [ ] **Step 6: Clean up and push**

```bash
rm -f verify-*.png verify-shot.mjs
git status --short   # expect: clean, or only intended fixes
git push
```

- [ ] **Step 7: Update the spec status**

In `docs/superpowers/specs/2026-07-28-live-client-work-section-design.md`, change the `**Status:**` line to `Implemented 2026-07-28 — see docs/superpowers/plans/2026-07-28-live-client-work-section.md`.

```bash
git add docs/superpowers/specs/2026-07-28-live-client-work-section-design.md
git commit -m "docs: mark live-client-work spec implemented"
git push
```

---

## Post-launch follow-ups (not part of this plan)

- **ITA `.com` cutover.** When `itadata.com` starts serving the Foundry build: swap `domain` and `url` in the `itadata` config entry, run `npm run shots`, commit both. Two-line change plus a screenshot.
- **Screenshot staleness.** Nothing detects a client redesigning their site. Re-run `npm run shots` when you touch a client repo.
- **Case-study pages** (`/work/<slug>`) remain out of scope per the spec — revisit once before/after screenshots and client quotes exist.
