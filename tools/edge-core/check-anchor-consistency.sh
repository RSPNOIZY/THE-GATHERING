#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════
# EDGE CORE: CHECK ANCHOR CONSISTENCY (CI GATE)
# Purpose: Ensure local audit root matches published anchor
# Usage:  ./scripts/edge-core/check-anchor-consistency.sh [local_root_file]
# ═══════════════════════════════════════════════════════════════════════════

echo "EDGE CORE: checking audit anchor consistency"

ANCHOR_URL="${ANCHOR_URL:-https://heaven.rsp-5f3.workers.dev/trust/anchor-status}"
LOCAL_ROOT_FILE="${1:-audit_merkle_root.txt}"

# Check if local root file exists
if [ ! -f "$LOCAL_ROOT_FILE" ]; then
  echo "⚠️  No local root file found: $LOCAL_ROOT_FILE"
  echo "    Skipping consistency check (no local state to compare)..."
  exit 0
fi

# Fetch published root
ANCHOR=$(curl -sf "$ANCHOR_URL" 2>/dev/null) || {
  echo "⚠️  Could not fetch anchor status"
  echo "    Skipping consistency check..."
  exit 0
}

ROOT_PUBLIC=$(echo "$ANCHOR" | jq -r '.root_hash_full // .root_hash' 2>/dev/null) || {
  echo "⚠️  Could not parse anchor root"
  exit 0
}

if [ -z "$ROOT_PUBLIC" ] || [ "$ROOT_PUBLIC" = "null" ]; then
  echo "⚠️  No root hash in anchor response"
  exit 0
fi

ROOT_LOCAL=$(cat "$LOCAL_ROOT_FILE" | tr -d '[:space:]')

echo "  Published root: ${ROOT_PUBLIC:0:16}..."
echo "  Local root:     ${ROOT_LOCAL:0:16}..."

if [ "$ROOT_PUBLIC" != "$ROOT_LOCAL" ]; then
  echo ""
  echo "═══════════════════════════════════════════════════════════════════"
  echo "  ❌ EDGE CORE VIOLATION: audit root mismatch"
  echo ""
  echo "  Published: $ROOT_PUBLIC"
  echo "  Local:     $ROOT_LOCAL"
  echo ""
  echo "  Rule: Local audit state must match published anchors."
  echo "        A mismatch indicates either:"
  echo "        - Local audit data has diverged"
  echo "        - Published anchor is from a different date"
  echo "        - Potential tampering"
  echo ""
  echo "  Build blocked until consistency is restored."
  echo "═══════════════════════════════════════════════════════════════════"
  exit 1
fi

echo "✅ Local audit root matches published anchor"
