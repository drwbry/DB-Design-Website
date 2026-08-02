# Phase 9–10 — QA, Handoff, and Known Failure Modes

## Contents

- Code review and verification
- Content, forms, visual, SEO, and infrastructure QA
- Client handoff
- Common mistakes and recovery

## Preserved Playbook

## Phase 9 — QA Checklist

**Before starting:** invoke the `code review` capability from `tool-adapters.md` to review all code against the Site Plan. Then invoke the `verification` capability to verify each item below with actual evidence (not assumptions).

Run through every item. Do not skip.

### Content & Functionality
- [ ] All pages render without errors
- [ ] Sanity content appears correctly (publish something → rebuild → verify)
- [ ] Sanity fallback values work (test with empty/missing content)
- [ ] All internal links work (no 404s)
- [ ] All external links open correctly (maps, social, booking embeds)
- [ ] Third-party embeds actually function end-to-end, not just render: Calendly (book a real test slot), Square Online (place a test order if the client set one up), Stripe Payment Link (opens; if testing payment, use the client's Stripe **test mode** + card `4242 4242 4242 4242`)
- [ ] Pre-order form (if built): submit one, confirm the order reference shows in the success message and lands in the client's notification email, and that a past pickup date can't be chosen
- [ ] No `REPLACE_ME` placeholders left in `src/config/site.js` or page code (`grep -rn "REPLACE_ME" src/`)
- [ ] Privacy page has correct business name and contact info (and doesn't render unstyled — see the hub.css token trap)
- [ ] No leftover fictional showcase content (business names, phone numbers, Unsplash photos): `grep -rin "peak flow\|sweet crumb\|lumière\|lumiere\|555-" src/`
- [ ] No "free" language anywhere in Web Foundry-related copy (footer badge, credits)

### Forms
- [ ] Form submit → notification arrives at **client's email** (not Foundry inbox) — proves the KV `site_id` routing works
- [ ] Submitter receives branded confirmation email with correct business name and client brand colors
- [ ] Turnstile challenge appears and validates
- [ ] Form has the hidden `site_id` routing field
- [ ] Form only shows success UI on `response.ok` (no false success)
- [ ] A failed submission re-enables the form and resets Turnstile (retry then succeeds)
- [ ] Honeypot field is hidden and doesn't interfere
- [ ] Form shows success message after submission
- [ ] Form shows error gracefully if submission fails
- [ ] Worker logs are clean during live test submission (no unexpected 4xx/5xx)

### Responsive & Visual

Verify visually with real screenshots, not by reading CSS — Playwright is a devDependency in every fork. Launch `npm run dev`, then screenshot with `chromium.launch()` → `page.goto()` → `page.screenshot()` at 375/768/1440 viewports. Known gotchas:
- **Scroll first:** `.reveal` elements are invisible until IntersectionObserver fires — scroll through the whole page in steps before screenshotting, or below-the-fold sections capture as blank.
- **Don't trust `fullPage: true`:** it duplicates/freezes `position: sticky` navs mid-page (Playwright capture artifact, not a site bug). Use viewport screenshots at several scroll positions instead.
- **Use `waitUntil: 'load'`, not `'networkidle'`** — third-party scripts (Turnstile, Calendly) keep the network busy and time out `networkidle`.
- Sandboxed environments without external DNS render fallback fonts and no Turnstile — that's environmental, not a bug.

- [ ] Mobile layout — 375px (phone)
- [ ] Tablet layout — 768px
- [ ] Desktop layout — 1280px+
- [ ] Scroll animations trigger correctly
- [ ] Counter animations work (if used)
- [ ] Images load, are properly sized, and have alt text
- [ ] Logo and favicon appear correctly
- [ ] No horizontal scrolling on any viewport

### SEO & Performance
- [ ] `<title>` tag is set with business name on every page
- [ ] `<meta name="description">` is set on every page
- [ ] OG meta tags present (`og:title`, `og:description`, `og:image`, `og:url`)
- [ ] `sitemap.xml` generates at `/sitemap-index.xml` (Astro sitemap plugin)
- [ ] `robots.txt` points to the client domain's sitemap, not the template domain
- [ ] No mixed content warnings (all assets over HTTPS)
- [ ] Lighthouse performance score > 90 (run: Chrome DevTools → Lighthouse)

### Infrastructure
- [ ] HTTPS works on naked domain (`https://[domain.com]`)
- [ ] HTTPS works on www (`https://www.[domain.com]`)
- [ ] Baseline security headers present on live site: `Strict-Transport-Security`, `X-Frame-Options` (or equivalent `frameDeny`), and `X-Content-Type-Options: nosniff`
- [ ] Sanity publish → Coolify rebuild fires → content updates on live site
- [ ] Git push to `main` → Coolify auto-deploy fires

### Navigation
- [ ] Nav bar appears on all pages (fixed, top)
- [ ] Logo links to homepage
- [ ] Active page is highlighted in nav
- [ ] All nav links work correctly
- [ ] CTA button links to contact/booking page
- [ ] Mobile hamburger menu opens/closes correctly
- [ ] Nav doesn't overlap page content (hero has enough top padding)

### DBCredit badge
- [ ] "Built with The Web Foundry" badge appears on all pages
- [ ] Badge links to `cincinnatiwebfoundry.com`

---

## Phase 10 — Client Handoff [MANUAL]

### If client will self-edit in Sanity:
1. Schedule a **Sanity walkthrough** (screen share recommended):
   - How to log in to `https://[client-slug].sanity.studio`
   - How to create/edit/publish each content type
   - Explain that publishing triggers an automatic site rebuild (~1-2 min delay)
   - Show them draft vs. published state
2. Send a follow-up email with:
   - Studio URL: `https://[client-slug].sanity.studio`
   - Their login credentials (they set their own via invite)
   - Quick reference for what they can edit

### For all clients:
- Confirm the client has verified the live site
- Confirm form submissions are arriving at the correct email
- Provide contact info for future support/changes

---

## Common Mistakes

| Mistake | Correct approach |
|---------|-----------------|
| Starting build before Site Plan is approved | Complete Phase 0–1 fully first |
| Building Sanity schemas that weren't in the plan | Only build what was confirmed in Site Plan |
| Adding a new client to an existing Sanity project | Each client gets their own project — full isolation so clients can't affect each other |
| Using the shared Turnstile site key for new clients | Each client gets their own Turnstile widget (10-hostname limit per widget). Create in Phase 5d. |
| Forgetting to add client domain to Turnstile widget hostnames | Widget shows "unable to connect" — add the naked domain in Cloudflare Turnstile settings |
| Adding both naked and `www` to a Turnstile widget | Redundant — a hostname automatically authorizes all its subdomains. List the naked domain only. |
| Leaving `enforceTurnstile: false` after launch | Cloudflare's Turnstile page warns *"Siteverify isn't being called"* — because the Worker only calls siteverify when the flag is on. Tokens are issued and discarded, so the form has no bot protection beyond CORS + honeypot. Flip to `true` per site after live verification, then submit a real form to confirm. |
| **[TAKEOVER]** Trusting Cloudflare's DNS auto-scan | It cannot enumerate a zone — it guesses common names and silently misses account-specific records (third-party DKIM selectors especially). Export the zone from the registrar and diff. See Migration Track M2. |
| **[TAKEOVER]** Importing a zone file onto existing records | Cloudflare's import is additive. Duplicate SPF = DMARC `permerror`. Delete all records first, then import, then check the count. |
| **[TAKEOVER]** Importing with "Proxy imported DNS records" checked | Breaks DKIM CNAMEs, M365 service endpoints, and blocks Let's Encrypt on apex/www. Import unproxied. |
| **[TAKEOVER]** Delegating nameservers without pre-verifying the zone | Cloudflare serves the zone before delegation — `dig @<assigned-ns>` and confirm every mail record first. Turns the riskiest step into a verified one. |
| **[TAKEOVER]** Adding domains in Coolify before DNS resolves | Traefik burns Let's Encrypt's 5-failures-per-hostname-per-hour limit on failed challenges, delaying the real cert by up to an hour. On takeovers, do DNS first (Migration Track M5). |
| **[TAKEOVER]** Migrating a domain with DNSSEC still enabled | Resolution breaks hard on the nameserver change. Disable at the registrar and let it expire first. Check `delegationSigned` in RDAP during M1. |
| **[TAKEOVER]** Moving a sibling domain that has its own MX | Puts a second, unrelated mail system at risk for zero benefit. Registrar-forwarded domains follow the apex by hostname and need no changes at all. |
| **[TAKEOVER]** Cancelling the old hosting before redirects are verified | That account holds the only copy of the old content, and it's unreachable once DNS moves. |
| **[TAKEOVER]** Assuming the client's description of their domains is accurate | Look every one up. On the ITA run a "redirects to us" domain actually pointed at a different company entirely. |
| Setting `ALLOWED_ORIGINS` as a wrangler secret | Plain var in `wrangler.toml` — edit + redeploy |
| Leaving the template sitemap URL in `robots.txt` | Update it to the client domain before launch |
| Not setting `trailingSlash` intentionally | Sitemap/canonical URLs may disagree with deployed routes and create redirect noise |
| Forgetting `site_id` in form | Worker falls back to Foundry inbox instead of client email — KV lookup via `site_id` is the *only* routing mechanism |
| Adding a `to_email` hidden field expecting it to route | The Worker deliberately ignores client-supplied recipients (spoofing/spam-relay risk). The field does nothing except leak into the notification email as a stray row. Routing = KV `toEmail`, keyed by `site_id`. |
| Using multipart `FormData` with a JSON-only Worker | Worker returns `Invalid JSON` and form fails |
| Native form `action`/`method` attributes as fallback | Non-JS post sends form-encoded data → `Invalid JSON`. JS submission is the only path; omit `action`/`method`. |
| Showing success UI without checking `response.ok` | User sees false success while email silently fails |
| Not calling `turnstile.reset()` after a failed submit | The consumed token is single-use — every retry fails verification until page reload |
| Turning on strict Turnstile before widget/hostnames are verified | Legit submissions fail with `Verification failed` |
| Using global `ENFORCE_TURNSTILE=true` to fix one site | Can hard-fail forms for every client on the shared Worker; prefer per-site KV `enforceTurnstile` |
| Assuming `enforceTurnstile`/`ENFORCE_TURNSTILE` gate anything without checking `worker/index.js` | For a long time these were documented here but never actually read in the code — Turnstile verification was unconditionally mandatory regardless of either setting. Fixed 2026-07-08 (template repo commit `8baaf33`): KV lookup now happens before the Turnstile check so both flags actually work, defaulting fail-open. If you ever touch this logic again, verify both branches live against the deployed Worker — a no-token POST to a fail-open site should return `{"success":true}`, and to an `enforceTurnstile:true` site should 400 — don't trust it just because the code compiles. |
| Assuming all Turnstile widgets share one secret because they're in the same Cloudflare account | They don't — each widget (site key) has its own distinct secret key. Fixed 2026-07-29 (ITA Data Solutions live test): flipping `enforceTurnstile:true` for any client without their own `turnstileSecretKey` in KV hard-fails every submission with `invalid-input-secret`, because the Worker was sending the wrong secret for that client's widget. This was invisible platform-wide for months since `enforceTurnstile` defaulted to `false` everywhere — siteverify was never actually exercised for any client until that night. The Worker now reads `config.turnstileSecretKey` per-site (falling back to the global env var only when absent); every client's widget secret must be added to their KV entry (Phase 5d Step 5) before their flag is ever flipped to `true`. **Terry's Lawncare and MAB Assets almost certainly have the same gap** — their KV entries predate this fix and don't have `turnstileSecretKey` set. |
| Running `wrangler` commands (KV, `deploy`) from a client fork's `worker/` directory | There's one shared Worker, deployed only from the template repo's `worker/`. A client fork's copy (if not deleted per Phase 3) is a stale snapshot — deploying from there silently regresses the shared Worker to whatever code existed at fork time. Always `cd ~/projects/the-web-foundry/db-design-website/worker` first. |
| Running `cd studio && npx sanity deploy` from the template repo when you meant a client's studio | Each client has a separate Sanity project — running from `db-design-website/studio` deploys the *template's own* studio (`cincinnati-web-foundry.sanity.studio`, project `dll5zv5a`), not the client's. Not destructive (schema deploys don't touch documents) but not what you meant. Always `cd` into the specific client repo's `studio/` first, and check `sanity.cli.ts`'s `projectId` if unsure which project you're about to deploy to. |
| Forgetting honeypot field in form | Bots can spam without it |
| `useCdn: true` | Always `false` for static builds |
| Env vars without "Available at Buildtime" | Astro build can't read them |
| Concurrent Coolify builds | Queue them — VPS has limited CPU |
| Setting up webhook in wrong Sanity project | Each client has their own project — go to that client's project in sanity.io/manage, not a different one |
| Sanity webhook returns 401 Unauthenticated | Coolify requires auth — add `Authorization: Bearer [token]` in the webhook's HTTP Headers section. The URL alone is not enough. |
| Creating a new Coolify API token for every client | One token covers the whole Coolify instance — create it once, reuse it for every client's Sanity webhook |
| Not adding `www` domain in Coolify | www visitors get SSL error or 404 |
| Using "Proxied" (orange cloud) for A records in Cloudflare | Interferes with Traefik/Let's Encrypt cert provisioning — always use "DNS only" (grey cloud) |
| Adding MX records manually when using CF Email Routing | Cloudflare adds them automatically when Email Routing is enabled — don't add manually |
| Creating a catch-all email routing rule | Forwards all spam and typos — only create routing rules for specific addresses the client needs |
| Forgetting to verify destination email in CF Email Routing | Forwarding stays inactive until the destination inbox confirms via verification email — this requires someone with access to that inbox, can stall the phase, and can't be done on the client's behalf |
| Hunting for an "Enable Email Routing" button in Cloudflare's current UI | There may not be one — DNS records can pre-stage automatically, but the domain's Status stays "Disabled" until it has its first active routing rule. See Phase 7b Setup, step 2. |
| Assuming a Cloudflare Email Routing destination address is specific to the current domain | Destination addresses are account-wide across every domain on that Cloudflare account. Check Destination Addresses before adding — you may find another client's already-verified address there; don't reuse it. |
| Skipping schema deploy (`npx sanity deploy`) | Studio won't show new content types |
| Not seeding initial content before build | Pages render with fallback/empty states |
| Forgetting privacy page | Every site needs one — update template with client info |
| Deleting `hub.css` without re-tokening `privacy.astro` | Privacy page styles reference hub tokens (`--ink`, `--accent`, `--muted`, `--cream`) — page silently renders unstyled/invisible. Redefine tokens with client palette. |
| Rebuilding a page the showcase already solved | Harvest the industry-matching showcase page first (plumber=trades, bakery=food, salon=appointments) — re-skin tokens + content instead of building from scratch |
| Shipping fictional showcase content | Grep for `peak flow`, `sweet crumb`, `lumière`, `555-` before launch — no demo names, phones, or Unsplash placeholders in a client site |
| Hardcoding integration URLs inline in markup/JS | All fork-swappable values (Calendly URL, Stripe link, site_id, phone, Worker URL, Turnstile key) live in `src/config/site.js` — nowhere else |
| Recommending GloriaFood at all | It's discontinued — Oracle retires it 30 Apr 2027 and it takes no new signups. Older versions of this skill made it the default; that advice is dead. Use the ordering ladder: pre-order form → Square Online → paid SaaS. |
| Assuming an ordering tool must be an embed | Our pre-order form is ours, and Square Online is a hosted store we link out to. Neither is a script you paste in. Only Calendly is a true embed. |
| Building/embedding a checkout server for payments | Stripe **Payment Links** only — link-out, zero server code, client's own Stripe account |
| Describing the service as "free" anywhere | There's a small build fee + monthly invoice. Use community-project pricing language ("priced to cover our costs"). |
| Cloning client repo outside `~/projects/the-web-foundry/clients/` | All client repos go under `clients/` — keeps them grouped and separate from template |
| Missing project instructions | Every client repo needs canonical `AGENTS.md` plus a thin `CLAUDE.md` importing `@AGENTS.md` so both agents share future context |
| Trying to fork your own repo | GitHub blocks this — use "Use this template" instead (template repo setting must be enabled) |
| Skipping `npm install` in `studio/` | Studio has its own `package.json` — must install before `npx sanity deploy` |
| Forgetting to update `studio/sanity.cli.ts` dataset | CLI config is separate from `sanity.config.ts` — both need the client dataset |
| No nav bar | Every client site needs a persistent Nav component in BaseLayout — don't rely on BackButton alone |
| Hardcoding the Coolify base URL anywhere (workflow files, docs, scripts) | It has already moved once (`148.113.196.32:8000` → `https://coolify.thewebfoundry.org`, 2026-07-30, for security) and direct IP:port access was firewalled off in the process. Every hardcoded copy broke silently and stayed broken for days before anyone noticed. If it moves again, grep the whole `the-web-foundry` tree for the old value — don't assume you found every reference. |
| Trusting Coolify's "auto-deploy on push" toggle without a live test | The `coolify-web-foundry` GitHub App's webhook URL (GitHub → Developer settings → GitHub Apps) does **not** auto-update when Coolify's own URL changes — it's a separate manual setting. Found broken platform-wide 2026-08-01: it had been silently failing since ~2026-07-30, so every client site stopped auto-deploying and nobody noticed because nothing errors visibly — the push just does nothing. Verify with a real test (empty commit, check the app's deployment history for a new `is_webhook: true` entry within ~2 minutes), not by reading the toggle state. |
| Copy-pasting a custom GitHub Actions deploy workflow (`curl .../api/v1/deploy?uuid=...`) between client repos without changing the `uuid` | Found 2026-08-01: `mabassets-website` and `terrys-lawncare-website` both had `db-design-website`'s UUID hardcoded in their own `deploy.yml`, inherited from copying the template's workflow. Combined with a missing `COOLIFY_TOKEN` secret in both repos, these workflows had failed on literally every run since creation (day one for both) without anyone noticing, because Coolify's native webhook was doing the real deploying instead. If you use this pattern at all, prefer the native GitHub App webhook (Step 5) and treat this workflow as redundant, or double-check the UUID through the active Coolify adapter's application listing every time it is copied. |
| Left-heavy hero with no visual balance | Hero needs centered layout or visual element (image/illustration) on the right — don't leave half the viewport empty |
| Skipping `design exploration` | Design decisions should go through the active agent adapter, not be guessed. Invoke it in Phase 4d. |
| Skipping `code review` before QA | Run the active agent's code-review capability against the Site Plan before declaring Phase 9 complete |
| Coolify domains without `https://` prefix | Domains field requires full URL: `https://domain.com,https://www.domain.com` — without protocol, Traefik won't route |
| "no available server" after deploy | Restart the Coolify proxy (Servers → Proxy → Restart), and ensure domains have `https://` prefix |
| First Coolify build fails (nixpacks timeout) | First build downloads ~600MB of nix packages — retry usually works due to Docker layer caching. If persistent, add a Dockerfile to skip nixpacks |
| Committing/pushing before Coolify deploy | Coolify pulls from GitHub — all code must be committed and pushed before triggering a build |
| Shipping without baseline proxy security headers | Add a Traefik `security-headers` middleware in Coolify Container Labels before sign-off |
| Adding CSP too early with copied values | Start with baseline proxy headers first; introduce CSP only after verifying all third-party assets, embeds, and form flows |
