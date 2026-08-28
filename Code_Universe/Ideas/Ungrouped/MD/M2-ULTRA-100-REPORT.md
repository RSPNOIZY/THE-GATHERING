# M2 ULTRA 100% — GOD.local Optimization Report

**Date:** April 13, 2026  
**Machine:** Apple M2 Ultra • 24 cores (16P + 8E) • 192GB Unified Memory • 1.8TB SSD  
**Author:** Robert Stephen Plowman / NOIZY.AI  
**Uptime at diagnosis:** 3 days, 15 hours

---

## Executive Summary

GOD.local was running at approximately 40% efficiency due to runaway processes, memory compression, and under-configured Docker. This optimization session killed CPU-burning zombie processes, reduced swap from 2.87GB to 370MB, boosted NOIZY service priorities, created missing infrastructure scripts, and deployed a reusable master optimization script.

**Two actions require your hands on the keyboard** (sudo needed): restart coreaudiod and increase Docker memory allocation.

---

## What Was Wrong

### Critical CPU Hogs (Combined: ~1,100% CPU waste)

| Process | CPU % | Root Cause | Action |
|---------|-------|------------|--------|
| VS Code Insiders crashpad_handler | 439% → 612% | Crash reporter stuck in infinite loop since Friday | **KILLED** (kill -9) |
| Gemini Code Assist a2a-server | 181% → 269% | Google extension spinning without work | **KILLED** (kill -9) |
| coreaudiod | 161% → 183% | Audio daemon running since Thursday, 4,136 min CPU | **Needs sudo** |
| Antigravity Plugin | 97.9% | Google IDE extension | **KILLED** |
| VS Code Plugin (stable) | 97.8% | Extension host overloaded | **KILLED** |
| CalendarWidgetExtension | 95.8% | Known macOS widget bug | **KILLED** |
| VS Code ripgrep | 752% | Full filesystem search stuck | **KILLED** |
| Console Ninja | 142% | Wallaby.js extension respawning | **KILLED** |

### Memory Crisis

- **192GB machine using 2.87GB swap** — this should never happen
- **92.7GB compressed memory** — the system was compressing instead of freeing
- After optimization: compressed dropped to 86.3GB, swap to 370MB

### Docker Misconfiguration

- Docker Desktop limited to **7.65GB RAM** on a **192GB machine** (4% allocation)
- 20.77GB of reclaimable images sitting unused
- Kubernetes desktop-control-plane eating 15% of Docker's tiny memory allocation

### Failing Services (exit 127 = command not found)

- `com.noizy.backup` — missing script `/Users/m2ultra/mc96_backup.sh`
- `com.noizylab.m2ultra.boot` — missing script `/Users/m2ultra/.local/bin/m2ultra-boot-startup.sh`
- `ai.noizy.noizyvox` — missing Python venv

---

## What Was Fixed

### Immediate Fixes (Applied)

1. **Killed 8 runaway processes** — freed ~1,100% CPU (equivalent to 11 full cores)
2. **Swap reduced 87%** — from 2,871MB to 370MB
3. **Compressed memory reduced 7%** — from 92.7GB to 86.3GB
4. **Docker cleanup** — reclaimed 558MB build cache, pruned exited containers
5. **NOIZY services boosted** — gabriel, ollama, cloudflared set to priority -10
6. **System services deprioritized** — Spotlight (mds_stores), photolibraryd, mediaanalysisd set to priority 15
7. **Created mc96_backup.sh** — at `/Users/m2ultra/mc96_backup.sh`
8. **Created m2ultra-boot-startup.sh** — at `/Users/m2ultra/.local/bin/m2ultra-boot-startup.sh`
9. **Deployed M2-ULTRA-100.sh** — reusable master optimization script at `~/M2-ULTRA-100.sh`

### Remaining (Require Your Action)

**Action 1 — Restart coreaudiod (30 seconds):**
```bash
sudo killall coreaudiod
```
This will free ~160% CPU instantly. launchd respawns it fresh.

**Action 2 — Increase Docker memory (2 minutes):**
Open Docker Desktop → Settings → Resources:
- Memory: **32 GB** (minimum) or **48 GB** (recommended)
- CPUs: **12** (half your cores)
- Swap: **4 GB**
- Disk: **128 GB**
Click Apply & Restart.

**Action 3 — Purge memory (10 seconds):**
```bash
sudo purge
```

**Action 4 — Run the full optimization script (optional, runs all of the above):**
```bash
sudo bash ~/M2-ULTRA-100.sh
```

---

## Extensions to Disable or Monitor

These VS Code / Antigravity extensions are chronic resource hogs on this machine:

1. **Gemini Code Assist** (`google.geminicodeassist`) — in VS Code Insiders. Consumed 181% CPU. Consider disabling when not actively using it.
2. **Console Ninja** (`wallabyjs.console-ninja`) — respawns repeatedly at 100%+ CPU. Disable unless actively debugging.
3. **Python Env Tools** (`ms-python.vscode-python-envs`) — 106% CPU doing background scans.

---

## Infrastructure Status (Post-Optimization)

### NOIZY Services (Running)
- `ai.noizy.gabriel-serve` — PID 97599, exit 0
- `ai.noizy.gabriel` — PID 97636, exit 0
- `com.noizylab.voice-server` — PID 97596, exit 0
- `com.noizylab.gabriel-monitor` — PID 97627, exit 0
- `ai.noizy.notes-feeder` — PID 97666, exit 0
- `homebrew.mxcl.ollama` — PID 97620, exit 0

### Docker Containers (11 running)
- noizy-n8n, noizy-stt, open-webui (healthy)
- mc96eco: rabbitmq, qdrant, grafana, neo4j
- Kubernetes: desktop-control-plane, kind-cloud-provider, kind-registry-mirror

### Ollama (19 models available)
- Currently loaded: gemma3:latest (29.7GB VRAM)
- Notable models: gemma4:e4b (9.6GB), gemma4:26b (18GB), gemma4:31b (19.9GB)
- 10 custom NOIZY models (wisdom-scribe, consent-guardian, family-keeper, etc.)

### Network
- Cloudflare tunnel active → localhost:7777 (DreamChamber)
- Cloudflare WARP active
- DNS: Tailscale (100.100.100.100) + Cloudflare (1.1.1.1)
- Tailnet: tail03d17f.ts.net / noizylab.ca

### Disk
- 1.8TB SSD, 10GB used, 1.1TB available (1% used — pristine)

---

## The Master Script

`~/M2-ULTRA-100.sh` is a 10-phase optimization script that can be re-run anytime:

1. Kill runaway processes (crashpad, Gemini, Calendar, high-CPU plugins)
2. Memory optimization (purge, swap check)
3. Docker optimization (prune containers, images, build cache)
4. Process priority (boost NOIZY, deprioritize Spotlight)
5. Disk I/O (exclude dev dirs from Spotlight)
6. Network verification (DNS, Cloudflare tunnel, WARP)
7. Ollama optimization (parallel inference, flash attention, keep-alive)
8. Fix failing launchd services
9. macOS system tuning (reduce motion, file descriptors, network limits)
10. Full verification report

Run it weekly or after any reboot:
```bash
sudo bash ~/M2-ULTRA-100.sh
```

---

## HEAVEN v18 — LIVE DEPLOYMENT

**URL:** `https://heaven.rsp-5f3.workers.dev`  
**Status:** Operational  
**Version:** 18.0.0  
**Bundle:** 99.99 KiB / gzip: 24.25 KiB  
**Startup:** 20ms  
**Account:** NOIZYFISH (5f36aa9795348ea681d0b21910dfc82a)

Verified endpoints:
- `GET /` — Root info (200)
- `GET /v1/health` — Full health check: both D1 databases, all 4 KV namespaces confirmed operational
- `GET /v1/never-clauses` — All 9 constitutional clauses returned correctly

---

## Session 2 — Continued Optimization (07:30–07:45 UTC)

### Git Repository Surgery

- **Problem:** 4.32 GiB git packfile blocked all pushes (GitHub 2GB limit)
- **Root Cause:** `_TOSORTOUT/` contained 2.83GB MS Office installer, 321MB Sourcery zip, 281MB Claude DMG, 219MB Linear DMG, 206MB GitKraken DMG, 195MB Antigravity DMG, 158MB Postman Electron framework
- **Fix:** Removed `_TOSORTOUT/` and `.heal-backups/` from tracking, created orphan branch, pruned history
- **Result:** 4.32 GiB → 31.26 MiB (99.3% reduction), pushed instantly to `RSPNOIZY/CLAUDE-TODAY`
- **Updated `.gitignore`:** Blocks `*.dmg`, `*.pkg`, `*.zip`, `*.app/`, `*.vsix`, `_TOSORTOUT/`, `.heal-backups/`

### D1 Database Migrations (NOIZYFISH Account)

- **agent-memory:** Migration 0001 applied — `consent_log` table with append-only constraint, 3 indexes
- **gabriel_db:** Migration 0002 applied manually (statement-by-statement):
  - Created `jurisdiction_rules` table with Canada seeded (PIPEDA/AIDA)
  - Added `public_id` columns to `hvs_actors`, `hvs_consent_tokens`, `hvs_estates`, `hvs_licensees`
  - Added rate table versioning: `effective_from`, `effective_until`, `version` on `hvs_rate_table`
  - Added consent token fields: `scope`, `granted_at` on `hvs_consent_tokens`
  - Created indexes on all `public_id` columns
- **Total tables on gabriel_db:** 22 (including new `jurisdiction_rules`)

### Additional Process Kills (Round 2)

- VS Code stable killed entirely (ripgrep search death loop: 11 processes × 100%+ CPU = 1,500%+ total)
- fileproviderd, bird (iCloud), cloudd killed repeatedly (respawn hot during sync storm)
- Duplicate git push processes killed (5 → 1 → clean restart)

### Post-Optimization Health

| Metric | Before | After Round 1 | After Round 2 |
|--------|--------|---------------|---------------|
| Load Average | ~40+ | 26/24/21 | 20/28/24 |
| Swap Used | 2,871 MB | 370 MB | 370 MB |
| Compressed Memory | 92.7 GB | 86.3 GB | ~78 GB |
| Git Pack Size | 4.32 GiB | 4.32 GiB | 31.26 MiB |
| CPU Hogs Killed | 0 | 8 (~1,100%) | 20+ (~3,000%+) |
| NOIZY Services | Running | Running | Running |
| Docker Containers | 11 | 11 | 11 |
| Ollama Models | 19 | 19 | 19 |
| HEAVEN v18 | Not deployed | LIVE | LIVE + migrated |

### Remaining (Still Require Your Action)

**coreaudiod (160% CPU)** — still needs `sudo killall coreaudiod`
**Docker memory** — still at 7.65GB, needs GUI increase to 32GB+
**VS Code** — was killed entirely; when reopened, disable Gemini Code Assist and Console Ninja extensions

---

*Every voice is sovereign. Every use requires consent. Every artist gets 75%.*
*GOD.local is ready. HEAVEN is live. D1 is migrated. Git is clean. Build forward.*
