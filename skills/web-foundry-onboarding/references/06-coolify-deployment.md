# Phase 6 — Coolify Deployment

## Contents

- Resource and repository
- Build configuration and environment
- Domains and auto-deploy
- Security headers
- Webhook URL
- First deployment

## Preserved Playbook

## Phase 6 — Coolify Deployment [MANUAL]

**Pause and present these step-by-step instructions to the user.**

In Coolify at `https://coolify.thewebfoundry.org`:

### Step 1: Add new resource to existing project
1. Go to **Projects** → **Community Website Showcase** → click **+ Add Resource**
2. Select **Private Repository (with GitHub App)**
3. If no GitHub App exists yet (first-time only): Coolify will prompt to create one. Name it `coolify-web-foundry`, leave Organization blank, check **System Wide**, click Continue. Authorize on GitHub and grant access to **All repositories** so future client repos work automatically.
4. Select repo `drwbry/[client-slug]-website` → Branch: `main`

> **Note:** Do NOT create a new project. All client sites live as resources under the existing "Community Website Showcase" project.

### Step 2: Configure build
1. Build command: `npm run build`
2. Output directory: `dist`
3. Base directory: `/` (leave default)

### Step 3: Set environment variables
Add these two env vars — **check "Available at Buildtime" on BOTH**:

| Variable | Value | Buildtime? |
|----------|-------|------------|
| `SANITY_PROJECT_ID` | `[client-project-id]` | Yes |
| `SANITY_DATASET` | `production` | Yes |

### Step 4: Add domains
Add **both** the naked domain and www **with `https://` prefix** — Traefik requires the protocol:
- `https://[client-domain.com]`
- `https://www.[client-domain.com]`

Enter them comma-separated in the Domains field: `https://[client-domain.com],https://www.[client-domain.com]`

Let's Encrypt will auto-provision SSL certificates once DNS resolves.

> **If you see "no available server" after deploy:** the domains are missing the `https://` prefix, or the proxy needs a restart (Servers → your server → Proxy → Restart).

### Step 5: Enable auto-deploy
Turn on automatic deployment on push to `main`.

> ⚠ **This relies on the `coolify-web-foundry` GitHub App's webhook URL being current.**
> Confirmed broken 2026-08-01 for every existing client: GitHub's registered webhook still
> pointed at the pre-migration Coolify address and had been silently failing since ~2026-07-30,
> so pushes stopped triggering builds for every app on this instance (verified with a live
> test push — no deployment fired). The webhook URL is set in **GitHub → Settings → Developer
> settings → GitHub Apps → coolify-web-foundry** (app id `3239610`) and does **not** auto-update
> when Coolify's own URL changes — it's a manual edit. Current correct value:
> `https://coolify.thewebfoundry.org/webhooks/source/github/events`. **After onboarding any new
> client, verify auto-deploy actually fires** (push a trivial commit, check the resource's
> deployment history for `is_webhook: true` within ~2 minutes) rather than trusting the toggle.

### Step 6: Add baseline security headers in Container Labels

For standard Coolify applications, add these in the **Container Labels** section using a Traefik headers middleware. This handles the common audit gaps without risking a brittle CSP on day one.

Add middleware definition labels:

```text
traefik.http.middlewares.security-headers.headers.stsSeconds=31536000
traefik.http.middlewares.security-headers.headers.stsIncludeSubdomains=true
traefik.http.middlewares.security-headers.headers.stsPreload=true
traefik.http.middlewares.security-headers.headers.forceSTSHeader=true
traefik.http.middlewares.security-headers.headers.frameDeny=true
traefik.http.middlewares.security-headers.headers.contentTypeNosniff=true
traefik.http.middlewares.security-headers.headers.referrerPolicy=strict-origin-when-cross-origin
traefik.http.middlewares.security-headers.headers.permissionsPolicy=geolocation=(), microphone=(), camera=()
```

Then append `security-headers` to the existing HTTPS router middleware chain:

```text
traefik.http.routers.https-0-[coolify-router-id].middlewares=gzip,security-headers
```

Notes:
> ⚠ **Unchecking "Readonly labels" permanently disables the Domains field.** This is a one-way
> door and it is easy to miss, because the Domains input still *displays* its current value —
> it just silently stops accepting input. Hovering the ⓘ reveals: *"Readonly labels are disabled.
> You can set the domains in the labels section."* From that point on, Coolify no longer generates
> Traefik labels from Domains; **you** are the source of truth.
>
> **To add a domain once labels are manual**, append a full router set for the next index (routers
> are `-0-`, `-1-`, … per hostname). For app uuid `UUID`, domain index `N`:
>
> ```text
> traefik.http.routers.http-N-UUID.entryPoints=http
> traefik.http.routers.http-N-UUID.middlewares=redirect-to-https
> traefik.http.routers.http-N-UUID.rule=Host(`domain.com`) && PathPrefix(`/`)
> traefik.http.routers.http-N-UUID.service=http-N-UUID
> traefik.http.routers.https-N-UUID.entryPoints=https
> traefik.http.routers.https-N-UUID.middlewares=gzip,security-headers
> traefik.http.routers.https-N-UUID.rule=Host(`domain.com`) && PathPrefix(`/`)
> traefik.http.routers.https-N-UUID.service=https-N-UUID
> traefik.http.routers.https-N-UUID.tls.certresolver=letsencrypt
> traefik.http.routers.https-N-UUID.tls=true
> traefik.http.services.http-N-UUID.loadbalancer.server.port=80
> traefik.http.services.https-N-UUID.loadbalancer.server.port=80
> ```
>
> Then **redeploy** — Traefik reads labels off the container, so they only apply on recreate.
> Validate before saving: no duplicate keys, every router has `entryPoints`/`middlewares`/`rule`/
> `service` (+ `tls`/`tls.certresolver` for https), every `service` self-references its own router
> name, every referenced middleware is defined, and each router has a matching
> `loadbalancer.server.port`.
>
> **Do not "fix" this by re-checking Readonly labels** — that hands control back to Coolify, which
> regenerates defaults and wipes the `security-headers` middleware, and re-adding it means
> unchecking again. Circular. **Reset Labels to Defaults** is the recovery path only if you're
> willing to redo the security headers.
>
> The `caddy_*` labels Coolify emits are inert when the server's proxy type is Traefik.
- Keep CSP separate from this baseline. A strict `Content-Security-Policy` often needs client-specific allowances for Turnstile, Google Fonts, Sanity assets, embeds, and form endpoints.
- After saving labels, redeploy and re-check headers on the live domain.

### Step 7: Copy the deploy webhook URL
Go to the resource's **Webhooks** tab and copy the **Deploy Webhook URL**. You'll need this for Phase 8 (Sanity webhook).

**Save this URL — format is typically:** `https://coolify.thewebfoundry.org/api/v1/deploy?...`

### Step 8: Trigger first build
Click **Deploy** to run the initial build. Monitor the build log for errors.

**Important:** Queue builds — do not run concurrent `npm run build` on the shared VPS (4-core/8GB). Each static site uses ~0 RAM at runtime (nginx serves files), but builds are CPU-intensive.

**Wait for the build to succeed before continuing. If DNS isn't pointed yet, the site won't be accessible by domain but the build itself should complete.**

---
