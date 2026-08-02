#!/usr/bin/env bash
set -eu

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
  printf 'Usage: %s domain [authoritative-nameserver]\n' "$0" >&2
  exit 2
fi

domain=$1
nameserver=${2:-}

case "$domain" in
  *[!A-Za-z0-9.-]*|'') printf 'Invalid domain: %s\n' "$domain" >&2; exit 2 ;;
esac

query() {
  record=$1
  name=$2
  if [ -n "$nameserver" ]; then
    dig +short "@${nameserver}" "$name" "$record"
  else
    dig +short "$name" "$record"
  fi
}

printf 'Domain: %s\n' "$domain"
[ -n "$nameserver" ] && printf 'Nameserver: %s\n' "$nameserver"

for record in A AAAA NS MX TXT; do
  printf '\n[%s]\n' "$record"
  query "$record" "$domain"
done

printf '\n[DMARC]\n'
query TXT "_dmarc.${domain}"

printf '\n[WWW]\n'
query A "www.${domain}"
