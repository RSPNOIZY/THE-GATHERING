#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-/Users/m2ultra/Library/CloudStorage/GoogleDrive-rsplowman@icloud.com/My Drive/NOIZYLAB_WORKSPACES}"

if [ ! -d "$ROOT" ]; then
  echo "Source root not found: $ROOT"
  exit 1
fi

printf "Scanning workspace: %s\n" "$ROOT"
find "$ROOT" -type d | sort | sed -n '1,200p'
echo
find "$ROOT" -type f | sort | sed -n '1,200p'
