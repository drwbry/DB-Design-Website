# Migration Track — Existing Site or Domain Takeover

## Contents

- M1 inventory
- M2 authoritative zone export
- M3 corrected zone import
- M4 pre-delegation verification
- M5 cutover ordering
- M6 post-delegation verification
- M7 redirects and old content
- M8 legacy domains
- M9 takeover QA

## Recording migration state

Record each of M1–M9 as its own gate in `docs/onboarding-state.md`, using the migration rows in [00-routing-and-state.md](00-routing-and-state.md). Do not collapse them into one entry.

Write the gate's status, evidence, and next action **before** starting the following step. A takeover can pause between any two M-steps, and the resuming agent — possibly the other agent, possibly weeks later — must be able to tell exactly which steps already ran.

This matters most between M4 and M6. Re-running M3 against a zone that has already been imported produces duplicate records, because the Cloudflare import is additive (see the M3 warning). Re-running M5 mid-delegation risks live mail. If a migration gate's status is unclear, re-verify with the read-only checks in M4 rather than re-running the mutating step.

## Preserved Playbook

## Migration Track — Taking Over an Existing Site [TAKEOVER ONLY]

> First run: ITA Data Solutions, 2026-07-29 (`itadata.site` → `itadata.com`). Every warning
> below is something that actually happened or was actually caught on that run.

**The governing rule: the website is the easy part. The domain's *email* is what you can break.**
A takeover domain has usually been in use for years and carries live Microsoft 365 or Google
Workspace mail, marketing-platform DKIM keys, and SaaS verification records. The site can be
down for an hour and nobody notices. If mail breaks, the whole company notices immediately.

### M1 — Inventory before touching anything [automated]

Do this before promising a timeline. It tells you how risky the takeover is.

```bash
D=clientdomain.com
# Registrar, expiry, lock status, DNSSEC — public RDAP with IANA TLD discovery
# $SKILL_DIR is resolved in SKILL.md under "Skill directory"; scripts are not on PATH
"$SKILL_DIR/scripts/rdap-domain.sh" "$D"

# What the domain currently serves and where mail goes
dig +short A $D; dig +short MX $D; dig +short TXT $D; dig +short NS $D
curl -sI https://$D | head -5
```

Do not hard-code a registry endpoint such as Verisign's `.com` service. The script resolves the TLD's current RDAP base URL through IANA's bootstrap registry. A missing bootstrap entry or reserved example domain is a blocker until the real production domain is supplied.

Record these five things:

| Finding | Why it matters |
|---------|----------------|
| **Live MX?** | Business email present → this is a high-risk takeover. Slow down. |
| **DNSSEC signed?** | If `delegationSigned: true`, DNSSEC **must be disabled at the registrar and allowed to expire before** the nameserver change, or resolution breaks hard. Check this early. |
| **Registrar + expiry** | An expiry inside ~60 days changes transfer economics (a transfer includes a year's renewal). |
| **Domain lock status** | Bare `active` with no `clientTransferProhibited` = unlocked and exposed. |
| **Live site + platform** | Determines whether there's content and indexed URLs to preserve. DNS and HTTP headers provide clues, not proof; confirm the CMS/host through provider access, source/admin evidence, or a reliable application fingerprint. |

Also inventory **sibling domains** the client mentions. Look up each one — do not assume the
client's description is accurate. On the ITA run, a domain the client believed redirected to
the target actually redirected to a *different company's* site, and another sibling carried its
own separate Google Workspace mail. Both were correctly left alone.

### M2 — Export the real zone from the registrar [MANUAL] ⚠ CRITICAL

**Never trust Cloudflare's auto-scan as your record source.** Cloudflare cannot enumerate a
zone — DNS has no "list all records" operation — so its scanner *guesses* common names. It
reliably finds apex, `www`, MX, TXT, and standard patterns like `selector1/2._domainkey`. It
reliably **misses** records with account-specific names.

> On the ITA run, the scan imported 10 of 17 CNAMEs. The 7 it missed were the DKIM signing keys
> for HubSpot, Salesforce, and Atlassian (`hs1-46802022._domainkey`, `ita1._domainkey`,
> `atlassian-182b35._domainkey`, …) plus Atlassian's bounce host. Their DMARC is `p=quarantine`,
> so had those gone missing at delegation, every marketing and app email the company sent would
> have silently started landing in spam. Nothing would have bounced. Nobody would have noticed
> for weeks.

Get the authoritative list: **registrar → DNS → Export / Download Zone File**. GoDaddy, Namecheap,
and most registrars all offer this.

### M3 — Build a corrected zone file, then import [automated]

Registrar exports are not directly importable. Fix these first:

| Problem | Fix |
|---------|-----|
| `SOA` and `NS` records present | Delete them — Cloudflare manages these |
| GoDaddy SRV syntax `_sip._tls.@` | Invalid BIND. Rewrite as `_sip._tls` |
| Old host's A records | Replace with `148.113.196.32` |
| `www` as CNAME to apex | Replace with an **A** record → `148.113.196.32` (Let's Encrypt needs it) |
| `_domainconnect` CNAME | Delete — GoDaddy-proprietary, dead after migration |

Then verify your file against the export programmatically before importing. Parse both into
`(name, type, rdata)` tuples and diff. **Assert that every MX, TXT, SRV, `_domainkey`, and bounce
record survives** — those are the mail-critical set. Only the web records should differ.

**Import: Cloudflare → DNS → Records → Import and Export → Import DNS records.**

> ⚠ **The import is ADDITIVE, not a replace.** Importing on top of auto-scanned records produces
> duplicate MX and **duplicate SPF — a hard DMARC `permerror`**, which is worse than the missing
> records you started with. **Delete every existing record in the Cloudflare DNS table first**,
> then import, then confirm the record count matches your file exactly.

Import **unproxied**. Leave "Proxy imported DNS records" unchecked — mail records, Microsoft
service endpoints, and third-party hosts all break behind the orange cloud, and the apex/`www`
must be grey for Let's Encrypt. In a takeover zone there is typically **no** record that wants
proxying.

### M4 — Verify the zone BEFORE delegating [automated] ⭐ highest-value step

Cloudflare serves the zone on its assigned nameservers as soon as it's created — you do not have
to delegate to test it. **Query those nameservers directly and confirm the whole zone before the
registrar change.** This turns the scariest step into a verified one.

```bash
NS=zelda.ns.cloudflare.com   # the pair assigned to this zone
dig +short @$NS $D MX
dig +short @$NS $D TXT | grep spf1
dig +short @$NS _dmarc.$D TXT
for s in selector1 selector2 <every-other-selector-from-your-zone-file>; do
  printf "%-30s %s\n" "$s" "$(dig +short @$NS $s._domainkey.$D CNAME)"
done
dig +short @$NS $D A          # want 148.113.196.32
dig +short @$NS www.$D A      # want 148.113.196.32
```

Every mail record must return a value. If any DKIM line is empty, fix it now — after delegation
it's an outage, before delegation it's a typo.

> One Cloudflare account tends to reuse the same nameserver pair across zones, so you can often
> confirm the pair by checking an existing Foundry domain.

### M5 — Cutover ordering (DIFFERENT from net-new) ⚠

**Net-new does Coolify (Phase 6) → DNS (Phase 7). A takeover reverses this.**

The reason: adding a domain to Coolify starts Traefik requesting a Let's Encrypt cert immediately.
If DNS still points at the old host, every HTTP-01 challenge fails, and LE's **failed-validation
limit is 5 per hostname per hour**. Traefik's retries burn through that, and you end up throttled
— so the real cert is delayed up to an hour *after* DNS is already correct.

Since a takeover client has already accepted a brief window of downtime, do DNS first and the
first ACME attempt succeeds:

```
1. M1–M4 above (inventory, export, import, pre-delegation verify)
2. Turnstile hostnames    (Phase 5d)
3. Worker ALLOWED_ORIGINS (Phase 5b/5c) — include BOTH old and new domains
4. Nameservers at registrar → Cloudflare
5. Wait for "Active", confirm dig returns 148.113.196.32
6. THEN Coolify domains (Phase 6 Step 4) + redeploy → cert issues first try
7. Repo domain swap + push
8. Old domain → 301 → new domain
```

Between 4 and 6 the domain resolves to the VPS with no route yet — expect a Traefik 404 or cert
warning. That's the accepted window; confirm the client is fine with it during Phase 0.

### M6 — Post-delegation verification [automated] — MANDATORY

Re-run the full M4 check against public resolvers (drop the `@$NS`), then verify mail end to end.
**Do not consider the migration done until mail is confirmed:**

- [ ] Every mail record resolves (MX, SPF, DMARC, **all** DKIM selectors, bounce hosts)
- [ ] **Inbound:** send to a real address on the domain — no bounce within 5 min
- [ ] **Outbound:** have someone at the client send to [mail-tester.com](https://www.mail-tester.com); confirm SPF, DKIM, and DMARC all PASS
- [ ] Apex and `www` resolve to `148.113.196.32`, both serve HTTPS with a valid cert
- [ ] Old site's key legacy paths redirect (see M7)

> **M365 quarantine gotcha:** Exchange Online may quarantine the Worker's confirmation email from
> `forms@cincinnatiwebfoundry.com` — it did on the ITA run. Before KV `toEmail` ever points at an
> address on the client's domain, have their M365 admin allowlist that sender in Exchange Online
> Protection. Otherwise lead notifications land in quarantine silently.

### M7 — Old site content and redirects [MANUAL]

**Capture the old site before the flip.** Once DNS moves you lose access to it — it's reachable
only while the apex still points at the old host.

```bash
curl -s https://$D/sitemap.xml            # or /sitemap_index.xml, /wp-sitemap.xml
curl -s https://$D/robots.txt
```

Then ask the client directly: **does this content matter?** Their answer sets the scope.

- **"It has real traffic / we rank for it"** → build a full redirect map from the old sitemap into
  `astro.config.mjs` `redirects`, and plan destinations for orphaned sections before cutover.
- **"Barely any traffic, don't care"** → skip the map. Still redirect the handful of paths a human
  might have bookmarked or linked — `/privacy-policy`, `/contact`, `/about`.

Either way: **old URLs have trailing slashes and the template sets `trailingSlash: 'never'`.**
Astro's `build.format: 'directory'` emits `dist/old-path/index.html`, which the nginx
`try_files` chain serves for both `/old-path` and `/old-path/` — so a plain redirect entry covers
both. Verify it rather than assume.

**Do not let the client cancel the old hosting until redirects are verified live.** That account
holds the only copy of the old content.

### M8 — Legacy and sibling domains [MANUAL]

| Situation | Action |
|-----------|--------|
| Domain uses **registrar web forwarding** to the target domain | **Nothing.** Forwarding follows the *hostname*, not the IP — once the apex serves the new site, forwarded domains land on it automatically. Leave DNS at the registrar. |
| Old dev/staging domain (e.g. `client.site`) should 301 to the new one | Move that domain's DNS to Cloudflare and use a **Redirect Rule**. This is the one case where the record **should** be **proxied** (orange) — a redirect-only domain never reaches the VPS, so the grey-cloud/ACME rule doesn't apply. Then remove its routers from the Coolify labels. |
| Sibling domain carries **its own MX** | Leave it entirely alone. Moving it puts a second mail system at risk for zero benefit. |

**Registrar consolidation is a separate decision from DNS, and comes after cutover.** House
standard is Namecheap for registration + Cloudflare for DNS. Once the zone is authoritative at
Cloudflare, the registrar is just a pointer, so a transfer can't take the site down. Do it in
this order — never mid-cutover.

Transfer caveats: 60-day ICANN lock after transfer-in; 5–7 days to complete; needs an EPP/auth
code; GoDaddy "Domain Protection" (the four-flag `clientDelete/Renew/Transfer/UpdateProhibited`
set) must be disabled first. **Verify nameservers survived the transfer-in** — some registrars
reset them to their own defaults, and this happens after cutover when you've stopped watching.

### M9 — Takeover-specific QA additions

Run Phase 9 in full, plus:

- [ ] Mail verified inbound **and** outbound (M6) — the single most important item
- [ ] All DKIM selectors from the original zone export still resolve
- [ ] Record count in Cloudflare matches the corrected zone file exactly (no duplicates)
- [ ] No record is proxied that shouldn't be
- [ ] Legacy paths agreed in M7 redirect correctly
- [ ] Old host still running until redirects are confirmed
- [ ] Registrar re-locked, or transfer completed
- [ ] Client's M365/Workspace admin has allowlisted the Resend sender

---
