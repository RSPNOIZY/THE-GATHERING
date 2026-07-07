#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════
# CHECK AUDIT READINESS
# Blocks deploy if audit substrate is missing
# Run: ./scripts/edge-core/check-audit-readiness.sh
# ═══════════════════════════════════════════════════════════════════════════

echo "═══════════════════════════════════════════════════════════════════"
echo "  AUDIT READINESS CHECK"
echo "  Rule: If a user can see authority, the system must remember it."
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Check we're in the right directory
if [[ ! -f "wrangler.toml" ]]; then
  echo "❌ Must run from NOIZYANTHROPIC root (wrangler.toml not found)"
  exit 1
fi

FAILED=0

# ───────────────────────────────────────────────────────────────────────────
# Check 1: audit_events table exists
# ───────────────────────────────────────────────────────────────────────────
echo "→ Checking audit_events table..."
AUDIT_TABLE=$(npx wrangler d1 execute gabriel_db --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name='audit_events';" 2>/dev/null | grep -c "audit_events" || echo "0")

if [[ "$AUDIT_TABLE" -ge 1 ]]; then
  echo "  ✓ audit_events table exists"
else
  echo "  ❌ audit_events table MISSING"
  echo "     Run: npx wrangler d1 execute gabriel_db --remote --file migrations/002_audit_events.sql"
  FAILED=1
fi

# ───────────────────────────────────────────────────────────────────────────
# Check 2: operator_tokens table exists
# ───────────────────────────────────────────────────────────────────────────
echo "→ Checking operator_tokens table..."
TOKENS_TABLE=$(npx wrangler d1 execute gabriel_db --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name='operator_tokens';" 2>/dev/null | grep -c "operator_tokens" || echo "0")

if [[ "$TOKENS_TABLE" -ge 1 ]]; then
  echo "  ✓ operator_tokens table exists"
else
  echo "  ❌ operator_tokens table MISSING"
  FAILED=1
fi

# ───────────────────────────────────────────────────────────────────────────
# Check 3: freeze_events table exists
# ───────────────────────────────────────────────────────────────────────────
echo "→ Checking freeze_events table..."
FREEZE_TABLE=$(npx wrangler d1 execute gabriel_db --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name='freeze_events';" 2>/dev/null | grep -c "freeze_events" || echo "0")

if [[ "$FREEZE_TABLE" -ge 1 ]]; then
  echo "  ✓ freeze_events table exists"
else
  echo "  ❌ freeze_events table MISSING"
  FAILED=1
fi

# ───────────────────────────────────────────────────────────────────────────
# Check 4: Can write to audit_events
# ───────────────────────────────────────────────────────────────────────────
if [[ "$AUDIT_TABLE" -ge 1 ]]; then
  echo "→ Testing audit write path..."
  TEST_ID="readiness-check-$(date +%s)"

  WRITE_RESULT=$(npx wrangler d1 execute gabriel_db --remote --command \
    "INSERT INTO audit_events (id, operator_email, action, explanation, precondition_passed) VALUES ('$TEST_ID', 'readiness-check@system', 'READINESS_CHECK', 'Automated audit readiness verification', 1);" 2>&1) || true

  # Verify the write
  READ_RESULT=$(npx wrangler d1 execute gabriel_db --remote --command \
    "SELECT id FROM audit_events WHERE id = '$TEST_ID';" 2>/dev/null | grep -c "$TEST_ID" || echo "0")

  if [[ "$READ_RESULT" -ge 1 ]]; then
    echo "  ✓ Audit write path working"

    # Clean up test record
    npx wrangler d1 execute gabriel_db --remote --command \
      "DELETE FROM audit_events WHERE id = '$TEST_ID';" 2>/dev/null || true
  else
    echo "  ❌ Audit write path FAILED"
    FAILED=1
  fi
fi

# ───────────────────────────────────────────────────────────────────────────
# Check 5: Required indexes exist
# ───────────────────────────────────────────────────────────────────────────
echo "→ Checking indexes..."
INDEXES=$(npx wrangler d1 execute gabriel_db --remote --command "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_audit%';" 2>/dev/null | grep -c "idx_audit" || echo "0")

if [[ "$INDEXES" -ge 1 ]]; then
  echo "  ✓ Audit indexes present ($INDEXES found)"
else
  echo "  ⚠️  Audit indexes missing (performance warning, not blocking)"
fi

# ───────────────────────────────────────────────────────────────────────────
# Result
# ───────────────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════════"

if [[ "$FAILED" -eq 0 ]]; then
  echo "  ✅ AUDIT READINESS: PASSED"
  echo "     UX surfaces may be deployed."
  echo "═══════════════════════════════════════════════════════════════════"
  exit 0
else
  echo "  ❌ AUDIT READINESS: FAILED"
  echo ""
  echo "  BLOCKING: Do not deploy UX surfaces until audit substrate exists."
  echo ""
  echo "  Fix with:"
  echo "    npx wrangler d1 execute gabriel_db --remote --file migrations/002_audit_events.sql"
  echo ""
  echo "  Then re-run this check."
  echo "═══════════════════════════════════════════════════════════════════"
  exit 1
fi
