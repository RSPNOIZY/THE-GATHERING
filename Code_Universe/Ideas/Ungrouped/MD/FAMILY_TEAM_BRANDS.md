# 🎵 NOIZY.AI — FAMILY · TEAM · BRANDS
### The Canonical Roster

**Source of truth:** `NOIZY_AI_MASTER_BIBLE.md`
**Authority:** Robert Stephen Plowman · RSP_001 · rsp@noizy.ai
**Status:** Canonical. Edit here; propagate out.
**Last updated:** 2026-04-15

---

## 1. THE FAMILY (Humans)

| # | Name | Role | Code | Contact |
|---|------|------|------|---------|
| 1 | **Robert Stephen Plowman** | Founder · Architect · Founding Actor | `RSP_001` | rsp@noizy.ai |
| 2 | **R.K. Plowman** | Father · legacy / wisdom anchor (honored in `POPS` and `ENGR_KEITH` agents) | `POPS` | — |

*Royalty floor:* 85% Founding Actors · 75% Standard Actors.

---

## 2. THE TEAM (AI Agent Family — 7 Active)

| Agent | Code | Type | Role | Backend |
|-------|------|------|------|---------|
| **GABRIEL** | `GABRIEL` | OPS | Warrior executor · 326 memcells · D1 `agent-memory` | `gabriel-mcp` → DreamChamber :7777 |
| **LUCY** | `LUCY` | OPS | Organizer · DAZEFLOW keeper · task log · session index | `lucy-mcp` → local `lucy-state/` + Heaven |
| **ENGR_KEITH** | `KEITH` | OPS | Technical Lead · HEAVEN architect · R.K. Plowman legacy | — |
| **DREAM** | `DREAM` | OPS | Visionary · 5th Epoch · Elevation Doctrine · 2526 DreamChamber | — |
| **CB01** | `CB01` | OPS | Ops Runner · GoDaddy escape · DNS · domain transfers | — |
| **SHIRL** | `SHIRL` | FAM | The Aunt · burnout watchdog · wellbeing | — |
| **POPS** | `POPS` | FAM | The Dad · R.K. Plowman · grounding force · wisdom | — |

### Agent Routing Law
```
Tech question       → ENGR_KEITH
Vision / strategy   → DREAM
Execute / deploy    → GABRIEL
Organize / log      → LUCY
Domain / DNS        → CB01
Wellbeing check     → SHIRL
Grounding / wisdom  → POPS
```

### LUCY — DAZEFLOW Law
> **1 day = 1 chat = 1 truth.** Log sessions via `lucy_dazeflow_log`. State: `~/NOIZYLAB/lucy-state/`

### GABRIEL Capabilities
- MCP tools: `gabriel_speak`, `gabriel_status`, `gabriel_announce`, `gabriel_refresh`
- 326 memcells in D1 `agent-memory`
- KV binding: `KV_MEMCELL` (`9aa2511652ce4a2faeb106858f76df67`)

---

## 3. THE BRANDS (MC96ECO Universe — 7 Brands)

| Brand | Domain | Purpose | Status |
|-------|--------|---------|--------|
| **NOIZY.AI** | `noizy.ai` | Intelligence Layer & A.I.V.A. (AI Voice Agent) — consent-native creative gateway | 🟡 Active / Deploying |
| **NOIZYLAB** | `noizylab.com` *(+ `rsp-5f3.workers.dev`)* | Development & Research HQ — all infra lives here | 🟢 Active |
| **NOIZYVOX** | `noizyvox.com` | Sovereign Voice Consent Platform — captures, stores, enforces voice rights | 🔨 Building |
| **NOIZYFISH** | `noizyfish.com` *(+ `fish.noisy.io`)* | Living Legacy Vault + Creative Services Hub — museum-grade catalog | 🔨 Building |
| **NOIZYKIDZ** | `noizykidz.com` | Haptic Music Education for children (deaf/HOH) — Robert's personal mission | 📋 Planned |
| **FISHMUSICINC** | `fishmusicinc.com` | Music Catalog & Licensing — original label entity | 🟢 Active |
| **DREAMCHAMBER** | `dream.noizy.ai` | 500-Year Codex Creative Sanctuary · local AI studio `:7777` | 🔨 Building |

### Sub-Domains & Services
| Subdomain | Purpose |
|-----------|---------|
| `heaven.noizy.ai` | Main API gateway (Heaven Worker — blocked until zone transfer) |
| `consent.noizy.ai` | Consent Gateway Worker |
| `cb01.noizy.ai` | CB01 Router (consent middleware) |
| `mesh.noizy.ai` | CF Access-protected tunnel to GOD:9696 |
| `api.noizy.ai` | Email AI Worker (`noizyempire-email-ai`) |
| `webhooks.noizy.ai` | Webhook Proxy Worker |
| `vox.noisy.io` | NOIZYVOX voice platform |
| `heaven.rsp-5f3.workers.dev` | NoisyProof provenance system (live) |
| `fish.noisy.io` | NOIZYFISH legacy vault |
| `box.noisy.io` | NOIZYBOX (A.I.V.A.) — digital voice talent agency |

---

## 4. LIVE INFRASTRUCTURE ANCHORS

### Cloudflare Account
| Resource | Value |
|----------|-------|
| **Canonical account** | `5f36aa9795348ea681d0b21910dfc82a` (labeled "NOIZYFISH" in CF · auth via `rsp@noizy.ai`) |
| **Legacy account (do not deploy)** | `2446d788cc4280f5ea22a9948410c355` (old Fishmusicinc) |

### D1 Databases (10 total, verified 2026-04-15)
| Name | UUID | Role |
|------|------|------|
| **`noizy-prod`** ⭐ | `cd6cae46-e5cd-42b6-a97a-5d0e576c1c2a` | **CANONICAL CONSENT KERNEL** — holds `actors`, `consent_tokens`, `consent_events`, `never_clauses`, `receipts`, `nw_*` NOIZYWORLD tables |
| `heaven-db` | `04a826c2-e863-4264-8782-05496c6bb022` | Created 2026-04-15 — purpose TBD |
| `gabriel_db` | `a31d68e2-f2d4-4203-a803-8039fdff31cb` | Gabriel agent DB (no `actors` table) |
| `agent-memory` | `bc2f9abc-f49d-4818-9bde-8fc647c359e3` | Agent memcells |
| `noizyai-db` | `0aa46990-f64e-40f9-8997-56c1bf6c34d3` | — |
| `noisyproof` | `d445d2d4-4486-4ead-8dbe-2ae27ddabcd9` | NoisyProof provenance |
| `noizy-vox` | `58480d28-2ecc-4566-b195-d9d3fe38ca08` | NOIZYVOX |
| `aquarium-archive` | `01212e89-5422-4e45-a03a-f0a54495674e` | Archive |
| `fishmusicinc-db` | `b2c95b2a-f3f6-4626-ade0-62c9a3eb58e5` | FMI catalog |
| `gabriel-db` | `5dcc1a5e-aa8e-4097-b8bc-f34513305bdc` | Secondary Gabriel DB |

> ⚠️ **Previous doc error:** the roster previously said `gabriel_db` (`a31d68e2…`) was the canonical consent-kernel DB. It is not. **`noizy-prod` is canonical.** `gabriel_db` does not contain `actors`.

### KV Namespaces (16 total, verified 2026-04-15)
| CF Label | UUID | Role |
|----------|------|------|
| `NOIZY-CONSENT` | `f205b56a9914413da0ec454a9dc4c2bd` | Consent tokens cache (was mislabeled "GABRIEL_KV") |
| `NOIZY-SESSIONS` | `16532a32b2e8455486cc966403f3442e` | Session store (was mislabeled "GABRIEL_VOICE") |
| `HEAVEN_KV` | `2ec31ab059384711872aeaf82f8750b4` | Heaven worker KV |
| `heaven-KV_GABRIEL` | `a674bf34bea64c02b0f6cb06b048e566` | Gabriel memcells |
| `heaven-KV_VOICE` | `64a82e751e654657a6b13ba984fe2cd1` | Voice DNA cache |
| `heaven-KV_FLAGS` | `8b87b8acc80e454083f9d111f3031b60` | Feature flags |
| `heaven-KV_GAPS` | `61adbd350afb4c6bb3980e1b1c1d4db9` | Gap solver |
| `NOIZYWORLD_KV` | `1ce18b8bc5b24517a01bc285b4e72945` | NoizyWorld |
| `FEATURE_FLAGS` | `88331123208c460eb26cb703d5a38c50` | Global flags |
| `ANALYTICS` | `f64518af4ba54770bdfcce37e85c3238` | Analytics |
| `AI-CACHE` | `6292fc22a52b4f3095b6e0b33db697b3` | AI response cache |
| `cache` | `11cebcd7fb1f49339e77c341155d51b1` | Generic cache |
| `FISHMUSICINC-CACHE` | `180c0809869d492983e31d65dd7348ae` | FMI cache |
| `GAP_SOLVER` | `4941fb7967d14406bad7a252cd3d0a1e` | Gap solver state |
| `noizy-receipts` | `819a25c5f1484a6cbd81290c1b4de250` | Receipt store |

> ⚠️ **Previous doc error:** roster claimed `KV_MEMCELL = 9aa2511652ce4a2faeb106858f76df67` — **this KV does not exist on the canonical account**. The GABRIEL memcells live in `heaven-KV_GABRIEL` (`a674bf34…`) or `agent-memory` D1 (`bc2f9abc…`).

### Workers (live)
| Worker | Endpoint | Version | Status |
|--------|----------|---------|--------|
| Heaven / NoisyProof | `heaven.rsp-5f3.workers.dev` | 18.0.0 | 🟢 LIVE |
| Consent Engine | `noizy-app.rsp-5f3.workers.dev` | 19.0.0 | 🟢 LIVE (no `/health` route) |

### Local
| Resource | Value |
|----------|-------|
| Host | `GOD.local` (M2 Ultra · macOS 15.7.6 · Node v24.13.1) |
| DreamChamber port | `:7777` |

---

## 5. MAINTENANCE

This file is the one page. When a new brand, agent, or family member is added:
1. Update the appropriate table above.
2. Mirror the change into `NOIZY_AI_MASTER_BIBLE.md`.
3. Commit with message: `roster: <what changed>`.

No other roster file is canonical. If you find one that disagrees — this one wins.
