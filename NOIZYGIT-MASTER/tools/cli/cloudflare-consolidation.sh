#!/usr/bin/env bash
set -euo pipefail

echo "════════════════════════════════════════════════════════════════════════"
echo "  NOIZY Cloudflare Consolidation — rsp@noizy.ai ONLY"
echo "════════════════════════════════════════════════════════════════════════"
echo ""
echo "  Target Account: rsp@noizy.ai (NOIZY.AI)"
echo "  Account ID:     5f36aa9795348ea681d0b21910dfc82a"
echo "  Workers Domain: *.rsp-5f3.workers.dev"
echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo ""

# Check auth
echo "Step 1: Checking authentication..."
if ! npx wrangler whoami 2>/dev/null | grep -q "Account"; then
  echo ""
  echo "  ❌ Not authenticated. Run:"
  echo "     npx wrangler login"
  echo ""
  echo "  Then re-run this script."
  exit 1
fi

ACCOUNT_INFO=$(npx wrangler whoami 2>/dev/null)
echo "$ACCOUNT_INFO"
echo ""

# Verify correct account
if ! echo "$ACCOUNT_INFO" | grep -q "5f36aa9795348ea681d0b21910dfc82a"; then
  echo "  ⚠️  WARNING: May not be logged into rsp@noizy.ai account"
  echo "     Expected Account ID: 5f36aa9795348ea681d0b21910dfc82a"
fi

echo ""
echo "Step 2: Listing Workers..."
npx wrangler deployments list 2>/dev/null | head -10 || echo "  (no deployments or error)"

echo ""
echo "Step 3: Listing KV Namespaces..."
npx wrangler kv namespace list 2>/dev/null || echo "  (no namespaces or error)"

echo ""
echo "Step 4: Listing D1 Databases..."
npx wrangler d1 list 2>/dev/null || echo "  (no databases or error)"

echo ""
echo "Step 5: Testing Heaven Worker..."
HEALTH=$(curl -sf https://heaven.rsp-5f3.workers.dev/health 2>/dev/null || echo '{"error":"unreachable"}')
echo "  $HEALTH" | head -c 200
echo ""

echo ""
echo "Step 6: Testing noizy.ai domain..."
NOIZY_STATUS=$(curl -sf -o /dev/null -w "%{http_code}" https://noizy.ai/ 2>/dev/null || echo "000")
if [[ "$NOIZY_STATUS" == "200" ]]; then
  echo "  ✅ noizy.ai returns HTTP 200"
elif [[ "$NOIZY_STATUS" == "522" ]]; then
  echo "  ❌ noizy.ai returns HTTP 522 — ZONE ON WRONG ACCOUNT"
  echo ""
  echo "  The noizy.ai domain zone must be migrated to rsp@noizy.ai account."
  echo "  See: docs/NOIZY_DOMAIN_MIGRATION.md"
else
  echo "  ⚠️  noizy.ai returns HTTP $NOIZY_STATUS"
fi

echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo "  REQUIRED ACTIONS FOR 100% CONSOLIDATION"
echo "════════════════════════════════════════════════════════════════════════"
echo ""
echo "  1. [ ] Login to Cloudflare as rsp@noizy.ai"
echo "  2. [ ] Create FEATURE_FLAGS KV namespace"
echo "  3. [ ] Migrate noizy.ai zone to this account (see below)"
echo "  4. [ ] Add worker route: noizy.ai/* → heaven"
echo "  5. [ ] Verify all endpoints return 200"
echo ""
echo "════════════════════════════════════════════════════════════════════════"
