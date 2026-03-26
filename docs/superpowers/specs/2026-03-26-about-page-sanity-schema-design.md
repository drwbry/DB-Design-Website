# About Page — Sanity CMS Schema

**Date:** 2026-03-26
**Status:** Approved

## Summary

Add a Sanity `aboutPage` document type that makes every editable section of `about.astro` manageable through the CMS. This serves as a reusable template pattern for client handoffs — a customer can own all About page content without touching code.

## Schema: `aboutPage`

One singleton document in `studio/schemaTypes/aboutPage.ts`. Registered in `studio/schemaTypes/index.ts`. The About page fetches it at build time via a single GROQ query.

### Fields

| Section | Field name | Sanity type | Notes |
|---|---|---|---|
| Hero | `heroHeadline` | `string` | Maps to the `<h1>` |
| Hero | `heroSubtext` | `text` | Paragraph below the headline |
| Why | `whyTitle` | `string` | Section heading |
| Why | `whyBody` | `array` of `text` blocks | 1–3 paragraphs |
| How | `howTitle` | `string` | Section heading |
| How | `howBody` | `text` | Single paragraph |
| Team | `teamTitle` | `string` | Section heading ("The Team") |
| Team | `teamMembers` | `array` of inline objects | Max 4; see Team Member Object |
| CTA | `ctaHeadline` | `string` | The call-to-action heading |

### Team Member Object

Each item in `teamMembers` is an inline object with:

| Field | Type | Notes |
|---|---|---|
| `name` | `string` | Person's full name |
| `title` | `string` | Editable role label (e.g. "Co-Founder") |
| `photo` | `image` with `hotspot: true` | Optional; falls back to placeholder |
| `bio` | `text` | Short biography |

`teamMembers` has a max of 4 items enforced via Sanity `validation`.

## `about.astro` Changes

Replace every hardcoded content string with the value fetched from Sanity. Current hardcoded text becomes the null-safe fallback for each field so the page never renders blank.

- Hero headline and subtext → `aboutPage.heroHeadline`, `aboutPage.heroSubtext`
- Why/How section titles and body text → corresponding `aboutPage` fields
- Team section title → `aboutPage.teamTitle`
- Team cards → loop over `aboutPage.teamMembers` (max 4)
  - `team-card__photo-placeholder` div → real `<img>` when `photo` is present; fallback to placeholder div when absent
  - Name, title, bio rendered from fetched data
- CTA headline → `aboutPage.ctaHeadline`

## Data Fetching

Add a GROQ query to `about.astro` in the frontmatter, using the existing `sanityClient` pattern:

```groq
*[_type == "aboutPage"][0] {
  heroHeadline,
  heroSubtext,
  whyTitle,
  whyBody,
  howTitle,
  howBody,
  teamTitle,
  teamMembers[] {
    name,
    title,
    photo,
    bio
  },
  ctaHeadline
}
```

Photo URLs are resolved using the existing `imageUrl` builder from `src/lib/imageUrl.ts`.

## Files Changed

1. `studio/schemaTypes/aboutPage.ts` — new schema file
2. `studio/schemaTypes/index.ts` — register `aboutPage`
3. `src/pages/about.astro` — add GROQ fetch in frontmatter, replace hardcoded content with fetched data and null-safe fallbacks

## Fallback Strategy

Every field has a hardcoded fallback (the current static content) so the page renders correctly even before content is entered in Sanity. Photo falls back to the existing `.team-card__photo-placeholder` div.
