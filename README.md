# THE-GATHERING
> *One canonical repo. All RSP. All NOIZY. All sovereign.*

**Founder:** Robert Stephen Plowman (RSP_001) — rsp@noizy.ai — Canada  
**Machine:** GOD.local — M2 Ultra Mac Studio, 192GB RAM, 24-core  
**Doctrine:** Consent as executable code. Provenance as default. Revocation as sacred. Compensation as automatic.

---

## Structure

```
THE-GATHERING/
├── agents/          GABRIEL dispatcher + LUCY file intelligence
├── heaven/          HEAVEN consent kernel + Cloudflare Workers
├── noizy-ai/        NOIZY.AI brand + consent API
├── noizyfish/       NOIZYFISH music platform + MC96ECO catalogue
├── infrastructure/  PM2, Cloudflare, MCP configs
├── tools/           Turbo scripts, voice pipeline, supersonic
├── memory/          Chroma vector DB, DuckDB (gitignored)
└── docs/            EMPIRE_MAP, AGENT_STACK, ARCHITECTURE
```

## The Crew (PM2 on GOD.local)

| Agent | Process | Role |
|-------|---------|------|
| GABRIEL | `gabriel-lucy-core` | Dispatcher — intent → crew → TTS |
| LUCY | `lucy-data-manager` | File intelligence, catalogue, SHA256 |
| CHROMA | `chroma` | Vector DB at :8765 |
| HF-MCP | `hf-mcp-server` | HuggingFace MCP bridge |
| OLLAMA | `ollama` | Local inference host |

## Local Models (Ollama)

| Model | Size | Role |
|-------|------|------|
| `gabriel-brain:latest` | 47 GB | GABRIEL's primary brain |
| `lucy-brain:latest` | 19 GB | LUCY's primary brain |
| `Qwen2.5-VL-72B` | 48 GB | Multimodal vision |
| `gemma4:26b` | 17 GB | General reasoning |
| `qwen2.5-coder:32b` | 19 GB | Code generation |

## Quick Start

```bash
# Start all daemons
pm2 start infrastructure/pm2/ecosystem.config.cjs

# Run GABRIEL (voice loop)
python3 agents/gabriel/gabriel_core.py --loop

# Check empire health
python3 agents/gabriel/gabriel_monitor.py

# Turbo pipeline (format + dedupe + verify)
bash tools/turbo-scripts/turbo_pipeline.sh .
```

## The 10 Brands

| Brand | Domain | Status |
|-------|--------|--------|
| NOIZY.AI | noizy.ai | Active |
| NOIZYFISH | noizyfish.com | Building |
| NOIZYKIDZ | noizykidz.com | Planned |
| NOIZYVOX | noizyvox.com | Building |
| NOIZYLAB | noizylab.ca | Active |
| DREAMCHAMBER | — | Building |
| THE-OLD-GUARD | — | Building |
| THE-AQUARIUM | — | 34TB audio vault |
| NOIZYANTHROPIC | — | Active |
| RSPNOIZY | github.com/RSPNOIZY | Active |

---

*"We are the new punk rockers: capitalist free thinkers who believe in peace, love, and understanding."*
