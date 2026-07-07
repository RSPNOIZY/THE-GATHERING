#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════
# EDGE CORE: CHECK AUDIT READINESS (CI GATE)
# Purpose: Block UX deploy if audit tables are missing
# Usage:  ./scripts/edge-core/check-audit-ready.sh
# ═══════════════════════════════════════════════════════════════════════════

echo "EDGE CORE: checking audit readiness (D1)"

# Use database name if ID not set
DB_TARGET="${AUDIT_D1_DATABASE_ID:-gabriel_db}"

# Verify audit_events table exists
RESULT=$(npx wrangler d1 execute "$DB_TARGET" --remote \
  --command "SELECT name FROM sqlite_master WHERE type='table' AND name='audit_events';" 2>&1) || true

if [[ "$RESULT" != *"audit_events"* ]]; then
  echo ""
  echo "═══════════════════════════════════════════════════════════════════"
  echo "  ❌ EDGE CORE VIOLATION: audit_events table missing"
  echo ""
  echo "  Rule: Authority cannot exist without memory."
  echo "        If it can't be audited, it can't happen."
  echo ""
  echo "  UX deploy blocked — audit must exist before authority is shown"
  echo ""
  echo "  Fix with:"
  echo "    npx wrangler d1 execute gabriel_db --remote --file migrations/002_audit_events.sql"
  echo "═══════════════════════════════════════════════════════════════════"
  exit 1
fi

echo "✅ audit_events table present — UX deploy allowed"
