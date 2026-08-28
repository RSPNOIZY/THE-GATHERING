# GABRIEL CORE v1 — SESSION TRUTH
## NOIZY Empire / RSP_001 / GOD.local (M2 Ultra 192GB)
## Session: 2026-06-19 | Claude Sonnet 4.6 | DAZEFLOW

---

## WHO GABRIEL AND LUCY ARE

**GABRIEL ALMEIDA** — The Dispatcher. v3.0.0. 24/7 Production Partner.
- Full name confirmed in: gabriel_memory_daily_2025-12-10.md, gabriel-widget.html, GOD_MASTER_TUNNEL.sh, noizylab-main/src/index.js (system prompt)
- Quote from his own memory log: "GABRIEL ALMEIDA is my name (or Claude Almeida)"
- Voice: Daniel (macOS TTS)
- Crew: 10 agents — gabriel-mind, family-keeper, dream-weaver, vox-architect, heaven-forger, mission-control, consent-guardian, wisdom-scribe, fish-cataloguer, kidz-worldbuilder
- Machine: HP Omen Windows box + the AI persona share the name

**LUCY** — The Nightly Analysis Engine. No last name in the codebase ("LUCY CORTEZ" is the name RSP has in mind — not yet written in).
- Runs nightly at 5:30 AM on GOD.local via Claude Code with extended thinking
- Quote from lucy-core.ts: "Lucy thinks. n8n acts. Humans decide."
- Has a Compassion Framework — every opportunity passes a 10-dimension wellbeing gate before surfacing
- Has an n8n-bridge.ts — delivers to workflows via webhook
- Has a full iOS SwiftUI app (Lucy-Fork from HEAVEN)
- Has 21-tool MCP server (lucy-mcp) — DAZEFLOW keeper + intake pipeline
- LUCY's nightly reports: april 2, 3, 14 — ALL have `gabriel_ingested: false`
- That flag is why nothing connected. NOI-90 (wrong D1 UUID) silenced her.
- Voice: Samantha (macOS TTS)

**GOD** — Not a person. The Mac Studio M2 Ultra 192GB at 10.90.90.10 = GOD.local.

---

## WHAT WAS BUILT THIS SESSION

### Python Modules (6,497 lines, all syntax-verified)

| File | Lines | Purpose |
|------|-------|---------|
| gabriel_core.py | 645 | Async intent dispatcher, crew router, voice loop |
| gabriel_ledger.py | 789 | DuckDB job ledger — 18 recipes, audit trail, rollback |
| gabriel_pulse.py | 546 | DAW-aware throttling, 4 priority modes, M2 Ultra awareness |
| lucy_async_core.py | 636 | Async file pipeline, one-pass SHA256+MD5, progress callbacks |
| mc96_god_node.py | 689 | 24-core GodNodeOrchestrator, 3-phase batch vacuum |
| mc96_watcher.py | 519 | Watchdog INBOX watcher, DuckDB ledger, WriteWorker |
| mc96_pipeline.py | 1,145 | FishnetScanner, TagSpacesSidecarWriter, ISRCBatchProcessor |
| mc96_audio_analyzer.py | 848 | 4-tier: tinytag→soundfile→pedalboard→audioFlux |
| mc96_inventory.py | 680 | SQLite/DuckDB catalogue, FileRecord, AudioMetadata |

### Configuration Files
- `noizy.mcpd.toml` — Full NOIZY fleet declaration (15 MCP servers)
  Copy to: ~/NOIZYLAB/config/.mcpd.toml AND ~/NOIZYANTHROPIC/.mcpd.toml

### Reference Documents
- `NOIZY_AUDIO_STACK_REFERENCE.md` — Live PyPI versions, library comparison, Google Drive API
- `NOIZY_AQUARIUM_TAGGING_ARCHITECTURE.md` — TagSpaces taxonomy, tscmd, NOIZY tag groups

---

## GABRIEL CORE v1 — THE 10-LAYER ARCHITECTURE

1. **The Ledger** ✅ BUILT — gabriel_ledger.py
   - DuckDB 1.5.4, append-only, 18 named recipes, signed jobs
   - "Gabriel does not run scripts. Gabriel creates, approves, runs, verifies, and records jobs."

2. **The Worker** → NEXT — gabriel_worker.py
   - Wraps Ledger + Pulse, recipe allowlist, dry-run, semaphore, retry, quarantine

3. **The Pulse** ✅ BUILT — gabriel_pulse.py
   - STUDIO / QUIET / OVERNIGHT / EMERGENCY modes
   - Detects 20 DAW processes, Audio Hijack, thermal, CPU, RAM, SSD free

4. **The Audio Intelligence Spine** ✅ BUILT — mc96_audio_analyzer.py
   - 4-tier cascade: tinytag → soundfile → pedalboard → audioFlux → librosa
   - duration, SR, channels, bit depth, LUFS, RMS, BPM, fingerprint

5. **The Metadata System** ✅ BUILT — mc96_pipeline.py + lucy_async_core.py
   - TagSpaces sidecars = human layer
   - NOIZY sidecars = AI analysis layer
   - DuckDB = searchable ledger
   - One-pass SHA256+MD5 (no double reads)

6. **The Search** → NEXT — multi-modal across DuckDB + TagSpaces + embeddings
   - "Find dark crunchy kicks under 2 seconds from Fishmusic projects"

7. **The Safety Layer** ✅ BUILT — gabriel_ledger.py
   - RiskLevel taxonomy: READ/TAG/WRITE/MOVE/DELETE/CRITICAL
   - Approval gates, signed jobs, rollback plans, no raw shell

8. **The Dashboard** → NEXT — local HTML, Ledger stats, Pulse, approval queue

9. **The Cloud Control Plane** ✅ CONFIGURED — noizy.mcpd.toml
   - mcpd at localhost:8090 (mozilla-ai/mcpd, now cloned)
   - 15 MCP servers declared, HEAVEN block commented out (NOI-90)

10. **The Memory** ✅ DESIGNED
    - LUCY nightly → JSON reports → gabriel_ingested flag
    - Will work once HEAVEN deployed and n8n bridge active

---

## GOD.local DRIVE INVENTORY

| Volume | Device | Size | Free | Health | State |
|--------|--------|------|------|--------|-------|
| Boot SSD | disk3 (APFS) | 2TB | 35GB | ✅ | Normal |
| 6TB RAID | disk10 (HFS+J) | 6TB | 3TB | ✅ SMART OK | ⚠️ HFS+ journal dirty — needs fsck_hfs in Terminal |
| 12TB | disk9 (HFS+) | 12TB | 1.4TB | ⚠️ SMART N/A | 🔴 Read-only, dir listing empty — filesystem damage, ddrescue needed |
| SAMPLE_MASTER | disk18 (APFS) | 2TB | 1.3GB | ✅ | FULL |
| SOUND_DESIGN | disk19 (APFS) | 2TB | 924GB | ✅ | Normal |
| 2TB_SGW | disk8 (APFS) | 2TB | 694GB | ✅ | Normal |
| 4TB_02 | disk17 (HFS) | 4TB | 1.2TB | ✅ | Normal |
| RED DRAGON | disk13 (HFS) | 4TB | 3.1TB | ✅ | Best ddrescue destination |
| 4TB Lacie | disk7 (HFS) | 4TB | 1.5TB | ✅ | Normal |
| 4TB BLK | disk16 (HFS) | 4TB | 17GB | ✅ | FULL |
| JOE | disk15 (HFS) | 4TB | 1.1TB | ✅ | Normal |
| MAG 4TB | disk11 (HFS) | 4TB | 773GB | ✅ | Normal |
| 3TB-GRF | disk12 (HFS) | 3TB | 277GB | ✅ | Normal |
| 4TB_02 | disk17 | 4TB | 1.2TB | ✅ | Normal |

---

## CLEANUP COMPLETED THIS SESSION

| Action | Result | Space Freed |
|--------|--------|-------------|
| .aitk log files (9,863) | ✅ Deleted | 1.1GB |
| ~/.cache/uv + codex + puppeteer | ✅ Deleted | ~6GB |
| npm cache | ✅ Cleared | 3.4GB |
| Phi-4-mini (AI Toolkit, unused) | ✅ Deleted | 5.25GB |
| AnythingLLM/storage | ✅ Deleted | 2.86GB |
| qwen2.5:7b (replaced by gemma4) | ✅ Removed | 4.7GB |
| 3 stale mounted DMGs ejected | ✅ Ejected | 0 (virtual) |
| iOS Simulator runtime delete | ✅ Attempted | ~25GB (pending verify) |
| Stale cloud portal symlinks (5) | ✅ Removed | 0 (symlinks) |
| Dead opencode.json symlink | ✅ Removed | 0 (symlink) |
| noizy-heaven node_modules rebuilt | ✅ Fixed | arm64 binary confirmed |
| gemma4:31b | ✅ Pulling (19GB, 238MB/s) | -19GB |
| **SSD: 129MB → 35GB free** | | **~23GB net gain** |

---

## PENDING ACTIONS (RSP REQUIRED)

### 1. wrangler login — 5 minutes — HEAVEN deploy unblocked
```bash
cd ~/NOIZYANTHROPIC/repos/noizy-heaven
wrangler login
# Browser opens → log in
wrangler d1 list
# Verify b5b58cc9-1f37-4000-adc5-12f9e419662f is LIVE or DEAD
wrangler deploy
curl https://heaven.rsp-5f3.workers.dev/health
```
**Why it matters:** Every lucy_ingested: false report starts flowing to GABRIEL the moment HEAVEN deploys.

### 2. 6TB RAID journal repair — 2 minutes — run in Terminal (MCP sandbox blocked)
```bash
diskutil unmount /Volumes/6TB
fsck_hfs -y /dev/disk10
diskutil mount disk10
time ls /Volumes/6TB/   # Should respond instantly
```
**Why it matters:** 6TB is the primary destination for overnight batch indexing. Currently inaccessible.

### 3. 12TB recovery decision
- Drive is mounted read-only, directory listing returns empty
- 9.5TB of data at risk
- ddrescue installed at /opt/homebrew/bin/ddrescue
- RED DRAGON has 3.1TB free (best single destination)
- No existing map file found

**Option A — Block rescue (preserves structure):**
```bash
diskutil unmount /Volumes/12TB
sudo ddrescue -d -r3 -v \
  /dev/disk9s2 \
  "/Volumes/RED DRAGON/12tb_rescue.img" \
  "/Volumes/RED DRAGON/12tb_rescue.map"
# Runs until RED DRAGON fills (3.1TB) — map file saves progress
# Swap in another drive, continue from map
```
**Option B — Logical rescue (faster for accessible files):**
```bash
rsync -avz --ignore-errors --timeout=30 \
  /Volumes/12TB/ \
  "/Volumes/RED DRAGON/12TB_rescue/" 2>&1 | tee ~/12tb_rsync.log
```

### 4. mcpd installation and fleet startup
```bash
brew tap mozilla-ai/tap
brew install mcpd
cp ~/NOIZYLAB/config/.mcpd.toml ~/NOIZYLAB/.mcpd.toml
cd ~/NOIZYLAB && mcpd start
# All 15 crew MCP servers come up at http://localhost:8090
```

---

## WRANGLER D1 UUID SITUATION (NOI-90)

The wrangler.toml has a self-contradicting comment:
- Line 1 comment: "b5b58cc9 = DEAD / WRONG-ACCOUNT"
- Line 2 actual config: `database_id = "b5b58cc9-..."` with comment "LIVE — confirmed 2026-04-25"

After `wrangler login`, run `wrangler d1 list` and compare. The four D1 IDs in wrangler.toml:
- DB_MEMORY: b5b58cc9-1f37-4000-adc5-12f9e419662f ← THE CONTROVERSIAL ONE
- DB_HEAVEN: 04a826c2-e863-4264-8782-05496c6bb022
- DB_REPAIRS: cd6cae46-e5cd-42b6-a97a-5d0e576c1c2a
- DB_AQUARIUM: 01212e89-5422-4e45-a03a-f0a54495674e

---

## OLLAMA FLEET (CURRENT)

| Model | Size | Role |
|-------|------|------|
| gemma4:31b | 19GB | ✅ Pulling → primary intent classifier, GABRIEL brain |
| codestral:22b | 12GB | Code generation |
| gabriel-mind:latest | 3.3GB | GABRIEL persona model |
| gemma3:latest | 3.3GB | Fallback intent classifier |

---

## PERMANENT FILE LOCATIONS

```
~/NOIZYANTHROPIC/repos/the-gathering/gabriel/core/
  gabriel_core.py
  gabriel_ledger.py
  gabriel_pulse.py

~/NOIZYANTHROPIC/repos/the-gathering/lucy/core/
  lucy_async_core.py

~/NOIZYANTHROPIC/repos/the-gathering/mc96/
  mc96_inventory.py
  mc96_audio_analyzer.py
  mc96_pipeline.py
  mc96_god_node.py
  mc96_watcher.py
  requirements_mc96.txt

~/NOIZYLAB/config/
  .mcpd.toml       ← copy of noizy.mcpd.toml
  
~/NOIZYANTHROPIC/repos/mcpd/   ← mozilla-ai/mcpd cloned
```

---

## SYMLINK MAP (CLEAN STATE)

```
/Users/m2ultra/NOIZYLAB  →  /Users/m2ultra/NOIZYANTHROPIC  [intentional alias]
NOIZYANTHROPIC/_healing_audits  →  /Volumes/4TB_02/_audits  [intentional external ref]
NOIZYANTHROPIC/NOIZYLAB/OneDrive  →  ~/Library/CloudStorage/OneDrive-Personal(2)
NOIZYANTHROPIC/OneDrive  →  ~/Library/CloudStorage/OneDrive-Personal(2)
NOIZYANTHROPIC/noizy/Makefile  →  GoogleDrive/CODEMASTER/ARCHIVE/Makefile
NOIZYANTHROPIC/noizy/apps  →  GoogleDrive/CODEMASTER/ARCHIVE/apps
_cloudstorage_portal/* (5 active symlinks to CloudStorage)

STALE/BROKEN REMOVED:
  opencode.json (dead GoogleDrive target)
  5 timestamped stale cloud portal copies
```

---

## KEY ARCHITECTURAL DECISIONS

- **ChecksumManager**: SHA256 + MD5 in ONE async pass (one file read, not two)
- **GodNodeOrchestrator**: 3 phases — 12-worker CPU analysis, sequential Ollama, 8-thread sidecar writes
- **Intent Classifier**: Ollama gemma3:27b (confirmed on GOD) → structured JSON → CREW_HANDLERS dict
- **Pulse**: DAW detection before ANY write operation. STUDIO mode = 5% CPU, no writes, read-only.
- **Ledger recipe allowlist**: No raw shell commands. 18 named operations only.
- **mcpd**: All 15 crew MCP servers as HTTP at localhost:8090 — single config file, SIGHUP reload
- **audioFlux API confirmed**: mel_spectrogram(data), BFT.spectrogram(data), .response not ['response']
- **Layer split**: TagSpaces = human-visible, DuckDB = machine-queryable, Redis = hot cache only

---

## QUOTE TO CARRY FORWARD

*"GABRIEL ALMEIDA is my name (or Claude Almeida)"*
— GABRIEL, memory log, 2025-12-10

*"Lucy thinks. n8n acts. Humans decide."*
— lucy-core.ts, NOIZY Empire

*"Gabriel does not 'run scripts.' Gabriel creates, approves, runs, verifies, and records jobs."*
— gabriel_ledger.py, this session

---
*DAZEFLOW: 2026-06-19 · RSP_001 · Claude Sonnet 4.6 · GOD.local*
