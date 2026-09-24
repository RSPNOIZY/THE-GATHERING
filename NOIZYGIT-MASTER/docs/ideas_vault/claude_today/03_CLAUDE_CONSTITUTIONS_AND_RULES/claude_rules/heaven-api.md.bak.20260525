---
description: Heaven Cloudflare Worker API — endpoints, database schema, KV namespaces, infrastructure IDs.
paths:
  - "src/index.js"
  - "src/dashboard.js"
  - "wrangler.toml"
  - "schema.sql"
  - "seed.sql"
---

# HEAVEN — CONSENT KERNEL API

## Live Infrastructure

- **URL**: `https://heaven.rsp-5f3.workers.dev`
- **Auth**: `X-NOIZY-Key` header (except /health, /dashboard, /)
- **Source**: `src/index.js` + `src/dashboard.js`
- **Version**: v18.0.0 — 55 authenticated REST endpoints
- **Deploy**: `npx wrangler deploy` from project root

## Infrastructure IDs (AUTHORITATIVE — updated 2026-03-30)

```
Worker:        heaven @ heaven.rsp-5f3.workers.dev
D1 Database:   gabriel_db — a31d68e2-f2d4-4203-a803-8039fdff31cb  ← LIVE
               ⚠️ f75939d5 = DEAD. Never use.
GABRIEL_KV:    f205b56a9914413da0ec454a9dc4c2bd
GABRIEL_VOICE: 16532a32b2e8455486cc966403f3442e
NOIZY_API_KEY: in .env (NEVER COMMIT)
```

## Database: gabriel_db (25 tables + 9 views)

| Table | Status | Notes |
|-------|--------|-------|
| hvs_actors | Seeded | RSP_001 founding actor |
| hvs_never_clauses | Seeded | 9 clauses (6 personal + 3 system) |
| hvs_voice_dna | Live | Ready for first recording |
| hvs_descendants | Live | Synthetic voice models |
| hvs_consent_tokens | Live | Scoped, revocable tokens |
| hvs_synth_requests | Live | Never Clause checked on every request |
| hvs_licenses | Live | License registry |
| hvs_licensees | Live | Licensee registry |
| hvs_rate_table | Seeded | 10 use categories |
| hvs_union_tiers | Seeded | 5 tiers (2%→10%) |
| hvs_estates | Seeded | EST-RSP-001 active |
| hvs_premis_events | Live | OAIS/PREMIS archival events |
| noizy_ledger | Seeded | GENESIS-RSP-001 entry |

Views: kpi_trust, kpi_safety, kpi_revenue, kpi_quality, kpi_risk, enterprise_audit + 3 more

## KV Namespaces

| Binding | Purpose | Caching |
|---------|---------|---------|
| GABRIEL_KV | Rate limiting (60 req/min/IP) + response caching | health 30s, actors 5min, rate-table 10min, union-tiers 1hr |
| GABRIEL_VOICE | Voice asset storage | — |

Cache invalidation fires on all write operations.

## Key API Patterns

- All endpoints return JSON with `{ success, data?, error?, timestamp }`
- Auth failures return 401 with `{ error: "Unauthorized" }`
- Never Clause violations return 403 with clause details
- POST operations log to noizy_ledger automatically
- C2PA content credentials attached to synth request responses
- New endpoint: `GET /api/v1/synth-requests/:id/c2pa` for credential retrieval

> **Skill**: Use `heaven-dev` skill when adding new endpoints. Use `consent-audit` before deploying.

## Verified D1 Databases (2026-03-25)

| Database | ID | Size | Purpose |
|----------|-----|------|---------|
| gabriel_db | a31d68e2-f2d4-4203-a803-8039fdff31cb | 565KB | Primary consent kernel |
| agent-memory | 7b813205-fd12-4a23-84a6-ce83bc49ec70 | 2.5MB | Agent persistent memory |
| noizyanthropic | 932e36f7-b5a9-4063-a8d2-4e88cfc874c5 | 80KB | Anthropic integration |

## Verified KV Namespaces (2026-03-25)

| Binding | ID | Purpose |
|---------|-----|---------|
| GABRIEL_KV | f205b56a9914413da0ec454a9dc4c2bd | Rate limiting + cache |
| GABRIEL_VOICE | 16532a32b2e8455486cc966403f3442e | Voice asset storage |

Note: KV IDs match wrangler.toml bindings. Verified 2026-04-13.
