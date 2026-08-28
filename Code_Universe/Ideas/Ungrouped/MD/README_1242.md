# Google Antigravity SDK — Examples

Runnable examples that demonstrate the Google Antigravity SDK, organized from
introductory snippets to more advanced patterns.

## Prerequisites

```bash
pip install google-antigravity
export GEMINI_API_KEY="your_api_key_here"
```

## Directory Layout

### [`getting_started/`](getting_started/)

**Start here.** Bite-sized, single-file examples — one feature per file. Each
runs standalone and covers a core SDK concept: agents, streaming, tools,
policies, hooks, structured output, and more.

→ See the [Getting Started README](getting_started/README.md) for the full
index and a quickstart snippet.

### [`deep_dives/`](deep_dives/)

Multi-feature examples that combine several SDK concepts into realistic
mini-applications:

| Example | What it demonstrates |
|---|---|
| [interactive_cli.py](deep_dives/interactive_cli.py) | Full interactive CLI with custom tools, MCP servers, and hook-based tool approval. |
| [agent_middleware.py](deep_dives/agent_middleware.py) | Stacked hooks as transparent middleware — rate limiting, audit logging, and error recovery. |
| [host_tool_hooks.py](deep_dives/host_tool_hooks.py) | Every supported lifecycle hook wired and logged (session, turn, tool, subagent, compaction, interaction). |
| [round_based_chat.py](deep_dives/round_based_chat.py) | Synchronized multi-agent chat room with parallel turns, triggers, and opt-out via custom tools. |
| [async_chat.py](deep_dives/async_chat.py) | Fully async peer-to-peer agent chat — no rounds, reactive wake-ups via `asyncio.Condition`. |
| [multimodal_pipeline.py](deep_dives/multimodal_pipeline.py) | Generator/discriminator pipeline: image creation → blind visual analysis via multimodal `Content`. |
| [doc_maintenance_agent.py](deep_dives/doc_maintenance_agent.py) | Autonomous documentation agent scoped to `.md` files with fine-grained policies. |
| [docstring_maintenance_agent.py](deep_dives/docstring_maintenance_agent.py) | Autonomous docstring agent scoped to `.py` files with disabled destructive tools. |

### [`resources/`](resources/)

Shared assets used by the examples (images, MCP server, sample files).
