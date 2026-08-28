# 🎙 NOIZYBEAST Empire — R.S. Plowman · Ottawa, Ontario

> Premium Voice Library · AI Infrastructure · 500-Year Vision  
> Founded by Robert Stephen Plowman. Giving AI and human voice actors a chance to push back against greed.

---

## Open in Your Editor

```bash
# VS Code
./open-noizy.sh code

# VS Code Insiders
./open-noizy.sh insiders

# Cursor
./open-noizy.sh cursor

# Windsurf
./open-noizy.sh windsurf
```

Or double-click `NOIZYBEAST.code-workspace` to open directly.

---

## Project Map

| Folder | What it is | Run |
|--------|-----------|-----|
| `noizy-command-center/` | Main dashboard — HTML/CSS/JS command center, GABRIEL panel, Cloudflare section, Dance Steps, Turbo Scripts (Section VII) | Open `index.html` with Live Server |
| `gabriel/` | GABRIEL v4 — Python multi-agent orchestrator | `cd gabriel && source .venv/bin/activate && python gabriel.py` |
| `noizy-workers/` | Cloudflare Workers — claude-proxy, voice-consent, royalty-tracker | `cd noizy-workers/claude-proxy && npx wrangler dev` |
| `NOIZYWORLD/` | React/Vite brand world app | `cd NOIZYWORLD && npm run dev` |
| `mc96eco-journey/` | React/Vite MC96 journey site | `cd mc96eco-journey && npm run dev` |
| `noizy-presentation/` | HTML pitch deck | Open `index.html` with Live Server |
| `wisdom-project/` | Content / knowledge assets | — |

---

## Key URLs (when running locally)

| Service | URL |
|---------|-----|
| NOIZYWORLD | http://localhost:5173 |
| MC96 Journey | http://localhost:5174 |
| GABRIEL API | http://localhost:7777 |
| Claude Proxy Worker | http://localhost:8787 |
| Command Center | Open via Live Server → port 5501 |

---

## Turbo Scripts (T1–T10)

Defined in `noizy-command-center/index.html` — Section VII.  
Every script wires to: **consent · memcells · mutation codex · royalty logic · sovereignty enforcement.**

| # | Script | Purpose |
|---|--------|---------|
| T1 | `voice-capture` | Record + timestamp voice input |
| T2 | `stt-dispatch` | STT → Claude via GABRIEL |
| T3 | `consent-gate` | Validate consent before any AI use |
| T4 | `memcell-write` | Write session data to memory cells |
| T5 | `royalty-log` | Log usage to D1 royalty table |
| T6 | `crew-broadcast` | Broadcast directive to AI crew |
| T7 | `mutation-codex` | Record any codebase mutation |
| T8 | `audit-trail` | Write immutable audit event |
| T9 | `sovereignty-check` | Enforce NO FAKES Act compliance |
| T10 | `dream-capture` | Session-close ritual → Plowman Chronicles |

---

## Compliance

- **NO FAKES Act** — consent-as-code on every voice use
- **EU AI Act** — audit trail on every AI interaction  
- **GDPR** — no PII stored without consent gate
- **500-Year Vision** — every artifact is archival-grade

---

*R.S. Plowman · NOIZY.AI Empire · Ottawa, Ontario, Canada*
