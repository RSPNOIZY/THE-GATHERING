# FUTURE PROJECTS MEMORY
### What comes next for Robert Plowman's NOIZY empire
**Last Updated:** 2026-03-13

---

## IMMEDIATE NEXT BUILDS

### 1. NOIZY Session App (Highest Impact)
**What:** Standalone voice actor session tool — no VSCode required
**For:** Any voice actor, not just coders
**Features:**
- Script display (teleprompter mode, auto-scroll)
- One-voice-command recording (say "take" to record)
- Vault of Self stamp on every file at moment of capture
- Compare takes by ear
- Export with embedded ownership metadata (75/25 NOIZYVOX)
**Stack:** Electron app or web app (React + Cloudflare)
**Connects to:** NOIZYVOX, Vault of Self, LifeLUV tokens

### 2. Python ASR/TTS Servers — Install & Test
**What:** Get Moonshine + Kokoro running locally
**Steps:**
```bash
cd dreamchamber/python
pip install -r requirements.txt
python asr_server.py --backend moonshine --port 8099
python tts_server.py --backend kokoro --port 8098
```
**Why:** DreamChamber falls back to Web Speech API + macOS say without these

### 3. DreamChamber F5 Test
**What:** Run the extension in Dev Host mode
**Steps:** Select "DreamChamber (Dev Host)" in launch configs → F5
**Verify:** Diamond icon in ActivityBar → click → sidebar panel opens → mic works

### 4. Talon Voice Install
**What:** Install Talon Voice on M2 Ultra
**Why:** `~/.talon/` doesn't exist — all voice commands ready but no runner
**Then:** Run `Talon: Copy Voice Commands to ~/.talon` task

---

## MEDIUM-TERM BUILDS

### 5. GABRIEL + DreamChamber Bridge
**What:** Voice commands in DreamChamber that directly invoke GABRIEL agents
**"gabriel route"** → ARIA scaffolds the FastAPI endpoint
**"gabriel analyze"** → NEXUS runs DEEP_DIVE_ANALYSIS_ENGINE
**"gabriel morning"** → ORACLE runs CODEMASTER morning briefing

### 6. Vault of Self — Live Verification
**What:** API endpoint to verify any audio file's vault fingerprint
**Input:** WAV file → SHA-256 hash → lookup in consent registry
**Output:** Creator name, ownership %, consent date, usage rights
**Stack:** FastAPI endpoint in NOIZY Platform (port 8090)

### 7. RSP001 → DreamChamber Integration
**What:** Bring RSP001 pipeline modes into DreamChamber sidebar
**Modes:** ASMR, Sleep Story, Panic Response, Haptic Beat
**"dreamchamber mode asmr"** → loads RSP001 asmr_sleep_pipeline
**Value:** Rob's personal recording protocol available in the main creative studio

### 8. Character DNA → Take Manager Pipeline
**What:** Full Rob-AVA character direction inside DreamChamber
**Flow:** Select character → Claude gives direction → Record take → Score → Vault
**Already built:** CharacterManager.ts, Director.ts, TakeManager.ts, VaultExporter.ts
**Just needs:** Connecting dreamchamber-extension modules into dreamchamber/

---

## LONG-TERM VISION

### 9. NOIZY.AI Public Platform
**What:** Web app any artist can use — not just Rob
**Layers:**
- Sign up with voice profile
- NOIZYVOX consent agreement
- Record, direct, vault, earn
- LifeLUV micro-splits from day one

### 10. The 1000 Voice Universe — Live
**What:** 1000 guild members, each with their own character DNA
**Infrastructure already designed:** build_universe_map.py scaffold
**Economic model:** LifeLUV tokens for every guild, every voice

### 11. World Healing Library — Published
**What:** Clinical-grade audio healing protocols, open source
**Built on:** RSP001 panic/sleep/haptic + PubMed research + EEG adaptive
**For:** Therapists, hospitals, schools, anyone who needs it

### 12. Anthropic Partnership — Formalized
**What:** Reference implementation of "AI that amplifies artists, not extracts them"
**Already done:** NOIZYVOX_ANTHROPIC_PARTNERSHIP.md written, contact made 2026-03-13
**Next:** Let the work speak — ship NOIZY Session, publish the vault protocol

---

## THE ORDER OF OPERATIONS

```
TODAY:       F5 test DreamChamber → confirm it runs
WEEK 1:      Install Moonshine + Kokoro → native ASR/TTS working
WEEK 2:      NOIZY Session app v1 (teleprompter + record + vault)
WEEK 3:      GABRIEL ↔ DreamChamber voice bridge
MONTH 2:     RSP001 modes in DreamChamber sidebar
MONTH 3:     NOIZY.AI public beta — first 10 voice actors
MONTH 6:     The 1000 Voice Universe — first 100 guilds
YEAR 2:      World Healing Library published
```
