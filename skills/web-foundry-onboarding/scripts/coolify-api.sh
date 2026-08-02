#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  coolify-api.sh list
  coolify-api.sh get APPLICATION_UUID
  coolify-api.sh deployment DEPLOYMENT_UUID
  coolify-api.sh deploy APPLICATION_UUID --confirm-deploy APPLICATION_UUID

Required environment:
  COOLIFY_BASE_URL       Example: https://coolify.example.com
  COOLIFY_ACCESS_TOKEN   Dedicated team-scoped token; use read + deploy only

Optional credential file:
  ~/.config/web-foundry/coolify.env
  Override with WEB_FOUNDRY_COOLIFY_ENV=/absolute/path
USAGE
}

credential_file=${WEB_FOUNDRY_COOLIFY_ENV:-${XDG_CONFIG_HOME:-${HOME}/.config}/web-foundry/coolify.env}

if { [ -z "${COOLIFY_BASE_URL:-}" ] || [ -z "${COOLIFY_ACCESS_TOKEN:-}" ]; } && [ -r "$credential_file" ]; then
  mode=$(stat -c '%a' "$credential_file" 2>/dev/null || true)
  if [ "$mode" != 600 ]; then
    printf 'Coolify credential file must have permissions 600: %s\n' "$credential_file" >&2
    exit 2
  fi

  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      ''|'#'*) continue ;;
      COOLIFY_BASE_URL=*)
        [ -n "${COOLIFY_BASE_URL:-}" ] || COOLIFY_BASE_URL=${line#*=}
        ;;
      COOLIFY_ACCESS_TOKEN=*)
        [ -n "${COOLIFY_ACCESS_TOKEN:-}" ] || COOLIFY_ACCESS_TOKEN=${line#*=}
        ;;
      *)
        printf 'Unsupported line in Coolify credential file: %s\n' "$credential_file" >&2
        exit 2
        ;;
    esac
  done < "$credential_file"
fi

if [ -z "${COOLIFY_BASE_URL:-}" ] || [ -z "${COOLIFY_ACCESS_TOKEN:-}" ]; then
  printf 'Set COOLIFY_BASE_URL and COOLIFY_ACCESS_TOKEN in the environment or %s.\n' "$credential_file" >&2
  exit 2
fi

base=${COOLIFY_BASE_URL%/}
case "$base" in
  https://*) ;;
  *) printf 'COOLIFY_BASE_URL must use https.\n' >&2; exit 2 ;;
esac

valid_id() {
  case "$1" in
    *[!A-Za-z0-9_-]*|'') return 1 ;;
    *) return 0 ;;
  esac
}

api() {
  method=$1
  path=$2
  body=${3:-}
  if [ -n "$body" ]; then
    curl --fail-with-body --silent --show-error \
      --request "$method" \
      --header "Authorization: Bearer ${COOLIFY_ACCESS_TOKEN}" \
      --header 'Content-Type: application/json' \
      --data "$body" \
      "${base}/api/v1${path}"
  else
    curl --fail-with-body --silent --show-error \
      --request "$method" \
      --header "Authorization: Bearer ${COOLIFY_ACCESS_TOKEN}" \
      "${base}/api/v1${path}"
  fi
}

command=${1:-}
case "$command" in
  list)
    [ "$#" -eq 1 ] || { usage >&2; exit 2; }
    api GET /applications | jq '[.[] | {uuid, name, fqdn, status, git_repository, git_branch}]'
    ;;
  get)
    [ "$#" -eq 2 ] && valid_id "$2" || { usage >&2; exit 2; }
    api GET "/applications/$2" | jq '{uuid, name, fqdn, status, git_repository, git_branch, build_pack, build_command, publish_directory}'
    ;;
  deployment)
    [ "$#" -eq 2 ] && valid_id "$2" || { usage >&2; exit 2; }
    api GET "/deployments/$2" | jq '{deployment_uuid, application_name, status, is_webhook, is_api, commit, created_at, updated_at}'
    ;;
  deploy)
    [ "$#" -eq 4 ] && [ "$3" = --confirm-deploy ] && [ "$2" = "$4" ] && valid_id "$2" || {
      printf 'Deployment requires: deploy UUID --confirm-deploy UUID\n' >&2
      exit 2
    }
    payload=$(jq -nc --arg uuid "$2" '{uuid: $uuid, force: false}')
    api POST /deploy "$payload" | jq '{deployments, message}'
    ;;
  *)
    usage >&2
    exit 2
    ;;
esac
