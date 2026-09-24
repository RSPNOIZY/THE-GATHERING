# MC96ECO Services Registry

> GABRIEL Self-Healing Loop Knowledge Base
> Machine: M2 Ultra Mac Studio (GOD.local / GABRIEL.local)
> IP: 10.90.90.10 (internal) / 10.0.0.70 (wifi)
> Operator: Robert Stephen Plowman (RSP_001)
> Last updated: 2026-04-03

---

## 1. GABRIEL (:7777)

**Role:** AI orchestrator, core intelligence layer, DreamChamber engine
**Process:** Node.js (pm2: `gabriel`)
**Entry:** `~/NOIZYLAB/gabriel-server.js`
**Health endpoint:** `http://localhost:7777/health`

GABRIEL is the central nervous system of the MC96ECO universe. It manages 10 towers (subsystems), each responsible for a distinct operational domain:

| Tower | Function |
|-------|----------|
| Tower 1 — VOICE | Voice identity, cloning consent, XTTS v2 pipeline |
| Tower 2 — MEMORY | Memcell storage, agent-memory D1, recall chains |
| Tower 3 — CONSENT | NCP enforcement, opt-in/opt-out, revocation |
| Tower 4 — MUSIC | Audio generation, stem separation, mastering |
| Tower 5 — VISION | Image analysis, llava integration, screenshot OCR |
| Tower 6 — CODEX | Universal query routing, empire state snapshots |
| Tower 7 — GUARDIAN | Security, rate limiting, abuse detection |
| Tower 8 — STREAM | Audio fabric coordination, Dante bridge |
| Tower 9 — HEAL | Self-diagnostics, service restart, error triage |
| Tower 10 — DREAM | DreamChamber career engine, artist blueprint generation |

**Key state:**
- `learningCount`: 341+ (increments on each new learning event)
- `memcells`: 333 total stored knowledge fragments
- Heaven17 connection: ACTIVE (syncs with Cloudflare Workers)
- launchd plist: `~/Library/LaunchAgents/com.noizy.gabriel.plist`

**Dependencies:** Ollama (:11434), Voice Bridge (:8080), D1 agent-memory, KV GABRIEL_KV

---

## 2. Voice Bridge (:8080)

**Role:** iPhone-to-GOD voice relay, Power Automate webhook receiver
**Process:** Node.js (pm2: `voice-bridge`)
**Entry:** `~/NOIZYLAB/voice-bridge-server.js`
**Health endpoint:** `http://localhost:8080/health`

Receives voice commands from iPhone (via Shortcuts app) and Power Automate flows, transcribes them, and routes to GABRIEL for execution.

**5 Webhook Routes:**

| Route | Method | Purpose |
|-------|--------|---------|
| `/webhook/voice` | POST | Raw audio upload from iPhone, returns transcription + GABRIEL response |
| `/webhook/command` | POST | Text command relay from Power Automate |
| `/webhook/status` | GET | Current bridge status, queue depth, last command timestamp |
| `/webhook/learn` | POST | Feed new knowledge into GABRIEL memcells |
| `/webhook/emergency` | POST | Priority queue bypass, triggers Tower 9 HEAL immediately |

**Auth:** Bearer token via `VOICE_BRIDGE_TOKEN` env var. All routes require auth except `/webhook/status`.

**Dependencies:** GABRIEL (:7777), Ollama (:11434 for transcription fallback)

---

## 3. NOIZYVOX (:8421)

**Role:** Voice platform — voice cloning, consent-gated synthesis, artist voice marketplace
**Process:** Python FastAPI + uvicorn (pm2: `noizyvox`)
**Entry:** `~/NOIZYLAB/noizyvox/main.py`
**Health endpoint:** `http://localhost:8421/health`

NOIZYVOX is the consent-native voice synthesis platform. Every voice operation checks NCP consent status before processing.

**Core capabilities:**
- Voice cloning via XTTS v2 (license-cleared)
- Voice genome fingerprinting and storage (KV GABRIEL_VOICE)
- Consent token validation per NCP spec
- Artist voice marketplace API (list, license, revoke)
- RVC voice conversion pipeline
- Chatterbox integration for conversational synthesis

**Key endpoints:**
- `POST /synthesize` — Generate speech from text using a licensed voice
- `POST /clone` — Create voice clone (requires explicit consent token)
- `GET /voices` — List available voices with consent status
- `POST /revoke` — Revoke voice consent (immediate, irreversible for platform)
- `GET /genome/{voice_id}` — Retrieve voice genome metadata

**Dependencies:** GABRIEL (:7777 for consent checks), Ollama (:11434), KV GABRIEL_VOICE

---

## 4. NOIZYSTREAM (:4040)

**Role:** Audio fabric — real-time audio routing, Dante integration, WebRTC sessions
**Process:** Node.js (pm2: `noizystream`)
**Entry:** `~/NOIZYLAB/noizystream/server.js`
**Health endpoint:** `http://localhost:4040/health`

NOIZYSTREAM manages all real-time audio flows across the MC96ECO network. It bridges Dante audio networking with WebRTC for browser-based monitoring.

**Core concepts:**
- **Sessions:** Named audio routing configurations (e.g., "studio-a-master", "live-monitor")
- **Roles:** Producer, Engineer, Artist, Listener — each role has different stream access permissions
- **Proof:** Every audio session generates a cryptographic proof chain for provenance tracking

**Key endpoints:**
- `POST /session/create` — Create new audio routing session
- `POST /session/join` — Join session with role assignment
- `GET /session/{id}/proof` — Get provenance proof chain for session
- `GET /dante/devices` — List detected Dante devices on network
- `POST /dante/route` — Create Dante audio route
- `GET /streams` — List active WebRTC streams

**Dependencies:** Dante Controller (network), GABRIEL (:7777), AirPlay (:3001)

---

## 5. AirPlay (:3001)

**Role:** Device detection, AirPlay receiver management, GABRIEL integration
**Process:** Node.js (pm2: `airplay`)
**Entry:** `~/NOIZYLAB/airplay-server.js`
**Health endpoint:** `http://localhost:3001/health`

Detects AirPlay-compatible devices on the local network and integrates them into the GABRIEL audio fabric. Allows voice commands to route audio to specific speakers/displays.

**Key endpoints:**
- `GET /devices` — List all detected AirPlay devices with status
- `POST /play` — Route audio to specific AirPlay device
- `POST /stop` — Stop playback on device
- `GET /status/{device_id}` — Get current playback status

**Dependencies:** Bonjour/mDNS (network), GABRIEL (:7777), NOIZYSTREAM (:4040)

---

## 6. Health Monitor (:9090)

**Role:** 9-service health dashboard, alerting, auto-restart triggers
**Process:** Node.js (pm2: `health-monitor`)
**Entry:** `~/NOIZYLAB/health-monitor.js`
**Health endpoint:** `http://localhost:9090/` (the dashboard itself)

Polls all MC96ECO services every 15 seconds and renders a real-time dashboard. Triggers alerts when services go down and can invoke Tower 9 HEAL for auto-recovery.

**Monitored services:**

| Service | Port | Check Type |
|---------|------|------------|
| GABRIEL | 7777 | HTTP /health |
| Voice Bridge | 8080 | HTTP /health |
| NOIZYVOX | 8421 | HTTP /health |
| NOIZYSTREAM | 4040 | HTTP /health |
| AirPlay | 3001 | HTTP /health |
| Command Center | 8888 | HTTP 200 |
| n8n | 5678 | HTTP /healthz |
| Ollama | 11434 | HTTP /api/tags |
| THE CODEX | 5500 | HTTP /health |

**Alert behavior:**
- 1 failed check: WARNING (yellow on dashboard)
- 3 consecutive failures: CRITICAL (red on dashboard, triggers Tower 9)
- 5 consecutive failures: EMERGENCY (sends webhook to Voice Bridge `/webhook/emergency`)

**Refresh interval:** 15 seconds (configurable via `HEALTH_INTERVAL_MS` env var)

---

## 7. Command Center (:8888)

**Role:** Static HTML dashboard for visual operations overview
**Process:** Node.js static server (pm2: `command-center`)
**Entry:** `~/.gemini/antigravity/scratch/noizy-command-center/`
**Health endpoint:** `http://localhost:8888/` (serves HTML)

A visual command dashboard that aggregates status from all services into a single-page HTML view. Designed for voice-first operation — large buttons, high contrast, minimal interaction needed.

**Features:**
- Service status grid (pulls from Health Monitor)
- Quick-action buttons for common operations
- GABRIEL memcell count and learning status
- Recent command history
- Cloudflare Workers deployment status

---

## 8. n8n (:5678)

**Role:** Workflow automation engine, visual flow builder
**Process:** Docker container or npm (pm2: `n8n`)
**Entry:** Docker or `~/NOIZYLAB/n8n/`
**Health endpoint:** `http://localhost:5678/healthz`

n8n provides visual workflow automation for the MC96ECO universe. 7 workflows are configured and ready:

| Workflow | Trigger | Action |
|----------|---------|--------|
| Voice Command Router | Webhook | Routes voice commands to appropriate tower |
| Daily Health Report | Cron (06:00) | Aggregates 24h health data, stores in memcell |
| Consent Audit | Cron (00:00) | Scans all consent tokens for expiry |
| Deploy Notifier | Webhook | Posts to dashboard when Cloudflare deploy completes |
| Error Escalator | Webhook | Receives errors from Health Monitor, creates tickets |
| Memcell Backup | Cron (03:00) | Exports memcells to local SQLite backup |
| Artist Onboard | Webhook | Processes new artist signup through consent flow |

**Auth:** Basic auth via `N8N_BASIC_AUTH_USER` and `N8N_BASIC_AUTH_PASSWORD` env vars

---

## 9. Ollama (:11434)

**Role:** Local LLM inference server, 7 models loaded
**Process:** Ollama daemon (managed by Homebrew services)
**Entry:** `brew services` / `ollama serve`
**Health endpoint:** `http://localhost:11434/api/tags`

Ollama provides local inference for GABRIEL and all downstream services. No data leaves GOD.local for inference unless explicitly routed to cloud via claude-proxy worker.

**Loaded models:**

| Model | Size | Primary Use |
|-------|------|-------------|
| llama3.1:70b | 40GB | General reasoning, complex queries |
| qwen2.5-coder | 7B | Code generation, debugging |
| gemma3 | 9B | Fast general tasks, summaries |
| mistral | 7B | Instruction following, structured output |
| llava:34b | 20GB | Vision tasks, image analysis (Tower 5) |
| llama3.2 | 3B | Lightweight tasks, quick classification |
| deepseek-coder | 7B | Code analysis, refactoring |

**Resource notes:**
- M2 Ultra has 192GB unified memory — all models fit comfortably
- GPU acceleration via Metal Performance Shaders
- Typical inference: 30-60 tokens/sec on llama3.1:70b

**Management:**
- Start: `brew services start ollama`
- Stop: `brew services stop ollama`
- Restart: `brew services restart ollama`
- Pull model: `ollama pull <model>`
- List loaded: `ollama list`

---

## 10. THE CODEX (:5500)

**Role:** Universal query router, empire state snapshot engine
**Process:** Node.js (pm2: `the-codex`)
**Entry:** `~/NOIZYLAB/the-codex/server.js`
**Health endpoint:** `http://localhost:5500/health`

THE CODEX is the read-only intelligence layer. It answers questions about the entire MC96ECO empire state without modifying anything. Think of it as the "ask anything" endpoint.

**Key endpoints:**
- `GET /snapshot` — Full empire state: all services, databases, workers, KV namespaces
- `POST /query` — Natural language query routed to appropriate data source
- `GET /services` — Service registry with live status
- `GET /databases` — Database inventory with sizes and table counts
- `GET /workers` — Cloudflare Workers inventory with deployment status
- `GET /kv` — KV namespace inventory with key counts

**Query routing logic:**
1. Parse natural language query
2. Identify target domain (service, database, worker, KV, general)
3. Route to appropriate data source
4. Format and return response

**Dependencies:** All services (read-only polling), GABRIEL (:7777), Ollama (:11434)

---

## Port Map Summary

| Port | Service | Protocol |
|------|---------|----------|
| 3001 | AirPlay | HTTP |
| 4040 | NOIZYSTREAM | HTTP + WebRTC |
| 5500 | THE CODEX | HTTP |
| 5678 | n8n | HTTP |
| 7777 | GABRIEL | HTTP |
| 8080 | Voice Bridge | HTTP |
| 8421 | NOIZYVOX | HTTP (FastAPI) |
| 8888 | Command Center | HTTP (static) |
| 9090 | Health Monitor | HTTP |
| 11434 | Ollama | HTTP |
