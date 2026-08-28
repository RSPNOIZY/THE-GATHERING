# SUPERSONIC MCP — The NOIZY Empire Unified Server

**68 tools. 11 modules. One MCP to rule them all.**

## Boot

```bash
cd /Users/m2ultra/NOIZYANTHROPIC/mcp/supersonic
npm install
node src/index.js
```

## Modules & Tool Count

| Module | Tools | Domain |
|--------|-------|--------|
| **d1** | 4 | D1 database queries, schema, table listing |
| **kv** | 5 | KV namespace CRUD, listing |
| **consent** | 5 | Never Clauses, consent check/grant/revoke/audit |
| **heaven** | 7 | Heaven API gateway (health, actors, ledger, KPI) |
| **gabriel** | 8 | Agent orchestration, caching, watchlist, dispatch |
| **lucy** | 9 | DAZEFLOW logging, tasks, memcell memory |
| **voice** | 5 | Whisper transcription, TTS, voice analysis |
| **deploy** | 7 | Smoke tests, health checks, wrangler ops, env verify |
| **creative** | 6 | DreamChamber sessions, Shortcuts, brand palette |
| **infra** | 7 | Self-diagnostics, Ollama, disk, backup, processes |
| **family** | 5 | SHIRL wellbeing, POPS wisdom, break tracking |
| **TOTAL** | **68** | |

## Claude Desktop Config

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "supersonic": {
      "command": "node",
      "args": ["/Users/m2ultra/NOIZYANTHROPIC/mcp/supersonic/src/index.js"],
      "env": {
        "NOIZY_API_KEY": "your-key-here",
        "CLOUDFLARE_ACCOUNT_ID": "5f36aa9795348ea681d0b21910dfc82a",
        "CLOUDFLARE_API_TOKEN": "your-cf-token"
      }
    }
  }
}
```

## Claude Code Config

Add to `.claude/settings.json` under `mcpServers`:

```json
{
  "supersonic": {
    "command": "node",
    "args": ["/Users/m2ultra/NOIZYANTHROPIC/mcp/supersonic/src/index.js"]
  }
}
```

## Environment Variables

Required (from `.env` or passed via config):
- `NOIZY_API_KEY` — Heaven API authentication
- `CLOUDFLARE_ACCOUNT_ID` — `5f36aa9795348ea681d0b21910dfc82a`
- `CLOUDFLARE_API_TOKEN` — Cloudflare API access

## Safety

- D1 queries block `DROP`, `TRUNCATE`, and ledger mutations (append-only)
- Deploy tool blocks direct `wrangler deploy` — requires smoke tests first
- macOS Shortcuts blocks destructive shortcut names
- All Never Clauses enforced in consent module
- Session burnout detection (SHIRL protocol) after 4+ hours

## State

Local state stored at `~/NOIZYLAB/supersonic-state/`:
- `gabriel/` — Agent cache, watchlists
- `lucy/` — DAZEFLOW logs, tasks, memcells
- `creative/` — Mix sessions
- `family/` — Break logs, celebrations, session tracking

## Architecture

```
mcp/supersonic/
├── package.json
├── README.md
└── src/
    ├── index.js          ← Boot sequence + EMPIRE context
    └── modules/
        ├── d1.js         ← Cloudflare D1 databases
        ├── kv.js         ← Cloudflare KV namespaces
        ├── consent.js    ← Never Clauses + consent kernel
        ├── heaven.js     ← Heaven Worker API gateway
        ├── gabriel.js    ← Agent orchestration
        ├── lucy.js       ← Archives + DAZEFLOW
        ├── voice.js      ← Voice pipeline (Whisper/TTS)
        ├── deploy.js     ← Deploy & ops
        ├── creative.js   ← DreamChamber + brand
        ├── infra.js      ← Self-diagnostics + system
        └── family.js     ← Wellbeing guardians
```

---

*Built for the NOIZY Empire. 68 tools. Zero compromise.*
