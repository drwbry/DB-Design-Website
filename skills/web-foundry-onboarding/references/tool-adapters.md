# Tool Adapters and Access Boundaries

## Contents

- Selection order
- Capability mapping
- Authenticated services
- Manual-only boundaries
- Missing-tool behavior

## Selection order

For every action, prefer:

1. Read-only inspection before mutation.
2. A connected, scoped tool with explicit resource identity.
3. An authenticated project-local CLI.
4. A documented manual dashboard step.

Do not paste secrets into prompts or shell commands. Use existing credential stores, environment-variable references, provider secret stores, or interactive login.

## Capability mapping

| Capability | Claude Code | Codex | Fallback |
|---|---|---|---|
| Design exploration | `frontend-design` | Shared port of `frontend-design` when installed; product-design tooling if explicitly available | Perform a structured design brief and visual review before code |
| Brainstorming | `superpowers:brainstorming` | Superpowers plugin when installed | Generate 2–3 approaches, compare tradeoffs, obtain direction |
| Code review | `superpowers:requesting-code-review` | Codex review plus GitHub tools when relevant | Review diff against Site Plan and repo rules |
| Verification | `superpowers:verification-before-completion` | Evidence-based commands and browser checks | Run the phase gate checklist directly |
| Live audit | `audit-website` | `audit-website` | Run `squirrel` directly using the audit skill's rules |
| Visual QA | Browser/Playwright | Project Playwright + cached Chromium | Manual screenshots at required widths |
| Images | Available image tooling | `imagegen` | Request/provide client assets |
| Coolify (read/deploy) | Coolify MCP server when connected, else `$SKILL_DIR/scripts/coolify-api.sh` | `$SKILL_DIR/scripts/coolify-api.sh` | Coolify dashboard, manual |
| Sanity (project/content) | Sanity MCP server when connected, else the repo's local Studio CLI | Repo's local Studio CLI or `npx sanity` | Sanity dashboard, manual |

Companion skills improve execution but never control phase order; this onboarding skill remains the conductor.

## Authenticated services

### GitHub

Prefer the connected GitHub app for supported operations. Use `gh` only when connector coverage is insufficient and `gh auth status` succeeds. Confirm before creating repositories, changing settings/secrets/webhooks, pushing, or opening PRs.

### Sanity

Claude Code normally has a connected Sanity MCP server; Codex does not. Where the MCP is available, use it for project listing, schema inspection, and document queries — it is the cheapest way to confirm you are pointed at the right project.

For schema deploys and Studio deploys, prefer the intended client repo's local Studio CLI in both agents, so the deployed artifact matches that repo's lockfile. Confirm `studio/sanity.cli.ts` and `studio/sanity.config.ts` project IDs before deploying, whichever path you used to read them. Use dashboard/manual steps for client invitations, initial content, and client-owned account actions.

### Cloudflare

Use Wrangler only from the template repo's `worker/` for shared Worker/KV operations. Prefer `CLOUDFLARE_API_TOKEN` with a custom token restricted to the Foundry account and these permissions: Workers Scripts Write, Workers KV Storage Write, Workers Tail Read, and only the account/user read permissions Wrangler proves it needs. Do not grant D1, R2, AI, Containers, DNS, SSL, or global account administration for Phase 5. Add Workers Routes or zone permissions only after a real required command fails for that permission and the user approves the expansion.

DNS, Turnstile, and Email Routing may use a separately authorized connector or manually scoped token when available, but nameserver delegation, DNSSEC, and destination inbox confirmation remain explicit manual gates. Never use the Global API Key.

Reference: [Cloudflare API token creation](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/) and [Wrangler system environment variables](https://developers.cloudflare.com/workers/wrangler/system-environment-variables/).

### Coolify

Use whichever path is already authorized for the active agent:

- **Claude Code** normally has a connected Coolify MCP server. Use it for listing, inspection, and status. It is an established connection, not a new dependency.
- **Codex** has no Coolify MCP. Use `"$SKILL_DIR/scripts/coolify-api.sh"` (resolve `$SKILL_DIR` as described in `SKILL.md`; the scripts are not on `PATH`). Do not install a third-party Coolify MCP package to fill the gap — that would mean handing a bearer token to an unreviewed `npx` package, which is why the local adapter exists.

Either way the credential rules are identical. Use a dedicated, team-scoped `COOLIFY_ACCESS_TOKEN` with only `read` and `deploy`, plus `COOLIFY_BASE_URL`; do not grant `read:sensitive`, `write`, or `root`. For the shell adapter, supply them through the process environment or owner-only `~/.config/web-foundry/coolify.env` (`600`); it parses only those two assignments and never executes the credential file as shell code. The adapter deliberately returns only non-secret application/deployment fields and requires the application UUID twice before deployment. Never copy a Coolify token between an MCP config and a repository in either direction.

List applications and match the exact client app UUID before any deployment. Obtain explicit user approval before invoking `deploy`. Keep application creation, environment/domain mutation, server administration, proxy restart, deletion, and cross-client changes manual unless a separately reviewed adapter and credential are approved.

Reference: [Coolify API authorization and permissions](https://coolify.io/docs/api-reference/authorization).

### Third-party/client accounts

Calendly, Stripe, Square, registrar, business email, and banking/identity actions remain client-owned. Work from non-secret URLs and user-confirmed outcomes.

## Manual-only boundaries

Never handle or request client passwords, MFA codes, recovery codes, EPP/transfer codes in repo context, banking identity, payment activation, or destination-inbox confirmation. Present the step, explain the expected evidence, and wait.

## Missing-tool behavior

- Do not skip a phase because an optional connector or companion skill is unavailable.
- Use the documented CLI or manual fallback.
- If no safe fallback exists, record a blocker and the exact authorization or installation needed.
- Never broaden a credential or install a provider integration silently.
