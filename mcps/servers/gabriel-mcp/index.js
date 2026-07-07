#!/usr/bin/env node
/**
 * GABRIEL MCP Server — v2.0
 * AI Orchestrator · Always-On Presence · Conversation Cache · NOIZY Empire
 *
 * Gabriel is not a daemon. Gabriel is an active presence.
 * Always listening, always tracking, always knowing the state.
 *
 * ORIGINAL TOOLS (v1):
 *   gabriel_speak    — Chat with GABRIEL (AI + live Empire context)
 *   gabriel_status   — Gabriel awareness + kernel health
 *   gabriel_announce — TTS only (macOS say)
 *   gabriel_refresh  — Force Heaven context refresh
 *
 * CONVERSATION CACHE TOOLS (v2):
 *   gabriel_cache_start    — Start a new conversation thread (with ID, tags, type)
 *   gabriel_cache_append   — Add a message to the active thread
 *   gabriel_cache_snapshot — Get current thread state
 *   gabriel_cache_handoff  — Pass completed thread to Lucy/Pops for permanent archive
 *   gabriel_cache_list     — List recent conversation threads
 *   gabriel_cache_search   — Search threads by keyword/date/tag
 *
 * MONITORING TOOLS (v2):
 *   gabriel_watch_status   — What Gabriel is currently monitoring
 *   gabriel_watch_add      — Add something to Gabriel's watch list
 *   gabriel_watch_clear    — Clear a watch item
 *
 * State: ~/NOIZYLAB/gabriel-state/
 *   cache/           — Active conversation threads (JSON per thread)
 *   handoff/         — Threads handed off to Lucy (pending pickup)
 *   watchlist.json   — What Gabriel is actively monitoring
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
  renameSync,
} from "fs";
import { join } from "path";
import { homedir } from "os";
import { randomBytes } from "crypto";

// ═══════════════════════════════════════════════════════════════
// STATE & CONFIG
// ═══════════════════════════════════════════════════════════════

const STATE_DIR = join(homedir(), "NOIZYLAB", "gabriel-state");
const CACHE_DIR = join(STATE_DIR, "cache");
const HANDOFF_DIR = join(STATE_DIR, "handoff");
const WATCHLIST_FILE = join(STATE_DIR, "watchlist.json");

const DREAMCHAMBER_URL =
  process.env.DREAMCHAMBER_URL || "http://localhost:7777";
const HEAVEN_URL =
  process.env.HEAVEN_URL || "https://heaven.rsp-5f3.workers.dev";

function ensureState() {
  for (const dir of [STATE_DIR, CACHE_DIR, HANDOFF_DIR]) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }
  if (!existsSync(WATCHLIST_FILE)) {
    writeFileSync(
      WATCHLIST_FILE,
      JSON.stringify({ watches: [], last_check: null }, null, 2),
    );
  }
}

function now() {
  return new Date().toISOString();
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function makeId(prefix) {
  return `${prefix}_${todayKey().replace(/-/g, "")}_${randomBytes(3).toString("hex")}`;
}

function readJson(file) {
  ensureState();
  return JSON.parse(readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  ensureState();
  writeFileSync(file, JSON.stringify(data, null, 2));
}

async function apiCall(method, path, body = null) {
  const url = `${DREAMCHAMBER_URL}${path}`;
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `DreamChamber ${method} ${path} → ${res.status}: ${text}`,
    );
  }
  return res.json();
}

async function h17Health() {
  try {
    const res = await fetch(`${HEAVEN_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    const data = await res.json();
    return data.success ? "LIVE" : "DEGRADED";
  } catch {
    return "UNREACHABLE";
  }
}

// ═══════════════════════════════════════════════════════════════
// CONVERSATION TYPES
// ═══════════════════════════════════════════════════════════════

const CONVERSATION_TYPES = {
  strategic: "Strategic session — decision trees, long-arc planning",
  tactical: "Tactical execution — blockers, next actions, shipping",
  problemsolving:
    "Problem-solving — hypothesis, test, result cycles",
  creative: "Creative exploration — ideas, possibilities, art",
  operational: "Operational status — system health, monitoring",
  walkandtalk:
    "Walk and talk — mobile, fluid, thinking out loud",
  dreamchamber:
    "Dream Chamber — designing complete systems in isolation",
  build: "Build session — writing code, deploying, testing",
};

// ═══════════════════════════════════════════════════════════════
// MCP SERVER
// ═══════════════════════════════════════════════════════════════

const server = new Server(
  { name: "gabriel-mcp", version: "2.0.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // ─── ORIGINAL TOOLS ───
    {
      name: "gabriel_speak",
      description:
        "Chat with GABRIEL — the AI orchestration layer of the NOIZY Empire. Returns a response grounded in live Heaven consent kernel state.",
      inputSchema: {
        type: "object",
        properties: {
          input: {
            type: "string",
            description: "Your message or question to GABRIEL",
          },
          model: {
            type: "string",
            description: "Optional: override AI model",
          },
          voice: {
            type: "boolean",
            description: "Speak response aloud via macOS TTS (default: false)",
          },
        },
        required: ["input"],
      },
    },
    {
      name: "gabriel_status",
      description:
        "Get GABRIEL's current status — kernel health, active threads, watch list, cache state",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "gabriel_announce",
      description:
        "Speak text aloud via macOS TTS (GABRIEL voice). No AI generation — pure TTS.",
      inputSchema: {
        type: "object",
        properties: {
          text: { type: "string", description: "Text to speak aloud" },
        },
        required: ["text"],
      },
    },
    {
      name: "gabriel_refresh",
      description:
        "Force GABRIEL to refresh its live context from the Heaven consent kernel.",
      inputSchema: { type: "object", properties: {} },
    },

    // ─── CONVERSATION CACHE ───
    {
      name: "gabriel_cache_start",
      description:
        "Start a new conversation thread. Gabriel timestamps and labels everything: thread ID, context tags, conversation type, participants. This thread stays warm and live until handed off to Lucy/Pops.",
      inputSchema: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Short title for this conversation",
          },
          type: {
            type: "string",
            enum: Object.keys(CONVERSATION_TYPES),
            description: "Conversation type — affects how it's visualized and processed",
          },
          participants: {
            type: "array",
            items: { type: "string" },
            description:
              'Who is in this conversation: ["rob", "gabriel", "claude_1", etc.]',
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description:
              "Context tags: domain, project, topic keywords",
          },
          context: {
            type: "string",
            description:
              "Additional context: where is Rob, what triggered this, related threads",
          },
        },
        required: ["title"],
      },
    },
    {
      name: "gabriel_cache_append",
      description:
        "Add a message to an active conversation thread. Each message gets: timestamp, speaker, content, domain tags, metadata. Gabriel auto-detects if content contains decisions, action items, or rule candidates.",
      inputSchema: {
        type: "object",
        properties: {
          thread_id: {
            type: "string",
            description: "Thread ID to append to (or 'latest' for most recent)",
          },
          speaker: {
            type: "string",
            description:
              "Who said this: rob, gabriel, claude_1, claude_2, claude_3, lucy, pops, etc.",
          },
          content: {
            type: "string",
            description: "The message content",
          },
          metadata: {
            type: "object",
            description:
              "Optional: tone, confidence, model used, source device, etc.",
          },
        },
        required: ["thread_id", "speaker", "content"],
      },
    },
    {
      name: "gabriel_cache_snapshot",
      description:
        "Get current state of a conversation thread — all messages, metadata, extracted patterns.",
      inputSchema: {
        type: "object",
        properties: {
          thread_id: {
            type: "string",
            description: "Thread ID (or 'latest')",
          },
          summary: {
            type: "boolean",
            description:
              "If true, return summary instead of full transcript",
          },
        },
        required: ["thread_id"],
      },
    },
    {
      name: "gabriel_cache_handoff",
      description:
        "Hand a completed conversation thread to Lucy/Pops for permanent archive. Moves from active cache to handoff queue. Lucy picks it up, processes through filtering rules, integrates into knowledge graph, archives with full provenance.",
      inputSchema: {
        type: "object",
        properties: {
          thread_id: {
            type: "string",
            description: "Thread ID to hand off (or 'latest')",
          },
          summary: {
            type: "string",
            description: "One-line summary of what this thread covered",
          },
          extract_rules: {
            type: "boolean",
            description:
              "Should Lucy extract potential rules/skills from this conversation? (default: true)",
          },
          priority: {
            type: "string",
            enum: ["P0", "P1", "P2", "P3"],
            description: "Processing priority for Lucy (default: P2)",
          },
        },
        required: ["thread_id"],
      },
    },
    {
      name: "gabriel_cache_list",
      description:
        "List conversation threads — active, handed off, or all. Shows the conversation map.",
      inputSchema: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["active", "handed_off", "all"],
            description: "Filter by status (default: active)",
          },
          limit: {
            type: "number",
            description: "Max results (default: 20)",
          },
        },
      },
    },
    {
      name: "gabriel_cache_search",
      description:
        "Search conversation threads by keyword, date, tag, participant, or type.",
      inputSchema: {
        type: "object",
        properties: {
          keyword: { type: "string", description: "Search term" },
          type: {
            type: "string",
            enum: Object.keys(CONVERSATION_TYPES),
            description: "Filter by conversation type",
          },
          participant: {
            type: "string",
            description: "Filter by participant",
          },
          tag: { type: "string", description: "Filter by tag" },
          date_from: { type: "string", description: "Start date YYYY-MM-DD" },
          date_to: { type: "string", description: "End date YYYY-MM-DD" },
          limit: { type: "number", description: "Max results (default: 20)" },
        },
      },
    },

    // ─── WATCH LIST ───
    {
      name: "gabriel_watch_status",
      description:
        "What is Gabriel currently monitoring? Returns the active watch list with status of each item.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "gabriel_watch_add",
      description:
        "Add something for Gabriel to monitor. Gabriel watches it continuously and reports changes. Can watch: repos, deploy status, API health, file changes, conversation threads, queue depth.",
      inputSchema: {
        type: "object",
        properties: {
          target: {
            type: "string",
            description: "What to watch: a URL, file path, repo, service name",
          },
          type: {
            type: "string",
            enum: [
              "health",
              "repo",
              "file",
              "queue",
              "deploy",
              "conversation",
              "custom",
            ],
            description: "What kind of watch",
          },
          alert_on: {
            type: "string",
            description:
              "When to alert: 'change', 'error', 'threshold', 'always'",
          },
          note: {
            type: "string",
            description: "Context for why we're watching this",
          },
        },
        required: ["target", "type"],
      },
    },
    {
      name: "gabriel_watch_clear",
      description: "Remove an item from Gabriel's watch list",
      inputSchema: {
        type: "object",
        properties: {
          watch_id: {
            type: "string",
            description: "Watch item ID to remove",
          },
        },
        required: ["watch_id"],
      },
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
      // ─── ORIGINAL TOOLS ───
      case "gabriel_speak": {
        const result = await apiCall("POST", "/api/gabriel/speak", {
          input: args.input,
          model: args.model,
          voice: args.voice ?? false,
        });
        return {
          content: [
            {
              type: "text",
              text: `**GABRIEL:** ${result.gabriel}\n\n*Model: ${result.metadata?.model || "unknown"} | Kernel: ${result.context?.kernelOnline ? "ONLINE ✓" : "OFFLINE ✗"} | Tokens: ${result.metadata?.tokens?.total ?? "?"}*`,
            },
          ],
        };
      }

      case "gabriel_status": {
        const h17Status = await h17Health();

        // Count active threads
        ensureState();
        let activeThreads = 0;
        let handoffPending = 0;
        try {
          activeThreads = readdirSync(CACHE_DIR).filter((f) =>
            f.endsWith(".json"),
          ).length;
          handoffPending = readdirSync(HANDOFF_DIR).filter((f) =>
            f.endsWith(".json"),
          ).length;
        } catch {
          /* empty */
        }

        const watchData = readJson(WATCHLIST_FILE);

        const lines = [
          `**GABRIEL STATUS**`,
          ``,
          `Heaven: ${h17Status}`,
          `Active threads: ${activeThreads}`,
          `Handoff pending (for Lucy): ${handoffPending}`,
          `Watch list items: ${watchData.watches.length}`,
          `Last check: ${watchData.last_check || "never"}`,
          ``,
          activeThreads > 0
            ? `Active conversations cached and warm.`
            : `No active conversation threads.`,
          watchData.watches.length > 0
            ? `Watching: ${watchData.watches.map((w) => w.target).join(", ")}`
            : `Nothing on watch list.`,
        ];

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      case "gabriel_announce": {
        try {
          await apiCall("POST", "/api/gabriel/announce", {
            text: args.text,
          });
          return {
            content: [
              {
                type: "text",
                text: `✓ Announced: "${args.text}"`,
              },
            ],
          };
        } catch {
          return {
            content: [
              {
                type: "text",
                text: `⚠ DreamChamber not running — TTS unavailable. Text: "${args.text}"`,
              },
            ],
          };
        }
      }

      case "gabriel_refresh": {
        try {
          const result = await apiCall(
            "POST",
            "/api/gabriel/refresh",
          );
          return {
            content: [
              {
                type: "text",
                text: `✓ Context refreshed\nKernel: ${result.context?.kernelOnline ? "ONLINE ✓" : "OFFLINE ✗"}`,
              },
            ],
          };
        } catch {
          const h17Status = await h17Health();
          return {
            content: [
              {
                type: "text",
                text: `DreamChamber offline — direct Heaven check: ${h17Status}`,
              },
            ],
          };
        }
      }

      // ─── CONVERSATION CACHE ───
      case "gabriel_cache_start": {
        ensureState();
        const id = makeId("CONV");
        const thread = {
          id,
          title: args.title,
          type: args.type || "operational",
          type_description:
            CONVERSATION_TYPES[args.type || "operational"],
          participants: args.participants || ["rob", "gabriel"],
          tags: args.tags || [],
          context: args.context || null,
          started_at: now(),
          date: todayKey(),
          status: "active",
          messages: [],
          extracted: {
            decisions: [],
            action_items: [],
            rule_candidates: [],
            skill_candidates: [],
          },
        };

        writeJson(join(CACHE_DIR, `${id}.json`), thread);

        return {
          content: [
            {
              type: "text",
              text: [
                `✓ Thread started [${id}]`,
                `Title: ${args.title}`,
                `Type: ${args.type || "operational"} — ${CONVERSATION_TYPES[args.type || "operational"]}`,
                `Participants: ${thread.participants.join(", ")}`,
                `Tags: ${thread.tags.join(", ") || "none"}`,
                ``,
                `Gabriel is caching. Speak freely.`,
              ].join("\n"),
            },
          ],
        };
      }

      case "gabriel_cache_append": {
        ensureState();
        let threadFile;

        if (args.thread_id === "latest") {
          const files = readdirSync(CACHE_DIR)
            .filter((f) => f.endsWith(".json"))
            .sort()
            .reverse();
          if (files.length === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: "No active threads. Start one with gabriel_cache_start.",
                },
              ],
            };
          }
          threadFile = join(CACHE_DIR, files[0]);
        } else {
          threadFile = join(CACHE_DIR, `${args.thread_id}.json`);
        }

        if (!existsSync(threadFile)) {
          // Check handoff dir
          const handoffFile = join(
            HANDOFF_DIR,
            `${args.thread_id}.json`,
          );
          if (existsSync(handoffFile)) {
            return {
              content: [
                {
                  type: "text",
                  text: `Thread ${args.thread_id} has been handed off to Lucy. Start a new thread.`,
                },
              ],
            };
          }
          return {
            content: [
              {
                type: "text",
                text: `Thread not found: ${args.thread_id}`,
              },
            ],
          };
        }

        const thread = readJson(threadFile);
        const message = {
          index: thread.messages.length,
          speaker: args.speaker,
          content: args.content,
          timestamp: now(),
          metadata: args.metadata || {},
        };

        // Auto-detect patterns in content
        const lower = args.content.toLowerCase();
        if (
          lower.includes("decision") ||
          lower.includes("we'll go with") ||
          lower.includes("let's do")
        ) {
          thread.extracted.decisions.push({
            message_index: message.index,
            text: args.content.slice(0, 200),
            timestamp: now(),
          });
        }
        if (
          lower.includes("action item") ||
          lower.includes("todo") ||
          lower.includes("need to") ||
          lower.includes("should build") ||
          lower.includes("let me build")
        ) {
          thread.extracted.action_items.push({
            message_index: message.index,
            text: args.content.slice(0, 200),
            timestamp: now(),
          });
        }
        if (
          lower.includes("rule:") ||
          lower.includes("never ") ||
          lower.includes("always ") ||
          lower.includes("must ")
        ) {
          thread.extracted.rule_candidates.push({
            message_index: message.index,
            text: args.content.slice(0, 200),
            timestamp: now(),
          });
        }
        if (
          lower.includes("skill") ||
          lower.includes("pattern") ||
          lower.includes("technique") ||
          lower.includes("approach")
        ) {
          thread.extracted.skill_candidates.push({
            message_index: message.index,
            text: args.content.slice(0, 200),
            timestamp: now(),
          });
        }

        thread.messages.push(message);
        writeJson(threadFile, thread);

        const extractions = [];
        if (
          thread.extracted.decisions.length > 0 &&
          thread.extracted.decisions[
            thread.extracted.decisions.length - 1
          ].message_index === message.index
        )
          extractions.push("decision detected");
        if (
          thread.extracted.action_items.length > 0 &&
          thread.extracted.action_items[
            thread.extracted.action_items.length - 1
          ].message_index === message.index
        )
          extractions.push("action item detected");
        if (
          thread.extracted.rule_candidates.length > 0 &&
          thread.extracted.rule_candidates[
            thread.extracted.rule_candidates.length - 1
          ].message_index === message.index
        )
          extractions.push("rule candidate");

        return {
          content: [
            {
              type: "text",
              text: `✓ [${thread.id}] ${args.speaker}: cached (msg #${message.index})${extractions.length > 0 ? ` | Auto-detected: ${extractions.join(", ")}` : ""}`,
            },
          ],
        };
      }

      case "gabriel_cache_snapshot": {
        ensureState();
        let threadFile;
        if (args.thread_id === "latest") {
          const files = readdirSync(CACHE_DIR)
            .filter((f) => f.endsWith(".json"))
            .sort()
            .reverse();
          if (files.length === 0) {
            return {
              content: [
                { type: "text", text: "No active threads." },
              ],
            };
          }
          threadFile = join(CACHE_DIR, files[0]);
        } else {
          threadFile = join(CACHE_DIR, `${args.thread_id}.json`);
          if (!existsSync(threadFile))
            threadFile = join(
              HANDOFF_DIR,
              `${args.thread_id}.json`,
            );
        }

        if (!existsSync(threadFile)) {
          return {
            content: [
              { type: "text", text: `Thread not found.` },
            ],
          };
        }

        const thread = readJson(threadFile);

        if (args.summary) {
          const lines = [
            `**[${thread.id}] ${thread.title}**`,
            `Type: ${thread.type} | Status: ${thread.status}`,
            `Started: ${thread.started_at} | Messages: ${thread.messages.length}`,
            `Participants: ${thread.participants.join(", ")}`,
            `Tags: ${thread.tags.join(", ") || "none"}`,
            ``,
            `Extracted:`,
            `  Decisions: ${thread.extracted.decisions.length}`,
            `  Action items: ${thread.extracted.action_items.length}`,
            `  Rule candidates: ${thread.extracted.rule_candidates.length}`,
            `  Skill candidates: ${thread.extracted.skill_candidates.length}`,
          ];
          return {
            content: [{ type: "text", text: lines.join("\n") }],
          };
        }

        // Full transcript
        const lines = [
          `**[${thread.id}] ${thread.title}**`,
          `Type: ${thread.type} | Started: ${thread.started_at}`,
          `Participants: ${thread.participants.join(", ")}`,
          ``,
          `── TRANSCRIPT ──`,
          ...thread.messages.map(
            (m) =>
              `[${m.timestamp.slice(11, 19)}] **${m.speaker}:** ${m.content}`,
          ),
          ``,
          `── EXTRACTED ──`,
          `Decisions: ${thread.extracted.decisions.map((d) => d.text).join("; ") || "none"}`,
          `Action items: ${thread.extracted.action_items.map((a) => a.text).join("; ") || "none"}`,
          `Rule candidates: ${thread.extracted.rule_candidates.map((r) => r.text).join("; ") || "none"}`,
        ];

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      case "gabriel_cache_handoff": {
        ensureState();
        let threadFile;
        let threadId = args.thread_id;

        if (threadId === "latest") {
          const files = readdirSync(CACHE_DIR)
            .filter((f) => f.endsWith(".json"))
            .sort()
            .reverse();
          if (files.length === 0) {
            return {
              content: [
                { type: "text", text: "No active threads to hand off." },
              ],
            };
          }
          threadFile = join(CACHE_DIR, files[0]);
          threadId = files[0].replace(".json", "");
        } else {
          threadFile = join(CACHE_DIR, `${threadId}.json`);
        }

        if (!existsSync(threadFile)) {
          return {
            content: [
              {
                type: "text",
                text: `Thread not found: ${threadId}`,
              },
            ],
          };
        }

        const thread = readJson(threadFile);
        thread.status = "handed_off";
        thread.handed_off_at = now();
        thread.handoff_summary = args.summary || null;
        thread.extract_rules =
          args.extract_rules !== false;
        thread.handoff_priority = args.priority || "P2";

        // Move to handoff directory
        const handoffFile = join(HANDOFF_DIR, `${threadId}.json`);
        writeJson(handoffFile, thread);

        // Remove from cache
        try {
          const { unlinkSync } = await import("fs");
          unlinkSync(threadFile);
        } catch {
          /* file already moved */
        }

        return {
          content: [
            {
              type: "text",
              text: [
                `✓ Thread [${threadId}] handed off to Lucy/Pops`,
                `Title: ${thread.title}`,
                `Messages: ${thread.messages.length}`,
                `Summary: ${args.summary || "none provided"}`,
                `Extract rules: ${thread.extract_rules ? "yes" : "no"}`,
                `Priority: ${thread.handoff_priority}`,
                ``,
                `Extracted for Lucy:`,
                `  ${thread.extracted.decisions.length} decisions`,
                `  ${thread.extracted.action_items.length} action items`,
                `  ${thread.extracted.rule_candidates.length} rule candidates`,
                `  ${thread.extracted.skill_candidates.length} skill candidates`,
                ``,
                `Lucy will process, archive, and integrate into the knowledge graph.`,
              ].join("\n"),
            },
          ],
        };
      }

      case "gabriel_cache_list": {
        ensureState();
        const status = args.status || "active";
        const limit = args.limit || 20;
        const results = [];

        const dirs =
          status === "all"
            ? [CACHE_DIR, HANDOFF_DIR]
            : status === "active"
              ? [CACHE_DIR]
              : [HANDOFF_DIR];

        for (const dir of dirs) {
          try {
            const files = readdirSync(dir)
              .filter((f) => f.endsWith(".json"))
              .sort()
              .reverse();
            for (const file of files) {
              if (results.length >= limit) break;
              try {
                const thread = readJson(join(dir, file));
                results.push(thread);
              } catch {
                /* skip */
              }
            }
          } catch {
            /* empty dir */
          }
        }

        if (results.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No ${status} conversation threads.`,
              },
            ],
          };
        }

        const lines = [
          `**CONVERSATION MAP — ${status.toUpperCase()}** (${results.length} threads)`,
          ``,
          ...results.map(
            (t) =>
              `${t.status === "active" ? "●" : "✓"} [${t.id}] **${t.title}**\n  ${t.type} · ${t.date} · ${t.messages.length} msgs · ${t.participants.join(", ")}\n  Tags: ${t.tags.join(", ") || "none"} · Decisions: ${t.extracted.decisions.length} · Actions: ${t.extracted.action_items.length}`,
          ),
        ];

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      case "gabriel_cache_search": {
        ensureState();
        const limit = args.limit || 20;
        const results = [];

        for (const dir of [CACHE_DIR, HANDOFF_DIR]) {
          try {
            const files = readdirSync(dir).filter((f) =>
              f.endsWith(".json"),
            );
            for (const file of files) {
              if (results.length >= limit) break;
              try {
                const thread = readJson(join(dir, file));

                if (args.type && thread.type !== args.type)
                  continue;
                if (
                  args.participant &&
                  !(thread.participants || []).includes(
                    args.participant,
                  )
                )
                  continue;
                if (
                  args.tag &&
                  !(thread.tags || []).includes(args.tag)
                )
                  continue;
                if (
                  args.date_from &&
                  thread.date < args.date_from
                )
                  continue;
                if (args.date_to && thread.date > args.date_to)
                  continue;
                if (
                  args.keyword &&
                  !JSON.stringify(thread)
                    .toLowerCase()
                    .includes(args.keyword.toLowerCase())
                )
                  continue;

                results.push(thread);
              } catch {
                /* skip */
              }
            }
          } catch {
            /* empty */
          }
        }

        if (results.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "No matching conversation threads.",
              },
            ],
          };
        }

        const lines = results.map(
          (t) =>
            `[${t.id}] ${t.status === "active" ? "●" : "✓"} **${t.title}** · ${t.type} · ${t.date} · ${t.messages.length} msgs`,
        );

        return {
          content: [
            {
              type: "text",
              text: `**Search results:** ${results.length}\n\n${lines.join("\n")}`,
            },
          ],
        };
      }

      // ─── WATCH LIST ───
      case "gabriel_watch_status": {
        const data = readJson(WATCHLIST_FILE);
        if (data.watches.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "Gabriel is not currently watching anything. Add items with gabriel_watch_add.",
              },
            ],
          };
        }

        const lines = [
          `**GABRIEL WATCH LIST** (${data.watches.length} items)`,
          `Last check: ${data.last_check || "never"}`,
          ``,
          ...data.watches.map(
            (w) =>
              `[${w.id}] ${w.type.toUpperCase()} · ${w.target}\n  Alert on: ${w.alert_on || "change"} · Added: ${w.added_at.slice(0, 10)}\n  ${w.note || ""}`,
          ),
        ];

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      case "gabriel_watch_add": {
        const data = readJson(WATCHLIST_FILE);
        const id = makeId("W");
        data.watches.push({
          id,
          target: args.target,
          type: args.type,
          alert_on: args.alert_on || "change",
          note: args.note || null,
          added_at: now(),
          last_status: null,
        });
        writeJson(WATCHLIST_FILE, data);

        return {
          content: [
            {
              type: "text",
              text: `✓ Watching [${id}] ${args.type}: ${args.target}\nAlert on: ${args.alert_on || "change"}`,
            },
          ],
        };
      }

      case "gabriel_watch_clear": {
        const data = readJson(WATCHLIST_FILE);
        const idx = data.watches.findIndex(
          (w) => w.id === args.watch_id,
        );
        if (idx === -1) {
          return {
            content: [
              {
                type: "text",
                text: `Watch ${args.watch_id} not found.`,
              },
            ],
          };
        }
        const removed = data.watches.splice(idx, 1)[0];
        writeJson(WATCHLIST_FILE, data);

        return {
          content: [
            {
              type: "text",
              text: `✓ Stopped watching: ${removed.target}`,
            },
          ],
        };
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
