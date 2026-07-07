#!/usr/bin/env bash
set -euo pipefail

echo "EDGE CORE: validating canary execution order"
echo ""

# Rule: Route canaries are invalid unless a version-split gradual deployment
#       is already in place or explicitly introduced in the same change.

ROUTE_CANARY=false
VERSION_CANARY=false

# Detect route canary (routes pointing to canary/preview environments)
if grep -rq "routes.*canary\|env\.canary\|env\.preview\|name.*canary" wrangler.toml wrangler.jsonc 2>/dev/null; then
  ROUTE_CANARY=true
  echo "ℹ️  Route canary configuration detected"
fi

# Also check CI for route-based canary deployments
if grep -rq "deploy.*-e canary\|deploy.*-e preview\|wrangler deploy.*canary" .github/workflows/ scripts/canary*.sh 2>/dev/null; then
  ROUTE_CANARY=true
  echo "ℹ️  Route canary deployment detected in CI/scripts"
fi

# Detect version canary (gradual deployment primitives)
if grep -rq "versions deploy\|--percentage\|gradual\|traffic.split\|traffic_split" .github/workflows/ scripts/ 2>/dev/null; then
  VERSION_CANARY=true
  echo "ℹ️  Version canary (gradual deployment) detected"
fi

# Also check for explicit gradual rollout scripts
if [[ -f "scripts/gradual-rollout.sh" ]]; then
  VERSION_CANARY=true
  echo "ℹ️  Gradual rollout script present"
fi

echo ""

# ENFORCEMENT: Route canary without version canary is forbidden
if [[ "$ROUTE_CANARY" == "true" && "$VERSION_CANARY" != "true" ]]; then
  echo "════════════════════════════════════════════════════════════════"
  echo "  ❌ EDGE CORE VIOLATION: Route canary without version canary"
  echo "════════════════════════════════════════════════════════════════"
  echo ""
  echo "  You attempted to isolate traffic using route-level canaries"
  echo "  without first establishing a version-split gradual deployment."
  echo ""
  echo "  EDGE CORE execution order:"
  echo "    1. Observability"
  echo "    2. Version canary (gradual deployment)"
  echo "    3. Route canary (optional, for blast-radius control)"
  echo ""
  echo "  Route-only canaries bypass Cloudflare's primary progressive"
  echo "  delivery safety mechanism and are not allowed."
  echo ""
  echo "  Action required:"
  echo "    • Add a gradual version deployment first"
  echo "    • Or remove the route canary configuration"
  echo ""
  echo "  Reference: docs/NOIZY_EDGE_CORE.md § 2, § 3"
  echo "════════════════════════════════════════════════════════════════"
  exit 1
fi

# Valid states:
# - No canary at all (direct production deploy — allowed if budget healthy)
# - Version canary only (gradual deployment — preferred)
# - Version canary + Route canary (full progressive delivery — ideal)

if [[ "$VERSION_CANARY" == "true" && "$ROUTE_CANARY" == "true" ]]; then
  echo "✅ Full progressive delivery: version canary + route isolation"
elif [[ "$VERSION_CANARY" == "true" ]]; then
  echo "✅ Version canary active (gradual deployment)"
elif [[ "$ROUTE_CANARY" != "true" ]]; then
  echo "✅ Direct deployment (no canary) — ensure error budget is healthy"
fi

echo ""
echo "✅ EDGE CORE: canary execution order valid"
