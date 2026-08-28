# noizy-ms

Microsoft Graph MCP servers for the NOIZY Empire — master identity **rspnoizy@outlook.com**.

## What this is

A monorepo with one shared Graph client and two deployable MCP servers:

| App | Transport | Where it runs | Use when |
|-----|-----------|---------------|----------|
| `apps/mcp-stdio` | stdio | Local Node process | Claude Desktop / Claude Code on GOD.local |
| `apps/mcp-worker` | Streamable HTTP | Cloudflare Worker at `ms.mcp.noizy.ai` | iPad, mobile, remote agents |

Both apps import `packages/graph-client` for MSAL auth + Graph API calls — one identity, two surfaces.

## Account scope

`rspnoizy@outlook.com` is a **consumer Microsoft account**. That enables:

- ✅ Mail (`/me/messages`)
- ✅ Calendar (`/me/events`)
- ✅ OneDrive Personal (`/me/drive`)
- ✅ Contacts (`/me/contacts`)
- ✅ To-Do (`/me/todo`)
- ✅ Profile (`/me`)

And rules out:

- ❌ Teams enterprise messages
- ❌ SharePoint (doesn't exist on consumer tier)
- ❌ Delegated / shared mailboxes
- ❌ Org-wide Graph search

If you later need the work-account surface, add a second identity — don't bend this one.

## Setup

1. Register an Azure AD app — see [`docs/AZURE_APP_SETUP.md`](docs/AZURE_APP_SETUP.md). 5 minutes, zero cost.
2. `npm install` at the monorepo root.
3. `npm run auth` — one-time device-code flow, caches token to macOS Keychain.
4. Wire into Claude: see the **Wiring** section below.

## Wiring

### Local stdio MCP → Claude Desktop / Claude Code

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` or `~/NOIZYANTHROPIC/.mcp.json`:

```json
{
  "mcpServers": {
    "noizy-ms": {
      "command": "node",
      "args": ["/Users/m2ultra/NOIZYANTHROPIC/repos/noizy-ms/apps/mcp-stdio/dist/server.js"],
      "env": {
        "MS_CLIENT_ID": "<from AZURE_APP_SETUP.md>"
      }
    }
  }
}
```

### Remote Worker MCP → iPad / mobile

```json
{
  "mcpServers": {
    "noizy-ms": {
      "url": "https://ms.mcp.noizy.ai/mcp",
      "headers": { "Authorization": "Bearer <MCP_AUTH_TOKEN>" }
    }
  }
}
```

## Auth model

MSAL **device code flow** — you run `npm run auth`, it prints a code + URL, you paste the code at that URL in any browser signed in to rspnoizy@outlook.com. Refresh tokens cached in macOS Keychain via `keytar`. No secrets in env files.

## License

Internal to NOIZY Empire. Not for redistribution.
