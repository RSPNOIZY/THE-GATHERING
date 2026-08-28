# MC96ECO Database Registry

> GABRIEL Self-Healing Loop Knowledge Base
> Last updated: 2026-04-03

---

## Cloudflare D1 Databases

### Primary D1 (CANONICAL)

These are the three active D1 databases. All Workers and services bind to these.

#### agent-memory (`7b813205-fd12-4a23-84a6-ce83bc49ec70`)

**Account:** HEAVEN / noizy.ai (`2446d788cc4280f5ea22a9948410c355`)
**Binding:** `DB_MEMORY`
**Purpose:** GABRIEL's persistent memory — memcells, learning events, agent state

Key tables include:
- `memcells` — Knowledge fragments (333+ entries). Each has id, content, source, timestamp, tower_id, tags
- `learning_events` — Log of every learning event (341+ entries). Tower, input, output, timestamp
- `agent_state` — GABRIEL runtime state snapshots
- `tower_config` — Configuration for each of the 10 towers
- `command_history` — Every command received and executed
- `health_log` — Service health check results over time
- `consent_tokens` — Active NCP consent tokens with scope and TTL
- `voice_registry` — Registered voice identities and consent status
- `artist_profiles` — Artist data, preferences, royalty config
- `royalty_ledger` — Every royalty calculation and distribution
- `session_log` — Audio session provenance records
- Plus ~20 more operational tables

**URGENT_QUEUE_MAR27** and **KV_AUDIT_MAR27** and **HEAVEN_WRANGLER_TOML** are stored as memcells in this database.

#### noizylab-repairs (`2bd4aa06-f9b2-4761-b235-e92e8a21fe45`)

**Account:** HEAVEN / noizy.ai (`2446d788cc4280f5ea22a9948410c355`)
**Binding:** `DB_REPAIRS`
**Purpose:** Repair log — tracks every self-healing action, diagnostic result, and fix applied

Key tables:
- `repairs` — Each repair event: service, error, diagnosis, fix_applied, success, timestamp
- `diagnostics` — Raw diagnostic output from Tower 9 HEAL
- `escalations` — Repairs that required human intervention
- `patterns` — Recurring error patterns detected by GABRIEL

#### aquarium-archive (`e6f98279-656b-4f7a-979d-9197821193f5`)

**Account:** HEAVEN / noizy.ai (`2446d788cc4280f5ea22a9948410c355`)
**Binding:** `DB_AQUARIUM`
**Purpose:** Archive storage — historical data, deprecated configs, migration records

Key tables:
- `archive_entries` — Archived data with source, category, and retrieval metadata
- `migrations` — Schema migration history across all databases
- `deprecated_configs` — Old configurations preserved for rollback reference

### DEAD D1 (DO NOT USE)

#### gabriel_db (`f75939d5...`)

**STATUS: DEAD. NEVER REFERENCE. NEVER BIND.**

This was the original GABRIEL database. It was split into the three databases above during the March 2026 restructuring. Any code referencing `gabriel_db` or `f75939d5` must be updated to use `agent-memory` / `7b813205`.

**Action required:** `grep -r "gabriel_db\|f75939d5" ~/repos/` — replace all references.

---

### D1 on NOIZY.ai Consent Account

#### gabriel_db (`fc0edd97...`)

**Account:** NOIZY.ai consent (`5f36aa9795348ea681d0b21910dfc82a`)
**Tables:** 31
**Purpose:** consent-gateway data — consent records, audit trails, rate limiting state

This is a separate database on the consent account, used exclusively by the consent-gateway worker. Despite sharing the name `gabriel_db` with the dead database above, this is a different database on a different account.

Key tables:
- `consent_records` — Master consent table: user_id, scope, granted_at, expires_at, revoked_at
- `consent_audit` — Immutable audit log of every consent change
- `rate_limits` — Per-user rate limiting counters
- `biometric_consent` — Elevated consent for biometric data (voice, face)
- `revocations` — Active revocation records (checked on every request)
- `provenance_chain` — Cryptographic provenance records for data lineage
- `creator_splits` — Royalty split configuration per creator (minimum 75%)
- `scope_definitions` — Available consent scopes and their descriptions
- `auth_tokens` — JWT token metadata (not the tokens themselves)
- `user_profiles` — Basic user data for consent management
- Plus 21 more operational/audit tables

---

## Cloudflare KV Namespaces

### Primary KV (HEAVEN Account)

| Binding | Namespace ID | Purpose |
|---------|-------------|---------|
| KV_SIGNUPS | `392c1bf429114148999824a9f9e15169` | User signup data, verification tokens |
| KV_ROYALTIES | `4cf36e4bd1fd44fe802096925413f694` | Royalty calculation cache, distribution records |
| KV_GUILD | `8a15ed31fea8462da7c92a8237d6f854` | Artist guild membership, voting records |
| KV_SESSIONS | `c90299891f684de7bcc7c53967133748` | Active session tokens, TTL-managed |
| KV_SUBMISSIONS | `6e888a017ebe4ba78ed7497c4929439b` | Content submission queue, review status |
| KV_MEMCELL | `9aa2511652ce4a2faeb106858f76df67` | Fast-access memcell cache (mirrors D1) |
| GABRIEL_KV | `6fe434a8...` | Rate limiting counters, general cache |
| GABRIEL_VOICE | `afef27e6...` | Voice genome storage, fingerprints |

### Additional KV Namespaces (17 more)

The HEAVEN account has 52 active KV namespaces total. 10 are flagged as dead candidates in the KV_AUDIT_MAR27 memcell.

Additional namespaces cover:
- Worker configuration caches
- Feature flags
- A/B test assignments
- Temporary migration buffers
- Legacy data awaiting archive
- Per-tower operational caches

**KV Audit status:** KV_AUDIT_MAR27 identified 10 dead/unused namespaces for deletion. Awaiting manual confirmation before cleanup.

---

## Local Databases

### SQLite: gabriel.db

**Location:** `~/NOIZYLAB/gabriel.db`
**Purpose:** Local development database, offline fallback

This is a local SQLite copy of the core GABRIEL schema. Used for:
- Development and testing without hitting Cloudflare D1
- Offline operation when internet is unavailable
- Quick queries and debugging
- Backup target for n8n Memcell Backup workflow (runs at 03:00 daily)

**Schema mirrors** the D1 agent-memory database structure. Not guaranteed to be in sync with production — always treat D1 as the source of truth.

---

## Database Rules

1. **D1 is source of truth** for all production data. Local SQLite is development only.
2. **Never write to D1 directly** from scripts. All writes go through GABRIEL or heaven worker.
3. **KV is cache, not storage.** If a KV namespace is lost, it can be rebuilt from D1.
4. **Consent data is immutable.** The `consent_audit` table is append-only. Never update or delete rows.
5. **Provenance chains are cryptographic.** Each entry references the hash of the previous entry. Breaking the chain invalidates downstream records.
6. **Royalty data must include the 75/25 split.** Any `creator_splits` row with creator_share < 0.75 is a data integrity violation.
7. **Dead databases stay dead.** Never resurrect `gabriel_db` / `f75939d5`. The split into three databases was deliberate.
