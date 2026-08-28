# LocalGenius — the sovereign local cortex

One local brain. Many hands. VS Code, Antigravity, GABRIEL and LUCY all plug into
the same MCP server. **Nothing phones home** — all inference runs on this M2 Ultra:

- **Ollama** `:11434` — `llama3.2:3b` (chat), `llama3.2-vision:11b` (vision)
- **LM Studio** `:1234` — `nomic-embed` (embeddings → semantic memory)
- **Guardian** `:9797` — empire status, drives, SMART, GABRIEL/LUCY heartbeats

The cloud is touched only when LocalGenius **signals** a task exceeds local capacity
(`genius_route … kind=cloud`). It never sends the data itself. Sovereignty by construction.

## Tools (12)

| Role | Tools |
|------|-------|
| Code copilot | `genius_ask` · `genius_vision` · `genius_explain_file` · `genius_review` |
| Auto router | `genius_route` (chat/vision/embed/cloud) · `genius_models` |
| GABRIEL+LUCY cortex | `cortex_store` · `cortex_recall` (semantic) · `cortex_search` (keyword) |
| Empire guardian | `empire_status` · `empire_disk` · `empire_agents` |

Resources: `genius://models`, `genius://empire/status`

## Modes

**Per-IDE (stdio)** — already wired into `~/.vscode/mcp.json` and
`~/.gemini/antigravity/mcp_config.json`. Restart the IDE; LocalGenius appears.

**Shared daemon (HTTP)** — one brain for every client at `127.0.0.1:8848`:

```sh
cp com.noizy.localgenius.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.noizy.localgenius.plist
# stop:  launchctl unload ~/Library/LaunchAgents/com.noizy.localgenius.plist
```

Then point any MCP client at the streamable-HTTP URL `http://127.0.0.1:8848/mcp`.

## Config (env)

`LOCALGENIUS_CHAT_MODEL` · `LOCALGENIUS_VISION_MODEL` · `LOCALGENIUS_EMBED_MODEL`
`LOCALGENIUS_OLLAMA` · `LOCALGENIUS_LMSTUDIO` · `LOCALGENIUS_GUARDIAN`
`LOCALGENIUS_HTTP=1` `LOCALGENIUS_PORT=8848` · `LOCALGENIUS_DB=cortex.db`

## Requirements
`mcp` + `httpx` (both already present on this machine). Pin: see `requirements.txt`.
