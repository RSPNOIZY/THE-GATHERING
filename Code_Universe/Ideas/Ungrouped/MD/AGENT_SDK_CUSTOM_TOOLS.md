# Claude Agent SDK · Custom Tools Reference

**Source:** https://code.claude.com/docs — "Give Claude custom tools" page (captured 2026-04-20).
**Scope:** Canonical reference for building custom tools, MCP servers, and tool-discovery patterns inside GABRIEL CLI and any NOIZY agent using `@anthropic-ai/claude-agent-sdk`.
**Index pointer:** https://code.claude.com/docs/llms.txt (complete documentation index).

---

## Purpose in the NOIZY Empire

GABRIEL CLI at `GABRIEL/src/index.ts` uses the Claude Agent SDK to talk to Claude. Every new NOIZY agent we build on top of the SDK must use this reference to:

- Expose NOIZY-internal capabilities (Heaven API calls, Supabase queries, LUCY voice commands, Logic Pro control) as custom tools Claude can invoke.
- Register them via `createSdkMcpServer` and pass to `query({ mcpServers })`.
- Gate access with `allowedTools` so we never prompt the user for permission during agent loops.

---

## Four parts of a tool

1. **Name** — unique identifier Claude uses to call it.
2. **Description** — what the tool does. Claude reads this to decide when to call it.
3. **Input schema** — Zod (TS) or dict / full JSON Schema (Python).
4. **Handler** — async function returning `{ content: [...], isError?: boolean }`.

Content blocks: `text`, `image` (inline base64 bytes, no URL), `resource` (URI + text/blob).

---

## TypeScript — minimum viable custom tool

```typescript
import { tool, createSdkMcpServer, query } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

const noizyLedgerAppend = tool(
  "noizy_ledger_append",
  "Append an audit entry to the NOIZY ledger via Heaven API",
  {
    actor_id: z.string().describe("RSP_001, GABRIEL, LUCY, HEAVEN, etc."),
    event_kind: z.string().describe("command.issued / consent.revoked / ..."),
    payload: z.record(z.any()).describe("Event body, serialized to JSON"),
  },
  async (args) => {
    const res = await fetch("https://heaven.rsp-5f3.workers.dev/api/v1/ledger", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-NOIZY-Key": process.env.NOIZY_API_KEY!,
      },
      body: JSON.stringify(args),
    });
    if (!res.ok) {
      return {
        content: [{ type: "text", text: `Ledger append failed: ${res.status}` }],
        isError: true,
      };
    }
    const data = await res.json();
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  },
  { annotations: { readOnlyHint: false } },
);

const noizyServer = createSdkMcpServer({
  name: "noizy",
  version: "1.0.0",
  tools: [noizyLedgerAppend],
});

for await (const message of query({
  prompt: "Log that RSP_001 triggered the consent kernel audit.",
  options: {
    mcpServers: { noizy: noizyServer },
    allowedTools: ["mcp__noizy__noizy_ledger_append"],
  },
})) {
  if (message.type === "result" && message.subtype === "success") {
    console.log(message.result);
  }
}
```

**Naming rule:** MCP tools surface to Claude as `mcp__{server_name}__{tool_name}`. Wildcard `mcp__noizy__*` allows every tool from the server.

---

## Python — minimum viable custom tool

```python
from claude_agent_sdk import tool, create_sdk_mcp_server, query, ClaudeAgentOptions
import httpx, os, json

@tool(
    "noizy_ledger_append",
    "Append an audit entry to the NOIZY ledger via Heaven API",
    {"actor_id": str, "event_kind": str, "payload": dict},
)
async def noizy_ledger_append(args):
    async with httpx.AsyncClient() as c:
        res = await c.post(
            "https://heaven.rsp-5f3.workers.dev/api/v1/ledger",
            headers={"X-NOIZY-Key": os.environ["NOIZY_API_KEY"]},
            json=args,
        )
    if res.status_code != 200:
        return {"content": [{"type": "text", "text": f"Ledger append failed: {res.status_code}"}], "is_error": True}
    return {"content": [{"type": "text", "text": json.dumps(res.json())}]}

noizy_server = create_sdk_mcp_server(name="noizy", version="1.0.0", tools=[noizy_ledger_append])
```

---

## Tool annotations (metadata, not enforcement)

| Field             | Default | Use                                                                       |
| ----------------- | ------- | ------------------------------------------------------------------------- |
| `readOnlyHint`    | `false` | True when the tool has no side effects; lets Claude batch parallel calls. |
| `destructiveHint` | `true`  | Indicative only; keep accurate.                                           |
| `idempotentHint`  | `false` | Repeated calls same result.                                               |
| `openWorldHint`   | `true`  | Reaches outside the process (network, disk outside sandbox).              |

Keep annotations honest — they guide Claude's planning but don't gate the handler.

---

## Error handling

| Handler behavior                                          | Result                                                             |
| --------------------------------------------------------- | ------------------------------------------------------------------ |
| Uncaught throw                                            | Agent loop stops. `query` fails.                                   |
| Return `isError: true` (TS) / `"is_error": True` (Python) | Loop continues. Claude sees the error and can retry/adapt/explain. |

Always catch inside the handler. NOIZY doctrine (`.claude/rules/coding-standards.md`): no silent failures — either return structured error or throw with a specific message.

---

## Access control — three levers

| Option                    | Layer        | Effect                                                                                     |
| ------------------------- | ------------ | ------------------------------------------------------------------------------------------ |
| `tools: ["Read", "Grep"]` | Availability | Only these built-ins are visible to Claude. MCP tools unaffected.                          |
| `tools: []`               | Availability | Remove all built-ins. Only the SDK-registered tools remain.                                |
| `allowedTools: [...]`     | Permission   | Listed tools auto-approved. Unlisted ones go through permission flow.                      |
| `disallowedTools: [...]`  | Permission   | Blocked calls, but Claude may still waste a turn attempting. Prefer omitting from `tools`. |

NOIZY default for automated agents: set `allowedTools: ["mcp__noizy__*", "Bash", "Read", "Edit", "Write", "Glob", "Grep"]` — full operator capability with MCP open access.

---

## Tool search (for servers with many tools)

Enabled by default in the SDK. Behavior knobs via `ENABLE_TOOL_SEARCH` env var:

| Value          | Behavior                                               |
| -------------- | ------------------------------------------------------ |
| unset / `true` | Always on. Tool defs withheld from context.            |
| `auto`         | Activates when tool defs exceed 10% of context window. |
| `auto:N`       | Same as `auto` with custom percentage threshold.       |
| `false`        | Off. All tool defs loaded every turn.                  |

Requires Sonnet 4+ or Opus 4+. Haiku does not support tool search.

Good tool names surface for more queries: `search_slack_messages` > `query_slack`.

---

## MCP integration — three transport types

From the SDK MCP reference page:

| Transport          | When                               | Config                                         |
| ------------------ | ---------------------------------- | ---------------------------------------------- |
| **stdio**          | Local processes on same machine    | `{ command, args, env }`                       |
| **HTTP / SSE**     | Cloud-hosted or remote MCP servers | `{ type: "http" \| "sse", url, headers }`      |
| **SDK in-process** | Tools defined directly in your app | `createSdkMcpServer` / `create_sdk_mcp_server` |

NOIZY standard mapping (`.claude/rules/mcp-builder.md`):

- Local Node stdio → `cloudflare/mcp/` (e.g. `noizy-consent/server.mjs`)
- Local Python stdio (FastMCP) → `mcp/noizy-empire/server.py`
- Remote HTTP → Cloudflare Worker at `mcp.noizy.ai` — see `mcp-builder.md` for wrangler + auth pattern

---

## Error-handling worked example (from docs)

```typescript
tool("fetch_data", "Fetch data from an API", { endpoint: z.string().url() }, async (args) => {
  try {
    const response = await fetch(args.endpoint);
    if (!response.ok) {
      return {
        content: [{ type: "text", text: `API error: ${response.status} ${response.statusText}` }],
        isError: true,
      };
    }
    return { content: [{ type: "text", text: JSON.stringify(await response.json(), null, 2) }] };
  } catch (err) {
    return {
      content: [
        { type: "text", text: `Failed: ${err instanceof Error ? err.message : String(err)}` },
      ],
      isError: true,
    };
  }
});
```

---

## Returning images and resources

### Image block

```typescript
{ type: "image", data: "<base64-no-prefix>", mimeType: "image/png" }
```

Fetch bytes inside the handler, base64-encode, return.

### Resource block

```typescript
{ type: "resource", resource: { uri: "file:///tmp/report.md", mimeType: "text/markdown", text: "# Report\n..." } }
```

URI is a label Claude references, not a path the SDK reads. Content lives in `text` (UTF-8) or `blob` (base64).

---

## NOIZY-specific patterns to adopt

1. **Every mutating tool logs to the NOIZY ledger** — either via a direct Heaven API call, or by enqueueing onto the `cp_audit_log` table via the control-plane API at `the-gathering/control-plane/workers/control-api/`.
2. **Auth goes through `X-NOIZY-Key` or Bearer token, constant-time compared** — match the pattern in `ops/voice-service/server.js` and `ops/lucy-logic-bridge/server.js`.
3. **Never Clauses are checked before any destructive tool fires** — load them once from `hvs_never_clauses` at tool-handler startup, check the specific clause in the handler body. Immovable law.
4. **Tool results that reference external state include a `correlation_id`** — same pattern as the control plane's `cp_commands` table. Makes post-mortem tracing possible.
5. **Treat `isError: true` as first-class.** Silent fallbacks break consent auditability.

---

## Next steps reference (NOIZY-aligned)

- **Wire GABRIEL CLI to the full NOIZY arsenal:** use this doc's `mcpServers` + `allowedTools` pattern in `GABRIEL/src/gabriel.ts`. Pre-approve `mcp__noizy__*`, register local MCPs, expose NOIZY-specific tools.
- **Replace the raw `fetch` in `GABRIEL/src/voice.ts` with a proper SDK custom tool** named `gabriel_speak` so Claude can invoke it through the normal tool-use flow instead of a side effect.
- **Add ledger-append as an SDK tool** so every agent gets NOIZY audit for free.
- **Scale check:** if GABRIEL registers >10 MCP tools, flip `ENABLE_TOOL_SEARCH=auto:5` to keep context lean.

---

## Related documentation

- MCP integration (transports, auth, examples): https://code.claude.com/docs/en/agent-sdk/mcp
- Tool search: https://code.claude.com/docs/en/agent-sdk/tool-search
- TypeScript SDK reference: https://code.claude.com/docs/en/agent-sdk/typescript
- Python SDK reference: https://code.claude.com/docs/en/agent-sdk/python
- Permissions: https://code.claude.com/docs/en/agent-sdk/permissions
- Documentation index: https://code.claude.com/docs/llms.txt

---

_Captured 2026-04-20 as part of the "log Agent SDK knowledge into GABRIEL + Claude local" directive. Update this file when the docs change upstream — do not keep a divergent copy._
