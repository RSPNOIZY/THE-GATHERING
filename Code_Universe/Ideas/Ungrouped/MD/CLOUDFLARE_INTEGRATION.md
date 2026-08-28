# NOIZYFISH Cloudflare Integration Plan

**Objective**: Evolve from static curated content to provenance-ready infrastructure.

---

## Phase Overview

| Phase | Scope | Timeline |
|-------|-------|----------|
| **MVP** | Static JSON, Next.js SSG | Current |
| **Phase 1** | D1 for metadata, KV for cache | +2 weeks |
| **Phase 2** | R2 for audio storage | +4 weeks |
| **Phase 3** | Workers for API, ZK verification | +8 weeks |

---

## What Stays Static in MVP

These remain as local JSON/TypeScript until Phase 1:

```
lib/data.ts
├── ARCHIVE_ITEMS[]        → Static mock data
├── CATEGORIES[]           → Static constants
└── OCEAN_ZONES[]          → Static constants
```

**Rationale**: Minimal viable product ships faster with static data. Cloudflare integration adds complexity that should wait until core UX is validated.

---

## Phase 1: D1 for Metadata

### Tables to Create

```sql
-- Archive works metadata
CREATE TABLE archive_works (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  year INTEGER,
  category TEXT NOT NULL,
  zone TEXT,
  duration_seconds REAL,
  description TEXT,
  synopsis TEXT,
  tags TEXT,  -- JSON array
  featured INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Credits and collaborators
CREATE TABLE credits (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES archive_works(id),
  role TEXT NOT NULL,
  name TEXT NOT NULL,
  organization TEXT,
  sort_order INTEGER DEFAULT 0
);

-- Provenance records
CREATE TABLE provenance (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES archive_works(id),
  status TEXT CHECK(status IN ('verified', 'pending', 'unverified')),
  c2pa_present INTEGER DEFAULT 0,
  proof_id TEXT,
  proof_policy TEXT,
  verified_at TEXT,
  chain_hash TEXT
);

-- Rights status
CREATE TABLE rights (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES archive_works(id),
  status TEXT CHECK(status IN ('available', 'restricted', 'archived')),
  license_type TEXT,
  restrictions TEXT,  -- JSON array
  contact_required INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX idx_works_category ON archive_works(category);
CREATE INDEX idx_works_zone ON archive_works(zone);
CREATE INDEX idx_works_featured ON archive_works(featured);
CREATE INDEX idx_credits_work ON credits(work_id);
CREATE INDEX idx_provenance_work ON provenance(work_id);
```

### Migration Path

1. Export `lib/data.ts` to SQL seed file
2. Create D1 database: `npx wrangler d1 create noizyfish_archive`
3. Run schema: `npx wrangler d1 execute noizyfish_archive --file schema.sql`
4. Seed data: `npx wrangler d1 execute noizyfish_archive --file seed.sql`
5. Update Next.js to fetch from D1 (via Worker API)

---

## Phase 2: R2 for Audio Storage

### Bucket Structure

```
noizyfish-audio/
├── previews/
│   └── {work_id}.mp3       # 30-60s preview clips
├── full/
│   └── {work_id}.wav       # Full resolution (licensed access)
├── thumbnails/
│   └── {work_id}.jpg       # Waveform visualizations
└── metadata/
    └── {work_id}.json      # Extended metadata, C2PA manifests
```

### Access Patterns

| Content | Access | Auth |
|---------|--------|------|
| Previews | Public signed URLs | Rate limited |
| Full audio | Licensed users | Token required |
| Thumbnails | Public | CDN cached |
| Metadata | Public | CDN cached |

### Worker Endpoints

```typescript
// GET /preview/{work_id}
// Returns signed R2 URL for preview clip
// Rate limited: 60 req/min/IP

// GET /download/{work_id}
// Returns signed R2 URL for full audio
// Requires valid license token
// Logs to audit ledger
```

---

## Phase 3: Workers for API + ZK

### Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/search` | GET | Archive search with filters |
| `/work/{id}` | GET | Single work metadata |
| `/work/{id}/provenance` | GET | Provenance chain |
| `/preview/{id}` | GET | Signed preview URL |
| `/ingest` | POST | New work ingestion |
| `/verify` | POST | ZK proof verification |

### Search API (already built)

See `infrastructure/noizyfish/src/search.ts`

Query parsing: `"grit9 140bpm Am"` → extracts BPM, key, text

### ZK Verification

See `infrastructure/circuits/real_human_origin.circom`

Policy: `REAL_HUMAN_ORIGIN`
- Prove performer is in trusted registry
- Prove sample is NOT in synthetic blacklist
- No identity revealed

---

## KV Usage

| Namespace | Purpose | TTL |
|-----------|---------|-----|
| `NOIZYFISH_CACHE` | Search results, work metadata | 5 min |
| `NOIZYFISH_RATE` | Rate limiting counters | 1 min |
| `NOIZYFISH_SESSION` | User sessions | 24 hr |

### Cache Invalidation

- On work UPDATE → purge `work:{id}`, `search:*`
- On provenance UPDATE → purge `work:{id}`, `provenance:{id}`
- Manual purge via admin endpoint

---

## Environment Variables

### `.env.local` (Next.js)

```bash
NEXT_PUBLIC_API_URL=https://noizyfish.com
NEXT_PUBLIC_ENVIRONMENT=development
```

### Worker Secrets (via `wrangler secret put`)

```bash
NOIZY_API_KEY          # Internal auth
CYANITE_API_KEY        # Audio analysis
ZK_VERIFIER_URL        # Proof verification endpoint
```

### `wrangler.toml` Bindings

```toml
[[d1_databases]]
binding = "ARCHIVE_DB"
database_name = "noizyfish_archive"
database_id = "{{NOIZYFISH_ARCHIVE_DB_ID}}"

[[r2_buckets]]
binding = "AUDIO_BUCKET"
bucket_name = "noizyfish-audio"

[[kv_namespaces]]
binding = "CACHE"
id = "{{NOIZYFISH_CACHE_KV_ID}}"
```

---

## Provenance Metadata Attachment

Each archive work can have attached provenance:

```typescript
interface ProvenanceAttachment {
  // C2PA Content Credentials
  c2pa?: {
    manifest: string;      // Base64 encoded manifest
    signature: string;     // Verification signature
    issuer: string;        // CA that signed
    timestamp: string;
  };

  // ZK Proof
  zkProof?: {
    policy: "REAL_HUMAN_ORIGIN";
    proofId: string;
    proofHash: string;
    verifiedAt: string;
    registryRoot: string;  // Merkle root at verification time
  };

  // Chain of custody
  custody: Array<{
    event: "CAPTURE" | "PROCESS" | "INGEST" | "VERIFY" | "TRANSFER";
    timestamp: string;
    actor: string;
    previousHash: string;
    eventHash: string;
  }>;
}
```

---

## Rights State Representation

```typescript
type RightsStatus =
  | "available"      // Open for licensing
  | "restricted"     // Limited use, contact required
  | "archived"       // Historical only, no new licenses
  | "exclusive"      // Under exclusive agreement
  | "pending";       // Rights being clarified

interface RightsInfo {
  status: RightsStatus;
  licenseTypes: ("creative_commons" | "commercial" | "editorial" | "educational")[];
  restrictions: string[];
  contactRequired: boolean;
  exclusiveUntil?: string;  // ISO date
  territories?: string[];   // ISO country codes, or "worldwide"
}
```

---

## Commands Reference

```bash
# Create D1 database
npx wrangler d1 create noizyfish_archive

# Create R2 bucket
npx wrangler r2 bucket create noizyfish-audio

# Create KV namespace
npx wrangler kv:namespace create NOIZYFISH_CACHE

# Deploy Worker
cd infrastructure/noizyfish
npx wrangler deploy

# Run schema
npx wrangler d1 execute noizyfish_archive --remote --file schema.sql

# Set secrets
npx wrangler secret put NOIZY_API_KEY
npx wrangler secret put CYANITE_API_KEY
```

---

## Risk Notes

1. **D1 limitations**: 10GB max, no full-text search. Consider Algolia for search at scale.
2. **R2 egress**: First 10GB free, then $0.015/GB. Budget for audio previews.
3. **Workers limits**: 10ms CPU (paid: 50ms). Keep ZK verification light or offload.
4. **Cold starts**: First request to Worker may be slow. Use KV cache aggressively.

---

**"The archive is not a warehouse. It is a living memory."**
