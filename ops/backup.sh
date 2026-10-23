#!/usr/bin/env bash
set -euo pipefail
umask 077
root="${ZG_DEPLOY_ROOT:-$HOME/apps/zg-customs}"
revision="$(cat "$root/state/current-sha")"
[[ "$revision" =~ ^[0-9a-f]{40}$ ]] || exit 2
mkdir -p "$root/backups"
backup="$root/backups/$(date -u +%Y%m%dT%H%M%SZ)-${revision:0:12}.dump"
export APP_VERSION="$revision"
docker compose --project-name zg-customs --env-file "$root/.env" \
  -f "$root/releases/$revision/compose.yaml" \
  exec -T --interactive=false postgres pg_dump -U postgres -d zg_customs --format=custom > "$backup.tmp"
test -s "$backup.tmp"
mv "$backup.tmp" "$backup"
echo "Database backup created: $backup"
