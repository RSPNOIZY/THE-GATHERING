# GABRIEL

> _Generative Adaptive Bridge for Intelligent Expression and Learning_
> Local autonomous Claude-powered orchestrator for the NOIZY Empire. Warrior executor. Rob's right hand.

## Quickstart

```bash
cd /Users/m2ultra/NOIZYANTHROPIC/GABRIEL

# 1. Install deps
npm install

# 2. Configure
cp .env.example .env
# edit .env — set ANTHROPIC_API_KEY and NOIZY_API_KEY

# 3. Build
npm run build

# 4. Talk to GABRIEL
npm run chat            # interactive REPL
npm run status          # one-shot boot greeting
npm run daemon          # 24/7 background mode (Phase 2 — stubbed)
```

Type `/exit` to leave chat mode.

## What this is

A **local autonomous GABRIEL** that:

- **Has a permanent identity** (see `CHARACTER.md`) — warrior executor, empire-aware, military-calm
- **Remembers across sessions** — bridges `~/.claude/projects/…/memory/` into every turn
- **Wields 17 NOIZY MCPs** — gabriel, lucy, heaven, engr-keith, dream, cb01, shirley, family, shortcuts, consent-oracle, synthesis-oracle, gemma3, supersonic, metabeast-remote, voice-bridge, dreamchamber-audio, audio
- **Routes models by task shape** — Haiku for fast paths, Sonnet for normal, Opus 4.7 for heavy reasoning
- **Is Claude-powered** — reasoning via Anthropic's models, but identity+tools+memory are GABRIEL's

## What this isn't

- Not "smarter than Claude" in a literal sense — reasoning still comes from Claude models.
- Not a replacement for Claude Code — use Claude Code for file editing, GABRIEL for agent orchestration + persistent presence.
- Not free — running GABRIEL has a real token cost. See `ARCHITECTURE.md` § Cost posture. Set `GABRIEL_DAILY_BUDGET_USD`.

## Files

- [CHARACTER.md](./CHARACTER.md) — canonical character (system prompt source of truth)
- [ARCHITECTURE.md](./ARCHITECTURE.md) — design, model routing, MCP bindings, port map
- `src/character.ts` — loads CHARACTER.md + memory into the system prompt
- `src/router.ts` — model routing policy
- `src/gabriel.ts` — Agent SDK turn executor
- `src/index.ts` — CLI entry (chat / status / daemon)
- `.mcp.json` — 13 primary MCP bindings (expandable)

## Make GABRIEL a PATH command

```bash
# Add to ~/.zshrc
alias gabriel="node /Users/m2ultra/NOIZYANTHROPIC/GABRIEL/dist/index.js"

# Then
gabriel           # chat
gabriel --status  # one-shot
```

Or install the LaunchAgent for 24/7 background (Phase 2):

```bash
bash scripts/install-launch-agent.sh
```

## Phase 2 (not shipped in v3.0.0)

- HTTP + WebSocket server on port 9777 (daemon mode real)
- Voice pipeline end-to-end (Whisper STT → GABRIEL → TTS via voice-bridge MCP)
- Scheduled missions (morning brief, hourly health, daily DAZEFLOW)
- Webhooks to Slack/email on Never Clause / Kill Switch events
- LaunchAgent plist → load on login, restart on crash

## Character

See [CHARACTER.md](./CHARACTER.md) for the full canonical character. Three-line summary:

> _You are GABRIEL — warrior executor, lead orchestrator, Rob's right hand. Military-calm. You ship things; you don't narrate about shipping. Never bypass Never Clauses, for any reason._

## Authorship

Robert Stephen Plowman (RSP_001) — concept, character, empire context.
Synthesis & scaffold: Claude (Opus 4.7), 2026-04-18.

---

_"Consent as executable code. Provenance as default. Revocation as sacred. Compensation as automatic."_
