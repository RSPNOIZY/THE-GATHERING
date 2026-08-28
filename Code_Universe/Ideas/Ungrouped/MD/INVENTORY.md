# CLOUDFLARE ALIGNMENT · INVENTORY

**Mission:** align every Cloudflare asset under `rsp@noizy.ai` (account `5f36aa9…`), the canonical identity.
**Source account (today):** Fishmusicinc (`2446d788cc4280f5ea22a9948410c355`) — where storage lives.
**Target account:** rsp@noizy.ai (`5f36aa9795348ea681d0b21910dfc82a`) — where most Workers live.
**Inventoried:** 2026-04-18 via Cloudflare MCP
**Auth reach today:** MCP sees **ONLY Fishmusicinc**. Target account requires its own token to enumerate.

---

## 🚨 The cross-account problem (why this alignment is urgent)

Cloudflare **does not support cross-account bindings**. A Worker deployed on account A cannot bind to a KV namespace or D1 database on account B. Today the empire is split:

```
┌─────────────────────────────────┐      ┌─────────────────────────────────┐
│  Fishmusicinc  (2446d788…)      │      │  rsp@noizy.ai  (5f36aa9…)       │
│  ───────────────────────────    │      │  ───────────────────────────    │
│  6 D1 databases                 │      │  Heaven Worker (per CLAUDE.md)  │
│  19 KV namespaces               │◄──X──│  noizy-landing Worker           │
│  1 Worker (`deploy`)            │  no  │  (more Workers expected)        │
│  0 R2 buckets (not enabled)     │ bind │  ? D1 · ? KV · ? R2             │
│  0 Hyperdrive                   │      │  (not enumerable from here)     │
└─────────────────────────────────┘      └─────────────────────────────────┘
```

Every Worker on rsp@noizy.ai that references `HEAVEN_KV`, `GABRIEL_KV`, `agent-memory`, or `gabriel_db` **cannot bind to them as they exist today.** Either those resources are duplicated on both accounts (drift risk) or the Workers haven't deployed yet (BLOCK 1 still open).

**Alignment = pick one account, move everything there, flip bindings, delete the other.**

---

## 📦 FISHMUSICINC — full source inventory

### D1 Databases · 6

| Name                 | UUID                                   | Created    | Size   | Role                                                                                                                                                                                                                                         |
| -------------------- | -------------------------------------- | ---------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gabriel_db`         | `68ac0f08-c4ee-43ff-9480-366406d41b37` | 2026-04-06 | 152 KB | **HVS sovereignty lattice** — 15 hvs\_\* tables (actors, voice_dna, consent_tokens, estates, descendants, licenses, never_clauses, premis_events, union_tiers, rate_table, synth_requests) + jurisdiction_rules + noizy_ledger               |
| `agent-memory`       | `b5b58cc9-1f37-4000-adc5-12f9e419662f` | 2026-04-11 | 123 KB | **Operational layer** — 15 tables (memcells, agent_registry, gospel_deal, consent_log, vox_talent_profiles, gabriel_commands, doctrine_lines, dreed_registry, lucy_observations, noizy_empire, ops_accounts, ops_platforms, system_failures) |
| `integration-events` | `74633734-2bc5-4330-85ae-81de3e652cbd` | 2026-04-13 | 37 KB  | Events stream (schema unverified)                                                                                                                                                                                                            |
| `consent_db`         | `c5547f69-0541-4d1a-bd80-a2f328806513` | 2026-04-16 | 115 KB | visitor_consent + consent_audit                                                                                                                                                                                                              |
| `catalogue_db`       | `ce0b93f2-45a0-4196-ac56-7b6236aa279f` | 2026-04-16 | 111 KB | aquarium_assets + royalty_events + 75/25 CHECK constraint                                                                                                                                                                                    |
| `manifest_db`        | `784ad160-010e-475b-8885-d800945bf945` | 2026-04-16 | 74 KB  | CI/CD backbone + **10 feature flags** (all enabled=0)                                                                                                                                                                                        |

**Total source D1:** ~612 KB across 6 DBs. Migration via `wrangler d1 export` → `wrangler d1 execute --file` on target account.

### KV Namespaces · 19

| Bucket                     | Namespace                                                                                                                                                                                              | Purpose                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| **Per-brand caches (7)**   | `noizy-cache-noizy-ai` · `noizy-cache-noizyfish` · `noizy-cache-noizyvox` · `noizy-cache-noizylab` · `noizy-cache-noizykidz` · `noizy-cache-noizykids` (legacy? dup of -noizykidz) · `noizy-cache-hvs` | per-brand edge cache             |
| **Agent state (4)**        | `GABRIEL_KV` · `GABRIEL_VOICE` · `LUCY_CACHE` · `LUCY_SESSIONS`                                                                                                                                        | agent runtime state              |
| **System (5)**             | `HEAVEN_KV` · `KV_CONFIG` · `KV_TOKENS` · `FEATURE_FLAGS` · `GAP_SOLVER`                                                                                                                               | cross-cutting infra              |
| **Consent + sessions (3)** | `noizy-session-kv` · `noizy-consent-kv` · `noizy-signups`                                                                                                                                              | session + consent + signup flows |

**Flag:** `noizy-cache-noizykids` (with 's') AND `noizy-cache-noizykidz` (with 'z') both exist. One is stale — likely the 's' variant predates the canonical NOIZYKIDZ spelling. **Candidate for deletion, not migration.**

### Workers · 1

| Name     | Created    | Notes                                                                                     |
| -------- | ---------- | ----------------------------------------------------------------------------------------- |
| `deploy` | 2025-12-02 | Solo. Probably a legacy scratch Worker — name is generic, no matching CLAUDE.md reference |

**Implication:** the real compute (Heaven, noizy-landing, GABRIEL, MCP) lives on the OTHER account. Storage here, compute there — the exact split the alignment must close.

### R2 Buckets · 0 (BLOCKED)

```
Error 10042: Please enable R2 through the Cloudflare Dashboard.
```

This is **BLOCK 2** on the critical path ("Enable Cloudflare R2 for voice storage"). R2 must be enabled before Voice DNA vault can land. If we're moving to rsp@noizy.ai anyway, enable R2 **on rsp@noizy.ai**, not Fishmusicinc.

### Hyperdrive · 0

None configured. Ignorable for now.

---

## 🎯 TARGET — rsp@noizy.ai (not reachable from this MCP session)

To be filled in when a token scoped to this account is available. Expected contents based on CLAUDE.md + memcells:

- **Workers (expected):** `heaven` (v18.0.0, 43 endpoints, noizy.ai zone) · `noizy-landing` · future `gabriel` (my scaffold, pending deploy) · future `noizy-mcp` (mcp.noizy.ai)
- **D1 (expected):** likely `gabriel_db` duplicated here (CLAUDE.md lists `a31d68e2-…` which is NOT on Fishmusicinc — suggests a mirror DB exists on rsp@noizy.ai)
- **KV (expected):** CLAUDE.md lists `GABRIEL_KV: f205b56a…` and `GABRIEL_VOICE: 16532a32…` — UUIDs that do NOT match the Fishmusicinc namespaces. Same names, different accounts. **Drift confirmed.**
- **R2 (required):** enable here, not on Fishmusicinc.
- **Custom Domains:** `noizy.ai`, `gabriel.noizy.ai`, `mcp.noizy.ai`, `metabeast.noizy.ai`, `heaven.rsp-5f3.workers.dev`

---

## 🪪 CANONICAL IDENTITY (verified 2026-04-18 by Rob)

| Field                         | Value                                                                 | Status                                                                                  |
| ----------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Email                         | `rsp@noizy.ai`                                                        | canonical · routed via CF Email Routing to iCloud                                       |
| GitHub                        | [`github.com/RSPNOIZY`](https://github.com/RSPNOIZY)                  | canonical (user account, NOT org)                                                       |
| GitHub orgs                   | —                                                                     | **none** · `noizy-anthropic` org referenced in CLAUDE.md BLOCK 5 does **not** exist yet |
| GitHub repo count             | 15 (7 public · 8 private)                                             | enumerated via `gh api users/RSPNOIZY/repos`                                            |
| Profile bio                   | "THE FUTURE IS UNWRITTEN"                                             |                                                                                         |
| Account created               | 2026-03-29                                                            | 20 days old — intentionally fresh handle for the empire                                 |
| `gh auth status` on GOD.local | ✓ active · scopes: `repo, workflow, read:org, admin:public_key, gist` | usable this session                                                                     |

### Code ↔ Cloud binding (what lives where)

| GitHub repo                                             | Intended Cloudflare home     | Notes                                                                                         |
| ------------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------- |
| `NOIZYANTHROPIC` 🔒                                     | rsp@noizy.ai account         | **this repo** — Claude-facing empire control plane                                            |
| `THE-GATHERING` 🌐 + `RSPNOIZY-THE-GATHERING` 🔒        | rsp@noizy.ai account         | migration target · twin repos (public shell + private guts)                                   |
| `CLAUDE-TODAY` 🔒                                       | —                            | matches path in memcell `deploy_command` — Rob's active Desktop dir, mirrored to private repo |
| `DREAMCHAMBER` 🌐 + `THE-DREAMCHAMBER` 🌐               | rsp@noizy.ai account         | DreamChamber surfaces                                                                         |
| `NOIZYFISH` 🌐                                          | rsp@noizy.ai · noizyfish.com | brand repo                                                                                    |
| `NOIZYKIDZ` 🌐                                          | rsp@noizy.ai · noizykidz.com | brand repo · "Haptic music education. Deaf-first. Autism-calm."                               |
| `NOIZYLAB` 🌐                                           | rsp@noizy.ai · noizylab.ca   | brand repo · **PROJECT_001_NEW_LEARNING_IDEAS lives here**                                    |
| `NOIZYVOX` 🔒                                           | rsp@noizy.ai · noizyvox.com  | brand repo (private — pre-launch)                                                             |
| `MC96ECO` 🔒 · `ARCHIVE` 🔒 · `noizy-claude-archive` 🔒 | archival                     | historical layers · not active targets                                                        |
| `RSPNOIZY` 🌐                                           | —                            | profile README only                                                                           |
| `desktop-tutorial` 🔒                                   | —                            | tutorial scratch                                                                              |

### Identity implications for the alignment

1. **BLOCK 5 reframed:** "consolidate under noizy-anthropic org" is a future move — the org doesn't exist. Decision point: create `noizy-anthropic` org and migrate repos, OR keep everything under the RSPNOIZY user account. Rob's directive today names RSPNOIZY as canonical, so **user-level consolidation is the working plan** unless he creates the org.
2. **Single-identity leverage:** rsp@noizy.ai + RSPNOIZY GitHub + `gh auth` already live on GOD.local means nearly every migration step can execute from this machine without additional auth, once the Cloudflare API token is scoped to the target account.
3. **Cross-reference with memcell `email_canonical`:** rsp@noizy.ai is already the empire's canonical email. Cloudflare account rename from "Fishmusicinc" → "NOIZY.AI" is a post-migration cosmetic step; it does not gate anything.

---

## 🔁 Alignment sequence (5 phases, each a compartment)

| Phase                       | What                                                                                                                                                                                                                                                            | Gate                    | Reversible?                                                  |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------ |
| **0 · Auth token**          | Create a CF API token scoped to BOTH accounts (or separate tokens for source/target) with `Account:D1:Edit`, `Account:KV:Edit`, `Account:Worker:Edit`, `Account:R2:Edit`, `Zone:Read`. Add to `.env` as `CLOUDFLARE_API_TOKEN`.                                 | —                       | yes — rotate anytime                                         |
| **1 · Enumerate target**    | Set active account to `5f36aa9…`, re-run this inventory script, fill in the target section above. Produce drift table: what's on both, what's only-source, what's only-target.                                                                                  | token live              | read-only                                                    |
| **2 · Data migration (D1)** | For each of 6 D1 dbs: `wrangler d1 export <name> --remote` on Fishmusicinc → create matching DB on rsp@noizy.ai → `wrangler d1 execute --remote --file <export>.sql` to restore. Verify row counts match.                                                       | drift table             | **destructive if typo'd** — keep source intact until phase 5 |
| **3 · KV migration**        | For each of 19 KV namespaces: create matching namespace on target → bulk-copy keys via `wrangler kv bulk` or Python SDK. Note: `noizy-cache-noizykids` (legacy spelling) → skip, do not recreate.                                                               | data migration verified | reversible — keep source                                     |
| **4 · Worker rebinding**    | Edit every `wrangler.jsonc`/`wrangler.toml` to swap `account_id` + all D1 `database_id`s + all KV `id`s to the new target UUIDs. Test with `wrangler deploy --dry-run` on each. Deploy in order: heaven → gabriel → noizy-mcp → noizy-landing. Smoke-test each. | all data mirrored       | reversible by reverting config                               |
| **5 · Decommission**        | Only after target is proven green for 48h: delete Fishmusicinc D1/KV/Workers. Close Fishmusicinc account if no other dependencies.                                                                                                                              | 48h clean               | **irreversible**                                             |

Each phase should ship as its own compartment/file:

```
DIRECTORY/CLOUDFLARE_ALIGNMENT/
├── INVENTORY.md              ← this file
├── PHASE_0_token.md          (next, once Rob greenlights)
├── PHASE_1_target_enum.md
├── PHASE_2_d1_migration.md
├── PHASE_3_kv_migration.md
├── PHASE_4_worker_rebind.md
└── PHASE_5_decom.md
```

---

## 📌 Parallel decisions Rob should lock in before Phase 2

1. **Canonical direction** — memcell `cf_accounts` from 2026-04-13 says _Fishmusicinc is canonical_. Today's directive says _align INTO noizy.ai_. **Directive wins.** Update the memcell to reflect new canonical = `5f36aa9…`.
2. **Email canonical** — rsp@noizy.ai is already the email-routing canonical per `email_canonical` memcell. The account-level alignment matches that.
3. **Naming drift resolution** — `noizy-cache-noizykids` (dead) vs `noizy-cache-noizykidz` (live). Decide: delete the `noizykids` namespace without migrating.
4. **Spiritual name** — account label can be renamed post-migration. "Fishmusicinc" refers to the legacy corp; "NOIZY.AI" is the forward brand.

---

## 🔒 What I will NOT do without explicit go-ahead

- Delete anything on Fishmusicinc
- Disable R2 anywhere
- Point DNS records to the new account
- Close the Fishmusicinc account
- Move `rsp@noizy.ai` email routing (it already lives on the target)

These are the irreversible edges. Every phase above is designed to preserve both accounts in parallel until phase 5.

---

_Inventoried 2026-04-18 by Claude Code on GOD.local · source MCP session · target enum pending token_
