#!/usr/bin/env node
/**
 * CB01 MCP Server — Operations Runner & Infrastructure Ops
 *
 * Handles deployment, DNS, domain management, and infrastructure operations.
 * The unglamorous but critical work that keeps the Empire running.
 *
 * Tools:
 *   cb01_deploy_status     — Check deployment status of all services
 *   cb01_health_check      — Run health checks across all endpoints
 *   cb01_smoke_test        — Execute the smoke test suite
 *   cb01_godaddy_checklist — GoDaddy exit progress tracker
 *   cb01_env_check         — Verify environment configuration
 *   cb01_status            — CB01 ops awareness snapshot
 *
 * Requires: HEAVEN_URL, NOIZY_API_KEY env vars
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const HEAVEN_URL =
  process.env.HEAVEN_URL || "https://heaven.rsp-5f3.workers.dev";
const PROJECT_ROOT =
  process.env.NOIZY_PROJECT_ROOT || join(process.env.HOME, "NOIZYLAB");

async function checkEndpoint(url) {
  const start = Date.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    return {
      url,
      status: res.status,
      ok: res.ok,
      latency: Date.now() - start,
    };
  } catch (err) {
    return {
      url,
      status: 0,
      ok: false,
      latency: Date.now() - start,
      error: err.message,
    };
  }
}

const server = new Server(
  { name: "cb01-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "cb01_deploy_status",
      description:
        "Check deployment status of all NOIZY services: Heaven (remote), DreamChamber (local), Voice Bridge (local), noizy.ai (pending).",
      inputSchema: { type: "object", properties: {} },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    {
      name: "cb01_health_check",
      description:
        "Run health checks against all live endpoints. Returns status, latency, and any errors.",
      inputSchema: { type: "object", properties: {} },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    {
      name: "cb01_smoke_test",
      description:
        "Execute the smoke test suite (smoke_test.sh). Returns pass/fail results. ALWAYS run before deploy.",
      inputSchema: { type: "object", properties: {} },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    {
      name: "cb01_godaddy_checklist",
      description:
        "GoDaddy exit progress tracker. Shows completed and remaining steps for the infrastructure migration.",
      inputSchema: { type: "object", properties: {} },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    {
      name: "cb01_env_check",
      description:
        "Verify environment configuration: .env exists, required vars set, node_modules present, wrangler available.",
      inputSchema: { type: "object", properties: {} },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    {
      name: "cb01_status",
      description: "CB01 operations awareness: services, health, environment, pending ops.",
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
  const { name } = request.params;

  try {
    switch (name) {
      case "cb01_deploy_status": {
        const heaven = await checkEndpoint(`${HEAVEN_URL}/health`);
        const dreamchamber = await checkEndpoint("http://localhost:7777/health");
        const voiceBridge = await checkEndpoint("http://localhost:8080/health");

        const services = [
          {
            name: "Heaven",
            ...heaven,
            location: "Cloudflare Workers",
          },
          {
            name: "DreamChamber",
            ...dreamchamber,
            location: "GOD.local:7777",
          },
          {
            name: "Voice Bridge",
            ...voiceBridge,
            location: "GOD.local:8080",
          },
          {
            name: "noizy.ai",
            status: "not deployed",
            ok: false,
            location: "Cloudflare Workers (pending)",
          },
        ];

        const lines = [
          "**CB01 — Deploy Status**",
          "",
          ...services.map(
            (s) =>
              `${s.ok ? "✓" : "✗"} **${s.name}** — ${s.ok ? `UP (${s.latency}ms)` : s.error || s.status || "DOWN"} @ ${s.location}`,
          ),
        ];

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      case "cb01_health_check": {
        const endpoints = [
          `${HEAVEN_URL}/health`,
          `${HEAVEN_URL}/gabriel`,
          "http://localhost:7777/health",
          "http://localhost:8080/health",
        ];

        const results = await Promise.all(endpoints.map(checkEndpoint));
        const lines = [
          "**CB01 — Health Check**",
          "",
          ...results.map(
            (r) =>
              `${r.ok ? "✓" : "✗"} ${r.url} → ${r.ok ? `${r.status} (${r.latency}ms)` : r.error || `${r.status}`}`,
          ),
          "",
          `Healthy: ${results.filter((r) => r.ok).length}/${results.length}`,
        ];

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      case "cb01_smoke_test": {
        const smokeTestPath = join(PROJECT_ROOT, "smoke_test.sh");
        if (!existsSync(smokeTestPath)) {
          return {
            content: [
              { type: "text", text: "⚠ smoke_test.sh not found at project root" },
            ],
          };
        }

        try {
          const output = execSync(`bash ${smokeTestPath}`, {
            cwd: PROJECT_ROOT,
            timeout: 60000,
            encoding: "utf8",
          });
          return {
            content: [
              {
                type: "text",
                text: `**CB01 — Smoke Tests**\n\n✓ PASSED\n\n\`\`\`\n${output.slice(-2000)}\n\`\`\``,
              },
            ],
          };
        } catch (err) {
          return {
            content: [
              {
                type: "text",
                text: `**CB01 — Smoke Tests**\n\n✗ FAILED\n\n\`\`\`\n${(err.stdout || err.message).slice(-2000)}\n\`\`\``,
              },
            ],
            isError: true,
          };
        }
      }

      case "cb01_godaddy_checklist": {
        const lines = [
          "**CB01 — GoDaddy Exit Checklist**",
          "",
          "✗ Step 0: Change CF login to backend email (MANUAL — Dashboard)",
          "✗ Step 1: Transfer domains to Cloudflare Registrar",
          "✗ Step 2: Verify DNS propagation and email routing",
          "✗ Step 3: Cancel GoDaddy account",
          "",
          "⚠ BLOCKED on Step 0 — requires manual Cloudflare Dashboard action.",
          "CF login must use backend email (rsplowman@icloud.com), not public contact.",
          "Public contact remains: rsp@noizyfish.com (routes to backend via CF Email Routing)",
        ];

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      case "cb01_env_check": {
        const checks = [
          {
            name: ".env file",
            ok: existsSync(join(PROJECT_ROOT, ".env")),
          },
          {
            name: "node_modules",
            ok: existsSync(join(PROJECT_ROOT, "node_modules")),
          },
          {
            name: "wrangler.toml",
            ok: existsSync(join(PROJECT_ROOT, "wrangler.toml")),
          },
          {
            name: "package.json",
            ok: existsSync(join(PROJECT_ROOT, "package.json")),
          },
          {
            name: "smoke_test.sh",
            ok: existsSync(join(PROJECT_ROOT, "smoke_test.sh")),
          },
          {
            name: "schema.sql",
            ok: existsSync(join(PROJECT_ROOT, "schema.sql")),
          },
        ];

        const lines = [
          "**CB01 — Environment Check**",
          "",
          ...checks.map((c) => `${c.ok ? "✓" : "✗"} ${c.name}`),
          "",
          `Environment: ${checks.filter((c) => c.ok).length}/${checks.length} OK`,
        ];

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      case "cb01_status": {
        const health = await checkEndpoint(`${HEAVEN_URL}/health`);
        const hasEnv = existsSync(join(PROJECT_ROOT, ".env"));

        const lines = [
          "**CB01 STATUS**",
          "",
          `Heaven: ${health.ok ? "✓ UP" : "✗ DOWN"}`,
          `Environment: ${hasEnv ? "✓" : "✗ .env missing"}`,
          `GoDaddy exit: BLOCKED (Step 0)`,
          "",
          "Standing by for ops.",
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
