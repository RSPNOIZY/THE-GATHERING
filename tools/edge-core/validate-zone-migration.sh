#!/usr/bin/env bash
set -euo pipefail

# EDGE CORE: Pre-Migration Validation Script
# Run this BEFORE touching Cloudflare accounts
# Human-confirmable, machine-checked safety harness

echo "═══════════════════════════════════════════════════════════════════"
echo "EDGE CORE: Pre-Migration Validation"
echo "noizy.ai → rsp@noizy.ai (5f36aa9795348ea681d0b21910dfc82a)"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

FAIL=0

check() {
  local description="$1"
  local var_name="$2"
  local value="${!var_name:-no}"

  if [[ "$value" != "yes" ]]; then
    echo "❌ $description"
    echo "   → Set $var_name=yes to confirm"
    FAIL=1
  else
    echo "✅ $description"
  fi
}

echo "── DNS Validation ──"
check "DNS records exported to file" DNS_EXPORTED
check "DNS records count verified (expected: ~15-25 records)" DNS_COUNT_VERIFIED
check "Critical records identified (A, CNAME, MX, TXT)" CRITICAL_RECORDS_IDENTIFIED

echo ""
echo "── Zone Settings Validation ──"
check "SSL/TLS mode documented (Full Strict recommended)" SSL_MODE_DOCUMENTED
check "Page Rules exported" PAGE_RULES_EXPORTED
check "Firewall rules exported" FIREWALL_RULES_EXPORTED
check "Worker routes documented" WORKER_ROUTES_DOCUMENTED

echo ""
echo "── Certificate Validation ──"
check "Current certificate expiry noted" CERT_EXPIRY_NOTED
check "Certificate reissue plan prepared" CERT_PLAN_READY
check "Universal SSL understood (auto-reissue on new account)" UNIVERSAL_SSL_UNDERSTOOD

echo ""
echo "── DNSSEC Validation ──"
check "Current DNSSEC status documented" DNSSEC_STATUS_DOCUMENTED
check "DNSSEC disable/reenable plan ready" DNSSEC_PLAN_READY
check "Registrar DS record update plan ready" DS_RECORD_PLAN_READY

echo ""
echo "── Target Account Validation ──"
check "Target account access verified (rsp@noizy.ai)" TARGET_ACCOUNT_READY
check "Target account billing active" TARGET_BILLING_ACTIVE
check "Target account plan sufficient (Free/Pro/Business)" TARGET_PLAN_SUFFICIENT

echo ""
echo "── Rollback Validation ──"
check "Rollback procedure documented" ROLLBACK_DOCUMENTED
check "Old account access retained (temporary)" OLD_ACCOUNT_ACCESS_RETAINED
check "DNS backup stored in version control" DNS_BACKUP_IN_VCS

echo ""

if [[ "$FAIL" -eq 1 ]]; then
  cat <<'EOF'
═══════════════════════════════════════════════════════════════════
❌ PRE-MIGRATION VALIDATION FAILED
═══════════════════════════════════════════════════════════════════

One or more validation checks failed.

Per Cloudflare documentation, zone migration requires:
  • DNS records must be manually recreated
  • SSL/TLS certificates must be reissued
  • DNSSEC must be disabled then re-enabled
  • Settings are NOT automatically transferred

DO NOT PROCEED until all checks pass.

Example invocation with all flags:

  DNS_EXPORTED=yes \
  DNS_COUNT_VERIFIED=yes \
  CRITICAL_RECORDS_IDENTIFIED=yes \
  SSL_MODE_DOCUMENTED=yes \
  PAGE_RULES_EXPORTED=yes \
  FIREWALL_RULES_EXPORTED=yes \
  WORKER_ROUTES_DOCUMENTED=yes \
  CERT_EXPIRY_NOTED=yes \
  CERT_PLAN_READY=yes \
  UNIVERSAL_SSL_UNDERSTOOD=yes \
  DNSSEC_STATUS_DOCUMENTED=yes \
  DNSSEC_PLAN_READY=yes \
  DS_RECORD_PLAN_READY=yes \
  TARGET_ACCOUNT_READY=yes \
  TARGET_BILLING_ACTIVE=yes \
  TARGET_PLAN_SUFFICIENT=yes \
  ROLLBACK_DOCUMENTED=yes \
  OLD_ACCOUNT_ACCESS_RETAINED=yes \
  DNS_BACKUP_IN_VCS=yes \
  ./scripts/edge-core/validate-zone-migration.sh

═══════════════════════════════════════════════════════════════════
EOF
  exit 1
fi

cat <<'EOF'
═══════════════════════════════════════════════════════════════════
✅ PRE-MIGRATION VALIDATION PASSED
═══════════════════════════════════════════════════════════════════

All pre-migration checks confirmed.

You may now proceed with noizy.ai zone migration:

MIGRATION STEPS:
  1. Log into source Cloudflare account
  2. Go to noizy.ai zone → Overview
  3. Click "Remove Site from Cloudflare" (or initiate transfer)
  4. Log into target account (rsp@noizy.ai)
  5. Add noizy.ai as new zone
  6. Import DNS records from backup
  7. Verify SSL/TLS certificate issuance
  8. Update nameservers at registrar if needed
  9. Re-enable DNSSEC if previously active
  10. Verify Worker routes are active

POST-MIGRATION VERIFICATION:
  curl -I https://noizy.ai/health
  curl https://heaven.rsp-5f3.workers.dev/status

═══════════════════════════════════════════════════════════════════
EOF
