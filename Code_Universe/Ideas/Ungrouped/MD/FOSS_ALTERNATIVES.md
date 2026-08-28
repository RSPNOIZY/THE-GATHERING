# FOSS Alternatives to Firebase: Architecture & Migration Paths

> **Final Rule:** Use Firebase only as a bridge. Use FOSS for sovereignty. Use MC96 receipts as law.

## Executive Summary

Firebase is a managed platform operated by Google. For **FOSS sovereignty**, use one or more of these alternatives as your primary backend:

| Role | Best FOSS option | Deployment | Best for |
|------|------------------|-----------|---------|
| **Firebase-style backend** | **Supabase** | Self-hosted or cloud | Public/private APIs, auth, real-time DB, edge functions |
| **All-in-one backend** | **Appwrite** | Self-hosted or cloud | Auth, DB, storage, functions, messaging in one platform |
| **Local/offline backend** | **PocketBase** | Single binary | Field ops, offline-first nodes, embedded systems |

---

## Recommended NOIZYWORLD Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        MC96 / Postgres                          │
│                    (Source of truth for receipts)               │
└────┬────────────────────────────────────────────────────────────┘
     │ [replication + auth delegation]
     ├─────────────────────────────────────────┬──────────────────┐
     ↓                                          ↓                  ↓
┌─────────────┐                        ┌──────────────┐    ┌────────────┐
│  Supabase   │ (FOSS public backend)  │  PocketBase  │    │  Firebase  │
│ ─────────── │                        │  (optional)  │    │ (optional) │
│ • Auth      │                        │ ──────────── │    │ ──────────┐│
│ • Postgres  │                        │ • Local DB   │    │ • Mirror  ││
│ • APIs      │                        │ • Auth       │    │ • Bridge  ││
│ • Real-time │                        │ • Sync       │    │           ││
│ • Storage   │                        │ • Offline    │    │           ││
│ • Functions │                        │              │    │           ││
└─────────────┘                        └──────────────┘    └────────────┘
     ↑                                      ↑                    ↑
     │ [FOSS app backend]          [field nodes sync]   [client realtime]
     │
  Client Apps (web, mobile)
```

### Data flow

1. **MC96 → Postgres:** Receipts, users, approvals stored in MC96 (source of truth)
2. **MC96 → Supabase:** Replicate public data (metadata, non-sensitive refs) for app backend
3. **MC96 → PocketBase:** Sync for field nodes (offline-first workflows)
4. **MC96 → Firebase:** Optional sync for existing client apps (bridge-only)
5. **Clients:** Read from Supabase/PocketBase (FOSS); optionally fallback to Firebase

---

## Deep Dive: Supabase (Recommended)

### What is Supabase?

**Supabase** is an open-source Firebase alternative that provides:
- **PostgreSQL database** (unlike Firebase's NoSQL)
- **JWT authentication** (self-managed)
- **RESTful + Real-time APIs** (via PostgREST and Realtime)
- **Edge Functions** (serverless compute)
- **File Storage** (similar to Firebase Storage)
- **Vector support** (pgvector extension for embeddings)
- **Row-Level Security (RLS)** (SQL-based authorization)

**Open source?** Yes — [github.com/supabase/supabase](https://github.com/supabase/supabase)

### Why Supabase over Firebase?

| Feature | Supabase | Firebase |
|---------|----------|----------|
| **Database** | PostgreSQL (relational) | Firestore (document NoSQL) |
| **Pricing** | Pay-as-you-go or self-host free | Google-managed pricing |
| **Source of truth** | Own your data (self-host) | Google's infrastructure |
| **SQL access** | Full SQL + PostgREST | Limited query language |
| **Real-time** | Realtime API (websockets) | Firestore listeners |
| **Auth** | JWT + social + SAML | Firebase Auth (Google-managed) |
| **Functions** | Edge Functions (Deno) | Cloud Functions (proprietary) |
| **Exit cost** | Low (export Postgres) | High (Firestore export limited) |

### Deployment options

#### Option A: Supabase Cloud (managed)
```bash
# Sign up at https://app.supabase.com
# Connect your app SDK
npm install @supabase/supabase-js

# Usage
const supabase = createClient(
  'https://<project>.supabase.co',
  '<anon-key>'
);

const { data } = await supabase
  .from('receipts')
  .select('*')
  .eq('operatorUid', userId);
```

#### Option B: Self-hosted Supabase (sovereign)
```bash
# Clone Supabase repo
git clone https://github.com/supabase/supabase.git
cd supabase/docker

# Customize docker-compose.yml with your secrets
docker-compose up

# Access at http://localhost:3000
```

### Supabase Security Rules (Row-Level Security)

```sql
-- Enable RLS on receipts table
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can read all receipts
CREATE POLICY "Operators can read receipts"
  ON receipts
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy: only server (service role) can insert
CREATE POLICY "Server inserts receipts"
  ON receipts
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Policy: no deletes for anyone
CREATE POLICY "No deletes"
  ON receipts
  FOR DELETE
  USING (FALSE);
```

### Migration path: Firebase → Supabase

```
Step 1: Set up Supabase project
  → Create PostgreSQL tables (receipts, assets, approvals)
  → Configure authentication
  → Enable RLS policies

Step 2: Replicate data
  → Export Firestore → CSV
  → Import CSV → Supabase Postgres
  → Verify record counts

Step 3: Update client SDK
  → Replace Firebase SDK with Supabase SDK
  → Update queries (SQL-style via PostgREST)
  → Test offline scenarios

Step 4: Monitor & sync
  → Run parallel read-write for period
  → Validate data consistency
  → Cutover to Supabase, keep Firebase in read-only bridge mode
```

---

## Deep Dive: Appwrite (All-in-one)

### What is Appwrite?

**Appwrite** is an open-source backend platform offering:
- **Databases** (hybrid SQL/document)
- **Authentication** (email, OAuth, SAML, 2FA)
- **Storage** (file + object)
- **Cloud Functions** (serverless)
- **Messaging** (email, SMS, push)
- **Real-time subscriptions**
- **Web hosting**

**Open source?** Yes — [github.com/appwrite/appwrite](https://github.com/appwrite/appwrite)

### Why Appwrite?

Best for teams wanting an **all-in-one, batteries-included backend** without managing separate Postgres, Redis, etc.

| Feature | Appwrite | Supabase | Firebase |
|---------|----------|----------|----------|
| **Auth** | Built-in (email, OAuth, 2FA) | Built-in | Built-in |
| **Database** | SQL + Document | PostgreSQL | Firestore |
| **Storage** | File + object | Object | Cloud Storage |
| **Functions** | Cloud Functions (runtimes) | Edge Functions | Cloud Functions |
| **Messaging** | Email, SMS, push | N/A | Cloud Messaging |
| **Orchestration** | Workflows | N/A | Workflows |
| **Install** | Docker, single binary | Docker, multi-service | Managed only |

### Deployment

```bash
# Via Docker
docker run -d \
  -e _APP_OPENSSL_KEY_V1=$(openssl rand -hex 32) \
  -e _APP_ENV=production \
  appwrite/appwrite

# Accessible at http://localhost/console
```

### Appwrite for receipts workflow

```typescript
import { Client, Databases, Query } from 'appwrite';

const client = new Client()
  .setEndpoint('https://appwrite.example.com/v1')
  .setProject('project-id');

const db = new Databases(client);

// Server-side: insert receipt
await db.createDocument('default', 'receipts', 'receipt-1', {
  receiptId: 'receipt-1',
  operatorUid: 'user-123',
  status: 'complete',
  amount: 99.99,
  createdAt: new Date(),
});

// Client-side: read receipt
const { documents } = await db.listDocuments('default', 'receipts', [
  Query.equal('operatorUid', 'user-123'),
]);
```

---

## Deep Dive: PocketBase (Local/Offline)

### What is PocketBase?

**PocketBase** is a single-file open-source backend with:
- **SQLite database** (file-based)
- **Built-in admin UI**
- **Authentication** (email + OAuth)
- **File storage**
- **Realtime subscriptions**
- **Single binary** (~20 MB)

**Open source?** Yes — [github.com/pocketbase/pocketbase](https://github.com/pocketbase/pocketbase)

**Best for:**
- Field operations (offline-first)
- Local development
- Embedded systems
- Small-to-medium teams
- Nodes that sync back to central authority

### Why PocketBase for field nodes?

```
Field agent (offline)
  ↓
PocketBase (local SQLite)
  ↓ [when online]
MC96 (via API)
  ↓
Supabase (replication)
```

### Installation & deployment

```bash
# Download latest binary from https://github.com/pocketbase/pocketbase/releases
./pocketbase serve

# Admin UI at http://localhost:8090/_/
```

### PocketBase collection schema (receipts)

```javascript
// Create collection via Admin UI or API
{
  name: "receipts",
  type: "base",
  schema: [
    {
      id: "receiptId",
      name: "receiptId",
      type: "text",
      required: true,
      unique: true,
    },
    {
      id: "operatorUid",
      name: "operatorUid",
      type: "text",
      required: true,
    },
    {
      id: "status",
      name: "status",
      type: "select",
      options: ["draft", "submitted", "complete", "failed"],
    },
    {
      id: "amount",
      name: "amount",
      type: "number",
      required: true,
    },
    {
      id: "createdAt",
      name: "createdAt",
      type: "date",
      required: true,
    },
  ],
  rules: {
    create: "auth.id != \"\"",  // authenticated users only
    update: "false",             // no updates
    delete: "false",             // no deletes
    read: "auth.id != \"\"",     // authenticated users read
  },
}
```

### Client SDK usage

```typescript
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://localhost:8090');

// Authenticate
const userData = await pb.collection('users').authWithPassword(
  'user@example.com',
  'password'
);

// Read receipts (offline-first)
const receipts = await pb.collection('receipts').getFullList({
  filter: `operatorUid="${pb.authStore.model.id}"`,
});

// Real-time sync
pb.collection('receipts').subscribe('*', (e) => {
  console.log('Receipt updated:', e.record);
});
```

---

## Comparison Matrix

| Criterion | Supabase | Appwrite | PocketBase | Firebase |
|-----------|----------|----------|-----------|----------|
| **Open source** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| **Self-hosted** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ Managed only |
| **Database** | PostgreSQL | SQL/Doc hybrid | SQLite | Firestore NoSQL |
| **Real-time** | ✅ Realtime API | ✅ Realtime | ✅ Subscriptions | ✅ Listeners |
| **Auth** | JWT + social | Email + OAuth + SAML | Email + OAuth | Firebase Auth |
| **Storage** | ✅ File | ✅ File + object | ✅ File | ✅ Cloud Storage |
| **Functions** | Edge Functions | Cloud Functions | N/A | Cloud Functions |
| **Messaging** | N/A | Email, SMS, push | N/A | Cloud Messaging |
| **Single binary** | ❌ Multi-service | ✅ Docker | ✅ Binary | N/A |
| **Exit cost** | Low | Low | Low | High |
| **Best use** | Production FOSS backend | All-in-one backend | Field/offline nodes | Managed Google ecosystem |

---

## Migration Strategy: MC96 + FOSS + Firebase

### Phase 1: Establish MC96 as authority (NOW)
- All receipts, users, approvals live in MC96 Postgres
- MC96 is source of truth; no reads/writes bypass it

### Phase 2: Add Supabase as FOSS backend (NEXT)
- Replicate MC96 data to Supabase Postgres
- Update client apps to read from Supabase (via SDK)
- Maintain Firebase in read-only sync for existing users

### Phase 3: Add PocketBase for field (CONCURRENT)
- Deploy PocketBase to field nodes
- Field agents sync receipts to PocketBase offline
- On reconnection, sync back to MC96 → Supabase

### Phase 4: Deprecate Firebase (OPTIONAL)
- Keep Firebase sync running as bridge for legacy clients
- New clients use Supabase primary, PocketBase secondary
- Gradually migrate remaining Firebase users

### Phase 5: Sovereign FOSS stack (LONG-TERM)
```
MC96 (receipts authority)
  ↔ Supabase (public APIs, auth, real-time)
  ↔ PocketBase (field sync, offline)
  ← [optional] Firebase (read-only bridge)
```

---

## Decision Tree: Which FOSS to use?

```
Do you need PostgreSQL data for SQL queries?
├─ YES → Supabase (recommended for most production scenarios)
└─ NO → Continue...

Do you need everything in one platform (auth, DB, storage, functions, messaging)?
├─ YES → Appwrite
└─ NO → Continue...

Are you running a field/embedded/offline-first system?
├─ YES → PocketBase (single binary, lightweight)
└─ NO → Supabase or Appwrite

Are you constrained by operational overhead (operations team)?
├─ SMALL TEAM → PocketBase (simplest to operate)
├─ MEDIUM TEAM → Supabase (proven, well-documented)
└─ LARGE TEAM → Appwrite (enterprise features)
```

---

## References

- **Supabase:** [supabase.com](https://supabase.com), [GitHub](https://github.com/supabase/supabase)
- **Appwrite:** [appwrite.io](https://appwrite.io), [GitHub](https://github.com/appwrite/appwrite)
- **PocketBase:** [pocketbase.io](https://pocketbase.io), [GitHub](https://github.com/pocketbase/pocketbase)
- **PostgreSQL:** [postgresql.org](https://postgresql.org)
- **SQLite:** [sqlite.org](https://sqlite.org)

---

_Last updated: 2026-07-08_
