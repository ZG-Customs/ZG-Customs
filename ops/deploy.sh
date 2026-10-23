#!/usr/bin/env bash
set -euo pipefail
umask 077

root="${ZG_DEPLOY_ROOT:-$HOME/apps/zg-customs}"
revision="${1:?Usage: deploy.sh FULL_COMMIT_SHA}"
[[ "$revision" =~ ^[0-9a-f]{40}$ ]] || { echo 'Expected a full Git commit SHA.' >&2; exit 2; }
[[ -f "$root/.env" ]] || { echo 'Missing private deployment .env file.' >&2; exit 2; }
mkdir -p "$root/releases" "$root/backups" "$root/state"
exec 9>"$root/state/deploy.lock"
flock -n 9 || { echo 'Another deployment is already running.'; exit 0; }
git -C "$root/repo" cat-file -e "$revision^{commit}"

release="$root/releases/$revision"
if [[ ! -d "$release" ]]; then
  staging="$(mktemp -d "$root/releases/.staging-XXXXXX")"
  # Tracked source files must remain readable by non-root container users.
  # Secrets and deployment state retain the restrictive outer umask.
  (umask 022; git -C "$root/repo" archive "$revision" | tar -x -C "$staging")
  mv "$staging" "$release"
fi
[[ -f "$release/compose.yaml" ]] || { echo 'Commit has no Compose configuration.' >&2; exit 2; }

on_exit() {
  result=$?
  if [[ "$result" -ne 0 ]]; then
    printf '%s\n' "$revision" > "$root/state/failed-sha"
    echo "Deployment failed for $revision; inspect the log before retrying." >&2
  fi
}
trap on_exit EXIT

export APP_VERSION="$revision"
compose=(docker compose --project-name zg-customs --env-file "$root/.env" -f "$release/compose.yaml")
"${compose[@]}" config --quiet
"${compose[@]}" build --pull backend

if [[ -s "$root/state/current-sha" ]]; then
  ZG_DEPLOY_ROOT="$root" bash "$release/ops/backup.sh"
fi

# Never run down -v: the database volume must survive releases.
"${compose[@]}" up -d --no-build --wait --wait-timeout 240
api_address="$("${compose[@]}" port backend 8080)"
curl --fail --silent --show-error --max-time 10 "http://$api_address/actuator/health/readiness"
printf '%s\n' "$revision" > "$root/state/current-sha.tmp"
mv "$root/state/current-sha.tmp" "$root/state/current-sha"
rm -f "$root/state/failed-sha"
echo "Deployed $revision"
