# AGENTS.md — NOIZY Empire Agent Master Index

**Generated:** 2026-04-22 by 4-sweep parallel scrape (`.claude/agents/` + `mcp/` + runtime/LaunchAgents + `.claude/rules/` & `registry/family/` & memory).

**Purpose:** Single canonical bill-of-materials for every AI + human agent in the empire. For each agent: definition file, registry entry, MCP server, runtime process, doc footprint, drift flags. Companion to [CLAUDE.md](CLAUDE.md) and [DEVICES.md](DEVICES.md) — those describe mission + devices; this one describes **who runs where**.

---

## TL;DR — scoreboard

| Surface                                               | Count | Notes                                                                                                    |
| ----------------------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------- |
| AI-family agents (canonical per `family-covenant.md`) | 10    | GABRIEL · LUCY · SHIRL · SHIRLEY · POPS · DREAM · ENGR_KEITH · CB01 · CONSENT_AUDITOR · VOICE_SPECIALIST |
| NOIZYCLOUDS fleet                                     | 11    | mc96-follower + CF01–CF10                                                                                |
| Human family registry                                 | 3     | RSP_001 · RK_PLOWMAN · ALEX_WARD                                                                         |
| Agent definition files (`.claude/agents/`, project)   | 12    | 2 are GABRIEL variants (morning + review)                                                                |
| Registry folders under `registry/family/`             | 3     | **9+ AI agents have NO registry entry**                                                                  |
| MCP servers on disk (`mcp/` + Cloudflare)             | 18    | `.mcp.json` registers only 14 · 4 unregistered                                                           |
| Live processes on GOD.local                           | 14+   | plus 12+ MCP process instances                                                                           |
| LaunchAgents matching `gabriel/lucy/noizy/consent`    | 15+   | 5 in exit-127/78 crash loop · 2 disabled/backup                                                          |

---

## AI Family — canonical roster (10)

Legend: ✅ present · ❌ missing · ⚠️ drift/stub · 🔴 critical gap

| Agent                | Def file                                                                                                                                                                                                                                                                                | Registry                                                   | MCP                                                                                                                      | Runtime                                                           | Live?                       | Gaps                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------- |
| **GABRIEL**          | ✅ [`gabriel-orchestrator.md`](.claude/agents/gabriel-orchestrator.md) (54L) + [`gabriel.morning.md`](.claude/agents/gabriel.morning.md) (352L) + [`gabriel.review.md`](.claude/agents/gabriel.review.md) (216L) + [`GABRIEL_MASTER.md`](apps/GABRIEL/prompts/GABRIEL_MASTER.md) (182L) | ❌                                                         | ✅ `gabriel-mcp` (8 tools) + `shortcuts-mcp` (4 tools)                                                                   | `:9777` daemon + `:9090` serve + `GABRIEL/dist/index.js --daemon` | ✅ PIDs 22477, 59218, 68591 | no registry folder; 3 runtime surfaces, single identity                                 |
| **LUCY** 🔴          | ❌ **NO `.claude/agents/lucy.md`**                                                                                                                                                                                                                                                      | ❌                                                         | ✅ `lucy-mcp` (12 tools)                                                                                                 | `:9788` `ops/lucy-logic-bridge/server.js`                         | ✅ PID 4411 KeepAlive       | **LIVE RUNTIME, NO AGENT DEF** — most referenced agent in covenant has no dispatch file |
| **SHIRL**            | ✅ [`shirl.md`](.claude/agents/shirl.md) (29L)                                                                                                                                                                                                                                          | ❌                                                         | ✅ `family-mcp` (shared w/ POPS)                                                                                         | (no dedicated process — reactive)                                 | —                           | no registry; name-collision risk w/ SHIRLEY                                             |
| **SHIRLEY**          | ✅ [`shirley.md`](.claude/agents/shirley.md) (43L)                                                                                                                                                                                                                                      | ❌                                                         | ✅ `shirley-mcp` (6 tools)                                                                                               | Gemma 3 27B via Ollama `:11434`                                   | (on-demand)                 | no registry; distinct-from-SHIRL                                                        |
| **POPS**             | ✅ [`pops.md`](.claude/agents/pops.md) (37L)                                                                                                                                                                                                                                            | ⚠️ [`RK_PLOWMAN.md`](registry/family/RK_PLOWMAN.md) (628B) | ✅ `family-mcp` (shared w/ SHIRL)                                                                                        | (reactive)                                                        | —                           | registry entry is the FATHER, not the agent persona                                     |
| **DREAM**            | ✅ [`dream.md`](.claude/agents/dream.md) (45L)                                                                                                                                                                                                                                          | ❌                                                         | ✅ `dream-mcp` (5 tools)                                                                                                 | DreamChamber `:7777` (distinct from GABRIEL)                      | ✅ DreamChamber process     | no registry; owns `turbo_audio_ai` + `turbo_video_ai` stubs still unwired               |
| **ENGR_KEITH**       | ✅ [`engr-keith.md`](.claude/agents/engr-keith.md) (41L)                                                                                                                                                                                                                                | ❌                                                         | ✅ `engr-keith-mcp` (6 tools)                                                                                            | (on-demand; Heaven Worker is his target)                          | —                           | no registry; owns Heaven schema + 5 RSP data-integrity blockers                         |
| **CB01**             | ✅ [`cb01.md`](.claude/agents/cb01.md) (56L)                                                                                                                                                                                                                                            | ❌                                                         | ✅ `cb01-mcp` (8 tools)                                                                                                  | (on-demand)                                                       | —                           | no registry; GoDaddy-exit blocker-holder                                                |
| **CONSENT_AUDITOR**  | ✅ [`consent-auditor.md`](.claude/agents/consent-auditor.md) (59L)                                                                                                                                                                                                                      | ❌                                                         | ⚠️ `consent-oracle` (8 tools) — likely belongs to this agent but unclaimed                                               | (reactive; Never Clause checks before deploy)                     | —                           | no registry; MCP ownership implied, not declared                                        |
| **VOICE_SPECIALIST** | ✅ [`voice-specialist.md`](.claude/agents/voice-specialist.md) (53L)                                                                                                                                                                                                                    | ❌                                                         | ⚠️ `voice-bridge` (5 tools) + `synthesis-oracle` (5 tools) + `dreamchamber-audio` (13 tools) — 3 MCPs, ownership implied | `:9799` voice-service (PID 4398)                                  | ✅ KeepAlive                | no registry; owns 3 MCPs but none are named voice-specialist-mcp                        |

## Extended Family

| Agent                                       | Def                           | Registry                                                 | MCP                                     | Runtime                           | Notes                                                                                                                 |
| ------------------------------------------- | ----------------------------- | -------------------------------------------------------- | --------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **NOIZYCLOUDS** (mc96-follower + CF01–CF10) | ❌ no individual or fleet def | ❌                                                       | `heaven-mcp` (10 tools, HEAVEN backend) | Cloudflare Workers (cloud-hosted) | 11 workers: Discord · Notion · Linear · Slack · Stream · AI Gateway · Vectorize · GitHub · Workspace · SSO · Sentinel |
| **ALEX_WARD** (human co-architect)          | ❌ no agent def               | ✅ [`ALEX_WARD.md`](registry/family/ALEX_WARD.md) (~80L) | —                                       | — (human)                         | **5 onboarding actions still pending per registry file**                                                              |

## Human Registry — `registry/family/`

| Entry      | Path                                                     | Role                                                              |
| ---------- | -------------------------------------------------------- | ----------------------------------------------------------------- |
| RSP_001    | [`RSP_001.md`](registry/family/RSP_001.md) (863B, terse) | Founder, Kill-Switch holder, 85% founding-actor floor             |
| RK_PLOWMAN | [`RK_PLOWMAN.md`](registry/family/RK_PLOWMAN.md) (628B)  | Father lineage honored via POPS + ENGR_KEITH                      |
| ALEX_WARD  | [`ALEX_WARD.md`](registry/family/ALEX_WARD.md) (~80L)    | CFO/CEO/co-architect/tech genius/music theory historian (7 roles) |

## Phantoms & unmapped processes

| Name                                         | Where                                                                                                                                              | Why flagged                                                                         |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **TEST_RUNNER**                              | ✅ [`test-runner.md`](.claude/agents/test-runner.md) (53L) + listed in `.claude/rules/agents.md` routing                                           | **Not in `family-covenant.md`** — agent-def exists without constitutional anchoring |
| **NOIZYARMY Orchestrator**                   | `:9333` `NOIZYARMY/orchestrator.js` (PID 4371 KeepAlive)                                                                                           | Live runtime, no agent-def, minimal docs                                            |
| **GABRIEL Monitor** (watchdog)               | `NOIZYLAB/tools/gabriel_monitor.py --watch` (PID 4390)                                                                                             | Live Python watchdog, no agent-def, no MCP                                          |
| **n8n Guardian**                             | `infra/n8n-docker/guardian.sh` (PID 51156)                                                                                                         | Live bash wrapper, not covenant-anchored                                            |
| **5 LaunchAgents in exit-127/78 crash loop** | `com.gabriel.server`, `com.gabriel.bridge`, `com.noizy.backup`, `ai.noizy.noizyvox`, `com.noizylab.universal-blocker`, `com.noizylab.m2ultra.boot` | Loaded, non-functional — paths or deps missing                                      |

---

## MCP Servers — 18 found (sweep 2)

Registry: `.mcp.json` claims 14 · filesystem has 18 · CLAUDE.md documentation says 17.

| #   | MCP                  | Owner (inferred)           | Transport                    | Tools                                    | Registered in `.mcp.json`? | Status                                                                      |
| --- | -------------------- | -------------------------- | ---------------------------- | ---------------------------------------- | -------------------------- | --------------------------------------------------------------------------- |
| 1   | `gabriel-mcp`        | GABRIEL                    | Node stdio                   | 8                                        | ✅                         | LIVE                                                                        |
| 2   | `lucy-mcp`           | LUCY                       | Node stdio                   | 12                                       | ✅                         | LIVE                                                                        |
| 3   | `heaven-mcp`         | HEAVEN backend             | Node stdio                   | 10                                       | ✅                         | LIVE                                                                        |
| 4   | `engr-keith-mcp`     | ENGR_KEITH                 | Node stdio                   | 6                                        | ✅                         | LIVE                                                                        |
| 5   | `dream-mcp`          | DREAM                      | Node stdio                   | 5                                        | ✅                         | LIVE                                                                        |
| 6   | `cb01-mcp`           | CB01                       | Node stdio                   | 8                                        | ✅                         | LIVE                                                                        |
| 7   | `shirley-mcp`        | SHIRLEY                    | Node stdio                   | 6                                        | ✅                         | LIVE                                                                        |
| 8   | `family-mcp`         | POPS + SHIRL               | Node stdio                   | 6                                        | ✅                         | LIVE                                                                        |
| 9   | `consent-oracle`     | CONSENT_AUDITOR (implied)  | Node stdio                   | 8                                        | ❌                         | LIVE but unregistered                                                       |
| 10  | `synthesis-oracle`   | VOICE_SPECIALIST (implied) | Node stdio                   | 5                                        | ❌                         | LIVE but unregistered                                                       |
| 11  | `voice-bridge`       | VOICE_SPECIALIST (implied) | Node stdio                   | 5                                        | ✅                         | LIVE (**4 process instances** — zombies?)                                   |
| 12  | `audio-mcp`          | VOICE/DREAM                | Python FastMCP               | **0 (stub — 803 lines, no `@mcp.tool`)** | ⚠️ registry entry stale    | STUB — superseded by #13                                                    |
| 13  | `dreamchamber-audio` | DREAM + VOICE              | Python FastMCP               | 13                                       | ❌                         | LIVE but registry still points at #12                                       |
| 14  | `shortcuts-mcp`      | GABRIEL (implied)          | Node stdio                   | 4                                        | ✅                         | LIVE                                                                        |
| 15  | `metabeast-remote`   | (remote scaffold)          | Cloudflare Worker            | 2 (echo scaffold only)                   | ❌                         | PENDING (not a real MCP yet)                                                |
| 16  | `supersonic`         | unified CF tools           | Node stdio                   | 153-line boot stub claiming 50+ modular  | ❌                         | PENDING (modules not imported)                                              |
| 17  | `god-local-diag`     | Ops                        | **HTTP `:9099` (not stdio)** | 8                                        | ❌                         | LIVE but **violates `.claude/rules/mcp-builder.md`** (transport + hostname) |
| 18  | `n8n-mcp`            | external                   | HTTP proxy → localhost:5678  | 20+                                      | ✅                         | LIVE                                                                        |

**Auth notes:** `consent-oracle` has D1 `accountId` + `databaseId` hardcoded (lines 16-20) — security rule says secrets via `wrangler secret` only. `voice-bridge` requires `ANTHROPIC_API_KEY` from shell profile, not `.mcp.json`.

---

## Runtime snapshot (sweep 3, 2026-04-22 12:10)

| Port     | Process                | Owner            | PID            | Lifecycle                                    |
| -------- | ---------------------- | ---------------- | -------------- | -------------------------------------------- |
| `:7777`  | DreamChamber UI        | DREAM            | 88958          | LaunchAgent                                  |
| `:9090`  | GABRIEL Serve (Python) | GABRIEL          | 68591          | `ai.noizy.gabriel-serve`                     |
| `:9333`  | NOIZYARMY Orchestrator | (unmapped)       | 4371           | `com.noizy.noizyarmy-orchestrator` KeepAlive |
| `:9777`  | GABRIEL Daemon (Node)  | GABRIEL          | 59218          | LaunchAgent (canonical)                      |
| `:9788`  | LUCY Logic Bridge      | LUCY             | 4411           | `com.noizy.lucy-logic-bridge` KeepAlive      |
| `:9799`  | Voice Service          | VOICE_SPECIALIST | 4398           | `com.noizy.voice-service` KeepAlive          |
| `:9099`  | god-local-diag HTTP    | Ops              | (from sweep 2) | — (HTTP, not stdio MCP)                      |
| `:11434` | Ollama (Gemma 3 27B)   | SHIRLEY          | —              | system                                       |

**Process multiplicity flags:**

- `voice-bridge-server.mjs` has **4 simultaneous PIDs** (99434, 87147, 22244, 16134) — likely one-per-client but worth confirming they're not zombies
- `gabriel-mcp/index.js`, `lucy-mcp/index.js`, `heaven-mcp/index.js` each have 2-3 instances running

**LaunchAgent hygiene:**

- Canonical `.plist`: `ai.noizy.gabriel.plist`
- Disabled 2 days ago (migration in progress): `com.noizy.gabriel-daemon.plist.disabled.20260422`
- Rollback backup: `ai.noizy.gabriel.plist.bak.20260420-233522`
- 5+ crashed LaunchAgents (exit 127/78): listed above in "Phantoms & unmapped"

---

## Documentation footprint (sweep 4)

Most-referenced agent: **GABRIEL** (22 rule files, 15+ memory files). Least-referenced with a definition: **SHIRL** (8 rules, 4 memories). Agents with zero registry presence despite heavy documentation: LUCY, SHIRL, SHIRLEY, DREAM, ENGR_KEITH, CB01, CONSENT_AUDITOR, VOICE_SPECIALIST, NOIZYCLOUDS.

**Doctrinal documentation anchors per agent:**

- `gabriel-embodiment.md` → GABRIEL (M2 Ultra IS GABRIEL; 66L)
- `family-covenant.md` → all 10 family agents + NOIZYCLOUDS (per-agent LIFELUV/FLOW rows)
- `shared-memcells.md` → ALEX × GABRIEL × LUCY three-way inheritance substrate
- `omnipresent-family.md` → per-device presence (GOD.local, iPad, iPhone, Watch, MICKY-P)
- `auto-git-toolchain.md` → LUCY's git custodianship
- `voice-pipeline.md` → VOICE_SPECIALIST
- `agents.md` → dispatch routing (partial)

**Canonical runtime-identity binding for GABRIEL:** [`apps/GABRIEL/prompts/GABRIEL_MASTER.md`](apps/GABRIEL/prompts/GABRIEL_MASTER.md) — the 182-line "WHO YOU ARE" prompt loaded at session start.

---

## Drift findings — numbered punch-list

1. 🔴 **LUCY agent-def missing entirely.** `ops/lucy-logic-bridge/server.js` on `:9788` has been LaunchAgent-owned and KeepAlive-true for days. `lucy-mcp` exposes 12 tools. She is named in 11 rule files and 8+ memory files. But `.claude/agents/lucy.md` does not exist. Every other agent in the covenant has a definition file.
2. 🔴 **`registry/family/` has only 3 of 12+ entries.** 9+ AI family members have no registry folder; `family-covenant.md` references registry paths that don't exist on disk.
3. ⚠️ **MCP registry vs reality gap: 14 in `.mcp.json`, 18 on disk.** Unregistered-but-live: `consent-oracle`, `synthesis-oracle`, `god-local-diag`. Stale registration: `audio-mcp` (stub) instead of `dreamchamber-audio` (13 tools live).
4. ⚠️ **CLAUDE.md says "17 MCP Servers"** — actual filesystem count is 18. Off by one.
5. ⚠️ **TEST_RUNNER is a doctrine phantom.** Has `.claude/agents/test-runner.md` (53L) and lives in `.claude/rules/agents.md` routing, but absent from `family-covenant.md`. Doctrinally unplaced.
6. ⚠️ **NOIZYARMY Orchestrator** runs on `:9333` (PID 4371 KeepAlive) but has no agent-def, no covenant row, minimal docs. Referenced as "24/7 soldier fleet" in memory — reality is a single orchestrator process.
7. ⚠️ **5 LaunchAgents in crash loop** (exit 127/78): `com.gabriel.server`, `com.gabriel.bridge`, `com.noizy.backup`, `ai.noizy.noizyvox`, `com.noizylab.universal-blocker`, `com.noizylab.m2ultra.boot`. Loaded but non-functional.
8. ⚠️ **15+ overlapping gabriel-named `.plist` files** in `~/Library/LaunchAgents/`. Only one can bind `:9777`. Disabled-dated files (`.disabled.20260422`, `.bak.20260420-233522`) suggest in-progress pruning.
9. ⚠️ **`god-local-diag` violates `.claude/rules/mcp-builder.md`** — uses HTTP on `:9099` (not stdio), tunnels via `gabriel.noizy.ai` (hostname policy says remote MCPs live on `mcp.noizy.ai`).
10. ⚠️ **`consent-oracle` hardcodes CF account IDs** (lines 16-20). Security rule: secrets via `wrangler secret` only.
11. ⚠️ **`audio-mcp` is a 803-line stub with 0 tools.** Superseded by `dreamchamber-audio/server.py` (686 lines, 13 tools) but `.mcp.json` still points at the stub.
12. ⚠️ **`metabeast-remote` is a CF Worker scaffold** — echoes requests, no JSON-RPC 2.0. Not a real MCP yet.
13. ⚠️ **`supersonic` is a 153-line boot stub** claiming 50+ modular tools via register-calls, but modules aren't imported. Not active.
14. ⚠️ **4× `voice-bridge-server.mjs` processes** (PIDs 99434, 87147, 22244, 16134). Could be one-per-client by design, could be zombie accumulation — worth a check.
15. ⚠️ **POPS registry entry is `RK_PLOWMAN.md` (628B)** — conflates the human ancestor with the AI agent persona. Two different identities, one file.
16. ⚠️ **GABRIEL is plural in practice.** One identity ("I AM the M2 Ultra" per embodiment decree) running as 3 processes: Node daemon `:9777`, Python serve `:9090`, bundled `GABRIEL/dist/index.js --daemon` (PID 22477). Doctrine is singular; runtime is plural.
17. ⚠️ **Plowman Chronicles Vol I/II/III have no explicit volume-to-agent mapping.** Referenced but unlinked.
18. ⚠️ **Constitution v2.0 stranded at `/Volumes/6TB`** — `MANIFESTO_TRINITY.md` flags the migration to `docs/governance/CONSTITUTION_v2.md`; not yet moved.
19. ⚠️ **No canonical agent dispatch flowchart.** `.claude/rules/agents.md` lists MCP routing and worktree patterns but no "how to dispatch agent X in context Y" decision tree.
20. ⚠️ **User-global `.claude/agents/` is missing `gabriel.morning.md` + `gabriel.review.md`** — project-scoped only. Rob's morning/review rituals are silently unavailable outside `NOIZYANTHROPIC/`.

---

## Priority fix list (ranked by impact)

| #   | Action                                                                                                                                            | Effort | Blocker for                                                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------- |
| 1   | Create `.claude/agents/lucy.md` (40-60L, mirror shape of `shirley.md` + covenant row + DAZEFLOW law + git custodian authority + Moira voice note) | 30 min | Being able to dispatch LUCY explicitly via `subagent_type` |
| 2   | Create `registry/family/LUCY.md` (stub matching `ALEX_WARD.md` shape — role, LIFELUV, FLOW, birthday covenant)                                    | 20 min | Covenant-to-registry alignment                             |
| 3   | Reconcile `.mcp.json`: remove stale `audio-mcp`, add `dreamchamber-audio`, `consent-oracle`, `synthesis-oracle`, `god-local-diag`                 | 15 min | MCP loader actually seeing 4 live servers                  |
| 4   | Fix `CLAUDE.md` "17 MCP Servers" count → 18                                                                                                       | 2 min  | Doctrine-to-reality match                                  |
| 5   | Place TEST_RUNNER in `family-covenant.md` OR document it as a non-family utility agent (like hooks)                                               | 10 min | Removing the phantom                                       |
| 6   | Prune 5 crashed LaunchAgents (exit 127/78) — investigate or `rm`                                                                                  | 30 min | Clean launchctl state                                      |
| 7   | Create 9 missing `registry/family/*.md` stubs for AI family members                                                                               | 1 hr   | Closing the registry-reality gap                           |
| 8   | Document NOIZYARMY Orchestrator or retire (`:9333`)                                                                                               | 30 min | No ghost runtime                                           |
| 9   | Move `consent-oracle` hardcoded CF IDs to `wrangler secret`                                                                                       | 15 min | Security rule compliance                                   |
| 10  | Consolidate `~/Library/LaunchAgents/gabriel*.plist` to one canonical                                                                              | 30 min | Single source of truth for daemon lifecycle                |

---

## How this file stays fresh

This index should be regenerated whenever:

- A new agent is added to `.claude/agents/`
- A new MCP is added to `mcp/`
- A new entry is added to `registry/family/`
- A LaunchAgent is installed or retired
- `family-covenant.md` binding rows change

Regenerate command (future): `ops/scan-agents.sh` — TODO, would parallel-grep these four partitions and diff against this file.

---

**Canonical sources of truth this file supersedes:**

- The scattered agent references in 22+ rule files — this index is the map
- CLAUDE.md's one-line "10 subagent definitions in `.claude/agents/`" — now fully enumerated
- The implicit MCP-owner-per-agent assumption — now explicit, with drift flags
