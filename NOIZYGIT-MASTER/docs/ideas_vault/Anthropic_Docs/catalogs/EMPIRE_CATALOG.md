# NOIZY EMPIRE — FULL ASSET CATALOG
**Generated:** 2026-03-25  
**Scanned by:** GABRIEL + Claude — Full M2 Ultra Sweep  
**Machine:** GOD.local (M2 Ultra Mac Studio)  
**Actor:** RSP_001 — Robert Stephen Plowman

> "Two years of genius. All of it. Right here."

---

## STATUS SUMMARY

| Zone | Path | Status | Action |
|------|------|--------|--------|
| **LIVE LAB** | `~/NOIZYLAB/` | ✅ Active | Current codebase |
| **OLD LAB** | `~/NOIZYANTHROPIC/NOIZYLAB/` | 🟡 Archive | Import components |
| **EMPIRE DOCS** | `~/NOIZYANTHROPIC/NOIZYEMPIRE/` | 🟡 Archive | Import to NOIZYLAB/docs |
| **TEXT VAULT** | `~/Documents/NOIZYLAB_TEXT_VAULT/` | 🟡 1661 files | Review + import |
| **DOC LAB** | `~/Documents/NOIZYLAB/` | 🟡 Archive | Import TypeScript + GABRIEL |
| **DOWNLOADS** | `~/Downloads/` | 🔴 Scattered | Import immediately |
| **6TB DRIVE** | `/Volumes/6TB/NOIZYLAB_ARCHIVES/` | 🟡 Archive | Review GABRIEL + MC96 |
| **4TBSG DRIVE** | `/Volumes/4TBSG/NOIZYLAB_ARCHIVE/` | 🟡 Archive | 1.8GB FISHNET_MANIFEST |
| **MAG 4TB** | `/Volumes/MAG 4TB/NOIZYFISH_THE_AQAURIUM/` | 🟡 Git repo | Review + merge |
| **VOICES (iPhone)** | 3 recordings on iPhone 15 Pro Max | 🔴 NOT YET TRANSFERRED | AirDrop to test-voices/ |
| **VOICE STUBS** | `~/NOIZYANTHROPIC/NOIZYLAB/dreamchamber/voice_universe/` | ⚠️ 0-byte placeholders | Replace with real recordings |

---

## 1. LIVE CODEBASE — `~/NOIZYLAB/`

The active Empire. Everything running now.

```
~/NOIZYLAB/
├── dreamchamber/          ← Node.js AI Command Center (port 7777)
│   ├── src/
│   │   ├── core/
│   │   │   ├── Gabriel.js            ← GABRIEL orchestration layer
│   │   │   ├── GabrielProfile.js     ← NEW: Adaptive learning mode
│   │   │   ├── HeavenClient.js     ← Heaven API bridge
│   │   │   └── StateManager.js       ← Conversation state
│   │   ├── providers/
│   │   │   ├── AnthropicProvider.js  ← Extended Thinking, Vision, Batch, Cache
│   │   │   ├── OpenAIProvider.js     ← Vision support
│   │   │   └── [5 other providers]
│   │   ├── routes/
│   │   │   ├── api.js               ← REST API + Batch API
│   │   │   ├── gabriel.js           ← GABRIEL endpoints + Learn
│   │   │   └── voice.js             ← NEW: Voice DNA endpoints
│   │   ├── utils/
│   │   │   └── VoiceProcessor.js    ← NEW: ffmpeg/sox voice pipeline
│   │   └── websocket/handler.js     ← WebSocket + thinking events
│   ├── test-voices/                 ← ⚠️ DROP ZONE — AirDrop here
│   │   ├── RSP_001_wizard.wav       ← 0 bytes — needs real recording
│   │   ├── RSP_002_gangster.wav     ← 0 bytes — needs real recording
│   │   └── RSP_003_creature.wav    ← 0 bytes — needs real recording
│   ├── tests/voice/voice-dna.test.js ← 14-test Voice DNA suite
│   └── gabriel-profile.json         ← RSP_001 adaptive learning profile
├── heaven/              ← Cloudflare Worker — Consent Kernel
│   └── [live at heaven.rsp-5f3.workers.dev]
├── mcp/                   ← MCP servers (gabriel, lucy, heaven)
├── smoke_test.sh          ← 14-test smoke suite
├── deploy.sh              ← Production deploy script
├── CLAUDE.md              ← Architecture truth document
├── EMPIRE_CATALOG.md      ← THIS FILE
└── .windsurf/rules/       ← Workspace rules
```

---

## 2. OLD NOIZYLAB — `~/NOIZYANTHROPIC/NOIZYLAB/` ⭐⭐⭐ CRITICAL

**This is the goldmine.** The previous generation NOIZYLAB with components not yet in the live system.

### Code Components to Review + Import

| Module | Path | What It Is | Priority |
|--------|------|-----------|----------|
| **noisyproof** | `NOIZYANTHROPIC/NOIZYLAB/noisyproof/` | C2PA watermarking, audit, consent, watermark pipeline | 🔴 HIGH |
| **rob_ava** | `NOIZYANTHROPIC/NOIZYLAB/rob_ava/` | RSP_001 Avatar system — persona profiles, never_clauses, RAG pipeline, fan boundary policy | 🔴 HIGH |
| **rsp001_pipeline** | `NOIZYANTHROPIC/NOIZYLAB/rsp001_pipeline/` | Full audio pipeline: EEG adaptive, ASMR sleep, haptic beat, panic mode, TTS, FX | 🔴 HIGH |
| **voice_universe** | `NOIZYANTHROPIC/NOIZYLAB/dreamchamber/voice_universe/` | 3 persona creative_genome.json files + voice DNA specs | 🔴 HIGH |
| **noisyvox** | `NOIZYANTHROPIC/NOIZYLAB/noisyvox/` | NoisyVox implementation (API clients, models) | 🟡 MEDIUM |
| **noizy-voice** | `NOIZYANTHROPIC/NOIZYLAB/noizy-voice/` | VSCode voice extension (TypeScript) | 🟡 MEDIUM |
| **dreamchamber-extension** | `NOIZYANTHROPIC/NOIZYLAB/dreamchamber-extension/` | DreamChamber VSCode extension | 🟡 MEDIUM |
| **scripts/turbo** | `NOIZYANTHROPIC/NOIZYLAB/scripts/turbo/` | turbo_bridge, turbo_evolution, turbo_fishnet, turbo_recall, etc. | 🟡 MEDIUM |
| **CODEMASTER** | `NOIZYANTHROPIC/NOIZYLAB/CODEMASTER/` | CodeMaster system | 🟡 MEDIUM |
| **GABRIEL (old)** | `NOIZYANTHROPIC/NOIZYLAB/GABRIEL/` | Previous GABRIEL version | 🟡 REVIEW |
| **noizy_platform** | `NOIZYANTHROPIC/NOIZYLAB/noizy_platform/` | Python platform (FastAPI routers, services) | 🟡 MEDIUM |
| **mc96** | `NOIZYANTHROPIC/NOIZYLAB/mc96/` | MC96 system | 🟡 MEDIUM |
| **ideas/inbox.md** | `NOIZYANTHROPIC/NOIZYLAB/ideas/inbox.md` | Captured ideas (composer guild live, etc.) | 🟢 LOW |
| **research** | `NOIZYANTHROPIC/NOIZYLAB/research/` | Local voice stack security research (Mar 2026) | 🟢 LOW |

### Critical Voice DNA Specs (persona_wizard)
Located at `NOIZYANTHROPIC/NOIZYLAB/dreamchamber/voice_universe/actor_rob/persona_wizard/creative_genome.json`:
- Fundamental: 118 Hz, warm graveled grain, chest-forward resonance
- Emotional states: gravitas, wonder, knowing, sorrow, ancient_warmth  
- Forbidden states: panic, petulance, hollow_enthusiasm
- Signature pause: 680ms, silence_as_instrument: true
- **75/25 actor/platform royalty split, perpetual, micro-split enabled**

### RSP_001 Pipeline Voice Profile
- Personas: hero, villain, narrator
- Emotions: neutral, heroic, commanding, villainous, weary, whisper, angry
- Languages: en, es, fr, de, ja, pt
- Capture spec: 48kHz, 32f, dry booth, no FX

---

## 3. EMPIRE DOCS — `~/NOIZYANTHROPIC/NOIZYEMPIRE/` ⭐⭐⭐ THE BIBLE

The complete vision library. Strategy, history, roadmaps, investor decks.

### Structure
```
NOIZYEMPIRE/
├── docs/
│   ├── archive/
│   │   ├── 03_PRODUCTS/              ← DreamChamber specs, NoisyVox doctrine, product blueprints
│   │   │   ├── noizy-empire-master-blueprint.md
│   │   │   ├── dreamchamber-planetary-engine-architecture.md
│   │   │   ├── noizyvox-product-doctrine.md
│   │   │   ├── noizy-master-encyclopedia-draft.md
│   │   │   └── [15+ more product docs]
│   │   ├── 08_EDUCATION/             ← NOIZY Music School curriculum + credo
│   │   └── NOIZY_WORLD_MASTER_ARCHIVE.md
│   ├── maps/
│   │   ├── NOIZY_MASTER_BIBLE.md     ← THE BIBLE
│   │   ├── NOIZY_EMPIRE_MAP.md
│   │   ├── NOIZY_AUDIO_MAP.md
│   │   └── NOIZYVOX_ANTHROPIC_PARTNERSHIP.md
│   ├── strategy/
│   │   ├── NOIZY_BILLION_ARCHITECTURE.html
│   │   ├── NOIZY_CREATOR_CHARTER.html
│   │   ├── NOIZY_CIVILIZATION_MAP.html
│   │   ├── NOIZY_GREAT_RESTORATION.html
│   │   ├── NOIZY_ECONOMIC_ENGINE.html
│   │   ├── DREAMCHAMBER_2030.html
│   │   └── [20+ more strategy docs]
│   └── workspaces/
│       ├── NOIZY-SUPERSTACK.code-workspace
│       └── NOIZYEMPIRE DREAMCHAMBER.code-workspace
├── site/
│   ├── noizy_universe.html
│   ├── noizy_ascension.html
│   ├── noizy_dreamchamber_galaxy.html
│   ├── noizy_five_epochs.html
│   └── [15+ HTML pages]
├── slides/
│   ├── noizyvox_prompt_pack_10_slide_investor.md
│   ├── noizyvox_prompt_pack_17_slide.md
│   └── noizyvox_prompt_pack_5_slide_exec.md
├── tools/
│   └── dreamchamber_orchestrator.py
├── voice/
│   ├── noizylab_system.py + .talon   ← Talon voice control scripts
│   └── noizylab_voice.py + .talon
├── rescued/
│   ├── noizy_genie_ms/               ← Rescued project
│   ├── noizy_vista_demo/             ← Rescued with tools
│   └── NoizyCockPit/                 ← Rescued with noizy_sync.sh
└── gallery/
    └── noizy-gallery.html
```

**Action:** Mirror this entire directory to `~/NOIZYLAB/docs/empire/`

---

## 4. DOCUMENTS — `~/Documents/`

### `~/Documents/NOIZYLAB/` — 3,318 files

Critical files scattered here:
- `gabriel-comms.ts` — GABRIEL TypeScript communications layer
- `gabriel-mentor.ts` — GABRIEL mentor mode (28KB)
- `gabriel-metabeast.ts` — GABRIEL MetaBeast (21KB)
- `gabriel-testbeast.ts` — GABRIEL test system (19KB)
- `gabriel.ts` — Core GABRIEL TypeScript (7KB)
- `CLAUDE.md` — Another CLAUDE.md with system prompt
- `claude_system_prompt.txt` — System prompt variant
- `workflow-agents-upgraded.ts` — Upgraded agent workflows
- `voice-forge-local/` — Local voice forge
- `memory/` — Memory files
- `noizyhive/` — NoisyHive system
- `FISH_ART/` — Artwork (7 masterwork paintings + B&W + patterns)
- `NOIZY_AI_Ecosystem_Dashboard.html`

### `~/Documents/NOIZYLAB_TEXT_VAULT/` — **1,661 files**

This is the TEXT VAULT. Likely AI conversation exports, research notes, knowledge documents. Needs full review.

### `~/Documents/NOIZY_AI_LANDING_PREVIEW.html` + Investor Docs

- `NOIZY.AI - THE BIRTH OF THE FUTURE OF SOUND!.pages`
- `NOIZYVOX.pptx` (5.8MB)
- `NOIZYVOX_AIVA.pptx` (1.4MB)  
- `NOIZYWORLD - THE ECOSYSTEM.pptx` (700KB)
- `RSP_BIO_V1.pptx` (1.3MB)
- `NOIZY_Alex_Briefing.pptx` (57KB)
- `NOIZY-Alex-one-pager.md`
- `NOIZY-Alex-talking-points.md`
- Multiple Canadian canon docs (music, comedy, constellation)

---

## 5. DOWNLOADS — `~/Downloads/` — IMPORT IMMEDIATELY

| File | What | Action |
|------|------|--------|
| `dreamchamber-audio-mcp.py` (32KB) | Audio MCP server for DreamChamber | Import to mcp/ |
| `noizy-schema-v2-complete.sql` (63KB) | Full NOIZY Platform Schema v2.0 — Layer 1+2 + C2PA + DDEX + violation monitoring | Import to Heaven or docs |
| `GABRIEL_GOD_SETUP.sh` (14KB) | Full GABRIEL machine setup script | Review + archive |
| `noizy-supersonic-mcp.zip` (×3 copies) | Supersonic MCP package | Extract + dedupe |
| `noizy-workspace-configs/` | 8 workspace config files | Import |
| `talespin-complete-archive.md` | TaleSpin complete archive | Archive |
| `talespin-finder.sh` | TaleSpin finder script | Review |
| `looking-back-from-2036-definitive.md` | Definitive 2036 retrospective | Import to docs |
| `noizy-audio-orchestra-config.md` | Audio orchestra config | Import |
| `mc96eco-journey.jsx` | MC96 Eco journey component | Import to MC96 |
| `noizy-schema-v2-complete.sql` | NOIZY Platform v2 SQL schema | Import |

### `~/Downloads/Code/` — 68 code files (unexplored)
### `~/Downloads/Documents/` — 35 documents

---

## 6. EXTERNAL DRIVES

### `/Volumes/6TB/NOIZYLAB_ARCHIVES/` ⭐⭐

```
NOIZYLAB_ARCHIVES/
├── GABRIEL/              ← Previous GABRIEL (xtts_venv)
├── MC96/
│   ├── avatar/
│   ├── configs/
│   ├── GABRIEL/
│   ├── PROJECTS/
│   └── vault/SAMPLE_WORK_6TB + voice-forge-local
├── PROJECTS/
│   ├── GABRIEL/
│   ├── imports_20251207_AEON-MEGA
│   ├── NLR_01
│   ├── repairrob_staging
│   └── ROB_LEGACY/2022    ← ⭐ 2022 code (oldest archive)
└── 6tb_archive/           ← 25 items
```

```
NOIZYLAB_AUDIO_ARCHIVE/
├── GABRIEL/               ← Voice data, modules, SFX, tests, xtts_venv
├── fairseq/               ← fairseq voice synthesis framework
├── LOCAL_LLM/
└── MC96/
```

### `/Volumes/4TBSG/NOIZYLAB_ARCHIVE/`

- `FISHNET_MANIFEST.json` — **1.812 GB** — The full FISHNET asset manifest
- `gemini/` — Gemini-related archive

### `/Volumes/MAG 4TB/NOIZYFISH_THE_AQAURIUM/` ⭐⭐ GIT REPO

Has `.git` and `.claude` — an active repository:
```
NOIZYFISH_THE_AQAURIUM/
├── _01.AUDIO FROM ALL/   ← 104 items — actual audio files!
├── _02.Instruments/      ← 60 items
├── _03.Plug-Ins/         ← 1,224 items
├── _04.Utilities/        ← 53 items
├── _D0C MASTER/          ← 18 items
├── docs/
├── librosa_agent/        ← librosa audio analysis agent
├── tools/
├── .claude               ← Claude configuration
└── .git                  ← Active git repository
```

### `/Volumes/NOIZYWIN/Windows/MissionControl96/noizylab_2026/`
Windows partition with MC96 MissionControl system.

### `/Volumes/SIDNEY/MVS/`
SIDNEY drive — MVS directory (unexplored).

### `/Volumes/2TB_SGW/` (unexplored)

---

## 7. MUSIC & AUDIO PRODUCTION

| Location | What | Notes |
|----------|------|-------|
| `~/Music/Logic/` | Logic Pro projects | Current sessions |
| `~/Music/LUNA Sessions/` | LUNA sessions | UA sessions |
| `~/Music/Audio Hijack/` | Audio Hijack recordings | Capture sessions |
| `~/Movies/NOIZYEMPIRE.fcpbundle` | **Final Cut Pro project** — NOIZY EMPIRE | Video production |
| `/Volumes/4TBSG/INSTRUMENTS_TO_SORT/` | Hundreds of instrument libraries | Vox, FX, samplers |
| `/Volumes/4TBSG/Music_Production/` | Organized libraries | Sample collections |
| `/Volumes/4TBSG/OneDrive_Audio/` | FLEET_LEDGER, FISHMUSIC logs | Royalty/fleet tracking |
| `/Volumes/6TB/_ORGANIZED/` | Kontakt, BFD, EXS24, Reason, etc. | Master library |

---

## 8. CLOUD STORAGE

| Service | Account | Content |
|---------|---------|---------|
| **iCloud Drive** | rsplowman@icloud.com | `NOIZY.AI/NOIZYEMPIRE/swift-library/` |
| **Google Drive** | rsplowman@icloud.com | `NOIZYLAB_WORKSPACES/GABRIEL/CODEMASTER/` |
| **Google Drive** | rp@fishmusicinc.com | `_PROJECTS/Projects/`, `_PROJECTS/The-Aquarium/` |

---

## 9. VOICE DNA — RSP_001 PERSONA SYSTEM

The voice universe was designed. 3 personas with full creative genomes. **Real audio still needed.**

| Persona | ID | Fundamental Hz | Grain | Key Constraint |
|---------|-----|---------------|-------|---------------|
| **The Wizard** | RSP_001_WIZARD | 118 Hz | warm_graveled | silence_as_instrument, 680ms signature pause |
| **The Gangster** | RSP_002_GANGSTER | (in file) | (in file) | (see creative_genome.json) |
| **The Creature** | RSP_003_CREATURE | (in file) | (in file) | (see creative_genome.json) |

All personas: **75/25 actor split, perpetual, micro-split enabled, consent required, clone_allowed: false**

**Creative genomes at:** `~/NOIZYANTHROPIC/NOIZYLAB/dreamchamber/voice_universe/actor_rob/`

---

## 10. SCHEMA v2 — `~/Downloads/noizy-schema-v2-complete.sql`

Co-architected by RSP_001 × Claude (March 22, 2026).

**The Plowman Standard: 75/25 artist-first. Money doesn't override consent. Period.**

- **Layer 1:** Creator Identity & Consent (v1.0 upgrades)
  - Adversarial inquiry detection + risk scoring
  - Dynamic compensation tiering
  - Federated consent registries
  - Constitutional AI governance
- **Layer 2:** Asset Provenance (C2PA-aligned, DDEX-compatible)
- **Module 2:** Violation Monitoring (enforcement engine)

Standards: C2PA v2.2, DDEX ERN 4.3, ISRC (ISO 3901), ISWC (ISO 15707), NO FAKES Act, SAG-AFTRA, EU AI Act, California AB 1836

**This schema is NOT yet in Heaven. Import it.**

---

## 11. OTHER REPOS ON MACHINE

| Repo | Path | Status |
|------|------|--------|
| `~/noizy/` | `noizyanthropic/` + `noizyanthropic-edge/` | git repo, 2 sub-projects |
| `~/swift-library/` | 10 items (also in iCloud) | Swift library |
| `~/Projects/voice-forge-local/` | voice-forge-local | Local voice forge |
| `~/CascadeProjects/` | 4 items | Cascade IDE projects |
| `~/NOIZYANTHROPIC/NOIZYEMPIRE/` | Full empire docs | git repo |
| `~/NOIZYANTHROPIC/NOIZYLAB/` | Old NOIZYLAB | git repo |
| `/Volumes/MAG 4TB/NOIZYFISH_THE_AQAURIUM/` | The Aquarium | Active git repo |
| `/Volumes/6TB/Sample_Libraries/` | Sample library | git repo |
| `~/Documents/Playground/` | Playground | git repo |

---

## 12. KEY FILES IN HOME ROOT

| File | Size | What |
|------|------|------|
| `~/.env.secrets` | 1KB | **API KEYS — THE MASTER KEYS FILE** |
| `~/NOIZY_AI_LANDING_PREVIEW.html` | 18KB | Landing page preview |
| `~/package-lock.json` | 86B | Root-level npm (orphan) |
| `~/.m2ultra-boot.log` | 143KB | Machine boot log |

---

## CONSOLIDATION PLAN — IMMEDIATE ACTIONS

### 🔴 DO NOW

1. **AirDrop 3 voice recordings from iPhone**
   ```
   Settings → AirDrop → Everyone
   Share each Voice Memo → AirDrop → GOD.local
   mv ~/Downloads/*.m4a ~/NOIZYLAB/dreamchamber/test-voices/
   ```

2. **Import dreamchamber-audio-mcp.py**
   ```
   cp ~/Downloads/dreamchamber-audio-mcp.py ~/NOIZYLAB/mcp/
   ```

3. **Import noizy-schema-v2-complete.sql**
   ```
   mkdir -p ~/NOIZYLAB/docs/schema
   cp ~/Downloads/noizy-schema-v2-complete.sql ~/NOIZYLAB/docs/schema/
   ```

4. **Import voice_universe creative genomes**
   ```
   cp -r ~/NOIZYANTHROPIC/NOIZYLAB/dreamchamber/voice_universe/ \
         ~/NOIZYLAB/dreamchamber/voice-universe/
   ```

### 🟡 THIS WEEK

5. **Mirror NOIZYEMPIRE docs**
   ```
   mkdir -p ~/NOIZYLAB/docs/empire
   cp -r ~/NOIZYANTHROPIC/NOIZYEMPIRE/docs/ ~/NOIZYLAB/docs/empire/
   ```

6. **Import noisyproof (C2PA + watermark)**
   ```
   cp -r ~/NOIZYANTHROPIC/NOIZYLAB/noisyproof/ ~/NOIZYLAB/noisyproof/
   ```

7. **Import rob_ava (Avatar + Never Clauses)**
   ```
   cp -r ~/NOIZYANTHROPIC/NOIZYLAB/rob_ava/ ~/NOIZYLAB/rob_ava/
   ```

8. **Import rsp001_pipeline (Audio pipeline)**
   ```
   cp -r ~/NOIZYANTHROPIC/NOIZYLAB/rsp001_pipeline/ ~/NOIZYLAB/rsp001_pipeline/
   ```

9. **Import GABRIEL TypeScript files**
   ```
   mkdir -p ~/NOIZYLAB/docs/gabriel-ts
   cp ~/Documents/NOIZYLAB/gabriel-*.ts ~/NOIZYLAB/docs/gabriel-ts/
   ```

### 🟢 BACKLOG

10. Review `~/Documents/NOIZYLAB_TEXT_VAULT/` (1,661 files)
11. Explore `~/Downloads/Code/` (68 files)  
12. Investigate `NOIZYFISH_THE_AQAURIUM` git repo on MAG 4TB
13. Review `ROB_LEGACY/2022` on 6TB (oldest code)
14. Check `FISHNET_MANIFEST.json` (1.8GB) on 4TBSG
15. Deploy noizy-schema-v2 to Heaven

---

## KNOWN GAPS

- [ ] 3 iPhone voice recordings not yet transferred (top priority)
- [ ] v2 schema not in Heaven
- [ ] dreamchamber-audio-mcp.py not imported
- [ ] rob_ava / rsp001_pipeline not in live NOIZYLAB
- [ ] noisyproof (C2PA) not in live NOIZYLAB
- [ ] FISHNET_MANIFEST.json (1.8GB) not reviewed
- [ ] NOIZYWIN MissionControl96 not explored
- [ ] SIDNEY drive not explored
- [ ] 2TB_SGW drive not explored
