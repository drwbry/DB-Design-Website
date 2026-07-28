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
| 1 | `#work` | Our Clients | Real Cincinnati businesses. Live today. | MAB Properties, Terry's Lawncare, ITA Data |
| 2 | `#concepts` | Concepts | What we can build for you. | Sweet Crumb, Peak Flow, Lumière (unchanged) |

Ordering rationale: the real row answers "are these people legit"; the concepts row
answers "what could mine look like." Proof, then range.

Both sections sit above `#process` (`index.astro:212`). The concepts section reuses the
`.work-grid` and `.section-header` markup.

**Background treatment (decided):** `#work` keeps `background: var(--surface)` (#1e2333,
as `.work` is today); `#concepts` uses `background: var(--ink)` (#181c28) with
`border-top: 1px solid var(--hairline)`. That gives a real tonal step between the two so
they don't read as one long block. `.process` below is already `--ink` with its own
hairline top (`hub.css:706`), so an ink→hairline→ink transition is the established
pattern on this page, not a new one.

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
- **Viewport 1024×640, `deviceScaleFactor: 2`** — see the legibility test below.
- `waitUntil: 'load'` plus `document.fonts.ready` plus a short settle delay.
  **Not `networkidle`** — it timed out against a real client site during the test
  capture (embedded third-party widgets keep connections open indefinitely).
- Viewport-sized capture, not `fullPage`.
- Output `src/assets/work/<slug>.png`, rendered through Astro's `<Image>` from
  `astro:assets` (sharp already present via Astro) so the build emits optimized webp
  with explicit width/height — no layout shift.
- A fixed viewport means all three shots share an aspect ratio, so the grid stays even
  without a forced crop.
- Committed screenshots are refreshed manually by re-running the script when a client
  site changes materially.

**Legibility test (run 2026-07-28, decided the viewport):** `.work-grid` is 3 columns in
a 1200px container, so each preview slot is roughly 383×250 CSS px. A 1440px-wide capture
downscaled into that slot is a ~3.8× reduction — body text lands around 4px and the row
would read as blurry thumbnails sitting next to the sharp, card-scale-authored concept
mocks, inverting the credibility hierarchy this whole design exists to establish.

All three sites were captured at both 1440 and 1024 and composited into a 383×250 slot.
At **1024 the hero headline, nav, and CTA buttons are all cleanly legible** on all three;
at 1440 they are not. 1024 also crops to roughly the hero, which is the right thing for a
thumbnail to show. Test artifacts are throwaway (scratchpad, not committed).

Caveat to watch during implementation: 1024 is wide enough that all three current sites
still render their desktop nav, but a future client site could collapse to a hamburger at
that width. If one does, bump that site to 1280 and accept the slight legibility cost
rather than shipping a mobile-looking nav in a desktop-framed card.

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

### 7. MAB pre-capture blockers

Two problems found while test-capturing `mabassets.com` on 2026-07-28. Both are on the
**client** repo, not this one, and both must be resolved before the MAB screenshot is
taken — a screenshot bakes them in permanently.

**a. The live site shows an "under construction" banner.** The homepage renders a
Sanity-driven announcement bar (`clients/mabassets-website/src/pages/index.astro:39`)
currently reading *"Welcome! This site is under construction – come back soon!"* — the
seeded announcement document noted in that repo's CLAUDE.md. Featuring it under a
heading that says "Live today" while the screenshot says "under construction" is
self-defeating.

Fix: publish a real announcement in the MAB Sanity Studio (`mabassets.sanity.studio`),
or delete the seeded doc so the hardcoded fallback — *"New listings are added here as
they become available — check back soon."* — takes over. Either is a content change with
no code involved. Wait for the Coolify rebuild, then capture.

**b. The brand name is "MAB Properties", not "MAB Assets".** `mabassets` is the domain
and client slug; the live site's title is *"MAB Properties — Well-Kept Rental Homes"* and
that repo's CLAUDE.md describes the client as **MAB Properties**. The card's `name` must
read **MAB Properties**, with `mabassets.com` only as the domain/URL. Using the slug as a
display name in public marketing gets the client's own name wrong.

Terry's Lawncare and ITA Data were captured the same way and are clean — no equivalent
blockers.

### 8. Navigation

`index.astro:22` nav gains a second entry so both sections are reachable:

- `Our Work` → `#work` (unchanged target, now the real-client section)
- `Concepts` → `#concepts`

Hero CTA (`index.astro:47`) and footer link (`index.astro:368`) keep pointing at
`#work`, which now lands on real client work — an improvement, not a regression.

**Showcase back button:** `BackButton.astro:4` currently links to `/` (site root), so a
visitor who clicks into a concept page and hits back lands at the top of the homepage.
With the split, it should return to `/#concepts` — the row they came from — instead of
dumping them above the fold to re-scroll. One-line change; the component takes only
`color`/`background` props, so the href can be hardcoded.

## Client sites featured

Each domain was checked for HTTP status **and** for whether it actually serves the Web
Foundry build — a 200 alone proves nothing, as `itadata.com` demonstrated.

| Client | Domain | Live title (2026-07-28) | Status |
|---|---|---|---|
| MAB Properties | mabassets.com | MAB Properties — Well-Kept Rental Homes | Ours. Blocked on §7 fixes before capture |
| Terry's Lawncare | terryslawncare.us | Terry's Lawncare — Neighborhood Lawn Care You Can Count On | Ours, clean, ready |
| ITA Data Solutions | itadata.site | ITA Data Solutions: SAP Supply Chain Experts | Ours, clean, ready. `.com` cutover pending — see §6 |

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
- Onboarding-skill updates. Nothing here changes how a client site is spun up, so the
  `CLAUDE.md:150` "keep the skill current" rule is not triggered. Note for whoever forks
  next: the `clients` array and the `#work` section are **hub-only** — a client fork
  inherits and must delete them, same as the `showcase` config block already works.
