# CLEANUP · /Users/m2ultra — AUDIT & PLAN

**Built:** 2026-04-19
**Scope:** Rob's home directory on GOD.local
**Principle:** report first · execute in tiers · nothing deletes without Rob's explicit "GO TIER N"

---

## 📊 Where the space lives (top-level home)

| Dir                    | Size       | Classification                                                                                                         | Action                                       |
| ---------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `Music`                | **11 GB**  | ❌ Violates no-A/V-on-system-drive rule · Logic Pro + samples + Audiomodern + EZdrummer + EZkeys + Captain Plugins etc | **MOVE to external** (Tier 3 · RSP decision) |
| `NOIZYANTHROPIC`       | 8.0 GB     | ✅ legitimate empire repo                                                                                              | keep                                         |
| `.npm`                 | **4.2 GB** | 🟡 npm cache (rebuilt on next install)                                                                                 | **Tier 2 clear**                             |
| `.cache`               | **1.4 GB** | 🟡 misc caches                                                                                                         | **Tier 2 clear**                             |
| `Desktop/CLAUDE TODAY` | 1.2 GB     | ⚠ Mirror of GitHub repo `CLAUDE-TODAY` · 17 numbered dirs · organized but parallel to NOIZYANTHROPIC                   | **RSP decision** · consolidate or keep       |
| `Downloads`            | 1.0 GB     | 🟡 has obvious duplicates                                                                                              | **Tier 1 partial delete**                    |
| `swift-library`        | 782 MB     | ✅ python venv (has pptx/cloudflare SDKs)                                                                              | keep                                         |
| `.claude`              | 501 MB     | ✅ Claude Code state + memcells                                                                                        | keep                                         |
| `Documents`            | 443 MB     | review                                                                                                                 | —                                            |
| `Pictures`             | 219 MB     | review                                                                                                                 | —                                            |

---

## 🗑 Tier 1 — Absolutely safe (no data loss)

These can be deleted without thought. The `cleanup.sh --tier 1` path handles all of it.

| What                                    | Count                                              | Bytes      | Why safe                                                       |
| --------------------------------------- | -------------------------------------------------- | ---------- | -------------------------------------------------------------- |
| `.claude.json.backup.*` duplicates      | 5 identical 32 KB files                            | ~165 KB    | Keep newest (`.claude.json.backup`), delete 5 numbered backups |
| `.DS_Store` (depth ≤ 4)                 | **118**                                            | a few MB   | macOS rebuilds on demand                                       |
| `Downloads/files*.zip` duplicates       | `(1)` `(2)` `(3)` `(4)` + maybe dup of `files.zip` | ~50–300 MB | Same content, 4 re-downloads                                   |
| `Downloads/files` + `files (1)` folders | 2 extracted copies                                 | unknown    | Same as above                                                  |
| `Downloads/GitHubDesktop-x64.zip`       | 1 file                                             | ~180 MB    | **You're on ARM (M2 Ultra)** — x64 installer is useless        |
| `Downloads/GitHubDesktop-arm64 (1).zip` | 1 file                                             | ~180 MB    | Duplicate of the canonical `-arm64.zip`                        |
| `Downloads/54c44478-...pdf (1)`         | 1 file                                             | small      | UUID duplicate                                                 |
| `.Trash`                                | already empty                                      | 0 B        | —                                                              |

**Estimated Tier 1 recovery: ~600 MB–900 MB**

---

## 🟡 Tier 2 — Safe but slower to rebuild (re-downloads on next install)

| What         | Size   | Command                   | Recovery                      |
| ------------ | ------ | ------------------------- | ----------------------------- |
| `.npm` cache | 4.2 GB | `npm cache clean --force` | rebuilt on next `npm install` |
| `.cache` dir | 1.4 GB | `rm -rf ~/.cache/*`       | rebuilt on demand             |
| pip cache    | 74 MB  | `pip cache purge`         | rebuilt on next install       |

**Estimated Tier 2 recovery: ~5.6 GB**

Trade-off: next fresh install in any project will be slower (cache-miss downloads).

---

## ⚠️ Tier 3 — Requires your explicit decision (not just "GO")

These touch data whose rebuild cost is high or whose location is doctrinal:

### Music — 11 GB on system drive

Per `feedback_no_av_system_drive.md`: _"audio/video never on /Users/m2ultra unless part of current project; externals are for A/V."_

Contents sampled: Logic Pro Library.bundle, EZdrummer, EZkeys, Audio Music Apps, Audiomodern, Captain Plugins, LUNA Sessions, Newfangled Audio.

**These are Logic Pro libraries.** Not songs. Moving Logic's sample content to an external is common but requires Logic to be pointed at the new location afterward (Sound Library → Relocate Sound Library). A wrong move here can break Logic for MICKY-P's recording chain (per `project_micky_p.md`).

**Not touching this without your hand on the move.**

### `.codex/logs_2.sqlite`

Large single file in `.codex/`. Likely Codex CLI conversation history. Losing it may lose prior Codex context. Don't delete without you confirming Codex isn't actively referencing it.

### `Desktop/CLAUDE TODAY` — 1.2 GB · 17 numbered dirs

Active working dir + mirrored to the private GitHub repo `CLAUDE-TODAY`. NOT clutter — but structurally parallel to NOIZYANTHROPIC. Consolidation (merge CLAUDE TODAY → NOIZYANTHROPIC) is a bigger compartment than cleanup.

---

## 🚦 How to execute

```bash
# Always dry-run first to see what WOULD be deleted:
bash /Users/m2ultra/NOIZYANTHROPIC/DIRECTORY/CLEANUP_M2ULTRA/tools/cleanup.sh --tier 1 --dry-run

# Then authorize execution:
bash /Users/m2ultra/NOIZYANTHROPIC/DIRECTORY/CLEANUP_M2ULTRA/tools/cleanup.sh --tier 1 --go

# Tier 2 (caches) when you want to reclaim ~5.6 GB:
bash /Users/m2ultra/NOIZYANTHROPIC/DIRECTORY/CLEANUP_M2ULTRA/tools/cleanup.sh --tier 2 --dry-run
bash /Users/m2ultra/NOIZYANTHROPIC/DIRECTORY/CLEANUP_M2ULTRA/tools/cleanup.sh --tier 2 --go
```

Script is **dry-run by default** and **never touches Tier 3** — that's doctrine.

---

## 🔒 Ground rules

- No `rm -rf /` anywhere · the script uses explicit file lists, never wildcards at top level.
- Never touches `.env`, `*.key`, `*.pem`, `*.secret`.
- Never touches anything inside `NOIZYANTHROPIC`, `NOIZYLAB`, `swift-library` project dirs — those are under git control.
- Music/A/V directories NEVER auto-deleted. Move, don't rm.
- If the script sees anything unexpected, it logs and skips. Exit non-zero = something blocked, investigate.
