#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════
# EDGE CORE: CHECK ANCHOR PUBLISHED (CI GATE)
# Purpose: Block builds if audit anchor is stale
# Usage:  ./scripts/edge-core/check-anchor-published.sh
# ═══════════════════════════════════════════════════════════════════════════

echo "EDGE CORE: checking audit anchor freshness"

ANCHOR_URL="${ANCHOR_URL:-https://heaven.rsp-5f3.workers.dev/trust/anchor-status}"
MAX_AGE_SECONDS="${MAX_AGE_SECONDS:-86400}"  # 24 hours default

# Fetch latest anchor status
ANCHOR=$(curl -sf "$ANCHOR_URL" 2>/dev/null) || {
  echo "⚠️  Could not fetch anchor status (endpoint may not be deployed yet)"
  echo "    Skipping anchor freshness check..."
  exit 0
}

# Check if we got valid JSON
if ! echo "$ANCHOR" | jq -e '.last_anchor' > /dev/null 2>&1; then
  echo "⚠️  Invalid anchor response (no anchors published yet)"
  echo "    This is expected for new deployments."
  exit 0
fi

ANCHOR_TIME=$(echo "$ANCHOR" | jq -r '.last_anchor')

# Handle different date formats
if command -v gdate &> /dev/null; then
  # macOS with coreutils
  ANCHOR_EPOCH=$(gdate -d "$ANCHOR_TIME" +%s 2>/dev/null || echo "0")
  NOW=$(gdate +%s)
elif date --version 2>&1 | grep -q GNU; then
  # Linux
  ANCHOR_EPOCH=$(date -d "$ANCHOR_TIME" +%s 2>/dev/null || echo "0")
  NOW=$(date +%s)
else
  # macOS native (limited)
  echo "⚠️  Date parsing limited on this system"
  echo "    Skipping age check..."
  exit 0
fi

if [ "$ANCHOR_EPOCH" = "0" ]; then
  echo "⚠️  Could not parse anchor timestamp"
  exit 0
fi

AGE=$((NOW - ANCHOR_EPOCH))

echo "  Last anchor: $ANCHOR_TIME"
echo "  Age: $AGE seconds (max: $MAX_AGE_SECONDS)"

if [ "$AGE" -gt "$MAX_AGE_SECONDS" ]; then
  echo ""
  echo "═══════════════════════════════════════════════════════════════════"
  echo "  ❌ EDGE CORE VIOLATION: audit anchor stale"
  echo ""
  echo "  Age: $AGE seconds (max allowed: $MAX_AGE_SECONDS)"
  echo "  Last anchor: $ANCHOR_TIME"
  echo ""
  echo "  Rule: Audit anchors must be published daily."
  echo "        Stale anchors indicate anchoring system failure."
  echo ""
  echo "  Fix: Ensure daily anchor cron is running."
  echo "═══════════════════════════════════════════════════════════════════"
  exit 1
fi

echo "✅ Audit anchor is fresh ($AGE seconds old)"
