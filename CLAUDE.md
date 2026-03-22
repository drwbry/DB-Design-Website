# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A multi-page static HTML/CSS/JS showcase website for **DB Design**, a volunteer initiative that rebuilds outdated local business websites using AI vibe coding. No frameworks, no build tools — pure HTML, CSS, and Vanilla JS.

## Running Locally

```bash
python -m http.server 8080
```
Then visit `http://localhost:8080`

## Site Structure

```
├── index.html                  # Main DB Design hub page
├── styles/
│   ├── shared.css              # Global reset, scroll-reveal utility classes, .back-btn
│   └── hub.css                 # Hub page design tokens + all component styles
├── js/
│   ├── shared.js               # IntersectionObserver scroll reveal + counter animation
│   └── main.js                 # Hub-specific: 3D magnetic card tilt, nav blur, parallax
└── showcase/
    ├── bakery.html             # Sweet Crumb Bakery (warm artisan)
    ├── plumber.html            # Peak Flow Plumbing (industrial bold)
    └── salon.html              # Lumière Salon & Spa (chic luxury)
```

## Architecture

**Hub page** (`index.html`) loads `shared.css` + `hub.css` for styles, and `shared.js` + `main.js` for JS.

**Showcase pages** each load only `shared.css` and `shared.js`. All page-specific styles live in a self-contained `<style>` block using CSS custom properties at `:root`. There is no page-specific JS file — interactivity is CSS-only or handled by `shared.js`.

`shared.js` auto-initializes on `DOMContentLoaded` — no manual calls needed. It wires up scroll reveal and counters automatically by querying the DOM for `.reveal` and `[data-count]`.

## Shared Utilities (shared.css + shared.js)

**Scroll reveal** — add `.reveal` to any element. Modifier classes change the entrance direction:
- `.reveal--left` / `.reveal--right` — slide in from side
- `.reveal--scale` — scale up from 92%
- `.reveal-delay-1` through `.reveal-delay-6` — stagger by 0.1s increments

**Counter animation** — add `data-count="42"` (integer) or `data-count="4.9"` (float) to any element. `shared.js` animates it from 0 when scrolled into view.

**Layout / components:**
- `.container` — centered max-width 1200px wrapper with horizontal padding
- `.back-btn` — fixed top-left back button for showcase pages (styled per-page via `color`/`background`)
- `.db-badge` — "Built with DB Design" pill badge
- `.hide-mobile` / `.hide-desktop` — responsive visibility toggles (breakpoint: 768px)

## Design System

### Hub Page (index.html)
- **Colors**: `#0A0A0A` bg, `#D4A853` gold, `#F0EBE0` cream
- **Fonts**: `Playfair Display` (display/serif) + `DM Sans` (body)

### Showcase Pages
| Page | Palette | Fonts |
|------|---------|-------|
| bakery.html | Cream `#FDF6EC`, Terracotta `#C9926B`, Sage `#7A9E82` | Cormorant Garamond + Nunito |
| plumber.html | Navy `#1A2744`, Orange `#FF6B2B`, Light `#F5F5F5` | Bebas Neue + Inter |
| salon.html | Espresso `#1C1410`, Blush `#E8D5C4`, Champagne `#C9A96E` | Bodoni Moda + Raleway |

Each showcase page defines its full palette as CSS custom properties in its `<style>` block — search for `:root {` within the file to find them.

## Adding a New Showcase Page

1. Copy the structure of an existing showcase page in `showcase/`
2. Pick a distinct aesthetic (fonts, palette, motion style) — use the **frontend-design** skill for design guidance
3. Link from `index.html` — add a new `.project-card` in the showcase grid
4. Add the matching color swatches and mock wireframe CSS using the `.project-card__mock--[name]` pattern
