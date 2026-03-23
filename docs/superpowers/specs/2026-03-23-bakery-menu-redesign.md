# Sweet Crumb Bakery — Menu Redesign Spec

**Date:** 2026-03-23
**File:** `showcase/bakery.html`
**Goal:** Transform the current portfolio-style showcase into an information-dense, real-feeling local bakery website with a full menu, specials, and a personal hero image.

---

## Context

The current `bakery.html` is sparse — 3 large menu tile cards, a 100vh hero, and minimal content. It reads more like a portfolio piece than an actual bakery site. The goal is to make it feel like a real business website that a customer would actually use.

Sanity CMS integration is in progress (not yet implemented). The redesign should treat images as real content slots — placeholder-ready now, CMS-ready later.

---

## Design Decisions

### Hero — Slim Split Layout
- **Not** a full-viewport hero. A compact band (~50-60% viewport height max).
- Two-column grid: copy on the left, photo on the right.
- Right side: a single rounded image (aspect ratio 4:3) with a subtle gradient caption overlay at the bottom ("Fresh from the oven daily").
- Image is a real photo placeholder — designed to accept a Sanity CMS image field later.
- Retain existing copy: tagline, subtext, "Browse the Menu" + "Our Story" CTAs.
- Keep decorative elements subtle (one faint circle, no heavy animation).

### Today's Specials Strip
- Sits immediately below the hero, above the main menu.
- Cream-dark (`#F0E6D0`) background to visually separate from hero and menu.
- Header row: "TODAY'S SPECIALS" label (left) + rule line + current date (right).
- 3-column card grid. Each card: emoji icon + "Special" badge + name + short description + price.
- Items here also get a "Special" badge when they appear in the main menu categories.
- Content is hardcoded for now; CMS-ready slot later.

### Menu Section
- **Header row:** "Our Menu" title (left) + subtle "Download PDF Menu" button (right).
  - PDF button: outlined pill, small, icon + text. Not prominent but easy to find.
  - PDF link points to a placeholder `#` for now.
- **Sticky tab bar:** Pastries | Breads | Sandwiches | Beverages
  - Tabs sit below the menu header.
  - Clicking a tab smooth-scrolls to that category section.
  - Active tab updates as the user scrolls through categories (IntersectionObserver, already available in `shared.js` pattern).
  - Sticky at the top of the viewport below the nav (uses `position: sticky; top: 72px`).
- **Category sections:** Each has a styled heading and a 2-column item grid.
- **Menu item cards:** Compact — name, optional "Special" badge, one-line description, price. No image for now (image slot reserved for future).
- **Categories and items (placeholder content):**
  - Pastries: Almond Croissant (Special), Plain Croissant, Seasonal Muffin, Carrot Cake Cupcake, Kouign-Amann, Cinnamon Morning Bun
  - Breads: Country Sourdough, Walnut Rye (Special), Seeded Baguette, Olive Focaccia, Honey Oat Sandwich Loaf
  - Sandwiches: The Classic BLT, Smoked Turkey & Brie, Roasted Veggie & Hummus, Ham & Gruyère
  - Beverages: Drip Coffee, Cortado, Oat Milk Latte, Matcha Latte (Special), Chai, Cold Brew, Orange Juice

### About & Hours Sections
- Retain existing About and Hours sections with minimal changes.
- About section: swap the blob/emoji visual for a second real photo (baker portrait or kitchen shot). Same Sanity-ready slot pattern as the hero image.
- Hours section: no structural change.

---

## Architecture

- **Single file:** All changes stay within `showcase/bakery.html`. No new files.
- **Styles:** Self-contained `<style>` block (existing pattern). CSS custom properties already defined at `:root`.
- **JS:** No new JS file. Tab scroll behavior uses vanilla JS inline `<script>` at bottom (same as nav scroll already in the file). IntersectionObserver for active tab highlight.
- **Images:** `<img>` tags with `object-fit: cover`, wrapped in a container div. `src` points to an Unsplash placeholder URL. `alt` text written as if for a real photo. Easy to swap for a Sanity URL later.
- **PDF link:** `<a href="#">` placeholder. Real PDF URL dropped in when available.

---

## What Is NOT Changing

- Color palette, fonts, CSS custom properties — unchanged.
- `shared.css` and `shared.js` — no modifications.
- Nav structure and scroll behavior — retained as-is.
- DB Design credit footer — retained.
- Back button — retained.

---

## Future Considerations (out of scope now)

- Menu item images: reserve a slot in the item card markup (commented-out `<img>` or empty div with a class) so it can be dropped in without restructuring.
- Sanity CMS: hero image, about image, specials content, and menu items are all natural CMS fields. Markup should use clean, semantic structures that map easily to CMS data.
- Mobile: existing `@media (max-width: 768px)` breakpoint. Tab bar should scroll horizontally on mobile. Item grid collapses to 1 column.
