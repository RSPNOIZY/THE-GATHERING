# NOIZY Empire — Control Plane Inventory

> Every controllable surface in the empire: what can be dispatched by API, MCP, Discord bot, agent, or AI. Compiled 2026-04-17 during MC96ECOUNIVERSE cleanup sprint.

**Invariant:** every controllable surface below must respect Never Clauses, honor the Kill Switch, log writes to the noizy_ledger, and remain gated by the canonical auth stack (`X-NOIZY-Key` for HEAVEN; `NOIZY_API_KEY` for the fleet).

---

## 1 · Cloudflare Worker fleet (HTTP API)

All live on NOIZYFISH account `5f36aa9795348ea681d0b21910dfc82a`. All have `/health` for external probes and `/` for identity.

| Worker | URL | Purpose | Auth | Controllable by |
|---|---|---|---|---|
| **HEAVEN** | `heaven.rsp-5f3.workers.dev` | Consent kernel, 55 REST endpoints, D1 `gabriel_db`, ledger | `X-NOIZY-Key` | API · MCP (heaven-mcp) · any agent |
| **mc96-follower** | `mc96-follower.rsp-5f3.workers.dev` | Watches HEAVEN/GABRIEL/LUCY, 2-min cron, status dashboard | public `/status`, auth `/webhook` | CF01 slash commands · direct GET |
| **CF01** (Discord) | `cf01-discord.rsp-5f3.workers.dev` | Discord voice → Whisper → empire routing | Discord Ed25519 sig + `NOIZY_API_KEY` | iPad Discord voice notes · slash commands · direct `/voice` |
| **CF02** (Notion scribe) | `cf02-notion.rsp-5f3.workers.dev` | Appends empire events as children to NOIZY.AI master page | `X-NOIZY-Key` | `POST /append` · `POST /webhook` |
| **CF03** (Linear dispatcher) | `cf03-linear.rsp-5f3.workers.dev` | Creates Linear issues from events (GraphQL) | `X-NOIZY-Key` | `POST /issue` · `POST /webhook` |
| **CF04** (Slack relay) | `cf04-slack.rsp-5f3.workers.dev` | Posts to noizyai Slack, escalates `priority=critical` via DM | `X-NOIZY-Key` | `POST /post` · `POST /webhook` |
| noizy-landing | `noizy-landing.rsp-5f3.workers.dev` · plus apex route + www Custom Domain staged | 396 Hz landing page | public | HTTP GET |

**Secrets to put (via `npx wrangler secret put`):**
- CF01: `DISCORD_PUBLIC_KEY`, `DISCORD_BOT_TOKEN`, `DISCORD_APPLICATION_ID`, `NOIZY_API_KEY`
- CF02: `NOTION_TOKEN`, `NOIZY_API_KEY`
- CF03: `LINEAR_API_KEY`, `LINEAR_TEAM_ID`, `NOIZY_API_KEY`
- CF04: `SLACK_BOT_TOKEN`, `SLACK_CRITICAL_DM_USERS`, `NOIZY_API_KEY`

---

## 2 · MCP servers (17 local, stdio-based)

Under `/mcp/<name>/` and registered in `.mcp.json`. Every MCP tool is an empire action callable by any MCP client (Claude Code, Claude.ai, VS Code, Cursor, iPad Claude via bridge).

| MCP server | Location | Tools (headline) |
|---|---|---|
| **heaven-mcp** | `mcp/heaven-mcp/` | consent check, ledger append, token issue/revoke, actor/clause list |
| **gabriel-mcp** | `mcp/gabriel-mcp/` | 14 tools — speak, cache append/list/search, handoff, watch, status |
| **lucy-mcp** | `mcp/lucy-mcp/` | 17 tools — dazeflow, task, memcell, intake (receive/classify/archive/search/synthesize/queue) |
| **engr-keith-mcp** | `mcp/engr-keith-mcp/` | schema_check, endpoint_map, migration_plan, perf_report, architecture, status |
| **shirley-mcp** | `mcp/shirley-mcp/` | file_inventory, dep_audit, code_stats, find_todos, format_check, status |
| **dream-mcp** | `mcp/dream-mcp/` | vision_check, roadmap, prioritize, elevator_pitch, status |
| **family-mcp** | `mcp/family-mcp/` | pops_wisdom, shirl_check, break_reminder, session_check, celebrate, status |
| **consent-oracle** | `mcp/consent-oracle/` | pre-synthesis consent validation |
| **synthesis-oracle** | `mcp/synthesis-oracle/` | Voice DNA gating for synth requests |
| **cb01-mcp** | `mcp/cb01-mcp/` | 6 tools — status, health_check, smoke_test, env_check, deploy_status, godaddy_checklist |
| **shortcuts-mcp** | `mcp/shortcuts-mcp/` | macOS Shortcuts dispatch |
| **audio** + **dreamchamber-audio** | `mcp/audio/`, `mcp/dreamchamber-audio/` | 13-tool audio pipeline for DreamChamber (Python, FastMCP) |
| **voice-bridge** | `mcp/voice-bridge/` | claude_tower, heaven_query, run_script, system_status, voice_command |
| **gemma3** | `mcp/gemma3/` | SHIRLEY model host wrapper |
| **supersonic** | `mcp/supersonic/` | consent, deploy, d1, kv modules |

**Hosted MCP servers (auto-available via `claude.ai` integrations):** AWS Marketplace · Amplitude · Atlassian (Jira + Confluence) · Base44 · Box · Canva · Cloudflare Developer Platform · Figma · Gmail · Google Calendar · Google Drive · Granola · Hugging Face · Notion · Slack · Stripe · Supabase · Ticket Tailor · Vercel · Zapier · gong · microsoft-365 · kapa-n8n. Plus plugin-local: dream-mcp, engr-keith-mcp, family-mcp, gabriel-mcp, heaven-mcp, lucy-mcp, shirley-mcp, noizy-voice-bridge, voice-bridge.

---

## 3 · Discord control surface (CF01 + expandable)

Slash commands registerable against `DISCORD_APPLICATION_ID`:
- `/empire <query>` — free-form route → CF01's `routeCommand` → HEAVEN/GABRIEL/follower
- `/status` — pulls `mc96-follower/status`, formats for Discord

Voice path: iPad Discord voice note → CF01 `/interactions` (Ed25519 verified) → Workers AI `@cf/openai/whisper` → `routeCommand` → Discord reply. End-to-end hands-free dispatch.

**Extension pattern (for future CF0X):** any relay CF Worker can be invoked from Discord by wiring a slash command to forward to that CF's `/webhook` endpoint.

---

## 4 · Runnable scripts (local CLI)

**Scale inventory (repo root):**
- 81 executable Python scripts
- 382 shell scripts
- 77 Node `package.json` surfaces
- Total script count: ≈ 540 executable entry points

**High-leverage ops scripts** (`ops/` + repo root):
| Script | Purpose |
|---|---|
| `ops/empire-drive-extract.sh` | Dedupe + extract empire artifacts from any external drive (MAG 4TB, 12TB, MacPro SSD) |
| `ops/relocate-av-to-6tb.sh` | Move A/V off boot SSD, honors 7-day-mtime active-project clause |
| `ops/cf-zone-watch.sh` · `ops/cf-zone-health.sh` | Monitor Cloudflare zone status (needs `CF_API_TOKEN`) |
| `scripts/pre-launch-checklist.sh` | Full launch gate: process health, Heaven smoke, config freeze |
| `scripts/gabriel-dispatch.sh` · `scripts/gabriel-merge.sh` | Fan work to parallel worktree subagents |
| `smoke_test.sh` (repo root) | 22/22 smoke tests with auth |
| `deploy.sh` | Heaven deploy with pre-checks |
| `tools/turbo-scripts/turbo_pipeline.sh` | Heal → dedupe → unify → verify pass on a codebase |
| `tools/turbo-scripts/turbo_git_sync.sh` | Sync local repos to GitHub |

---

## 5 · Claude Code surface (skills, agents, prompts, commands)

### Agents (10 in `.claude/agents/`, dispatchable via Agent tool)
- `gabriel-orchestrator` — master router
- `cb01` — Cloudflare Worker operations
- `consent-auditor` — Never Clause compliance
- `dream` · `engr-keith` · `pops` · `shirl` · `shirley` · `voice-specialist` · `test-runner`

### Skills (21 in `.claude/skills/`, invokable via Skill tool or `/<name>`)
Operational: `noizy-deploy` · `consent-audit` · `gabriel-ops` · `heaven-dev` · `empire-status`
DreamChamber: `dreamchamber-multimodal` · `-agent-personalities` · `-sensory` · `-proof`
Strategic: `universal-protector-strategy` · `advanced-cryptography` · `adversarial-threat-modeling` · `adoption-and-scaling` · `ten-year-strategic-roadmap`
Constitutional: `golden-principles` · `golden-rules-consent` · `golden-rules-governance` · `golden-rules-agents` · `golden-skills-synthesis`
Infra/timeline: `deployment-critical-path` · `godaddy-migration`

### Prompts (10 in `.claude/prompts/`, selectable at session start)
`deploy-heaven` · `gabriel-boot` · `gabriel-release-commander` · `godaddy-exit` · `gpt-release-auditor` · `morning-status` · `new-endpoint` · `onboard-actor` · `security-audit` · `workspace-setup`

### Hooks (in `.claude/hooks/`, auto-fire)
`format-and-lint.sh` on PostToolUse(Edit/Write) · `session-start.sh` on SessionStart

---

## 6 · Running local services (port map)

| Port | Service | Role |
|---|---|---|
| 11434 | Ollama | Gemma/Llama local models (SHIRLEY) |
| 15672 | RabbitMQ management | Docker mc96eco stack |
| 3000 | Grafana | Metrics (mc96eco) |
| 3001 | Uptime Kuma | Service monitoring |
| 3080 | open-webui | Multi-model chat (LiteLLM fronted) |
| 4000 | LiteLLM | Multi-provider proxy |
| 5432 | Postgres | n8n + general |
| 5672 | RabbitMQ | mc96eco queue |
| 6333-6334 | Qdrant | Vector DB (mc96eco) |
| 6379 | Redis | Shared cache |
| 7474/7687 | Neo4j | Graph DB (mc96eco) |
| 7777 | DreamChamber | Multi-model creative space (currently stale — daemon not running) |
| 8080 | Nextcloud | Private file sync |
| 8081 | NocoDB | Internal admin |
| 8082 | SearXNG | Private meta-search |
| 8083 | Stirling-PDF | PDF ops |
| 8108 | Typesense | Full-text search |
| 9000/9001 | MinIO | S3-compatible object store |
| 9777 | GABRIEL daemon | Orchestration (stale — needs restart) |
| 11434 | Ollama | Local LLM host |
| 3283 | ARDAgent | Apple Remote Desktop (MacPro discovery) |
| 3689 | mediashare | Home Sharing |
| 4710/4718/4720 | UAD/LUNA | Universal Audio hardware bridges |

---

## 7 · Models / AI surface

**Cloudflare Workers AI (bound in CF01):**
- `@cf/openai/whisper` (voice transcription, used in CF01)
- other models available per account (can be added as bindings)

**LiteLLM proxy (`:4000`):** multi-provider fan-in — route to Anthropic, OpenAI, Google, Together, Mistral, Cohere, Perplexity from one endpoint.

**Ollama (`:11434`):** Gemma 3 27B (SHIRLEY) + any pulled local model.

**open-webui (`:3080`):** interactive chat UI in front of LiteLLM + Ollama.

**Claude API:** via `ANTHROPIC_API_KEY` in `.env` (currently empty per roadmap BLOCK 3).

**11 providers in DreamChamber port 7777** (stale, needs restart): Claude, GPT, Gemini, Gemma, Llama, Mistral, Cohere, Perplexity, Grok, Qwen, DeepSeek.

---

## 8 · n8n Agentic Factory (`:5678`)

Workflows already in repo (`NOIZYLAB/integrations/n8n/`):
- `01_gabriel_heartbeat.json` — periodic health ping
- `02_gabriel_command_webhook.json` — command dispatch
- `tools/n8n_workflows/01_github_to_gabriel.json` — GitHub event relay

New this sprint: `n8n-flows/mc96-grep-swarm.json` — 6-brand parallel grep swarm that fans out to brand-vertical execute-commands, aggregates by owner agent (GABRIEL/LUCY), logs to HEAVEN ledger.

n8n is itself API-controllable at `:5678/rest/` — workflows can be created, run, and observed via REST.

---

## 9 · Cron / scheduled triggers

| Trigger | Cadence | Action |
|---|---|---|
| mc96-follower cron | `*/2 * * * *` | Probe HEAVEN/GABRIEL/LUCY, write KV sample |
| n8n mc96-grep-swarm (after import + enable) | Every 30 min | 6-brand grep fan-out |
| `cf-zone-watch.sh` (if run as launchd) | 30 min | Watch zone pending→active |
| `session-start.sh` hook | Every Claude Code session | Env check + audit log |
| `format-and-lint.sh` hook | Every Edit/Write | Prettier/ESLint/Black |

---

## 10 · Data plane (D1, KV, R2, Postgres, Qdrant, Neo4j)

All of these can be read/written from any Worker binding or MCP tool.

**Cloudflare:**
- **D1 `gabriel_db`** (`a31d68e2-f2d4-4203-a803-8039fdff31cb`) — 25 tables + 9 views — the empire's SQL source of truth
- **D1 `agent-memory`** — agent persistent memory
- **D1 `noizyanthropic`** — Anthropic integration data
- **KV GABRIEL_KV** — rate-limit + cache
- **KV GABRIEL_VOICE** — voice asset storage
- **KV FOLLOWER_KV / CF0X_KV** — Worker fleet state (reuses GABRIEL_KV id in current scaffolds; split later if hot)

**Local (Docker):**
- **Postgres** (`:5432`) · **Redis** (`:6379`) · **MinIO** (`:9000`) · **Qdrant** (`:6333`) · **Neo4j** (`:7474`) · **Typesense** (`:8108`) · **ClickHouse** (no exposed port — internal)

---

## 11 · External integrations wired via MCP (ready to orchestrate)

Authenticated MCP servers exposed to Claude:
| Surface | Actions available |
|---|---|
| **Notion** | create/update/fetch pages + databases, comment, search workspace |
| **Slack** | send_message, read_channel, search, canvas create/update, schedule_message |
| **Stripe** | create customer/product/price/invoice, list subscriptions/refunds, search docs |
| **Atlassian (Jira + Confluence)** | create/edit/search issues, add comments/worklogs, manage Confluence pages |
| **Gmail** | create_draft, label, search_threads |
| **Google Calendar** | create/list/delete events, suggest_time |
| **Google Drive** | search + fetch (read-only after auth) |
| **Vercel** | deploy, list deployments, get runtime logs, manage toolbar threads |
| **Cloudflare Dev Platform** | accounts/zones list, D1/KV/R2 CRUD, Hyperdrive, Workers list/get |
| **Supabase** · **Canva** · **Figma** · **Hugging Face** · **Box** · **Microsoft-365** · **Ticket Tailor** · **Base44** · **gong** · **Amplitude** · **Zapier** · **GoDaddy** | authenticate / execute domain-specific actions |

---

## 12 · What's missing (to reach 100% control-plane coverage)

| Gap | Unblock |
|---|---|
| CF02/03/04 need secrets (NOTION/LINEAR/SLACK tokens + NOIZY_API_KEY) | `wrangler secret put …` one-time |
| CF01 needs Discord app creds | Register bot at discord.com/developers → 4 secrets |
| GABRIEL daemon :9777 is stale | `GABRIEL_PORT=9777 node GABRIEL/daemon/gabriel-daemon.js` or launchd restart |
| DreamChamber :7777 not running | `cd dreamchamber && npm start` |
| noizy.ai / www.noizy.ai served | `.ai` registrar NS flip (alex/melinda → marek/tara) |
| MacPro SSD reachable | Finder: `smb://macpro.local` + save to keychain |
| MICKY-P (2018 MBP) on NOIZYNET | Power on, join fabric |
| Zone:DNS:Edit CF API token | Rob creates at dash.cloudflare.com/profile/api-tokens (BLOCK 4) |

---

## Dispatch chain diagram (how one command rides the empire)

```
Rob (iPad) --voice--> Discord -----> CF01 ------> Workers AI Whisper
                                       |               |
                                       v               v
                             HEAVEN (consent check)  transcript
                                       |
              +------------------------+------------------------+
              v                        v                        v
         CF02 Notion              CF03 Linear              CF04 Slack
         append child page        create issue             post + escalate
              |                        |                        |
              +-----+      +-----------+                        |
                    v      v                                    v
                HEAVEN ledger append (every write logged)  noizyai channel / critical DM
```

One voice note → 4 downstream surfaces, every step auditable in the ledger.

---

*396 Hz · Every controllable surface must honor consent, provenance, revocation, and compensation.*
