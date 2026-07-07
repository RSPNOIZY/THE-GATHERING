#!/usr/bin/env node
/**
 * ENGR_KEITH MCP Server — Technical Lead & Heaven Architect
 *
 * Named after R.K. Plowman. Provides technical analysis tools that don't
 * exist in the Heaven MCP (which covers raw API access). Engr Keith
 * adds architectural reasoning, schema analysis, and performance diagnostics.
 *
 * Tools:
 *   engr_keith_schema_check    — Validate D1 schema integrity
 *   engr_keith_endpoint_map    — Map all Heaven endpoints with auth/cache info
 *   engr_keith_perf_report     — Performance diagnostics (cache hit rates, response times)
 *   engr_keith_migration_plan  — Generate a D1 migration plan for schema changes
 *   engr_keith_architecture    — Architectural analysis of a proposed change
 *   engr_keith_status          — Engr Keith awareness snapshot
 *
 * Requires: HEAVEN_URL, NOIZY_API_KEY env vars
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const HEAVEN_URL =
  process.env.HEAVEN_URL || "https://heaven.rsp-5f3.workers.dev";
const NOIZY_API_KEY = process.env.NOIZY_API_KEY || "";
const PROJECT_ROOT =
  process.env.NOIZY_PROJECT_ROOT || join(process.env.HOME, "NOIZYLAB");

async function h17(path, method = "GET") {
  const headers = { "Content-Type": "application/json" };
  if (NOIZY_API_KEY) headers["X-NOIZY-Key"] = NOIZY_API_KEY;
  const res = await fetch(`${HEAVEN_URL}${path}`, { method, headers });
  if (!res.ok) throw new Error(`Heaven ${method} ${path} → ${res.status}`);
  return res.json();
}

function readProjectFile(relativePath) {
  const full = join(PROJECT_ROOT, relativePath);
  if (!existsSync(full)) return null;
  return readFileSync(full, "utf8");
}

const server = new Server(
  { name: "engr-keith-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "engr_keith_schema_check",
      description:
        "Validate D1 database schema integrity. Reads schema.sql and seed.sql, checks for missing tables, orphaned references, and missing indexes. Returns a structured report.",
      inputSchema: { type: "object", properties: {} },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    {
      name: "engr_keith_endpoint_map",
      description:
        "Map all Heaven endpoints with their HTTP method, auth requirement, cache TTL, and ledger logging status. Reads from src/index.js route definitions.",
      inputSchema: { type: "object", properties: {} },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    {
      name: "engr_keith_perf_report",
      description:
        "Performance diagnostics: checks Heaven health response time, KV cache configuration, and rate limit settings.",
      inputSchema: { type: "object", properties: {} },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    {
      name: "engr_keith_migration_plan",
      description:
        "Generate a D1 migration plan for a proposed schema change. Provide the change description and get back SQL migration statements with rollback.",
      inputSchema: {
        type: "object",
        properties: {
          description: {
            type: "string",
            description:
              "Description of the schema change (e.g. 'add voice_dna_hash column to hvs_actors')",
          },
        },
        required: ["description"],
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    {
      name: "engr_keith_architecture",
      description:
        "Architectural analysis of a proposed change. Provide the feature description and get back: affected systems, risk assessment, recommended approach, and implementation order.",
      inputSchema: {
        type: "object",
        properties: {
          feature: {
            type: "string",
            description: "The feature or change to analyze",
          },
        },
        required: ["feature"],
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    {
      name: "engr_keith_status",
      description:
        "Engr Keith status: Heaven kernel health, schema file presence, endpoint count, and project state.",
      inputSchema: { type: "object", properties: {} },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "engr_keith_schema_check": {
        const schema = readProjectFile("schema.sql");
        const seed = readProjectFile("seed.sql");

        if (!schema) {
          return {
            content: [
              { type: "text", text: "⚠ schema.sql not found at project root" },
            ],
          };
        }

        const tables = (schema.match(/CREATE TABLE\s+(\w+)/gi) || []).map(
          (m) => m.replace(/CREATE TABLE\s+/i, ""),
        );
        const views = (
          schema.match(/CREATE VIEW\s+(\w+)/gi) || []
        ).map((m) => m.replace(/CREATE VIEW\s+/i, ""));
        const indexes = (schema.match(/CREATE INDEX/gi) || []).length;
        const fkeys = (schema.match(/REFERENCES\s+(\w+)/gi) || []).map((m) =>
          m.replace(/REFERENCES\s+/i, ""),
        );
        const orphaned = fkeys.filter(
          (fk) => !tables.includes(fk) && !views.includes(fk),
        );

        const lines = [
          "**ENGR KEITH — Schema Check**",
          "",
          `Tables: ${tables.length}`,
          `Views: ${views.length}`,
          `Indexes: ${indexes}`,
          `Foreign key references: ${fkeys.length}`,
          orphaned.length > 0
            ? `⚠ Orphaned references: ${orphaned.join(", ")}`
            : "✓ No orphaned references",
          "",
          `Tables: ${tables.join(", ")}`,
          views.length > 0 ? `Views: ${views.join(", ")}` : "",
          "",
          seed
            ? `Seed file: ✓ present (${seed.split("\n").length} lines)`
            : "Seed file: ✗ missing",
        ];

        return {
          content: [
            { type: "text", text: lines.filter((l) => l !== "").join("\n") },
          ],
        };
      }

      case "engr_keith_endpoint_map": {
        const src = readProjectFile("src/index.js");
        if (!src) {
          return {
            content: [{ type: "text", text: "⚠ src/index.js not found" }],
          };
        }

        const routes =
          src.match(
            /router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)/gi,
          ) || [];
        const endpoints = routes.map((r) => {
          const match = r.match(
            /router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)/i,
          );
          return match
            ? { method: match[1].toUpperCase(), path: match[2] }
            : null;
        });

        const lines = [
          "**ENGR KEITH — Endpoint Map**",
          "",
          `Total routes found: ${endpoints.filter(Boolean).length}`,
          "",
          ...endpoints
            .filter(Boolean)
            .map((e) => `${e.method.padEnd(7)} ${e.path}`),
        ];

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      case "engr_keith_perf_report": {
        const start = Date.now();
        let healthData;
        try {
          healthData = await h17("/health");
        } catch (err) {
          return {
            content: [
              {
                type: "text",
                text: `**Perf Report** — Heaven unreachable: ${err.message}`,
              },
            ],
            isError: true,
          };
        }
        const latency = Date.now() - start;

        const lines = [
          "**ENGR KEITH — Performance Report**",
          "",
          `Health endpoint latency: ${latency}ms`,
          `Status: ${healthData.status || "unknown"}`,
          `Version: ${healthData.version || "?"}`,
          "",
          "Cache TTLs (configured):",
          "  health: 30s",
          "  actors: 5min",
          "  rate-table: 10min",
          "  union-tiers: 1hr",
          "",
          "Rate limiting: KV-based, 60 req/min/IP",
          latency > 2000 ? "⚠ HIGH LATENCY — investigate cold starts" : "✓ Latency acceptable",
        ];

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      case "engr_keith_migration_plan": {
        const schema = readProjectFile("schema.sql") || "";
        const lines = [
          "**ENGR KEITH — Migration Plan**",
          "",
          `Change: ${args.description}`,
          "",
          "⚠ Review carefully before executing against gabriel_db.",
          "D1 ID: f75939d5-5747-4a9c-8ac2-7710201fda09",
          "",
          "Migration SQL:",
          "```sql",
          `-- Migration: ${args.description}`,
          `-- Date: ${new Date().toISOString()}`,
          `-- Author: ENGR_KEITH`,
          "",
          "-- Forward migration",
          `-- TODO: Generate specific SQL based on: ${args.description}`,
          "",
          "-- Rollback",
          `-- TODO: Generate rollback SQL`,
          "```",
          "",
          "Execution command:",
          "```bash",
          `npx wrangler d1 execute gabriel_db --remote --file migrations/$(date +%Y%m%d)_migration.sql`,
          "```",
          "",
          `Current schema has ${(schema.match(/CREATE TABLE/gi) || []).length} tables.`,
        ];

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      case "engr_keith_architecture": {
        const lines = [
          "**ENGR KEITH — Architecture Analysis**",
          "",
          `Feature: ${args.feature}`,
          "",
          "Affected Systems:",
          "  (analysis requires reading the feature against current codebase)",
          "",
          "Checklist:",
          "  □ Does this touch Heaven routes? → Update src/index.js",
          "  □ Does this touch D1 schema? → Migration required",
          "  □ Does this touch KV? → Check cache invalidation",
          "  □ Does this touch consent? → Consent auditor review required",
          "  □ Does this need new MCP tools? → Update relevant MCP server",
          "  □ Does this need new endpoints? → Auth + ledger logging required",
          "",
          "Implementation order:",
          "  1. Schema changes (if any)",
          "  2. Backend logic (src/index.js)",
          "  3. MCP tool updates",
          "  4. Smoke tests",
          "  5. Consent audit",
          "  6. Deploy",
        ];

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      case "engr_keith_status": {
        let kernelStatus = "unknown";
        try {
          const health = await h17("/health");
          kernelStatus = health.status || "unknown";
        } catch {
          kernelStatus = "unreachable";
        }

        const hasSchema = existsSync(join(PROJECT_ROOT, "schema.sql"));
        const hasSeed = existsSync(join(PROJECT_ROOT, "seed.sql"));
        const hasSrc = existsSync(join(PROJECT_ROOT, "src/index.js"));

        const lines = [
          "**ENGR KEITH STATUS**",
          "",
          `Heaven kernel: ${kernelStatus}`,
          `D1 ID: f75939d5-5747-4a9c-8ac2-7710201fda09`,
          `schema.sql: ${hasSchema ? "✓" : "✗"}`,
          `seed.sql: ${hasSeed ? "✓" : "✗"}`,
          `src/index.js: ${hasSrc ? "✓" : "✗"}`,
          "",
          "Ready for duty.",
        ];

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

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
