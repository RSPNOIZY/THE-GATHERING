#!/usr/bin/env bash
set -euo pipefail

echo "EDGE CORE: verifying DR visibility"
echo ""

# Rule: Every production system must have visible read-only recovery account.

VIOLATIONS=0

# Check 1: DR documentation exists
if [[ ! -f "docs/DR-PLAYBOOK.md" ]]; then
  echo "❌ EDGE CORE VIOLATION: DR playbook missing"
  echo "   Required: docs/DR-PLAYBOOK.md"
  ((VIOLATIONS++))
else
  echo "✅ DR playbook exists"
fi

# Check 2: DR drill script exists
if [[ ! -f "scripts/dr-drill.sh" ]] && [[ ! -f "scripts/drill-dr.sh" ]]; then
  echo "❌ EDGE CORE VIOLATION: DR drill script missing"
  echo "   Required: scripts/dr-drill.sh"
  ((VIOLATIONS++))
else
  echo "✅ DR drill script exists"
fi

# Check 3: DR account configured (if env var expected)
if [[ -n "${REQUIRE_DR_ACCOUNT:-}" ]]; then
  if [[ -z "${DR_ACCOUNT_ID:-}" ]]; then
    echo "❌ EDGE CORE VIOLATION: DR_ACCOUNT_ID not configured"
    echo "   Required: read-only DR account"
    ((VIOLATIONS++))
  else
    echo "✅ DR account configured: ${DR_ACCOUNT_ID:0:8}..."
  fi
else
  echo "ℹ️  DR account check skipped (set REQUIRE_DR_ACCOUNT=1 to enforce)"
fi

# Check 4: Secrets recovery template exists
if [[ ! -f ".dev.vars.example" ]]; then
  echo "⚠️  Warning: .dev.vars.example missing"
  echo "   Recommendation: document secret recovery"
fi

# Check 5: wrangler.toml exists (config visibility)
if [[ ! -f "wrangler.toml" ]]; then
  echo "❌ EDGE CORE VIOLATION: wrangler.toml missing"
  echo "   Required: infrastructure config must be version-controlled"
  ((VIOLATIONS++))
else
  echo "✅ wrangler.toml present"
fi

echo ""
if [[ $VIOLATIONS -gt 0 ]]; then
  echo "════════════════════════════════════════════════════════════════"
  echo "  EDGE CORE: DR VISIBILITY CHECK FAILED"
  echo "════════════════════════════════════════════════════════════════"
  echo ""
  echo "  Doctrine: Recovery visibility without write access is deliberate."
  echo "  Reference: docs/NOIZY_EDGE_CORE.md § 6"
  echo ""
  exit 1
fi

echo "✅ EDGE CORE: DR visibility confirmed"
