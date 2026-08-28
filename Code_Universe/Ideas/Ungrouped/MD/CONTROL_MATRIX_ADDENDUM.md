# Control Matrix · Addendum · Bot Categories

> Extends `CONTROL_MATRIX.md` with the additional bot hosts Rob has designated. Each category has a dedicated directory structure so the empire can grow in a predictable shape.

---

## A · Docker bots (`docker-bots/`)

**Purpose:** Long-running bot processes that need a Python/Node runtime and/or state. Hosted in Docker containers alongside the existing mc96eco stack (`mc96eco-rabbitmq`, `mc96eco-qdrant`, `mc96eco-grafana`, `mc96eco-neo4j`) on GOD.local.

**When to use Docker vs a Cloudflare Worker:**

- Worker (CF0X fleet) → event-driven, stateless per-request, needs to be globally reachable, auth-gated webhook style
- Docker bot → long-running poll/subscribe, needs local filesystem or GPU, holds persistent connections (Discord Gateway, IMAP, LLM inference), needs the full n8n/Ollama/Qdrant stack

**Initial docker-bots (to build):**
| Name | Role | Base image |
|---|---|---|
| `docker-bots/discord-gateway` | Long-lived Discord gateway bot (complement to CF01's webhook interactions) — joins voice channels, listens to audio streams, routes to Whisper | Python 3.12 + `discord.py` |
| `docker-bots/noizyarmy-soldier` | Task queue consumer from the NOIZYARMY project — 24/7 worker with Ollama inference | Python 3.12 + `ollama` client |
| `docker-bots/heaven-watchdog` | Parallel to mc96-follower but deeper — long-poll on D1 mutations, alert on anomalies | Node 20 + `better-sqlite3` |

**Compose pattern** (drop in `docker-bots/docker-compose.yml`):

```yaml
services:
  discord-gateway:
    build: ./discord-gateway
    env_file: ../.env
    restart: unless-stopped
    networks: [mc96eco]
networks:
  mc96eco:
    external: true
```

This reuses the `mc96eco` network so bots can talk to RabbitMQ / Qdrant / Neo4j without exposing ports.

---

## B · Swift bots (`swift-bots/`)

**Purpose:** Native iOS/macOS bots for user-surface interactions. Run on iPad, iPhone, or M2Ultra menu bar.

**When to use Swift vs something else:**

- Swift bot → needs iPad/iPhone native features (Shortcuts integration, Voice UI, Apple Pencil, HealthKit), runs with no network, lives in the user's pocket
- Cloudflare Worker → for anything server-side or multi-device-shared

**Initial swift-bots (to build):**
| Name | Target | Role |
|---|---|---|
| `swift-bots/LucyVoiceBot` | iPad 2nd gen | Swift wrapper around `AVSpeechSynthesizer` with British voice preset → taps into LUCY persona responses (interim, per `feedback_lucy_british_voice`) |
| `swift-bots/MenuBarGabriel` | macOS M2Ultra | Menu-bar app that shows empire status from `mc96-follower/status`, one-click deploy triggers |
| `swift-bots/AppleWatchStatus` | watchOS | Complication showing HEAVEN health + last ledger event |

**Relationship to `mc96/Lucy-Fork/`** (779 MB existing Xcode project): Lucy-Fork is the **full LUCY iPad app**, not just a bot. Swift-bots in this folder are smaller single-purpose utilities. They coexist; Lucy-Fork is the flagship.

---

## C · Postman bots (collection + newman runner)

**Purpose:** API integration tests + scheduled API checks. Postman Collections stored as JSON, runnable locally via Newman (CLI) or on any schedule.

**Structure:** `integrations/postman/` with collections:
| Collection | Purpose |
|---|---|
| `postman/empire-smoke.json` | Hits every CF worker + HEAVEN health, asserts 200 and required JSON shape |
| `postman/consent-kernel-contract.json` | Exercises every Never Clause scenario on HEAVEN |
| `postman/fleet-auth-gauntlet.json` | Confirms every CF0X rejects missing/wrong `X-NOIZY-Key` |

**Runner:** a GitHub Action or cron-driven Docker bot (see category A) invokes `newman run <collection>` and relays results to CF04 Slack.

Postman is a 3rd-party app; the bot here is the **collection + runner**, not a Postman-hosted service.

---

## D · Zapier bots

**Purpose:** Bridge empire events to SaaS tooling Rob uses but doesn't want to integrate natively (iCloud reminders, Todoist, Google Sheets logs, Buffer social posts).

**Pattern:** Zapier is the outbound delivery agent.

- Source = CF04 Slack (or CF02 Notion) emits an event
- Zapier Zap watches that Slack channel / Notion DB
- Zap fans out to SaaS targets

**Initial Zaps (to configure on zapier.com):**
| Trigger | Action(s) |
|---|---|
| New Slack message in `#noizyai-empire-status` with `⚠️` | iCloud reminder · Todoist task · Buffer draft |
| New Notion page under NOIZY.AI master | Google Sheets row · email digest |
| Linear issue priority=Urgent | SMS via Twilio · Apple Calendar event |

**Control surface:** Rob manages at `zapier.com/app/zaps`. I can generate the schema + recommended trigger keys; Rob wires the auth.

---

## E · n8n bots (`n8n-flows/`)

**Purpose:** Visual orchestration on the local `:5678` n8n instance (part of the Docker stack). For flows too complex for a single Zap, too event-heavy for a CF Worker.

**Already shipped this sprint:**

- `n8n-flows/mc96-grep-swarm.json` — 6-brand parallel grep fan-out, aggregates by owner (GABRIEL/LUCY), logs to HEAVEN ledger

**Initial n8n bots (to build):**
| Flow | Trigger | Purpose |
|---|---|---|
| `n8n-flows/heaven-to-cf04.json` | webhook from HEAVEN ledger on Never Clause violation | Fan to CF04 with `priority=critical` |
| `n8n-flows/gabriel-heartbeat.json` | cron :30min | Pings GABRIEL :9777 health; if stale → restart via launchctl (local exec node) |
| `n8n-flows/voice-dna-pipeline.json` | Webhook from CF01 voice endpoint | If the voice is a Voice DNA enrollment, route to synthesis-oracle |

n8n has a REST API at `:5678/rest/` — flows are themselves API-controllable.

---

## Where each bot lives

```
NOIZYANTHROPIC/
├── cloudflare/workers/          # CF0X fleet (API bots, serverless, global)
│   ├── mc96-follower/
│   ├── cf01-discord/
│   ├── cf02-notion/
│   ├── cf03-linear/
│   └── cf04-slack/
├── docker-bots/                 # Long-running (Discord Gateway, NOIZYARMY, watchdog)
│   ├── discord-gateway/
│   ├── noizyarmy-soldier/
│   └── heaven-watchdog/
├── swift-bots/                  # Native iOS/macOS
│   ├── LucyVoiceBot/            # interim British-voice wrapper
│   ├── MenuBarGabriel/          # macOS menu bar status
│   └── AppleWatchStatus/
├── mc96/Lucy-Fork/              # The full LUCY iPad app (779 MB, not a bot — flagship)
├── integrations/
│   ├── postman/                 # API test collections + Newman runner
│   └── zapier/                  # Zap schemas (Rob wires auth)
└── n8n-flows/                   # Visual orchestration (local :5678)
    ├── mc96-grep-swarm.json     # ✅ shipped
    ├── heaven-to-cf04.json      # TODO
    ├── gabriel-heartbeat.json   # TODO
    └── voice-dna-pipeline.json  # TODO
```

---

## F · Google / Gemini stack (Scooby Snacks)

**Purpose:** Google's AI + dev + Workspace surface, wired into the empire as a co-equal to Claude/Anthropic. Multi-provider by design.

### Already wired

- `GOOGLE_API_KEY` in `.env` → `generativelanguage.googleapis.com` (Gemini 1.5/2.0/2.5)
- MCP servers (RSPNOIZY authenticated via claude.ai):
  - `mcp__claude_ai_Google_Drive__*` (search, fetch — read-only)
  - `mcp__claude_ai_Google_Calendar__*` (create/list/delete events, suggest_time)
  - `mcp__claude_ai_Gmail__*` (create_draft, label, search_threads)
- LiteLLM proxy `:4000` routes provider=google through same interface as Claude/GPT
- DreamChamber multi-model UI includes `gemini-2.5-pro` + `gemini-2.0-flash` + Gemma 3 (local via Ollama)

### To wire

| Surface                | Action                                                                                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Gemini Code Assist** | Install extension in VS Code, VS Code Insiders, Cursor — sign in with Google, free tier is generous                                                  |
| **Google AI Studio**   | `aistudio.google.com` — prompt workbench; one-click export to `curl`/`python` snippet. Good for quick prompt prototyping before codifying in LiteLLM |
| **Vertex AI**          | Production Gemini with project-level quota, VPC, staging/prod split. Needed for enterprise traffic; not for solo-dev right now                       |
| **NotebookLM**         | Ingest `MC96ECO_EMPIRE_MAP.md` + `CONTROL_PLANE_INVENTORY.md` + master docs; turns the empire into a sourced Q&A corpus                              |
| **Imagen 3 / Veo 3**   | Image + video generation — bind as alternative to Workers AI; great for NOIZY.AI marketing assets                                                    |
| **Gemini CLI**         | `gcloud alpha gemini` — terminal-native calls; pair with `jq` for ops scripts                                                                        |

### Dispatch chain (Gemini request from CF or MCP)

```
Discord slash / Siri / CF0X webhook
  → LiteLLM :4000 (provider=google, model=gemini-2.5-pro)
  → Gemini response
  → fan to target (CF02 Notion log / CF03 Linear issue / CF04 Slack post)
  → HEAVEN ledger write
```

**Why LiteLLM in the middle:** provider swaps become transparent. If you pivot from Gemini to Claude for one path, it's a one-line config change, not a code rewrite.

### Precedence (Gemini vs Claude vs Gemma)

- **Gemini 2.5 Pro** → long-context (1M+ tokens), multimodal (image+text in), cheap high-volume
- **Claude Opus 4.7** → deep reasoning, agentic coding, anything requiring nuanced judgment
- **Gemma 3 27B (local via Ollama)** → private/offline, no egress, short-context tasks
- **DreamChamber** → gives all three side-by-side for creative A/B

---

## Precedence rule (when categories overlap)

Event-driven, stateless, globally reachable → **CF Worker** (CF0X).
Needs the local stack (Ollama/Qdrant/Neo4j/GPU) or long-running socket → **Docker bot**.
Native iOS/macOS surface → **Swift bot**.
Multi-API orchestration visible to Rob in a UI → **n8n flow**.
SaaS-to-SaaS outbound delivery → **Zapier**.
Contract-level integration tests → **Postman collection + Newman runner**.

When in doubt, start in CF (smallest blast radius, cheapest) and promote to Docker only when the Worker constraints (CPU time, no long-lived WS) become binding.

---

_One empire, many shapes. Every bot writes through HEAVEN. Every HEAVEN write lands in the ledger._
