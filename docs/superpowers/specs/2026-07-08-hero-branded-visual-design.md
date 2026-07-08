# Hero branded visual — design

**Date:** 2026-07-08
**Status:** Implemented

## Problem

The hub hero (`index.astro`) was a single left-aligned column capped at
`max-width: 720px` inside a 1200px container, leaving the entire right ~40% as
dead space. It read as bland and unfinished.

## Decision

Fill the right column with a branded visual that blends two directions:

- **Branded mark (Direction A):** the Foundry anvil-and-flame logo (which also
  hides a "W") as a line-art mark, sitting inside a soft terracotta ember glow
  with faint concentric rings and a masked dot-grid.
- **Motion (Direction B):** the glow slowly pulses and terracotta/amber **embers
  rise off the flame tip**, swaying and fading — a literal nod to "foundry."

The same mark replaces the old bordered "W" box in the nav for site-wide
consistency.

## Asset

- Source logo supplied as `foundry-mark-3.png` (terracotta line-art on flat
  white). White keyed to transparent via luminance→alpha with anti-aliased
  edges, auto-cropped, downscaled to 620px, saved to
  `public/brand/foundry-mark.png` (~150KB). Pristine master stashed in
  `.brand-src/` (gitignored, for future re-keying).

## Implementation

- `src/pages/index.astro`
  - Nav: `<span class="nav__logo-mark">W</span>` → `<img class="nav__logo-mark" src="/brand/foundry-mark.png" …>`.
  - Hero: added `.hero__visual` sibling after `.hero__inner` containing dot-grid,
    glow, two rings, the mark `<img>`, and an `.hero__embers` group of 8 spans.
- `src/styles/hub.css`
  - `.nav__logo-mark` → plain 30px `object-fit: contain` image (border/flex removed).
  - `.hero` → two-column grid `1fr minmax(0, 460px)`, centered.
  - Added `.hero__visual` + children, `heroGlowPulse` / `heroEmber` keyframes.
  - `@media (max-width: 900px)`: hero collapses to one column, `.hero__visual` hidden.
  - `prefers-reduced-motion`: glow animation off, embers hidden.

## Verification

Built (`npm run build`) and screenshotted the real output with Playwright at
1440px (visual present, balanced) and 390px (visual hidden, single column). Both
correct.
