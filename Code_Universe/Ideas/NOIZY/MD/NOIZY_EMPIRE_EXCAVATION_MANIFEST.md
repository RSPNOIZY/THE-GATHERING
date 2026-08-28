# NOIZY EMPIRE — FULL EXCAVATION MANIFEST

## Phase 1: Software Inventory — All Mounted Drives

**Compiled: March 25, 2026**
**Machine: GOD.local (M2 Ultra Mac Studio)**
**Compiled by: Claude (3 agents in parallel) + RSP_001**
**Status: Phase 1 COMPLETE — awaiting GOD.local hardware scan for Phase 2**

---

## SCALE SUMMARY

| Source | Size | Files | Git Repos | NOIZY-Related |
|--------|------|-------|-----------|---------------|
| m2ultra/ (home) | 60+ GB | 22,000+ | 4 | 70% |
| NOIZYLAB/ | 214 MB | 21,693 | 1 | 100% |
| NOIZYEMPIRE/ | 3.2 GB | 67,796 | 1 | 100% |
| Downloads/ | 38 GB | 500+ | 0 | 80% |
| **TOTAL** | **~100 GB** | **~112,000** | **6** | **~85%** |

---

## TIER 1: PRODUCTION SYSTEMS (LIVE NOW)

### 1.1 Heaven17 — Consent Kernel API (Cloudflare Worker)
- **Status**: LIVE at `heaven17.noizylab.workers.dev`
- **Endpoints**: 55 authenticated REST routes (v3.5.0)
- **Source**: `NOIZYEMPIRE/noizylab/src/index.js` (1,571 lines)
- **Dashboard**: `NOIZYEMPIRE/noizylab/src/dashboard.js`
- **Covenant**: `NOIZYEMPIRE/noizylab/src/covenant.js` (9-check validator)
- **Database**: D1 gabriel_db — 25 tables + 9 views
  - ID: `f75939d5-5747-4a9c-8ac2-7710201fda09`
- **KV**: GABRIEL_KV (rate limiting) + GABRIEL_VOICE (voice assets)

### 1.2 DreamChamber — Multi-Model AI Command Center (Port 7777)
- **Source**: `NOIZYEMPIRE/noizylab/dreamchamber/`
- **Size**: 137 MB
- **Providers**: 8 (Anthropic, OpenAI, Google, Together, Mistral, Cohere, Perplexity + Base)
- **Features**: SSE streaming, WebSocket, Heaven17 proxy, Gabriel orchestration
- **Frontend**: 4-tab command center (Chat, Consent Kernel, Models, Settings)
- **Deployment**: Docker + nginx + PM2 configured

### 1.3 Voice Bridge Server (Port 8080)
- **Source**: `NOIZYEMPIRE/noizylab/voice-bridge-server.js` (323 lines)
- **Pipeline**: Siri/Google → Power Automate → GOD.local → Automator → TTS
- **Commands**: claude, deploy, dreamchamber, compare, status, cascade

### 1.4 MCP Servers (3)
- **Gabriel MCP**: `noizylab/mcp/gabriel-mcp/` — AI orchestration tools
- **Heaven17 MCP**: `noizylab/mcp/heaven17-mcp/` — 12 consent kernel tools
- **Lucy MCP**: `noizylab/mcp/lucy-mcp/` — DAZEFLOW task tracking

---

## TIER 2: EXTENDED ECOSYSTEM (NOIZYANTHROPIC — 1.5 GB)

### 2.1 DreamChamber VSCode Extension
- **Path**: `NOIZYEMPIRE/noizyanthropic/dreamchamber-extension/`
- **Language**: TypeScript
- **Modules**: Director, DreamChamberView, AudioCapture, VoiceSynth, CharacterManager, ClaudeClient, TakeManager, VaultExporter, MusicBridge, NoizyVoxRegistry, CommandRouter, Transcriber

### 2.2 Rob Ava — Actor Persona AI
- **Path**: `NOIZYEMPIRE/noizyanthropic/rob_ava/`
- **Language**: Python (FastAPI)
- **Features**: Character DNA, director notes, RAG pipeline, multi-language
- **Policy**: Never clauses enforcement, fan boundary rules
- **Schemas**: Collaboration contracts

### 2.3 RSP001 Pipeline — Voice Synthesis
- **Path**: `NOIZYEMPIRE/noizyanthropic/rsp001_pipeline/`
- **Language**: Python
- **Modules**: audio_pipeline, tts_pipeline, fx_pipeline, asmr_sleep_pipeline, eeg_adaptive, gemma_orchestrator, haptic_beat, panic_mode
- **Scripts**: build_sleepy_story, build_haptic_panic_flow, deploy_pack, ingest_audio, train_tts

### 2.4 NOIZY Platform — FastAPI Backend
- **Path**: `NOIZYEMPIRE/noizyanthropic/noizy_platform/`
- **Routers**: ava, composer, gallery, governance, noizyvox, onboarding, pipeline, profile, health
- **Services**: audio_engine, audio_profile, hvs, orchestrator, stt, tts, voice_analysis, xtts

### 2.5 NOIZYPROOF — Cryptographic Provenance
- **Path**: `NOIZYEMPIRE/noizyanthropic/noisyproof/`
- **Language**: TypeScript
- **Modules**: consent verification, C2PA content credentials, watermarking, audit trail
- **Database**: Own schema

### 2.6 NOIZYVOX — Voice Synthesis Engine
- **Path**: `NOIZYEMPIRE/noizyanthropic/noisyvox/`
- **Language**: TypeScript
- **Modules**: synthesis-pipeline, consent-integration, model registry, NOISYPROOF client
- **Database**: Own schema

### 2.7 NOIZY-Claude — Claude Integration Package
- **Path**: `NOIZYEMPIRE/noizyanthropic/noizy-claude/`

### 2.8 NOIZY-Voice — VSCode Voice Panel
- **Path**: `NOIZYEMPIRE/noizyanthropic/noizy-voice/`
- **Modules**: extension entry, VoicePanel UI, CommandRouter

### 2.9 DreamChamber Python Services
- **Path**: `NOIZYEMPIRE/noizyanthropic/dreamchamber/python/`
- **Servers**: ASR (speech recognition), TTS (text-to-speech)

### 2.10 Turbo Scripts Suite
- **Path**: `NOIZYEMPIRE/noizyanthropic/scripts/turbo/`
- **Scripts**: config, net_check, vitals, bridge, ears, media, recall, speed, evolution, fishnet, plugin_heist

### 2.11 MC96 Schema
- **Path**: `NOIZYEMPIRE/noizyanthropic/mc96/`
- **Files**: schema.sql (1,000+ lines), types.ts

---

## TIER 3: GABRIEL AI ORCHESTRATOR

- **Path**: `NOIZYEMPIRE/gabriel-agents/`
- **Language**: TypeScript
- **Variants**: gabriel.ts, gabriel-mentor.ts, gabriel-metabeast.ts, gabriel-testbeast.ts, gabriel-comms.ts
- **Workflow Engine**: workflow-agents-upgraded.ts

---

## TIER 4: UI DESIGNS & PROTOTYPES

### JSX Components (55+)
**Path**: `NOIZYEMPIRE/noizy-designs/` + `Downloads/Code/`

**Narrative/Vision**: Chronicle2036, PlowmansChronicles, Retrospective2526, AscensionMap, CivilizationBlueprint, looking-back-from-2036

**Core Products**: TheDreamChamber, TheHVS, TheStudio, NOIZYVOX_VSI_PITCH, NOIZY_V3, NOIZY_ARTIST_SYSTEM_V2

**Ecosystem**: NOIZYMuseumWorld, NOIZYCommunityStack, NOIZYKidz, TheGuild, TheHarmony, TheIntelligence, FairTradeAI, ArtistFirst

**Infrastructure**: NOIZY_Remote.jsx (18 GABRIEL commands), mc96eco-journey.jsx, DreamChamberFixMap.jsx

### HTML Prototypes (13+)
NOIZY_500_YEAR_MANIFESTO, NOIZY-DreamChamber, noizy-ai-elegant, noizy-canadian-soul (3 variants), aiva-casting-engine, luxury-ecommerce-prototype, wisdom_hub_adapted

---

## TIER 5: DATABASE SCHEMAS (7 total)

| Schema | Path | Lines | Status |
|--------|------|-------|--------|
| Heaven17 D1 | `noizylab/schema.sql` | 239 | LIVE |
| Heaven17 Seed | `noizylab/seed.sql` | 217 | LIVE |
| NOIZY v2 Complete | `noizylab/noizy-schema-v2-complete.sql` | 1,382 | Reference |
| DreamChamber PG | `dreamchamber/sql/init.sql` | — | Scaffolded |
| NOISYPROOF | `noizyanthropic/noisyproof/schema.sql` | — | Ready |
| NOIZYVOX | `noizyanthropic/noisyvox/schema.sql` | — | Ready |
| MC96 | `noizyanthropic/mc96/schema.sql` | 1,000+ | Reference |

---

## TIER 6: DOCUMENTATION LIBRARY (100+ files)

### Master Runbooks (NOIZYLAB)
CLAUDE.md (v3.5.0), README.md, DREAMCHAMBER_ARCHITECTURE_V2.md, DREAMCHAMBER_CONTACT_SEQUENCE.md, HEAVEN17_RUNBOOK.md, NOIZY_MASTER_SYSTEM.md, VOICE_CONTROL_PIPELINE.md, AUTOMATOR_WORKFLOWS.md, DNS_EMAIL_MIGRATION.md, M2_ULTRA_GOLD_CATALOG.md, LIBRARY_GOLD_CATALOG.md, NOIZY_COVENANT.md, NOIZY_EMPIRE_CONTEXT.md

### Specification Documents
NOIZY_MENTOR_TIER_SPEC_v1.docx, NOIZY_NO_FAKES_ACT_v1.docx, NOIZY_ARCHITECTURE_DEPLOYMENT_v3.3.docx

### Strategic Documents (Downloads/Documents)
NOIZY-Founder-Blueprint-2026.docx, NOIZY_Global_Adoption_Playbook.docx, NOIZY_Indigenous_CoDesign_Protocol.docx, WisdomProject_Canada_Strategic_Brief.docx, CHAPTER_TWO_Hello_RSP001.docx

### Presentations (6)
NOIZYVOX.pptx, NOIZYVOX_AIVA.pptx, NOIZYWORLD_ECOSYSTEM.pptx, RSP_BIO_V1.pptx, NOIZY_Alex_Briefing.pptx, NOIZYVOX_DreamChamber_ASMR_SleepStories_Deck.pptx

### Canadian Heritage
canadian-constellation-canon.md, canadian-comedy-film-canon.md, avro-arrow-canadas-greatness-EXPANDED.md, canadian-music-canon.md

### Morning Briefings (Desktop Command Center)
MC96ECO-Morning-Briefing-2026-03-20 through 2026-03-23, MC96ECO_IP_WEEKLY_DIGEST.md, NOIZYEMPIRE_MASTER_CLASSIFICATION.md

### Text Vault
1,678 individual text documents — complete indexed archive of all project documentation

---

## TIER 7: INFRASTRUCTURE & DEPLOYMENT

### Cloudflare
- Worker: heaven17 (LIVE)
- D1: gabriel_db (25 tables + 9 views)
- KV: GABRIEL_KV + GABRIEL_VOICE
- R2: Prepared (awaiting dashboard enable)

### Docker
- `dreamchamber/Dockerfile` + `docker-compose.yml`
- Stack: nginx + dreamchamber + postgres + redis

### CI/CD
- `.github/workflows/deploy.yml` — GitHub Actions
- Windsurf workflows (7): deploy, start, smoke, status, commit, review, debug

### Shell Scripts (20+)
deploy.sh, smoke_test.sh, GABRIEL_GOD_SETUP.sh, setup_noizy_ide.sh, deploy-all.sh, setup-voice.sh, triage_downloads.sh, delete_empty_folders.sh, talespin-finder.sh

### Power Automate
Voice-To-Claude.json — Siri/Google → voice-bridge → Automator → TTS

### Automator Workflows
230+ designed, 2 in ~/Library/Services (Copy Full Path, GORUNFREE-Speak)

---

## TIER 8: AUDIO & MUSIC PRODUCTION

### Logic Pro
- NOIZYLOGIC.logicx — Main project in CascadeProjects/
- Plugin chain: Sonnox, Sugar Bytes, Universal Audio, iZotope

### Audio Infrastructure
- noizy-audio-orchestra-config.md — Multi-AI voice routing (Airfoil, Audio Hijack, Loopback, SoundSource)
- _ZERO_LATENCY_VAULT/ — Latency-critical audio files

### TaleSpin Archive (UNRELEASED — Google Drive)
- 235-660+ professional audio assets from 2020 VR project
- RSP voice performances (50-150 WAV files)
- Original music compositions (20-40 files)
- Sound effects library (100-300+ files)
- Mapped in talespin-complete-archive.md

---

## TIER 9: ADDITIONAL SYSTEMS

| System | Path | Status |
|--------|------|--------|
| Noizy-Edge | `NOIZYEMPIRE/noizy-edge/` | Cloudflare edge workers |
| Noizy-Museum | `NOIZYEMPIRE/noizy-museum/` | Museum Cloudflare Worker |
| Noizy-Bots | `NOIZYEMPIRE/noizy-bots/` | Discord + Slack bots |
| NoizyVox-Engine | `NOIZYEMPIRE/noizyvox-engine/` | Voice synthesis scaffold |
| Swift Library | `NOIZYEMPIRE/swift-library/` | Swift package |
| TaleSpin | `NOIZYEMPIRE/talespin/` | Voice discovery manifest |
| Desktop Command Center | `NOIZYEMPIRE/desktop-command-center/` | Daily ops dashboards |

---

## TIER 10: ENVIRONMENT & IDE

### IDE Configurations
- VSCode: settings.json, launch.json, tasks.json, extensions.json
- Windsurf: rules/noizylab.md + 7 workflows
- 3 workspace files: NOIZYLAB, NOIZYEMPIRE DREAMCHAMBER, NOIZYANTHROPIC

### AI Tool Integrations (m2ultra)
.aitk/ (732 dirs), .quokka/, .wallaby/, .console-ninja/, .codex/ (18 dirs), .cursor/, .codeium/, .cline/, .continue/, .copilot/, .gitkraken/

### Cloud Platform Configs
.aws/, .azure/ (14 dirs), .docker/ (18 dirs), .kube/, .minikube/ (9 dirs)

### Shell History
.zsh_history (925 KB), .bash_history (6.7 KB) — complete command history

---

## GHOST LIBRARIES & BURIED CODE

| Location | Type | Notes |
|----------|------|-------|
| `m2ultra/noizy/noizyanthropic/` | Express.js app | Ruleset + Zod validation |
| `m2ultra/noizy/noizyanthropic-edge/` | Cloudflare edge | Earlier iteration |
| `m2ultra/NOIZYANTHROPIC/` | 4.9 GB extended | Contains full experimental mirror |
| `m2ultra/NOIZYANTHROPIC/NOIZYLAB/gabriel.db` | SQLite | 80 KB local Gabriel database |
| Downloads/Archives/ | ZIP bundles | Multiple iteration snapshots |
| Documents/NOIZYLAB/ | Mirror copy | Full 30-directory mirror |
| Documents/NOIZYLAB_TEXT_VAULT/ | 1,678 docs | Complete text archive |
| text-vault/ | 1.8 GB | Legacy archives, VFX configs |

---

## WHAT'S MISSING (Phase 2 — Requires GOD.local Terminal)

- [ ] Physical USB-C / Thunderbolt connected drives
- [ ] Network-mounted volumes (SMB/NFS/AFP)
- [ ] Bluetooth peripherals
- [ ] External drive inventory (/Volumes/)
- [ ] Full git repo scan beyond home depth 4
- [ ] iCloud Drive contents
- [ ] OneDrive sync status
- [ ] Time Machine backup inventory

---

## CONSOLIDATION TARGETS FOR `noizy.ai` GitHub Enterprise

### Already in NOIZYEMPIRE (canonical):
Everything in Tiers 1-9 above

### Needs migration from m2ultra:
1. `m2ultra/NOIZYANTHROPIC/` → archive or merge experimental work
2. `m2ultra/noizy/` → evaluate for dedup vs archive
3. `m2ultra/Documents/NOIZYLAB/` → confirm it's a mirror, not diverged
4. `m2ultra/Documents/NOIZYLAB_TEXT_VAULT/` → index and link

### Needs retrieval:
1. TaleSpin audio assets (Google Drive) → VOICE_VAULT (R2)
2. Power Automate flows (if more exist beyond Voice-To-Claude)
3. Automator workflows (230 designed, only 2 in Library/Services)

---

*"Consent as executable code. Provenance as default. Revocation as sacred. Compensation as automatic."*

*Two years. One mission. Every file accounted for.*
