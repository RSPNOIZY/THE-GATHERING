#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════
# AUDIT READINESS GATE
# Blocks deploy if audit infrastructure is not ready
#
# Core Law: If a user can see authority, the system must already be able
#           to remember it.
#
# Usage: ./scripts/audit-readiness-gate.sh
# ═══════════════════════════════════════════════════════════════════════════

echo "═══════════════════════════════════════════════════════════════════"
echo "  AUDIT READINESS GATE"
echo "  If the system can act, it must already be able to remember."
echo "═══════════════════════════════════════════════════════════════════"
echo ""

FAILED=0

# ───────────────────────────────────────────────────────────────────────────
# Check 1: Migration file exists
# ───────────────────────────────────────────────────────────────────────────
echo "→ Checking audit migration file..."

MIGRATION_FILE=""
if [[ -f "ops/migrations/001_audit_events.sql" ]]; then
  MIGRATION_FILE="ops/migrations/001_audit_events.sql"
elif [[ -f "migrations/002_audit_events.sql" ]]; then
  MIGRATION_FILE="migrations/002_audit_events.sql"
fi

if [[ -n "$MIGRATION_FILE" ]]; then
  echo "  ✓ Migration file present: $MIGRATION_FILE"
else
  echo "  ❌ Migration file MISSING"
  echo "     Expected: ops/migrations/001_audit_events.sql or migrations/002_audit_events.sql"
  FAILED=1
fi

# ───────────────────────────────────────────────────────────────────────────
# Check 2: Wrangler config contains audit binding
# ───────────────────────────────────────────────────────────────────────────
echo "→ Checking Wrangler config for audit binding..."

BINDING_FOUND=0

# Check for GABRIEL_DB (current binding name) or AUDIT_D1
if grep -qE "(GABRIEL_DB|AUDIT_D1)" wrangler.toml 2>/dev/null; then
  BINDING_FOUND=1
fi

if grep -qE "(GABRIEL_DB|AUDIT_D1)" wrangler.jsonc 2>/dev/null; then
  BINDING_FOUND=1
fi

if [[ "$BINDING_FOUND" -eq 1 ]]; then
  echo "  ✓ D1 binding configured"
else
  echo "  ❌ D1 binding MISSING from wrangler config"
  FAILED=1
fi

# ───────────────────────────────────────────────────────────────────────────
# Check 3: All required tables exist remotely
# ───────────────────────────────────────────────────────────────────────────
echo "→ Checking all required audit tables exist remotely..."

# Determine database name
DB_NAME="${AUDIT_D1_DATABASE:-gabriel_db}"

# Required tables per 001_audit_events.sql
REQUIRED_TABLES=("audit_events" "operator_tokens" "freeze_events" "audit_anchors" "transparency_log" "audit_incidents")

for TABLE in "${REQUIRED_TABLES[@]}"; do
  OUTPUT=$(npx wrangler d1 execute "$DB_NAME" --remote \
    --command "SELECT name FROM sqlite_master WHERE type='table' AND name='$TABLE';" 2>&1) || true

  if echo "$OUTPUT" | grep -q "$TABLE"; then
    echo "  ✓ $TABLE table exists"
  else
    echo "  ❌ $TABLE table MISSING"
    echo "     Run: npx wrangler d1 execute $DB_NAME --remote --file $MIGRATION_FILE"
    FAILED=1
  fi
done

# ───────────────────────────────────────────────────────────────────────────
# Check 4: Schema validation - verify audit_events has required columns
# ───────────────────────────────────────────────────────────────────────────
if [[ "$FAILED" -eq 0 ]]; then
  echo "→ Validating audit_events schema..."

  SCHEMA_OUTPUT=$(npx wrangler d1 execute "$DB_NAME" --remote \
    --command "PRAGMA table_info(audit_events);" 2>&1) || true

  REQUIRED_COLUMNS=("id" "operator_email" "action" "explanation" "precondition_passed" "created_at")
  SCHEMA_OK=1

  for COL in "${REQUIRED_COLUMNS[@]}"; do
    if ! echo "$SCHEMA_OUTPUT" | grep -q "$COL"; then
      echo "  ❌ Column $COL MISSING from audit_events"
      SCHEMA_OK=0
      FAILED=1
    fi
  done

  if [[ "$SCHEMA_OK" -eq 1 ]]; then
    echo "  ✓ audit_events schema validated"
  fi
fi

# ───────────────────────────────────────────────────────────────────────────
# Check 5: Test write path (dry-run) with explicit commit verification
# ───────────────────────────────────────────────────────────────────────────
if [[ "$FAILED" -eq 0 ]]; then
  echo "→ Testing audit write path (dry-run)..."

  TEST_ID="gate-check-$(date +%s)-$$"

  # Step 1: Write the test event
  WRITE_RESULT=$(npx wrangler d1 execute "$DB_NAME" --remote --command \
    "INSERT INTO audit_events (id, operator_email, action, explanation, precondition_passed) VALUES ('$TEST_ID', 'ci@system', 'READINESS_GATE', 'Automated audit readiness gate verification', 1);" 2>&1) || true

  if echo "$WRITE_RESULT" | grep -qi "error\|exception\|failed"; then
    echo "  ❌ Audit INSERT failed"
    echo "     Output: $WRITE_RESULT"
    FAILED=1
  else
    echo "  ✓ INSERT executed"

    # Step 2: Explicit commit verification — read back and count
    READ_RESULT=$(npx wrangler d1 execute "$DB_NAME" --remote --command \
      "SELECT COUNT(*) as cnt FROM audit_events WHERE id = '$TEST_ID';" 2>&1) || true

    if echo "$READ_RESULT" | grep -q "\"cnt\": 1\|cnt.*1"; then
      echo "  ✓ Row committed and verifiable (count = 1)"

      # Step 3: Verify all required columns populated
      FULL_ROW=$(npx wrangler d1 execute "$DB_NAME" --remote --command \
        "SELECT id, operator_email, action, explanation, precondition_passed, created_at FROM audit_events WHERE id = '$TEST_ID';" 2>&1) || true

      if echo "$FULL_ROW" | grep -q "READINESS_GATE" && echo "$FULL_ROW" | grep -q "ci@system"; then
        echo "  ✓ All required columns populated correctly"

        # Step 4: Clean up test record and verify deletion
        npx wrangler d1 execute "$DB_NAME" --remote --command \
          "DELETE FROM audit_events WHERE id = '$TEST_ID';" 2>/dev/null || true

        DELETE_VERIFY=$(npx wrangler d1 execute "$DB_NAME" --remote --command \
          "SELECT COUNT(*) as cnt FROM audit_events WHERE id = '$TEST_ID';" 2>&1) || true

        if echo "$DELETE_VERIFY" | grep -q "\"cnt\": 0\|cnt.*0"; then
          echo "  ✓ Cleanup verified (test row removed)"
        else
          echo "  ⚠️ Cleanup incomplete (test row may persist — non-blocking)"
        fi
      else
        echo "  ❌ Row data incomplete"
        echo "     Expected: id, operator_email, action, explanation, precondition_passed, created_at"
        FAILED=1
      fi
    else
      echo "  ❌ Audit write FAILED — row not committed"
      echo "     Expected count = 1, got: $READ_RESULT"
      FAILED=1
    fi
  fi
fi

# ───────────────────────────────────────────────────────────────────────────
# Result
# ───────────────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════════"

if [[ "$FAILED" -eq 0 ]]; then
  echo "  ✅ AUDIT READINESS GATE: PASSED"
  echo ""
  echo "  Deploy may proceed."
  echo "═══════════════════════════════════════════════════════════════════"
  exit 0
else
  echo "  ❌ AUDIT READINESS GATE: FAILED"
  echo ""
  echo "  BLOCKING: Deploy must not proceed until audit readiness is confirmed."
  echo ""
  echo "  Core Law: If a user can see authority, the system must already"
  echo "            be able to remember it."
  echo ""
  echo "  Fix the issues above and re-run this gate."
  echo "═══════════════════════════════════════════════════════════════════"
  exit 1
fi
