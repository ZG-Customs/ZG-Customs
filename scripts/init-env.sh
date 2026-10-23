#!/usr/bin/env bash
set -euo pipefail
target="${1:-.env}"
if [[ -e "$target" ]]; then
  echo "Refusing to overwrite existing environment file: $target" >&2
  exit 1
fi
umask 077
set -o noclobber
{
  printf 'POSTGRES_PASSWORD=%s\n' "$(openssl rand -hex 32)"
  printf 'DB_PASSWORD=%s\n' "$(openssl rand -hex 32)"
  printf 'DB_PORT=5432\nAPI_PORT=8080\n'
} > "$target"
echo "Created $target with private permissions. Do not commit this file."
