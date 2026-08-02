# Web Foundry Onboarding Skill: Cross-Agent Plan and Handoff

- **Status:** canonical skill built and shared; Cloudflare and Coolify access configured; Claude Code audit complete and its fixes applied 2026-08-01 (see "Claude Code Audit Results")
- **Prepared:** 2026-08-01
- **Audience:** Dreux, Claude Code, and Codex

## Outcome

Rebuild `web-foundry-onboarding` as one canonical Agent Skill that preserves its guided Phase 0–10 and Migration M1–M9 experience in both Claude Code and Codex. Keep `SKILL.md` as the conductor, move phase detail into directly linked references, and give each agent equivalent, least-privilege access to the tools it actually needs.

The refactor must not turn the skill into a loose reference library. It must continue to:

1. Identify net-new versus takeover work.
2. Start or resume a persistent, secret-free onboarding state file.
3. Enter phases in order, including explicit pause and approval gates.
4. Require the phase reference before work begins.
5. Record evidence and completion before advancing.
6. Resume at the first incomplete gate in a later session.

## Source and Target Layout

Current Claude-only source:

```text
~/.claude/skills/web-foundry-onboarding/SKILL.md  # 1,569 lines; all logic in one file
```

Implemented canonical layout:

```text
db-design-website/skills/web-foundry-onboarding/
├── SKILL.md                         # concise state machine, phase router, gates
├── agents/openai.yaml               # Codex-facing metadata and declared dependencies
├── references/
│   ├── 00-routing-and-state.md      # track selection, state schema, resume rules
│   ├── 01-migration-track.md        # Migration M1–M9 (takeover)
│   ├── 02-discovery-and-plan.md     # Phase 0–1
│   ├── 03-sanity-and-repository.md  # Phase 2–3
│   ├── 04-build-and-integrations.md # Phase 4
│   ├── 05-worker-turnstile-and-email.md  # Phase 5
│   ├── 06-coolify-deployment.md     # Phase 6
│   ├── 07-dns-email.md              # Phase 7/7b
│   ├── 08-webhook.md                # Phase 8
│   ├── 09-qa-handoff-and-mistakes.md # Phase 9–10 + the 75-row mistakes table
│   ├── operating-facts.md           # critical infrastructure facts, phase map, companion skills
│   └── tool-adapters.md             # per-agent capability and credential mapping
└── scripts/
    ├── preflight.sh                 # commands, versions, auth presence; never prints secrets
    ├── verify-dns.sh                # repeatable read-only DNS checks
    ├── rdap-domain.sh               # RDAP via IANA bootstrap (not registry-specific)
    └── coolify-api.sh               # least-privilege Coolify read + gated deploy

~/.agents/skills/web-foundry-onboarding -> [version-controlled directory above]
~/.claude/skills/web-foundry-onboarding -> [version-controlled directory above]
```

Two artifacts from the original plan were intentionally not built. `troubleshooting.md` was
folded into the 75-row Common Mistakes table in `09-qa-handoff-and-mistakes.md`, which the Claude
audit verified as complete against the source. `verify-site.sh` was **not** built: Phase 9
verification remains manual and companion-skill driven. Building it is separate follow-up work,
not a gap in the refactor.

Each reference must be linked directly from `SKILL.md` with an instruction such as: “Before Phase 5, read `references/04-worker-turnstile-and-email.md` completely.” References may contain detailed steps, commands, examples, and troubleshooting, but only `SKILL.md` controls phase order and advancement.

## Tool and Access Audit

Legend: **Ready** means verified in this Codex environment; **partial** means a usable path exists but has an auth, scope, or interface gap; **manual** means the workflow should deliberately pause for a human.

| Capability | Used by | Codex status on 2026-08-01 | Secure target |
|---|---|---|---|
| Filesystem, shell, `git`, `rg`, `curl`, `dig`, `python3`, `jq` | All phases; discovery and DNS checks | **Ready** | No provider credential required. Keep destructive and production commands gated. |
| Node.js, `npm`, `npx` | Astro build, Sanity Studio, Wrangler, Playwright | **Ready** (Node 24) | Project lockfiles remain authoritative; do not install global project dependencies unnecessarily. |
| GitHub connected app | Repository discovery and normal repo/PR operations | **Ready** | Keep app installation limited to Web Foundry repositories. Confirm before repo creation, pushes, secrets, settings, or webhook changes. |
| GitHub CLI (`gh`) | Template/repo operations and checks not covered by the connector | **Partial**: installed, but the saved `drwbry` token is invalid | Re-authenticate only when CLI coverage is needed. Use the narrowest repo permissions that support private repo creation/push and required Actions operations. Do not store the token in the skill. |
| Sanity CLI | Phase 2, 4a–4c, 8 | **Ready** through each repo's local CLI; authenticated project listing succeeded | Prefer the local `studio/node_modules/.bin/sanity` or `npx sanity`, always from the intended client repo. Require project-ID confirmation before writes/deploys. |
| Sanity MCP | Optional project/API automation | **Missing in Codex**; configured in Claude | Add only if it materially improves project or webhook operations. Use a dedicated scoped token and a project-selection gate; otherwise retain CLI plus manual dashboard steps. |
| Cloudflare Wrangler | Phase 5 Worker/KV/tail/deploy | **Ready**: installed; the dedicated account API token was configured in `worker/.env` with mode `600`, and Wrangler identity access succeeded | Keep the token in the ignored owner-only file. Verify the exact account/resource identity before Worker or KV writes. Add zone/DNS or Turnstile edit only if intentionally automated. Never use the Global API Key. |
| Cloudflare MCP/plugin | DNS, Turnstile, Worker, KV, Email Routing automation | **Blocked**: an MCP endpoint is configured, but Codex reports authentication as unsupported; no callable Cloudflare tools are exposed | Install/authorize the official Cloudflare integration if selected, then limit its permissions. Keep registrar changes, destination-email confirmation, DNSSEC, and final nameserver delegation manually approved. Wrangler remains the fallback for Worker/KV. |
| Coolify | Phase 6 deploy; Phase 8 webhook; deployment verification | **Ready for discovery/read in Codex**: the reviewed local adapter authenticated from the Codex extension and returned all 8 applications; deploy permission is intentionally untested until an approved live deployment | Both agents should use the owner-only `~/.config/web-foundry/coolify.env` (directory mode `700`, file mode `600`) through the adapter. Confirm app UUID and client domain before every write; do not copy the token into an MCP config or repository. |
| Playwright + Chromium | Phase 9 visual QA at 375/768/1440 | **Ready**: project dependency present and Chromium cached | Keep screenshots and temporary QA artifacts out of commits unless requested. Use the existing repo script or a committed deterministic script. |
| Lighthouse | Phase 9 performance check | **Missing as a CLI** | Prefer the existing website audit plus browser/Playwright evidence. Add Lighthouse only if its score remains a hard gate. Pin it as a project/dev tool rather than relying on an untracked global install. |
| `squirrel` + `audit-website` skill | Phase 9 live audit | **Ready** (`squirrel` 0.0.38; Codex skill available) | Audits are read-only. Obtain approval before testing non-public or authenticated targets. |
| Browser/manual dashboard access | Sanity project creation/content, Cloudflare zone/Turnstile/email, Coolify setup, registrar, third-party accounts | **Manual by design** unless a scoped connector is added | Keep explicit `[MANUAL]` gates. Never ask an agent to handle client passwords, inbox confirmations, banking identity, payment activation, EPP codes, or registrar MFA. |
| Resend | Worker email delivery | No direct onboarding tool required | Keep the API key only in Worker/provider secrets. The skill may verify delivery but must not copy the key into docs, repo files, or state. |
| Calendly, Stripe Payment Links, Square Online | Optional Phase 4e integrations | **Manual/client-owned** | Use client-owned accounts and URLs. No payment/banking credentials in agent context. Testing stays in provider test mode where available. |
| Claude `frontend-design` | Phase 4d design direction | **Not available in Codex** | Prefer porting this specific skill to the same shared Agent Skill pattern if it contains valuable house style. A product-design integration can supplement it but should not silently replace its process. |
| Claude `superpowers:brainstorming` | Phase 4d ideation | **Not available in Codex** | Either install/evaluate the Superpowers plugin or encode the required brainstorming gate in the onboarding conductor so orchestration does not depend on one agent. |
| Claude review/verification companion skills | Phase 4h and 9 | **No exact skill names in Codex** | Map to Codex code review, evidence-based verification scripts, and the installed GitHub integration. Keep acceptance criteria agent-neutral. |
| Image generation | Optional visual asset work | **Ready in Codex** | Use only when requested/appropriate; keep generated assets traceable and visually reviewed. |

Not required by the current workflow: `zip`, `unzip`, a globally installed `sanity` binary, or direct access to client email/payment credentials.

## Security Model

The skill can declare and test dependencies, but it cannot grant itself account access. Authentication must be installed or approved by Dreux, and the provider remains the source of truth.

Apply these controls during setup:

- Store no tokens, widget secrets, webhook bearer values, passwords, or recovery codes in `SKILL.md`, references, `AGENTS.md`, `CLAUDE.md`, Site Plans, or `docs/onboarding-state.md`.
- Use provider credential stores, environment variables, Codex/Claude connector auth, GitHub Actions secrets, Cloudflare secrets/KV, or Coolify secrets as appropriate.
- Separate read/discovery access from production write/deploy access when the provider supports it.
- Scope credentials to Web Foundry resources and specific projects/zones/namespaces where possible.
- Require an explicit resource identity gate before writes: repo, Sanity project ID, Cloudflare account/zone/KV namespace, Coolify app UUID, domain, and recipient email.
- Treat shared Worker deployment, DNS changes, nameserver delegation, webhook changes, production pushes, and token rotation as confirmation-required operations.
- Make `scripts/preflight.sh` report only `ready`, `missing`, `expired`, or `over-scoped`; it must never echo credential values.
- Record evidence and resource identifiers in onboarding state, but record secrets only as `configured: yes/no`.

## Implementation Sequence and Current Status

### 1. Refactor without changing behavior — complete

- Copy the current skill into a working branch/location.
- Extract the phase playbooks into the reference layout above.
- Keep the current Phase 0–10 and Migration M1–M9 ordering, warnings, manual pauses, failure recovery, and completion checks.
- Add a phase routing table and explicit “read this reference now” instruction for every phase.
- Add `docs/onboarding-state.md` creation/resume logic and a gate checklist.
- Replace the Phase 3 “generate `CLAUDE.md`” instruction with “generate canonical `AGENTS.md`, then add a thin `CLAUDE.md` containing `@AGENTS.md` plus only Claude-specific notes.”

### 2. Make companion capabilities agent-neutral — complete for onboarding

- Define capabilities in the conductor (`design exploration`, `code review`, `verification`, `live audit`) instead of requiring only Claude-specific skill names.
- In `references/tool-adapters.md`, map each capability to Claude and Codex implementations.
- Preserve the current Claude companion calls where those skills exist.
- For Codex, use shared skills when ported, core review/verification behavior, GitHub integration, `audit-website`, Playwright, and image generation as applicable.

### 3. Add deterministic preflight and verification — complete for current dependencies

- Implement `scripts/preflight.sh` to verify command presence, local versions, relevant auth status, Playwright browser availability, expected repo paths, and connector availability without printing secrets.
- Implement read-only DNS/RDAP verification separately from mutation steps.
- Reuse the existing `scripts/capture-shots.mjs` where suitable rather than duplicating screenshot logic.
- Keep provider UI steps in references when APIs/connectors are unavailable or the operation should remain manual.

### 4. Secure Codex access — complete for the current CLI/adapter workflow

Perform these as separate, reviewable changes:

1. GitHub connected app and CLI are currently authenticated.
2. Wrangler uses the dedicated Cloudflare account API token stored in the ignored owner-only `worker/.env`; identity access has been verified. The broken Cloudflare MCP entry was removed so it no longer fails at Codex startup.
3. Coolify MCP was not copied: doing so would expose a bearer token to an unverified third-party `npx` package. The reviewed local `scripts/coolify-api.sh` adapter supports safe-field list/get/status plus confirmation-gated deploy. Its dedicated token is stored outside the repositories in the owner-only `~/.config/web-foundry/coolify.env`; read access is verified from Codex.
4. Sanity CLI works. Sanity MCP OAuth was attempted but timed out; the half-configured entry was removed so the CLI remains the clean fallback.
5. Preflight passes for local tools and recognizes the persistent owner-only Coolify credential file. Re-run it after restarting both agents. **Corrected 2026-08-01 by the Claude audit:** this held in Codex but not in Claude Code, where a hard `rg` dependency made preflight exit 1 and report the working Coolify credential as "incomplete". Both checks now use `grep`, and the Cloudflare check reads the scoped token's presence from the owner-only `worker/.env`. Preflight exits 0 in both agents.

### 5. Install the canonical skill and test both agents — installed; Claude Code audit is next

- Validate the skill structure and metadata.
- Keep the canonical directory under `db-design-website/skills/web-foundry-onboarding` so it is version-controlled.
- Expose it through symlinks in both user skill directories. The original Claude copy is preserved at `~/.claude/skills/web-foundry-onboarding.pre-shared-20260801` until testing passes.
- Restart both tools so skill discovery refreshes.
- Run one dry-run net-new scenario and one takeover scenario in each agent.
- Confirm both agents resume from the same `docs/onboarding-state.md` and stop at the same manual gates.
- Delete the backup only after equivalence is confirmed.

## Claude Code Handoff

Claude Code should perform or audit the Claude-facing portion of the refactor:

- Preserve the guided orchestration and all operational knowledge from the current 1,569-line skill.
- Check every extracted reference against the source so no phase, warning, command, migration rule, or common mistake is dropped.
- Verify the symlinked skill is discovered and can invoke existing Claude companion skills.
- Update Claude-specific tool mappings for `frontend-design`, brainstorming, code review, verification, Sanity MCP, and Coolify MCP.
- Do not copy MCP tokens or configuration secrets into the shared skill.
- Flag any instruction that relies on Claude-only syntax so it can move into `references/tool-adapters.md` or a Claude-specific note.
- Test a mock workflow through at least Phase 4 and a resumed workflow starting from a partially complete state file.

Suggested Claude Code audit prompt:

> Read `docs/web-foundry-onboarding-cross-agent-plan.md`, the canonical `skills/web-foundry-onboarding/` tree, and the preserved source at `~/.claude/skills/web-foundry-onboarding.pre-shared-20260801/SKILL.md`. Audit the completed refactor for Claude Code compatibility and source coverage without weakening Phase 0–10 or Migration M1–M9 orchestration. Confirm that every phase explicitly loads its reference, manual gates and safety warnings survived, `AGENTS.md` is canonical with a thin `CLAUDE.md` import, and Claude-specific adapters still work. Do not expose or migrate secrets. Test one mock takeover and one resumed workflow, then report gaps before changing the canonical files.

Claude should treat this as a review-first handoff: record findings and proposed changes in its shared plan before editing the canonical skill. After Dreux approves the findings, Claude may implement narrowly scoped compatibility fixes in the canonical directory so both agents receive the same changes.

## Acceptance Criteria

- One canonical skill directory serves both Codex and Claude Code.
- `SKILL.md` remains an active conductor and stays within practical Agent Skill size guidance.
- Every phase and migration step has a direct reference route and completion gate.
- Net-new and takeover dry runs work in both agents and can resume from state.
- `AGENTS.md` is canonical in generated repos; `CLAUDE.md` is a thin import wrapper.
- Required tools are either verified ready or produce a precise preflight failure with remediation.
- GitHub CLI auth is no longer stale if it remains part of the workflow.
- Cloudflare routine credentials are narrowed from the current broad OAuth grant.
- Coolify has a tested, least-privilege Codex path or remains an explicit manual gate.
- No secret appears in the skill tree, generated docs, state files, git diff, logs, or handoff.

## Work Completed for This Handoff

- Audited the current onboarding skill's phases, manual gates, commands, services, and companion-skill calls.
- Verified Codex's local CLI availability and relevant project dependencies.
- Verified the GitHub connected app works; an initial stale `gh` result was not reproducible and the current preflight reports authenticated.
- Verified Sanity CLI authentication and access to the existing Web Foundry projects.
- Verified Wrangler authentication and identified its broad permissions.
- Found Codex's Cloudflare MCP entry but confirmed its authentication is currently unsupported.
- Confirmed Claude currently has Sanity and Coolify MCP entries while Codex does not.
- Verified Playwright's Chromium cache and the installed `audit-website`/`squirrel` path.
- Made no credential changes, plugin installations, provider writes, deployments, or destructive changes.
- Built the canonical conductor, ten phase references, operating facts, tool adapters, persistent-state schema, and deterministic preflight/DNS scripts.
- Preserved all original playbook lines from the prior skill across the phase references, then updated project-context and companion-capability language for both agents.
- Installed shared Codex and Claude Code symlinks and preserved the previous Claude skill as a backup.
- Exposed the official Claude `frontend-design` skill to Codex through a local symlink.
- Declined to copy the existing Coolify bearer token into an unverified third-party MCP package; no Coolify credential was exposed.
- Removed broken/unauthenticated Cloudflare and Sanity MCP entries after confirming their CLI fallbacks, eliminating repeated OAuth startup failures.
- Added and tested a first-party local Coolify API adapter that requires a dedicated `read` + `deploy` token and never returns sensitive application fields.
- Configured the Coolify adapter to read its dedicated token from the owner-only Foundry-wide credential file and verified read access from the Codex extension against 8 applications.
- Configured the dedicated Cloudflare account API token in the ignored owner-only Worker environment file and verified Wrangler identity access.
- Updated preflight to recognize the persistent Coolify credential file without sourcing or printing it.
- Forward-tested a mock net-new workflow in a fresh Codex agent and fixed the three gaps it found: pre-repo state location, dry-run state behavior, and `unknown` credential status.
- Forward-tested the takeover route, replaced the `.com`-only RDAP probe with IANA registry discovery, and clarified that DNS/HTTP clues do not prove the legacy CMS. The replacement succeeded against `itadata.site`.
- Verified fresh Codex discovery of both `web-foundry-onboarding` and `frontend-design`. Claude Code's symlink resolves correctly; automated `claude -p` smoke attempts exceeded their explicit low-cost caps before returning output, so the Claude behavioral audit remains the handoff task above.

## Claude Code Audit Results

Performed 2026-08-01 in an interactive Claude Code session, which is what the timed-out `claude -p`
attempts could not do. Read-only throughout; findings were approved before any canonical file was
edited. No credential value was read, printed, copied, or migrated.

**Verdict: source coverage was excellent, Claude-facing execution was broken.** The refactor
itself was sound — no phase, warning, command, or migration rule was lost. But two path defects
stopped a real run at step 3 of the conductor's own opening sequence, before Phase 0.

### Source coverage — verified, no action needed

| Check | Result |
|---|---|
| Common Mistakes rows | 75 in source, 75 in target |
| Migration M1–M9 | All nine present with `[MANUAL]`/`[automated]`, ⚠ CRITICAL, ⭐, M6 MANDATORY intact |
| Phase 0–10 | All phases and sub-steps present; 5f Form Reliability Gate still MANDATORY and blocking |
| Phase 6 security headers | Full Traefik label block preserved, values identical |
| Sanity webhook filter | `!(_id in path("drafts.**"))` byte-identical |
| Critical Facts | All values unchanged |
| Shell commands | None missing from the references |
| Markdown links | 12/12 resolve |
| Secret scan | Clean — every hit is the word "secret" in a prohibition or field name |
| `SKILL.md` size | 95 lines / 7.7 KB as audited; 104 lines / 8.5 KB after the fixes below added the "Skill directory" section |
| `AGENTS.md` contract | Implemented; all 8 sections of the old inline `CLAUDE.md` retained |

Claude companion skills survived the capability abstraction: exact names remain in both
`operating-facts.md` and the `tool-adapters.md` mapping table.

### Behavioral traces

**Mock takeover.** Steps 1–2 loaded fine through the symlink. Step 3 failed: `SKILL.md` said "run
`scripts/preflight.sh` from this skill directory," but the agent's working directory is the client
repository and no absolute skill path appeared anywhere in the tree. Routing then reached
`01-migration-track.md`, whose M1 command was a literal unexpanded `<skill-dir>` placeholder. Both
scripts worked correctly once resolved by hand, confirming the defect was path resolution only.

**Resume from partial state.** A takeover paused after M4 with M5 pending could not be represented:
the state schema had a single collapsed `Migration M1–M9` row. A resuming agent would have to
re-run M1–M4 or guess — and re-running M3 against an already-imported zone triggers the additive-
import duplication the reference itself warns about.

### Fixes applied

- `SKILL.md` — added a "Skill directory" section that resolves `$SKILL_DIR` via `readlink -f` on
  either agent's symlink; step 3 now invokes `"$SKILL_DIR/scripts/preflight.sh"`.
- `01-migration-track.md` — replaced the `<skill-dir>` placeholder with `"$SKILL_DIR/..."` and a
  pointer to that convention.
- `scripts/preflight.sh` — `rg` demoted from hard failure to an advisory warning; both Coolify
  checks moved to `grep`; the Cloudflare check now recognizes the scoped token in the owner-only
  `worker/.env` instead of warning about broad OAuth when the token is correctly configured.
- `00-routing-and-state.md` — the single migration row became nine (M1–M9), with rules for keeping
  them `n/a` on a net-new track and never collapsing them on a takeover.
- `01-migration-track.md` — added a "Recording migration state" section requiring per-M evidence
  before the next step begins, and explaining why re-running M3 or M5 is unsafe.
- `tool-adapters.md` — added the two mappings the handoff asked for and Codex had no reason to
  write. Coolify and Sanity now have capability rows naming Claude's MCP servers alongside the
  Codex CLI/adapter path. The "unverified third-party MCP package" warning is now scoped to Codex,
  where it belongs; previously it read as a blanket warning steering Claude away from a Coolify MCP
  it already has connected. All least-privilege and confirm-before-deploy rules are unchanged.
- `~/.claude/skills/web-foundry-onboarding.pre-shared-20260801/SKILL.md` — its description was
  trigger-competitive with the canonical skill, so a real onboarding could have invoked the stale
  1,569-line copy. The `name:` field and description now mark it archived. The 1,569-line body is
  untouched and remains a working rollback.
- `db-design-website/CLAUDE.md` — now points at the canonical `skills/web-foundry-onboarding/`
  rather than the symlink path, and warns against treating the symlinks as separate copies.
- `operating-facts.md` — removed a duplicate H1 left by the extraction.

### The canonical tree was never committed

Found while wrapping up, and worth stating plainly because it falsifies an acceptance criterion
rather than being mere git hygiene. Implementation step 5 says "Keep the canonical directory under
`db-design-website/skills/web-foundry-onboarding` so it is version-controlled," and this document
repeatedly calls it the version-controlled source. It was not: `git status` reported `?? skills/`.

Until it was committed, the entire canonical tree — both agents' symlink targets, the ten phase
references, the scripts, and every fix above — existed only on this disk, with no history, no diff
review, and no backup other than the archived pre-refactor copy. Any of it could have been lost to
a bad edit with nothing to restore from. The "canonical" claim was true about intent and false
about state.

Committed as part of this audit, together with `AGENTS.md` and `CLAUDE.md` (which are coupled — the
thin `CLAUDE.md` is only an `@AGENTS.md` import, so committing one without the other yields a
broken import on checkout).

### Found by the Codex adversarial review of the first commit

Two merge blockers in commit `33b31bc`, both real, both fixed in the follow-up commit:

- **Scripts were committed non-executable.** All four `scripts/*.sh` recorded as mode `100644`
  while `SKILL.md` invokes them directly. They were executable on this disk, so every local
  validation passed and hid the defect — a fresh clone would have failed at the first
  `"$SKILL_DIR/scripts/preflight.sh"`, the exact failure the audit had just fixed. Now `100755`.
- **`docs/operations-runbook.md` was mandatory but untracked.** `AGENTS.md` says to read it before
  changing forms, the Worker, onboarding, DNS/email, or multi-tenant deployment, and calls its
  safety checks mandatory. A prior session had reduced `CLAUDE.md` from 245 lines to a thin
  `@AGENTS.md` import and moved the operational detail into that runbook — which was never tracked.
  Committing the import without the runbook left a mandatory reference missing on fresh checkout,
  taking with it the form reliability rules, the per-site `turnstileSecretKey` explanation, the
  mandatory post-deploy smoke test, DNS/email setup, and the multi-tenant model.

  Verified before fixing: every heading removed from `CLAUDE.md` is covered either by `AGENTS.md`
  or by the runbook, so no content was lost — only untracked. The runbook is now committed, with
  its own stale `~/.claude/skills/...` pointer corrected to the canonical path.

The lesson generalizes: validating only the working tree cannot catch what is missing from the
commit. Clean-checkout validation is now part of the verification steps.

### Open follow-up

- `verify-site.sh` is deliberately not built; Phase 9 verification stays manual. Build it only if
  deterministic Phase 9 evidence becomes a hard gate.
- The archived backup can be deleted once a full net-new and takeover run have completed on the
  canonical skill.
- `scripts/coolify-api.sh` was reviewed during this audit and is clean: no ripgrep dependency, no
  working-directory assumptions, absolute credential path, and the deploy gate requires the
  application UUID twice. No change needed.
