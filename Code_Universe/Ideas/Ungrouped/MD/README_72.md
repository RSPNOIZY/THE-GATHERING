# NOIZY Agent Runner

Hotrodded Claude Agent SDK harness — spawn fully-contextualized Claude agents from any program (CLI, GABRIEL daemon, voice bridge, n8n).

## Install

```bash
pip3 install --break-system-packages 'claude-agent-sdk>=0.1.0'
# (already done via m2-ultra session 2026-04-17)
```

## CLI

```bash
python3 agents/engr/runner/noizy_agent.py "build wrangler.toml for lucy worker"
```

## Library

```python
from agents.engr.runner.noizy_agent import run_agent
result = await run_agent("describe consent kernel state", max_turns=5)
```

## What the harness preloads

- GABRIEL identity (warrior executor, military-calm, no hype)
- All 11+ rule fragments from `.claude/rules/*.md`
- Never Clauses, consent kernel invariants, 75/25 royalty split
- `cwd` set to `/Users/m2ultra/NOIZYANTHROPIC` so file tools land in the right place

## Fallback chain

Per RSP directive 2026-04-17 (deadline day):

1. **Claude via Agent SDK** — primary.
2. **Gemma 3 27B via Ollama + MCP** — fallback (stub; see `select_model()`).
3. **Raw `anthropic` SDK** — last resort for simple completions without tools.

The trigger for fallback is an open design decision — see the `MODEL_FALLBACK` block at the bottom of `noizy_agent.py` for the four options (API error, latency, cost ceiling, task-class routing).

## Integration points

| Caller                     | How to invoke                                              |
| -------------------------- | ---------------------------------------------------------- |
| GABRIEL daemon (port 9777) | `from noizy_agent import run_agent; await run_agent(task)` |
| Voice bridge (port 8080)   | wrap the CLI; pipe transcribed voice as task arg           |
| n8n workflow               | HTTP node → internal wrapper service → `run_agent`         |
| Shortcut / Raycast         | `zsh -c "python3 .../noizy_agent.py '$1'"`                 |

## Safety

- Respects `ANTHROPIC_API_KEY` env var; warns if missing.
- `max_turns` cap prevents runaway agents.
- `allowed_tools` parameter can restrict dangerous tools per caller.
- Config Freeze check: this harness does NOT modify `.claude/` — it only reads rules at runtime.
