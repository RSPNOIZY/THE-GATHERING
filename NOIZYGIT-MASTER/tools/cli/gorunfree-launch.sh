#!/usr/bin/env bash
set -euo pipefail

# GORUNFREE Launch Script
# Executes the full launch sequence with safety checks
# Usage: ./scripts/gorunfree-launch.sh [stage]
# Stages: prepare, deploy, promote, verify, all

STAGE="${1:-all}"

echo "═══════════════════════════════════════════════════════════════════"
echo "  GORUNFREE LAUNCH SEQUENCE"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "  Core Rule: Lock config first. Lock runtime second."
echo "             Lock routing third. Expand traffic gradually."
echo ""
echo "  Stage: $STAGE"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Check we're in the right directory
if [[ ! -f "wrangler.toml" ]]; then
  echo "❌ Must run from NOIZYANTHROPIC root (wrangler.toml not found)"
  exit 1
fi

# ═══════════════════════════════════════════════════════════════════════════
# Stage 0: Prepare
# ═══════════════════════════════════════════════════════════════════════════

prepare() {
  echo "─────────────────────────────────────────────────────────────────────"
  echo "  STAGE 0: PREPARE"
  echo "─────────────────────────────────────────────────────────────────────"
  echo ""

  # Check EDGE CORE compliance
  echo "→ Running EDGE CORE checks..."
  if [[ -f "scripts/edge-core/check-all.sh" ]]; then
    chmod +x scripts/edge-core/check-all.sh
    ./scripts/edge-core/check-all.sh || {
      echo "❌ EDGE CORE checks failed. Cannot proceed."
      exit 1
    }
  else
    echo "⚠️  EDGE CORE check script not found, skipping..."
  fi

  # Check wrangler is available
  echo ""
  echo "→ Checking wrangler..."
  if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Install Node.js first."
    exit 1
  fi

  # Check wrangler auth
  echo ""
  echo "→ Checking wrangler authentication..."
  npx wrangler whoami || {
    echo ""
    echo "❌ Not logged in to Cloudflare. Run: npx wrangler login"
    exit 1
  }

  # Create KV namespaces if needed
  echo ""
  echo "→ Ensuring KV namespaces exist..."

  # Check if FEATURE_FLAGS exists
  if ! npx wrangler kv namespace list 2>/dev/null | grep -q "FEATURE_FLAGS"; then
    echo "  Creating FEATURE_FLAGS namespace..."
    npx wrangler kv namespace create FEATURE_FLAGS || true
    npx wrangler kv namespace create FEATURE_FLAGS --preview || true
  else
    echo "  ✓ FEATURE_FLAGS exists"
  fi

  # Check if GAP_SOLVER exists
  if ! npx wrangler kv namespace list 2>/dev/null | grep -q "GAP_SOLVER"; then
    echo "  Creating GAP_SOLVER namespace..."
    npx wrangler kv namespace create GAP_SOLVER || true
    npx wrangler kv namespace create GAP_SOLVER --preview || true
  else
    echo "  ✓ GAP_SOLVER exists"
  fi

  # Run D1 migrations
  echo ""
  echo "→ Running D1 migrations..."
  if [[ -f "migrations/gorunfree_schema.sql" ]]; then
    npx wrangler d1 execute gabriel_db --remote --file migrations/gorunfree_schema.sql || {
      echo "⚠️  D1 migration had issues (may already exist)"
    }
  else
    echo "⚠️  Migration file not found at migrations/gorunfree_schema.sql"
  fi

  echo ""
  echo "✅ PREPARE stage complete"
}

# ═══════════════════════════════════════════════════════════════════════════
# Stage 1: Deploy
# ═══════════════════════════════════════════════════════════════════════════

deploy() {
  echo ""
  echo "─────────────────────────────────────────────────────────────────────"
  echo "  STAGE 1: DEPLOY"
  echo "─────────────────────────────────────────────────────────────────────"
  echo ""

  # Seed launch flags
  echo "→ Seeding launch flags..."
  npx wrangler kv key put --binding FEATURE_FLAGS gorunfree_ui on 2>/dev/null || echo "  (flag may already exist)"
  npx wrangler kv key put --binding FEATURE_FLAGS provenance_power on 2>/dev/null || echo "  (flag may already exist)"
  npx wrangler kv key put --binding GAP_SOLVER gap_mode on 2>/dev/null || echo "  (flag may already exist)"

  # Deploy worker
  echo ""
  echo "→ Deploying Worker..."
  npx wrangler deploy

  echo ""
  echo "✅ DEPLOY stage complete"
}

# ═══════════════════════════════════════════════════════════════════════════
# Stage 2: Verify
# ═══════════════════════════════════════════════════════════════════════════

verify() {
  echo ""
  echo "─────────────────────────────────────────────────────────────────────"
  echo "  STAGE 2: VERIFY"
  echo "─────────────────────────────────────────────────────────────────────"
  echo ""

  BASE_URL="https://heaven.rsp-5f3.workers.dev"

  echo "→ Health check..."
  HEALTH=$(curl -sf "${BASE_URL}/health" 2>&1) && {
    echo "  ✓ Health: OK"
    echo "$HEALTH" | head -c 200
  } || {
    echo "  ❌ Health check failed"
  }

  echo ""
  echo "→ Testing preflight endpoint..."
  PREFLIGHT=$(curl -sf "${BASE_URL}/preflight?intent=90s+R%26B+female" 2>&1) && {
    echo "  ✓ Preflight: OK"
  } || {
    echo "  ❌ Preflight endpoint failed (may not be wired yet)"
  }

  echo ""
  echo "→ Testing absence/gaps endpoint..."
  GAPS=$(curl -sf "${BASE_URL}/absence/gaps" 2>&1) && {
    echo "  ✓ Absence gaps: OK"
  } || {
    echo "  ❌ Absence gaps endpoint failed (may not be wired yet)"
  }

  echo ""
  echo "→ Testing status endpoint..."
  STATUS=$(curl -sf "${BASE_URL}/status" 2>&1) && {
    echo "  ✓ Status: OK"
    echo "$STATUS" | head -c 200
  } || {
    echo "  ❌ Status endpoint failed"
  }

  echo ""
  echo "✅ VERIFY stage complete"
}

# ═══════════════════════════════════════════════════════════════════════════
# Stage 3: Promote (Manual guidance)
# ═══════════════════════════════════════════════════════════════════════════

promote() {
  echo ""
  echo "─────────────────────────────────────────────────────────────────────"
  echo "  STAGE 3: GRADUAL PROMOTION"
  echo "─────────────────────────────────────────────────────────────────────"
  echo ""
  echo "  Gradual promotion must be done manually with verification at each step."
  echo ""
  echo "  Recommended progression:"
  echo "    1. 1%   - observe for 30 minutes"
  echo "    2. 5%   - observe for 30 minutes"
  echo "    3. 10%  - observe for 1 hour"
  echo "    4. 25%  - observe for 1 hour"
  echo "    5. 50%  - observe for 2 hours"
  echo "    6. 100% - continuous monitoring"
  echo ""
  echo "  Commands:"
  echo "    npx wrangler versions deploy  # Select version and percentage"
  echo ""
  echo "  At each step, verify:"
  echo "    - Request volume"
  echo "    - Success rate"
  echo "    - Error rate"
  echo "    - Latency"
  echo ""
  echo "  Rollback if:"
  echo "    - Error rate spikes"
  echo "    - Exceptions increase"
  echo "    - Latency degrades significantly"
  echo ""
}

# ═══════════════════════════════════════════════════════════════════════════
# Execute
# ═══════════════════════════════════════════════════════════════════════════

case "$STAGE" in
  prepare)
    prepare
    ;;
  deploy)
    deploy
    ;;
  verify)
    verify
    ;;
  promote)
    promote
    ;;
  all)
    prepare
    deploy
    verify
    promote
    ;;
  *)
    echo "Unknown stage: $STAGE"
    echo "Usage: $0 [prepare|deploy|verify|promote|all]"
    exit 1
    ;;
esac

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  GORUNFREE: Creators run free because the system carries the weight."
echo "═══════════════════════════════════════════════════════════════════"
