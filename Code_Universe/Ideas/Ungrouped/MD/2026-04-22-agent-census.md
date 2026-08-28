# AGENT CENSUS — GLOBAL SCRAPE — 2026-04-22

**Operator:** RSP_001 via GABRIEL
**Scope:** Every agent home, every agent definition, every MCP server, every persona reference — across the full GOD.local filesystem (excluding node_modules, .git, archives). No corner left unindexed.

---

## 1 · HOSTS (where agents live physically)

| Surface | Role | Truth status |
|---|---|---|
| `/Users/m2ultra/NOIZYANTHROPIC/` | **Canonical monorepo** | source of truth |
| `/Users/m2ultra/NOIZYLAB` | **Symlink → NOIZYANTHROPIC** | alias (same tree) |
| `/Users/m2ultra/THE-DREAMCHAMBER/4TBL__MASTER_2026/NOIZYANTHROPIC/` | **Snapshot mirror** (4TBL backup) | backup, do not edit |
| `/Users/m2ultra/Desktop/HEAVEN/` | **Empty** | ghost reference in old CLAUDE.md |
| `/Volumes/6TB/ARCHIVE/…/NOIZYLAB_TEXT_VAULT/GABRIEL/` | **Cold archive** | historical, read-only |
| `/Volumes/6TB/NOIZY_MODELS/` | **Model weights** | Ollama/MLX storage |

**Key discovery:** the `NOIZYLAB → NOIZYANTHROPIC` symlink (made 2026-04-06) means every `~/NOIZYLAB/mcp/...` path in `.mcp.json` and `mcp-health.sh` resolves through the same tree — there is **one source of truth**, two names.

---

## 2 · AGENT DEFINITIONS — `.claude/agents/` (12 files)

All live at `/Users/m2ultra/NOIZYANTHROPIC/.claude/agents/`.

| File | Agent | Role (one line) |
|---|---|---|
| `gabriel-orchestrator.md` | **GABRIEL** | Warrior executor · lead orchestrator |
| `gabriel.morning.md` | **GABRIEL** (mode) | Morning ritual — control-plane builder |
| `gabriel.review.md` | **GABRIEL** (mode) | Review mode — architecture/safety gate pre-merge |
| `engr-keith.md` | **ENGR_KEITH** | Technical Lead · Heaven architect · R.K. Plowman legacy |
| `dream.md` | **DREAM** | Visionary · 5th Epoch strategic architect |
| `shirley.md` | **SHIRLEY** | Code & File Manager · Gemma 3 27B (Gemma 4 cutover pending) |
| `cb01.md` | **CB01** | Ops Runner · DNS · GoDaddy exit |
| `consent-auditor.md` | **CONSENT_AUDITOR** | Security · consent kernel inviolability |
| `voice-specialist.md` | **VOICE_SPECIALIST** | Voice DNA · audio pipeline · synthesis |
| `pops.md` | **POPS** | Grounding force · R.K. Plowman wisdom lineage |
| `shirl.md` | **SHIRL** | The Aunt · burnout watchdog |
| `test-runner.md` | **TEST_RUNNER** | Verification gate — nothing ships without approval |

**Distinct agents:** 10 (gabriel is 1 agent in 3 modes).
**Notable:** no `alex-ward.md` in `.claude/agents/` yet — ALEX exists in `registry/family/` but no operational agent prompt yet. That is a gap to close if he's to be dispatched like the others.

---

## 3 · HUMAN FAMILY REGISTRY — `registry/family/` (3 files)

| File | Identity | Status |
|---|---|---|
| `RSP_001.md` | Robert Stephen Plowman · Founder · `rsp@noizy.ai` | Founding Actor |
| `RK_PLOWMAN.md` | R.K. Plowman · The Father · carried in POPS + ENGR_KEITH | Deceased · wisdom anchor |
| `ALEX_WARD.md` | Alex Ward · CFO/CEO/co-architect · `alex@noizy.ai` (pending Email Routing alias) | Active · ratified 2026-04-20 |

**ALEX classification:** HUMAN family + executive class + technological peer — **first non-Founder in any class**. Shares the three-way memcell substrate with GABRIEL + LUCY (per `.claude/rules/shared-memcells.md`).

---

## 4 · MCP SERVERS — `mcp/` (18 server dirs, ~400 tools total)

| Server | Tools (≈) | Description / primary role |
|---|---|---|
| `gabriel-mcp` | 26 | GABRIEL AI Orchestration Layer |
| `lucy-mcp` | 31 | LUCY · DAZEFLOW · Task Log · Session Index |
| `heaven-mcp` | 26 | HEAVEN Consent Kernel — `h17_*` tools |
| `engr-keith-mcp` | 19 | Technical lead · API architect |
| `dream-mcp` | 18 | DreamChamber orchestration |
| `cb01-mcp` | 22 | DNS + Cloudflare ops |
| `shirley-mcp` | 19 | Gemma 4 code + file manager |
| `family-mcp` | 19 | Family · POPS · SHIRL |
| `consent-oracle` | 9 | `can_i_do()`, `grant_consent()`, `revoke_consent()`, `audit_trail()` |
| `synthesis-oracle` | 9 | Whisper STT, XTTS-v2, RVC, C2PA wrap |
| `voice-bridge` | 9 | Voice commands · Claude towers · webhook routing |
| `shortcuts-mcp` | 58 | macOS Shortcuts — Rogue Amoeba · Logic Pro · any Shortcuts-exposed app |
| `dreamchamber-audio` | 13 | Python FastMCP · multi-AI voice mixing |
| `gemma3` | 13 | Gemma 3 setup assistant (legacy — replaced by Gemma 4 on shirley-mcp) |
| `audio` | 13 (Python) | `dreamchamber-audio-mcp.py` — same Python MCP, alt entry |
| `supersonic` | 9–70 | Unified empire command center (declares 70; regex found 9 — true count ≈ 70) |
| `metabeast-remote` | — | Remote MCP Worker scaffold (`/health`, `/mcp` echo) |
| `god-local-diag` | — | GOD.local diagnostic · phone-accessible via cloudflared tunnel |

**14 registered in `.mcp.json`**, **17 pass `mcp-health.sh`** (dreamchamber-audio, gemma3, metabeast-remote, god-local-diag, supersonic exist on disk but not all in `.mcp.json`).

### Registered in `.mcp.json` → Claude Code discovers at session start

`gabriel-mcp · lucy-mcp · heaven-mcp · voice-bridge · engr-keith-mcp · dream-mcp · cb01-mcp · shirley-mcp · family-mcp · shortcuts-mcp · consent-oracle · synthesis-oracle · audio-mcp · n8n-mcp`

### On-disk but NOT in `.mcp.json` (available to extend)

`dreamchamber-audio (dup of audio-mcp) · gemma3 · god-local-diag · metabeast-remote · supersonic`

---

## 5 · EDGE AGENT FLEET — `cloudflare/workers/` (12 directories)

Per the NOIZYCLOUDS brand charter + `cloudflare-supersonic.md`, each CF Worker is an edge-resident agent:

| Worker | Role |
|---|---|
| `mc96-follower` | Sentinel · watches the fleet |
| `cf01-discord` | Messenger |
| `cf02-notion` | Scribe |
| `cf03-linear` | Dispatcher |
| `cf04-slack` | Relay |
| `cf05-stream` | Streamer (Durable Objects · live audio) |
| `cf06-ai-gateway` | AI Gateway — edge inference |
| `cf07-vectorize-rag` | Vectorize + RAG |
| `cf08-github` | GitHub bridge |
| `cf09-google-workspace` | Workspace bridge |
| `cf10-sso-guard` | SSO guard |
| `gabriel` | GABRIEL edge presence — Custom Domain `gabriel.noizy.ai` |
| `noizy-mcp` | Remote MCP — Custom Domain `mcp.noizy.ai` |
| `_template` | Scaffold — starting point for new Workers |

Per doctrine: each CF worker **fails closed** when HEAVEN is unreachable. Shared secrets via `wrangler secret`, never in source.

---

## 6 · AUTONOMOUS SWARM — `NOIZYARMY/`

A **separate agent layer** beyond the `.claude/agents` family — a parallel autonomous build swarm.

```
Discord slash commands
        │
        ▼
Orchestrator :9333  →  Swarm Engine (6 AI "Bees" · Gemma/Ollama)
        │                      │
        ├──→  CLI (`army` cmds) │
        └──→  Dashboard :9334   │
                                ▼
                     Auto-heal · heartbeat · event bus
```

Files: `army-boot.js` · `orchestrator.js` · `swarm-engine.js` · `discord-bot.js` · `dashboard-server.js` · `cli.js`.

**Not registered in `.mcp.json`** — this is an autonomous build orchestrator, not a Claude-invokable tool. It runs independently, and GABRIEL can dispatch missions to it through the Discord bridge.

---

## 7 · GABRIEL AGENT HOME — `GABRIEL/` (top-level)

The fullest agent persona documented anywhere in the tree.

| File | What it holds |
|---|---|
| `MANIFESTO.md` | **Canonical Movement text** — "Every creative person deserves their own NOIZY.ai" — auto-loaded by `movement-voice.md` rule |
| `CHARACTER.md` | GABRIEL's voice, demeanor, military-calm register |
| `ARCHITECTURE.md` | Runtime architecture of the daemon + bindings |
| `MISSION.md` / `MISSION_CANON.md` | Active mission + canonical long-form mission |
| `HEAVEN.md` | GABRIEL-side view of Heaven's consent kernel |
| `DREAMCHAMBER.md` | GABRIEL ↔ DreamChamber interface |
| `INTEGRATIONS.md` | Voice + LUCY + n8n + Slack + iPad relays |
| `DISCORD_FLEET.md` | Per-brand Discord bots — channel topology |
| `SAFETY_CONTRACT.md` | Operating contract — Never Clauses + escalation rules |
| `MOBILE_CONTINUITY.md` | iPhone / Watch / iPad handoff — "omnipresence" per `omnipresent-family.md` rule |
| `NEVER_CLAUSES_OPS.md` | Operational rendering of the 9 Never Clauses |
| `CREATIVE_ECOSYSTEM.md` | Cross-brand creative routing |
| `VISION.md` | 2056 Founder Credo framing |
| `README.md` | Entry-point for humans walking in |
| `REFERENCE/AGENT_SDK.md` | Captured Claude Agent SDK reference |
| `REFERENCE/AGENT_SDK_CUSTOM_TOOLS.md` | Custom-tool authoring deep-dive |
| `daemon/gabriel-daemon.js` | The body — runs on port 9777 |
| `master-deck/` | THE_DREAMCHAMBER.pptx build source (YAML + Python builder) |
| `logs/` · `launch/` · `dist/` | Runtime + launch + build artifacts |
| `ios/LUCY/` (expected) | Native SwiftUI app (per TestFlight runbook) |

---

## 8 · APP-LAYER AGENT HOME — `apps/GABRIEL/`

Distinct from the top-level `GABRIEL/`. Holds app-facing packages:

- `daemon/` — app-packaged daemon
- `prompts/` — including `GABRIEL_MASTER.md` (runtime identity)
- `scripts/` — dispatch + merge (`gabriel-dispatch.sh`, `gabriel-merge.sh`)
- `ios/` — iOS integration stubs
- `audit/` · `logs/` — per-app audit + logs

**Relationship to top-level `GABRIEL/`:** top-level is the **doctrine home**; `apps/GABRIEL/` is the **code home**. Both auto-loaded by Claude Code sessions.

---

## 9 · DOCTRINE & RULES — `.claude/rules/` (22 active rules)

Rules are agent-governance law — auto-loaded every session, binding on every agent.

Per-agent rules (extracted):
- `family-covenant.md` — per-agent LIFELUV/FLOW commitments (12 agents listed)
- `agent-sdk-reference.md` — Claude Agent SDK canonical pointer
- `agents.md` — 10-agent routing table + MCP server config
- `shared-memcells.md` — ALEX × GABRIEL × LUCY three-way memcell substrate
- `omnipresent-family.md` — 24/7 multi-device presence commitment
- `gabriel-embodiment.md` — GABRIEL IS the M2 Ultra
- `auto-git-toolchain.md` — LUCY git custodianship (commits 30+/day)
- `mcp-builder.md` — MCP server build law (3 shapes, hostname policy)
- `cloudflare-supersonic.md` — per-agent CF ownership
- `dreamchamber-pptx.md` — every idea = one slide; per-agent slide ownership
- `mc96-file-tracking.md` — per-agent tracking duties (LUCY, SHIRLEY, ENGR_KEITH, etc.)
- `consent-kernel.md` — the law every agent enforces
- `wisdom-mission.md` — per-agent operational implications of the Wisdom Manifesto v3
- `global-win-doctrine.md` — the 5-question gate before shipping
- `movement-voice.md` — when any agent speaks publicly
- `heal-the-world.md` — per-agent ownership of the 7 wounds being closed first
- `turbo-scripts.md` — per-agent turbo-script ownership (GABRIEL, ENGR_KEITH, SHIRLEY, DREAM, LUCY, CB01, CONSENT_AUDITOR, POPS, SHIRL)
- `hooks-and-webhooks.md` · `heaven-api.md` · `dreamchamber.md` · `deployment.md` · `voice-pipeline.md` · `coding-standards.md` · `monetization.md` · `contact.md` · `identity.md`

---

## 10 · PROMPTS — `.claude/prompts/` (10 files)

Operational templates. Several are agent-specific:

| File | Target agent |
|---|---|
| `gabriel-boot.md` | GABRIEL (session start) |
| `gabriel-release-commander.md` | GABRIEL (release mode) |
| `gpt-release-auditor.md` | external GPT auditor (doctrinal cross-check) |
| `deploy-heaven.md` | ENGR_KEITH + GABRIEL |
| `new-endpoint.md` | ENGR_KEITH |
| `onboard-actor.md` | CONSENT_AUDITOR + GABRIEL |
| `security-audit.md` | CONSENT_AUDITOR |
| `morning-status.md` | GABRIEL (daily) |
| `godaddy-exit.md` | CB01 |
| `workspace-setup.md` | GABRIEL (new workspace) |

---

## 11 · SKILLS — `.claude/skills/` (21 directories, 11,909 lines)

Skills = invocable expertise — distinct from agent dispatch. Grouped per CLAUDE.md:

- **Operational (5):** `noizy-deploy`, `consent-audit`, `gabriel-ops`, `heaven-dev`, `empire-status`
- **DreamChamber Transcendence (4):** `dreamchamber-multimodal`, `dreamchamber-agent-personalities`, `dreamchamber-sensory`, `dreamchamber-proof`
- **Strategic (5):** `universal-protector-strategy`, `advanced-cryptography`, `adversarial-threat-modeling`, `adoption-and-scaling`, `ten-year-strategic-roadmap`
- **Golden Constitutional (5):** `golden-principles`, `golden-rules-consent`, `golden-rules-governance`, `golden-rules-agents`, `golden-skills-synthesis`
- **Infrastructure & Timeline (2):** `deployment-critical-path`, `godaddy-migration`

---

## 12 · AGENT REFERENCE DENSITY (grep counts — who is named how often)

Rough cross-tree mentions (doc + code, excluding node_modules / .git / _archive):

| Agent | Mentions |
|---|---|
| GABRIEL | thousands (central identity) |
| LUCY | thousands |
| DREAM | hundreds |
| SHIRLEY / SHIRL | hundreds each (distinct — never collapse) |
| ENGR_KEITH | hundreds |
| POPS | hundreds |
| CB01 | hundreds |
| CONSENT_AUDITOR | hundreds |
| VOICE_SPECIALIST | hundreds |
| ALEX_WARD | dozens (newly bound 2026-04-20) |
| TEST_RUNNER | dozens (quality gate, used on dispatch) |

Exact counts are not load-bearing — what matters is that the **naming is consistent**. The only known naming drift risk: "Cheryl" dictation mishearings of SHIRL (per memory `feedback_cheryl_is_shirl.md`).

---

## 13 · GAPS & OPEN ITEMS DISCOVERED DURING THE CENSUS

1. **ALEX_WARD has no operational agent definition** in `.claude/agents/`. Registry exists, but no `alex-ward.md` with system prompt. If Alex is to be dispatched the same way as ENGR_KEITH or DREAM, that prompt is the missing piece.

2. **`audio` and `dreamchamber-audio` are the same MCP** — `audio-mcp` in `.mcp.json` points at `audio/dreamchamber-audio-mcp.py`, and `mcp/dreamchamber-audio/` is a separate dir. One should be retired or made an alias.

3. **`supersonic-mcp` exists but is not registered in `.mcp.json`.** Its package declares 70 tools — the unified empire command center. If it's production-ready, it should be registered; if it's not, it should be marked WIP in its README.

4. **`gemma3-mcp`** is retired in effect (SHIRLEY moved to Gemma 4). Safe to delete once nothing references it. Confirm via `grep -r "gemma3-mcp\|mcp/gemma3"` before removing.

5. **`/Users/m2ultra/Desktop/HEAVEN/`** — referenced in old NOIZYLAB/CLAUDE.md as a deploy target, but empty on disk. That CLAUDE.md pointer should be updated to `~/NOIZYANTHROPIC/repos/noizy-heaven/`.

6. **THE-DREAMCHAMBER 4TBL backup** mirrors the monorepo. Acceptable as a snapshot, but if LUCY ever syncs it back over the canonical tree, history could fork. Flag for `mc96-file-tracker` to watch this path.

7. **NOIZYARMY has no per-agent definitions** inside its swarm — the 6 "Bees" are anonymous. If Alex wants them promoted to Contact-Sequence-inducted family members, each needs a row in `family-covenant.md` + a `.claude/agents/` file.

---

## 14 · ONE-LINE SUMMARY

```
10 OPS agents · 3 HUMAN family · 18 MCP servers (~400 tools) ·
12 edge agents (NOIZYCLOUDS CF01–CF10 + gabriel + noizy-mcp) ·
6 NOIZYARMY Bees · 22 rules · 21 skills · 10 prompts ·
one symlinked truth (NOIZYLAB → NOIZYANTHROPIC) · one 4TBL backup mirror
```

The family is plural. The substrate is singular. The doctrine is one.

_Sealed in the NOIZY Origin Record · 2026-04-22 · census-event_
