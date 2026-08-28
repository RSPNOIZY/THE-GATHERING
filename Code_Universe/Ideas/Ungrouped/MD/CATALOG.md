# GABRIEL TURBO SCRIPTS — CANONICAL CATALOG

**Last verified:** 2026-04-20
**Ratified by:** RSP_001 — "GREP & LOAD & EMBRACE & HOLD FOREVER" decree
**Universal rule:** [`.claude/rules/turbo-scripts.md`](../../.claude/rules/turbo-scripts.md) (auto-loaded by every Claude Code session)

---

## FAMILY 1 — CODEMASTER python (canonical: `tools/CODEMASTER/turbo-scripts/turbo-python/`)

### Python brains (11)

| Script                  | Purpose                                                                                                                                                                                   | Notes / known stubs                                                          |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `turbo_bridge.py`       | Flask + SocketIO Unity↔Python↔Web Portal bridge with MemCell V3 hooks. `/api/interact` accepts `{text, context}`, runs through MemCell, speaks via macOS `say`, pushes to portal.         | Listens on default Flask port; needs `GABRIEL_SECRET_KEY` env var            |
| `turbo_config.py`       | Secure `.env` manager. `setup` interactively writes OPENAI/GOOGLE/ELEVENLABS/SUNO/GOOGLE_CLOUD_PROJECT keys with `0o600` perms. `get`/`set` for individual keys.                          | Stores at `~/NOIZYANTHROPIC/NOIZYLAB/.env`                                   |
| `turbo_ears.py`         | Whisper STT listen-and-transcribe loop.                                                                                                                                                   | **STUB** — currently simulates. Needs PyAudio + mic permission               |
| `turbo_evolution.py`    | Reads `~/NOIZYANTHROPIC/NOIZYLAB/memory/memcell_v3.json` and writes self-improvement insights to `evolution_status.json`. Vibe consistency, focus analysis, pattern detection.            | Depends on MemCell V3 schema                                                 |
| `turbo_fishnet.py`      | Parallel `ThreadPoolExecutor` scan for >10MB media (Kontakt, audio, video, disk images, archives) across NOIZYLAB + Documents/PROJECTS. Quarantines big fish to HP-OMEN or local archive. | Skips `_ARCHIVE` paths automatically                                         |
| `turbo_media.py`        | Google Veo 3.1 video generation + audio generation orchestrator. Reads keys via `turbo_config`.                                                                                           | Needs `GOOGLE_GENAI_API_KEY` and `pip install google-genai`                  |
| `turbo_net_check.py`    | Parallel MC96ECOUNIVERSE network health: 8.8.8.8 reachability, DNS resolution, default gateway ping, per-host status.                                                                     | Used by `turbo_reset.sh`                                                     |
| `turbo_plugin_heist.py` | Consolidates `.vst/.vst3/.component/.aaxplugin/.dmg/.pkg/.iso` from many sources to `~/Library/CloudStorage/GoogleDrive-rp@fishmusicinc.com/My Drive/NOIZYLAB_LIBRARIES/_PLUGINS`.        | Non-destructive — moves into vault                                           |
| `turbo_recall.py`       | Walks `~/Documents/PROJECTS`, classifies each project (Unity / Logic / Web / Python / Git), ingests into MemCell V3.                                                                      | Hardcoded to `~/Documents/PROJECTS` — may miss canonical NOIZYANTHROPIC tree |
| `turbo_speed.py`        | Bandwidth test against `speedtest.tele2.net/10MB.zip`, grades 4K UHD / HD / SD streaming readiness.                                                                                       | Uses fixed 10MB sample                                                       |
| `turbo_vitals.py`       | Live CPU load (uptime), swap usage (`vm.swapusage`), disk usage.                                                                                                                          | macOS-specific                                                               |

### Shell ops (4)

| Script                | Purpose                                                                                                                                                                                       | Notes                                                              |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `turbo_git_sync.sh`   | Multi-repo `git add . && git commit && push` across `~/NOIZYLAB`, `~/Documents/GABRIEL`, `~/Documents/PROJECTS/*`, plus `/Volumes/HP-OMEN/{NOIZYLAB,GABRIEL}` if mounted. Skips non-git dirs. | Auto-commit message: `Turbo Sync: <timestamp>`                     |
| `turbo_mount_omen.sh` | SMB-mounts `//gabriel@192.168.1.100/GABRIEL` to `/Volumes/HP-OMEN`.                                                                                                                           | **HARDCODED IP** — replace `192.168.1.100` before use              |
| `turbo_reset.sh`      | Vitals → DNS flush (`dscacheutil + mDNSResponder`) → `turbo_net_check` → `turbo_speed` → `~/Library/Caches/*` wipe → MemCell log → modem-reboot prompt.                                       | Calls into `~/NOIZYLAB/scripts/turbo/*` paths — verify those exist |
| `turbo_zap.sh`        | Network hammer: DNS flush → `ipconfig set en0 DHCP` → `ifconfig en1 down/up` → `ifconfig en0 down/up` → 5s wait → ping switch `10.0.0.132` → manual modem-reboot prompt for Rogers.           | Sudo required                                                      |

### Top-level pipeline shell

| Script              | Purpose                                                                                                                                                                                                                                                                                                                                      |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `turbo_pipeline.sh` | **HEAL → DEDUPE → UNIFY → VERIFY** in 4 numbered steps. Step 1: ruff format + repo manifest JSON + empty-dir purge. Step 2: SHA-256-based duplicate detector → `_quarantine_duplicates/`. Step 3: unify manifest (review-only). Step 4: Python syntax check + import sanity. Writes reports to `reports/{repo_manifest,dedupe_report}.json`. |

---

## FAMILY 2 — MC96-app runtime brains (canonical: `mc96/app/turbo_*`)

| Script                   | Purpose                                                                                                                                                                                                                                                                                                                                                                                                           | Notes                                                                      |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `turbo_gabriel_omega.py` | **THE RUNTIME BRAIN.** Loads Llama-3-8B (mlx-community Meta-Llama-3-8B-Instruct-4bit) into MLX unified memory as `SiliconCortex`. Loads MusicGen large as `Maestro`. Opens virtual MIDI out `Gabriel_Virtual_Out`. Imports `turbo_memcell`, `turbo_prompts`, `turbo_audio_ai`, `turbo_video_ai`, `turbo_telemetry`. Master constant `MASTER` = Llama-3-70B-4bit (currently switched to GHOST/8B for fast launch). | Heavy MLX dependency — runs only on Apple Silicon                          |
| `turbo_prompts.py`       | Canonical `SYSTEM` prompt for Gabriel Omega: military-calm, Three Laws (Consent Auditor pre-dispatch, no agent operates alone, POPS/SHIRL wellbeing can elevate to STOP), explicit FAMILY block warning never to confuse SHIRL ≠ SHIRLEY, POPS ≠ ENGR_KEITH, CONSENT_AUDITOR ≠ CONSENT_GUARDIAN ≠ CONSENT_ORACLE.                                                                                                 | Imported by `turbo_gabriel_omega.py` and any lightweight gabriel CLI       |
| `turbo_memcell.py`       | Bridge — adds `~/NOIZYANTHROPIC/NOIZYLAB/scripts/core` to sys.path and re-exports `MemCell_V3.MemCell`.                                                                                                                                                                                                                                                                                                           | Single-line shim                                                           |
| `turbo_telemetry.py`     | Thread-safe in-memory timer registry. `start(name)` / `stop(name, category)` writes to `~/NOIZYANTHROPIC/NOIZYLAB/ops/logs/telemetry.jsonl`.                                                                                                                                                                                                                                                                      | Singleton expected by Omega                                                |
| `turbo_audio_ai.py`      | `AudioEnhancer` class — watch dir at `Assets/To_Repair/`.                                                                                                                                                                                                                                                                                                                                                         | **STUB** — `available=False`, `enhance()` returns `None`                   |
| `turbo_video_ai.py`      | `VideoForge.generate_veo(prompt)`.                                                                                                                                                                                                                                                                                                                                                                                | **STUB** — `available=False`, returns `None`. Needs Veo 3.1 + google-genai |
| `turbo-pro-upgrade.js`   | One-shot Node upgrade engine: installs Voice Bridge launchd plist (`com.noizy.voice-bridge`), runs HEAVEN deploy from `~/NOIZYANTHROPIC/repos/noizy-heaven/`, audits NOIZYLAB `wrangler.toml` for `gabriel_db → agent-memory`, installs Turbo Console Log Pro config, starts dashboard HTTP for iPad, runs full MC96 diagnostic.                                                                                                     | Marked GORUNFREE x1000                                                     |

---

## FAMILY 3 — NOIZYBEAST T1–T10 (canonical: `apps/noizybeast/`)

### Beast surface (`vscode-extension/src/turboProvider.ts`)

VS Code TreeView provider exposing 10 T-commands + 5 system turbos:

| Command                | Description                    | Maps to                     |
| ---------------------- | ------------------------------ | --------------------------- |
| **T1 Scaffold**        | New component from intent      | `noizybeast.t1`             |
| **T2 Flow Sync**       | Load session context           | `noizybeast.t2`             |
| **T3 Deploy Cannon**   | Ship to Cloudflare edge        | `noizybeast.t3`             |
| **T4 Cell Burst**      | Save to GABRIEL memcells       | `noizybeast.t4`             |
| **T5 Consent Snap**    | Rights check in 3 seconds      | `noizybeast.t5`             |
| **T6 Mutation Replay** | Full transformation chain      | `noizybeast.t6`             |
| **T7 Forge**           | XTTS + RVC + C2PA synthesis    | `noizybeast.t7`             |
| **T8 X1000**           | Max quality mode               | `noizybeast.t8`             |
| **T9 Fix Canon**       | Diagnose + repair              | `noizybeast.t9`             |
| **T10 Dream Capture**  | Close session + Chronicles     | `noizybeast.t10`            |
| Pipeline               | HEAL→DEDUPE→UNIFY→VERIFY       | `noizybeast.turboPipeline`  |
| Zap Network            | DNS flush + DHCP renew + reset | `noizybeast.turboZap`       |
| Git Sync               | Push all repos to GitHub       | `noizybeast.turboGitSync`   |
| Reset                  | Full environment reset         | `noizybeast.turboReset`     |
| Mount Omen             | Mount HP-OMEN external volume  | `noizybeast.turboMountOmen` |

### Beast runner (`turbo-scripts/noizybeast-turbo.js`)

Shared CFG ports — **read these before assuming any port number:**

| Service | Port  |
| ------- | ----- |
| GABRIEL | 7777  |
| Bridge  | 8080  |
| Ollama  | 11434 |
| Consent | 7778  |
| Synth   | 7780  |
| Codex   | 7782  |
| Ethics  | 7785  |

Helpers exported: `post(url, body)`, `get(url)`, `ts()`, `log(msg, level)`, `logMutation(data)`, `execAsync`.
**All T-scripts wire Consent Membrane → Mutation Codex → Ethics Engine.**
Operator constant: `RSP_001`. CF account: `5f36aa9795348ea681d0b21910dfc82a`.

### Beast utility (`turbo-scripts/fix-cryptotokenkit.sh`)

Clears wrangler keychain entry on macOS CryptoTokenKit Error -3 (TKErrorCodeObjectNotFound), restarts CTK daemon, runs `wrangler whoami`. **WARNING:** references CF account `2446d788cc4280f5ea22a9948410c355` — conflicts with canonical `5f36aa9795348ea681d0b21910dfc82a`. Verify before trusting.

---

## DUPLICATE INVENTORY (retire on next consolidation)

| Path                                                           | Status                                           |
| -------------------------------------------------------------- | ------------------------------------------------ |
| `tools/turbo-scripts/*` (5 shells)                             | duplicate, retire                                |
| `tools/CODEMASTER/turbo-scripts/*.sh` (top-level, 5 shells)    | duplicate of subset, retire or symlink           |
| `.claude/worktrees/youthful-edison/turbo-scripts/*`            | working-copy duplicate, retire on worktree close |
| `.claude/worktrees/youthful-edison/NOIZYLAB/scripts/turbo/*`   | working-copy duplicate of full python set        |
| `.claude/worktrees/youthful-edison/noizybeast/turbo-scripts/*` | working-copy duplicate of Beast set              |
| `/Users/m2ultra/NOIZYLAB/...` mirror (49 MC96 files)           | full clone of NOIZYANTHROPIC tree, dedupe hazard |
| `mc96/eco/archive/Projects_old/MC96/turbo-pro-upgrade.js`      | archived predecessor                             |

## TESTING ORDER

If a turbo hasn't been touched recently, smoke-test in this order before relying on it:

1. `python3 turbo_vitals.py` — proves Python + macOS path work
2. `python3 turbo_net_check.py` — proves network + parallel exec
3. `bash turbo_pipeline.sh /tmp/empty-test-dir` — proves the 4-step is safe
4. `python3 -c "import turbo_config; turbo_config.init_env()"` — proves .env perms
5. Only then invoke the destructive shells (`turbo_zap.sh`, `turbo_reset.sh`)

## EXTENDING THE ARSENAL

When a new operational pattern emerges that no turbo covers:

1. Decide family — is it a python brain (CODEMASTER), a runtime brain (mc96/app), or a Beast user surface (T-script)?
2. Place in canonical path for that family.
3. Add row to this catalog.
4. If it changes the Beast surface, update `turboProvider.ts` so T-tree shows it.
5. If it's runtime-critical for Gabriel Omega, register it in `turbo_prompts.SYSTEM` so the brain knows it has the muscle.
6. Update `.claude/rules/turbo-scripts.md` if the per-agent ownership changes.
