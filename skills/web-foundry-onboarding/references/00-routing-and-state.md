# Routing and Persistent State

## Contents

- Track selection
- State discovery
- State schema
- Resume behavior
- Evidence rules

## Track selection

Classify the work before discovery:

- `net-new`: confirm that no live site, production email, DNS zone, legacy redirects, or registrar transfer must be preserved.
- `takeover`: any of those production concerns exists or ownership is uncertain.

When uncertain, choose `takeover` until Migration M1 proves the lower-risk path.

## State discovery

Use the client repository's `docs/onboarding-state.md`. If the repository does not exist yet, use `/home/dreux/projects/the-web-foundry/onboarding/[client-slug]/onboarding-state.md` as the default pre-repository location. Move it into the client repository during Phase 3, preserve its session history, and remove the pre-repository copy after verifying the move.

For an explicitly requested mock or read-only dry run, keep the state draft in memory and do not create either file. Mark external facts `unverified` and explain that the run cannot be resumed reliably until persistent state is authorized.

If state exists:

1. Read it completely.
2. Verify the target business, repo, domain, and track.
3. Recheck evidence whose external state may have changed.
4. Resume at the first incomplete required gate.

If state does not exist, create it from the schema below.

## State schema

```md
# [Business Name] Onboarding State

- Track: net-new | takeover
- Status: active | blocked | complete
- Current phase: M1 | 0 | 1 | ... | 10
- Repository: [owner/repo or pending]
- Local path: [absolute path or pending]
- Domain: [domain or pending]
- Sanity project ID: [ID or pending]
- Coolify application UUID: [UUID or pending]
- Cloudflare zone: [zone or pending]
- Last updated: [ISO date/time and agent]

## Approved decisions

- Site Plan: pending | approved [date]
- Design direction: pending | approved [date]
- Launch/cutover: pending | approved [date]

## Phase gates

| Gate | Status | Evidence | Next action |
|---|---|---|---|
| M1 Inventory | n/a | | |
| M2 Zone export | n/a | | |
| M3 Corrected import | n/a | | |
| M4 Pre-delegation verify | n/a | | |
| M5 Cutover/delegation | n/a | | |
| M6 Post-delegation verify | n/a | | |
| M7 Redirects/old content | n/a | | |
| M8 Legacy domains | n/a | | |
| M9 Takeover QA | n/a | | |
| Phase 0 Discovery | pending | | |
| Phase 1 Site Plan | pending | | |
| Phase 2 Sanity | pending | | |
| Phase 3 Repository | pending | | |
| Phase 4 Build | pending | | |
| Phase 5 Forms/Worker | pending | | |
| Phase 6 Coolify | pending | | |
| Phase 7 DNS/email | pending | | |
| Phase 8 Webhook | pending | | |
| Phase 9 QA | pending | | |
| Phase 10 Handoff | pending | | |

## Blockers and manual actions

- [owner] [action] [status]

## Secret presence (never values)

- Cloudflare auth configured: yes | no | unknown
- Coolify auth configured: yes | no | unknown
- Sanity auth configured: yes | no | unknown
- GitHub auth configured: yes | no | unknown
- Turnstile secret stored in KV: yes | no | unknown
- Webhook bearer configured in Sanity: yes | no | unknown

## Session log

- [timestamp] [agent]: [work, evidence, decision, next gate]
```

Never record a secret value, auth header, tokenized webhook URL, client password, recovery code, or private inbox data.

On a `net-new` track, leave the M1–M9 rows at `n/a` and keep them in the table; do not delete them, so a domain that later turns out to be a takeover has somewhere to record its evidence. On a `takeover`, each M-step is its own gate and must be updated before the next one begins. Never collapse M1–M9 into a single row — a takeover routinely pauses mid-migration, and the resuming agent has to know which mutating steps already ran. See [01-migration-track.md](01-migration-track.md) for why re-running M3 or M5 is unsafe.

## Resume behavior

- Treat `complete` as evidence-backed, not merely checked.
- Revalidate DNS, HTTPS, deployments, and webhooks if enough time has passed for external state to change.
- Do not repeat provider writes just because a different agent resumed the work.
- If evidence conflicts, mark the gate `needs-review`, explain the conflict, and resolve it before advancing.
- Update the session log before ending every onboarding session.

## Evidence rules

Good evidence includes command output without secrets, commit IDs, deployment IDs/status, HTTP status and headers, DNS answers, screenshot paths, audit reports, test-email outcomes, and explicit user approvals.

The following are not evidence: “looks right,” code inspection without execution, an enabled provider toggle without a live test, or an agent's memory of a prior session.
