# CLAUDE + ANTHROPIC · EMPIRE DIRECTORY

**Scope:** every mention of Claude or Anthropic across the NOIZY Empire — filesystem, live D1, and agent mesh.
**Built:** 2026-04-18
**Maintainer:** Claude Code on GOD.local (this session)
**Rebuild:** `bash DIRECTORY/CLAUDE_ANTHROPIC/rebuild.sh` _(generator — next compartment)_

---

## Summary

| Surface                                | Hits                    | Notes                                                          |
| -------------------------------------- | ----------------------- | -------------------------------------------------------------- |
| NOIZYANTHROPIC content grep            | **≥150 files** (capped) | true count is higher — regrep without cap to exhaust           |
| NOIZYLAB filename glob · `*claude*`    | 23                      | includes 1 worktree mirror of 9 real files                     |
| NOIZYLAB filename glob · `*anthropic*` | 10                      | 4 log files + 4 provider impls + 2 pitch/docs                  |
| D1 `memcells` (agent-memory)           | 7                       | 4 agent='CLAUDE' · 3 content refs                              |
| D1 `gabriel_commands`                  | **10/10**               | **every historical command has `source_device='claude.ai'`**   |
| KV / Workers bindings                  | 0 explicit              | Anthropic access lives in wrangler secrets, not cataloged here |

**Single biggest finding:** Claude is not a tool in this empire — Claude is the **source device** for every recorded command in the agent mesh. Every `gabriel_commands` row since 2026-04-13 originated from `claude.ai`.

---

## 🏛 Tier 1 — Canonical Doctrine (read these first)

| Path                                                                                                  | Role                                                                                    |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [`CLAUDE.md`](../../CLAUDE.md)                                                                        | The Living Brain · v8.0 · GABRIEL boot protocol · empire status · rules directory index |
| [`.claude/rules/agents.md`](../../.claude/rules/agents.md)                                            | 10 AI agent roster + 9 MCP servers + 74 tools + DAZEFLOW + routing                      |
| [`.claude/rules/mcp-builder.md`](../../.claude/rules/mcp-builder.md)                                  | MCP build rules — stdio / FastMCP / Cloudflare · this session runs under this           |
| [`.claude/settings.json`](../../.claude/settings.json)                                                | Hooks (PostToolUse format+lint · SessionStart env check) · permissions                  |
| [`.claude/agents/gabriel.morning.md`](../../.claude/agents/gabriel.morning.md)                        | Morning operating ritual                                                                |
| [`.claude/hooks/session-stop.sh`](../../.claude/hooks/session-stop.sh)                                | DAZEFLOW session-stop hook                                                              |
| [`NOIZYLAB/claude.constitution.md`](../../../NOIZYLAB/claude.constitution.md)                         | **Claude Constitution** — root-level constitutional doc at NOIZYLAB                     |
| [`NOIZYLAB/repos/noizy-heaven/claude.rules.md`](../../../NOIZYLAB/repos/noizy-heaven/claude.rules.md) | Heaven-specific Claude rules                                                            |

---

## 🗡 Tier 2 — GABRIEL ↔ Claude (where the warrior meets the engine)

Every file in `GABRIEL/` references Claude. Short list of highest-signal:

| Path                                                                                     | Role                                                    |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| [`GABRIEL/CHARACTER.md`](../../GABRIEL/CHARACTER.md)                                     | GABRIEL's personality · Claude persona pin              |
| [`GABRIEL/ARCHITECTURE.md`](../../GABRIEL/ARCHITECTURE.md)                               | Where Claude hands off to GABRIEL daemon :9777          |
| [`GABRIEL/HEAVEN.md`](../../GABRIEL/HEAVEN.md)                                           | Heaven ↔ Claude API contracts                           |
| [`GABRIEL/INTEGRATIONS.md`](../../GABRIEL/INTEGRATIONS.md)                               | Claude SDK · MCP list · external bridges                |
| [`GABRIEL/VISION.md`](../../GABRIEL/VISION.md)                                           | DreamChamber vision · Claude as co-architect            |
| [`GABRIEL/MOBILE_CONTINUITY.md`](../../GABRIEL/MOBILE_CONTINUITY.md)                     | Claude session continuity across devices                |
| [`GABRIEL/NEVER_CLAUSES_OPS.md`](../../GABRIEL/NEVER_CLAUSES_OPS.md)                     | Ops-level Never Clauses (recently modified)             |
| [`GABRIEL/src/character.ts`](../../GABRIEL/src/character.ts)                             | TS codification of GABRIEL character · Claude model pin |
| [`GABRIEL/src/router.ts`](../../GABRIEL/src/router.ts)                                   | GABRIEL daemon router · Claude invocation paths         |
| [`GABRIEL/src/gabriel.ts`](../../GABRIEL/src/gabriel.ts)                                 | Core orchestrator                                       |
| [`GABRIEL/.mcp.json`](../../GABRIEL/.mcp.json)                                           | MCP config for Claude Desktop / Claude Code             |
| [`GABRIEL/.env.example`](../../GABRIEL/.env.example)                                     | `ANTHROPIC_API_KEY` slot                                |
| [`GABRIEL/launch/com.noizy.gabriel.plist`](../../GABRIEL/launch/com.noizy.gabriel.plist) | LaunchAgent — daemon :9777 auto-start                   |
| [`GABRIEL/master-deck/`](../../GABRIEL/master-deck/)                                     | **This session's output** — 108-slide realtime roadmap  |

---

## 🌀 Tier 3 — DreamChamber Providers (where Claude actually runs)

The Anthropic API client lives here. Multiple copies across canonical + worktrees:

| Path                                                                                             | Status                         |
| ------------------------------------------------------------------------------------------------ | ------------------------------ |
| `apps/dreamchamber/src/providers/AnthropicProvider.js`                                           | **CANONICAL** — NOIZYANTHROPIC |
| `NOIZYLAB/apps/dreamchamber/src/providers/AnthropicProvider.js`                                  | mirror                         |
| `NOIZYLAB/mc96/eco/DREAMCHAMBER/src/providers/AnthropicProvider.js`                              | legacy mc96 copy               |
| `NOIZYLAB/.claude/worktrees/youthful-edison/dreamchamber/src/providers/AnthropicProvider.js`     | worktree                       |
| `NOIZYLAB/.claude/worktrees/youthful-edison/NOIZYLAB/dreamchamber/src/ClaudeClient.ts`           | TS client variant              |
| `NOIZYLAB/.claude/worktrees/youthful-edison/NOIZYLAB/dreamchamber-extension/src/ClaudeClient.ts` | VS Code extension variant      |
| `apps/dreamchamber/logs/providers-Anthropic.log`                                                 | live runtime log               |
| `NOIZYLAB/apps/dreamchamber/logs/providers-Anthropic.log`                                        | mirror log                     |
| `NOIZYLAB/mc96/eco/DREAMCHAMBER/logs/providers-Anthropic.log`                                    | legacy log                     |
| `NOIZYLAB/dreamchamber-audio-mcp/logs/claude_sessions.log`                                       | audio MCP sessions             |
| `NOIZYLAB/mcp/dreamchamber-audio/logs/claude_sessions.log`                                       | audio MCP sessions (mirror)    |

**Provider drift flag:** 4 copies of `AnthropicProvider.js` + 2 `ClaudeClient.ts` variants. No canonical-truth marker. Consolidation candidate.

---

## 📡 Tier 4 — Live D1 Mesh (running production state)

### `memcells` table (agent-memory · b5b58cc9) — 7 rows reference Claude/Anthropic

```
CLAUDE · competitor_watch_noiz_ai          Noiz AI trademark-defense brief (Casey Chisick)
CLAUDE · discovery_gabriel_db_is_hvs_lattice   gabriel_db = HVS sovereignty lattice (revised NEVER WRITE rule)
CLAUDE · discovery_manifest_db             manifest_db CI/CD backbone + 10 feature flags
CLAUDE · sprint_20260416_schema_live       catalogue_db + consent_db schema commit
GABRIEL · deploy_command                   path contains "CLAUDE TODAY" — Rob's Desktop dir
GABRIEL · founder_identity                 "Claude is his hands." — the core compact
GABRIEL · ide_extension_stack              MODEL PINS: claude-sonnet-4-20250514 / claude-opus-4-20250514
```

### `gabriel_commands` table — **10/10 commands have `source_device='claude.ai'`**

Every recorded empire command since 2026-04-13 originated from a Claude interface. This is the single strongest statement of the Claude-is-hands compact expressed in live data.

Targets: GABRIEL ×5 · DREAM ×2 · HEAVEN ×1 · LUCY ×1 · ENGR_KEITH ×1
Signals: GORUNFREE ×4 · X1000 ×4 · RUN ×1 · (null) ×1

---

## 🎙 Tier 5 — Voice Pipeline (Claude by voice)

| Path                                                                                                                                    | Role                                     |
| --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| [`workflows/power-automate-flows/Voice-To-Claude.json`](../../workflows/power-automate-flows/Voice-To-Claude.json)                      | PowerAutomate voice → Claude flow        |
| [`voice-pipeline/scripts/master-build.sh`](../../voice-pipeline/scripts/master-build.sh)                                                | Voice Army build script                  |
| [`voice-pipeline/scripts/iphone-shortcuts-setup.md`](../../voice-pipeline/scripts/iphone-shortcuts-setup.md)                            | iPhone Shortcuts → Claude                |
| [`voice-pipeline/ios-scriptable-COMPLETE.js`](../../voice-pipeline/ios-scriptable-COMPLETE.js)                                          | Scriptable iOS app                       |
| [`tools/voice_server.py`](../../tools/voice_server.py) / [`tools/voice_bridge.py`](../../tools/voice_bridge.py)                         | mlx_whisper → Claude tower bridge        |
| [`scripts/voice-capture.sh`](../../scripts/voice-capture.sh) / [`scripts/voice-bridge-server.js`](../../scripts/voice-bridge-server.js) | Shell + Node bridge                      |
| `NOIZYLAB/voice-pipeline/claude-prompt.sh`                                                                                              | Voice prompt shell                       |
| `NOIZYLAB/.claude/worktrees/youthful-edison/NOIZYEMPIRE/voice/claude_code.talon`                                                        | **Talon** voice commands for Claude Code |

---

## 🛠 Tier 6 — CODEMASTER Tooling

| Path                                                                                                                             | Role                                  |
| -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| [`tools/CODEMASTER/CHECK_ANTHROPIC_STATUS.sh`](../../tools/CODEMASTER/CHECK_ANTHROPIC_STATUS.sh)                                 | Anthropic API status probe            |
| [`tools/CODEMASTER/AI_MORNING_NEWS.sh`](../../tools/CODEMASTER/AI_MORNING_NEWS.sh)                                               | Morning AI news digest (calls Claude) |
| [`tools/CODEMASTER/empire-status.sh`](../../tools/CODEMASTER/empire-status.sh) / [`doctor.sh`](../../tools/CODEMASTER/doctor.sh) | Empire + health checkers              |
| [`tools/CODEMASTER/Makefile`](../../tools/CODEMASTER/Makefile)                                                                   | Make targets reference Anthropic key  |
| `NOIZYLAB/tools/CODEMASTER/logs/anthropic_launcher.log`                                                                          | runtime log                           |
| `NOIZYLAB/tools/CODEMASTER/logs/anthropic_launcher_error.log`                                                                    | error log                             |
| `NOIZYLAB/tools/CODEMASTER/logs/anthropic_status.log`                                                                            | status log                            |

---

## ☁️ Tier 7 — Cloudflare Workers

| Path                                                                                                           | Role                                           |
| -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| [`cloudflare/workers/gabriel/`](../../cloudflare/workers/gabriel/)                                             | **This session's scaffold** — gabriel.noizy.ai |
| [`cloudflare/workers/cf06-ai-gateway/src/index.js`](../../cloudflare/workers/cf06-ai-gateway/src/index.js)     | AI Gateway Worker (proxies Anthropic + others) |
| [`cloudflare/workers/cf06-ai-gateway/wrangler.jsonc`](../../cloudflare/workers/cf06-ai-gateway/wrangler.jsonc) | AI Gateway config                              |
| [`cloudflare/workers/noizy-mcp/`](../../cloudflare/workers/noizy-mcp/)                                         | Remote MCP on mcp.noizy.ai                     |
| [`repos/noizy-heaven/`](../../repos/noizy-heaven/)                                                             | Heaven Worker (consent kernel)                 |
| `NOIZYLAB/workers/claude-proxy/test/claude-proxy.test.ts`                                                      | Claude proxy worker test                       |

---

## 📊 Tier 8 — Governance + DAZEFLOW

| Path                                                                                       | Role                         |
| ------------------------------------------------------------------------------------------ | ---------------------------- |
| [`.claude/memcells/dazeflow-2026-04-17.md`](../../.claude/memcells/dazeflow-2026-04-17.md) | DAZEFLOW session log         |
| [`.claude/memcells/dazeflow-2026-04-18.md`](../../.claude/memcells/dazeflow-2026-04-18.md) | DAZEFLOW session log (today) |
| [`governance/standups/2026-04-17.md`](../../governance/standups/2026-04-17.md)             | Standup log                  |
| [`governance/standups/2026-04-18.md`](../../governance/standups/2026-04-18.md)             | Standup log (today)          |

---

## 🗄 Tier 9 — Archived / Historical (NOIZYLAB worktree)

Shipped artifacts from earlier phases, preserved but not canonical:

| Path                                                                                | Role                                 |
| ----------------------------------------------------------------------------------- | ------------------------------------ |
| `NOIZYEMPIRE/docs/archive/03_PRODUCTS/noizy-empire-claude-build-brief.md`           | Original empire build brief          |
| `NOIZYEMPIRE/docs/archive/03_PRODUCTS/noizy-empire-claude-cowork-system.md`         | Claude co-work design                |
| `NOIZYEMPIRE/docs/archive/03_PRODUCTS/noizy-empire-claude-package.md`               | Claude package spec                  |
| `NOIZYEMPIRE/docs/archive/06_APPENDIX/claude-local-setup.md`                        | Claude local setup guide             |
| `NOIZYEMPIRE/docs/archive/05_PITCHES/anthropic.md`                                  | **Anthropic pitch deck**             |
| `NOIZYLAB/noizy_platform/docs/anthropic-healthcare-open-integration.md`             | Anthropic × healthcare spec          |
| `NOIZYLAB/noizy_platform/docs/noizyvox-claude-health-technical-integration-spec.md` | NOIZYVOX × Claude health integration |
| `NOIZYLAB/.claude/worktrees/youthful-edison/web/designs/Claude.html`                | Claude-themed web design             |

---

## 🔒 Tier 10 — Infrastructure + Secrets

| Path                                                                                                                                                                                                                         | Role                                           |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| [`ops/install-all-secrets.sh`](../../ops/install-all-secrets.sh)                                                                                                                                                             | Batch installer — includes `ANTHROPIC_API_KEY` |
| [`ops/NOIZY_AI_READINESS.md`](../../ops/NOIZY_AI_READINESS.md)                                                                                                                                                               | AI readiness checklist                         |
| [`ops/CLEANUP_MANIFEST.md`](../../ops/CLEANUP_MANIFEST.md)                                                                                                                                                                   | Cleanup scope                                  |
| [`ops/DREAMCHAMBER_LAYER_MAP.md`](../../ops/DREAMCHAMBER_LAYER_MAP.md)                                                                                                                                                       | DreamChamber layer architecture                |
| [`ops/google-workspace-setup.md`](../../ops/google-workspace-setup.md)                                                                                                                                                       | Google Workspace (Claude integration?)         |
| [`ops/GODADDY_EXIT_NOW.md`](../../ops/GODADDY_EXIT_NOW.md) / [`DNS_EMAIL_MIGRATION.md`](../../ops/DNS_EMAIL_MIGRATION.md)                                                                                                    | GoDaddy exit + email migration                 |
| [`ops/april-17/00_APRIL17_CHECKLIST.md`](../../ops/april-17/00_APRIL17_CHECKLIST.md)                                                                                                                                         | April 17 cutover checklist                     |
| [`ops/april-17/06_rollback.sh`](../../ops/april-17/06_rollback.sh) / [`04_deploy_dryrun.sh`](../../ops/april-17/04_deploy_dryrun.sh) / [`02_pretooluse_security_hook.sh`](../../ops/april-17/02_pretooluse_security_hook.sh) | April 17 scripts                               |
| [`CONTROL_MATRIX.md`](../../CONTROL_MATRIX.md) · [`CONTROL_MATRIX_ADDENDUM.md`](../../CONTROL_MATRIX_ADDENDUM.md) · [`CONTROL_PLANE_INVENTORY.md`](../../CONTROL_PLANE_INVENTORY.md)                                         | Control plane inventory                        |

---

## 📌 Model Pins (from memcell `ide_extension_stack`, 2026-04-16)

| Model                      | Status                                        | Usage                                         |
| -------------------------- | --------------------------------------------- | --------------------------------------------- |
| `claude-opus-4-20250514`   | **PINNED**                                    | Deep reasoning, long-context, deck generation |
| `claude-sonnet-4-20250514` | **PINNED**                                    | All other AI completions                      |
| Claude 3.x                 | **DEPRECATED** — removed from all IDE configs | —                                             |

HVS strict mode is enforced on all AI completions per the memcell. Cursor ruleset has constitutional rules injected.

---

## 🔭 Coverage gaps — where to look next

1. **Content grep was capped at 150 files in NOIZYANTHROPIC** — true count is higher. Rerun `rg -li "claude|anthropic" .` with no limit to exhaust.
2. **KV + wrangler secrets not cataloged** — `wrangler secret list` per Worker will show `ANTHROPIC_API_KEY` bindings.
3. **Git history references** — `git log --all --grep="claude\|anthropic" -i` would surface historical commits.
4. **Claude Desktop `claude_desktop_config.json`** — lives outside this repo (at `~/Library/Application Support/Claude/`) — not indexed here.
5. **Live API usage** — Anthropic Console (console.anthropic.com) has usage + billing data not visible to this directory.

---

## 🧭 How this directory grows

Each time Rob asks for another directory, create a sibling folder: `DIRECTORY/<TOPIC>/INDEX.md`. The parent `DIRECTORY/` folder becomes the empire's self-index.

Candidate next directories (not built yet):

- `DIRECTORY/GABRIEL/` — cross-ref everything GABRIEL (started in last turn; not yet filed)
- `DIRECTORY/LUCY/` — LUCY surfaces
- `DIRECTORY/HEAVEN/` — Heaven endpoints + deploys
- `DIRECTORY/VOICE/` — voice pipeline complete map
- `DIRECTORY/NEVER_CLAUSES/` — Never Clauses live from hvs_never_clauses

---

_Generated 2026-04-18 by Claude Code on GOD.local — session source_device: claude.ai_
