# ⚔️ NOIZYARMY — Autonomous Build Swarm

> **Building at 100%. Always. Forever.**

The NOIZYARMY is the autonomous build, deploy, and coordination system for the NOIZY Empire. It connects Discord, local AI models (Gemma/Ollama), and the entire NOIZY infrastructure into a single, unstoppable build machine.

## Architecture

```
                    ┌─────────────────────┐
                    │  DISCORD BOT        │ ← Human interface
                    │  Slash commands     │   /status /deploy /swarm
                    └────────┬────────────┘
                             │
                    ┌────────▼────────────┐
                    │  ORCHESTRATOR       │ ← Brain (port 9333)
                    │  Health monitoring  │   Events, WebSocket, SSE
                    │  Auto-healing       │   REST API
                    │  Event bus          │
                    └──┬──────┬────────┬──┘
                       │      │        │
          ┌────────────▼┐  ┌──▼─────┐  ┌▼────────────┐
          │ SWARM ENGINE │  │ CLI    │  │ DASHBOARD   │
          │ 6 AI Bees    │  │ army   │  │ Real-time   │
          │ Ollama/Gemma │  │ cmds   │  │ port 9334   │
          └──────────────┘  └────────┘  └─────────────┘
```

## Quick Start

```bash
# 1. Install dependencies
cd NOIZYARMY && npm install

# 2. Boot everything (orchestrator + dashboard + discord)
node army-boot.js

# 3. Or use the CLI
node cli.js status       # Empire health
node cli.js heal         # Auto-fix services
node cli.js swarm "Fix all broken imports"
node cli.js deploy heaven
```

## Components

### 🤖 Discord Bot (`discord-bot.js`)

14 slash commands for real-time empire control:

- `/status` — Full health check
- `/deploy` — Deploy any service
- `/swarm` — Dispatch AI agent swarm
- `/heal` — Auto-fix broken services
- `/smoke` — Run smoke tests
- `/agents` — Agent roster
- `/gemma` — Query local Gemma AI
- `/never` — Never Clause check
- `/army` — Full NOIZYARMY status

### 🐝 Swarm Engine (`swarm-engine.js`)

Multi-agent AI using local Ollama models:

- **ARCHITECT** — Architecture & patterns
- **DEBUGGER** — Bug hunting
- **TESTER** — Test generation
- **DOCUMENTER** — Documentation
- **SECURITY** — Security audit
- **OPTIMIZER** — Performance

```bash
node swarm-engine.js --task="Audit Heaven API for security issues"
node swarm-engine.js --analyze=src/index.js
node swarm-engine.js --mode=continuous
```

### 🧠 Orchestrator (`orchestrator.js`)

REST API + WebSocket + SSE event system:

- `GET /health` — Orchestrator health
- `GET /services` — All service health
- `POST /swarm` — Dispatch swarm
- `POST /heal` — Auto-heal
- `POST /deploy/:service` — Deploy
- `GET /events` — SSE stream
- `GET /agents` — Agent roster

### 🌐 Dashboard (`dashboard-server.js`)

Real-time web UI accessible from any device:

- http://localhost:9334/dashboard
- http://10.90.90.10:9334/dashboard (iPad)

### ⚔️ CLI (`cli.js`)

One-command everything:

```bash
node cli.js boot         # Start everything
node cli.js status       # Health check
node cli.js heal         # Fix services
node cli.js swarm "task" # AI swarm
node cli.js deploy       # Deploy
node cli.js smoke        # Tests
node cli.js agents       # Roster
node cli.js gemma "q"    # Local AI
```

## Discord Setup

1. Go to https://discord.com/developers/applications
2. Create "NOIZYARMY" application
3. Bot → Add Bot → Copy token
4. OAuth2 → URL Generator: `bot` + `applications.commands`
5. Permissions: Send Messages, Embed Links, Use Slash Commands
6. Add bot to your server
7. Create `.env`:

```
DISCORD_BOT_TOKEN=your-token
DISCORD_GUILD_ID=your-server-id
```

## Sacred Invariants

These are enforced at every level:

- **75/25 creator split** — always
- **Consent required** — always
- **Revocation sacred** — always
- **Compensation automatic** — always
- **9 Never Clauses** — immovable law

## Requirements

- Node.js 20+
- Ollama with gemma3 model (`ollama pull gemma3`)
- Discord bot token (optional, for Discord features)

---

_"We are the new punk rockers: capitalist free thinkers who believe in peace, love, and understanding."_

**RSP_001 — Robert Stephen Plowman — NOIZY Empire — 2026**
