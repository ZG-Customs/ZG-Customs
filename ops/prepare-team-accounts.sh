#!/usr/bin/env bash
set -euo pipefail

if [[ "$EUID" -ne 0 ]]; then
  echo 'Run this script with sudo on the Azure server.' >&2
  exit 1
fi

for account in rino jagor potjeh marijan juraj; do
  if id "$account" >/dev/null 2>&1; then
    echo "Account $account already exists; leaving it unchanged."
    continue
  fi
  # useradd leaves the password locked. SSH access starts after adding a public key.
  useradd --create-home --user-group --shell /bin/bash "$account"
  chmod 750 "/home/$account"
  install -d -m 700 -o "$account" -g "$account" "/home/$account/.ssh"
  install -m 600 -o "$account" -g "$account" /dev/null "/home/$account/.ssh/authorized_keys"
  echo "Prepared $account; no SSH key, sudo access, or Docker access has been granted."
done
