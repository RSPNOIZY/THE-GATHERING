# NOIZY Disaster Recovery Playbook

## Cross-Account DR Architecture

NOIZY uses a **read-only mirror** strategy for disaster recovery. This satisfies audit requirements and ensures recovery capability without risking accidental writes to production.

### Architecture

```
┌─────────────────────────────────────┐
│  PRIMARY: rsp@noizy.ai (NOIZY.AI)   │
│  Account ID: 5f36aa97...            │
│  ─────────────────────────────────  │
│  ✓ Full read/write access           │
│  ✓ All Workers deployed here        │
│  ✓ All KV/D1/R2 bindings            │
│  ✓ DNS + domain routing             │
└─────────────────────────────────────┘
            │
            │ Read-Only Mirror
            ▼
┌─────────────────────────────────────┐
│  DR MIRROR: (Secondary Account)     │
│  Role: Workers Platform (Read-only) │
│  ─────────────────────────────────  │
│  ✓ View deployments & versions      │
│  ✓ View KV keys (not values)        │
│  ✓ View routes & config             │
│  ✗ Cannot deploy or modify          │
└─────────────────────────────────────┘
```

## What Gets Mirrored

| Asset | Location | Mirroring Method |
|-------|----------|------------------|
| `wrangler.toml` | Git repo | Git push to DR repo |
| Worker code | Git repo | Git push to DR repo |
| KV Namespaces | CF Dashboard | Manual snapshot export |
| D1 Database | CF Dashboard | Export SQL, store encrypted |
| Feature Flags | FEATURE_FLAGS KV | Replicate to DR KV |
| Secrets | NOT MIRRORED | Re-enter on recovery |

## Setup Steps (One-Time)

### 1. Create DR Account Member

In Cloudflare Dashboard → Members → Invite:
- Email: `dr-monitor@noizy.ai` (or dedicated DR email)
- Role: **Workers Platform (Read-only)**
- Scope: All zones

### 2. Mirror Git Repository

```bash
# Primary repo has remote 'origin'
# Add DR remote
git remote add dr git@github.com:rspnoizy/noizy-heaven-dr.git
git push dr main
```

### 3. Export KV Snapshot

```bash
# Export all feature flags
npx wrangler kv:key list --namespace-id=FEATURE_FLAGS_ID > kv-snapshot.json

# Store encrypted
gpg --encrypt --recipient rsp@noizy.ai kv-snapshot.json
```

### 4. Export D1 Database

```bash
# Full database export
npx wrangler d1 export gabriel_db --remote > gabriel_db_backup.sql

# Encrypt and store
gpg --encrypt --recipient rsp@noizy.ai gabriel_db_backup.sql
```

## DR Drill Procedure

Run monthly to verify recovery capability.

### Pre-Drill Checklist

- [ ] DR account credentials accessible
- [ ] Latest code mirrored to DR repo
- [ ] KV snapshot < 7 days old
- [ ] D1 backup < 7 days old
- [ ] Secrets documented (encrypted, offline)

### Drill Steps

```bash
# 1. Verify DR account access
export CLOUDFLARE_ACCOUNT_ID=<DR_ACCOUNT_ID>
export CLOUDFLARE_API_TOKEN=<DR_READ_ONLY_TOKEN>

# 2. List deployments (should see mirror)
npx wrangler deployments list

# 3. Verify routes visible
npx wrangler routes list

# 4. Verify KV visible
npx wrangler kv:namespace list

# 5. Log drill result
echo "$(date): DR drill passed" >> /var/log/noizy-dr-drills.log
```

### Drill Frequency

| Type | Frequency | Owner |
|------|-----------|-------|
| Access verification | Weekly | Automated |
| Full drill | Monthly | RSP_001 |
| Tabletop exercise | Quarterly | RSP_001 |

## Recovery Procedures

### Scenario 1: Primary Worker Corrupted

**Symptoms**: 500 errors, consent failures, data corruption

**Recovery**:
```bash
# 1. Immediate rollback
npx wrangler rollback --message "Emergency: corruption detected"

# 2. If rollback fails, deploy from known-good commit
git checkout <last-known-good-sha>
npx wrangler deploy
```

### Scenario 2: Primary Account Locked

**Symptoms**: Cannot access CF dashboard, API returns 403

**Recovery**:
1. Contact Cloudflare support with account ownership proof
2. While waiting, prepare DR deployment
3. Update DNS to point to DR Worker once deployed

### Scenario 3: KV Data Loss

**Symptoms**: Feature flags returning fallbacks, missing config

**Recovery**:
```bash
# 1. Restore from snapshot
cat kv-snapshot.json | jq -c '.[]' | while read item; do
  key=$(echo $item | jq -r '.name')
  # Fetch value and restore
  npx wrangler kv:key put --namespace-id=FEATURE_FLAGS_ID "$key" "..."
done
```

### Scenario 4: D1 Database Corruption

**Symptoms**: Consent queries failing, actor data missing

**Recovery**:
```bash
# 1. Create fresh database
npx wrangler d1 create gabriel_db_recovered

# 2. Import backup
npx wrangler d1 execute gabriel_db_recovered --remote --file gabriel_db_backup.sql

# 3. Update wrangler.toml with new database_id
# 4. Redeploy
npx wrangler deploy
```

## Recovery Time Objectives (RTO)

| Scenario | Target RTO | Notes |
|----------|------------|-------|
| Worker rollback | < 5 min | Automated |
| Worker redeploy | < 15 min | Git-based |
| KV restore | < 30 min | From snapshot |
| D1 restore | < 1 hour | From SQL backup |
| Full account recovery | < 4 hours | Requires CF support |

## Contact Tree

| Role | Contact | Escalation |
|------|---------|------------|
| Primary | RSP_001 (rsp@noizy.ai) | - |
| Cloudflare Support | support@cloudflare.com | Enterprise: TAM |
| GitHub Support | support@github.com | - |

## Post-Incident

After any DR event:
1. Document timeline in incident log
2. Update runbook with lessons learned
3. Review and improve RTO if exceeded
4. Schedule post-mortem within 48 hours

---

*Last Updated: 2026-04-07*
*Owner: RSP_001*
*Review Cycle: Quarterly*
