# NOIZYVOX Cloudflare Integration Plan

**Objective**: Prepare for consent-native backend logic with sovereign infrastructure.

---

## Phase Overview

| Phase | Scope | Timeline |
|-------|-------|----------|
| **MVP** | Static mock data, Next.js SSG | Current |
| **Phase 1** | D1 for profiles + consent, KV for sessions | +2 weeks |
| **Phase 2** | R2 for voice samples, Workers API | +4 weeks |
| **Phase 3** | Consent kernel, ZK verification, webhooks | +8 weeks |

---

## What Stays Static in MVP

These remain as local TypeScript until Phase 1:

```
lib/data.ts
├── VOICES[]                → Static mock profiles
├── DEFAULT_CONSENT_STATE   → Template consent object
└── VOICE_STYLES[]          → Static constants
```

**Rationale**: Core consent UX must be validated before building backend. Static data enables rapid iteration.

---

## Phase 1: D1 for Profiles + Consent

### Tables to Create

```sql
-- Creator profiles
CREATE TABLE creators (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  email TEXT UNIQUE,
  bio TEXT,
  languages TEXT,         -- JSON array
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Voice profiles (one creator can have multiple voices)
CREATE TABLE voice_profiles (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL REFERENCES creators(id),
  display_name TEXT NOT NULL,
  styles TEXT,            -- JSON array
  readiness TEXT CHECK(readiness IN ('available', 'limited', 'unavailable')),
  sample_url TEXT,
  voice_dna_hash TEXT,    -- Encrypted spectral fingerprint
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Consent records (append-only)
CREATE TABLE consent_records (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL REFERENCES creators(id),
  consent_type TEXT NOT NULL CHECK(consent_type IN (
    'recording', 'model_training', 'commercial_usage',
    'territory', 'duration', 'attribution'
  )),
  granted INTEGER NOT NULL,
  scope TEXT,             -- JSON: category, territory, duration details
  granted_at TEXT,
  revoked_at TEXT,
  previous_hash TEXT,
  record_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Commercial usage permissions (per category)
CREATE TABLE commercial_permissions (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL REFERENCES creators(id),
  category TEXT NOT NULL CHECK(category IN (
    'advertising', 'entertainment', 'gaming',
    'corporate', 'educational', 'editorial'
  )),
  allowed INTEGER NOT NULL,
  rate_override REAL,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(creator_id, category)
);

-- Activity events
CREATE TABLE activity_events (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL REFERENCES creators(id),
  event_type TEXT NOT NULL CHECK(event_type IN (
    'consent_granted', 'consent_revoked', 'license_request',
    'usage_detected', 'royalty_paid', 'profile_updated'
  )),
  event_data TEXT,        -- JSON payload
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX idx_voice_creator ON voice_profiles(creator_id);
CREATE INDEX idx_consent_creator ON consent_records(creator_id);
CREATE INDEX idx_consent_type ON consent_records(consent_type);
CREATE INDEX idx_permissions_creator ON commercial_permissions(creator_id);
CREATE INDEX idx_activity_creator ON activity_events(creator_id);
CREATE INDEX idx_activity_type ON activity_events(event_type);
```

### Consent Record Integrity

Consent records are **append-only**:
- No UPDATE allowed
- No DELETE allowed
- Each record hashes previous record (chain integrity)
- Revocation = new record with `revoked_at` set

```sql
-- Triggers to enforce append-only
CREATE TRIGGER consent_no_update
  BEFORE UPDATE ON consent_records
BEGIN
  SELECT RAISE(ABORT, 'CONSENT VIOLATION: Updates not allowed');
END;

CREATE TRIGGER consent_no_delete
  BEFORE DELETE ON consent_records
BEGIN
  SELECT RAISE(ABORT, 'CONSENT VIOLATION: Deletes not allowed');
END;
```

---

## Phase 2: R2 for Voice Storage

### Bucket Structure

```
noizyvox-voices/
├── samples/
│   └── {voice_id}/
│       ├── demo.mp3        # Public demo clip
│       └── full.wav        # Protected full sample
├── dna/
│   └── {voice_id}.enc      # Encrypted Voice DNA
├── models/
│   └── {voice_id}/         # Trained model artifacts (if applicable)
└── avatars/
    └── {creator_id}.jpg    # Profile images
```

### Access Patterns

| Content | Access | Auth |
|---------|--------|------|
| Demo samples | Public | Rate limited |
| Full samples | Authorized | License token |
| Voice DNA | Internal only | Service auth |
| Avatars | Public | CDN cached |

---

## Phase 3: Consent Kernel API

### Core Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/profile/{id}` | GET | Creator profile |
| `/profile` | POST | Create profile |
| `/profile/{id}` | PATCH | Update profile |
| `/consent/{id}` | GET | Current consent state |
| `/consent/{id}/grant` | POST | Grant consent |
| `/consent/{id}/revoke` | POST | Revoke consent |
| `/consent/{id}/history` | GET | Consent history |
| `/casting` | GET | Search available voices |
| `/license/request` | POST | Request voice license |
| `/license/verify` | POST | Verify license token |
| `/activity/{id}` | GET | Creator activity feed |

### Consent Grant Flow

```
1. Creator submits consent grant request
2. Validate request against Never Clauses
3. Hash previous consent record
4. Insert new consent record
5. Fire webhook to notify
6. Return updated consent state
```

### Revocation (Kill Switch)

```
POST /consent/{id}/revoke
{
  "consent_type": "model_training",
  "reason": "Changed my mind",
  "effective": "immediate"
}

Response:
{
  "success": true,
  "revoked_at": "2026-04-07T12:00:00Z",
  "record_hash": "0x...",
  "message": "Consent revoked. All active synthesis halted."
}
```

---

## KV Usage

| Namespace | Purpose | TTL |
|-----------|---------|-----|
| `NOIZYVOX_SESSION` | User sessions | 24 hr |
| `NOIZYVOX_CACHE` | Profile/consent cache | 5 min |
| `NOIZYVOX_RATE` | Rate limiting | 1 min |
| `NOIZYVOX_TOKENS` | Active license tokens | varies |

### Session Structure

```typescript
interface Session {
  creatorId: string;
  email: string;
  createdAt: string;
  expiresAt: string;
  permissions: ("read" | "write" | "admin")[];
}
```

---

## Onboarding Data Persistence

Onboarding wizard saves progress to KV during flow:

```typescript
// KV key: onboarding:{session_id}
interface OnboardingProgress {
  step: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  data: {
    identity?: { displayName: string; bio: string; languages: string[] };
    goals?: { primary: string };
    recording?: { consent: boolean; terms: boolean };
    model?: { allowed: boolean; restrictions: string[] };
    usage?: { categories: Record<string, boolean> };
    attribution?: { require: boolean; style: string };
    territory?: { type: string; territories?: string[] };
  };
  startedAt: string;
  lastUpdatedAt: string;
}
```

On final step:
1. Validate all required fields
2. Create creator profile in D1
3. Create consent records in D1
4. Clear onboarding KV
5. Create session
6. Redirect to dashboard

---

## Dashboard Activity Sources

Activity feed combines:

1. **D1 activity_events** — Historical events
2. **KV active tokens** — Current license tokens
3. **External webhooks** — Usage detection, royalty payments

```typescript
// GET /activity/{creator_id}
interface ActivityResponse {
  events: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
  }>;
  activeTokens: number;
  pendingRequests: number;
}
```

---

## Environment Variables

### `.env.local` (Next.js)

```bash
NEXT_PUBLIC_API_URL=https://noizyvox.com
NEXT_PUBLIC_ENVIRONMENT=development
```

### Worker Secrets

```bash
NOIZY_API_KEY           # Internal auth
WEBHOOK_SECRET          # Webhook signing
STRIPE_SECRET_KEY       # Payment processing (Phase 3+)
```

### `wrangler.toml` Bindings

```toml
[[d1_databases]]
binding = "CONSENT_DB"
database_name = "noizyvox_consent"
database_id = "{{NOIZYVOX_CONSENT_DB_ID}}"

[[r2_buckets]]
binding = "VOICE_BUCKET"
bucket_name = "noizyvox-voices"

[[kv_namespaces]]
binding = "SESSION"
id = "{{NOIZYVOX_SESSION_KV_ID}}"

[[kv_namespaces]]
binding = "CACHE"
id = "{{NOIZYVOX_CACHE_KV_ID}}"
```

---

## Never Clause Enforcement

The consent kernel must enforce Never Clauses at the API level:

```typescript
const NEVER_CLAUSES = [
  "No voice synthesis without explicit consent",
  "No consent assumed from silence",
  "No data sold to third parties",
  "No posthumous use without estate permission",
  "No deepfake impersonation regardless of consent"
];

function validateConsent(request: ConsentRequest): ValidationResult {
  // Check against Never Clauses
  for (const clause of NEVER_CLAUSES) {
    if (violates(request, clause)) {
      return {
        valid: false,
        error: `NEVER CLAUSE VIOLATION: ${clause}`,
        code: "NEVER_CLAUSE"
      };
    }
  }
  return { valid: true };
}
```

---

## Webhooks (Phase 3)

| Event | Target | Priority |
|-------|--------|----------|
| `consent.revoked` | Slack + Email | CRITICAL |
| `consent.granted` | Slack | Normal |
| `license.requested` | Email | High |
| `license.approved` | Email | Normal |
| `usage.detected` | Dashboard | Normal |
| `royalty.distributed` | Email | Normal |

---

## Commands Reference

```bash
# Create D1 database
npx wrangler d1 create noizyvox_consent

# Create R2 bucket
npx wrangler r2 bucket create noizyvox-voices

# Create KV namespaces
npx wrangler kv:namespace create NOIZYVOX_SESSION
npx wrangler kv:namespace create NOIZYVOX_CACHE

# Deploy Worker
cd infrastructure/noizyvox
npx wrangler deploy

# Set secrets
npx wrangler secret put NOIZY_API_KEY
npx wrangler secret put WEBHOOK_SECRET
```

---

## Security Considerations

1. **Consent records immutable**: No UPDATE/DELETE at database level
2. **Hash chain integrity**: Each record verifies previous
3. **Session tokens**: Short-lived, stored in KV with TTL
4. **Rate limiting**: Per-IP and per-creator
5. **Audit logging**: All consent operations logged
6. **Never Clauses**: Enforced at API level, not just UI

---

**"Your voice is your signature. We keep it yours."**
