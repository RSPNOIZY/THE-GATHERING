#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// NOIZY Voice Bridge — Cloud Run HTTP MCP Mirror
//
// Same tool contract as mcp/voice-bridge/voice-bridge-server.mjs
// Serves over HTTP (SSE + Streamable HTTP transport) for Cloud Run.
//
// OPERATOR RULES:
//   - local MCP (stdio) = default lane, always on
//   - this server = remote mirror, disabled by default in opencode.json
//   - one boolean flip in config enables it for a session
//   - same tool names, same input/output schemas, same payloads
//   - auth required (Bearer token via NOIZY_BRIDGE_TOKEN env var)
//   - no mutations that the local server cannot also perform
//
// Cloud Run: request-invocable, scales to zero, private by default
// Min instances = 1 recommended when low-latency remote mirror matters
//
// Author: RSP_001 (Robert Stephen Plowman)
// ═══════════════════════════════════════════════════════════════

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { createServer } from "node:http";

const execAsync = promisify(exec);

// ── Logging ─────────────────────────────────────────────────
// In Cloud Run all stderr/stdout goes to Cloud Logging automatically
const log = (msg) => console.error(`[VoiceBridgeHTTP] ${msg}`);

// ── Config ──────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || "8080", 10);
const BRIDGE_TOKEN = process.env.NOIZY_BRIDGE_TOKEN || "";
const HEAVEN_URL = process.env.HEAVEN_URL || "https://heaven.rsp-5f3.workers.dev";
const DREAMCHAMBER_URL = process.env.DREAMCHAMBER_URL || "http://host.docker.internal:7777";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || "";

if (!BRIDGE_TOKEN) {
  log("FATAL: NOIZY_BRIDGE_TOKEN env var is required. Exiting.");
  process.exit(1);
}

// ── Auth middleware ──────────────────────────────────────────
function isAuthorized(req) {
  const auth = req.headers["authorization"] || "";
  if (auth.startsWith("Bearer ")) {
    return auth.slice(7) === BRIDGE_TOKEN;
  }
  // Also accept X-NOIZY-Bridge-Token for operator convenience
  return (req.headers["x-noizy-bridge-token"] || "") === BRIDGE_TOKEN;
}

// ── Claude Tower Definitions (identical to local) ───────────
const TOWERS = {
  max: {
    model: "claude-opus-4-5",
    system:
      "You are Claude Max, strategic lead of NOIZY.AI Dream Chamber. Robert Stephen Plowman of Ottawa, Ontario, Canada is your founder. NOIZY.AI builds a premium voice library fighting for fair compensation for AI and human voice actors. Be direct and strategic.",
  },
  code: {
    model: "claude-sonnet-4-5",
    system:
      "You are Claude Code for NOIZY.AI. Build requests come via voice pipeline from Robert on iPhone → M2 Ultra. Give code, commands, concrete steps. Be concise.",
  },
  work: {
    model: "claude-sonnet-4-5",
    system:
      "You are Claude Coworker for NOIZY.AI Dream Chamber. Coordinate crew, delegate tasks, keep things moving. Voice input from Robert via iPhone.",
  },
};

// ── Helpers (identical contract to local) ───────────────────
async function callClaudeTower(text, tower = "max") {
  if (!ANTHROPIC_KEY) throw new Error("ANTHROPIC_API_KEY not set in Cloud Run env");
  const t = TOWERS[tower] || TOWERS.max;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: t.model,
      max_tokens: 1024,
      system: t.system,
      messages: [{ role: "user", content: text }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `Claude API ${res.status}`);
  return data.content?.[0]?.text || "No response";
}

async function callGabriel(input) {
  const res = await fetch(`${DREAMCHAMBER_URL}/api/gabriel/speak`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input, voice: true }),
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json();
  return data.gabriel || data.error || "Gabriel unavailable";
}

async function checkHeaven() {
  try {
    const res = await fetch(`${HEAVEN_URL}/health`, {
      headers: { "User-Agent": "VoiceBridgeHTTP/1.0" },
      signal: AbortSignal.timeout(5000),
    });
    return await res.json();
  } catch (e) {
    return { status: "UNREACHABLE", error: e.message };
  }
}

function detectTower(text) {
  const t = text.toLowerCase();
  if (/build|code|deploy|script|api|worker|function|install|git/.test(t)) return "code";
  if (/task|assign|route|crew|channel|delegate|schedule|team/.test(t)) return "work";
  return "max";
}

// ═══════════════════════════════════════════════════════════════
// MCP SERVER — identical tool contract to local stdio server
// ═══════════════════════════════════════════════════════════════

function buildMcpServer() {
  const server = new McpServer({
    name: "noizy-voice-bridge-http",
    version: "1.0.0",
  });

  // ── Tool: voice_command ───────────────────────────────────
  server.tool(
    "voice_command",
    "Execute a voice command in the NOIZY Empire. Commands: gabriel, claude, deploy, status, dreamchamber",
    {
      command: z
        .enum(["gabriel", "claude", "deploy", "dreamchamber", "status"])
        .describe("Voice command to execute"),
      text: z
        .string()
        .optional()
        .describe("Text input for commands that need it (gabriel, claude)"),
      tower: z
        .enum(["max", "code", "work"])
        .optional()
        .describe("Claude tower selection (default: auto-detect)"),
    },
    async ({ command, text, tower }) => {
      log(`voice_command: ${command} (tower=${tower || "auto"})`);
      switch (command) {
        case "gabriel": {
          if (!text)
            return {
              content: [{ type: "text", text: "Error: gabriel command requires text input" }],
            };
          const result = await callGabriel(text);
          return { content: [{ type: "text", text: result }] };
        }
        case "claude": {
          if (!text)
            return {
              content: [{ type: "text", text: "Error: claude command requires text input" }],
            };
          const t = tower || detectTower(text);
          const result = await callClaudeTower(text, t);
          return { content: [{ type: "text", text: `[Claude ${t.toUpperCase()}]\n${result}` }] };
        }
        case "deploy": {
          // Remote: report-only — no shell exec on Cloud Run for deploy
          return {
            content: [
              {
                type: "text",
                text: "Deploy must be triggered from local operator. Remote mirror is read-only for deploy commands.",
              },
            ],
          };
        }
        case "dreamchamber": {
          return {
            content: [
              {
                type: "text",
                text: "DreamChamber control is local-only. Remote mirror cannot start Docker services.",
              },
            ],
          };
        }
        case "status": {
          const health = await checkHeaven();
          return {
            content: [
              {
                type: "text",
                text: `HEAVEN: ${JSON.stringify(health, null, 2)}\n\nRemote mirror: Cloud Run (no local docker/pm2 access)`,
              },
            ],
          };
        }
        default:
          return { content: [{ type: "text", text: `Unknown command: ${command}` }] };
      }
    },
  );

  // ── Tool: claude_tower ────────────────────────────────────
  server.tool(
    "claude_tower",
    "Send a message directly to a specific Claude tower (Max, Code, or Coworker)",
    {
      text: z.string().min(1).describe("Message to send"),
      tower: z
        .enum(["max", "code", "work"])
        .default("max")
        .describe("Tower: max (strategy), code (build), work (crew tasks)"),
    },
    async ({ text, tower }) => {
      log(`claude_tower: ${tower}`);
      const result = await callClaudeTower(text, tower);
      return { content: [{ type: "text", text: result }] };
    },
  );

  // ── Tool: system_status ───────────────────────────────────
  server.tool(
    "system_status",
    "Get NOIZY Empire system status: Heaven API health, remote mirror info",
    {},
    async () => {
      log("system_status check");
      const checks = {};

      checks.heaven = await checkHeaven();
      checks.remote_mirror = {
        transport: "Cloud Run HTTP",
        region: process.env.CLOUD_RUN_REGION || "us-central1",
        revision: process.env.K_REVISION || "unknown",
        service: process.env.K_SERVICE || "noizy-voice-bridge",
        note: "Local services (docker/pm2/n8n/ollama) not accessible from remote mirror",
      };

      // n8n reachability from Cloud Run (only if DREAMCHAMBER_URL points externally)
      try {
        const n8n = await fetch(`${DREAMCHAMBER_URL.replace("/api/gabriel/speak", "")}/health`, {
          signal: AbortSignal.timeout(3000),
        });
        checks.dreamchamber = { status: n8n.ok ? "reachable" : "error", code: n8n.status };
      } catch {
        checks.dreamchamber = { status: "not reachable from remote" };
      }

      return { content: [{ type: "text", text: JSON.stringify(checks, null, 2) }] };
    },
  );

  // ── Tool: heaven_query ────────────────────────────────────
  server.tool(
    "heaven_query",
    "Query the HEAVEN consent kernel API. Get actors, consent tokens, ledger events, stats",
    {
      endpoint: z
        .string()
        .describe("API path, e.g. /api/v1/actors, /api/v1/stats, /health, /api/v1/ledger"),
    },
    async ({ endpoint }) => {
      log(`heaven_query: ${endpoint}`);
      const url = `${HEAVEN_URL}${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`;
      const res = await fetch(url, {
        headers: { "User-Agent": "VoiceBridgeHTTP/1.0" },
        signal: AbortSignal.timeout(10000),
      });
      const data = await res.json();
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  );

  // ── Tool: run_script ──────────────────────────────────────
  // Remote mirror: read-only — returns manifest of available scripts,
  // does not execute shell commands on Cloud Run.
  server.tool(
    "run_script",
    "Returns manifest of NOIZY Empire operational scripts. Remote mirror cannot execute scripts — trigger from local operator.",
    {
      script: z
        .enum([
          "smoke-test",
          "full-status",
          "deploy-readiness",
          "ethics-gate",
          "empire-boot",
          "production-gate",
          "wrangler-doctor",
        ])
        .describe("Script to inspect"),
    },
    async ({ script }) => {
      log(`run_script (manifest-only): ${script}`);
      return {
        content: [
          {
            type: "text",
            text: [
              `Script: ${script}`,
              `Path: /Users/m2ultra/NOIZYANTHROPIC/scripts/${script}.sh`,
              ``,
              `Remote mirror cannot execute local scripts.`,
              `Run this from your local operator session:`,
              `  bash /Users/m2ultra/NOIZYANTHROPIC/scripts/${script}.sh`,
            ].join("\n"),
          },
        ],
      };
    },
  );

  return server;
}

// ═══════════════════════════════════════════════════════════════
// HTTP SERVER
// ═══════════════════════════════════════════════════════════════

const httpServer = createServer(async (req, res) => {
  // Health check — unauthenticated, required by Cloud Run
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        service: "noizy-voice-bridge-http",
        version: "1.0.0",
        transport: "StreamableHTTP",
        revision: process.env.K_REVISION || "local",
      }),
    );
    return;
  }

  // All MCP endpoints require auth
  if (!isAuthorized(req)) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Unauthorized. Bearer token required." }));
    return;
  }

  // MCP endpoint
  if (req.url === "/mcp" || req.url === "/") {
    const server = buildMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
    });

    await server.connect(transport);

    // Collect body
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks).toString();

    await transport.handleRequest(req, res, body ? JSON.parse(body) : undefined);
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found", paths: ["/health", "/mcp"] }));
});

httpServer.listen(PORT, () => {
  log(`Cloud Run HTTP MCP mirror listening on :${PORT}`);
  log(`HEAVEN: ${HEAVEN_URL}`);
  log(`DreamChamber: ${DREAMCHAMBER_URL}`);
  log(`Auth: ${BRIDGE_TOKEN ? "token set" : "NO TOKEN — will reject all requests"}`);
  log(`5 tools registered (same contract as local stdio server)`);
});

// Graceful shutdown for Cloud Run SIGTERM
process.on("SIGTERM", () => {
  log("SIGTERM received — shutting down gracefully");
  httpServer.close(() => {
    log("Server closed");
    process.exit(0);
  });
});
