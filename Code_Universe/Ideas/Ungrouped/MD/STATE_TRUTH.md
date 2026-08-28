# STATE OF THE EMPIRE — VERIFIED GROUND TRUTH

**Generated**: 2026-04-20 (session: CLEAN UP & FIX & FIND ALL)
**Method**: live socket probes, binary checks, filesystem scans — no claims accepted without verification.
**Supersedes**: aspirational claims in `CLAUDE.md` "WHAT'S LIVE NOW" table until that table is updated against this document.

---

## 1. Identity — this machine

| Field           | Value                                            | Source                                   |
| --------------- | ------------------------------------------------ | ---------------------------------------- |
| mDNS hostname   | `GABRIEL.local` (pending rename to `GOD`)        | `scutil --get LocalHostName`             |
| Computer name   | `M2Ultra's Mac Studio` (pending rename to `GOD`) | `scutil --get ComputerName`              |
| Tailscale node  | `m2ultras-mac-studio.tail03d17f.ts.net`          | `tailscale status --json`                |
| Doctrine target | `GOD.local`                                      | `CLAUDE.md`, `.claude/rules/identity.md` |

**Drift**: OS + Tailscale + doctrine are three different names. Rename command prepared; sudo pending operator action.

---

## 2. Services — what is actually running on GOD right now

| Service          |                   Port | State           | Notes                                                   |
| ---------------- | ---------------------: | --------------- | ------------------------------------------------------- |
| Consul (dev)     | 8500, 8300, 8301, 8600 | ✅ LIVE         | dc1, leader elected, v1.22.6                            |
| Vault (dev)      |                   8200 | ✅ LIVE         | unsealed, `vault-cluster-4e20fb39`, v2.0.0              |
| n8n              |                   5678 | ✅ LIVE         | Docker (`noizy-n8n`), basic-auth enabled                |
| n8n Postgres     |        5432 (internal) | ✅ LIVE         | Docker (`noizy-n8n-postgres`)                           |
| Ollama           |                  11434 | ✅ LIVE         |                                                         |
| Tailscale daemon |                  (n/a) | ✅ LIVE         | v1.96.2 daemon, v1.96.4 client                          |
| scan-server      |                   9797 | ✅ LIVE         | HTTP bridge for host volume scans                       |
| GABRIEL daemon   |                   9777 | ❌ NOT RUNNING  | CLAUDE.md claims LIVE — **FALSE**                       |
| DreamChamber     |                   7777 | ❌ NOT RUNNING  | CLAUDE.md claims LOCAL — **FALSE**                      |
| AirPlay server   |              (various) | ❌ NOT VERIFIED | `apps/noizy-airplay/src/server.js` patched, not started |

---

## 3. Service discovery — Consul catalog

| Service                 | Health     | Tags                       | DNS                 |
| ----------------------- | ---------- | -------------------------- | ------------------- |
| `n8n.service.consul`    | ✅ passing | nervous-system, mcp-bridge | → `127.0.0.1:5678`  |
| `ollama.service.consul` | ✅ passing | shirley, gemma             | → `127.0.0.1:11434` |

Consul is in dev mode — registrations are **in-memory only**. Durable definitions live at `infra/hashicorp/consul/services/*.json` and will re-register on any Consul restart.

---

## 4. Tailscale mesh

| Node                                 | IP              | State                                    |
| ------------------------------------ | --------------- | ---------------------------------------- |
| `m2ultras-mac-studio` (this machine) | 100.65.173.68   | ✅ online                                |
| `ipad-pro-12-9-gen-2`                | 100.93.41.54    | ✅ online                                |
| `iphone-15-pro`                      | 100.119.178.114 | ✅ online                                |
| `gabriel` (Windows)                  | 100.108.180.28  | ❌ offline 49+ days — **PHANTOM, prune** |

MICKY-P not on mesh. Audio drives already locally mounted on GOD — scan runs locally, no network bridge needed.

---

## 5. Storage — mounted volumes on GOD

15+ physical volumes. Full scan running (task `bqw7ksazb`) — per-volume audit docs in `infra/scans/scan-reports/<slug>/<timestamp>/`. Red flags already visible:

| Volume                   | Status                       |
| ------------------------ | ---------------------------- |
| `/Volumes/SAMPLE_MASTER` | ⚠️ **100% full** (38Mi free) |
| `/Volumes/4TB BLK`       | ⚠️ **100% full** (17Gi free) |
| `/Volumes/6TB`           | 🟡 86% used                  |
| `/Volumes/MAG 4TB`       | 🟡 80% used                  |
| `/Volumes/2TB_SGW`       | 🟡 66% used                  |
| All others               | OK                           |

---

## 6. Drift catalog (as of this session)

| Drift                                              | Where                                |                      Count | Fix Status                                               |
| -------------------------------------------------- | ------------------------------------ | -------------------------: | -------------------------------------------------------- |
| `GABRIEL.local` in live files                      | design doc, arch doc, airplay server |                    3 files | ✅ PATCHED                                               |
| `GABRIEL.local` in frozen records                  | backups, postmortems                 |                    3 files | skip (historical)                                        |
| `:9777` phantom daemon refs                        | architecture docs, CLAUDE.md         |                  ~30 files | ⏸️ pending evaluation (docs describe aspirational state) |
| `rsplowman@icloud.com` vs `rsp@noizy.ai`           | mixed                                |                  ~30 files | ⏸️ evaluate per-file (personal vs brand-facing)          |
| `noizy.ai` / `NOIZYVOX` / etc. (brand misspelling) | code + docs                          | 372 occurrences / 50 files | 🏃 fixer ready, dry-run v2 in flight                     |
| CLAUDE.md "WHAT'S LIVE NOW" accuracy               | root                                 |                     1 file | ⏸️ needs rewrite against section 2 above                 |

---

## 7. Artifacts created this session

```
infra/scans/
├── scan-volume.sh          per-volume audit (runnable standalone or via HTTP)
├── scan-all.sh             fans scan-volume.sh across every /Volumes/ mount
├── scan-server.py          HTTP bridge on :9797 so n8n can trigger host scans
├── micky-p-audit.sh        multi-volume audit script (kept for non-local hosts)
└── scan-reports/           per-volume audit.md + summary.json, by timestamp

infra/hashicorp/consul/services/
├── n8n.json                durable registration
└── ollama.json             durable registration

infra/n8n-docker/
├── workflows/noizy-volume-scan.json    fanout workflow (Manual → /volumes → split → /scan → aggregate)
└── import-workflow.sh      basic-auth-aware importer (reads .env, posts to /rest/workflows)

ops/
└── noizy-fix.sh            patched to accept ROOT env var + exclude self/historical/worktrees
```

---

## 8. Operator actions still pending

1. **Paste the hostname-rename one-liner** — realigns OS + Tailscale to `GOD.local`
2. **Prune phantom Tailscale `gabriel` (Windows) node** — via https://login.tailscale.com/admin/machines
3. **Authorize brand fixer run** — pending dry-run v2 review
4. **Rewrite `CLAUDE.md` "WHAT'S LIVE NOW" table** — against section 2 above
5. **Decide on full drives** (`SAMPLE_MASTER`, `4TB BLK`) — audit first, then prune

---

_This document replaces aspirational status claims with verified-at-generation-time state. Treat it as ground truth until its own timestamp feels stale — then re-verify._
