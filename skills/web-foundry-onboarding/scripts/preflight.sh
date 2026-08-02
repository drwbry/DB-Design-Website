#!/usr/bin/env bash
set -u

status=0

pass() { printf 'PASS  %s\n' "$1"; }
warn() { printf 'WARN  %s\n' "$1"; }
fail() { printf 'FAIL  %s\n' "$1"; status=1; }

for cmd in git node npm npx curl dig python3 jq; do
  if command -v "$cmd" >/dev/null 2>&1; then
    pass "$cmd available"
  else
    fail "$cmd missing"
  fi
done

# Optional: the workflow uses grep for every required check. Agents that bundle
# ripgrep may not expose it on PATH, so a missing rg must never block onboarding.
if command -v rg >/dev/null 2>&1; then pass 'rg available'; else warn 'rg not on PATH; grep is used for all required checks'; fi

if command -v gh >/dev/null 2>&1; then
  if gh auth status >/dev/null 2>&1; then pass 'GitHub CLI authenticated'; else warn 'GitHub CLI installed but not authenticated; connected GitHub app may be used'; fi
else
  warn 'GitHub CLI missing; use the connected GitHub app or install gh if required'
fi

# The shared Worker is only ever deployed from the template repo's worker/ directory,
# so the scoped token normally lives in that ignored owner-only worker/.env rather than
# in the environment. Presence is checked without sourcing or printing the value.
worker_dir=${WEB_FOUNDRY_WORKER_DIR:-${HOME}/projects/the-web-foundry/db-design-website/worker}
worker_env=${WEB_FOUNDRY_WORKER_ENV:-${worker_dir}/.env}

# Paths are absolute on purpose: preflight runs from the client repo, not from the skill
# or template directory, so no check here may depend on the current working directory.
if command -v wrangler >/dev/null 2>&1 || [ -x "${worker_dir}/node_modules/.bin/wrangler" ]; then
  if [ -n "${CLOUDFLARE_API_TOKEN:-}" ]; then
    pass 'Wrangler available with CLOUDFLARE_API_TOKEN in environment; verify token scope before Phase 5'
  elif [ -r "$worker_env" ] && grep -qE '^CLOUDFLARE_API_TOKEN=.+$' "$worker_env"; then
    worker_env_mode=$(stat -c '%a' "$worker_env" 2>/dev/null || true)
    if [ "$worker_env_mode" != '600' ]; then
      warn "Worker CLOUDFLARE_API_TOKEN present but file should be owner-only (chmod 600): $worker_env"
    else
      pass 'Scoped CLOUDFLARE_API_TOKEN present in owner-only worker/.env; verify token scope before Phase 5'
    fi
  else
    warn 'Wrangler available without a scoped CLOUDFLARE_API_TOKEN; stored OAuth may be broader than Phase 5 requires'
  fi
else
  warn 'Wrangler missing; Phase 5 requires an authenticated Wrangler or Cloudflare connector'
fi

if command -v squirrel >/dev/null 2>&1; then pass 'squirrel website auditor available'; else warn 'squirrel missing; install before the Phase 9 live audit'; fi

coolify_credential_file=${WEB_FOUNDRY_COOLIFY_ENV:-${XDG_CONFIG_HOME:-${HOME}/.config}/web-foundry/coolify.env}

if [ -n "${COOLIFY_BASE_URL:-}" ] && [ -n "${COOLIFY_ACCESS_TOKEN:-}" ]; then
  pass 'Coolify API environment present; verify read access before Phase 6'
elif [ -r "$coolify_credential_file" ]; then
  coolify_credential_mode=$(stat -c '%a' "$coolify_credential_file" 2>/dev/null || true)
  if [ "$coolify_credential_mode" != '600' ]; then
    warn "Coolify credential file must be owner-only (chmod 600): $coolify_credential_file"
  elif grep -qE '^COOLIFY_BASE_URL=https://.+' "$coolify_credential_file" && grep -qE '^COOLIFY_ACCESS_TOKEN=.+$' "$coolify_credential_file"; then
    pass 'Coolify owner-only credential file present; verify read access before Phase 6'
  else
    warn "Coolify credential file is incomplete: $coolify_credential_file"
  fi
else
  warn "Coolify API credentials absent; configure environment variables or $coolify_credential_file"
fi

if [ -d "${HOME}/.cache/ms-playwright" ] && find "${HOME}/.cache/ms-playwright" -maxdepth 1 -type d -name 'chromium-*' -print -quit 2>/dev/null | grep -q .; then
  pass 'Playwright Chromium cache present'
else
  warn 'Playwright Chromium cache not found; install the project browser before Phase 9'
fi

if command -v codex >/dev/null 2>&1; then
  pass 'Codex CLI available'
else
  warn 'Codex CLI not found in PATH; this does not block Claude Code'
fi

printf '\nPreflight reports availability only. Verify provider resource identity and least-privilege authorization at each phase.\n'
exit "$status"
