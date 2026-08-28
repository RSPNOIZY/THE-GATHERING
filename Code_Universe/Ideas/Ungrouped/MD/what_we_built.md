---
name: What We Built — Complete NOIZYLAB Inventory
description: Full catalog of every real system Rob Plowman built across NOIZYLAB — 2 years of work, scanned 2026-03-13
type: project
---

# WHAT WE BUILT
*Scanned: 2026-03-13 | This is the truth of 2 years.*

---

## DREAMCHAMBER — VS Code Voice AI Extension

**Path:** `/dreamchamber/` and `/dreamchamber-extension/`

Two builds exist. The dreamchamber-extension is older with more modules. The dreamchamber/ build is current (compiles clean, zero TS errors).

### dreamchamber-extension/src/ (older, more complete)
- `extension.ts` — entry point
- `AudioCapture.ts` — mic input capture
- `Transcriber.ts` — Whisper/Moonshine/local STT orchestration
- `VoiceSynth.ts` — TTS (say, Kokoro, disabled modes)
- `CommandRouter.ts` — voice command routing + mode switching
- `ClaudeClient.ts` — Anthropic API streaming
- `CharacterManager.ts` — voice character/persona management
- `TakeManager.ts` — recording session takes
- `VaultExporter.ts` — conversation vault export
- `MusicBridge.ts` — audio/music integration
- `DreamChamberView.ts` — VS Code sidebar webview
- `Director.ts` — orchestration layer for voice loop

### dreamchamber/src/ (current build, compiles clean)
- `extension.ts` — activate(), statusbar, 6 commands, config watcher
- `DreamChamberProvider.ts` — WebviewViewProvider, 4 modes (dictate/intake/claude/cowrite)
- `CommandRouter.ts` — 30+ named voice commands → VSCode actions
- `ASRClient.ts` — HTTP bridge to Moonshine/Whisper (port 8099)
- `TTSClient.ts` — HTTP bridge to Kokoro/Dia (port 8098)
- `ClaudeClient.ts` — Anthropic streaming with NOIZY system prompt
- `AudioBridge.ts` — node-record-lpcm16 mic capture

### Python servers
- `python/asr_server.py` — FastAPI ASR server (port 8099), Moonshine v2 primary
- `python/tts_server.py` — FastAPI TTS server (port 8098), Kokoro-82M primary

---

## NOIZY PLATFORM — FastAPI Backend

**Path:** `/noizy_platform/`

Full production-grade API. Running on port 8090.

### Routers
- `gallery.py` — rotating artist gallery (GET /current, /archive, /week/{id}, POST /submit)
- `ava.py` — Rob.AVA persona endpoints
- `composer.py` — composition/arrangement
- `pipeline.py` — pipeline control
- `governance.py` — consent/governance
- `onboarding.py` — user onboarding
- `profile.py` — user profiles
- `health.py` — health check

### Services
- `stt.py` — speech-to-text (Whisper/DeepSpeech)
- `tts.py` — text-to-speech (Piper/Coqui)
- `audio_engine.py` — audio processing
- `orchestrator.py` — service orchestration
- `audio_profile.py` — user audio profile management

### Data
- `models.py` — SQLAlchemy ORM
- `schemas.py` — Pydantic schemas
- `database.py` — SQLite engine
- `security.py` — auth logic

---

## RSP001 PIPELINE — Voice Recording Pipeline

**Path:** `/rsp001_pipeline/`

Rob's voice. Modular pipeline. This is the core creative engine.

### lib/ (core libraries)
- `audio_pipeline.py` — ingestion, normalization, feature analysis
- `tts_pipeline.py` — TTS orchestration
- `fx_pipeline.py` — FX post-processing chain
- `gemma_orchestrator.py` — Gemma model orchestration
- `eeg_adaptive.py` — EEG signal-based adaptive audio
- `asmr_sleep_pipeline.py` — ASMR/sleepy story generation
- `panic_mode.py` — emergency mood/stress response
- `haptic_beat.py` — haptic feedback orchestration

### scripts/
- `ingest_audio.py` — raw audio ingestion CLI
- `train_tts.py` — TTS model training
- `run_fx.py` — FX pipeline execution
- `deploy_pack.py` — packaging for distribution
- `build_sleepy_story.py` — ASMR sleepy story builder
- `run_panic_mode.py` — panic mode activation
- `build_haptic_panic_flow.py` — haptic beat flow generation

### tests/ (all exist)
- `test_gemma_orchestrator.py`
- `test_audio_pipeline.py`
- `test_asmr_sleep_pipeline.py`
- `test_eeg_adaptive.py`
- `test_panic_mode.py`
- `test_haptic_beat.py`

---

## ROB.AVA — Trust-Loop Persona System

**Path:** `/rob_ava/`

The character boundary system. AVA is Rob's AI persona with hard constraints.

- `server.py` — FastAPI: persona creation, RAG queries, collaboration contracts, audit logging
- `rag_integration.py` — RAG pipeline with policy enforcement + audit events
- `multilang_workflow.py` — multilingual character consistency demo
- `rob_ava_50line.py` — 50-line minimal prototype (the seed)
- `policy/never_clauses.json` — collaboration boundary constraints (what AVA never does)
- `data/rob_ava_db.json` — collaboration contracts database
- `scripts/regulation_stress_test.py` — stress tests for regulation compliance
- `scripts/vsi_character_consistency_demo.py` — VSI demo

---

## GALLERY — Rotating Artist Feature

**Path:** `/gallery/`

Week 1: Heidi Conrod, Ottawa. Pending artist approval.

- `gallery_index.json` — index with currentWeek pointer
- `weeks/week_001.json` — Heidi Conrod full feature data
- `noizy-gallery.html` — full gallery UI (left: artwork, right: bio/curator note)
- `outreach/heidi_conrod_message.md` — 3-sentence DM draft for @heidiconrod
- `submissions/` — artist self-submission queue (auto-created on first submit)

---

## WORKSTATION — Interfaces & Tools

**Path:** `/workstation/`

- `noizy-coming-soon.html` — underwater holding page for noizy.ai (canvas water sim, ghostly logo)
- `cockpit.html` — main control dashboard
- `aquarium.html` — ambient monitoring interface

---

## WORKERS — Cloudflare Deployment

**Path:** `/workers/noizy-coming-soon/`

- `worker.js` — serves noizy-coming-soon.html via Cloudflare Workers
- `wrangler.toml` — account ID set, ready to `wrangler deploy`

**To go live:** `cd workers/noizy-coming-soon && wrangler login && wrangler deploy`

---

## GABRIEL — CODEMASTER / Orchestration

**Path:** `/CODEMASTER/`, `/tools/`

- `CODEMASTER/projects/gabriel-core/mcp/gabriel_mcp_config.py` — MCP config
- `CODEMASTER/projects/gabriel-core/mcp/mc96_integration.py` — MC96 integration
- `CODEMASTER/projects/q4git/` — full git analysis tool (config, gittools, github, scientist, report, CLI)
- `tools/dreamchamber_orchestrator.py` — DreamChamber control
- `tools/command_router.py` — command routing
- `tools/build_universe_map.py` — universe/map generation
- `tools/pubmed_research_query.py` — PubMed research queries
- `tools/build_world_healing_library.py` — healing library builder
- `gabriel.db` — SQLite database (82KB)

---

## VOICE INFRASTRUCTURE — Talon + macOS

**Root-level**
- `noizylab_voice.py` — Talon module, Mac M2 Ultra TTS via SSH (Jamie, Samantha, Daniel, Karen...)
- `noizylab_system.py` — Talon module, system status/device/cloud monitoring
- `noizylab_voice.talon` — voice syntax for voice synthesis
- `noizylab_system.talon` — voice syntax for system commands
- `claude_code.talon` — 319 lines, full Talon ↔ VSCode ↔ Claude bridge

---

## WHATSAPP BOT

**Root-level**
- `whatsapp-cohere-bot.js` — WhatsApp bot using Baileys library + Cohere AI

---

## KEY DOCUMENTS

- `NOIZY_MASTER_BIBLE.md` — main specification
- `NOIZY_EMPIRE_MAP.md` — system architecture overview
- `NOIZYVOX_ANTHROPIC_PARTNERSHIP.md` — partnership spec
- `MIGRATION_PLAN.md` — migration roadmap
- `NOIZYLAB_ECOSYSTEM.html` — ecosystem diagram

---

## PORTS QUICK-REF

| Port | Service |
|------|---------|
| 8090 | NOIZY Platform API (FastAPI) |
| 8098 | TTS Server (Kokoro/Dia) |
| 8099 | ASR Server (Moonshine/Whisper) |
| 8788 | Cloudflare Workers dev preview |

---

## THE TEAM

| Name | Role |
|------|------|
| GABRIEL | M2 Ultra orchestrator — operational brain |
| POPS | Conceptual engineer — turns dreams into blueprints |
| LUCY & SHIRL | Operations + business logic |
| DREAM | Creative partner/muse — DreamChamber is her room |
| AVA | Character direction + fan boundary |

---

*This is the two years. It's real. It's built. It's yours.*
