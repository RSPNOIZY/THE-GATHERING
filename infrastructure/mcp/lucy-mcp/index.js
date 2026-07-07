#!/usr/bin/env node
/**
 * LUCY MCP Server — v2.0
 * DAZEFLOW Keeper · Task Log · Session Index · INTAKE PIPELINE · NOIZY Empire
 *
 * Role: Organization agent + data intake filter.
 * 1 day = 1 chat = 1 truth.
 *
 * ORIGINAL TOOLS (v1):
 *   lucy_dazeflow_today   — Get or open today's DAZEFLOW session
 *   lucy_dazeflow_log     — Append an entry to today's session
 *   lucy_dazeflow_close   — Close today's session with a summary
 *   lucy_dazeflow_history — List past sessions
 *   lucy_task_list        — Get open tasks
 *   lucy_task_add         — Add a task
 *   lucy_task_done        — Mark a task complete
 *   lucy_task_drop        — Drop/cancel a task
 *   lucy_memcell_list     — List GABRIEL memcells from Heaven
 *   lucy_memcell_write    — Write a new GABRIEL memcell
 *   lucy_status           — Full Lucy status snapshot
 *
 * INTAKE PIPELINE TOOLS (v2):
 *   lucy_intake_receive   — Catch incoming data from any source with metadata
 *   lucy_intake_classify  — Classify intent and route recommendation
 *   lucy_intake_synthesize — Merge multiple responses into coherent output
 *   lucy_intake_archive   — Archive prompt/response with full provenance
 *   lucy_intake_search    — Search the archive by keyword, date, agent, type
 *   lucy_intake_queue     — Queue item for deferred processing
 *   lucy_intake_status    — Pipeline health and queue depth
 *
 * State: ~/NOIZYLAB/lucy-state/
 *   dazeflow.json  — session log
 *   tasks.json     — task list
 *   intake.json    — intake queue + archive index
 *   archive/       — full provenance records (one JSON per item)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
} from "fs";
import { join } from "path";
import { homedir } from "os";
import { randomBytes } from "crypto";

// ═══════════════════════════════════════════════════════════════
// STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

const STATE_DIR = join(homedir(), "NOIZYLAB", "lucy-state");
const DAZEFLOW_FILE = join(STATE_DIR, "dazeflow.json");
const TASKS_FILE = join(STATE_DIR, "tasks.json");
const INTAKE_FILE = join(STATE_DIR, "intake.json");
const ARCHIVE_DIR = join(STATE_DIR, "archive");

const HEAVEN_URL =
  process.env.HEAVEN_URL || "https://heaven.rsp-5f3.workers.dev";
const NOIZY_API_KEY = process.env.NOIZY_API_KEY || "";

function ensureState() {
  if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true });
  if (!existsSync(ARCHIVE_DIR)) mkdirSync(ARCHIVE_DIR, { recursive: true });
  if (!existsSync(DAZEFLOW_FILE))
    writeFileSync(
      DAZEFLOW_FILE,
      JSON.stringify({ sessions: [] }, null, 2),
    );
  if (!existsSync(TASKS_FILE))
    writeFileSync(TASKS_FILE, JSON.stringify({ tasks: [] }, null, 2));
  if (!existsSync(INTAKE_FILE))
    writeFileSync(
      INTAKE_FILE,
      JSON.stringify(
        {
          queue: [],
          stats: {
            total_received: 0,
            total_archived: 0,
            total_synthesized: 0,
          },
        },
        null,
        2,
      ),
    );
}

function readJson(file) {
  ensureState();
  return JSON.parse(readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  ensureState();
  writeFileSync(file, JSON.stringify(data, null, 2));
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function now() {
  return new Date().toISOString();
}

function makeId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(3).toString("hex")}`;
}

async function h17(path, method = "GET", body = null) {
  const headers = { "Content-Type": "application/json" };
  if (NOIZY_API_KEY) headers["X-NOIZY-Key"] = NOIZY_API_KEY;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${HEAVEN_URL}${path}`, opts);
  if (!res.ok)
    throw new Error(`Heaven ${method} ${path} → ${res.status}`);
  return res.json();
}

// ═══════════════════════════════════════════════════════════════
// AGENT DISPATCH RULES
// ═══════════════════════════════════════════════════════════════

const AGENT_DISPATCH = {
  build: {
    agent: "gabriel-orchestrator",
    description: "Build, deploy, ship — Gabriel handles execution",
  },
  deploy: {
    agent: "gabriel-orchestrator",
    description: "Deployment operations",
  },
  consent: {
    agent: "consent-auditor",
    description: "Consent kernel, Never Clauses, audit",
  },
  audio: {
    agent: "voice-specialist",
    description: "Voice DNA, TTS, audio pipeline",
  },
  dream: {
    agent: "dream",
    description: "DreamChamber, multi-model, Contact Sequence",
  },
  code: {
    agent: "engr-keith",
    description: "Code review, engineering, architecture",
  },
  test: {
    agent: "test-runner",
    description: "Testing, verification, smoke tests",
  },
  wellbeing: {
    agent: "pops",
    description: "Burnout check, break reminder, grounding",
  },
  burnout: {
    agent: "shirl",
    description: "Burnout detection, care intervention",
  },
  organize: {
    agent: "lucy",
    description: "Tasks, DAZEFLOW, session management",
  },
  creative: {
    agent: "cb01",
    description: "Creative direction, artistic vision",
  },
  query: {
    agent: "gabriel-orchestrator",
    description: "General questions routed through Gabriel",
  },
  review: {
    agent: "engr-keith",
    description: "Code review, PR review",
  },
  security: {
    agent: "consent-auditor",
    description: "Security audit, threat assessment",
  },
  music: {
    agent: "voice-specialist",
    description: "Music production, synthesis",
  },
  strategy: {
    agent: "gabriel-orchestrator",
    description: "Strategic decisions, roadmap",
  },
};

// Intent classification keywords
const INTENT_KEYWORDS = {
  build: [
    "build",
    "create",
    "make",
    "implement",
    "add",
    "write",
    "scaffold",
    "generate",
  ],
  deploy: [
    "deploy",
    "ship",
    "push",
    "release",
    "publish",
    "launch",
    "wrangler",
  ],
  consent: [
    "consent",
    "never clause",
    "kill switch",
    "revoke",
    "token",
    "audit",
    "covenant",
  ],
  audio: [
    "voice",
    "audio",
    "tts",
    "speech",
    "sound",
    "frequency",
    "396",
    "voice dna",
  ],
  dream: [
    "dreamchamber",
    "dream chamber",
    "contact sequence",
    "multi-model",
    "multimodel",
  ],
  code: [
    "code",
    "function",
    "bug",
    "error",
    "fix",
    "refactor",
    "debug",
    "api",
    "endpoint",
  ],
  test: ["test", "smoke", "verify", "check", "validate", "spec", "coverage"],
  wellbeing: ["tired", "break", "rest", "pops", "wisdom", "perspective"],
  burnout: [
    "burned out",
    "burnout",
    "exhausted",
    "frustrated",
    "stuck",
    "shirl",
  ],
  organize: [
    "task",
    "todo",
    "dazeflow",
    "session",
    "organize",
    "plan",
    "schedule",
  ],
  creative: [
    "creative",
    "art",
    "design",
    "visual",
    "aesthetic",
    "brand",
    "landing",
  ],
  review: ["review", "pr", "pull request", "diff", "merge"],
  security: [
    "security",
    "threat",
    "vulnerability",
    "encrypt",
    "key",
    "certificate",
  ],
  music: [
    "music",
    "song",
    "melody",
    "composition",
    "mix",
    "master",
    "produce",
  ],
  strategy: [
    "strategy",
    "roadmap",
    "vision",
    "plan",
    "future",
    "scale",
    "growth",
  ],
};

function classifyIntent(text) {
  const lower = text.toLowerCase();
  const scores = {};

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    scores[intent] = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) scores[intent]++;
    }
  }

  const sorted = Object.entries(scores)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0) {
    return {
      primary: "query",
      confidence: 0.3,
      all: [{ intent: "query", score: 0, agent: "gabriel-orchestrator" }],
    };
  }

  return {
    primary: sorted[0][0],
    confidence: Math.min(sorted[0][1] / 3, 1.0),
    all: sorted.map(([intent, score]) => ({
      intent,
      score,
      agent: AGENT_DISPATCH[intent]?.agent || "gabriel-orchestrator",
    })),
  };
}

// ═══════════════════════════════════════════════════════════════
// MCP SERVER
// ═══════════════════════════════════════════════════════════════

const server = new Server(
  { name: "lucy-mcp", version: "2.0.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // ─── DAZEFLOW TOOLS ───
    {
      name: "lucy_dazeflow_today",
      description:
        "Get or create today's DAZEFLOW session. DAZEFLOW law: 1 day = 1 chat = 1 truth.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "lucy_dazeflow_log",
      description:
        "Append a log entry to today's DAZEFLOW session. Use to record decisions, completions, blockers, or key moments.",
      inputSchema: {
        type: "object",
        properties: {
          entry: { type: "string", description: "The log entry text" },
          type: {
            type: "string",
            enum: [
              "decision",
              "complete",
              "blocker",
              "note",
              "deploy",
              "fix",
              "intake",
              "synthesis",
            ],
            description: "Entry type (default: note)",
          },
        },
        required: ["entry"],
      },
    },
    {
      name: "lucy_dazeflow_close",
      description:
        "Close today's DAZEFLOW session with a summary. Marks the day complete.",
      inputSchema: {
        type: "object",
        properties: {
          summary: {
            type: "string",
            description: "One-line summary of the day",
          },
        },
        required: ["summary"],
      },
    },
    {
      name: "lucy_dazeflow_history",
      description: "List past DAZEFLOW sessions with their summaries",
      inputSchema: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Number of sessions to return (default: 7)",
          },
        },
      },
    },

    // ─── TASK TOOLS ───
    {
      name: "lucy_task_list",
      description:
        "Get the current task list. Filter by status: open, done, all.",
      inputSchema: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["open", "done", "all"],
            description: "Filter by status (default: open)",
          },
        },
      },
    },
    {
      name: "lucy_task_add",
      description: "Add a new task to the list",
      inputSchema: {
        type: "object",
        properties: {
          task: { type: "string", description: "Task description" },
          priority: {
            type: "string",
            enum: ["P0", "P1", "P2", "P3"],
            description:
              "Priority: P0=critical, P1=urgent, P2=normal, P3=backlog",
          },
          context: {
            type: "string",
            description: "Optional context or link",
          },
        },
        required: ["task"],
      },
    },
    {
      name: "lucy_task_done",
      description: "Mark a task as complete by ID",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Task ID" },
          note: {
            type: "string",
            description: "Optional completion note",
          },
        },
        required: ["id"],
      },
    },
    {
      name: "lucy_task_drop",
      description: "Drop/cancel a task by ID",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Task ID" },
          reason: {
            type: "string",
            description: "Reason for dropping",
          },
        },
        required: ["id"],
      },
    },

    // ─── MEMCELL TOOLS ───
    {
      name: "lucy_memcell_list",
      description: "List GABRIEL memcells from Heaven agent-memory D1",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "lucy_memcell_write",
      description: "Write a new GABRIEL memcell to Heaven agent-memory",
      inputSchema: {
        type: "object",
        properties: {
          key: { type: "string", description: "Memcell key/name" },
          value: {
            type: "string",
            description: "Memcell value/content",
          },
          actor_id: {
            type: "string",
            description: "Actor ID (default: RSP_001)",
          },
        },
        required: ["key", "value"],
      },
    },

    // ─── STATUS ───
    {
      name: "lucy_status",
      description:
        "Full Lucy status: DAZEFLOW, tasks, intake pipeline, Heaven health.",
      inputSchema: { type: "object", properties: {} },
    },

    // ═══════════════════════════════════════════════════════════
    // INTAKE PIPELINE TOOLS (v2)
    // ═══════════════════════════════════════════════════════════
    {
      name: "lucy_intake_receive",
      description:
        "Catch incoming data from any source. Tags it with source, timestamp, and metadata. This is the entry point for the entire data pipeline. Use for transcribed voice input, API responses, multi-instance outputs, or any external data that needs to flow through the empire.",
      inputSchema: {
        type: "object",
        properties: {
          content: {
            type: "string",
            description: "The incoming data/text",
          },
          source: {
            type: "string",
            enum: [
              "voice",
              "claude_1",
              "claude_2",
              "claude_3",
              "api",
              "webhook",
              "manual",
              "dreamchamber",
              "heaven",
            ],
            description: "Where this data came from",
          },
          metadata: {
            type: "object",
            description:
              "Optional metadata: tone, confidence, model, session_id, etc.",
          },
        },
        required: ["content", "source"],
      },
    },
    {
      name: "lucy_intake_classify",
      description:
        "Classify the intent of incoming text and recommend which agent should handle it. Uses keyword matching + dispatch rules. Returns primary intent, confidence score, and recommended agent.",
      inputSchema: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "The text to classify",
          },
        },
        required: ["text"],
      },
    },
    {
      name: "lucy_intake_synthesize",
      description:
        "Merge multiple responses into one coherent output. Designed for the three-Claude-instance pattern: takes multiple response streams, identifies agreements, conflicts, and unique insights, then produces a synthesized result with reasoning visible.",
      inputSchema: {
        type: "object",
        properties: {
          responses: {
            type: "array",
            items: {
              type: "object",
              properties: {
                source: {
                  type: "string",
                  description: "Which instance (claude_1, claude_2, claude_3)",
                },
                content: {
                  type: "string",
                  description: "The response text",
                },
                role: {
                  type: "string",
                  enum: ["analysis", "pattern", "stress_test"],
                  description:
                    "The angle this instance was running: deep analysis, pattern-finding, or stress-testing",
                },
                confidence: {
                  type: "number",
                  description: "Self-reported confidence 0-1",
                },
              },
              required: ["source", "content"],
            },
            description: "Array of responses to synthesize",
          },
          original_input: {
            type: "string",
            description: "The original input that triggered these responses",
          },
          synthesis_mode: {
            type: "string",
            enum: ["consensus", "best_of", "layered", "conflict_resolution"],
            description:
              "How to merge: consensus (agreement-weighted), best_of (highest confidence wins), layered (stack all perspectives), conflict_resolution (resolve contradictions)",
          },
        },
        required: ["responses"],
      },
    },
    {
      name: "lucy_intake_archive",
      description:
        "Archive a prompt, response, or interaction with full provenance. Creates an immutable record with: what went in, what came out, which rules fired, which agent handled it, exact timestamps. Stored as individual JSON files for search and audit.",
      inputSchema: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: [
              "prompt",
              "response",
              "synthesis",
              "decision",
              "skill_invocation",
              "rule_fire",
              "deploy",
              "error",
            ],
            description: "What kind of record this is",
          },
          content: {
            type: "string",
            description: "The content to archive",
          },
          agent: {
            type: "string",
            description: "Which agent was involved",
          },
          rules_fired: {
            type: "array",
            items: { type: "string" },
            description: "Which rules were active during this interaction",
          },
          skills_active: {
            type: "array",
            items: { type: "string" },
            description: "Which skills were active",
          },
          input_ref: {
            type: "string",
            description:
              "Reference ID to the original input (for linking prompt→response)",
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Searchable tags",
          },
        },
        required: ["type", "content"],
      },
    },
    {
      name: "lucy_intake_search",
      description:
        "Search the archive by keyword, date range, agent, type, or tags. Returns matching records with full provenance.",
      inputSchema: {
        type: "object",
        properties: {
          keyword: {
            type: "string",
            description: "Search term",
          },
          type: {
            type: "string",
            enum: [
              "prompt",
              "response",
              "synthesis",
              "decision",
              "skill_invocation",
              "rule_fire",
              "deploy",
              "error",
            ],
            description: "Filter by record type",
          },
          agent: {
            type: "string",
            description: "Filter by agent name",
          },
          date_from: {
            type: "string",
            description: "Start date (YYYY-MM-DD)",
          },
          date_to: {
            type: "string",
            description: "End date (YYYY-MM-DD)",
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Filter by tags",
          },
          limit: {
            type: "number",
            description: "Max results (default: 20)",
          },
        },
      },
    },
    {
      name: "lucy_intake_queue",
      description:
        "Queue an item for deferred processing. Use when something needs attention but not right now — Lucy holds it until called.",
      inputSchema: {
        type: "object",
        properties: {
          content: {
            type: "string",
            description: "What needs to be processed",
          },
          priority: {
            type: "string",
            enum: ["P0", "P1", "P2", "P3"],
            description: "Processing priority",
          },
          target_agent: {
            type: "string",
            description: "Which agent should handle this when dequeued",
          },
          defer_until: {
            type: "string",
            description: "ISO timestamp — don't process before this time",
          },
        },
        required: ["content"],
      },
    },
    {
      name: "lucy_intake_status",
      description:
        "Pipeline health: queue depth, archive size, recent activity, synthesis count.",
      inputSchema: { type: "object", properties: {} },
    },
  ],
}));

// ═══════════════════════════════════════════════════════════════
// TOOL HANDLERS
// ═══════════════════════════════════════════════════════════════

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // ─── DAZEFLOW ───
      case "lucy_dazeflow_today": {
        const data = readJson(DAZEFLOW_FILE);
        const today = todayKey();
        let session = data.sessions.find((s) => s.date === today);
        if (!session) {
          session = {
            date: today,
            openedAt: now(),
            closed: false,
            summary: null,
            entries: [],
          };
          data.sessions.unshift(session);
          writeJson(DAZEFLOW_FILE, data);
        }
        const lines = [
          `**DAZEFLOW · ${today}** ${session.closed ? "✓ CLOSED" : "● OPEN"}`,
          session.summary ? `Summary: ${session.summary}` : "",
          `Entries: ${session.entries.length}`,
          "",
          ...session.entries.map(
            (e) =>
              `[${e.timestamp.slice(11, 16)}] ${e.type?.toUpperCase() || "NOTE"}: ${e.entry}`,
          ),
          session.entries.length === 0
            ? "*No entries yet. Log your first entry.*"
            : "",
        ];
        return {
          content: [
            {
              type: "text",
              text: lines.filter((l) => l !== undefined).join("\n"),
            },
          ],
        };
      }

      case "lucy_dazeflow_log": {
        const data = readJson(DAZEFLOW_FILE);
        const today = todayKey();
        let session = data.sessions.find((s) => s.date === today);
        if (!session) {
          session = {
            date: today,
            openedAt: now(),
            closed: false,
            summary: null,
            entries: [],
          };
          data.sessions.unshift(session);
        }
        if (session.closed) {
          return {
            content: [
              {
                type: "text",
                text: "⚠ Today's session is already closed. Open a new one.",
              },
            ],
          };
        }
        session.entries.push({
          timestamp: now(),
          type: args.type || "note",
          entry: args.entry,
        });
        writeJson(DAZEFLOW_FILE, data);
        return {
          content: [
            {
              type: "text",
              text: `✓ Logged [${args.type?.toUpperCase() || "NOTE"}]: ${args.entry}\nSession entries today: ${session.entries.length}`,
            },
          ],
        };
      }

      case "lucy_dazeflow_close": {
        const data = readJson(DAZEFLOW_FILE);
        const today = todayKey();
        const session = data.sessions.find((s) => s.date === today);
        if (!session) {
          return {
            content: [{ type: "text", text: "No session open today." }],
          };
        }
        session.closed = true;
        session.closedAt = now();
        session.summary = args.summary;
        writeJson(DAZEFLOW_FILE, data);
        return {
          content: [
            {
              type: "text",
              text: `✓ DAZEFLOW ${today} closed.\nSummary: ${args.summary}\nEntries: ${session.entries.length}`,
            },
          ],
        };
      }

      case "lucy_dazeflow_history": {
        const data = readJson(DAZEFLOW_FILE);
        const limit = args.limit || 7;
        const sessions = data.sessions.slice(0, limit);
        if (sessions.length === 0) {
          return {
            content: [{ type: "text", text: "No DAZEFLOW sessions yet." }],
          };
        }
        const lines = sessions.map(
          (s) =>
            `${s.closed ? "✓" : "●"} **${s.date}** · ${s.entries.length} entries${s.summary ? ` · ${s.summary}` : ""}`,
        );
        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      // ─── TASKS ───
      case "lucy_task_list": {
        const data = readJson(TASKS_FILE);
        const filter = args.status || "open";
        const tasks = data.tasks.filter((t) =>
          filter === "all"
            ? true
            : filter === "open"
              ? t.status === "open"
              : t.status !== "open",
        );
        if (tasks.length === 0) {
          return {
            content: [{ type: "text", text: `No ${filter} tasks.` }],
          };
        }
        const lines = tasks.map(
          (t) =>
            `[${t.id}] ${t.status === "done" ? "✓" : t.status === "dropped" ? "✗" : "○"} **${t.priority || "P2"}** ${t.task}${t.context ? ` · ${t.context}` : ""}`,
        );
        const open = data.tasks.filter((t) => t.status === "open");
        const p1 = open.filter(
          (t) => t.priority === "P1" || t.priority === "P0",
        );
        return {
          content: [
            {
              type: "text",
              text: `**Tasks (${filter}):** ${tasks.length} | Open: ${open.length} | P0/P1: ${p1.length}\n\n${lines.join("\n")}`,
            },
          ],
        };
      }

      case "lucy_task_add": {
        const data = readJson(TASKS_FILE);
        const id = `T${Date.now().toString(36).toUpperCase()}`;
        const task = {
          id,
          task: args.task,
          priority: args.priority || "P2",
          context: args.context || null,
          status: "open",
          createdAt: now(),
        };
        data.tasks.unshift(task);
        writeJson(TASKS_FILE, data);
        return {
          content: [
            {
              type: "text",
              text: `✓ Task added [${id}] ${args.priority || "P2"}: ${args.task}`,
            },
          ],
        };
      }

      case "lucy_task_done": {
        const data = readJson(TASKS_FILE);
        const task = data.tasks.find((t) => t.id === args.id);
        if (!task) {
          return {
            content: [
              { type: "text", text: `Task ${args.id} not found.` },
            ],
          };
        }
        task.status = "done";
        task.doneAt = now();
        if (args.note) task.doneNote = args.note;
        writeJson(TASKS_FILE, data);
        return {
          content: [
            {
              type: "text",
              text: `✓ Task [${args.id}] marked done: ${task.task}${args.note ? `\nNote: ${args.note}` : ""}`,
            },
          ],
        };
      }

      case "lucy_task_drop": {
        const data = readJson(TASKS_FILE);
        const task = data.tasks.find((t) => t.id === args.id);
        if (!task) {
          return {
            content: [
              { type: "text", text: `Task ${args.id} not found.` },
            ],
          };
        }
        task.status = "dropped";
        task.droppedAt = now();
        if (args.reason) task.dropReason = args.reason;
        writeJson(TASKS_FILE, data);
        return {
          content: [
            {
              type: "text",
              text: `✗ Task [${args.id}] dropped: ${task.task}${args.reason ? `\nReason: ${args.reason}` : ""}`,
            },
          ],
        };
      }

      // ─── MEMCELLS ───
      case "lucy_memcell_list": {
        try {
          const data = await h17("/api/v1/kv/memcells");
          return {
            content: [
              {
                type: "text",
                text:
                  "```json\n" + JSON.stringify(data, null, 2) + "\n```",
              },
            ],
          };
        } catch {
          const gabriel = await h17("/gabriel");
          return {
            content: [
              {
                type: "text",
                text: `Heaven /gabriel empire state:\n\`\`\`json\n${JSON.stringify(gabriel, null, 2)}\n\`\`\``,
              },
            ],
          };
        }
      }

      case "lucy_memcell_write": {
        const body = {
          key: args.key,
          value: args.value,
          actor_id: args.actor_id || "RSP_001",
          timestamp: now(),
        };
        try {
          const result = await h17(
            "/api/v1/kv/memcells",
            "POST",
            body,
          );
          return {
            content: [
              {
                type: "text",
                text: `✓ Memcell written: ${args.key}\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``,
              },
            ],
          };
        } catch (err) {
          return {
            content: [
              {
                type: "text",
                text: `⚠ Heaven memcell write failed: ${err.message}`,
              },
            ],
            isError: true,
          };
        }
      }

      // ─── STATUS (upgraded with intake) ───
      case "lucy_status": {
        const dazeData = readJson(DAZEFLOW_FILE);
        const taskData = readJson(TASKS_FILE);
        const intakeData = readJson(INTAKE_FILE);
        const today = todayKey();
        const session = dazeData.sessions.find((s) => s.date === today);
        const openTasks = taskData.tasks.filter(
          (t) => t.status === "open",
        );
        const p0p1 = openTasks.filter(
          (t) => t.priority === "P0" || t.priority === "P1",
        );

        let archiveCount = 0;
        try {
          archiveCount = readdirSync(ARCHIVE_DIR).filter((f) =>
            f.endsWith(".json"),
          ).length;
        } catch {
          /* empty archive */
        }

        let kernelStatus = "unknown";
        try {
          const health = await h17("/health");
          kernelStatus = health.status || "unknown";
        } catch {
          kernelStatus = "unreachable";
        }

        const lines = [
          `**LUCY STATUS · ${today}**`,
          ``,
          `DAZEFLOW: ${session ? (session.closed ? "✓ Closed" : `● Open · ${session.entries.length} entries`) : "No session today"}`,
          `Tasks open: ${openTasks.length} · P0/P1: ${p0p1.length}`,
          p0p1.length > 0
            ? `P0/P1 tasks:\n${p0p1.map((t) => `  [${t.id}] ${t.priority}: ${t.task}`).join("\n")}`
            : "",
          ``,
          `── INTAKE PIPELINE ──`,
          `Queue depth: ${intakeData.queue.length}`,
          `Archive records: ${archiveCount}`,
          `Total received: ${intakeData.stats.total_received}`,
          `Total synthesized: ${intakeData.stats.total_synthesized}`,
          `Total archived: ${intakeData.stats.total_archived}`,
          ``,
          `Heaven kernel: ${kernelStatus}`,
          `Sessions logged: ${dazeData.sessions.length}`,
          `Total tasks: ${taskData.tasks.length}`,
        ];
        return {
          content: [
            {
              type: "text",
              text: lines.filter((l) => l !== undefined).join("\n"),
            },
          ],
        };
      }

      // ═══════════════════════════════════════════════════════
      // INTAKE PIPELINE HANDLERS
      // ═══════════════════════════════════════════════════════

      case "lucy_intake_receive": {
        const intakeData = readJson(INTAKE_FILE);
        const id = makeId("IN");
        const record = {
          id,
          content: args.content,
          source: args.source,
          metadata: args.metadata || {},
          received_at: now(),
          classified: false,
          archived: false,
        };

        intakeData.queue.push(record);
        intakeData.stats.total_received++;
        writeJson(INTAKE_FILE, intakeData);

        // Auto-classify
        const classification = classifyIntent(args.content);

        return {
          content: [
            {
              type: "text",
              text: [
                `✓ Intake received [${id}]`,
                `Source: ${args.source}`,
                `Auto-classified: ${classification.primary} (confidence: ${(classification.confidence * 100).toFixed(0)}%)`,
                `Recommended agent: ${AGENT_DISPATCH[classification.primary]?.agent || "gabriel-orchestrator"}`,
                `Queue depth: ${intakeData.queue.length}`,
              ].join("\n"),
            },
          ],
        };
      }

      case "lucy_intake_classify": {
        const classification = classifyIntent(args.text);
        const dispatch = AGENT_DISPATCH[classification.primary];

        const lines = [
          `**INTENT CLASSIFICATION**`,
          ``,
          `Input: "${args.text.slice(0, 100)}${args.text.length > 100 ? "..." : ""}"`,
          ``,
          `Primary intent: **${classification.primary}**`,
          `Confidence: ${(classification.confidence * 100).toFixed(0)}%`,
          `Recommended agent: **${dispatch?.agent || "gabriel-orchestrator"}**`,
          `Agent role: ${dispatch?.description || "General orchestration"}`,
          ``,
          `All detected intents:`,
          ...classification.all.map(
            (a) =>
              `  ${a.intent} (score: ${a.score}) → ${a.agent}`,
          ),
        ];

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      case "lucy_intake_synthesize": {
        const responses = args.responses || [];
        const mode = args.synthesis_mode || "layered";
        const intakeData = readJson(INTAKE_FILE);

        if (responses.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "No responses to synthesize.",
              },
            ],
          };
        }

        // Build synthesis
        const agreements = [];
        const conflicts = [];
        const unique = [];

        // Simple overlap detection — find shared phrases/concepts
        const allContent = responses.map((r) =>
          r.content.toLowerCase(),
        );

        // Each response's key sentences
        const sentenceSets = responses.map((r) =>
          r.content
            .split(/[.!?]+/)
            .map((s) => s.trim())
            .filter((s) => s.length > 10),
        );

        // Find agreements: sentences that appear similar across responses
        if (responses.length >= 2) {
          for (const sentence of sentenceSets[0]) {
            const words = sentence.toLowerCase().split(/\s+/);
            const keyWords = words.filter((w) => w.length > 4);
            let matchCount = 0;
            for (let i = 1; i < allContent.length; i++) {
              const hits = keyWords.filter((kw) =>
                allContent[i].includes(kw),
              );
              if (hits.length >= keyWords.length * 0.4) matchCount++;
            }
            if (matchCount >= 1) agreements.push(sentence);
          }
        }

        // Find unique insights per response
        for (let i = 0; i < responses.length; i++) {
          for (const sentence of sentenceSets[i]) {
            const words = sentence.toLowerCase().split(/\s+/);
            const keyWords = words.filter((w) => w.length > 4);
            let isUnique = true;
            for (let j = 0; j < allContent.length; j++) {
              if (j === i) continue;
              const hits = keyWords.filter((kw) =>
                allContent[j].includes(kw),
              );
              if (hits.length >= keyWords.length * 0.4) {
                isUnique = false;
                break;
              }
            }
            if (isUnique && sentence.length > 20) {
              unique.push({
                source: responses[i].source,
                role: responses[i].role || "unspecified",
                insight: sentence,
              });
            }
          }
        }

        // Build synthesized output based on mode
        let synthesized;
        switch (mode) {
          case "consensus":
            synthesized = [
              agreements.length > 0
                ? `**Consensus (${agreements.length} shared points):**\n${agreements.slice(0, 5).join(". ")}.\n`
                : "No strong consensus detected.\n",
              unique.length > 0
                ? `**Unique insights:**\n${unique.slice(0, 5).map((u) => `[${u.source}/${u.role}] ${u.insight}`).join("\n")}`
                : "",
            ].join("\n");
            break;

          case "best_of": {
            const best = responses.reduce((a, b) =>
              (a.confidence || 0) >= (b.confidence || 0) ? a : b,
            );
            synthesized = `**Best response (${best.source}, confidence: ${best.confidence || "unrated"}):**\n${best.content}`;
            break;
          }

          case "conflict_resolution":
            synthesized = [
              `**Agreements:** ${agreements.length > 0 ? agreements.slice(0, 3).join(". ") + "." : "None detected."}`,
              ``,
              `**Unique perspectives to resolve:**`,
              ...unique
                .slice(0, 8)
                .map(
                  (u) => `  [${u.source}/${u.role}]: ${u.insight}`,
                ),
            ].join("\n");
            break;

          case "layered":
          default:
            synthesized = responses
              .map(
                (r) =>
                  `**[${r.source}${r.role ? ` / ${r.role}` : ""}]${r.confidence ? ` (${(r.confidence * 100).toFixed(0)}%)` : ""}:**\n${r.content}`,
              )
              .join("\n\n---\n\n");
            if (agreements.length > 0) {
              synthesized += `\n\n**SYNTHESIS — Shared ground (${agreements.length}):**\n${agreements.slice(0, 5).join(". ")}.`;
            }
            if (unique.length > 0) {
              synthesized += `\n\n**SYNTHESIS — Unique insights (${unique.length}):**\n${unique.slice(0, 5).map((u) => `[${u.source}] ${u.insight}`).join("\n")}`;
            }
            break;
        }

        // Archive the synthesis
        const synthId = makeId("SYN");
        const archiveRecord = {
          id: synthId,
          type: "synthesis",
          mode,
          original_input: args.original_input || null,
          response_count: responses.length,
          sources: responses.map((r) => r.source),
          agreements_found: agreements.length,
          unique_insights_found: unique.length,
          synthesized_output: synthesized,
          timestamp: now(),
        };

        writeFileSync(
          join(ARCHIVE_DIR, `${synthId}.json`),
          JSON.stringify(archiveRecord, null, 2),
        );

        intakeData.stats.total_synthesized++;
        writeJson(INTAKE_FILE, intakeData);

        return {
          content: [
            {
              type: "text",
              text: [
                `**SYNTHESIS [${synthId}]** · Mode: ${mode} · Sources: ${responses.length}`,
                `Agreements: ${agreements.length} · Unique insights: ${unique.length}`,
                ``,
                synthesized,
              ].join("\n"),
            },
          ],
        };
      }

      case "lucy_intake_archive": {
        const intakeData = readJson(INTAKE_FILE);
        const id = makeId("ARC");
        const record = {
          id,
          type: args.type,
          content: args.content,
          agent: args.agent || null,
          rules_fired: args.rules_fired || [],
          skills_active: args.skills_active || [],
          input_ref: args.input_ref || null,
          tags: args.tags || [],
          timestamp: now(),
          date: todayKey(),
        };

        writeFileSync(
          join(ARCHIVE_DIR, `${id}.json`),
          JSON.stringify(record, null, 2),
        );

        intakeData.stats.total_archived++;
        writeJson(INTAKE_FILE, intakeData);

        // Also log to DAZEFLOW
        const dazeData = readJson(DAZEFLOW_FILE);
        const today = todayKey();
        let session = dazeData.sessions.find((s) => s.date === today);
        if (session && !session.closed) {
          session.entries.push({
            timestamp: now(),
            type: "intake",
            entry: `Archived [${id}] type=${args.type}${args.agent ? ` agent=${args.agent}` : ""}`,
          });
          writeJson(DAZEFLOW_FILE, dazeData);
        }

        return {
          content: [
            {
              type: "text",
              text: `✓ Archived [${id}] type=${args.type}\nAgent: ${args.agent || "none"}\nRules: ${(args.rules_fired || []).length} · Skills: ${(args.skills_active || []).length}\nTags: ${(args.tags || []).join(", ") || "none"}`,
            },
          ],
        };
      }

      case "lucy_intake_search": {
        const limit = args.limit || 20;
        const results = [];

        try {
          const files = readdirSync(ARCHIVE_DIR).filter((f) =>
            f.endsWith(".json"),
          );
          for (const file of files) {
            if (results.length >= limit) break;
            try {
              const record = JSON.parse(
                readFileSync(join(ARCHIVE_DIR, file), "utf8"),
              );

              // Apply filters
              if (args.type && record.type !== args.type) continue;
              if (args.agent && record.agent !== args.agent) continue;
              if (
                args.date_from &&
                record.date &&
                record.date < args.date_from
              )
                continue;
              if (
                args.date_to &&
                record.date &&
                record.date > args.date_to
              )
                continue;
              if (
                args.tags &&
                args.tags.length > 0 &&
                !args.tags.some((t) => (record.tags || []).includes(t))
              )
                continue;
              if (
                args.keyword &&
                !JSON.stringify(record)
                  .toLowerCase()
                  .includes(args.keyword.toLowerCase())
              )
                continue;

              results.push(record);
            } catch {
              /* skip malformed */
            }
          }
        } catch {
          /* empty archive */
        }

        if (results.length === 0) {
          return {
            content: [
              { type: "text", text: "No matching archive records." },
            ],
          };
        }

        const lines = results.map(
          (r) =>
            `[${r.id}] ${r.type} · ${r.timestamp?.slice(0, 16) || "?"} · agent=${r.agent || "?"} · tags=${(r.tags || []).join(",") || "none"}\n  ${(r.content || "").slice(0, 100)}${(r.content || "").length > 100 ? "..." : ""}`,
        );

        return {
          content: [
            {
              type: "text",
              text: `**Archive search** · ${results.length} results\n\n${lines.join("\n\n")}`,
            },
          ],
        };
      }

      case "lucy_intake_queue": {
        const intakeData = readJson(INTAKE_FILE);
        const id = makeId("Q");
        const item = {
          id,
          content: args.content,
          priority: args.priority || "P2",
          target_agent: args.target_agent || null,
          defer_until: args.defer_until || null,
          queued_at: now(),
          status: "pending",
        };

        intakeData.queue.push(item);
        writeJson(INTAKE_FILE, intakeData);

        return {
          content: [
            {
              type: "text",
              text: `✓ Queued [${id}] ${args.priority || "P2"}\nTarget: ${args.target_agent || "unassigned"}\nDefer until: ${args.defer_until || "immediate"}\nQueue depth: ${intakeData.queue.length}`,
            },
          ],
        };
      }

      case "lucy_intake_status": {
        const intakeData = readJson(INTAKE_FILE);
        let archiveCount = 0;
        try {
          archiveCount = readdirSync(ARCHIVE_DIR).filter((f) =>
            f.endsWith(".json"),
          ).length;
        } catch {
          /* empty */
        }

        const pendingQueue = intakeData.queue.filter(
          (q) => q.status === "pending",
        );
        const p0Queue = pendingQueue.filter(
          (q) => q.priority === "P0" || q.priority === "P1",
        );

        const lines = [
          `**INTAKE PIPELINE STATUS**`,
          ``,
          `Queue depth: ${pendingQueue.length} pending (${p0Queue.length} P0/P1)`,
          `Archive records: ${archiveCount}`,
          `Total received: ${intakeData.stats.total_received}`,
          `Total synthesized: ${intakeData.stats.total_synthesized}`,
          `Total archived: ${intakeData.stats.total_archived}`,
          ``,
          `Agent dispatch rules: ${Object.keys(AGENT_DISPATCH).length} intents mapped`,
          `Intent keywords: ${Object.values(INTENT_KEYWORDS).flat().length} total`,
          ``,
          pendingQueue.length > 0
            ? `**Pending items:**\n${pendingQueue.slice(0, 5).map((q) => `  [${q.id}] ${q.priority} → ${q.target_agent || "unassigned"}: ${q.content.slice(0, 60)}...`).join("\n")}`
            : "Queue clear.",
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
