# NOIZY Claude

**Hot-rodded utility MCP server — every Anthropic API capability at your fingertips.**

## Tools

| Tool | What it does |
|------|-------------|
| `noizy_ask` | General purpose query — model, effort, system prompt, caching |
| `noizy_think` | Extended thinking for complex reasoning (math, logic, architecture) |
| `noizy_search` | Web-search-powered answers with live internet data |
| `noizy_code` | Sandboxed code execution (bash + file ops) |
| `noizy_extract` | Structured JSON extraction with guaranteed schema compliance |
| `noizy_vision` | Image + PDF analysis (local files or URLs) |
| `noizy_summarize` | Document summarization with source citations |
| `noizy_batch` | Bulk processing at 50% cost discount |
| `noizy_batch_status` | Check batch job results |
| `noizy_models` | List available Claude models |
| `noizy_tokens` | Count tokens before sending |
| `noizy_multi` | Multi-turn conversation with full history |

## Setup

```bash
cd noizy-claude
npm install
npm run build
```

## Environment

Requires `ANTHROPIC_API_KEY` set in your environment.

## MCP Configuration

Add to your IDE's MCP config (e.g. `.windsurf/mcp.json` or `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "noizy-claude": {
      "command": "node",
      "args": ["/Users/m2ultra/NOIZYANTHROPIC/NOIZYLAB/noizy-claude/dist/index.js"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-..."
      }
    }
  }
}
```

## Capabilities Wired In

- **Effort control** — `low` / `medium` / `high` / `max`
- **Extended thinking** — adaptive (Opus 4.6) or budget-based (Sonnet)
- **Prompt caching** — automatic 5-min ephemeral cache
- **Web search** — domain filtering, localization, max search limits
- **Code execution** — secure sandbox with bash + file operations
- **Structured outputs** — guaranteed JSON schema compliance
- **Citations** — source document citations in summaries
- **Batch API** — 50% cost discount for bulk processing
- **Vision** — local images, URLs, PDFs
- **Token counting** — estimate cost before sending
- **Multi-turn** — full conversation history support

*Built by the NOIZY AI Family.*
