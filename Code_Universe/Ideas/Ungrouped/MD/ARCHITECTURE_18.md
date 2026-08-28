# NOIZYWORLD Architecture & Decision Rules

> **Final Rule:** Use Firebase only as a bridge. Use FOSS for sovereignty. Use MC96 receipts as law.

## Authority Hierarchy

```
MC96 / Postgres (Source of truth)
  ↓ [server-side replication]
Supabase (FOSS public backend)
  ↓ [app SDK]
Client Apps
  ↓ [fallback]
PocketBase (field/offline)
  ↓ [sync on reconnect]
Firebase (optional bridge)
```

### Principle

**Authority flows downward only.** Writes flow upward only (via explicit APIs). No lateral data movement.

- **MC96:** Source of truth for receipts, users, permissions
- **Supabase:** Public APIs, real-time coordination, app backend
- **PocketBase:** Offline-first field nodes, local sync
- **Firebase:** Optional read-only mirror for legacy clients

---

## Data Ownership Rules

### 1. Receipts (immutable records)

| Layer | Role | Authority | Write? |
|-------|------|-----------|--------|
| **MC96** | Source | ✅ Authority | Yes (initial creation) |
| **Supabase** | Mirror | — | No (server replication) |
| **PocketBase** | Mirror | — | No (server replication) |
| **Firebase** | Bridge | — | No (read-only) |

**Rule:** Clients never write receipts. All receipt creation goes through MC96 only.

### 2. User profiles & permissions

| Layer | Role | Authority | Write? |
|-------|------|-----------|--------|
| **MC96** | Source | ✅ Authority | Yes |
| **Supabase** | Cache | — | No |
| **PocketBase** | Cache | — | No |
| **Firebase** | Bridge | — | No |

**Rule:** User permissions managed in MC96. Cached in Supabase for app performance. Never update permissions in client-facing layers.

### 3. Approvals (client-initiated workflows)

| Layer | Role | Authority | Write? |
|-------|------|-----------|--------|
| **MC96** | Decisions | ✅ Authority | Yes (approval/rejection) |
| **Supabase** | Intake | Semi | Yes (client creates request) |
| **PocketBase** | Local | Semi | Yes (field creates request) |
| **Firebase** | Bridge | — | Yes (if client creates) |

**Rule:** Clients can create approval *requests* only. Server processes and marks as approved/rejected. No client updates after creation.

### 4. Assets (file references)

| Layer | Role | Authority | Write? |
|-------|------|-----------|--------|
| **MC96** | Metadata | ✅ Authority | Yes |
| **Supabase** | Inventory | — | No |
| **PocketBase** | Local | — | No |
| **Firebase** | Bridge | — | No |
| **Cloud Storage** | Files | — | No (signed URLs only) |

**Rule:** Clients upload files via signed URLs. Server validates, creates asset record in MC96. Metadata replicates to Supabase/Firebase.

---

## Technology Stack Decision Rules

### When to use Supabase

✅ **Use Supabase when:**
- You need SQL queries on relational data (receipts, lineage, audit logs)
- You want FOSS sovereignty (can self-host)
- You're building production public/private APIs
- You need real-time coordination for multi-client scenarios
- You want Row-Level Security (SQL-based authorization)

❌ **Don't use Supabase when:**
- You only have 1-2 simple document types (use PocketBase)
- You need JavaScript-only deployment (use Firebase or Appwrite)

### When to use PocketBase

✅ **Use PocketBase when:**
- You're building field/offline-first nodes
- You need a single binary with no DevOps overhead
- You're embedding in embedded systems or edge devices
- You want minimal operational footprint
- Sync back to central authority on reconnection

❌ **Don't use PocketBase when:**
- You need enterprise features (multi-region replication, backups)
- You need Postgres-specific features (JSON, full-text search)
- You have >1M records locally (SQLite scale limits)

### When to use Appwrite

✅ **Use Appwrite when:**
- You want all-in-one backend (auth, DB, storage, functions, messaging)
- You need email/SMS/push notifications
- You prefer Docker/Kubernetes deployments
- You have a medium-to-large team managing infrastructure

❌ **Don't use Appwrite when:**
- You need strict relational SQL semantics (use Supabase + Postgres)
- You want absolute simplicity (use PocketBase)

### When to use Firebase

✅ **Use Firebase only when:**
- You're bridging legacy clients that already use Firebase
- You need Google-managed infrastructure with SLA guarantees
- You're in a scenario where operational cost matters more than sovereignty

❌ **Don't use Firebase as primary when:**
- You need source-of-truth authority (Firestore is never truth)
- You need SQL queries (use Supabase)
- You want to avoid vendor lock-in (use FOSS)

---

## Security Rules Summary

### Firestore Security Rules (if using Firebase bridge)

**Default:** `allow read, write: if false` (closed)

**Exceptions:**
- `/receipts`: Read by authenticated operators; write-protected
- `/assets`: Read by authenticated operators; write-protected
- `/lineage`: Append-only audit log; read by operators; server-written
- `/approvals`: Client creates for self; server processes

**Key principle:** No financial data is client-writable. Only approval requests (self-only).

### Supabase Row-Level Security (SQL-based)

```sql
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "operators_read_receipts" ON receipts
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "server_inserts_receipts" ON receipts
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "no_receipt_deletes" ON receipts
  FOR DELETE USING (FALSE);
```

### Firebase MCP Configuration (hardened)

```json
{
  "firebase": {
    "command": "npx",
    "args": [
      "-y",
      "firebase-tools@latest",
      "mcp",
      "--dir",
      "${FIREBASE_PROJECT_DIR}",
      "--only",
      "firestore,storage"
    ]
  }
}
```

**Hardening principles:**
- ✅ Include: `firestore,storage`
- ❌ Exclude: `auth` (server-side only)
- ❌ Exclude: `database` (RTDB deprecated)
- ❌ Exclude: `functions` (CI/CD only)

---

## Deployment Checklist

### Before production

- [ ] MC96 is running with backups enabled
- [ ] Supabase replication service is running (if using)
- [ ] PocketBase field nodes are distributed (if using)
- [ ] Firestore Security Rules are deployed (if using Firebase bridge)
- [ ] MCP credentials don't include `auth` service
- [ ] All services have monitoring/alerting
- [ ] Disaster recovery plan is documented

### Authentication & Authorization

- [ ] MC96 is source of truth for users/roles
- [ ] Supabase RLS policies enforce MC96 permissions
- [ ] PocketBase caches user permissions from MC96
- [ ] Firebase rules don't contradict MC96 authority
- [ ] No credentials are stored in client-facing code
- [ ] Service account keys are rotated regularly

### Data integrity

- [ ] Receipts are immutable (no updates after creation)
- [ ] Approvals can only be created by requestor for self
- [ ] Assets are server-validated before metadata stored
- [ ] Lineage is append-only audit trail
- [ ] All writes flow through MC96 API (never direct client writes)

### Monitoring & Alerting

- [ ] MC96 database size is monitored
- [ ] Replication lag (MC96 → Supabase → Firestore) is tracked
- [ ] PocketBase sync success rate is monitored
- [ ] Firestore quota usage is tracked
- [ ] Authentication failures are logged
- [ ] Unauthorized access attempts are alerted

---

## Migration Runbook: Firebase → Supabase

### Timeline: 4–8 weeks

**Week 1-2: Setup**
- [ ] Provision Supabase project (cloud or self-hosted)
- [ ] Create Postgres tables matching Firestore schema
- [ ] Configure authentication (JWT)
- [ ] Enable Row-Level Security policies

**Week 2-3: Data migration**
- [ ] Export Firestore data to CSV
- [ ] Validate CSV schema
- [ ] Import to Supabase Postgres
- [ ] Verify record counts and key records

**Week 3-4: Application migration**
- [ ] Update client app SDK (Firebase → Supabase)
- [ ] Test query patterns (Firestore → PostgreSQL)
- [ ] Test real-time subscriptions
- [ ] Test offline scenarios (PocketBase if used)

**Week 4-5: Parallel run**
- [ ] Run both Firebase and Supabase simultaneously
- [ ] All new writes → MC96 → Supabase → Firebase (mirror)
- [ ] Monitor data consistency
- [ ] Validate client functionality

**Week 5-6: Cutover**
- [ ] Update client default endpoint to Supabase
- [ ] Keep Firebase in read-only mode as fallback
- [ ] Monitor error rates and performance
- [ ] Document any issues

**Week 6-8: Optimization & cleanup**
- [ ] Remove Firebase SDK from clients (if no legacy users)
- [ ] Optimize Supabase indexes and caches
- [ ] Archive old Firebase data
- [ ] Update documentation

---

## Cost Comparison (approximate)

| Service | Free tier | Scaling | Notes |
|---------|-----------|---------|-------|
| **Supabase Cloud** | 500 MB DB, 2GB file storage | $25/mo → $100+/mo | Auto-scaling, managed backups |
| **Supabase Self-hosted** | Unlimited (your infra) | Your cost | Full control, FOSS |
| **PocketBase Cloud** | N/A (single binary) | Minimal | Deploy anywhere (~5-10MB memory) |
| **Firebase** | 1 GB storage, 50k reads/day | $1-2/GB | Google-managed, easier scaling |
| **Appwrite Cloud** | 5 GB storage, 10M API calls/mo | Pay-as-you-go | All-in-one |

**Recommendation:** Start with Supabase Cloud ($25/mo) + PocketBase (free). Migrate to self-hosted Supabase as usage grows.

---

## References

- [FIREBASE_ARCHITECTURE.md](./FIREBASE_ARCHITECTURE.md) — Firebase integration details
- [FOSS_ALTERNATIVES.md](./FOSS_ALTERNATIVES.md) — FOSS comparison and setup guides
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Supabase Docs](https://supabase.com/docs)
- [PocketBase Docs](https://pocketbase.io/docs/)
- [Appwrite Docs](https://appwrite.io/docs)

---

_Last updated: 2026-07-08_
