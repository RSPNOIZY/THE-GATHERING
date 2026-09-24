#!/usr/bin/env bash
set -euo pipefail

# ── NOIZY Empire — Unified Brand Deploy ──────────────────────────────
# Deploys all 5 brand Workers + heaven-dns to Cloudflare
# Usage:
#   ./scripts/deploy-all-brands.sh              # deploy all (default: staging)
#   ./scripts/deploy-all-brands.sh production   # deploy all to production
#   ./scripts/deploy-all-brands.sh staging fish  # deploy only fish to staging

ENV="${1:-staging}"
TARGET="${2:-all}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

BRANDS=(
  "fish.noizy.ai"
  "lab.noizy.ai"
  "vox.noizy.ai"
  "wisdom.noizy.ai"
  "hooks.noizy.ai"
  "heaven-dns"
)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PASS=0
FAIL=0
SKIP=0
RESULTS=()

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     NOIZY EMPIRE — Brand Deploy ($ENV)          ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# ── Pre-flight: type-check ───────────────────────────────────────────
echo -e "${YELLOW}[PRE-FLIGHT] Type-checking all brands...${NC}"
for brand in "${BRANDS[@]}"; do
  dir="$ROOT/$brand"
  if [[ ! -f "$dir/tsconfig.json" ]]; then
    echo -e "  ${YELLOW}SKIP${NC} $brand (no tsconfig.json)"
    continue
  fi
  if ! (cd "$dir" && npx tsc --noEmit 2>&1); then
    echo -e "  ${RED}FAIL${NC} $brand — type errors found"
    echo -e "${RED}Aborting deploy. Fix type errors first.${NC}"
    exit 1
  fi
  echo -e "  ${GREEN}PASS${NC} $brand"
done
echo ""

# ── Deploy ───────────────────────────────────────────────────────────
for brand in "${BRANDS[@]}"; do
  dir="$ROOT/$brand"

  # Filter by target
  if [[ "$TARGET" != "all" && "$brand" != *"$TARGET"* ]]; then
    SKIP=$((SKIP + 1))
    continue
  fi

  if [[ ! -f "$dir/wrangler.jsonc" && ! -f "$dir/wrangler.toml" ]]; then
    echo -e "${YELLOW}[SKIP]${NC} $brand — no wrangler config"
    SKIP=$((SKIP + 1))
    RESULTS+=("SKIP $brand")
    continue
  fi

  echo -e "${CYAN}[DEPLOY]${NC} $brand → $ENV"

  # Install deps if needed
  if [[ -f "$dir/package.json" && ! -d "$dir/node_modules" ]]; then
    echo -e "  Installing dependencies..."
    (cd "$dir" && npm install --silent)
  fi

  # Deploy
  if [[ "$ENV" == "production" ]]; then
    if (cd "$dir" && npx wrangler deploy --env production 2>&1); then
      echo -e "  ${GREEN}DEPLOYED${NC} $brand → production"
      PASS=$((PASS + 1))
      RESULTS+=("PASS $brand → production")
    else
      echo -e "  ${RED}FAILED${NC} $brand"
      FAIL=$((FAIL + 1))
      RESULTS+=("FAIL $brand")
    fi
  else
    if (cd "$dir" && npx wrangler deploy 2>&1); then
      echo -e "  ${GREEN}DEPLOYED${NC} $brand → staging"
      PASS=$((PASS + 1))
      RESULTS+=("PASS $brand → staging")
    else
      echo -e "  ${RED}FAILED${NC} $brand"
      FAIL=$((FAIL + 1))
      RESULTS+=("FAIL $brand")
    fi
  fi
  echo ""
done

# ── Summary ──────────────────────────────────────────────────────────
echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                  DEPLOY SUMMARY                     ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
for r in "${RESULTS[@]}"; do
  if [[ "$r" == PASS* ]]; then
    echo -e "  ${GREEN}✓${NC} ${r#PASS }"
  elif [[ "$r" == FAIL* ]]; then
    echo -e "  ${RED}✗${NC} ${r#FAIL }"
  else
    echo -e "  ${YELLOW}—${NC} ${r#SKIP }"
  fi
done
echo ""
echo -e "  Deployed: ${GREEN}$PASS${NC}  Failed: ${RED}$FAIL${NC}  Skipped: ${YELLOW}$SKIP${NC}"
echo ""

if [[ $FAIL -gt 0 ]]; then
  echo -e "${RED}Some deploys failed. Check output above.${NC}"
  exit 1
fi

echo -e "${GREEN}All deploys successful.${NC}"
