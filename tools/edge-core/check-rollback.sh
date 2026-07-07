#!/usr/bin/env bash
set -euo pipefail

echo "EDGE CORE: checking rollback availability"
echo ""

# Rule: No irreversible deploys. Rollback must be available at every stage.

VIOLATIONS=0

# Check 1: Wrangler is available
if ! command -v npx >/dev/null 2>&1; then
  echo "❌ npx not available — cannot verify wrangler"
  ((VIOLATIONS++))
else
  echo "✅ npx available"
fi

# Check 2: Rollback is wired in CI
if ! grep -rq "rollback\|wrangler rollback" .github/workflows/ 2>/dev/null; then
  echo "❌ EDGE CORE VIOLATION: rollback not wired in CI"
  echo "   Required: rollback capability in deployment workflows"
  ((VIOLATIONS++))
else
  echo "✅ Rollback wired in CI workflows"
fi

# Check 3: Rollback script exists
if [[ ! -f "scripts/rollback.sh" ]]; then
  echo "❌ EDGE CORE VIOLATION: scripts/rollback.sh missing"
  echo "   Required: dedicated rollback script"
  ((VIOLATIONS++))
else
  echo "✅ Rollback script exists"
fi

# Check 4: No dangerous bypass patterns in deploy scripts
# Allow: git worktree --force (maintenance), ethics scanning for patterns
# Forbid: git push --force, wrangler deploy --force, SKIP_ROLLBACK in deploy paths
DEPLOY_BYPASS=$(grep -rn "git push.*--force\|wrangler.*--force\|SKIP_ROLLBACK\|BYPASS_EDGE_CORE" \
  scripts/deploy*.sh scripts/canary*.sh scripts/gradual*.sh .github/workflows/*.yml 2>/dev/null || echo "")

if [[ -n "$DEPLOY_BYPASS" ]]; then
  echo "❌ EDGE CORE VIOLATION: deploy bypass patterns detected"
  echo "   Forbidden in deploy paths: git push --force, wrangler --force, SKIP_ROLLBACK"
  echo "$DEPLOY_BYPASS" | head -5
  ((VIOLATIONS++))
else
  echo "✅ No deploy bypass patterns"
fi

# Check 5: Gradual deployment supported
if ! grep -rq "gradual\|percentage\|versions deploy" scripts/ .github/workflows/ 2>/dev/null; then
  echo "⚠️  Warning: gradual deployment patterns not detected"
  echo "   Recommendation: use Cloudflare gradual deployments"
fi

echo ""
if [[ $VIOLATIONS -gt 0 ]]; then
  echo "════════════════════════════════════════════════════════════════"
  echo "  EDGE CORE: ROLLBACK CHECK FAILED"
  echo "════════════════════════════════════════════════════════════════"
  echo ""
  echo "  Doctrine: Rollback must remain available at every stage."
  echo "  Reference: docs/NOIZY_EDGE_CORE.md § 2"
  echo ""
  exit 1
fi

echo "✅ EDGE CORE: rollback capability confirmed"
