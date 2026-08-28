# NOIZY Infrastructure

Backend services, ZK circuits, and workflows for the NOIZY Empire.

---

## Components

### `/noizyfish/` — Cloudflare Worker

Audio archive API with provenance verification.

| Resource | Purpose |
|----------|---------|
| `wrangler.toml` | Worker configuration |
| `schema.sql` | D1 database schema (append-only audit) |
| `src/search.ts` | Search API endpoint |
| `src/index.ts` | Worker entry point (to be created) |

**Bindings:**
- `AUDIT_DB` — D1 database for audit events + assets
- `AUDIO_BUCKET` — R2 bucket for audio storage
- `SESSION_CACHE` — KV namespace for sessions

**Deployment:**
```bash
cd noizyfish
npx wrangler deploy
npx wrangler d1 execute noizyfish_audit --remote --file schema.sql
```

### `/circuits/` — ZK Circuits

Zero-knowledge proofs for provenance verification.

| Circuit | Policy | Purpose |
|---------|--------|---------|
| `real_human_origin.circom` | REAL_HUMAN_ORIGIN | Prove human origin without revealing identity |

**Public Inputs:**
- `sample_fingerprint` — Hash of the audio sample
- `registry_root` — Merkle root of trusted performer registry
- `blacklist_root` — Merkle root of synthetic sample blacklist
- `timestamp` — Unix timestamp of verification

**Private Inputs:**
- `signer_private_key` — Performer's signing key
- `performer_id` — Unique performer identifier
- `registry_path[]` — Merkle proof for registry membership
- `blacklist_path[]` — Merkle proof for blacklist non-membership

**Compilation (requires circom):**
```bash
cd circuits
circom real_human_origin.circom --r1cs --wasm --sym
```

### `/n8n/` — Workflows

Automation workflows for audio ingestion.

| Workflow | Purpose |
|----------|---------|
| `noizyfish-ingestion.json` | Full audio ingestion pipeline |

**Pipeline Steps:**
1. **Webhook Trigger** — Receives audio upload
2. **Cyanite Analysis** — Extracts BPM, key, mood, tags
3. **ZK Proof Generation** — Verifies REAL_HUMAN_ORIGIN
4. **Receipt Signing** — Creates cryptographic receipt
5. **R2 Upload** — Stores audio in Cloudflare R2
6. **D1 Insert** — Logs to append-only audit ledger
7. **Response** — Returns success with proof IDs

**Environment Variables Required:**
- `CYANITE_API_KEY` — Cyanite audio analysis API
- `ZK_VERIFIER_URL` — ZK proof generation endpoint
- `NOIZY_API_KEY` — Authentication
- `CLOUDFLARE_ACCOUNT_ID` — Cloudflare account
- `CLOUDFLARE_API_TOKEN` — Cloudflare API access
- `NOIZYFISH_AUDIT_DB_ID` — D1 database ID
- `R2_ACCESS_TOKEN` — R2 storage access

---

## Database Schema

### `audit_events` (Append-Only)

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | UUID primary key |
| event_type | TEXT | INGEST, TAG, PROOF, REVOKE, ACCESS, VERIFY |
| asset_id | TEXT | Reference to audio asset |
| policy | TEXT | ZK policy applied (default: REAL_HUMAN_ORIGIN) |
| event_payload | TEXT | JSON payload |
| previous_hash | TEXT | Hash of previous event (chain integrity) |
| event_hash | TEXT | SHA-256 hash of this event |
| created_at | TEXT | ISO timestamp |

**Triggers:**
- `audit_events_no_delete` — RAISE ABORT on DELETE
- `audit_events_no_update` — RAISE ABORT on UPDATE

### `assets` (Metadata)

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | UUID primary key |
| title | TEXT | Asset title |
| r2_key | TEXT | R2 object key |
| content_hash | TEXT | SHA-256 of audio content |
| duration_seconds | REAL | Duration |
| bpm | REAL | Beats per minute (Cyanite) |
| key | TEXT | Musical key (Cyanite) |
| mood | TEXT | Mood (Cyanite) |
| tags | TEXT | JSON array of tags |
| origin_verified | INTEGER | 1 if ZK proof valid |
| c2pa_manifest | TEXT | C2PA content credentials |
| proof_id | TEXT | Reference to ZK proof |
| consent_status | TEXT | ACTIVE, REVOKED, PENDING |

### `proof_receipts` (Append-Only)

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | UUID primary key |
| asset_id | TEXT | Reference to asset |
| policy | TEXT | ZK policy |
| result | INTEGER | 1 = valid, 0 = invalid |
| proof_data | TEXT | ZK proof blob |
| verifier_signature | TEXT | Verifier signature |
| verified_at | TEXT | ISO timestamp |

---

## Security Model

1. **Append-Only Audit** — No DELETE or UPDATE on audit tables
2. **Hash Chain** — Each event references previous event hash
3. **ZK Proofs** — Verify origin without exposing identity
4. **Consent Kernel** — Every synthesis checked against live consent

## API Endpoints

### `/search`

Query parameters:
- `q` — Full text query (e.g., "grit9 140bpm Am")
- `bpm_min`, `bpm_max` — BPM range
- `key` — Musical key (Am, C, F#m)
- `mood` — Mood filter
- `tags` — Comma-separated tags
- `verified_only` — Only provenance-verified
- `limit`, `offset` — Pagination

Response includes provenance status and consent state for each result.

### `/ingest` (via n8n)

POST with audio file:
- Analyzes audio (Cyanite)
- Generates ZK proof
- Stores in R2
- Logs to D1

### `/preview/:id`

Returns signed URL for audio preview (requires valid session).

---

**"Consent as executable code. Provenance as default."**
