# Empire Stack Setup — ingestion, scraping, memory, pixel art

## 1. markitdown + Scrapling (local, MCP) — run the installer
```bash
bash setup-ingest-stack.sh
```

Then wire them into Claude Code. Add to your MCP config (project `.mcp.json`
or `~/.claude.json`), merging into any existing `mcpServers`:

```json
{
  "mcpServers": {
    "markitdown": { "command": "markitdown-mcp" },
    "scrapling":  { "command": "scrapling", "args": ["mcp"] }
  }
}
```
> The installer prints the exact Scrapling MCP subcommand for your version —
> if it isn't `mcp`, swap the `args` value to match.

**What you get:** drop a PDF/Word/Excel/image at Claude and `markitdown` turns it
into clean Markdown; ask Claude to pull a web page and `scrapling` fetches it
(bypassing Cloudflare) and hands back structured content — fewer tokens, more signal.

## 2. supermemory — honest verdict
You asked for **self-hosted only**, which was the right instinct. The catch:

- **Official self-hosting is enterprise-gated.** The full self-host package
  (Docker + Cloudflare Workers + Postgres/pgvector) is only released to
  enterprise customers who contact their team. You can't just `docker compose up`
  the main repo.
- **The easy MCP** (`mcp.supermemory.ai`) routes your memory through *their cloud* —
  which breaks your sovereignty rule. Not recommended for catalog/identity data.

**Sovereign options instead:**
1. **Community-compatible API** — `s11ngh/supermemory-selfhosted` (Postgres +
   pgvector + Tailscale). A supermemory-shaped API you fully control.
2. **Mem0 self-hosted** — mature, clean Docker deploy, local embeddings option.
3. **Stay with what you have** — your Lucy memcells + the local auto-memory already
   give the empire persistent memory, on-machine, today.

My recommendation: don't adopt supermemory's cloud. If you want a memory upgrade,
I'll stand up **Mem0 self-hosted** or the community supermemory API — both keep
your memory on the M2 Ultra. Say which and I'll build it.

## 3. LibreSprite — free pixel art, no compile
The ready-made app (no Aseprite build needed):
- Downloads: https://libresprite.github.io/#!/download
- Or via Homebrew cask: `brew install --cask libresprite`

Same editor as Aseprite's open era, GPL, zero cost, instant install.
