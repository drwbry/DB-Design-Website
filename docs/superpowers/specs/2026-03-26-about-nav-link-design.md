# About Link — Nav Promotion

**Date:** 2026-03-26
**Status:** Approved

## Summary

Move the About link from footer-only to also appearing in the main navigation, positioned after the "Get in Touch" CTA. Keep it in the footer as well.

## Nav Order (Final)

```
Mission | Work | [Get in Touch CTA] | About
```

Left of the CTA: section anchors that scroll the hub page (Mission → #mission, Work → #showcase).
Right of the CTA: About — a separate page link, intentionally separated from the scrolling-section nav items.

## Styling

About uses `.nav__link` — identical to Mission and Work. No special treatment. The gold `.nav__cta` button provides natural visual separation between the section links and the About page link.

## Files Changed

- `src/pages/index.astro` — add `<li><a href="/about" class="nav__link">About</a></li>` after the Get in Touch `<li>`
- `src/pages/about.astro` — same change so nav is consistent when on the About page

## What Stays the Same

- Footer `<a href="/about">About</a>` remains untouched
- No new CSS needed — `.nav__link` already handles styling, hover, and mobile
