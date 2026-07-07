#!/usr/bin/env bash
set -euo pipefail

# EDGE CORE: Zone Migration Readiness Gate
# This script BLOCKS zone migration until all prerequisites are satisfied
# Zone migration is the highest-risk operation — fail closed by design

echo "═══════════════════════════════════════════════════════════════════"
echo "EDGE CORE: Zone Migration Readiness Check"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

FAIL=0

require() {
  local var_name="$1"
  local description="$2"
  if [[ -z "${!var_name:-}" ]]; then
    echo "❌ BLOCKED: $description"
    echo "   → Set $var_name=yes to confirm"
    FAIL=1
  else
    echo "✅ $description"
  fi
}

echo "Checking preconditions..."
echo ""

# ═══════════════════════════════════════════════════════════════════
# REORDERED LOCK SEQUENCE (EDGE CORE aligned)
# Zone migration is LAST because it requires:
# - DNS recreation
# - SSL/TLS certificate reissue
# - DNSSEC disable/reenable
# ═══════════════════════════════════════════════════════════════════

echo "── Infrastructure Prerequisites ──"
require FEATURE_FLAGS_KV_READY "FEATURE_FLAGS KV namespace created"
require WORKER_DEPLOYED "Heaven Worker deployed and verified"
require ROUTE_BOUND "noizy.ai/* route bound to Worker"
require ROUTE_VERIFIED "Route tested and serving traffic"

echo ""
echo "── DNS & Certificate Prerequisites ──"
require DNS_EXPORT_SAVED "DNS records exported from source account"
require DNS_RECORDS_VERIFIED "DNS records verified against export"
require CERT_REISSUE_PLANNED "SSL/TLS certificate reissue plan confirmed"
require DNSSEC_PLAN_ACKNOWLEDGED "DNSSEC disable/reenable plan acknowledged"

echo ""
echo "── Operational Prerequisites ──"
require TARGET_ACCOUNT_READY "Target account (rsp@noizy.ai) access verified"
require ROLLBACK_PLAN_READY "Rollback plan documented and tested"

echo ""

if [[ "$FAIL" -eq 1 ]]; then
  cat <<'EOF'
═══════════════════════════════════════════════════════════════════
❌ EDGE CORE VIOLATION: Zone migration is BLOCKED
═══════════════════════════════════════════════════════════════════

Zone migration is the highest-risk, least-reversible operation.

Per Cloudflare documentation, moving a domain between accounts requires:
  • Export and manually recreate DNS records
  • Copy zone settings (SSL, page rules, firewall)
  • Reissue SSL/TLS certificates
  • Disable and re-enable DNSSEC

This check fails closed by design.

REORDERED LOCK SEQUENCE (required order):
  1. Create FEATURE_FLAGS KV           ← safe, no traffic
  2. Bind FEATURE_FLAGS in Wrangler    ← config only
  3. Deploy heaven Worker              ← no routes = zero blast radius
  4. Add noizy.ai/* route              ← controlled traffic flow
  5. Verify route + flag access        ← confirm before DNS changes
  6. Prepare zone migration            ← export DNS, plan certs
  7. Move zone LAST                    ← only after all above confirmed

To proceed, set ALL required environment variables:

  FEATURE_FLAGS_KV_READY=yes \
  WORKER_DEPLOYED=yes \
  ROUTE_BOUND=yes \
  ROUTE_VERIFIED=yes \
  DNS_EXPORT_SAVED=yes \
  DNS_RECORDS_VERIFIED=yes \
  CERT_REISSUE_PLANNED=yes \
  DNSSEC_PLAN_ACKNOWLEDGED=yes \
  TARGET_ACCOUNT_READY=yes \
  ROLLBACK_PLAN_READY=yes \
  ./scripts/edge-core/check-zone-migration-readiness.sh

═══════════════════════════════════════════════════════════════════
EOF
  exit 1
fi

cat <<'EOF'
═══════════════════════════════════════════════════════════════════
✅ EDGE CORE: Zone migration prerequisites SATISFIED
═══════════════════════════════════════════════════════════════════

All preconditions verified. You may now proceed with zone migration.

PROCEED WITH CAUTION:
  • This operation affects live traffic
  • DNS propagation takes time (TTL dependent)
  • Certificate reissue may cause brief TLS errors
  • DNSSEC changes require registrar coordination

Recommended: Perform during low-traffic window.

═══════════════════════════════════════════════════════════════════
EOF
