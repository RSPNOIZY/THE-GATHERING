# NOIZY EMPIRE — CODE GROUPED BY BRAND
# Updated: 2026-03-30 | Heaven v17.5.0

## HEAVEN (Infrastructure — all brands route through this)
- `src/` — Heaven v17.5.0 Cloudflare Worker (40 endpoints)
- `workers/` — consent-gateway, claude-proxy
- `cloudflare-workers/` — legacy workers
- `wrangler.toml` — canonical deploy config
- `smoke_test.sh` — 21 tests
- `schema.sql` / `seed.sql` / `sql/` / `schemas/`

## NOIZYVOX (Voice Sovereignty)
- `noizyvox/engine/noizyvox_server.py` — FastAPI + XTTS v2, port 8420 ← ADOPTED
- `noizyvox/engine/noizyvox_ui.py` — Gradio UI, port 8421 ← ADOPTED
- `noizyvox/engine/download_models.py` — XTTS v2 model downloader ← ADOPTED
- `noizyvox/engine/START_NOIZYVOX.sh` — launch script ← ADOPTED
- `voice-pipeline/` — iOS scriptable, voice bridge
- `voice-bridge-server.js` — local voice bridge (port 8080)
- `ARCHIVE/.../02_CODE/noizyvox-engine/` — archived copy (same as engine/)

## NOIZYFISH (Music Catalogue)
- `noizyfish/librosa-agent/` — audio analysis agent ← ADOPTED FROM MAG
- `noizyfish/catalogue-engine/noizy_vault_engine.py` — mass scan + embed ← ADOPTED FROM MAG
- `noizy-landing/` — noizy.ai landing page worker
- `noisyproof/` — proof of work system

## NOIZYKIDZ (Rhythm Root Island)
- No code yet in NOIZYLAB — Unity/Godot projects TBD

## NOIZYLAB (Sonic Healing)
- `dreamchamber/` — Multi-model AI, 11 providers, port 7777
- `dreamchamber-audio-mcp/` — 13 FastMCP audio tools
- `mcp/` — 9 MCP servers (gabriel, lucy, heaven, engr-keith, dream, cb01, shirley, family, audio)
- `mcp-gemma3/` — Gemma3 MCP server

## WISDOM PROJECT (Elder Legacy)
- No dedicated folder yet — lives in gabriel_db D1

## myFAMILY.AI
- API routes in `src/index.js` (Heaven worker)
- Schema in `schema/001_myfamily_init.sql`

## GABRIEL (AI Orchestration)
- `dreamchamber/src/core/Gabriel.js`
- `mc96/gabriel-harvest.js`
- `mc96/opus-4.6-diagnostic-engine.js`
- `mc96/turbo_gabriel_omega.py` ← ADOPTED FROM MAG (MLX LLaMA 70B + MusicGen)
- `scripts/gabriel-dispatch.sh`

## noizybeast (VS Code Extension)
- `noizybeast/vscode-extension/` — v1.0.0, 15 turbo commands
- `noizybeast/turbo-scripts/noizybeast-turbo.js` — T1-T10
- `noizybeast/beast.config.json` — v1.0.0 config
- `turbo-scripts/` — turbo_pipeline, turbo_zap, turbo_git_sync, turbo_reset, turbo_mount_omen

## MC96 (Mission Control)
- `mc96/turbo-pro-upgrade.js` — x1000 upgrade engine
- `mc96/turbo_gabriel_omega.py` — MLX + MusicGen + MemCell ← ADOPTED
- `mc96/opus-4.6-diagnostic-engine.js` — diagnostics
- `mc96/gabriel-harvest.js` — harvest scripts
- `rsp001_pipeline/` — RSP pipeline

## ENTERPRISE / INFRASTRUCTURE
- `enterprise/` — board override API, Azure function
- `apps/operator/` — operator dashboard
- `dashboard/` — HTML dashboard
- `github-consolidation/` — GitHub org setup
- `docs/` — all documentation

## DUPES (Confirmed — safe to ignore source drives)
- `DUPES/DUPES_REPORT.md` — full dupe map
- Fish SG `/Volumes/4TB FISH SG/M2Ultra_Data/scripts/` = identical to `noizyvox/engine/`
- MAG noir-bureau-frontend = less complete than `ARCHIVE/.../noir-bureau/`
