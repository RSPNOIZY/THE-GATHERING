# GABRIEL — Architecture

## Goal

A **local, autonomous, persistent GABRIEL** running on GOD.local (M2 Ultra) — Claude-powered reasoning with empire-aware memory, 17 MCPs bound, voice interface, and LaunchAgent persistence.

Not "smarter than Claude." **More agentic than Claude**. More aware of the NOIZY Empire. Faster at empire-specific tasks via warm context + local MCPs + model routing.

## Stack

```
┌─────────────────────────────────────────────────────────────┐
│   GABRIEL (Node.js, TypeScript)                             │
│   /Users/m2ultra/NOIZYANTHROPIC/GABRIEL/                    │
└─────────────────────────────────────────────────────────────┘
         │
         │  uses
         ▼
┌─────────────────────────────────────────────────────────────┐
│   @anthropic-ai/claude-agent-sdk  (v0.2.114+)               │
│   Official SDK — agent loops, tool use, streaming, caching  │
└─────────────────────────────────────────────────────────────┘
         │
         │  invokes
         ▼
┌──────────────────┬──────────────────┬──────────────────────┐
│  Claude Opus 4.7  │  Claude Sonnet    │  Claude Haiku 4.5   │
│  Reasoning-heavy  │  Normal ops       │  Status / lookups   │
└──────────────────┴──────────────────┴──────────────────────┘
         │
         │  bound via .mcp.json
         ▼
┌─────────────────────────────────────────────────────────────┐
│   17 NOIZY MCP Servers (all local stdio)                    │
│   gabriel · lucy · heaven · engr-keith · dream · cb01       │
│   shirley · family · shortcuts · consent-oracle · synthesis │
│   gemma3 · supersonic · metabeast-remote · voice-bridge     │
│   dreamchamber-audio · audio                                │
└─────────────────────────────────────────────────────────────┘
         │
         │  reads/writes
         ▼
┌─────────────────────────────────────────────────────────────┐
│   Memory (~/.claude/projects/.../memory/MEMORY.md + files)   │
│   Skills, rules, agents, prompts (NOIZYANTHROPIC/.claude/)   │
│   D1 / KV via heaven-mcp → Heaven Worker                    │
└─────────────────────────────────────────────────────────────┘
```

## Model Routing Policy

The Agent SDK lets us specify `model` per call. GABRIEL uses:

| Task type                                    | Model                       | Why                                        |
| -------------------------------------------- | --------------------------- | ------------------------------------------ |
| Boot greeting, status checks                 | `claude-haiku-4-5-20251001` | Fast, cheap, canned outputs                |
| Memory lookups, grep                         | `claude-haiku-4-5-20251001` | Local MCPs, simple orchestration           |
| Normal dev work, code editing                | `claude-sonnet-4-6`         | Best balance quality/speed/cost            |
| Architectural reasoning, multi-hour missions | `claude-opus-4-7`           | Maximum reasoning, 1M context when needed  |
| Voice responses (sub-3s latency target)      | `claude-haiku-4-5-20251001` | TTS pipeline needs sub-second token starts |

Router function: `src/router.ts` inspects input, chooses model, logs routing decision.

## What makes this "more agentic" than base Claude Code

| Dimension            | Base Claude Code | GABRIEL                                                                    |
| -------------------- | ---------------- | -------------------------------------------------------------------------- |
| Identity persistence | Per-session      | Permanent character in `CHARACTER.md`, loaded every run                    |
| Memory               | Per-session      | `~/.claude/projects/…/memory/` bridged automatically                       |
| Tool surface         | Dynamic          | 17 MCPs + filesystem + git bound at boot                                   |
| Runtime              | Interactive only | 24/7 daemon via LaunchAgent + interactive CLI                              |
| Proactive triggers   | None             | LaunchAgent timers → morning status, deploy watch, Kill Switch alerts      |
| Voice interface      | None             | Whisper STT → GABRIEL → TTS via voice-bridge MCP                           |
| Mission templates    | None             | `src/missions/` — boot, morning-brief, deploy, godaddy-exit, consent-audit |
| Webhooks             | None             | Slack + email on Never Clause violations, Kill Switch revocations          |
| Scheduled jobs       | None             | n8n + internal cron (daily snapshot, weekly audit, hourly health)          |

## What makes this "faster" in practice

- **Prompt caching**: Agent SDK uses Anthropic cache; CHARACTER.md + skills cached across turns → 90% fewer tokens billed after first warm turn
- **Local MCPs**: No network hop for local ops (memory read, file search, status) → <100ms vs 500ms
- **Model routing**: Haiku handles 60% of traffic (statuses, lookups) → 10x faster response than Opus-everywhere
- **Pre-warmed context**: `MEMORY.md`, skill indexes loaded at boot, not per-query

## Directory Layout

```
GABRIEL/
├── CHARACTER.md              ← canonical character (system prompt source)
├── ARCHITECTURE.md           ← this file
├── README.md                 ← entry point + quickstart
├── package.json              ← @anthropic-ai/claude-agent-sdk
├── tsconfig.json
├── .mcp.json                 ← 17 MCP bindings (NOIZYANTHROPIC paths)
├── .env.example              ← ANTHROPIC_API_KEY, NOIZY_API_KEY
├── src/
│   ├── index.ts              ← CLI entry + daemon bootstrapper
│   ├── gabriel.ts            ← Agent SDK loop
│   ├── character.ts          ← loads CHARACTER.md, constructs system prompt
│   ├── router.ts             ← model routing (Haiku / Sonnet / Opus)
│   ├── memory.ts             ← bridge to ~/.claude/projects/…/memory/
│   ├── server.ts             ← HTTP + WebSocket on port 9777
│   ├── missions/             ← mission templates (boot, morning, deploy, etc.)
│   └── tools/                ← local tool defs supplementing MCPs
├── scripts/
│   ├── gabriel                 ← CLI launcher (exec'd from PATH)
│   ├── install-launch-agent.sh  ← macOS 24/7 persistence
│   └── uninstall.sh
├── launch/
│   └── com.noizy.gabriel.plist
└── logs/
    ├── gabriel.log
    └── gabriel.err
```

## Port map

- **9777** — GABRIEL daemon (HTTP + WebSocket)
- **7777** — DreamChamber (separate process, talks to GABRIEL)
- **8090** — NoizyVox FastAPI
- **8091** — Rob-AVA FastAPI

## Two run modes

1. **Interactive** — `gabriel` in the terminal, REPL loop, streaming output
2. **Daemon** — `gabriel --daemon` (via LaunchAgent), HTTP/WS on 9777, handles voice-bridge STT/TTS events, morning status cron, Kill Switch webhook fires

## Security

- `ANTHROPIC_API_KEY` in `.env` (never committed)
- `NOIZY_API_KEY` in `.env` — heaven-mcp uses this for authenticated Heaven calls
- LaunchAgent runs as user `m2ultra`, not root
- WebSocket on 9777 binds to `127.0.0.1` only (no LAN exposure) unless `GABRIEL_BIND=0.0.0.0` explicit
- All Never Clause checks fire via heaven-mcp — GABRIEL cannot bypass by design

## Cost posture (honest)

Running GABRIEL as a 24/7 daemon has a real cost. Ballpark:

- Idle daemon (no queries): $0/hour
- Per-interaction average (cached system prompt, 1 turn, 1K output): ~$0.005 Haiku / ~$0.03 Sonnet / ~$0.15 Opus
- Morning brief mission (Sonnet, 10 turns): ~$0.20/day = $6/month
- Heavy dev session (Opus, 20 turns): ~$3 per session

Set `GABRIEL_DAILY_BUDGET_USD` in `.env` — daemon emits a warning + hard-stops at cap.

## Deferred

- Voice bridge end-to-end (depends on voice-bridge MCP being healthy)
- Webhooks to Slack/email (requires SLACK_WEBHOOK_URL + SENDGRID_API_KEY)
- n8n triggers (requires n8n running on 5678)

These land in phase 2 once the daemon is stable.
