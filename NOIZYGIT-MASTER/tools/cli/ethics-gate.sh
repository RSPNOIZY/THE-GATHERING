#!/usr/bin/env bash
set -euo pipefail

echo "⚖️ NOIZY Ethics Gate"
echo "===================="

FAILED=0

# Check 1: No destructive commands in recent changes
echo ""
echo "Check 1: No destructive patterns"
if git diff HEAD~1 --name-only 2>/dev/null | xargs grep -l "DROP TABLE\|DELETE FROM\|rm -rf\|--force\|--hard" 2>/dev/null; then
  echo "  ⚠️  WARNING: Destructive patterns found in changes"
  ((FAILED++))
else
  echo "  ✅ No destructive patterns"
fi

# Check 2: Royalty floor enforced
echo ""
echo "Check 2: Royalty floor (75%)"
if grep -rn "royalty.*0\.[0-6][0-9]" --include="*.js" --include="*.ts" --include="*.json" \
   --exclude-dir=node_modules . 2>/dev/null; then
  echo "  ❌ BLOCKED: Royalty split below 75% detected"
  ((FAILED++))
else
  echo "  ✅ Royalty floor maintained"
fi

# Check 3: Never Clauses present
echo ""
echo "Check 3: Never Clauses"
NEVER_COUNT=$(grep -r "NEVER\|never.*clause\|prohibit" --include="*.js" --include="*.ts" \
  --exclude-dir=node_modules . 2>/dev/null | wc -l || echo "0")
if [[ "$NEVER_COUNT" -gt 0 ]]; then
  echo "  ✅ Never Clauses present ($NEVER_COUNT references)"
else
  echo "  ⚠️  WARNING: No Never Clause references found"
fi

# Check 4: Consent checks in API handlers
echo ""
echo "Check 4: Consent enforcement"
if grep -r "consent\|CONSENT\|isAuthorized\|checkAuth" --include="*.js" --include="*.ts" \
   --exclude-dir=node_modules src/ 2>/dev/null | head -1 > /dev/null; then
  echo "  ✅ Consent checks present"
else
  echo "  ⚠️  WARNING: No consent checks found in src/"
fi

# Check 5: No hardcoded secrets
echo ""
echo "Check 5: No hardcoded secrets"
if grep -rE "(api[_-]?key|secret|password|token)\s*[=:]\s*['\"][^'\"]+['\"]" \
   --include="*.js" --include="*.ts" --exclude-dir=node_modules src/ 2>/dev/null | \
   grep -v "process\.env\|env\." | grep -v "example\|placeholder\|YOUR_" | head -1; then
  echo "  ❌ BLOCKED: Potential hardcoded secrets found"
  ((FAILED++))
else
  echo "  ✅ No hardcoded secrets"
fi

# Check 6: Account lock (NOIZY.AI only)
echo ""
echo "Check 6: Account lock"
ACCOUNT_ID=$(grep "account_id" wrangler.toml 2>/dev/null | head -1 || echo "")
if [[ "$ACCOUNT_ID" == *"5f36aa9795348ea681d0b21910dfc82a"* ]]; then
  echo "  ✅ Locked to rsp@noizy.ai account"
else
  echo "  ⚠️  WARNING: Account ID not verified"
fi

echo ""
echo "═══════════════════════════════════════"

if [[ $FAILED -gt 0 ]]; then
  echo "❌ Ethics gate FAILED ($FAILED violations)"
  echo "   Deploy blocked until issues resolved."
  exit 1
fi

echo "✅ Ethics gate PASSED"
echo "   Deploy authorized."
