# Phase 7/7b — DNS and Email Routing

## Contents

- Cloudflare zone
- VPS records
- Nameserver delegation
- DNS and HTTPS verification
- Optional Cloudflare Email Routing

## Preserved Playbook

## Phase 7 — DNS [MANUAL]

**Pause and present these instructions to the user.** All client domains use **Cloudflare for DNS management** — regardless of where the domain was purchased (Namecheap, GoDaddy, etc.). DNS is always migrated to Cloudflare before launch.

### Step 1: Add domain to Cloudflare [MANUAL]

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/) → click **Add a site**
2. Enter the client's domain → Continue
3. Select the **Free** plan → Continue
4. Cloudflare scans and auto-imports existing DNS records — review but don't delete records you don't recognize
5. Copy the **two Cloudflare nameservers** shown (e.g. `aria.ns.cloudflare.com` and `blake.ns.cloudflare.com`)

### Step 2: Verify VPS A Records in Cloudflare

Ensure these two records exist (they may have been auto-imported, or add them manually):

| Type | Name | Value | Proxy status | TTL |
|------|------|-------|--------------|-----|
| **A** | `@` | `148.113.196.32` | DNS only (grey cloud) | Auto |
| **A** | `www` | `148.113.196.32` | DNS only (grey cloud) | Auto |

> **Keep proxy set to "DNS only" (grey cloud), not "Proxied" (orange cloud).** Coolify + Traefik handle HTTPS via Let's Encrypt directly. Proxying through Cloudflare interferes with ACME cert provisioning.

### Step 3: Update nameservers at registrar [MANUAL]

**Present to user:** In whatever registrar holds the domain, find the **Nameservers** setting and replace the current values with the two Cloudflare nameservers from Step 1.

- **Namecheap:** Domain List → Manage → Nameservers → select "Custom DNS" → enter both Cloudflare nameservers
- **GoDaddy:** My Domains → DNS → Nameservers → Change → Enter my own nameservers
- Other registrars: look for "Custom DNS" or "External Nameservers"

### Step 4: Wait for Cloudflare activation

- Cloudflare polls and activates the domain — usually within 5–30 minutes, up to 24 hours
- Dashboard shows "Active" status once confirmed; you'll also receive a confirmation email
- After activation, A records propagate almost immediately

### DNS Verification

Once active, verify:
```bash
dig +short [domain.com]       # should return 148.113.196.32
dig +short www.[domain.com]   # should return 148.113.196.32
```

HTTPS (Let's Encrypt) won't provision in Coolify until DNS resolves to the VPS.

### After DNS Propagates

Once `dig` returns the correct IP:
1. Visit `https://[domain.com]` — should load the site with HTTPS
2. Visit `https://www.[domain.com]` — should also work
3. If HTTPS doesn't work immediately, check Coolify's SSL tab — Let's Encrypt may need a manual retry

### Note on Form Email Records

Client domains do **not** need Resend/email DNS records. All form emails send from `forms@cincinnatiwebfoundry.com` (Foundry domain). SPF, DKIM, DMARC, and MX records for Resend only exist on `cincinnatiwebfoundry.com`.

---

## Phase 7b — Cloudflare Email Routing [MANUAL, if needed]

**Skip this section if the client does not need a business email address.**

**When to use:** Client wants a professional address (e.g. `hello@domain.com`) forwarded to their personal Gmail or other inbox — without paying for Google Workspace. This is separate from form submissions (handled by the CF Worker + Resend).

> Cloudflare Email Routing is free, included on all plans, and handles MX records automatically.

### Setup

Cloudflare has redesigned this UI at least once since this section was first written — the nav path and the "how it activates" behavior below are current as of the MAB Properties onboarding (2026-07-08). If it's moved again, the underlying model (destination addresses are account-wide, routing activates on first rule) is likely still true even if the exact clicks aren't.

1. Navigate: left sidebar → **Compute** (under "Build") → **Email Service** → **Email Routing**. Make sure the domain breadcrumb at the top shows the client's domain, not a different one on the same account.
2. **Don't hunt for a single "Enable Email Routing" button — there may not be one.** In the current UI, visiting this section for a domain can pre-stage the required DNS records (3× MX to `route[1-3].mx.cloudflare.net`, a DKIM TXT, an SPF TXT) automatically, visible under **Settings → DNS records** as "Locked." Despite that, the **Status** badge at the top stays **Disabled** until the domain has at least one active routing rule — creating the first rule is what flips it to Enabled, not a separate toggle. Don't waste time looking for one.
3. **Check Destination Addresses before adding anything.** Destination addresses are **account-wide**, shared across every domain on that Cloudflare account — not per-domain. If this account has been used for other Web Foundry sites, you'll likely see an unrelated address already verified there (e.g. the hub's own `cincinnatiwebfoundry@gmail.com`). **Do not reuse another site's address** — add the current client's inbox explicitly, even if it feels redundant.
4. **Destination Addresses** tab → **Add address** → enter the client's inbox (e.g. `hello@gmail.com`) → Cloudflare sends a verification email to that inbox. **Someone with access to that actual inbox must click the confirmation link** before it can receive forwarded mail — this is not something you can do on the client's behalf from the Cloudflare dashboard. If the client isn't immediately available to check their email, this step will stall — note it and come back once they confirm.
5. Once the destination is verified: **Routing rules** tab → create a rule per custom address needed:
   - **Custom address:** `hello@[domain.com]` (or `help@`, `info@`, `contact@`, etc. — whatever the client wants)
   - **Action:** Send to email
   - **Destination:** the now-verified inbox
6. Creating that first rule activates routing for the domain (Status flips to Enabled automatically).

**Rules:**
- Only create rules for addresses the client actually needs
- Do **not** create a catch-all rule — it forwards all typos and spam
- Multiple addresses: create a separate routing rule for each one, all can point to the same verified destination
- Do not manually add MX records — they're pre-staged automatically per Step 2 above

---
