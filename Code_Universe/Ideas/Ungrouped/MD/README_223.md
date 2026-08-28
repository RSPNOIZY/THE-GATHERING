t pull
git add -A


y# NOIZY Connectors

Integration modules for the NOIZY Connector Hub (Cloudflare Workers).

## Connectors

| Module               | Provider            | Auth        | Features                          |
|----------------------|---------------------|-------------|-----------------------------------|
| `zapier-mcp.ts`      | Zapier              | Webhook     | Inbound webhook, Catch Hook push  |
| `notion.ts`          | Notion              | API Key     | Search, DB query, page CRUD       |
| `linear.ts`          | Linear              | API Key     | GraphQL, issues, comments, webhooks |
| `google.ts`          | Google Workspace    | OAuth 2.0   | Gmail, Calendar, Drive            |
| `microsoft-graph.ts` | Microsoft 365       | OAuth 2.0   | Mail, Calendar, OneDrive, Teams   |
| `apple-asc.ts`       | App Store Connect   | JWT (ES256) | Apps, builds, TestFlight, reports |
| `anthropic.ts`       | Anthropic           | API Key     | Messages API proxy, tool use      |

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Cloudflare Worker: connector-hub                        │
│  ┌────────────────────────────────────────────────────┐  │
│  │ POST /webhook/:connector  ← inbound webhooks      │  │
│  │ GET  /oauth/:provider/*   ← OAuth flows           │  │
│  │ POST /dispatch            ← job queue push         │  │
│  │ GET  /health              ← health + inventory     │  │
│  │ GET  /audit               ← audit log entries      │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Bindings:                                               │
│    KV (TOKENS)    — OAuth tokens + state                 │
│    D1 (AUDIT)     — Event audit log                      │
│    Queue (JOBS)   — Async job dispatch                   │
└──────────────────────────────────────────────────────────┘
```

## Usage

Each connector exports typed functions that can be imported by the Connector Hub
or used standalone. OAuth connectors (Google, Microsoft) rely on tokens stored
in KV by the Hub's OAuth flow handlers.

```typescript
import { listIssues, createIssue } from "./connectors/linear";

const issues = await listIssues({ apiKey: env.LINEAR_API_KEY }, { first: 10 });
const newIssue = await createIssue({ apiKey: env.LINEAR_API_KEY }, {
  teamId: "TEAM_ID",
  title: "New integration task",
});
```
