#!/usr/bin/env bash
set -euo pipefail

PATTERN='PLACEHOLDER|REPLACE_ME|TODO_KV_ID|PLACEHOLDER_KV_ID'
TARGETS=("cloudflare/workers" ".github/workflows" "scripts" "contracts")

echo "NOIZY RELEASE GATE: placeholder scan"
for t in "${TARGETS[@]}"; do
  if grep -RInE "$PATTERN" "$t" >/dev/null 2>&1; then
    echo "BLOCKED: placeholder tokens found in $t"
    grep -RInE "$PATTERN" "$t" || true
    exit 1
  fi
done
echo "PASS: placeholder scan clean"
