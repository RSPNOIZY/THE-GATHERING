# Zone Migration Runbook: noizy.ai → rsp@noizy.ai

## Overview

This runbook documents the EDGE CORE-aligned procedure for migrating the `noizy.ai` zone from the legacy Cloudflare account to the canonical account (`rsp@noizy.ai` / `5f36aa9795348ea681d0b21910dfc82a`).

**Zone migration is the highest-risk, least-reversible operation.** Per EDGE CORE doctrine, we do the reversible things first and the irreversible thing last.

---

## REORDERED LOCK SEQUENCE (ENFORCED)

```
1. Create FEATURE_FLAGS KV            ← safe, no traffic
2. Bind FEATURE_FLAGS in Wrangler     ← config only
3. Deploy heaven Worker               ← no routes = zero blast radius
4. Add noizy.ai/* route               ← controlled traffic flow
5. Verify route + flag access         ← confirm before DNS changes
6. Run validate-zone-migration.sh     ← human checklist
7. Pass CI zone-migration gate        ← machine enforcement
8. Migrate noizy.ai zone              ← LAST (irreversible)
```

---

## Pre-Migration: Cloudflare Reality

Per [Cloudflare documentation](https://developers.cloudflare.com/fundamentals/manage-domains/move-domain/), moving a domain between accounts requires:

- **Export and manually recreate DNS records**
- **Copy zone settings** (SSL, page rules, firewall)
- **Reissue SSL/TLS certificates**
- **Disable and re-enable DNSSEC**

This is NOT a nameserver-preserved, instant operation.

---

## Step 1: Create FEATURE_FLAGS KV

```bash
# Authenticate to canonical account
npx wrangler login

# Create KV namespace
npx wrangler kv namespace create FEATURE_FLAGS
npx wrangler kv namespace create FEATURE_FLAGS --preview

# Note the returned IDs and update wrangler.toml
```

**Verification:**
```bash
npx wrangler kv namespace list | grep FEATURE_FLAGS
```

---

## Step 2: Bind FEATURE_FLAGS in Wrangler

Update `/Users/m2ultra/NOIZYANTHROPIC/wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "FEATURE_FLAGS"
id = "YOUR_PROD_ID_HERE"
preview_id = "YOUR_PREVIEW_ID_HERE"
```

---

## Step 3: Deploy Heaven Worker

```bash
cd /Users/m2ultra/NOIZYANTHROPIC
npx wrangler deploy
```

**Verification:**
```bash
curl https://heaven.rsp-5f3.workers.dev/health
curl https://heaven.rsp-5f3.workers.dev/status
```

---

## Step 4: Add Route (Dashboard Method)

1. Log into Cloudflare Dashboard
2. Go to Workers & Pages → `heaven`
3. Settings → Domains & Routes
4. Click "Add Route"
5. Pattern: `noizy.ai/*`
6. Zone: `noizy.ai` (must be on same account)

**Note:** Route cannot be added until zone is migrated. This step happens AFTER zone migration in practice, but we plan it here.

---

## Step 5: Verify Route + Flags

```bash
# After route is active:
curl -I https://noizy.ai/
curl https://noizy.ai/health
curl https://noizy.ai/status
```

---

## Step 6: Run Pre-Migration Validation

```bash
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
```

---

## Step 7: Pass CI Zone Migration Gate

Trigger the GitHub Actions workflow:

1. Go to Actions → "Zone Migration Readiness"
2. Click "Run workflow"
3. Type exactly: `MIGRATE NOIZY.AI`
4. Check all prerequisite boxes
5. Submit

The workflow will:
- Validate your intent
- Run all prerequisite checks
- Generate a GitHub Issue with the migration checklist

---

## Step 8: Execute Zone Migration

### Source Account (legacy)

1. Log into source Cloudflare account
2. Go to `noizy.ai` zone → Overview
3. Export DNS records: DNS → Export DNS Records
4. Save the BIND file to version control
5. Document current settings:
   - SSL/TLS mode
   - Page Rules
   - Firewall Rules
   - Worker Routes
6. Note DNSSEC status (DS record at registrar)
7. Remove site from Cloudflare (or initiate transfer)

### Target Account (rsp@noizy.ai)

1. Log into target account
2. Add Site → `noizy.ai`
3. Select plan (Free is fine for now)
4. Import DNS records from BIND file
5. Configure SSL/TLS: Full (Strict)
6. Recreate any Page Rules
7. Recreate any Firewall Rules
8. Add Worker route: `noizy.ai/*` → `heaven`

### Registrar (if nameservers change)

1. Log into domain registrar
2. Update nameservers to new Cloudflare values
3. Wait for propagation (up to 48 hours, usually faster)

### DNSSEC (if previously enabled)

1. Remove old DS record from registrar
2. Wait for propagation
3. Enable DNSSEC in new Cloudflare account
4. Add new DS record at registrar
5. Verify DNSSEC status

---

## Post-Migration Verification

```bash
# Basic connectivity
curl -I https://noizy.ai/

# Health check
curl https://noizy.ai/health

# Full status
curl https://noizy.ai/status

# SSL certificate check
echo | openssl s_client -connect noizy.ai:443 2>/dev/null | openssl x509 -noout -dates

# DNS propagation check
dig noizy.ai +short
dig noizy.ai NS +short
```

---

## Rollback Procedure

If migration fails:

1. **Do NOT delete DNS backup**
2. Remove zone from target account
3. Re-add zone to source account
4. Import DNS from backup
5. Restore settings from documentation
6. Update nameservers back (if changed)
7. Document incident in postmortem

---

## Risk Matrix

| Risk | Mitigation |
|------|------------|
| DNS records lost | BIND export saved to VCS |
| SSL certificate not issued | Universal SSL auto-issues; monitor |
| DNSSEC broken | Explicit plan, staged approach |
| Route not working | Test before removing old account access |
| Settings lost | Documentation in this runbook |

---

## Success Criteria

- [ ] `curl https://noizy.ai/` returns 200
- [ ] `curl https://noizy.ai/health` returns healthy JSON
- [ ] SSL certificate valid (check expiry)
- [ ] DNSSEC validates (if enabled)
- [ ] Worker routes active
- [ ] Error rates normal for 1 hour
- [ ] Documentation updated

---

## References

- [Cloudflare: Move a domain between accounts](https://developers.cloudflare.com/fundamentals/manage-domains/move-domain/)
- [EDGE CORE Promotion Policy](./EDGE_CORE_PROMOTION_POLICY.md)
- [DR Playbook](./DR-PLAYBOOK.md)
- [NOIZY Domain Migration Guide](./NOIZY_DOMAIN_MIGRATION.md)

---

*This runbook is EDGE CORE compliant. Zone migration is the last step because it is the least reversible.*
