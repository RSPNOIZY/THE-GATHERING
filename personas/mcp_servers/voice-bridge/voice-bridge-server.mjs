#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// NOIZY Voice Bridge — MCP Server (stdio transport)
//
// Exposes voice commands, Claude tower routing, system status,
// and webhook management as MCP tools for Claude Code/Desktop.
//
// ALL logging goes to stderr. stdout is reserved for JSON-RPC.
//
// Usage:
//   claude mcp add noizy-voice-bridge -- node /path/to/voice-bridge-server.mjs
//   claude mcp list
//
// Author: RSP_001 (Robert Stephen Plowman)
// ═══════════════════════════════════════════════════════════════

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { execFile, exec } from "node:child_process";
import { promisify } from "node:util";
import { readFileSync, existsSync } from "node:fs";

const execAsync = promisify(exec);
const log = (msg) => process.stderr.write(`[VoiceBridge] ${msg}\n`);

// ── Config ──────────────────────────────────────────────────
const HEAVEN_URL = process.env.HEAVEN_URL || "https://heaven.rsp-5f3.workers.dev";
const DREAMCHAMBER_URL = process.env.DREAMCHAMBER_URL || "http://localhost:7777";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || "";
const PIPELINE_DIR = "/Users/m2ultra/NOIZYLAB/voice-pipeline";

// ── Claude Tower Definitions ────────────────────────────────
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

// ── Helper: Call Claude API ─────────────────────────────────
async function callClaudeTower(text, tower = "max") {
  if (!ANTHROPIC_KEY) throw new Error("ANTHROPIC_API_KEY not set");
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

// ── Helper: Call Gabriel ────────────────────────────────────
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

// ── Helper: Check Heaven health ─────────────────────────────
async function checkHeaven() {
  try {
    const res = await fetch(`${HEAVEN_URL}/health`, {
      headers: { "User-Agent": "GORUNFREE/1.0" },
      signal: AbortSignal.timeout(5000),
    });
    return await res.json();
  } catch (e) {
    return { status: "UNREACHABLE", error: e.message };
  }
}

// ── Helper: Shell command ───────────────────────────────────
async function runCommand(cmd, timeoutMs = 30000) {
  const { stdout, stderr } = await execAsync(cmd, {
    maxBuffer: 1024 * 1024,
    timeout: timeoutMs,
  });
  return (stdout || stderr).trim();
}

// ═══════════════════════════════════════════════════════════════
// MCP SERVER
// ═══════════════════════════════════════════════════════════════

const server = new McpServer({
  name: "noizy-voice-bridge",
  version: "1.0.0",
});

// ── Tool: voice_command ─────────────────────────────────────
server.tool(
  "voice_command",
  "Execute a voice command in the NOIZY Empire. Commands: gabriel, claude, deploy, status, dreamchamber",
  {
    command: z
      .enum(["gabriel", "claude", "deploy", "dreamchamber", "status"])
      .describe("Voice command to execute"),
    text: z.string().optional().describe("Text input for commands that need it (gabriel, claude)"),
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
          return { content: [{ type: "text", text: "Error: claude command requires text input" }] };
        const t = tower || detectTower(text);
        const result = await callClaudeTower(text, t);
        return { content: [{ type: "text", text: `[Claude ${t.toUpperCase()}]\n${result}` }] };
      }

      case "deploy": {
        const result = await runCommand(
          "cd /Users/m2ultra/NOIZYANTHROPIC && npx wrangler deploy --config noizy-landing/wrangler.toml 2>&1",
          60000,
        );
        return { content: [{ type: "text", text: `Deploy result:\n${result}` }] };
      }

      case "dreamchamber": {
        const result = await runCommand(
          "cd /Users/m2ultra/NOIZYLAB/dreamchamber && docker compose up -d 2>&1",
        );
        return { content: [{ type: "text", text: `DreamChamber: ${result}` }] };
      }

      case "status": {
        const health = await checkHeaven();
        let localStatus = "unknown";
        try {
          localStatus = await runCommand(
            "docker ps --format '{{.Names}}: {{.Status}}' 2>/dev/null; pm2 status 2>/dev/null || true",
          );
        } catch {
          localStatus = "docker/pm2 not running";
        }
        return {
          content: [
            {
              type: "text",
              text: `HEAVEN: ${JSON.stringify(health, null, 2)}\n\nLocal:\n${localStatus}`,
            },
          ],
        };
      }
    }
  },
);

// ── Tool: claude_tower ──────────────────────────────────────
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

// ── Tool: system_status ─────────────────────────────────────
server.tool(
  "system_status",
  "Get comprehensive NOIZY Empire system status: Heaven API, local services, git, hardware",
  {},
  async () => {
    log("system_status check");
    const checks = {};

    // Heaven
    checks.heaven = await checkHeaven();

    // Local services
    try {
      const n8n = await fetch("http://localhost:5678/healthz", {
        signal: AbortSignal.timeout(3000),
      });
      checks.n8n = { status: n8n.ok ? "running" : "error", code: n8n.status };
    } catch {
      checks.n8n = { status: "not running" };
    }

    try {
      const ollama = await fetch("http://localhost:11434/api/tags", {
        signal: AbortSignal.timeout(3000),
      });
      const data = await ollama.json();
      checks.ollama = { status: "running", models: data.models?.length || 0 };
    } catch {
      checks.ollama = { status: "not running" };
    }

    // Git
    try {
      const branch = await runCommand(
        "cd /Users/m2ultra/NOIZYANTHROPIC && git branch --show-current",
      );
      const status = await runCommand(
        "cd /Users/m2ultra/NOIZYANTHROPIC && git status --porcelain | wc -l",
      );
      checks.git = { branch, uncommitted_files: parseInt(status.trim()) };
    } catch {
      checks.git = { error: "not a git repo" };
    }

    // Hardware
    try {
      const mem = await runCommand("sysctl -n hw.memsize");
      const cpu = await runCommand("sysctl -n machdep.cpu.brand_string");
      checks.hardware = { cpu: cpu.trim(), ram_gb: Math.round(parseInt(mem) / 1073741824) };
    } catch {
      checks.hardware = { error: "unknown" };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(checks, null, 2),
        },
      ],
    };
  },
);

// ── Tool: heaven_query ──────────────────────────────────────
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
      headers: { "User-Agent": "GORUNFREE/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  },
);

// ── Tool: run_script ────────────────────────────────────────
server.tool(
  "run_script",
  "Run a NOIZY Empire operational script (deploy, smoke test, status, DR drill, etc.)",
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
      .describe("Script to run"),
  },
  async ({ script }) => {
    log(`run_script: ${script}`);
    const scriptPath = `/Users/m2ultra/NOIZYANTHROPIC/scripts/${script}.sh`;
    if (!existsSync(scriptPath)) {
      return { content: [{ type: "text", text: `Script not found: ${scriptPath}` }] };
    }
    const result = await runCommand(`bash ${scriptPath} 2>&1`, 120000);
    return { content: [{ type: "text", text: result }] };
  },
);

// ── Helper: Auto-detect tower ───────────────────────────────
function detectTower(text) {
  const t = text.toLowerCase();
  if (/build|code|deploy|script|api|worker|function|install|git/.test(t)) return "code";
  if (/task|assign|route|crew|channel|delegate|schedule|team/.test(t)) return "work";
  return "max";
}

// ═══════════════════════════════════════════════════════════════
// CONNECT
// ═══════════════════════════════════════════════════════════════

const transport = new StdioServerTransport();
await server.connect(transport);

log("MCP stdio server ready — 6 tools registered");
log(`HEAVEN: ${HEAVEN_URL}`);
log(`DreamChamber: ${DREAMCHAMBER_URL}`);
log(`Anthropic API key: ${ANTHROPIC_KEY ? "present" : "NOT SET"}`);
