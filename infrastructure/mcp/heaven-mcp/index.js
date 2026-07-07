#!/usr/bin/env node
/**
 * HEAVEN MCP Server — NOIZY Consent Kernel
 * Exposes the Heaven HVS consent kernel API to Windsurf/Cascade as MCP tools.
 *
 * Tools:
 *   h17_health           — Kernel health + version
 *   h17_gabriel          — Gabriel empire state (public)
 *   h17_actors           — List registered actors
 *   h17_actor            — Get single actor by ID
 *   h17_never_clauses    — Get actor's Never Clauses
 *   h17_consent_tokens   — List consent tokens
 *   h17_stats            — Empire-wide stats
 *   h17_ledger           — Audit ledger entries
 *   h17_rate_table       — Current rate table
 *   h17_union_tiers      — Union tier definitions
 *   h17_kpi              — KPI snapshot (trust/safety/revenue/quality/risk)
 *   h17_audit            — Enterprise audit report
 *
 * Requires: NOIZY_API_KEY env var (X-NOIZY-Key header)
 * URL: HEAVEN_URL env var (default: https://heaven.rsp-5f3.workers.dev)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const HEAVEN_URL = process.env.HEAVEN_URL || "https://heaven.rsp-5f3.workers.dev";
const NOIZY_API_KEY = process.env.NOIZY_API_KEY || "";

async function h17(path, method = "GET", body = null) {
  const url = `${HEAVEN_URL}${path}`;
  const headers = { "Content-Type": "application/json" };
  if (NOIZY_API_KEY) headers["X-NOIZY-Key"] = NOIZY_API_KEY;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Heaven ${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

function formatJson(obj) {
  return "```json\n" + JSON.stringify(obj, null, 2) + "\n```";
}

const server = new Server(
  { name: "heaven-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "h17_health",
      description: "Check Heaven consent kernel health and version. No auth required.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "h17_gabriel",
      description:
        "Get Gabriel empire state from Heaven — actor count, consent tokens, Never Clauses in force, ledger events, recent activity. No auth required.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "h17_actors",
      description: "List all registered actors in the NOIZY Empire (requires auth)",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "h17_actor",
      description: "Get a single actor by ID (e.g. RSP_001)",
      inputSchema: {
        type: "object",
        properties: {
          actor_id: { type: "string", description: "Actor ID, e.g. RSP_001" },
        },
        required: ["actor_id"],
      },
    },
    {
      name: "h17_never_clauses",
      description: "Get all Never Clauses for an actor. These are immovable prohibitions that cannot be overridden.",
      inputSchema: {
        type: "object",
        properties: {
          actor_id: { type: "string", description: "Actor ID, e.g. RSP_001" },
        },
        required: ["actor_id"],
      },
    },
    {
      name: "h17_consent_tokens",
      description: "List all consent tokens (scoped, revocable, time-limited)",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "h17_stats",
      description: "Get empire-wide statistics — actors, tokens, ledger events, synth requests",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "h17_ledger",
      description: "Read the NOIZY append-only audit ledger",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "h17_rate_table",
      description: "Get current rate table (pricing per use category)",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "h17_union_tiers",
      description: "Get union tier definitions (emerging 2% → landmark 10%)",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "h17_kpi",
      description: "Get KPI snapshot. Type: trust | safety | revenue | quality | risk",
      inputSchema: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["trust", "safety", "revenue", "quality", "risk"],
            description: "KPI type",
          },
        },
        required: ["type"],
      },
    },
    {
      name: "h17_audit",
      description: "Get enterprise audit report — full compliance view",
      inputSchema: { type: "object", properties: {} },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let data;

    switch (name) {
      case "h17_health":
        data = await h17("/health");
        return {
          content: [
            {
              type: "text",
              text: `**Heaven Kernel:** ${data.status}\nVersion: ${data.version || "?"}\n${formatJson(data)}`,
            },
          ],
        };

      case "h17_gabriel":
        data = await h17("/gabriel");
        return { content: [{ type: "text", text: formatJson(data) }] };

      case "h17_actors":
        data = await h17("/api/v1/actors");
        return { content: [{ type: "text", text: formatJson(data) }] };

      case "h17_actor":
        data = await h17(`/api/v1/actors/${args.actor_id}`);
        return { content: [{ type: "text", text: formatJson(data) }] };

      case "h17_never_clauses":
        data = await h17(`/api/v1/actors/${args.actor_id}/never-clauses`);
        return { content: [{ type: "text", text: formatJson(data) }] };

      case "h17_consent_tokens":
        data = await h17("/api/v1/consent-tokens");
        return { content: [{ type: "text", text: formatJson(data) }] };

      case "h17_stats":
        data = await h17("/api/v1/stats");
        return { content: [{ type: "text", text: formatJson(data) }] };

      case "h17_ledger":
        data = await h17("/api/v1/ledger");
        return { content: [{ type: "text", text: formatJson(data) }] };

      case "h17_rate_table":
        data = await h17("/api/v1/rate-table");
        return { content: [{ type: "text", text: formatJson(data) }] };

      case "h17_union_tiers":
        data = await h17("/api/v1/union-tiers");
        return { content: [{ type: "text", text: formatJson(data) }] };

      case "h17_kpi":
        data = await h17(`/api/v1/kpi/${args.type}`);
        return { content: [{ type: "text", text: formatJson(data) }] };

      case "h17_audit":
        data = await h17("/api/v1/enterprise/audit");
        return { content: [{ type: "text", text: formatJson(data) }] };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return {
      content: [{ type: "text", text: `**Error:** ${err.message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
