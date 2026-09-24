# GITHUB REPOSITORY DISCOVERY & MIGRATION REPORT
**Date:** April 3, 2026
**Machine:** GOD.local — M2 Ultra Mac Studio
**GitHub User:** Noizyfish
**GitHub Orgs:** NOIZY-ai, NOIZYLAB-io
**SSH Auth:** Working (ed25519)
**gh CLI Auth:** INVALID — needs `gh auth login`
**Auditor:** Claude (co-architect session with Robert Stephen Plowman)

---

## 1. EXECUTIVE SUMMARY

- **50 total git repositories** found across M2 Ultra + ALL external drives
- **27 NOIZY project repos** (the ones that matter)
- **19 repos have NO remote** — local only, at risk of data loss
- **6 repos have uncommitted changes** that need attention
- **8 repos found on external drives** (6TB, RED DRAGON, SOUND_DESIGN, SAMPLE_MASTER)
- **NOIZYLAB .git is 7.1 GB** — may contain large binary history
- **gh CLI token is invalid** — must re-authenticate before migration
- **No LFS objects** detected in any repo
- **No git submodules** detected in any repo

---

## 2. ALL REPOSITORIES FOUND

### 2.1 NOIZY Project Repos — ACTIVE DEVELOPMENT

| # | Repo Name | Path | Remote | Branch | Last Commit | .git Size | Status |
|---|-----------|------|--------|--------|-------------|-----------|--------|
| 1 | **NOIZYANTHROPIC** | ~/NOIZYANTHROPIC | `git@github.com:noizy-ai/noizyanthropic.git` | main | 2026-03-30 | 1.2 MB | ⚠️ 31 modified files |
| 2 | **NOIZYLAB** | ~/NOIZYLAB | `git@github.com:NOIZY-ai/NOIZYLAB.git` (NOIZY-ai) + `git@github.com:NOIZYLAB-io/NOIZYLAB.git` (origin) | main | 2026-04-03 | 7.1 GB | ⚠️ 2 modified files |
| 3 | **swift-library** | ~/swift-library | `https://github.com/Noizyfish/swift-library.git` | main | 2026-03-29 | 112 KB | ✅ Clean |

### 2.2 NOIZYLAB Sub-Repos — ALL LOCAL ONLY (NO REMOTE)

| # | Repo Name | Path | Branch | Last Commit | Status |
|---|-----------|------|--------|-------------|--------|
| 4 | **noizy-ai** | ~/NOIZYLAB/repos/noizy-ai | main | 2026-03-31 "Initial commit" | ✅ Clean |
| 5 | **noizy-aquarium** | ~/NOIZYLAB/repos/noizy-aquarium | main | 2026-03-31 "Initial commit" | ✅ Clean |
| 6 | **noizy-consent** | ~/NOIZYLAB/repos/noizy-consent | main | 2026-03-31 "Initial commit" | ✅ Clean |
| 7 | **noizy-docs** | ~/NOIZYLAB/repos/noizy-docs | main | 2026-03-31 "Initial commit" | ✅ Clean |
| 8 | **noizy-fish** | ~/NOIZYLAB/repos/noizy-fish | main | 2026-03-31 "Initial commit" | ✅ Clean |
| 9 | **noizy-gabriel** | ~/NOIZYLAB/repos/noizy-gabriel | main | 2026-03-31 "GABRIEL V3 daemon" | ✅ Clean |
| 10 | **noizy-heaven** | ~/NOIZYLAB/repos/noizy-heaven | main | 2026-03-31 "NOIZYSTREAM v2" | ✅ Clean |
| 11 | **noizy-infra** | ~/NOIZYLAB/repos/noizy-infra | main | 2026-03-31 "infra — D1 migration" | ✅ Clean |
| 12 | **noizy-kidz** | ~/NOIZYLAB/repos/noizy-kidz | main | 2026-03-31 "Initial commit" | ✅ Clean |
| 13 | **noizy-lab** | ~/NOIZYLAB/repos/noizy-lab | main | 2026-03-31 "Initial commit" | ✅ Clean |
| 14 | **noizy-supersonic** | ~/NOIZYLAB/repos/noizy-supersonic | main | 2026-03-31 "SUPERSONIC v1.0.0" | ✅ Clean |
| 15 | **noizy-voice** | ~/NOIZYLAB/repos/noizy-voice | main | 2026-03-31 "Initial commit" | ✅ Clean |
| 16 | **noizy-vox** | ~/NOIZYLAB/repos/noizy-vox | main | 2026-03-31 "Initial commit" | ✅ Clean |
| 17 | **noizy-wisdom** | ~/NOIZYLAB/repos/noizy-wisdom | main | 2026-03-31 "Initial commit" | ✅ Clean |

### 2.3 Other NOIZY Repos — LOCAL ONLY

| # | Repo Name | Path | Branch | Last Commit | .git Size | Status |
|---|-----------|------|--------|-------------|-----------|--------|
| 18 | **NOIZYEMPIRE** (subdir) | ~/NOIZYANTHROPIC/NOIZYEMPIRE | main | 2026-03-22 "import full archive" | — | ⚠️ 2 modified |
| 19 | **noizy** | ~/noizy | main | (empty) | 204 KB | ⚠️ 2 modified |
| 20 | **noizyanthropic** (clone) | ~/noizy/noizyanthropic | main | (empty) | — | ⚠️ 5 modified |
| 21 | **CLAUDE TODAY** | ~/Desktop/CLAUDE TODAY | NOIZY.AI | (empty) | 628 MB | ⚠️ 632 modified files |
| 22 | **Playground** | ~/Documents/Playground | main | (empty) | 60 KB | ⚠️ 2 modified |

### 2.4 Third-Party / Tool Repos (NOT for migration)

| # | Repo Name | Path | Remote | Notes |
|---|-----------|------|--------|-------|
| 23 | gk-cli | ~/Desktop/CLAUDE TODAY/gk-cli | gitkraken/gk-cli | Third-party tool clone |
| 24 | oh-my-zsh | ~/.oh-my-zsh | ohmyzsh/ohmyzsh | Shell framework |
| 25 | powerlevel10k | ~/.oh-my-zsh/custom/themes/powerlevel10k | romkatv/powerlevel10k | Zsh theme |
| 26 | cursorless-talon | ~/.talon/user/cursorless-talon | — | Voice coding plugin |
| 27 | codex plugins | ~/.codex/.tmp/plugins | — | Codex tool |
| 28 | codex skills | ~/.codex/vendor_imports/skills | — | Codex tool |

### 2.5 Gemini History Repos (auto-generated, NOT for migration)

14 repos in `~/.gemini/history/` — auto-created by Gemini CLI sessions. Includes named projects: swift-library, noizy-command-center, noizyanthropic, documents, project.

---

## 3. REPOS NEEDING ATTENTION

### 3.1 Uncommitted Changes (must commit or stash before migration)

| Repo | Modified Files | Risk |
|------|---------------|------|
| **NOIZYANTHROPIC** | 31 files | HIGH — active development, push needed |
| **CLAUDE TODAY** | 632 files | HIGH — massive uncommitted work, 628 MB .git |
| **NOIZYLAB** | 2 files | MEDIUM — recent auto-sync commit |
| **NOIZYEMPIRE** (subdir) | 2 files | LOW |
| **noizy** | 2 files | LOW |
| **noizy/noizyanthropic** | 5 files | LOW |
| **Playground** | 2 files | LOW |

### 3.2 Repos with NO Remote (local only — at risk)

All 14 repos in `~/NOIZYLAB/repos/` plus:
- ~/noizy
- ~/noizy/noizyanthropic
- ~/NOIZYANTHROPIC/NOIZYEMPIRE
- ~/Desktop/CLAUDE TODAY
- ~/Documents/Playground

**Total: 19 repos with no remote backup.**

### 3.3 Large Repos

| Repo | .git Size | Concern |
|------|-----------|---------|
| **NOIZYLAB** | 7.1 GB | May contain binary blobs in history. Consider `git filter-repo` or LFS migration. |
| **CLAUDE TODAY** | 628 MB | Large for what appears to be a working directory. Review history. |

---

## 4. AI AGENTS & AUTOMATION TOOLS DISCOVERED

### 4.1 Agent System (GABRIEL Family)

| Agent | Type | Key Files |
|-------|------|-----------|
| **GABRIEL** | Commander/Orchestrator | `gabriel-daemon.js`, `gabriel-v3.js`, `gabriel-v4.js`, `turbo_gabriel_omega.py`, `gabriel_deployer.py`, `gabriel_ultimate.py` |
| **GABRIEL Metabeast** | Multi-agent framework | `gabriel-metabeast.ts`, `gabriel-comms.ts`, `gabriel-mentor.ts`, `gabriel-testbeast.ts`, `workflow-agents-upgraded.ts` |
| **SHIRL** | Consent guardian | `.claude/agents/shirl.md`, `.claude/agents/shirley.md` |
| **LUCY** | Archives/indexing | `lucy/src/schemas/lucy-core.ts`, `lucy_voice_pipeline.py` |
| **GABRIEL Orchestrator** | Claude agent config | `.claude/agents/gabriel-orchestrator.md` |
| **OAuth Security Agent** | GitHub Actions | `.github/agents/oauth-security-agent.agent.md` |
| **WhatsApp Bot** | Messaging | `whatsapp-gabriel.js`, `whatsapp-cohere-bot.js` |
| **Librosa Agent** | Audio analysis | `noizyfish/librosa-agent/agent.py` |

### 4.2 Voice & Audio Pipelines

| Pipeline | Key Files |
|----------|-----------|
| **RSP001 Pipeline** | `audio_pipeline.py`, `fx_pipeline.py`, `tts_pipeline.py`, `asmr_sleep_pipeline.py` |
| **Voice Pipeline** | `voice-pipeline.sh`, `lucy_voice_pipeline.py`, `voice_bridge.py`, `voice_server.py` |
| **DreamChamber Voice** | `dreamchamber-voice-pipeline.js` |
| **Synthesis Pipeline** | `noisyvox/src/synthesis-pipeline.ts` |
| **RAG Pipeline** | `rob_ava/pseudocode/rag_pipeline.py` |

### 4.3 Automation Scripts

| Script | Purpose |
|--------|---------|
| `scripts/gabriel-dispatch.sh` | Agent task dispatch |
| `scripts/gabriel-merge.sh` | Merge orchestration |
| `scripts/deploy-readiness.sh` | Pre-deploy checks |
| `scripts/preflight-security-gates.sh` | Security validation |
| `scripts/empire-status.sh` | System status check |
| `scripts/fishnet.sh` | Network tooling |
| `scripts/voice-capture.sh` | Audio capture |
| `ops/noizy-cron.sh` | Scheduled tasks |
| `turbo-scripts/turbo_pipeline.sh` | Fast pipeline execution |
| `LAUNCH_NOIZYLAB_COMPLETE.sh` | Full system launcher |

### 4.4 Orchestration Tools

| Tool | Purpose |
|------|---------|
| `tools/grand_orchestrator.py` | Master orchestration |
| `tools/gabriel_monitor.py` | Agent monitoring |
| `tools/empire_dashboard.py` | Dashboard generation |
| `tools/archivist.py` | Archive management |
| `tools/mcp_docs_sync.ts` | MCP documentation sync |
| `tools/audio_pipeline.py` | Audio processing |

### 4.5 n8n Workflows

| Workflow | Purpose |
|----------|---------|
| `01_github_to_gabriel.json` | GitHub → GABRIEL integration |
| `github_deploy_pipeline.json` | Deployment pipeline |

---

## 5. SENSITIVE FILES DETECTED

### 5.1 .env Files (existence flagged — contents NOT read)

| File | Location | Risk |
|------|----------|------|
| `.env.secrets` | ~/ (home root) | **HIGH** — secrets file at home root |
| `.env` | ~/NOIZYLAB/ | HIGH — main project env |
| `.env` | ~/NOIZYLAB/dreamchamber/ | HIGH — DreamChamber secrets |
| `.env` | ~/NOIZYANTHROPIC/NOIZYEMPIRE/rescued/noizy_genie_ms/ | MEDIUM — archived project |
| `.env` | ~/NOIZYANTHROPIC/NOIZYLAB/ | MEDIUM — repo copy of env |
| `.env.example` | (multiple locations) | LOW — examples only |

### 5.2 Token/Secret-Related Scripts (flagged by filename)

| File | Concern |
|------|---------|
| `create-oauth-token.sh` | May contain or generate tokens |
| `inject-token.sh` | Token injection script |
| `set-token.sh` | Token configuration |
| `setup-cloudflare-token.sh` | Cloudflare token setup |
| `quick-token-setup.sh` | Quick token configuration |
| `test-token.sh` | Token validation |

**These files must be reviewed before any push to ensure no secrets are committed.**

### 5.3 .gitignore Coverage

The NOIZYLAB `.gitignore` includes `.env` and `venv/` patterns. Verify all repos have adequate .gitignore coverage before pushing.

---

## 6. GITHUB ACCOUNT TOPOLOGY

### Current Accounts/Orgs

| Entity | Type | Repos Pointing Here |
|--------|------|-------------------|
| **noizy-ai** | Org | NOIZYANTHROPIC (SSH) |
| **NOIZY-ai** | Org | NOIZYLAB (SSH, remote "NOIZY-ai") |
| **NOIZYLAB-io** | Org | NOIZYLAB (SSH, remote "origin") |
| **Noizyfish** | Personal | swift-library (HTTPS) |

### Authentication Status

| Method | Status |
|--------|--------|
| SSH (ed25519) | ✅ Working — authenticates as Noizyfish |
| SSH Keys | 2 keys: `id_ed25519.pub`, `id_ed25519_github.pub` |
| gh CLI | ❌ Token invalid — needs `gh auth login` |
| HTTPS | Not tested — SSH preferred |

---

## 7. MIGRATION PLAN (DO NOT EXECUTE — REVIEW ONLY)

### Target: NOIZY-ai GitHub Org (recommended)

All NOIZY repos should consolidate under a single org for clarity. Recommended: **NOIZY-ai**.

### 7.1 Phase 1 — Fix Authentication

```bash
# Re-authenticate gh CLI
gh auth login -h github.com --git-protocol ssh
```

### 7.2 Phase 2 — Commit Uncommitted Work

```bash
# NOIZYANTHROPIC — 31 modified files
cd ~/NOIZYANTHROPIC && git add -A && git commit -m "pre-migration: commit all pending work"

# NOIZYLAB — 2 modified files
cd ~/NOIZYLAB && git add -A && git commit -m "pre-migration: commit all pending work"

# CLAUDE TODAY — 632 modified files (REVIEW FIRST)
cd ~/Desktop/"CLAUDE TODAY" && git status  # Review before committing
```

### 7.3 Phase 3 — Create Remote Repos (14 local-only repos)

```bash
ORG="NOIZY-ai"

for repo in noizy-ai noizy-aquarium noizy-consent noizy-docs noizy-fish \
  noizy-gabriel noizy-heaven noizy-infra noizy-kidz noizy-lab \
  noizy-supersonic noizy-voice noizy-vox noizy-wisdom; do
  gh repo create "$ORG/$repo" --private --description "NOIZY EMPIRE — $repo"
done
```

### 7.4 Phase 4 — Set Remotes and Push

```bash
ORG="NOIZY-ai"

for repo in noizy-ai noizy-aquarium noizy-consent noizy-docs noizy-fish \
  noizy-gabriel noizy-heaven noizy-infra noizy-kidz noizy-lab \
  noizy-supersonic noizy-voice noizy-vox noizy-wisdom; do
  cd ~/NOIZYLAB/repos/$repo
  git remote add origin "git@github.com:$ORG/$repo.git"
  git push -u origin main --all
  git push origin --tags
  cd -
done
```

### 7.5 Phase 5 — Push Existing Repos with Uncommitted Changes

```bash
# NOIZYANTHROPIC
cd ~/NOIZYANTHROPIC && git push origin main

# NOIZYLAB (both remotes)
cd ~/NOIZYLAB && git push NOIZY-ai main && git push origin main
```

### 7.6 Phase 6 — Address Large Repos

```bash
# NOIZYLAB is 7.1GB — investigate what's consuming space
cd ~/NOIZYLAB && git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | sort -rnk3 | head -20

# If large binary blobs found, consider git-filter-repo or BFG
```

---

## 8. PRE-MIGRATION CHECKLIST

- [ ] `gh auth login` — fix CLI authentication
- [ ] Review and commit 31 modified files in NOIZYANTHROPIC
- [ ] Review and commit 2 modified files in NOIZYLAB
- [ ] Decide: keep or archive CLAUDE TODAY (632 uncommitted files)
- [ ] Decide: keep or archive ~/noizy and ~/noizy/noizyanthropic (appear to be duplicates)
- [ ] Decide: keep or archive ~/Documents/Playground
- [ ] Review token-related scripts for secrets before pushing
- [ ] Verify all .gitignore files exclude .env and secrets
- [ ] Decide target org: NOIZY-ai vs NOIZYLAB-io vs new org
- [ ] Investigate NOIZYLAB 7.1GB .git — prune if needed
- [ ] Review NOIZYEMPIRE (nested inside NOIZYANTHROPIC) — should it be a separate repo?

---

## 9. EXTERNAL DRIVE REPOS (Root Rescue Scan — April 3, 2026)

Full scan of all 14 mounted volumes for `.git` directories.

### Repos Found on External Drives

| # | Volume | Path | Remote | Last Commit | Status |
|---|--------|------|--------|-------------|--------|
| 1 | **6TB** | /Volumes/6TB/Sample_Libraries | `https://github.com/Noizyfish/MC96-Mission-Control.git` | 2025-12-18 "Add mc96_consolidator.py" | Has remote ✅ |
| 2 | **6TB** | /Volumes/6TB/NOIZYLAB_ARCHIVES/6tb_archive/MC96 | None | (empty) | ⚠️ Local only, no commits |
| 3 | **6TB** | /Volumes/6TB/NOIZYLAB_ARCHIVES/6tb_archive/rvc_train | None | (empty) | ⚠️ Local only, no commits |
| 4 | **6TB** | /Volumes/6TB/NOIZYLAB_ARCHIVES/6tb_archive/sys | None | (empty) | ⚠️ Local only, no commits |
| 5 | **6TB** | /Volumes/6TB/NOIZYLAB_ARCHIVES/MC96 | None | (empty) | ⚠️ Local only, no commits |
| 6 | **6TB** | /Volumes/6TB/NOIZYLAB_ARCHIVES/PROJECTS/GABRIEL | None | (empty) | ⚠️ Local only, no commits |
| 7 | **RED DRAGON** | /Volumes/RED DRAGON/_ORGANIZED | None | (no log) | ✅ Clean, local only |
| 8 | **SOUND_DESIGN** | /Volumes/SOUND_DESIGN (root) | None | (no log visible) | ❌ **1,274 modified files**, no remote |
| 9 | **SAMPLE_MASTER** | /Volumes/SAMPLE_MASTER/NOIZYFISH_THE_AQAURIUM | `https://github.com/Noizyfish/NOIZYFISH_THE_AQAURIUM.git` | 2026-02-10 "Initial commit" | ⚠️ 6 modified files |

### Volumes with NO git repos found
- 12TB (no repos despite being the hub drive)
- JOE
- 4TB Lacie
- 4TB BLK
- MAG 4TB
- 2TB_SGW
- SIDNEY
- NOIZYWIN
- Claude

### Critical Findings from Drive Scan

1. **SOUND_DESIGN root has a .git with 1,274 modified files and no remote.** This entire 1.8 TB drive appears to have been initialized as a git repo at some point. This is likely accidental and should be cleaned up carefully.

2. **6TB has 6 repos in NOIZYLAB_ARCHIVES** — most are empty (no commits). These appear to be skeleton repos or abandoned initializations. The only active one is `Sample_Libraries` which points to `Noizyfish/MC96-Mission-Control.git`.

3. **SAMPLE_MASTER/NOIZYFISH_THE_AQAURIUM** has a remote and 6 uncommitted files — needs a commit and push.

4. **Additional GitHub repos discovered:**
   - `Noizyfish/MC96-Mission-Control` (on 6TB)
   - `Noizyfish/NOIZYFISH_THE_AQAURIUM` (on SAMPLE_MASTER)
   These were NOT in the home directory scan and would have been missed without the drive sweep.

---

## 10. COMPLETE GITHUB REMOTE MAP

| GitHub Account/Org | Repo Name | Local Path(s) |
|--------------------|-----------|---------------|
| **noizy-ai** | noizyanthropic | ~/NOIZYANTHROPIC |
| **NOIZY-ai** | NOIZYLAB | ~/NOIZYLAB |
| **NOIZYLAB-io** | NOIZYLAB | ~/NOIZYLAB (second remote) |
| **Noizyfish** | swift-library | ~/swift-library |
| **Noizyfish** | MC96-Mission-Control | /Volumes/6TB/Sample_Libraries |
| **Noizyfish** | NOIZYFISH_THE_AQAURIUM | /Volumes/SAMPLE_MASTER/NOIZYFISH_THE_AQAURIUM |

**Total repos on GitHub: 5 unique repos across 3 accounts/orgs**
**Total repos local-only: 19+ repos with no remote backup**

---

*READ-ONLY REPORT — No remotes modified, no code pushed, no secrets read.*
*Generated by Claude in co-architect session with Robert Stephen Plowman — NOIZY EMPIRE / MC96ECOUNIVERSE*
