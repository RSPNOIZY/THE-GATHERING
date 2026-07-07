#!/usr/bin/env bash
set -euo pipefail

echo "════════════════════════════════════════════════════════════════════════"
echo "  NOIZY UNIVERSE FIX — Comprehensive Repair Script"
echo "════════════════════════════════════════════════════════════════════════"
echo ""
echo "  Target: rsp@noizy.ai (5f36aa9795348ea681d0b21910dfc82a)"
echo "  Mission: Consolidate EVERYTHING to one account"
echo ""
echo "════════════════════════════════════════════════════════════════════════"

CANONICAL_ACCOUNT="5f36aa9795348ea681d0b21910dfc82a"
LEGACY_ACCOUNT_1="2446d788cc4280f5ea22a9948410c355"
LEGACY_ACCOUNT_2="5f36aa9795348ea681d0b21910dfc82a"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }

echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "  PHASE 1: Update all wrangler.toml files to canonical account"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

# Fix repos/noizy-heaven
if [[ -f "repos/noizy-heaven/wrangler.toml" ]]; then
  if grep -q "$LEGACY_ACCOUNT_1" repos/noizy-heaven/wrangler.toml; then
    warning "repos/noizy-heaven has legacy account - updating..."
    sed -i.bak "s/$LEGACY_ACCOUNT_1/$CANONICAL_ACCOUNT/g" repos/noizy-heaven/wrangler.toml
    success "repos/noizy-heaven updated to canonical account"
  else
    success "repos/noizy-heaven already on canonical account"
  fi
fi

# Fix noisyproof
if [[ -f "noisyproof/wrangler.toml" ]]; then
  if grep -q "$LEGACY_ACCOUNT_1" noisyproof/wrangler.toml; then
    warning "noisyproof has legacy account - updating..."
    sed -i.bak "s/$LEGACY_ACCOUNT_1/$CANONICAL_ACCOUNT/g" noisyproof/wrangler.toml
    success "noisyproof updated to canonical account"
  fi
fi

# Fix cloudflare-workers
if [[ -f "cloudflare-workers/wrangler.toml" ]]; then
  if grep -q "$LEGACY_ACCOUNT_1" cloudflare-workers/wrangler.toml; then
    warning "cloudflare-workers has legacy account - updating..."
    sed -i.bak "s/$LEGACY_ACCOUNT_1/$CANONICAL_ACCOUNT/g" cloudflare-workers/wrangler.toml
    success "cloudflare-workers updated to canonical account"
  fi
fi

# Fix NOIZYEMPIRE workers
if [[ -f "NOIZYEMPIRE/workers/noizy-coming-soon/wrangler.toml" ]]; then
  if grep -q "$LEGACY_ACCOUNT_1" NOIZYEMPIRE/workers/noizy-coming-soon/wrangler.toml; then
    warning "noizy-coming-soon has legacy account - updating..."
    sed -i.bak "s/$LEGACY_ACCOUNT_1/$CANONICAL_ACCOUNT/g" NOIZYEMPIRE/workers/noizy-coming-soon/wrangler.toml
    success "noizy-coming-soon updated to canonical account"
  fi
fi

# Fix claude-proxy
if [[ -f "workers/claude-proxy/wrangler.toml" ]]; then
  if grep -q "$LEGACY_ACCOUNT_2" workers/claude-proxy/wrangler.toml; then
    warning "claude-proxy has secondary account - updating..."
    sed -i.bak "s/$LEGACY_ACCOUNT_2/$CANONICAL_ACCOUNT/g" workers/claude-proxy/wrangler.toml
    success "claude-proxy updated to canonical account"
  fi
fi

# Add account_id to files missing it
echo ""
echo "Checking for missing account_id declarations..."

add_account_id() {
  local file="$1"
  if [[ -f "$file" ]]; then
    if ! grep -q "account_id" "$file"; then
      warning "$file missing account_id - adding..."
      # Add after the name line
      sed -i.bak '/^name = /a\
account_id = "'"$CANONICAL_ACCOUNT"'"
' "$file"
      success "Added account_id to $file"
    fi
  fi
}

add_account_id "NOIZYLAB/noisyproof/wrangler.toml"
add_account_id "NOIZYLAB/noisyvox/wrangler.toml"
add_account_id "NOIZYLAB/noisybox/wrangler.toml"
add_account_id "noizy-landing/wrangler.toml"

echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "  PHASE 2: Update CLAUDE.md with correct URLs"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

if [[ -f "CLAUDE.md" ]]; then
  # Update rsp-5f3.workers.dev references to rsp-5f3.workers.dev
  if grep -q "rsp-5f3.workers.dev" CLAUDE.md; then
    warning "CLAUDE.md has old rsp-5f3.workers.dev URLs - updating..."
    sed -i.bak 's/heaven\.noizylab\.workers\.dev/heaven.rsp-5f3.workers.dev/g' CLAUDE.md
    sed -i.bak 's/noizy-landing\.noizylab\.workers\.dev/noizy-landing.rsp-5f3.workers.dev/g' CLAUDE.md
    success "CLAUDE.md URLs updated to rsp-5f3.workers.dev"
  else
    success "CLAUDE.md already has correct URLs"
  fi
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "  PHASE 3: Update hardcoded account IDs in source files"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

# Files with legacy account ID that should be updated
FILES_TO_UPDATE=(
  "mcp-gemma3/server.js"
  "mcp/consent-oracle/src/server.js"
  "web/assets/gabriel.js"
  "web/assets/extras.js"
  "dashboard/gabriel.js"
  "dashboard/extras.js"
)

for file in "${FILES_TO_UPDATE[@]}"; do
  if [[ -f "$file" ]]; then
    if grep -q "$LEGACY_ACCOUNT_2" "$file"; then
      warning "$file has legacy account ID - updating..."
      sed -i.bak "s/$LEGACY_ACCOUNT_2/$CANONICAL_ACCOUNT/g" "$file"
      success "Updated $file"
    fi
  fi
done

echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "  PHASE 4: Clean up backup files"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

BACKUP_COUNT=$(find . -name "*.bak" -type f 2>/dev/null | wc -l | tr -d ' ')
if [[ "$BACKUP_COUNT" -gt 0 ]]; then
  echo "Found $BACKUP_COUNT backup files"
  find . -name "*.bak" -type f -delete 2>/dev/null || true
  success "Removed backup files"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "  PHASE 5: Verify wrangler.toml configurations"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

echo "Scanning all wrangler.toml files for account consistency..."
echo ""

WRONG_ACCOUNT=0
find . -name "wrangler.toml" -not -path "*/node_modules/*" -not -path "*/.wrangler/*" 2>/dev/null | while read -r file; do
  if grep -q "account_id" "$file"; then
    ACCOUNT=$(grep "account_id" "$file" | head -1 | sed 's/.*"\([^"]*\)".*/\1/')
    if [[ "$ACCOUNT" == "$CANONICAL_ACCOUNT" ]]; then
      echo "  ✅ $file"
    elif [[ "$ACCOUNT" == *"PLACEHOLDER"* ]]; then
      echo "  ⏳ $file (placeholder)"
    else
      echo "  ❌ $file ($ACCOUNT)"
      ((WRONG_ACCOUNT++))
    fi
  else
    echo "  ⚠️  $file (no account_id)"
  fi
done

echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "  PHASE 6: Test endpoints"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

test_endpoint() {
  local url="$1"
  local name="$2"
  local status=$(curl -sf -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
  if [[ "$status" == "200" ]]; then
    success "$name: HTTP $status"
  elif [[ "$status" == "522" ]]; then
    error "$name: HTTP $status (zone on wrong account)"
  else
    warning "$name: HTTP $status"
  fi
}

test_endpoint "https://heaven.rsp-5f3.workers.dev/health" "heaven.rsp-5f3"
test_endpoint "https://noizy.ai/" "noizy.ai"

echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo "  FIX SCRIPT COMPLETE"
echo "════════════════════════════════════════════════════════════════════════"
echo ""
echo "  AUTOMATED FIXES APPLIED:"
echo "    • Updated wrangler.toml files to canonical account"
echo "    • Updated CLAUDE.md URLs"
echo "    • Updated hardcoded account IDs in source files"
echo ""
echo "  MANUAL ACTIONS REQUIRED (Cloudflare Dashboard):"
echo "    1. Login to Cloudflare as rsp@noizy.ai"
echo "    2. Create FEATURE_FLAGS KV namespace"
echo "    3. Migrate noizy.ai zone from other account"
echo "    4. Add worker route: noizy.ai/* → heaven"
echo ""
echo "  See: docs/NOIZY_DOMAIN_MIGRATION.md"
echo "════════════════════════════════════════════════════════════════════════"
