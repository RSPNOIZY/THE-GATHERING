# M2 ULTRA COMPLETE STORAGE AUDIT
**Date:** April 3, 2026
**Machine:** GOD.local — M2 Ultra Mac Studio
**Users:** m2ultra, noizylab
**Auditor:** Claude (co-architect session with Robert Stephen Plowman)

---

## 1. STORAGE OVERVIEW — 14 VOLUMES, ~45 TB TOTAL

| # | Volume | Device | Size | Used | Free | Capacity | Status |
|---|--------|--------|------|------|------|----------|--------|
| 1 | **M2 Ultra (system)** | /dev/disk3s1 | 1.8 TB | 645 GB | 1.2 TB | 36% | Healthy |
| 2 | **12TB** | /dev/disk19s2 | 11 TB | 9.5 TB | 1.4 TB | 87% | Watch — filling |
| 3 | **6TB** | /dev/disk12 | 5.5 TB | 4.6 TB | 845 GB | 85% | Watch — filling |
| 4 | **MAG 4TB** | /dev/disk5s2 | 3.6 TB | 2.9 TB | 773 GB | 80% | Watch |
| 5 | **4TB BLK** | /dev/disk15s2 | 3.6 TB | 3.6 TB | 17 GB | 100% | CRITICAL — FULL |
| 6 | **4TB Lacie** | /dev/disk4s2 | 3.6 TB | 504 GB | 3.1 TB | 14% | Healthy — mostly empty |
| 7 | **RED DRAGON** | /dev/disk16s2 | 3.6 TB | 248 GB | 3.4 TB | 7% | Healthy — mostly empty |
| 8 | **JOE** | /dev/disk17s2 | 3.6 TB | 2.0 TB | 1.6 TB | 56% | Healthy |
| 9 | **SIDNEY** | /dev/disk9s2 | 2.7 TB | 2.5 TB | 282 GB | 90% | Watch — filling |
| 10 | **2TB_SGW** | /dev/disk8s1 | 1.8 TB | 1.2 TB | 639 GB | 66% | Healthy |
| 11 | **SOUND_DESIGN** | /dev/disk21s1 | 1.8 TB | 815 GB | 1.0 TB | 45% | Healthy |
| 12 | **SAMPLE_MASTER** | /dev/disk20s1 | 1.8 TB | 1.8 TB | 38 MB | 100% | CRITICAL — FULL |
| 13 | **NOIZYWIN** | /dev/disk6s2 | 234 GB | 166 GB | 67 GB | 72% | Windows partition |
| 14 | **Claude** | /dev/disk22s1 | 962 MB | 644 MB | 318 MB | 67% | Claude.app install |

### Capacity Alerts
- **4TB BLK** — 100% full, 17 GB free. No room for anything. Risk of corruption on write attempts.
- **SAMPLE_MASTER** — 100% full, 38 MB free. Same risk.
- **SIDNEY** — 90% full, movie library.
- **12TB** — 87% full, this is the main hub drive.
- **6TB** — 85% full, archives.

---

## 2. VOLUME-BY-VOLUME CONTENTS

### 2.1 M2 ULTRA SYSTEM DRIVE (~645 GB used)
**Home directory: /Users/m2ultra**

**Active Code & Projects:**
- `~/NOIZYLAB/` — Primary development hub (50+ subdirectories)
- `~/NOIZYANTHROPIC/` — GitHub repo with CLAUDE.md, GABRIEL, NOIZYEMPIRE, NOIZYLAB, GORUNFREE, NOIZYINDIGENIOUS
- `~/NOIZYEMPIRE/` — AI FAMILY directory
- `~/GORUNFREE/` — Logs
- `~/Projects/` — GORUNFREE, MC96, voice-forge-local
- `~/workers/` — HEAVEN worker
- `~/Desktop/CLAUDE TODAY/` — gk-cli git repo

**NOIZYLAB Subdirectories (Active Development):**
- `apps/` — Application builds
- `artifacts/` — Build artifacts
- `cloudflare-workers/` — Worker deployments
- `contracts/` — Smart/legal contracts
- `dashboard/` — Monitoring dashboard
- `dns-exports/` — DNS zone exports
- `docs/` — Documentation (30 items)
- `dreamchamber/` — VSCode extension (31 items)
- `dreamchamber-audio-mcp/` — Audio MCP for DreamChamber
- `enterprise/` — Enterprise configs
- `governance/` — Consent & governance
- `logs/` — Operational logs
- `lucy/` — LUCY agent (archives/indexing)
- `mc96/` — MissionControl96 core
- `mc96-portal/` — MC96 web portal
- `mcp/` — MCP server configs (14 items)
- `mcp-gemma3/` — Gemma3 MCP server
- `modelfiles/` — Ollama model files (13 items)
- `noisyproof/` — Cloudflare Worker (heaven.rsp-5f3.workers.dev)
- `noizy-landing/` — Landing page
- `noizybeast/` — NoizyBeast IDE
- `noizyempire-claude/` — Claude integration
- `noizyfish/` — The Aquarium
- `noizyvox/` — Cloudflare Worker (vox.noisy.io)
- `ops/` — Operations
- `repos/` — 14 Git repositories (see below)
- `rob_ava/` — Trust loop server
- `rsp001_pipeline/` — Voice pipeline
- `scripts/` — Utility scripts (18 items)
- `src/` — Source code
- `supersonic/` — Supersonic project
- `tools/` — Developer tools
- `voice-pipeline/` — Voice processing pipeline
- `web/` — Web assets
- `workers/` — Cloudflare workers

**Git Repositories (~/NOIZYLAB/repos/):**
1. noizy-lab
2. noizy-gabriel
3. noizy-heaven
4. noizy-aquarium
5. noizy-infra
6. noizy-kidz
7. noizy-fish
8. noizy-wisdom
9. noizy-ai
10. noizy-supersonic
11. noizy-vox
12. noizy-consent
13. noizy-voice
14. noizy-docs

**Key Documentation in ~/NOIZYLAB/:**
- CLAUDE.md, README.md, GOSPEL.md, RELEASE.md
- NOIZY_MASTER_INDEX_v1.0.md, NOIZY_EMPIRE_COMPLETE_v1.0.md
- NOIZY_GOVERNANCE_v1.0.md, NOIZY_LEGAL_REGULATORY_v1.0.md
- UNIVERSAL_PROTECTOR_STRATEGY.md (45 KB — major document)
- NOIZYSTREAM_SPEC.md, NOIZY_BEAST_IDE_BLUEPRINT.md
- VOICE_CONTROL_PIPELINE.md, NCP_v1.0_SPEC.md
- PHASE_2_EXECUTION_PLAN.md, TOTAL_DEPLOYMENT_FRAMEWORK.md
- OPERATIONS_MANUAL.md, DOCUMENTATION_MANIFEST.md
- HEAVEN_RUNBOOK.md, MIGRATION_AUDIT.md
- MCP_MASTER_REFERENCE.docx (19 KB)
- LAUNCH_NOIZYLAB_COMPLETE.sh (executable)

**~/Documents/ (selected):**
- 2026_NOIZYANTHROPIC/
- Claude/ — Claude app data
- NOIZYLAB/ and NOIZYLAB.code-workspace
- NOIZY strategy documents (.md, .pages)
- Audio Hijack configs
- Historical documents from Fish MacPro, RSP_Evo, RSP_MS

**Gemini CLI History:**
- 14+ Gemini history repos in ~/.gemini/history/ including named projects: swift-library, noizy-command-center, noizyanthropic

---

### 2.2 /Volumes/12TB (11 TB — 87% full) — THE HUB DRIVE

**Code & Projects:**
- `MissionControl96/` → `noizylab_2026/` (18 items)
- `GitHub/` → `Noizyfish/` (single project)
- `CODEMASTER/` — MissionControl96_Support (2,827 items), NOIZYLAB, NOIZYLAB_ARCHIVES, NOIZYLAB_WORKSPACE, _2026 PROJECT MASTER (22 items), _ORGANIZED, __2025 DOCUMENTS, __2025 PROJECT DUPES
- `_NOIZYLAB/` — MC96ECOUNIVERSE.workflow, R.S's Personal Voice recordings, USER SCRIPTS
- `_NOIZY.AI/` — Empty

**Audio & Samples (bulk of space):**
- `_WAVE/` — 20,964 items (massive WAV library)
- `_03.Plug-Ins/` — 1,224 items
- `_01.AUDIO FROM ALL/` — 121 items
- `_02.Instruments/` — 61 items
- `_04.Utilities/` — 53 items
- `Samples To Sort 2022/` — 108 items
- `_Spectrasonics_3rd_Party/` — 68 items
- `AUDIO_SFX_LIBRARY/` — 28 items
- `_D0C MASTER/` — 18 items

**Organization & Archives:**
- `NOIZYLAB_ARCHIVES/` — 25 items
- `_ORGANIZED/` — 7 items
- `_FEB_2026_DUPES/` — 9 items
- `Volume_Inventory/` — Previous inventory files (Dec 2025)
- `reports/` and `scripts/`

**Other:**
- `2025 FISH WDC/`
- `Installers/`
- `Audio_Evacuation_M2Ultra/`, `Fat_Relocation_M2Ultra/`
- `WindowsPowerShell/`
- `NOIZYLAB.CA - 01152026 - BUILD.pptx`

---

### 2.3 /Volumes/6TB (5.5 TB — 85% full) — ARCHIVES

- `NOIZYLAB_ARCHIVES/`
- `NOIZYLAB_AUDIO_ARCHIVE/`
- `Sample_Libraries/`
- `Superior_Drummer_TCI/`
- `_ORGANIZED/`
- MC96_SOURCE_DUMP.txt (inventory file)

---

### 2.4 /Volumes/MAG 4TB (3.6 TB — 80% full) — INSTRUMENTS

- `01_Drums/`
- `02_EastWest/` (EastWest sample libraries)
- `Creative Cloud Files/`
- `NOIZYFISH_THE_AQAURIUM/`

---

### 2.5 /Volumes/4TB BLK (3.6 TB — 100% FULL) — PLUGINS & SAMPLES

- `02_Factory_Libraries/`
- `Avid/`
- `EXPANSIONS/`
- `FXpansion/`
- `INSTRUMENTS/`
- `NOIZYLAB_ARCHIVE/`
- `PLUGINS/`
- `PRESETS/`
- `REX2_Loops/`
- `SAMPLES/`
- `Steven_Slate/`
- `Toontrack_EZDrummer/`

---

### 2.6 /Volumes/4TB Lacie (3.6 TB — 14% full) — DESIGN

- `01_DESIGN_REUNION/`
- `LIBRARY/`

---

### 2.7 /Volumes/RED DRAGON (3.6 TB — 7% full) — BACKUPS & ARCHIVES

- `2020_Desktop_Pix/`
- `EM_BACKUP_2026/`
- `FXPANSION/`
- `M2ULTRA_ARCHIVE_20260103/`
- `M2ULTRA_ARCHIVE_20260104/`
- `_ORGANIZED/`
- `noizylab_2026/`

---

### 2.8 /Volumes/JOE (3.6 TB — 56% full) — MUSIC & CODE

- `00.CODE & DOCS 2026/` — Archives, FISH.png, PPTX, _ZERO_LATENCY_VAULT
- `FISHMUSIC_2026_MASTER/` — 8 items (current music production)
- `LIVE SHOW 2026/` — 34 items (performance content)
- `Logic Pro Library.bundle/` — Logic Pro sound library
- `MUSIC THEORY/` — 21 items (reference materials)
- `NOIZYLAB_WORKSPACES/` — 00.CODE & DOCS, 01.MUSIC & PROJECTS, 02.SOUND DESIGN & SFX, 03.VOICES, 04.VIDEO, GABRIEL
- `Samples/` — 15 items
- `_2025 MOVIES/`

---

### 2.9 /Volumes/SIDNEY (2.7 TB — 90% full) — MOVIE LIBRARY

- `MVS/` — 885 .m4v movie files (personal movie collection)

---

### 2.10 /Volumes/2TB_SGW (1.8 TB — 66% full) — PERSONAL & MUSIC

- `2025 HEALTH/`
- `Music 2023/` — 1,530 items
- `Current Screenshots/`
- `FISHMUSIC_2026_MASTER/` — 10 items
- `Music/` — 142 items
- `RapidCopy/` — 12 items (copy utility)
- `VoiceTrigger/`
- `_2026_IMAGES/`
- `__2025 GROUPED BY ARTIST/` — 33 items
- `rsp_deux/` — 21 items

---

### 2.11 /Volumes/SOUND_DESIGN (1.8 TB — 45% full)

- `EM_BACKUP_2026/` — 17 items
- `FEB2026_DOWNLOADS/` — 133 items
- `RSP_media_move/`
- `_2026_MASTER/` — 20 items
- `_FISH_PIX/`

---

### 2.12 /Volumes/SAMPLE_MASTER (1.8 TB — 100% FULL)

- `AUDIO_SFX_LIBRARY/` — 28 items
- `FXPANSION/`
- `KH ORCHESTRAL COLLECTION/`
- `NOIZYFISH_THE_AQAURIUM/`
- `NOIZYLAB_ARCHIVES/`
- `Samples To Sort 2022/` — 108 items
- `_01.AUDIO FROM ALL/` — 123 items
- `_02.Instruments/` — 53 items
- `_D0C MASTER/`
- `_ORGANIZED/`
- `Volume_Inventory/` — Same 3 inventory files as 12TB
- `scripts/`

---

### 2.13 /Volumes/NOIZYWIN (234 GB — 72% full)

- Windows installation (System Volume Information, $RECYCLE.BIN)

---

### 2.14 /Volumes/Claude (962 MB)

- Claude.app desktop application

---

## 3. DUPLICATE FOLDERS DETECTED

These folder names appear on **multiple volumes** and may contain redundant data:

| Folder Name | Locations | Risk |
|-------------|-----------|------|
| **NOIZYLAB_ARCHIVES** | 12TB, 6TB, SAMPLE_MASTER | High — 3 copies, unclear which is canonical |
| **_ORGANIZED** | 12TB, 6TB, SAMPLE_MASTER, RED DRAGON | High — 4 copies |
| **_01.AUDIO FROM ALL** | 12TB, SAMPLE_MASTER | Medium — 2 copies |
| **AUDIO_SFX_LIBRARY** | 12TB, SAMPLE_MASTER | Medium — 2 copies |
| **FISHMUSIC_2026_MASTER** | JOE, 2TB_SGW | Medium — active project, 2 copies |
| **EM_BACKUP_2026** | RED DRAGON, SOUND_DESIGN | Low — intentional backup |
| **FXPANSION** | SAMPLE_MASTER, RED DRAGON | Medium — 2 copies |
| **Volume_Inventory** | 12TB, SAMPLE_MASTER | Low — identical inventory files |
| **NOIZYFISH_THE_AQAURIUM** | MAG 4TB, SAMPLE_MASTER | Medium — 2 copies |
| **NOIZYLAB.CA - BUILD.pptx** | 12TB (root), SAMPLE_MASTER (root), JOE | Low — same file, 3 copies |

---

## 4. EXISTING INVENTORY FILES (December 2025)

Found on both 12TB and SAMPLE_MASTER at `/Volume_Inventory/`:
- `Inventory_4TB Blue Fish.txt` — 228 MB
- `Inventory_4TB FISH SG.txt` — 447 MB
- `Inventory_6TB.txt` — 417 MB
- `MC96_SOURCE_DUMP.txt` — on 6TB root

These are from a previous audit (Dec 15, 2025). This audit supersedes and extends them.

---

## 5. CLASSIFICATION SUMMARY

### Code & Development (~estimated 50-100 GB across all volumes)
- **Primary:** ~/NOIZYLAB/ (50+ directories, 14 git repos)
- **Secondary:** ~/NOIZYANTHROPIC/ (GitHub repo)
- **Archive:** ~/NOIZYEMPIRE/, 12TB/CODEMASTER/, 12TB/MissionControl96/
- **Projects:** ~/Projects/ (3 projects)
- **Workers:** ~/workers/HEAVEN

### Audio, Samples & Instruments (~estimated 25-30 TB)
- **4TB BLK** — 3.6 TB of plugins, presets, samples (FULL)
- **SAMPLE_MASTER** — 1.8 TB of audio libraries (FULL)
- **12TB** — Multi-TB of WAV, instruments, plug-ins
- **6TB** — Sample libraries, audio archives
- **MAG 4TB** — Drums, EastWest, ~2.9 TB
- **JOE** — Music production, Logic library
- **2TB_SGW** — Music collections
- **SOUND_DESIGN** — Sound design assets

### Video & Media (~estimated 5-7 TB)
- **SIDNEY** — 2.5 TB movie library (885 .m4v files)
- **JOE** — 2025 movies
- **2TB_SGW** — Images, screenshots

### Documents & Archives (~estimated 1-2 TB)
- **12TB** — CODEMASTER, _D0C MASTER, reports
- **JOE** — 00.CODE & DOCS 2026, MUSIC THEORY
- **RED DRAGON** — M2Ultra archives (Jan 2026)

### Backups (~estimated 2-3 TB)
- **RED DRAGON** — M2ULTRA_ARCHIVE_20260103, M2ULTRA_ARCHIVE_20260104, EM_BACKUP_2026
- **SOUND_DESIGN** — EM_BACKUP_2026

---

## 6. CRITICAL RISKS & RECOMMENDATIONS

### Immediate Concerns
1. **4TB BLK at 100%** — No writes possible. Risk of filesystem corruption. Needs space freed or content migrated.
2. **SAMPLE_MASTER at 100%** — Same situation. 38 MB free is dangerous.
3. **Duplicate data consuming TB across drives** — NOIZYLAB_ARCHIVES alone is on 3 drives.
4. **No clear canonical source** — Multiple copies of key folders with no documentation of which is the "golden" copy.

### Recommended Next Steps
1. **Establish a canonical drive map** — Designate one authoritative location for each category of data.
2. **Dedup audit** — Run checksums on duplicated folders to confirm which are true copies vs. diverged versions.
3. **Free space on critical drives** — Migrate confirmed duplicates off 4TB BLK and SAMPLE_MASTER.
4. **Consolidate code** — All 14 git repos + NOIZYANTHROPIC + NOIZYEMPIRE should have a clear home and backup strategy.
5. **Tag drives by role** — PRIMARY (active work), ARCHIVE (cold storage), BACKUP (redundancy), STAGING (in-progress).
6. **Automated inventory** — Set up a recurring scan (n8n or cron) that generates fresh inventory files and detects drift.

---

## 7. DRIVE ROLE SUGGESTIONS

| Role | Suggested Drive | Rationale |
|------|----------------|-----------|
| **PRIMARY CODE** | M2 Ultra system | SSD speed, ~/NOIZYLAB is already here |
| **PRIMARY AUDIO** | 12TB | Largest drive, most audio already here |
| **ARCHIVE** | 6TB | Already contains archive folders |
| **INSTRUMENTS** | 4TB BLK + MAG 4TB | Plugin/preset libraries (need space relief on BLK) |
| **BACKUP** | RED DRAGON (3.4 TB free) | Low usage, already has archive snapshots |
| **STAGING** | 4TB Lacie (3.1 TB free) | Mostly empty, good for incoming/sorting |
| **MEDIA** | SIDNEY | Movie library — dedicated purpose |
| **MUSIC PRODUCTION** | JOE | Active music projects |
| **SOUND DESIGN** | SOUND_DESIGN | Named for its purpose |
| **OVERFLOW** | RED DRAGON / 4TB Lacie | Most free space available |

---

*This audit is a point-in-time snapshot. File counts marked with * are capped at scan depth limits. Deep byte-level dedup requires follow-up checksumming.*

*Generated by Claude in co-architect session with Robert Stephen Plowman — NOIZY EMPIRE / MC96ECOUNIVERSE*
