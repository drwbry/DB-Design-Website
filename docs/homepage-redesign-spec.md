# Homepage Redesign Spec — The Web Foundry (Cincinnati)

**Status:** Draft for build. Written against `src/pages/index.astro`, `src/styles/hub.css`, `src/scripts/main.js` as of 2026-07-06.

> **⚠ Design-import blocker:** The in-progress Claude Design file
> (`https://claude.ai/design/p/1abf3cf6-b8bf-4802-85f0-be69fc6d80b4?file=Homepage.dc.html`)
> could not be imported in this session — `DesignSync` needs `/design-login` (interactive
> only) and the URL 403s to unauthenticated fetch. To unblock, either:
> 1. Run `/design-login` in an interactive Claude Code session, then re-run the import, or
> 2. In Claude Design, use **"Send to Claude Code Web"**, or
> 3. Export `Homepage.dc.html` and drop it at `docs/design-imports/Homepage.dc.html`.
>
> Until then, this spec is grounded in the **current live page + the brand system in
> CLAUDE.md**. Sections below marked **[reconcile]** are the ones most likely to have
> been addressed in the Claude Design draft — when the file arrives, diff those first
> and let the design's visual decisions win where they conflict with layout suggestions
> here (copy and sequencing recommendations here should still apply).

---

## 1. Goal & conversion thesis

The page sells a **free website build** to a skeptical local business owner. The current
page is visually strong but has one structural gap: **it never answers "what's the
catch?"** — and for a free offer, unresolved skepticism is the #1 reason a prospect
doesn't reach out. There is also **zero social proof** anywhere on the page.

Revised narrative arc (section order):

1. **Hero** — the promise, immediately grounded ("free build" + what happens after)
2. **Mission** — why we do this (keep, tighten)
3. **Showcase** — proof of capability (keep, add functionality signals)
4. **How It Works** — proof of low effort (keep, add timeframes)
5. **NEW — "The Straight Answers"** — objection handling / pricing transparency
6. **CTA** — keep, lower the perceived commitment
7. Footer — keep as-is

Everything reuses existing tokens: `--black/--black-soft/--black-card`, `--gold/--gold-light/--gold-dim`,
`--cream/--cream-dim/--cream-muted`, `--border/--border-gold`, `--ff-display` (Playfair Display),
`--ff-body` (DM Sans), easings `--ease-out-expo/--ease-out-quart`, utilities `.reveal` (+ modifiers),
`data-count`, `.container`, `.section-tag`, `.section-title`, `.btn` variants.

---

## 2. Navigation (minor)

- **Keep:** logo-b wordmark + locale, scrolled blur behavior, hamburger.
- **Change:** link order is currently `Mission / Work / [Get in Touch button] / About`.
  Reorder to `Work / Mission / About / [Get in Touch]` — CTA last (rightmost), content
  links in descending prospect interest (work first; prospects click proof before philosophy).
- No new styles needed; `.nav__cta` already exists.

## 3. Hero **[reconcile]**

- **Keep (already nails it):** the word-by-word `hero__word` entrance, the
  `hero__eyebrow` "Built in Cincinnati" pin, bg-grid/noise/glow layering, the headline
  itself — *"Your next website? It's on us."* is the best line on the page. Do not
  replace it.
- **Copy — subhead (replace current):**
  > "We design, build, and launch a custom website for your Cincinnati small business —
  > the build is free, and everything after is handled for about what you spend on
  > coffee each month."
  Rationale: the current sub says "completely free" with no qualifier; savvy owners
  smell a trick. Naming the real model (free build + small monthly care) in the first
  screen *increases* trust and pre-qualifies leads. (Model per `docs/cowork-intake-brief.md`:
  free build, ~$20/mo hosting.)
- **NEW — proof microbar** directly under `.hero__actions`: a single row, three items
  separated by thin gold rules:
  - `3` live builds to explore (anchor-links to `#showcase`)
  - `Days` from kickoff to launch — not months
  - `100%` yours — your domain, your content
  - Markup: `.hero__proof` flex row; each item = `.hero__proof-num` (Playfair,
    `--gold`, ~1.4rem) over `.hero__proof-label` (DM Sans, 0.72rem, uppercase,
    `--cream-muted`, letter-spacing 0.12em). Separators: 1px × 32px `--border-gold`.
    Use `data-count="3"` on the first number (shared.js animates it free of charge).
    Enter with `.reveal.reveal-delay-5`. On ≤768px: stack vertically or wrap 2+1;
    keep `hero__scroll-hint` below it.
- **CTAs:** keep both buttons; change ghost button label `Let's Talk` → `Start the
  Conversation` (matches the modal's non-salesy tone).

## 4. Mission (tighten, keep the form)

- **Keep:** the beat/rule rhythm (`.mission__beat` / `.mission__rule`), the section
  title *"The web shouldn't be a luxury."*
- **Change:** merge beats 3 and 4 — they currently split one idea ("AI made us fast" /
  "so it's free") across two beats and repeat the pricing reveal the hero now makes.
  New beat 3 (final):
  > "AI changed the math. We build in days what used to take weeks — and we think that
  > speed should benefit the businesses that need it most. So the build is free. After
  > launch we handle everything — hosting, security, updates — for less than most owners
  > pay to be disappointed today."
  Net: 4 beats → 3. Faster read, no lost meaning.
- Motion: unchanged (`.reveal` + delays).

## 5. Showcase **[reconcile]**

- **Keep (already nails it):** CSS wireframe mocks (`.project-card__mock--*`), palette
  swatches, magnetic 3D tilt from `main.js`, overlay "View Site →". The mocks read as
  intentional design artifacts — do **not** swap for screenshots.
- **Copy — section sub (replace):**
  > "Three businesses, three completely different builds — real menus, real booking,
  > real forms. Click through; everything works."
- **NEW — feature chips** per card, between `.project-card__desc` and the palette row:
  2–3 small pills naming *functionality*, not aesthetics (this is what separates us
  from template shops, and it sets up the showcase enhancements in
  `docs/showcase-enhancements-proposal.md`):
  - Bakery: `Daily specials` · `CMS menu` · `Pre-orders`
  - Plumber: `24/7 emergency CTA` · `Service requests` · `Invoice pay`
  - Salon: `Online booking` · `Gallery CMS`
  - Markup: `.project-card__chips` flex-wrap row of `.chip` — 0.65rem DM Sans,
    uppercase, letter-spacing 0.08em, `--cream-dim` text, 1px `--border` border,
    border-radius 100px, padding 0.25rem 0.7rem. On card hover, chip border →
    `--border-gold` (piggyback the existing card hover transition).
  - **Build order note:** ship chips that match reality — if the Part 2 showcase
    features aren't built yet, use current-truth chips (`PDF menu`, `Business hours`,
    `Contact form`, etc.) and upgrade wording when those land.

## 6. How It Works

- **Keep:** timeline structure, marker/line motif, 3 steps.
- **Change:** add a timeframe kicker above each `.timeline__title` —
  `.timeline__when` (0.68rem, uppercase, `--gold`, letter-spacing 0.14em):
  - We talk — **"Day 1 · ~1 hour of your time"**
  - We build — **"Days 2–5"**
  - You launch — **"Within the week"**
  Speed is the AI story made concrete; "1 hour of your time" kills the "I don't have
  time for this" objection.
- Step 3 desc, append: *"…You never have to think about it — and if you ever want to
  walk away, the site and domain are yours."* (Sets up Straight Answers.)

## 7. NEW SECTION — "The Straight Answers" (objection handling)

**Placement:** between How It Works and the CTA. Background `--black-soft` to break
rhythm. This is the highest-impact addition on the page.

- Header: `.section-tag` = "No Fine Print", `.section-title` = **"Okay — what's the
  catch?"** (italic `em` on "catch" per house style).
- Body: 4 Q&A items, two-column grid on desktop (`repeat(2, 1fr)`, gap 2rem/3rem),
  single column mobile. Each item: question in Playfair (~1.25rem, `--cream`, an
  italic `em` allowed), answer in DM Sans (0.95rem, `--cream-dim`, line-height 1.7).
  Left-border accent 2px `--border-gold` with padding-left 1.5rem (echoes
  `.trust-badge` treatment from the plumber page, adapted to hub tokens). Stagger in
  with `.reveal reveal-delay-1..4`.
- **Copy (final, build as written):**
  1. **Q: Why would you build my website for free?**
     A: Because AI collapsed the cost of building, and we'd rather prove it than
     advertise it. Every free build becomes part of our showcase — your win is our
     portfolio.
  2. **Q: So what do I actually pay?**
     A: Nothing for the build. After launch, hosting, security, and updates run about
     $20/month — typically less than owners already pay for a worse site. No contracts.
  3. **Q: Who owns the website?**
     A: You do. Your domain, your content, your site. If you ever leave, it all goes
     with you.
  4. **Q: What do you need from me?**
     A: About an hour. Tell us about your business, share your logo and photos if you
     have them, and give feedback on the draft. We handle the rest.

## 8. CTA section

- **Keep:** layout, `--gold`-era styling, `.btn--cta` arrow interaction.
- **Copy — sub (replace):**
  > "One conversation. No pitch deck, no obligation — just a look at what your
  > business could have online."
- **Add** below the button, small (`0.8rem`, `--cream-muted`): direct-email fallback —
  "Prefer email? `hello@cincinnatiwebfoundry.com`" as a `mailto:` link in `--gold`.
  Some owners will never open a modal form; give them the one-click path.

## 9. Contact modal (keep) + form compliance fixes

Modal UX (focus handling, success state, phone auto-format, conditional URL field) is
good — keep. **But the form violates the repo's own reliability rules (CLAUDE.md
"Required form reliability rules"), and this page is the template others fork:**

1. Add hidden inputs: `site_id` (e.g. `web-foundry-hub`) and `to_email`.
2. In `main.js`, gate success UI on `res.ok === true` (currently only checks
   `result.success` in the parsed body).
3. On failure, refresh the Turnstile token (`turnstile.reset()`) — currently a failed
   submit leaves a consumed token, so the retry fails too.

(The same three fixes apply to the bakery/plumber/salon forms — tracked in the
showcase proposal doc.)

## 10. Motion & interaction summary (all reuse, no new systems)

| Element | Mechanism | Source |
|---|---|---|
| Hero words | existing `hero__word` keyframes | hub.css |
| Proof microbar count | `data-count` | shared.js (already auto-inits) |
| Section entrances | `.reveal` + delay modifiers | shared.css |
| Card tilt | existing magnetic handler | main.js |
| Chips hover | extend existing `.project-card:hover` rule | hub.css |
| Straight Answers stagger | `.reveal reveal-delay-1..4` | shared.css |

Do **not** add new JS libraries or scroll frameworks. Respect
`prefers-reduced-motion` for anything new (shared.css reveal already handles its own).

## 11. Build checklist (for the implementation pass)

- [ ] Nav link reorder
- [ ] Hero: new sub copy, ghost CTA label, `.hero__proof` microbar (+ mobile stack)
- [ ] Mission: merge beats 3+4 (4 → 3 beats)
- [ ] Showcase: new section sub, `.project-card__chips` + `.chip` styles, chips per card (current-truth wording)
- [ ] How It Works: `.timeline__when` kickers, step-3 copy append
- [ ] New "Straight Answers" section (`--black-soft` bg, 4 Q&As, copy as written above)
- [ ] CTA: new sub copy + mailto fallback line
- [ ] Form compliance: `site_id`/`to_email` hidden fields, `res.ok` gate, Turnstile reset on failure
- [ ] Verify mobile ≤768px for every touched section; hub Lighthouse should stay ≥ current
