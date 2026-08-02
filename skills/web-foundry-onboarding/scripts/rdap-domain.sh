#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  printf 'Usage: %s domain\n' "$0" >&2
  exit 2
fi

domain=$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')
case "$domain" in
  *[!a-z0-9.-]*|''|.*|*.|*..*) printf 'Invalid domain: %s\n' "$domain" >&2; exit 2 ;;
esac

tld=${domain##*.}
bootstrap=$(curl --fail --silent --show-error --location https://data.iana.org/rdap/dns.json)
base=$(printf '%s' "$bootstrap" | jq -r --arg tld "$tld" '.services[] | select(.[0] | index($tld)) | .[1][0]' | head -n 1)

if [ -z "$base" ] || [ "$base" = null ]; then
  printf 'No RDAP bootstrap service found for TLD: %s\n' "$tld" >&2
  exit 3
fi

curl --fail --silent --show-error --location "${base%/}/domain/${domain}" | jq '{
  ldhName,
  unicodeName,
  status,
  events,
  registrar: ([.entities[]? | select(.roles[]? == "registrar") | {handle, publicIds, vcardArray}] | first),
  nameservers: [.nameservers[]? | {ldhName, unicodeName}],
  secureDNS
}'
