#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════
// NOIZY Voice Bridge — MCP Server (stdio) + HTTP Server (dual-mode)
//
// MCP mode (default):  node voice-bridge-server.js
//   - Communicates via JSON-RPC on stdin/stdout
//   - ALL logging goes to stderr
//
// HTTP mode:           node voice-bridge-server.js --http
//                      HTTP_MODE=1 node voice-bridge-server.js
//   - Express server on port 8080 (original behavior)
// ══════════════════════════════════════════════════════════════════════════

const { exec, execFile } = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const http = require("http");

// ── Logging — NEVER use console.log (it writes to stdout, breaking MCP) ──
function log(msg) { process.stderr.write(`[VoiceBridge] ${msg}\n`); }
function logWarn(msg) { process.stderr.write(`[VoiceBridge WARN] ${msg}\n`); }
function logError(msg) { process.stderr.write(`[VoiceBridge ERROR] ${msg}\n`); }

// ── NOIZY Pipeline Config ──────────────────────────────────
const PIPELINE_DIR  = '/Users/m2ultra/NOIZYLAB/voice-pipeline';
const LOG_DIR       = '/Users/m2ultra/NOIZYLAB/logs/voice-pipeline';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';
try { fs.mkdirSync(LOG_DIR, { recursive: true }); } catch (_) {}

// Security token
const AUTH_TOKEN =
  process.env.VOICE_AUTH_TOKEN || crypto.randomBytes(32).toString("hex");
if (!process.env.VOICE_AUTH_TOKEN) {
  logWarn("VOICE_AUTH_TOKEN not set — using ephemeral token. Set it in .env for persistence.");
}

// DreamChamber Gabriel endpoint
const DREAMCHAMBER_URL = process.env.DREAMCHAMBER_URL || "http://localhost:7777";
const GABRIEL_URL = process.env.DREAMCHAMBER_URL || 'http://localhost:7777';

// ── Shared helpers ──────────────────────────────────────────

async function callGabriel(input, withVoice = true) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ input, voice: withVoice });
    const url = new URL("/api/gabriel/speak", DREAMCHAMBER_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 7777,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error("Invalid Gabriel response")); }
      });
    });
    req.on("error", reject);
    req.setTimeout(30000, () => reject(new Error("Gabriel request timed out")));
    req.write(body);
    req.end();
  });
}

async function callClaudeTower(text, tower = 'max') {
  if (!ANTHROPIC_KEY) throw new Error('ANTHROPIC_API_KEY not set in environment');
  const models = { max: 'claude-opus-4-5', code: 'claude-sonnet-4-5', work: 'claude-sonnet-4-5' };
  const systems = {
    max:  'You are Claude Max, strategic lead of NOIZY.AI Dream Chamber. Robert Stephen Plowman of Ottawa, Ontario, Canada is your founder. NOIZY.AI builds a premium voice library fighting for fair compensation for AI and human voice actors. Be direct and strategic.',
    code: 'You are Claude Code for NOIZY.AI. Build requests come via voice pipeline from Robert on iPhone → M2 Ultra. Give code, commands, concrete steps. Be concise.',
    work: 'You are Claude Coworker for NOIZY.AI Dream Chamber. Coordinate crew, delegate tasks, keep things moving. Voice input from Robert via iPhone Teams.',
  };
  const body = JSON.stringify({
    model: models[tower] || models.max,
    max_tokens: 1024,
    system: systems[tower] || systems.max,
    messages: [{ role: 'user', content: text }]
  });
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `Claude API error ${res.status}`);
  return data.content?.[0]?.text || 'No response';
}

function detectTower(text) {
  const t = text.toLowerCase();
  if (/build|code|deploy|script|api|worker|function|install|git/.test(t)) return 'code';
  if (/task|assign|route|crew|channel|delegate|schedule|team/.test(t)) return 'work';
  return 'max';
}

function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) { logError(`Command error: ${error}`); reject(error); }
      else resolve(stdout || stderr);
    });
  });
}

async function pushToGabriel(key, value) {
  try {
    await fetch(`${GABRIEL_URL}/memcell/${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
  } catch (_) {}
}

function logCommand(userId, command, text, result) {
  const logDir = "/Users/m2ultra/NOIZYLAB/logs/voice-commands";
  try { fs.mkdirSync(logDir, { recursive: true }); } catch (_) {}
  const logEntry = {
    timestamp: new Date().toISOString(),
    userId,
    command,
    text,
    result: result ? String(result).substring(0, 200) : null,
  };
  const logFile = path.join(logDir, `${new Date().toISOString().split("T")[0]}.json`);
  let logs = [];
  try { logs = JSON.parse(fs.readFileSync(logFile, "utf8")); } catch (_) {}
  logs.push(logEntry);
  try { fs.writeFileSync(logFile, JSON.stringify(logs, null, 2)); } catch (_) {}
}

// Voice command mapping
const VOICE_COMMANDS = {
  gabriel: {
    description: "Speak with GABRIEL — AI orchestration layer of the NOIZY Empire",
    needsText: true,
    handler: async (text) => {
      const result = await callGabriel(text, true);
      return result.gabriel || result.error || "Gabriel is unavailable";
    },
  },
  claude: {
    description: "Send text to Claude Max (voice pipeline)",
    needsText: true,
    handler: async (text) => callClaudeTower(text, 'max'),
  },
  "claude-max": {
    description: "Claude Max — strategy, legal, long-form",
    needsText: true,
    handler: async (text) => callClaudeTower(text, 'max'),
  },
  "claude-code": {
    description: "Claude Code — build requests, systems",
    needsText: true,
    handler: async (text) => callClaudeTower(text, 'code'),
  },
  "claude-coworker": {
    description: "Claude Coworker — crew tasks, routing",
    needsText: true,
    handler: async (text) => callClaudeTower(text, 'work'),
  },
  deploy: {
    description: "Deploy HEAVEN Cloudflare Worker",
    script: "bash /Users/m2ultra/NOIZYLAB/deploy.sh",
    notification: "HEAVEN deployment started",
  },
  dreamchamber: {
    description: "Start DreamChamber",
    script: "cd /Users/m2ultra/NOIZYLAB/dreamchamber && docker-compose up -d",
    notification: "DreamChamber starting",
  },
  compare: {
    description: "Compare across AI models",
    workflow: "/Users/m2ultra/NOIZYLAB/workflows/CompareAI.workflow",
    needsText: true,
  },
  status: {
    description: "Check system status",
    script: "docker ps && pm2 status",
    returnOutput: true,
  },
  cascade: {
    description: "Send to Cascade",
    workflow: "/Users/m2ultra/NOIZYLAB/workflows/SendToCascade.workflow",
    needsText: true,
  },
};

// Conversation context storage
const conversationContext = new Map();

// ── Shared voice command executor (returns result string) ───
async function executeVoiceCommand(command, text, userId = "default", source = "mcp") {
  log(`Voice command from ${source} (${userId}): ${command}`);

  // Store context
  const context = conversationContext.get(userId) || [];
  context.push({ command, text, timestamp: Date.now() });
  if (context.length > 10) context.shift();
  conversationContext.set(userId, context);

  const cmd = VOICE_COMMANDS[command.toLowerCase()];
  if (!cmd) {
    return { error: "Unknown command", availableCommands: Object.keys(VOICE_COMMANDS) };
  }

  let result;
  if (cmd.handler) {
    result = await cmd.handler(text);
  } else if (cmd.workflow) {
    const automatorCmd = cmd.needsText && text
      ? `/usr/bin/automator "${cmd.workflow}" -i "${text.replace(/"/g, '\\"')}"`
      : `/usr/bin/automator "${cmd.workflow}"`;
    result = await executeCommand(automatorCmd);
  } else if (cmd.script) {
    result = await executeCommand(cmd.script);
  }

  logCommand(userId, command, text, result);

  return {
    status: "success",
    command,
    result: cmd.returnOutput ? result : (result || cmd.notification || "Command executed"),
    context: context.slice(-3),
  };
}

// ══════════════════════════════════════════════════════════════════════════
// MODE DETECTION
// ══════════════════════════════════════════════════════════════════════════

const HTTP_MODE = process.argv.includes('--http') || process.env.HTTP_MODE === '1';

if (HTTP_MODE) {
  // ════════════════════════════════════════════════════════════════════
  // HTTP / EXPRESS MODE (original server behavior)
  // ════════════════════════════════════════════════════════════════════
  startHttpServer();
} else {
  // ════════════════════════════════════════════════════════════════════
  // MCP STDIO MODE (for Claude Desktop)
  // ════════════════════════════════════════════════════════════════════
  startMcpServer();
}

// ══════════════════════════════════════════════════════════════════════════
// MCP SERVER
// ══════════════════════════════════════════════════════════════════════════

async function startMcpServer() {
  const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
  const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
  const {
    ListToolsRequestSchema,
    CallToolRequestSchema,
  } = require("@modelcontextprotocol/sdk/types.js");

  const server = new Server(
    {
      name: "noizy-voice-bridge",
      version: "2.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // ── List tools ──
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "voice_command",
          description: "Execute a NOIZY voice command (gabriel, claude, claude-max, claude-code, claude-coworker, deploy, dreamchamber, compare, status, cascade)",
          inputSchema: {
            type: "object",
            properties: {
              command: {
                type: "string",
                description: "The voice command to execute",
                enum: Object.keys(VOICE_COMMANDS),
              },
              text: {
                type: "string",
                description: "Text/prompt to pass to the command (required for commands that need text input)",
              },
              userId: {
                type: "string",
                description: "User ID for context tracking",
                default: "mcp-user",
              },
            },
            required: ["command"],
          },
        },
        {
          name: "claude_tower",
          description: "Send a prompt directly to a Claude Tower (max, code, or work). Max = strategy/legal, Code = build/systems, Work = crew/tasks.",
          inputSchema: {
            type: "object",
            properties: {
              text: {
                type: "string",
                description: "The prompt text to send",
              },
              tower: {
                type: "string",
                description: "Which Claude tower to use",
                enum: ["max", "code", "work"],
                default: "max",
              },
            },
            required: ["text"],
          },
        },
        {
          name: "system_status",
          description: "Get NOIZY Voice Bridge system status: available commands, workflows, tower info, API key presence",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "webhook_status",
          description: "Get webhook endpoint status and list of available webhook endpoints",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "voice_workflow",
          description: "Execute a predefined multi-step workflow (full-deploy, morning-routine, ai-analysis)",
          inputSchema: {
            type: "object",
            properties: {
              workflow: {
                type: "string",
                description: "Workflow name to execute",
                enum: ["full-deploy", "morning-routine", "ai-analysis"],
              },
              text: {
                type: "string",
                description: "Text parameter for workflows that need it (e.g., ai-analysis)",
              },
            },
            required: ["workflow"],
          },
        },
      ],
    };
  });

  // ── Call tool ──
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "voice_command": {
          const result = await executeVoiceCommand(
            args.command,
            args.text || "",
            args.userId || "mcp-user",
            "mcp"
          );
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }

        case "claude_tower": {
          const tower = args.tower || detectTower(args.text);
          const result = await callClaudeTower(args.text, tower);
          logCommand("mcp-user", `claude-${tower}`, args.text, result);
          return { content: [{ type: "text", text: result }] };
        }

        case "system_status": {
          const status = {
            status: "online",
            mode: "mcp-stdio",
            availableCommands: Object.entries(VOICE_COMMANDS).map(([n, cmd]) => ({
              name: n,
              description: cmd.description,
              needsText: cmd.needsText || false,
            })),
            workflows: ["full-deploy", "morning-routine", "ai-analysis"],
            towers: [
              { id: 'max',  name: 'Claude Max',      model: 'claude-opus-4-5',   role: 'Strategy / Legal / Long-form' },
              { id: 'code', name: 'Claude Code',     model: 'claude-sonnet-4-5', role: 'Build / Systems / APIs' },
              { id: 'work', name: 'Claude Coworker', model: 'claude-sonnet-4-5', role: 'Crew / Tasks / Routing' },
            ],
            pipeline: PIPELINE_DIR,
            gabriel: GABRIEL_URL,
            apiKeyPresent: !!ANTHROPIC_KEY,
          };
          return { content: [{ type: "text", text: JSON.stringify(status, null, 2) }] };
        }

        case "webhook_status": {
          const info = {
            status: 'operational',
            endpoints: [
              'POST /webhook/github',
              'POST /webhook/stripe',
              'POST /webhook/n8n',
              'POST /webhook/zapier',
              'POST /webhook/heaven',
              'POST /power-automate-webhook',
              'POST /voice-command',
            ],
            gabriel: GABRIEL_URL,
            note: "Webhook endpoints are available in HTTP mode (--http flag). In MCP mode, use voice_command tool instead.",
            ts: new Date().toISOString(),
          };
          return { content: [{ type: "text", text: JSON.stringify(info, null, 2) }] };
        }

        case "voice_workflow": {
          const workflows = {
            "full-deploy": [
              { command: "dreamchamber", wait: 5000 },
              { command: "status" },
              { notify: "Deployment complete" },
            ],
            "morning-routine": [
              { command: "status" },
              { script: "cd /Users/m2ultra/NOIZYLAB && git pull" },
              { command: "dreamchamber" },
              { notify: "Morning setup complete" },
            ],
            "ai-analysis": [
              { command: "claude", text: args.text },
              { wait: 2000 },
              { command: "compare", text: args.text },
            ],
          };

          const steps = workflows[args.workflow];
          if (!steps) {
            return { content: [{ type: "text", text: JSON.stringify({ error: "Unknown workflow", available: Object.keys(workflows) }) }] };
          }

          const results = [];
          for (const step of steps) {
            if (step.wait) {
              await new Promise((resolve) => setTimeout(resolve, step.wait));
            } else if (step.script) {
              const result = await executeCommand(step.script);
              results.push({ step: "script", result });
            } else if (step.command) {
              const cmd = VOICE_COMMANDS[step.command];
              if (cmd) {
                if (cmd.handler) {
                  const r = await cmd.handler(step.text || args.text || "");
                  results.push({ step: step.command, result: r });
                } else if (cmd.workflow || cmd.script) {
                  const r = await executeCommand(
                    cmd.workflow
                      ? `/usr/bin/automator "${cmd.workflow}" ${step.text ? `-i "${step.text}"` : ""}`
                      : cmd.script
                  );
                  results.push({ step: step.command, result: r });
                }
              }
            } else if (step.notify) {
              results.push({ notification: step.notify });
            }
          }

          return { content: [{ type: "text", text: JSON.stringify({ workflow: args.workflow, results }, null, 2) }] };
        }

        default:
          return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
      }
    } catch (error) {
      logError(`Tool ${name} error: ${error.message}`);
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
  });

  // Connect via stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log("MCP stdio server started — waiting for JSON-RPC on stdin");
}

// ══════════════════════════════════════════════════════════════════════════
// HTTP / EXPRESS SERVER (original behavior, activated with --http)
// ══════════════════════════════════════════════════════════════════════════

function startHttpServer() {
  const express = require("express");
  const bodyParser = require("body-parser");

  const app = express();
  app.use(bodyParser.json());

  // Auth middleware
  app.use((req, res, next) => {
    if (req.path === "/health") return next();
    const token = req.headers["authorization"];
    if (!token || token !== `Bearer ${AUTH_TOKEN}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  });

  // Voice command endpoint
  app.post("/voice-command", async (req, res) => {
    const { command, text, userId = "default", source = "power-automate" } = req.body;
    try {
      const result = await executeVoiceCommand(command, text, userId, source);
      if (result.error) return res.status(400).json(result);
      res.json(result);
    } catch (error) {
      res.status(500).json({ status: "error", command, error: error.message });
    }
  });

  // Voice workflow endpoint
  app.post("/voice-workflow", async (req, res) => {
    const { workflow, parameters = {}, userId = "default" } = req.body;
    const workflows = {
      "full-deploy": [
        { command: "dreamchamber", wait: 5000 },
        { command: "status" },
        { notify: "Deployment complete" },
      ],
      "morning-routine": [
        { command: "status" },
        { script: "cd /Users/m2ultra/NOIZYLAB && git pull" },
        { command: "dreamchamber" },
        { notify: "Morning setup complete" },
      ],
      "ai-analysis": [
        { command: "claude", text: parameters.text },
        { wait: 2000 },
        { command: "compare", text: parameters.text },
      ],
    };
    const steps = workflows[workflow];
    if (!steps) return res.status(400).json({ error: "Unknown workflow" });

    const results = [];
    for (const step of steps) {
      if (step.wait) {
        await new Promise((resolve) => setTimeout(resolve, step.wait));
      } else if (step.script) {
        const result = await executeCommand(step.script);
        results.push({ step: "script", result });
      } else if (step.command) {
        const cmd = VOICE_COMMANDS[step.command];
        if (cmd && (cmd.workflow || cmd.script)) {
          const result = await executeCommand(
            cmd.workflow
              ? `/usr/bin/automator "${cmd.workflow}" ${step.text ? `-i "${step.text}"` : ""}`
              : cmd.script
          );
          results.push({ step: step.command, result });
        }
      } else if (step.notify) {
        results.push({ notification: step.notify });
      }
    }
    res.json({ workflow, results });
  });

  // Power Automate webhook
  app.post("/power-automate-webhook", async (req, res) => {
    const body = req.body;
    if (body.tower && body.response) {
      const { tower, response, prompt, source, ts } = body;
      log(`[Pipeline] Response from Claude ${tower} via ${source}`);
      logCommand('pipeline', `claude-${tower}`, prompt || '', response);
      return res.json({ status: 'received', tower, source, ts });
    }
    if (body.transcript || body.text) {
      const text = body.transcript || body.text;
      const tower = body.tower || detectTower(text);
      const result = await callClaudeTower(text, tower);
      return res.json({ status: 'success', tower, result });
    }
    const { value } = body;
    if (value && value.voice_command) {
      try {
        const result = await executeVoiceCommand(value.voice_command, value.voice_text, value.user_id || 'power-automate', 'power-automate');
        return res.json(result);
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }
    res.status(400).json({ error: 'Invalid format', accepted: ['tower+response', 'transcript', 'value.voice_command'] });
  });

  // Claude direct endpoint
  app.post('/claude', async (req, res) => {
    const { text, prompt, tower = 'max', userId = 'direct' } = req.body;
    const input = text || prompt;
    if (!input) return res.status(400).json({ error: 'text or prompt required' });
    try {
      const result = await callClaudeTower(input, tower);
      logCommand(userId, `claude-${tower}`, input, result);
      res.json({ status: 'success', tower, result });
    } catch(e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Claude towers status
  app.get('/claude-towers', (req, res) => {
    res.json({
      towers: [
        { id: 'max',  name: 'Claude Max',      model: 'claude-opus-4-5',   role: 'Strategy / Legal / Long-form' },
        { id: 'code', name: 'Claude Code',     model: 'claude-sonnet-4-5', role: 'Build / Systems / APIs' },
        { id: 'work', name: 'Claude Coworker', model: 'claude-sonnet-4-5', role: 'Crew / Tasks / Routing' },
      ],
      pipeline: PIPELINE_DIR,
      bridge: 'http://GOD.local:8080',
      apiKeyPresent: !!ANTHROPIC_KEY,
    });
  });

  // Status endpoint
  app.get("/status", (req, res) => {
    res.json({
      status: "online",
      mode: "http",
      availableCommands: Object.entries(VOICE_COMMANDS).map(([name, cmd]) => ({
        name,
        description: cmd.description,
        needsText: cmd.needsText || false,
      })),
      workflows: ["full-deploy", "morning-routine", "ai-analysis"],
    });
  });

  // Health check
  app.get("/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // ── Webhook endpoints ──────────────────────────────────────

  app.post('/webhook/github', async (req, res) => {
    const event = req.headers['x-github-event'] || 'unknown';
    const delivery = req.headers['x-github-delivery'] || 'unknown';
    const payload = req.body;
    const summary = {
      push: () => `${payload.pusher?.name} pushed ${payload.commits?.length || 0} commit(s) to ${payload.ref?.replace('refs/heads/','')}`,
      pull_request: () => `PR #${payload.number} ${payload.action}: ${payload.pull_request?.title}`,
      release: () => `Release ${payload.action}: ${payload.release?.tag_name}`,
      workflow_run: () => `Workflow "${payload.workflow_run?.name}" ${payload.action}`,
      issues: () => `Issue #${payload.issue?.number} ${payload.action}: ${payload.issue?.title}`,
    }[event]?.() || `GitHub event: ${event}`;
    log(`[GitHub Webhook] ${event} | ${summary}`);
    await pushToGabriel(`webhook:github:${delivery}`, { event, summary, repo: payload.repository?.full_name, ts: new Date().toISOString() });
    logCommand('github-webhook', event, summary, 'received');
    res.json({ received: true, event, summary });
  });

  app.post('/webhook/stripe', async (req, res) => {
    const eventType = req.body.type || 'unknown';
    const data = req.body.data?.object || {};
    const summaries = {
      'payment_intent.succeeded': `Payment received: $${((data.amount || 0) / 100).toFixed(2)}`,
      'invoice.paid':             `Invoice paid: $${((data.amount_paid || 0) / 100).toFixed(2)}`,
      'customer.subscription.created': `New subscription: ${data.plan?.nickname || data.id}`,
      'customer.subscription.deleted': `Subscription cancelled: ${data.id}`,
      'checkout.session.completed':    `Checkout complete: $${((data.amount_total || 0) / 100).toFixed(2)}`,
    };
    const summary = summaries[eventType] || `Stripe event: ${eventType}`;
    log(`[Stripe Webhook] ${eventType} | ${summary}`);
    await pushToGabriel(`webhook:stripe:${req.body.id || 'evt'}`, { event: eventType, summary, livemode: req.body.livemode, ts: new Date().toISOString() });
    res.json({ received: true, event: eventType, summary });
  });

  app.post('/webhook/n8n', async (req, res) => {
    const { workflow, event, data, session_id } = req.body;
    const summary = `n8n: ${workflow || 'unknown'} → ${event || 'trigger'}`;
    log(`[n8n Webhook] ${summary}`);
    await pushToGabriel(`webhook:n8n:${session_id || Date.now()}`, { workflow, event, data, summary, ts: new Date().toISOString() });
    if (event === 'voice.command' && data?.text) {
      const tower = detectTower(data.text);
      try {
        const result = await callClaudeTower(data.text, tower);
        return res.json({ received: true, summary, response: result, tower });
      } catch (e) {
        return res.json({ received: true, summary, error: e.message });
      }
    }
    res.json({ received: true, summary, workflow, event });
  });

  app.post('/webhook/zapier', async (req, res) => {
    const { zap_name, event, data } = req.body;
    const summary = `Zapier: ${zap_name || 'unknown'} → ${event || 'trigger'}`;
    log(`[Zapier Webhook] ${summary}`);
    await pushToGabriel(`webhook:zapier:${Date.now()}`, { zap_name, event, data, summary, ts: new Date().toISOString() });
    res.json({ received: true, summary });
  });

  app.post('/webhook/heaven', async (req, res) => {
    const { source, event: eventType, summary, ...rest } = req.body;
    const key = `webhook:heaven:${source}:${Date.now()}`;
    log(`[Heaven Webhook] ${source}/${eventType}: ${summary}`);
    await pushToGabriel(key, { source, event: eventType, summary, ...rest, ts: new Date().toISOString() });
    if (source === 'consent' && (eventType === 'consent.revoke' || eventType === 'never_clause.triggered')) {
      try { execFile('/usr/bin/say', ['-v', 'Daniel', `Consent alert: ${summary}`]); } catch (_) {}
    }
    res.json({ received: true, source, event: eventType });
  });

  app.get('/webhooks', (req, res) => {
    res.json({
      status: 'operational',
      endpoints: [
        'POST /webhook/github', 'POST /webhook/stripe', 'POST /webhook/n8n',
        'POST /webhook/zapier', 'POST /webhook/heaven',
        'POST /power-automate-webhook', 'POST /voice-command',
      ],
      gabriel: GABRIEL_URL,
      ts: new Date().toISOString()
    });
  });

  // Start
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, "0.0.0.0", () => {
    log(`HTTP server running on http://GOD.local:${PORT}`);
    log(`Auth Token: ${AUTH_TOKEN.substring(0, 8)}... (set VOICE_AUTH_TOKEN env var to pin this)`);
    log("Ready to receive voice commands from Power Automate");
  });
}
