#!/usr/bin/env bash
# NOIZY gate: hard-fail on placeholder tokens before any deploy.
# Usage: bash scripts/check-no-placeholders.sh
set -euo pipefail

PATTERN='PLACEHOLDER|REPLACE_ME|TODO_KV_ID|PLACEHOLDER_KV_ID|YOUR_.*_URL|YOUR_.*_KEY|YOUR_DISCORD_WEBHOOK_URL'

# Directories to scan — skip if not present (safe for partial checkouts)
TARGETS=(
  "cloudflare/workers"
  ".github/workflows"
  "scripts"
  "ops"
)

FOUND=0

echo "NOIZY gate: structural checks"
echo "---"

# Structural: STT consent scope must exist if ops/docker-compose references STT
if grep -q "noizy-stt" ops/docker-compose.noizy.yml 2>/dev/null; then
  if [[ ! -f "contracts/consent/scopes.stt.json" ]]; then
    echo "BLOCKED: STT container present but consent scope missing (contracts/consent/scopes.stt.json)"
    FOUND=1
  else
    echo "  clean: STT consent scope present"
  fi
fi

echo "---"
echo "Pattern: $PATTERN"
echo "---"

for t in "${TARGETS[@]}"; do
  if [[ ! -d "$t" && ! -f "$t" ]]; then
    echo "  skip: $t (not present)"
    continue
  fi

  if grep -RInE "$PATTERN" "$t" 2>/dev/null; then
    echo "BLOCKED: placeholder tokens found in $t"
    FOUND=1
  else
    echo "  clean: $t"
  fi
done

echo "---"
if [[ "$FOUND" -eq 1 ]]; then
  echo "FAIL: placeholder scan — fix all tokens above before deploying"
  exit 1
fi

echo "PASS: placeholder scan clean"
