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
| `vox.noisy.io` | NoisyVox voice platform |
| `heaven.rsp-5f3.workers.dev` | NoisyProof provenance system (live) |
| `fish.noisy.io` | NoisyFish legacy vault |
| `box.noisy.io` | NoisyBox (A.I.V.A.) — digital voice talent agency |

---

## 4. LIVE INFRASTRUCTURE ANCHORS

| Resource | Value |
|----------|-------|
| **Canonical Cloudflare account** | `5f36aa9795348ea681d0b21910dfc82a` (HEAVEN · `rsp@noizy.ai`) |
| **Canonical D1 (`gabriel_db`)** | `a31d68e2-f2d4-4203-a803-8039fdff31cb` |
| **Agent memory D1** | `7b813205-fd12-4a23-84a6-ce83bc49ec70` |
| **Primary KV (`GABRIEL_KV`)** | `f205b56a9914413da0ec454a9dc4c2bd` |
| **Voice KV (`GABRIEL_VOICE`)** | `16532a32b2e8455486cc966403f3442e` |
| **Local host** | `GOD.local` (M2 Ultra · macOS 15.7.6 · Node v24.13.1) |
| **DreamChamber port** | `:7777` |

> ⚠️ **THE LAW:** Deploy production only to the HEAVEN Cloudflare account. The Fishmusicinc account (`2446d788cc4280f5ea22a9948410c355`) is legacy; its `gabriel_db` is dead/empty.

---

## 5. MAINTENANCE

This file is the one page. When a new brand, agent, or family member is added:
1. Update the appropriate table above.
2. Mirror the change into `NOIZY_AI_MASTER_BIBLE.md`.
3. Commit with message: `roster: <what changed>`.

No other roster file is canonical. If you find one that disagrees — this one wins.
