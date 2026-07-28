# Live Client Work Section — Design

**Date:** 2026-07-28
**Status:** Approved by Dreux (pending spec review)
**Repo:** `db-design-website` (cincinnatiwebfoundry.com hub)

## Problem

The homepage has one `Featured Work` section (`src/pages/index.astro:81`) containing
three fictional businesses — Sweet Crumb Bakery, Peak Flow Plumbing, Lumière Salon —
with invented domains rendered in the card chrome bar (`sweetcrumbbakery.com`).

The Web Foundry now has three real Cincinnati client sites live. Showing real work is
stronger proof than showing concepts, and the current heading ("Featured Work" over
fictional businesses) becomes an active liability once prospects can verify some of
the work is real: a visitor who clicks Peak Flow, realizes it is invented, and scrolls
back will discount the real clients too.

## Non-goal: replacing the concept pages

The three showcase pages are **not** marketing screenshots — they are the fork template.
`CLAUDE.md:7` defines this site as demonstrating capabilities *and serving as the
template for future client sites*, and the Multi-Tenant Architecture section defines
every client site as a fork of this repo. The three pages are curated mechanism
exemplars spanning the service categories:

| Page | Mechanism class demonstrated |
|------|------------------------------|
| bakery | Sanity-driven menu + specials, ordering embed (GloriaFood) |
| plumber | Service-request ticket form, Stripe Payment Link |
| salon | Calendly booking embed, Sanity gallery |

`docs/showcase-enhancements-proposal.md:63` records the deliberate decision *not* to add
a fourth `restaurant.astro` because bakery already covers that mechanism class. Removing
the concept pages would delete the template library and orphan the approved-but-unbuilt
Batch 1 work in that proposal.

The concept pages are also the stronger *interactive* proof: a prospect can book a real
Calendly slot and pay a test invoice there. Real client sites are links out; concepts are
things you can drive.

**Decision: add real client work alongside the concepts. Do not remove or replace them.**

## Design

### 1. Section split

`index.astro` splits the single `Featured Work` section into two, real work first:

| Order | Section id | Tag | Heading | Contents |
|---|---|---|---|---|
| 1 | `#work` | Our Clients | Real Cincinnati businesses. Live today. | MAB Assets, Terry's Lawncare, ITA Data |
| 2 | `#concepts` | Concepts | What we can build for you. | Sweet Crumb, Peak Flow, Lumière (unchanged) |

Ordering rationale: the real row answers "are these people legit"; the concepts row
answers "what could mine look like." Proof, then range.

Both sections sit above `#process` (`index.astro:212`). The concepts section reuses the
`.work` section styles — same `--surface` background, same `.work-grid`, same
`.section-header` markup. Alternating the two section backgrounds is a visual decision
deferred to implementation; if both use `--surface` they will read as one long block and
need a divider or a background swap on the second.

### 2. Honesty labelling (required)

Concept cards each gain a "Concept" badge in the card info block, and the concepts
`.section-sub` states plainly that these are demonstration builds for fictional
businesses. Once the framing is unambiguous the invented chrome-bar URLs may stay.

This is not cosmetic — it is the change that protects the real cards' credibility, and
it must ship in the same change as the real cards, never after.

### 3. Real-client card treatment

Real cards reuse `.work-card` wholesale (chrome bar, dots, hover lift, info block) with
four deltas:

- **`href`** — external, `target="_blank" rel="noopener"`, with an `aria-label` stating
  the link opens the live site in a new tab.
- **`.work-card__url`** — the real domain. This is already how the markup works; only
  the value changes.
- **Preview** — new `.work-card__preview--shot` modifier: `padding: 0`, image at
  `object-fit: cover; object-position: top center`, inheriting the existing
  `height: 250px` from `.work-card__preview` (`src/styles/hub.css:512`).
- **Footer link** — "Visit the live site ↗" rather than "View Site →".

Chips list capabilities actually shipped for that client (Sanity CMS, contact forms,
mobile-first, etc.), not generic adjectives.

### 4. Screenshot capture

New `scripts/capture-shots.mjs`, run manually via an added `npm run shots` script.
**Not wired into `npm run build`** — a build must never depend on three live
third-party sites being reachable.

- Uses the existing `playwright` devDependency (`package.json`, v1.61.1; chromium
  already present in `~/.cache/ms-playwright`). No new packages.
- Viewport 1440×900, `deviceScaleFactor: 2`.
- Wait for network idle **and** `document.fonts.ready` before capture, so webfonts are
  not missing from the shot.
- Clip to the top 900px (not full-page).
- Output `src/assets/work/<slug>.png`, rendered through Astro's `<Image>` from
  `astro:assets` (sharp already present via Astro) so the build emits optimized webp
  with explicit width/height — no layout shift.
- A fixed viewport means all three shots share an aspect ratio, so the grid stays even
  without a forced crop.
- Committed screenshots are refreshed manually by re-running the script when a client
  site changes materially.

### 5. Config

`src/config/site.js` gains a `clients` array; the real cards render by mapping over it.
Each entry: `slug`, `name`, `industry`, `domain` (display string for the chrome bar),
`url` (href), `blurb`, `chips[]`, `shot` (imported image).

This follows the fork-swappable config convention CLAUDE.md already mandates
(`CLAUDE.md:65`) and keeps every client-specific string in one file.

### 6. ITA Data domain handling

`itadata.com` currently serves the client's **old** website (verified 2026-07-28:
title `ITA Data Solutions | Plan, Build, Launch, Run, Optimize`, versus the Web Foundry
build at `itadata.site`, title `ITA Data Solutions: SAP Supply Chain Experts`). The
`.com` cutover is in progress but not complete.

**The card ships pointing at `itadata.site`.** Pre-filling `itadata.com` would link
prospects from the credibility section to a website The Web Foundry did not build.

The config entry carries a loud marker — matching the placeholder pattern already used
in `docs/showcase-enhancements-proposal.md:81` for Stripe/Calendly:

```js
// TODO(dreux): after the itadata.com cutover completes, swap domain + url to
// 'itadata.com'. Do NOT swap early — .com still serves the client's old site.
domain: 'itadata.site',
url: 'https://itadata.site',
```

Post-cutover this is a two-line edit in one file. The screenshot must be re-captured at
the same time if the cutover changes anything visible.

### 7. Navigation

`index.astro:22` nav gains a second entry so both sections are reachable:

- `Our Work` → `#work` (unchanged target, now the real-client section)
- `Concepts` → `#concepts`

Hero CTA (`index.astro:47`) and footer link (`index.astro:368`) keep pointing at
`#work`, which now lands on real client work — an improvement, not a regression.

## Client sites featured

| Client | Domain | Verified live 2026-07-28 | Notes |
|---|---|---|---|
| MAB Assets | mabassets.com | HTTP 200 | Fully launched per `clients/mabassets-website/CLAUDE.md` |
| Terry's Lawncare | terryslawncare.us | HTTP 200 | |
| ITA Data Solutions | itadata.site | HTTP 200 | `.com` cutover pending — see §6 |

**Excluded deliberately:** Megan Brys and Winnie's World are personal sites for private
individuals, not businesses. They stay off the marketing site.

**Client permission:** Dreux confirmed (2026-07-28) all three are cleared to appear.

## Copy guardrail

Per `docs/showcase-enhancements-proposal.md:150` — copy referring to The Web Foundry
itself must never describe the service as "free." Community-project pricing, not a
giveaway. Applies to any new section copy written here.

## Out of scope

- Case-study pages (`/work/<slug>`). Real cards link straight to the live sites for now.
  Revisit once before/after screenshots and client quotes exist.
- Automating screenshot refresh in CI or on a schedule.
- Any change to the three showcase pages' own content or the Batch 1 features in
  `docs/showcase-enhancements-proposal.md`.
