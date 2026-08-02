# Operating Facts and Phase Map

Read this file at the start of every onboarding and whenever infrastructure facts may have changed.

## Contents

- Workflow overview
- Companion capabilities
- Critical infrastructure facts
- Phase map
- Net-new/takeover fork

## Preserved Playbook

## Overview

Repeatable process for launching a new client static site on the Web Foundry stack. **Discovery and planning must be fully signed off before any building starts** — skipping ahead causes rework.

Steps marked **[MANUAL]** require the user to act. Pause and wait for confirmation before continuing.

**Stack:** Astro static site → GitHub → Coolify (VPS `148.113.196.32`, dashboard at `https://coolify.thewebfoundry.org`) → Sanity CMS → shared Cloudflare Worker for forms.

For a non-technical visual overview, the template repo includes `docs/website-factory-map.html`. Use it to orient Dreux or collaborators to the stack, intake inputs, build/deploy flows, form routing, and Sanity update loop. Update that file whenever the core onboarding workflow or infrastructure meaningfully changes.

### Companion Skills to Use During Onboarding

These names are the original Claude Code adapters. In Codex, use the matching capability in `references/tool-adapters.md`; the capability gate is mandatory even when the named companion skill is unavailable.

| Skill | When to use |
|-------|-------------|
| `frontend-design` | **Phase 4d** — invoke for all design decisions: palette, fonts, layout, hero composition, visual balance. Don't guess at design. |
| `superpowers:brainstorming` | **Phase 4d** — before building pages, brainstorm creative approaches for the client's unique needs (e.g. custom features like mowing schedule groups). |
| `superpowers:requesting-code-review` | **Phase 4h / Phase 9** — after build completes, run a code review against the Site Plan to catch missed requirements, accessibility issues, or design inconsistencies. |
| `superpowers:verification-before-completion` | **Phase 9** — before declaring QA complete, verify all checklist items with actual commands/evidence, not assumptions. |
| `audit-website` | **Phase 9** — run a site audit on the live domain after deployment to catch SEO, performance, and security issues. |

---

## Critical Facts (Don't Guess These)

| Thing | Value |
|-------|-------|
| Sanity | One project per client — created fresh in Phase 2. Project ID assigned by Sanity at creation. |
| Sanity dataset | `production` (simple name — each project is already isolated per client) |
| Sanity Studio URL | `[client-slug].sanity.studio` — deployed per client in Phase 4b |
| Sanity free tier | Sufficient for all client sites — 500k CDN requests/month, 10GB bandwidth, 5GB storage per project |
| Template repo | `github.com/drwbry/The-Web-Foundry` (local clone: `~/projects/the-web-foundry/db-design-website`) |
| Client repos dir | `~/projects/the-web-foundry/clients/[client-slug]-website` |
| Worker URL | `https://web-foundry-form-relay.cincinnati-web-foundry.workers.dev` |
| Form routing | Server-side only: Worker looks up `site_id` in KV → `toEmail`. There is **no** `to_email` form field — the Worker deliberately ignores client-supplied recipients (spoofing risk). |
| Turnstile | One widget per client — create in Cloudflare dashboard, record site key in Site Plan |
| VPS IP | `148.113.196.32` — used for DNS A records only. Direct port 8000 access is firewalled off. |
| Coolify dashboard/API | `https://coolify.thewebfoundry.org` (moved here from `148.113.196.32:8000` ~2026-07-30 for security; update if it moves again) |
| Resend from | `forms@cincinnatiwebfoundry.com` |
| Sanity env vars | `SANITY_PROJECT_ID` + `SANITY_DATASET` — both need "Available at Buildtime" in Coolify |
| Booking embeds | Calendly (free tier) is the default; Acuity/Square Appointments/OpenTable/Resy if client already uses one |
| Ordering | Ladder, in order: **(1) Foundry-built pre-order form** (our Worker, $0, no third-party account — the default) → **(2) Square Online free plan** ($0/mo + 2.9%+$0.30, real cart, link-out not embed) → **(3) paid SaaS** only for delivery dispatch/POS depth. **GloriaFood is discontinued** (Oracle; retires 30 Apr 2027, no new signups) — never propose it. |
| Payments | Stripe **Payment Links** (invoice pay, gift cards) — zero server code; real clients use their own Stripe account, demos use TWF's in test mode |
| Copy rule | **Never describe the service as "free."** Small one-time build fee + one monthly invoice — community-project pricing language ("priced to cover our costs"). |

---

## Phases Overview

```
Phase 0 — Discovery        ← MUST complete before any code
Phase 1 — Planning         ← Review answers, make tech decisions, get sign-off
Phase 2 — Sanity Setup     ← [MANUAL]
Phase 3 — Repo Fork        ← [MANUAL] + automated cleanup
Phase 4 — Build            ← Only after Phase 1 sign-off
Phase 5 — Worker/KV/Turnstile ← Automated + [MANUAL] Turnstile widget
Phase 6 — Coolify          ← [MANUAL]
Phase 7 — DNS              ← [MANUAL] (always Cloudflare)
Phase 7b — Email Routing   ← [MANUAL, if client needs email forwarding]
Phase 8 — Webhook          ← [MANUAL]
Phase 9 — QA               ← Checklist
Phase 10 — Client Handoff  ← [MANUAL]
```

### Fork: is there an existing live site on the target domain?

Ask this in Phase 0 and route accordingly. The two tracks differ mainly in **cutover ordering and DNS risk**, not in how the site gets built.

```
NET-NEW (domain parked / newly registered / no live services)
  → Phases 0–10 exactly as written below. This path is well-worn.

TAKEOVER (domain already serves a site, and/or carries live business email)
  → Read "Migration Track" immediately below FIRST, then run Phases 0–10
    with the noted substitutions. Phase 6 and Phase 7 change order.
```

A takeover is materially riskier than a net-new build: the domain is usually carrying **live company email**, and a careless DNS move breaks it for everyone. Treat the migration track as mandatory reading, not optional.

---
