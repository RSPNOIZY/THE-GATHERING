#!/usr/bin/env bash
set -euo pipefail

echo "EDGE CORE: checking observability requirements"
echo ""

# Rule: If a deploy changes traffic or behavior, observability tooling must be present.

VIOLATIONS=0

# Check 1: Analytics or logging usage in src/
if ! grep -rq "analytics\|log\|metric\|observe" src/ 2>/dev/null; then
  echo "❌ EDGE CORE VIOLATION: no observability patterns in src/"
  echo "   Required: analytics, logging, or metrics usage"
  ((VIOLATIONS++))
else
  echo "✅ Observability patterns present in src/"
fi

# Check 2: Observability module exists
if [[ ! -f "src/observability.js" ]] && [[ ! -f "src/observability.ts" ]]; then
  echo "❌ EDGE CORE VIOLATION: src/observability.js missing"
  echo "   Required: centralized observability module"
  ((VIOLATIONS++))
else
  echo "✅ Observability module exists"
fi

# Check 3: No silent failures (catch without log)
SILENT_CATCHES=$(grep -rn "catch.*{[[:space:]]*}" src/ 2>/dev/null | wc -l | tr -d ' ')
if [[ "$SILENT_CATCHES" -gt 0 ]]; then
  echo "⚠️  Warning: $SILENT_CATCHES silent catch blocks detected"
  echo "   Recommendation: log errors before swallowing"
fi

echo ""
if [[ $VIOLATIONS -gt 0 ]]; then
  echo "════════════════════════════════════════════════════════════════"
  echo "  EDGE CORE: OBSERVABILITY CHECK FAILED"
  echo "════════════════════════════════════════════════════════════════"
  echo ""
  echo "  Doctrine: Without observability, rollout is theater."
  echo "  Reference: docs/NOIZY_EDGE_CORE.md § 4"
  echo ""
  exit 1
fi

echo "✅ EDGE CORE: observability requirements met"
