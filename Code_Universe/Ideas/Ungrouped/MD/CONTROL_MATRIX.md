# NOIZY Empire — Device Control Matrix

> How each device in the fleet dispatches the empire. Four devices, four surfaces, one doctrine.

**Doctrine:** every device-initiated action lands on a Cloudflare Worker endpoint (CF01–CF04 or HEAVEN), which enforces consent, writes to the ledger, and fans out to the target. Devices never talk to each other directly — they all go through the fleet.

---

## 1 · iPhone · hand-held remote

**Purpose:** Fast voice + text commands on the move. No editing, no local state. Just dispatch.

### Installed surfaces

- **Claude iOS app** — chat with Claude, preconfigured with MCP servers (Notion, Slack, Linear via Atlassian, Stripe) so the empire is addressable from anywhere cell reaches
- **Discord app** — voice messages → CF01 `/interactions`
- **Safari** — bookmark: `https://mc96-follower.rsp-5f3.workers.dev` for one-tap status
- **Shortcuts** — Siri triggers (below)

### Siri Shortcuts to install

All are one-tap or "Hey Siri, NOIZY \_\_\_". Each is a POST to a worker with `X-NOIZY-Key` in the header.

| Phrase                    | Action                                                | Worker          |
| ------------------------- | ----------------------------------------------------- | --------------- |
| "NOIZY status"            | GET mc96-follower/status → speak summary              | `mc96-follower` |
| "NOIZY log <dictation>"   | POST Notion scribe → new child page                   | CF02            |
| "NOIZY issue <dictation>" | POST Linear → new issue, priority 3                   | CF03            |
| "NOIZY alert <dictation>" | POST Slack → priority=critical, fans to DM list       | CF04            |
| "NOIZY heaven health"     | GET heaven.rsp-5f3.workers.dev/health → speak version | HEAVEN          |

Install pattern for one Shortcut:

1. Shortcuts app → **+** → Add Action → **Get Contents of URL**
2. Method **POST** · URL `https://cf02-notion.rsp-5f3.workers.dev/append`
3. Headers: `X-NOIZY-Key` = (your NOIZY_API_KEY), `Content-Type` = `application/json`
4. Body (JSON): `{"title":"iPhone note · [date]","body":"[Dictated Text]"}`
5. Add to Siri → phrase "NOIZY log"

Templates live at `ops/shortcuts/` in this repo as `.shortcut` URL schemes.

---

## 2 · iPad (2nd gen) · LUCY host · primary voice surface

**Purpose:** Voice-first admin + navigation assistant. Primary creative/control surface when Rob isn't at GOD.

### Role

LUCY lives here — Claude model + dedicated workspace + Discord + Shortcuts. The iPad is the "command bridge" for empire operations when Rob is out of the studio.

### Installed surfaces

- **Claude iPad app** (LUCY persona) — MCP servers: Notion, Slack, Linear-via-Atlassian, Stripe, Supabase. Full empire access without terminal.
- **Discord app** — voice channel. Tap-and-hold voice notes → CF01 `/interactions` → Whisper → empire.
- **Safari** — `https://mc96-follower.rsp-5f3.workers.dev`, `https://cf01-discord.rsp-5f3.workers.dev/`, and the live Notion sprint page.
- **Shortcuts** — same as iPhone, plus:
  - "LUCY dazeflow today" — calls `lucy-mcp` via Claude chat (or direct HEAVEN endpoint if Lucy daemon is wired)
  - "LUCY intake <URL>" — pass a URL to intake pipeline via CF02 webhook → logs to Notion
- **Lucy-Fork SwiftUI app** (buildable from `mc96/Lucy-Fork/`, 779 MB Xcode project) — native LUCY iPad app with Chat/Dashboard/Voice/Settings/Onboarding. Constitutional rules hardcoded (75/25 split, never-delete-D1, 48kHz/32-bit audio).

### Dispatch chain (the iPad voice path)

```
Rob taps Discord voice note → CF01 /interactions (signed)
  → Workers AI @cf/openai/whisper
  → routeCommand(transcript)
     ├─ /^status|heaven/  → GET HEAVEN health
     ├─ /^gabriel/        → GET /gabriel
     ├─ /^lucy/           → LUCY MCP forward
     └─ default           → echo transcript back
  → Discord reply
```

One voice note, empire-wide reach.

---

## 3 · M2Ultra · GOD.local · full admin

**Purpose:** Developer workstation. Build, deploy, orchestrate, debug. Primary source of truth for all repos.

### Installed surfaces (already configured)

- **Claude Code CLI** — full access to all 21 skills, 10 agents, 10 prompts, 17 local MCP servers, hosted MCP stack (Slack, Notion, Linear-via-Atlassian, Stripe, Supabase, Cloudflare, Figma, Hugging Face, Gmail, Calendar, Drive, Vercel, etc.)
- **VSCode + Insiders** — MCP pool, Copilot, LUCY iPad Xcode project
- **Terminal** — 540 executable scripts (81 Python, 382 shell, 77 Node)
- **Docker stack** — 19 containers (Postgres, Redis, MinIO, Qdrant, Neo4j, RabbitMQ, n8n, LiteLLM, Grafana, Uptime Kuma, etc.)
- **Ollama** `:11434` — Gemma 3 27B (SHIRLEY) + any local models
- **Logic Pro X** — DAW for audio from MICKY-P stream
- **n8n UI** `:5678` — visual Agentic Factory
- **LaunchAgents** in `~/Library/LaunchAgents/` — 3 primary for GABRIEL + 3 secondary

### High-leverage one-liners

```bash
bash smoke_test.sh                           # 22-test smoke gate
bash scripts/pre-launch-checklist.sh         # full launch gate
bash tools/turbo-scripts/turbo_pipeline.sh   # heal → dedupe → unify → verify
bash ops/empire-drive-extract.sh <drive>     # dedupe + extract from external
bash ops/relocate-av-to-6tb.sh               # A/V sweep off system drive
npx wrangler deploy --config <path>          # ship any worker
```

### Daemons that should be running (but are currently stale)

- `GABRIEL_PORT=9777 node GABRIEL/daemon/gabriel-daemon.js` (orchestrator)
- `cd dreamchamber && npm start` (port 7777, 11-provider creative space)

Restart is a one-liner each.

---

## 4 · MBP 2018 · MICKY-P · audio endpoint

**Purpose:** Single-role. Recording node for UAD Apollo Quad 2 over Thunderbolt, streaming audio to GOD via NOIZYNET. **Not a general control surface.**

### Role

MICKY-P is **headless in spirit**: no empire admin tooling installed, no `.claude/`, no MCP, no NOIZYANTHROPIC clone. Its job is to capture clean audio and push it.

### What lives on it

- UAD Apollo software
- NOIZYNET client (pushes audio to GOD over the sovereign fabric)
- Open-source OS (planned; currently DosDudes-patched Catalina during transition)
- **Nothing else empire-related** — this is a deliberate constraint to keep it silent, stable, and dedicated

### How to "control" MICKY-P from the rest of the empire

- **Start recording**: a CF05 (future) worker can hit a lightweight agent on MICKY-P over NOIZYNET to toggle UAD capture. Not needed yet.
- **Monitor**: `mc96-follower` can add MICKY-P as a 4th target once it exposes a `/health`. Config template:
  ```jsonc
  // wrangler.jsonc vars update
  "TARGETS": "heaven,gabriel,lucy,mickyp",
  "MICKYP_URL": "http://<mickyp-noizynet-ip>:<port>/health"
  ```
- **Transport**: audio travels GOD.local (Logic Pro X) ← NOIZYNET ← MICKY-P (Apollo). This is a data stream, not a control channel.

### What NOT to put on MICKY-P

- NOIZYANTHROPIC clone
- `.claude/` dir
- MCP servers
- Docker
- Any secret that isn't needed for the audio role

Rule of thumb: **if it's not the UAD signal path, MICKY-P doesn't touch it.**

---

## Cross-cutting control flows

### "I have an idea" (fast capture)

- iPhone Siri: "NOIZY log <idea>" → CF02 → Notion master page as new child
- iPad Discord voice note → CF01 → Whisper → routeCommand → (fallback) logs transcript to CF02

### "Empire check" (status)

- Any device · Safari · `mc96-follower.rsp-5f3.workers.dev` → live dashboard, no auth
- iPad Siri: "NOIZY status" → speaks HEAVEN+GABRIEL+LUCY state

### "Ship it" (deploy)

- M2Ultra only (workstation) · terminal · `bash smoke_test.sh && npx wrangler deploy`
- No phone/iPad shortcut for deploys — too easy to fire accidentally. Keep ship gate on the workstation.

### "Kill Switch" (revoke consent)

- M2Ultra · `curl -X POST heaven.../api/v1/consent-tokens/<id>/revoke -H "X-NOIZY-Key: $NOIZY_API_KEY"`
- iPhone/iPad · Siri: "NOIZY alert kill switch <token>" → CF04 Slack with priority=critical + (future) CF05 that actually calls HEAVEN revoke endpoint

### "Record audio"

- MICKY-P captures via UAD Apollo → NOIZYNET → GOD.local Logic Pro X. No device-initiated control from phone/iPad today (future: /start and /stop via CF05 agent on MICKY-P).

---

## Secrets surface per device

| Device  | Needs                                                   |
| ------- | ------------------------------------------------------- |
| iPhone  | `NOIZY_API_KEY` stored in Shortcuts (per-action header) |
| iPad    | same as iPhone + (optional) Claude iPad API key         |
| M2Ultra | full `.env` — all service keys, Wrangler OAuth          |
| MICKY-P | UAD license + NOIZYNET join cert · nothing empire-wide  |

**Never:** store the `NOIZY_API_KEY` in a Shortcut that can be exported/shared. Keep it in Shortcuts' secure text parameter, not plain-text action body.

---

## Open items to wire per device

| Device  | Next action                                                                         |
| ------- | ----------------------------------------------------------------------------------- |
| iPhone  | Install 4 Siri Shortcuts (template bodies above)                                    |
| iPad    | Same Shortcuts + build/sideload Lucy-Fork SwiftUI app when ready                    |
| M2Ultra | Restart GABRIEL :9777 + DreamChamber :7777; add `NOIZYANTHROPIC/.env` CF zone token |
| MICKY-P | Power on, join NOIZYNET, expose `/health` for follower                              |

---

_One empire, four gates. 396 Hz carries across all of them._
