# PLATFORM FEATURES MEMORY
### Every built module, port, script, and status
**Last Updated:** 2026-03-13

---

## RUNNING SYSTEMS

### DreamChamber (Two Builds)

**Build A — New (dreamchamber/)**
- `src/extension.ts` — activate, 6 commands, status bar
- `src/DreamChamberProvider.ts` — WebviewViewProvider sidebar
- `src/AudioBridge.ts` — node-record-lpcm16 + silence detection
- `src/ASRClient.ts` — HTTP bridge → Moonshine/Whisper @ 8099
- `src/TTSClient.ts` — HTTP bridge → Kokoro/Dia @ 8098 + macOS say
- `src/ClaudeClient.ts` — @anthropic-ai/sdk streaming + NOIZY system prompt
- `src/CommandRouter.ts` — 30+ named voice commands
- `python/asr_server.py` — FastAPI Moonshine/Whisper server
- `python/tts_server.py` — FastAPI Kokoro/Dia/system TTS server
- **Status:** COMPILED CLEAN 2026-03-13 ✓

**Build B — Full (dreamchamber-extension/)**
- 12 TypeScript modules, all compiled
- 4-tab sidebar: Voice / Cast / Takes / Vault
- Character DNA (SHA-256), Take Manager (Claude scoring 0-100)
- Director Engine (live performance coaching)
- Vault Exporter (75/25 consent-locked JSON)
- Music Bridge (MusicGen / ACE-Step / MMAudio)
- **Status:** BUILT, compiled

### Rob-AVA Server
- **Port:** 8091 | **Alt:** 8092 (50-line version)
- **File:** `rob_ava/server.py` (386 lines, FastAPI)
- **50-line:** `rob_ava/rob_ava_50line.py`
- Character profiles: Morrison, Marcus, Commander Ash
- RAG pipeline, multilingual workflow
- Policy layer: fan boundary, collaboration mesh, voice of refusal
- **Status:** RUNNING

### GABRIEL Orchestration Engine
- **Port:** 3000 (bridge)
- **Files:** `GABRIEL/bin/` (start_server.sh, start_bridge.sh, health_check.sh, install_launchd.sh)
- **Database:** `gabriel.db` (82KB, active SQLite ops log)
- **Agents:** GABRIEL, ARIA, ZEPHYR, NEXUS, ECHO, ORACLE
- **Status:** RUNNING, daemon-capable (launchd)

### NOIZY Platform
- **Port:** 8090
- **Files:** `noizy_platform/app/` (main.py, config.py, database.py, models.py, schemas.py, security.py, deps.py)
- **Status:** RUNNING

### RSP001 Pipeline
- **Path:** `rsp001_pipeline/lib/`
- Modules: asmr_sleep_pipeline.py, audio_pipeline.py, eeg_adaptive.py, fx_pipeline.py, gemma_orchestrator.py, haptic_beat.py, panic_mode.py, tts_pipeline.py
- Scripts: build_haptic_panic_flow.py, build_sleepy_story.py, deploy_pack.py, ingest_audio.py, run_fx.py, run_panic_mode.py, train_tts.py
- Tests: all 6 modules have test files
- **Status:** BUILT, tested

### CODEMASTER
- **Path:** `CODEMASTER/` (1.4GB)
- `AI_MORNING_NEWS.sh` — daily intelligence briefing
- `CHECK_ANTHROPIC_STATUS.sh` — API monitoring
- `index.html` + `script.js` — dashboard
- **Status:** ACTIVE

### WhatsApp / Cohere Bot
- **File:** `whatsapp-cohere-bot.js` (850 lines)
- Cohere-powered conversational AI
- Signal protocol integration (libsignal)
- **Status:** BUILT

---

## ARCHIVED SYSTEMS (External Drives)

### HOTROD-ULTRA v4.0.0 (4TBSG)
- Path: `/Volumes/4TBSG/_2026_DOCS/NOIZYLAB_WORKSPACES/`
- 50+ Python scripts + shell scripts
- Key: GENIUS_AI_ULTRA.py (58KB), DEEP_DIVE_ANALYSIS_ENGINE.py (17KB), GENIUS_AI_CODEMASTER.py (39KB)
- Full agent swarm tooling

### MC96 (6TB)
- Path: `/Volumes/6TB/NOIZYLAB_ARCHIVES/MC96/`
- Full git repository
- Music Control 96 universe
- Avatar / configs / vault / venv

### RVC Voice Cloning (6TB)
- Path: `/Volumes/6TB/NOIZYLAB_ARCHIVES/6tb_archive/rvc_train/`
- Voice model training infrastructure

### Local LLMs (6TB)
- GLM-4.7 (Alibaba)
- OpenManus (Manus agent)
- Fully offline capable

---

## PORTS QUICK REF

| Port | Service | File |
|---|---|---|
| 8090 | NOIZY Platform | noizy_platform/app/main.py |
| 8091 | Rob-AVA | rob_ava/server.py |
| 8092 | Rob-AVA 50-line | rob_ava/rob_ava_50line.py |
| 8098 | TTS Server | dreamchamber/python/tts_server.py |
| 8099 | ASR Server | dreamchamber/python/asr_server.py |
| 3000 | GABRIEL | GABRIEL/bin/start_server.sh |

---

## VOICE INPUT STACK

```
Physical mic
  → node-record-lpcm16 (native SoX)      [AudioBridge.ts]
  → WAV temp file / PCM buffer
  → Moonshine v2 HTTP @ 8099              [ASRClient.ts]
  ↕ fallback: Web Speech API              [DreamChamberProvider.ts]
  → transcript text
  → CommandRouter (30+ named commands)   [CommandRouter.ts]
  ↕ or DreamChamberProvider.dispatch()
  → DICTATE: insert at cursor
  → INTAKE: append to ideas/inbox.md
  → CLAUDE: @anthropic-ai/sdk streaming
  → COWRITE: Claude with editor context
  → response text
  → Kokoro-82M HTTP @ 8098               [TTSClient.ts]
  ↕ fallback: macOS say
```

---

## TALON VOICE INTEGRATION

- `claude_code.talon` — 70+ commands (voice → VSCode commands)
- `noizylab_voice.talon` — NOIZY-specific voice control
- `noizylab_system.talon` — system control
- Requires: pokey.command-server, pokey.cursorless
- Deploy: `Talon: Copy Voice Commands to ~/.talon` task
- Note: Talon Voice not yet installed on M2 Ultra (no ~/.talon/)
