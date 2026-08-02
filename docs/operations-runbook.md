# Website Factory Operations Runbook

Read this runbook before changing forms, the shared Cloudflare Worker, client onboarding, showcase setup, DNS/email, or multi-tenant deployment.

## Contact Forms & Security

All forms POST to a **shared Cloudflare Worker** (`worker/index.js`) deployed at `web-foundry-form-relay.cincinnati-web-foundry.workers.dev`. The Worker handles email delivery via Resend (internal notification + branded confirmation to submitter).

### Required form reliability rules (for every new client)

- Include a hidden `site_id` field (client slug) on every form. The Worker resolves the
  destination inbox server-side from KV via `site_id` (fallback: its `TO_EMAIL` env var).
  Do **not** add a `to_email` field — the Worker deliberately ignores client-supplied
  recipients (spoofing risk), so the field does nothing except leak into the
  notification email as a stray row.
- Submit as JSON (`Content-Type: application/json`) to the Worker, not multipart `FormData`.
- Frontend must only show success UI when `response.ok === true`.
- On failure, keep the form visible, show inline error, and refresh Turnstile token.
- Verify Worker CORS includes every live origin (`https://domain`, `https://www.domain` when used).

**Security layers:**
- **Cloudflare Turnstile** — bot verification widget on every form, token verified server-side in Worker
- **CORS lockdown** — Worker only accepts requests from domains listed in `ALLOWED_ORIGINS` env var
- **Honeypot** — hidden `botcheck` checkbox catches naive bots

**Worker env vars** (set via `wrangler secret put`):
- `TURNSTILE_SECRET_KEY` — fallback Turnstile server key, used only for sites with no
  per-site secret in KV (e.g. the Foundry hub's own form). **Not shared across client
  widgets** — see the KV `turnstileSecretKey` field below for why this matters.
- `ALLOWED_ORIGINS` — comma-separated allowed domains (e.g. `https://cincinnatiwebfoundry.com,http://localhost:4321`)
- `RESEND_API_KEY` — Resend email API key
- `TO_EMAIL` — internal notification recipient
- `ENFORCE_TURNSTILE` — optional strict mode (`true` to hard-fail invalid/missing Turnstile; default launch-safe mode is unset/false)

**Per-site Turnstile secret (`turnstileSecretKey` in KV, fixed 2026-07-29):** Each Cloudflare
Turnstile widget (site key) has its **own distinct secret key** — secrets are not shared across
widgets in an account, even under the same Cloudflare login. Every client gets their own widget
(Phase 5d), so every client needs their own secret stored in their `WEB_FOUNDRY_SITES` KV entry
as `turnstileSecretKey`. The Worker uses `config.turnstileSecretKey` when present, falling back
to the global `TURNSTILE_SECRET_KEY` only if it's missing. Get the value from **Cloudflare
Dashboard → Turnstile → [widget] → Edit Widget → Secret Key**. Until a client's KV entry has
this field, flipping `enforceTurnstile:true` for them will fail every submission with
`invalid-input-secret` — this went undetected platform-wide for months because
`enforceTurnstile` defaulted to `false` everywhere, so siteverify was never actually exercised
for any client. Before flipping the flag for **any** client, confirm `turnstileSecretKey` is
set in their KV entry first.

**Deploy Worker:** `cd worker && npx wrangler deploy`

### Post-deploy form smoke test (mandatory)

1. Submit one real form on the live domain.
2. Confirm internal notification reaches client inbox.
3. Confirm submitter confirmation email arrives.
4. If either fails, run:

```bash
cd worker
npx wrangler tail --format pretty --sampling-rate 0.99
```

## Keeping the Onboarding Skill Current

The client onboarding process is captured in the canonical shared skill at `skills/web-foundry-onboarding/` in this repo. Both `~/.claude/skills/web-foundry-onboarding` and `~/.agents/skills/web-foundry-onboarding` are symlinks to it, so Claude Code and Codex read the same workflow — edit the canonical directory, never the symlink paths. **Any time you make a change that affects how a new client site is spun up, update that skill immediately.** This includes:

- Changes to the Worker (new env vars, KV structure, form fields, deploy commands)
- Sanity schema or dataset conventions
- Coolify deployment steps or env var names
- Turnstile configuration
- DNS or domain setup changes
- New lessons learned from real onboardings

Also update `docs/cowork-intake-brief.md` and `docs/intake-form.md` if the changes affect what Cowork needs to know or what we ask clients.

## Adding a New Showcase Page

1. Copy the structure of an existing showcase page in `src/pages/showcase/`
2. Pick a distinct aesthetic (fonts, palette, motion style) — use the active tool's frontend or product-design workflow; in Claude Code, use the **frontend-design** skill
3. Link from `index.astro` — add a new `.project-card` in the showcase grid
4. Add the matching color swatches and mock wireframe CSS using the `.project-card__mock--[name]` pattern
5. Add a Turnstile widget (`<div class="cf-turnstile" data-sitekey="..." data-theme="auto">`) inside the contact form

## DNS & Email Setup

All domains use **Cloudflare for DNS management** and **Cloudflare Email Routing** for email forwarding (beyond form submissions).

### DNS Migration Process
1. Add domain to Cloudflare (creates nameserver pair)
2. Update domain registrar nameservers to point to Cloudflare
3. Cloudflare auto-imports existing DNS records (no data loss)
4. Verify Resend DKIM/SPF/MX records are present and verified

### Email Routing via Cloudflare
**For form submissions:** Cloudflare Worker + Resend (handled by `worker/index.js`)
**For general inbox forwarding:** Cloudflare Email Routing with routing rules
- Example: `hello@domain.com` → personal Gmail inbox
- Uses "Send to email" action (not Worker)
- No catch-all rules — only forward specific addresses to avoid spam/typos

**Why Cloudflare:**
- Single source of truth for DNS + email routing
- Auto-migrates records on nameserver switch
- Email Routing is free tier included
- Scales across all client sites

## Multi-Tenant Architecture (Website Factory)

This codebase is designed as a **base template** for spinning up client websites. The target is 20–30 static sites on a single 4-core/8GB VPS.

**Model:**
- Each client = 1 static Astro site forked from this template repo
- All sites share one Cloudflare Worker for form handling (serverless, zero VPS cost)
- Client sites use standard routes (`/menu`, `/services`, `/testimonials`) not `/showcase`
- Each client gets their own domain, GitHub repo, Coolify deployment, and Sanity dataset

**Scaling the Worker:**
- Add each new client domain to the Worker's `ALLOWED_ORIGINS`
- Every form must include a `site_id`; store per-site config (destination email, business name, brand colors, site URL) in Cloudflare KV

**Coolify tips:**
- Queue builds (don't run concurrent) to avoid CPU spikes from 3–4 simultaneous `npm run build`
- Each static site uses ~0 RAM at runtime (nginx serves files) — VPS headroom stays high
