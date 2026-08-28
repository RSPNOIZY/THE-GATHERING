# MC96ECOUNIVERSE — Empire Map (2026-04-17 sprint)

> Consolidated output of 7 parallel Explore agents. Each section landed independently. Cleanup and consolidation targets flagged inline.

**Standing doctrine:** _Consent as executable code · Provenance as default · Revocation as sacred · Compensation as automatic · 75/25 split · 396 Hz._
**Standing rules:** No A/V on system drive unless current project. No secrets in logs. Never Clauses immovable.

---

## Canonical locations

| Kind              | Canonical path                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Agent definitions | `/Users/m2ultra/NOIZYANTHROPIC/.claude/agents/*.md` (duplicated at `~/.claude/agents/` and `/Users/m2ultra/NOIZYLAB/.claude/agents/`) |
| MCP servers       | `/Users/m2ultra/NOIZYANTHROPIC/mcp/<agent>-mcp/`                                                                                      |
| Master docs       | `/Users/m2ultra/NOIZYANTHROPIC/_consolidation/THE-GATHERING/DREAMCHAMBER/MC96ECO/MASTER_MC96.md`                                      |
| CF account        | NOIZYFISH `5f36aa9795348ea681d0b21910dfc82a`                                                                                          |
| Deadline          | 2026-04-17 (today)                                                                                                                    |

---

## LUCY (confirmed)

| Bucket                                        | Artifact                                                                                      | Size                 | Notes                                              |
| --------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------- | -------------------------------------------------- |
| Active · canonical                            | `mcp/lucy-mcp/index.js` (17 tools, DAZEFLOW + intake)                                         | 47 KB + node_modules | maintained Apr 16                                  |
| Active                                        | `apps/lucy/` (nightly analysis, TS v0.2.0, n8n bridge)                                        | 42 MB                | used daily                                         |
| Active                                        | `DreamChamber/lucy-ipad/lucy-construction-order.md`                                           | 5 KB                 | Phase 0 done, Phase 1 in progress                  |
| iPad target · near-ready                      | `mc96/Lucy-Fork/` (Heaven.xcodeproj + Lucy modules: Chat/Dashboard/Voice/Settings/Onboarding) | **779 MB**           | constitutional rules hardcoded; 48kHz/32-bit audio |
| iPad target · stub                            | `apps/lucy-ios/` (SwiftUI template)                                                           | 104 KB               | earlier stage                                      |
| Swift MCP                                     | `mc96/LucyMCP/` (Package.swift, xcodeproj)                                                    | 415 MB               | compiled                                           |
| Duplicate                                     | `MC96ECO/LucyMCP/`                                                                            | 216 KB               | legacy copy                                        |
| Empty shells                                  | `MC96ECO/Lucy/`, `mc96/Lucy/`                                                                 | 0 B                  | delete candidates                                  |
| Aquarium (34 TB governed, not stored locally) | `apps/the-aquarium/` (Next.js UI)                                                             | 344 KB               | deploy-ready                                       |

**Decisions:**

- **Canonical iPad build:** `mc96/Lucy-Fork/` (not `apps/lucy-ios/`). Rename to `apps/lucy-ipad/` during consolidation.
- **Delete:** `MC96ECO/Lucy/`, `mc96/Lucy/` (empty), `Downloads/files/001_lucy_state.sql` (stale snapshot).
- **Archive:** `MC96ECO/LucyMCP/` (legacy 216K copy); `MC96ECO/Lucy-Fork/` (184K legacy stub).

---

## SHIRL (wellbeing) + SHIRLEY (code/file manager, Gemma 3) + DREAM (visionary)

All 3 agents follow the same shape: one-per-agent MCP server + agent def duplicated 3 places.

| Agent                            | MCP server                         | Tools                                                                                                                               | State     |
| -------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------- |
| SHIRL ("The Aunt")               | shared `mcp/family-mcp/` with POPS | `family_shirl_check`, `family_break_reminder`, `family_status`                                                                      | active    |
| SHIRLEY (Gemma 3 27B, code/file) | `mcp/shirley-mcp/index.js` (8 KB)  | `shirley_file_inventory`, `shirley_dep_audit`, `shirley_code_stats`, `shirley_find_todos`, `shirley_format_check`, `shirley_status` | canonical |
| DREAM (5th Epoch visionary)      | `mcp/dream-mcp/index.js` (4 KB)    | `dream_vision_check`, `dream_roadmap`, `dream_prioritize`, `dream_elevator_pitch`, `dream_status`                                   | canonical |

**Duplication pattern (applies to every agent):** def exists at 3 paths.

- `~/.claude/agents/<name>.md`
- `/Users/m2ultra/NOIZYANTHROPIC/.claude/agents/<name>.md`
- `/Users/m2ultra/NOIZYLAB/.claude/agents/<name>.md`

**Decision:** keep NOIZYANTHROPIC canonical, symlink the other two during consolidation.

---

## POPS + ENGR_KEITH (confirmed)

| Agent                                         | Canonical                                                                           | MCP                                       | Integration                                                                                                                                                                                |
| --------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| POPS (R.K. Plowman lineage, grounding/wisdom) | `_consolidation/.../AGENTS/MASTER_POPS.md` (2026-04-17) + `registry/agents/POPS.md` | shared `mcp/family-mcp/`                  | `heaven-KV_VOICE` binding, `pops_premis_event` → ledger, SHIRL wellbeing gating                                                                                                            |
| ENGR_KEITH (engineering, infra custodian)     | `_consolidation/.../AGENTS/MASTER_ENGR_KEITH.md` (2026-04-17)                       | `mcp/engr-keith-mcp/index.js` (376 lines) | D1 `gabriel_db` + `agent-memory`, KV bindings (`heaven-KV_GABRIEL`, `NOIZY-CONSENT`, `NOIZY-SESSIONS`, `heaven-KV_VOICE`), 14-test smoke gate, review for all arch/endpoint/schema changes |

Duplication pattern same as Shirl/Dream: 3-way at `~/.claude/`, `/NOIZYANTHROPIC/.claude/`, `/NOIZYLAB/.claude/`. Consolidate to NOIZYANTHROPIC canonical + symlinks.

## BRANDS: NOIZYKIDZ + NOIZYFISH + NOIZYVOX

| Brand                                               | Landing Worker                                                                    | MASTER doc                                                                                  | Status gap                                                                                     |
| --------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **NOIZYKIDZ** (LUCY-owned, deaf-first haptic)       | `landing/noizykidz/` 12 KB, routes commented out                                  | `MASTER_NOIZYKIDZ.md` 4.8 KB · Never Clauses NK-1..5 · 1% irremovable trust clause          | **domain not activated**, no backend, no DB schema                                             |
| **NOIZYFISH** (LUCY-owned, legacy rights + catalog) | `landing/noizyfish/` + `landing/noizyfish-ca/` LIVE                               | `MASTER_FISHMUSICINC.md` 3.3 KB                                                             | no catalog storage, no licensing flow, no API backend                                          |
| **NOIZYVOX** (LUCY-owned, consent-locked voice)     | `landing/noizyvox/` LIVE + `apps/noizyvox/voice-capture/sessions/` 50+ JSON files | `MASTER_NOIZYVOX.md` 3.1 KB · NCP v1 token schema · 75/25 split · cleared/blocked tool list | FastAPI :8090 deployment status unclear, sessions not DB-linked, consent kernel wiring unclear |

Dupes (worktree `.claude/worktrees/youthful-edison/NOIZY-MONO/apps/<brand>/` + `_archive/NOIZY-MONO/apps/<brand>/`) present across all three → archive candidates.

## CLAUDECODE (Claude Code CLI) — large surface

- `~/.claude/` = **431 MB** — 38+ project session dirs, 10 agent .md files, 2 hooks, 16 KB settings.json (447 lines), `mcp-needs-auth-cache.json` suggests pending auths
- `~/.claude/projects/` = 257 MB session history
- **11 `CLAUDE.md` files** across NOIZYANTHROPIC — root, the-gathering, mc96/eco, apps/the-aquarium, apps/noizybeast, worktrees, archives
- Shadow installs: `~/.windsurf/extensions/` (11 Windsurf .claude dirs w/ node_modules), `~/Library/Application Support/Claude/local-agent-mode-sessions/` (20+ session dirs), `~/Desktop/CLAUDE TODAY/`

## FISHMUSICINC (dual: brand + CF account name)

- Landing worker at `landing/fishmusicinc/` 12 KB, routes commented (awaiting zone activation)
- TypeScript worker at `mc96/eco/FISHMUSICINC/` — 32 KB (`schema.sql` 676 B, `src/index.ts` 10 KB, `tools/fish-tools.ts` 1.1 KB)
- Registry `registry/brands/FISHMUSICINC.md` — notes legacy CF account `2446d788cc4280f5ea22a9948410c355` (non-prod) + current NOIZYFISH account
- DNS exports at `_private/dns-exports/` (dated 2026-03-29) — 4 files, plus 3+ duplicated snapshots across worktrees
- Archive configs on 6TB: Steven Slate Drums `.tlc` files reference `rp_fishmusicinc.com`

**Gaps:** schema is minimal (no Stripe/revenue), no payment code, email setup docs not wired to worker, domain on M365/GoDaddy DNS (routes commented pending zone switch).

## CLAUDE (full surface)

Total `~/.claude/` = **431 MB**. External volumes = zero Claude artifacts (backup strategy does not replicate).

| Slice                             | Size   | Notes                                                                                                 |
| --------------------------------- | ------ | ----------------------------------------------------------------------------------------------------- |
| `projects/` (session JSONLs)      | 389 MB | 316 sessions across 17 project dirs                                                                   |
| `file-history/`                   | 15 MB  | access audit cache                                                                                    |
| `debug/`                          | 12 MB  | event/error logs                                                                                      |
| `plugins/`                        | 7.8 MB | 40+ external plugins + official (code-review, feature-dev, mcp-server-dev, skill-creator, plugin-dev) |
| `shell-snapshots/`                | 3.0 MB | **68 files, Nov–Dec 2024, obsolete**                                                                  |
| `todos_archive/`                  | 1.4 MB | 370 archived task JSONs                                                                               |
| `skills/`                         | 756 KB | 10+ skills (golden-principles, consent-audit, empire-status, godaddy-migration, dreamchamber-proof)   |
| `paste-cache/`                    | 620 KB | clipboard history — regenerates                                                                       |
| `ide/`                            | 296 KB | VSCode/Cursor integration metadata                                                                    |
| `cache/`                          | 224 KB | plugin changelogs — regenerates                                                                       |
| `backups/mcp-cleanup-2026-04-16/` | 196 KB | config snapshot                                                                                       |
| `rules/`                          | 60 KB  | 12 rule files                                                                                         |
| `prompts/`                        | 44 KB  | 10 bootstrap/orchestration prompts                                                                    |
| `agents/`                         | 40 KB  | gabriel, lucy, pops, shirl, shirley, engr-keith, dream, voice-specialist, cb01, test-runner           |
| `statsig/`                        | 36 KB  | analytics IDs                                                                                         |
| `downloads/`                      | 0 B    | empty                                                                                                 |

**Multi-location Anthropic SDK:** `NOIZYANTHROPIC/node_modules`, worktree node_modules, OneDrive backup, Python site-packages. Worktree copies are safe consolidation targets (symlink to primary).

**Orphans safe to remove:** `.claude/projects/-` and `.claude/projects/-Users/` (malformed paths), `.claude/downloads/` (empty), `.claude-server-commander/` (legacy wrapper).

**Quick-win cleanup (~5 MB, zero risk):** `shell-snapshots/` + `paste-cache/` + `cache/` + `statsig/` + empty orphan dirs.

**Sensitive:** `.mcp.json` uses `${NOIZY_API_KEY}` and `${N8N_API_KEY}` env placeholders only — no inline secrets found. Backup configs at `backups/mcp-cleanup-2026-04-16/*.bak` not inspected per protocol.

## A/V on system drive (scan done)

| Location                                      | Size                     | Move to                                              |
| --------------------------------------------- | ------------------------ | ---------------------------------------------------- |
| `~/Music/Audio Hijack/`                       | ~800 MB podcast mp3s     | `/Volumes/6TB/AV_SYSTEM_DRIVE_RELOCATIONS/podcasts/` |
| `~/Music/Logic/NOIZYCLAUDESESSION_01.logicx/` | ~10 MB embedded audio    | `/Volumes/6TB/.../logic-sessions/`                   |
| OneDrive `DESIGN FINAL WAVs 06.2024/`         | ~500 MB 2024 album stems | `/Volumes/6TB/.../design-wavs/`                      |
| OneDrive `Key Vids/`                          | 103 MB video + more      | `/Volumes/6TB/.../key-vids/`                         |

Executor: `ops/relocate-av-to-6tb.sh` (interactive; `--yes` for automatic).

`~/Library/Messages/Attachments/*.MOV` left alone — system-managed by iMessage.

## Still pending

- GABRIEL artifact grep — agent still running

---

## Deploy status (this sprint)

| Artifact                                | Status                  | URL                                                    |
| --------------------------------------- | ----------------------- | ------------------------------------------------------ |
| mc96-follower Worker                    | ✅ LIVE                 | https://mc96-follower.rsp-5f3.workers.dev              |
| cf01-discord Worker                     | ✅ LIVE (needs secrets) | https://cf01-discord.rsp-5f3.workers.dev               |
| noizy-landing (www + apex on NOIZYFISH) | ⏳ waiting NS flip      | n/a                                                    |
| Notion sprint page                      | ✅                      | https://www.notion.so/345e8dc24ddc81029ed3e5ca121acc04 |
| n8n grep-swarm workflow JSON            | ✅ ready to import      | `/n8n-flows/mc96-grep-swarm.json`                      |

---

## Known blockers

1. **NS flip** at `.ai` registrar (2-min manual) unlocks `noizy.ai` apex + www
2. **Discord app credentials** needed on cf01-discord for voice path
3. **CF zone:edit token** — would unlock full DNS automation (BLOCK 4 on roadmap)

---

_Empire state at sprint start: 85% consolidated · 15% scattered. Sprint goal: 100% by end of 2-hour window. Target ship: April 17, 2026._
