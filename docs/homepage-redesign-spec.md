# Homepage Rebrand Spec v2 — The Web Foundry (Cincinnati)

**Status:** APPROVED DIRECTION — ready for implementation pass.
**Design source of truth:** `docs/design-imports/Homepage.dc.html` (Claude Design export).
Read it in full before building — all colors/spacing/copy referenced below exist there.
**Liberties over the design are already decided in this spec** (owner confirmed the
design was half-baked; scroll pinning was broken). Where this spec and the design file
conflict, **this spec wins**. Do not re-litigate choices; do not add features not listed.

The `.dc.html` files under `docs/design-imports/showcase/` are rough card-target
placeholders — **ignore them**; the live showcase pages remain canonical for their own
design systems.

## Scope of the rebrand

This is a **full visual rebrand of the hub page only** (`index.astro` + `hub.css` +
`main.js` + `BaseLayout` fonts). Showcase pages are untouched. `about.astro` /
`privacy.astro` keep the old style this pass (they'll visually mismatch — accepted;
About redesign is a follow-up using `docs/design-imports/About.dc.html`).

**Template-ability rule (applies to everything):** keep all styling in `hub.css` under
the token block below; no inline hex values in `index.astro`. A future client fork
should be able to re-skin by editing tokens only.

---

## 1. New design system (replaces hub.css `:root` wholesale)

Fonts (swap the Google Fonts link in `index.astro`'s head Fragment):
`Sora:wght@400;600;700` (display) + `Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400` (body).

```css
:root {
  --ink: #181c28;            /* page bg */
  --surface: #1e2333;        /* raised section bg (Featured Work) */
  --surface-raised: #242c3a; /* CTA band bg */
  --footer-bg: #12151f;
  --accent: #b45a3c;         /* terracotta — buttons, tags, links */
  --accent-hover: #c96a4c;
  --accent-dim: rgba(180,90,60,0.12);   /* icon chips */
  --cream: #eee9e1;          /* headings on dark */
  --muted: #8b95a8;          /* body text on dark */
  --muted-deep: #6b7488;     /* footer text */
  --panel: #f5f0ea;          /* light process cards */
  --panel-ink: #2a3240;      /* headings on light */
  --panel-muted: #5f6b7a;    /* body on light (modal body: #6b7888) */
  --modal-bg: #faf7f3;
  --hairline: rgba(255,255,255,0.04);
  --border-soft: rgba(255,255,255,0.06);
  --border-card: rgba(255,255,255,0.08);
  --card-glass: rgba(255,255,255,0.04);
  --ff-display: 'Sora', system-ui, sans-serif;
  --ff-body: 'Plus Jakarta Sans', system-ui, sans-serif;
}
```

Type rules: display headings = Sora 700, letter-spacing -0.02em (h1 clamp(2.4rem,5vw,3.75rem);
section titles clamp(1.8rem,3.5vw,2.4rem)). Body = Plus Jakarta Sans. Section tags =
12px/600/uppercase/0.14em tracking/`--accent`. Buttons: 6px radius; cards: 10px; modal: 12px.
Primary button = `--accent` bg, white text, hover `--accent-hover` + scale(1.02).
Keep easing tokens `--ease-out-expo/--ease-out-quart` for reveals.

Delete from `hub.css`: all gold/Playfair-era tokens and any styles for removed sections
(mission beats/rules, timeline, old mock wireframes, hero grid/noise/glow, palette swatches).
Delete from `main.js`: magnetic card tilt, parallax glow, conditional URL field, radio
handlers. Keep: nav scroll, hamburger, smooth scroll, modal open/close, phone format,
form submit (amended in §9). `shared.js`/`shared.css` unchanged.

## 2. Page structure (final order)

Nav → Hero → Featured Work (`#work`) → How It Works (`#process`) → What's Included →
The Bottom Line (incl. Fair Questions) → CTA band → Footer → Contact modal.
(Mission section from the old page is **removed** — its story lives on /about and in
Fair Questions. Old How-It-Works timeline is **replaced** by §4.)

## 3. Nav + Hero — design file lines 27–53, plus additions

- Logo: 30px square, 2px `--accent` border, radius 4, "W" in Sora 700 `--accent` +
  wordmark "The Web Foundry" (PJS 600 15px `--cream`). Keep it a component-ish block —
  forks swap one letter + name.
- Links: `Our Work` `How It Works` `About` + `Get in Touch` accent button (order as designed).
- Hero (left-aligned, max-width 720px): keep the 40×3px accent dash, but put beside it
  an eyebrow — PJS 12px/600/uppercase/0.12em `--muted`: **"Built in Cincinnati"**.
- H1 (as designed): **"Your business deserves\na great website."**
- Sub (REPLACES design copy — pricing honesty, never say "free"):
  > "We design and build modern websites for Cincinnati small businesses. No templates,
  > no jargon — just a site that represents what you do, at a price a small business
  > can actually say yes to."
- CTAs: primary button "View Our Work" (smooth-scroll `#work`) + text link
  "Start a Conversation →" (opens modal), accent color, arrow nudges +4px on hover.
- **Proof microbar** (addition; not in design): row under CTAs, 48px top margin, three
  items separated by 1px×28px `--border-card` rules. Item = number (Sora 600 20px
  `--cream`) + label (PJS 12px `--muted`): `3` "Live demo builds" (use `data-count="3"`),
  `Days` "From kickoff to launch", `1` "Simple monthly invoice". Wraps on mobile.
- Entrance: whole hero = single `slideUp` 0.5s ease-out on load (design's keyframe);
  no per-word animation (that dies with the old hero).

## 4. Featured Work — per design lines 56–186, plus chips

Section bg `--surface`, header block as designed ("Featured Work" tag /
"See what's possible." / sub "Different businesses, different aesthetics. Each one
custom-designed to match.").

3-col grid of **browser-chrome cards** (this replaces the old wireframe mocks):
white card, radius 10; dark title bar with 3 traffic dots + URL pill
(`sweetcrumbbakery.com` / `peakflowplumbing.com` / `lumieresalon.com`); 250px mini
site-preview panel — recreate each preview exactly per design lines 77–93 (bakery),
116–134 (plumber), 157–173 (salon); info footer with category tag (`--accent`), name
(Sora 18px `#2a3240`), one-line desc, and "View Site →" linking to
`/showcase/bakery|plumber|salon`.

Whole card is the link (wrap in `<a>`); hover = translateY(-6px) + deepened shadow
(as designed — no 3D tilt).

**Addition — feature chips** between desc and View Site link: `.chip` pills, PJS 10px/600
uppercase 0.08em, `#6b7888` text, 1px `#e3ddd4` border, radius 100px, padding 3px 10px.
Current-truth wording: bakery `PDF menu · Daily specials · Sanity CMS`; plumber
`24/7 CTA · Business hours · Contact form`; salon `Gallery CMS · Service pricing · Booking inquiry`.
(Upgrade wording only when showcase-enhancement features ship.)

Cards enter with `.reveal reveal-delay-1/2/3`.

## 5. How It Works — design panel 0 content, **un-pinned**

**Liberty (decided):** the design's 360vh pinned scroll-story (lines 189–338) is
**dropped entirely** — implement its three panels as three normal stacked sections.
Do not port `story-wrapper`, the rAF `_tick` loop, progress bar, stepper, or scroll cue.

Section `#process`, bg `--ink`, top border `--hairline`. Header: tag "How It Works" +
title "Simple from start to finish." Then the 3 light panels in a row (design lines
209–228): `--panel` bg, radius 10, 3px `--accent` top border, heading PJS 15px/600
`--panel-ink`, body 13px `--panel-muted`; animated arrow separators (`arrowNudge`
keyframe, `--accent` stroke). Copy exactly as designed, with one addition — a timeframe
kicker above each heading (PJS 10px/700/uppercase/0.12em `--accent`):

1. **Day 1 · about an hour** — "Tell us about your business" / "A simple conversation — your customers, your style, what makes you different. No tech speak, no questionnaires."
2. **Days 2–5** — "We design and build" / "Custom design, fast turnaround. We iterate until it feels like you. No templates, no shortcuts."
3. **Within the week** — "Launch and forget" / "Your site goes live. Hosting, security, domain, updates — all handled. One simple monthly invoice."

Mobile: stack panels vertically, rotate arrows 90° (or hide them).

## 6. What's Included — design panel 1 as its own section

Bg `--ink`. Header: tag "What's Included" + title "Everything you need. Nothing you don't."
4-col grid (2-col ≤1024px, 1-col ≤640px) of glass cards (`--card-glass` bg,
`--border-card` border, radius 10): 36px `--accent-dim` icon chip with the exact inline
SVGs from design lines 241/248/255/262, then title + body copy exactly as designed
(Custom Design / Hosting & Domain / SEO & Analytics / Content Updates).
Cards `.reveal reveal-delay-1..4`.

## 7. The Bottom Line + Fair Questions

Bg `--surface`. Header: tag "The Bottom Line" + title "One invoice. Zero headaches."
Split layout (design lines 277–304): left — paragraph exactly as designed ("We handle
the domain, the hosting, the security, the updates, and the support. You get one
monthly invoice and a website that works — no tech knowledge required on your end,
ever.") + primary button "Start a Conversation →" (opens modal); right — 280px
checklist card (glass style) with the five ✓ rows as designed.

**Addition — Fair Questions block** below the split, same section (48px gap): 2×2 grid
(1-col mobile), each item Q (Sora 16px 600 `--cream`) + A (PJS 14px `--muted`, lh 1.7),
2px `--accent` left border, padding-left 20px. Copy final — **never the word "free"**:

1. **Why is this so affordable?** — "The Web Foundry is a community project, not an
   agency. AI lets us build in days what used to take weeks, and we price to cover our
   costs — not to make a living off Cincinnati's small businesses."
2. **What do I actually pay?** — "A small one-time build fee, then one simple monthly
   invoice — about what you'd spend on lunch — that covers hosting, security, your
   domain, and updates. No contracts, no surprises."
3. **Who owns the website?** — "You do. Your domain, your content, your site. If you
   ever want to walk away, it all goes with you."
4. **What do you need from me?** — "About an hour. Tell us about your business, share
   your logo and photos if you have them, and react to the draft. We handle the rest."

Items `.reveal reveal-delay-1..4`.

## 8. CTA band + Footer — per design lines 342–368

CTA band: bg `--surface-raised`, split layout: left — Sora 36px "Your business has a
story worth telling." + sub "Let's make it visible. No commitment, no pressure."
(`rgba(238,233,225,0.45)`); right — primary button "Start a Conversation →" (modal).
Add under the sub, PJS 13px `--muted`: "Prefer email? " +
`hello@cincinnatiwebfoundry.com` mailto link in `--accent`. Stacks on mobile.

Footer: bg `--footer-bg`, mini W-mark + "The Web Foundry · Cincinnati, OH", links
Work (`#work`) / About (`/about`) / Privacy (`/privacy`), all `--muted-deep`.
(This replaces the old logo-a footer + tagline.)

## 9. Contact modal — design lines 371–419 + production requirements

Light modal (`--modal-bg`, radius 12, 44px padding, `slideUp` entrance, overlay click +
Esc close — keep existing `main.js` modal logic and focus handling).

Fields (REPLACES old field set — no radios, no conditional URL field):
Name*, Email*, Phone (optional, keep auto-format), Business Name*,
"Anything else? (optional)" textarea. Light inputs per design (white bg, `#d5cfc7`
border, focus border `--accent`).

**Production requirements the design omits (mandatory):**
- Hidden `botcheck` checkbox; hidden `site_id` = `web-foundry-hub`; no client-supplied
  `to_email` field.
- Turnstile widget (`data-sitekey="0x4AAAAAACxVhhG9sxrzihaS" data-theme="light"`).
- Submit JSON to the existing Worker URL; success UI **only when `res.ok === true`**
  (and body `success`); on failure show inline error, keep form visible, and call
  `turnstile.reset()`.
- Success state per design (check circle, "Message received.", 24-hour promise).

## 10. Responsive rules (design has none — these are the spec)

Breakpoints 1024px / 768px. Section padding 60px → 24px at 768. Nav: links collapse
behind existing hamburger at 768 (restyle dropdown to `rgba(24,28,40,0.97)`).
Work grid 3→1 col (1024: 2-col is acceptable if cards hold ≥320px). Hero h1 via clamp;
proof bar wraps. No horizontal scroll at 360px width. Respect `prefers-reduced-motion`
(shared.css already covers reveals; gate `arrowNudge` similarly).

## 11. Build checklist (do in this order)

- [ ] `BaseLayout`/`index.astro` head: swap font link to Sora + Plus Jakarta Sans
- [ ] `hub.css`: replace `:root` tokens (§1); restyle nav/buttons/footer; delete dead styles
- [ ] `index.astro`: rebuild sections per §§3–8 (remove mission, old timeline, old cards, old CTA/footer markup)
- [ ] Modal per §9; `main.js` form handler: `site_id` pass-through, `res.ok` gate, `turnstile.reset()` on failure; delete dead JS (§1)
- [ ] Responsive pass per §10
- [ ] Update `AGENTS.md` "Design System → Hub Page" row: colors `#181c28` bg / `#b45a3c` terracotta / `#eee9e1` cream; fonts Sora + Plus Jakarta Sans
- [ ] `npm run build` clean; check `/`, `/about`, `/privacy` links resolve
- [ ] Post-deploy: live form smoke test per `docs/operations-runbook.md`

**Out of scope this pass:** about/privacy restyle, showcase pages, any new imagery,
sitewide copy beyond sections above.
