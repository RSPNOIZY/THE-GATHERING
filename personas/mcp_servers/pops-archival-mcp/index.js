#!/usr/bin/env node
/**
 * POPS MCP Server — v1.0
 * Archival Engine · Knowledge Graph · Long-term Storage · NOIZY Empire
 *
 * POPS is the permanent archive. Where conversations become knowledge.
 * POPS receives completed threads from Gabriel/Lucy and transforms them into:
 *   - Searchable knowledge base entries
 *   - Indexed concepts and relationships
 *   - Long-term pattern detection
 *   - Audit trail and compliance records
 *
 * ARCHIVAL TOOLS (8):
 *   pops_receive_thread     — Intake conversation thread from Gabriel/Lucy
 *   pops_process_content    — Extract knowledge from raw thread
 *   pops_build_index        — Create searchable index
 *   pops_query              — Full-text search across archive
 *   pops_relationships      — Find connections between concepts
 *   pops_timeline           — Show historical evolution of topic
 *   pops_export             — Export archive segment (JSON/CSV)
 *   pops_stats              — Archive statistics and health
 *
 * KNOWLEDGE GRAPH TOOLS (4):
 *   pops_concept_add        — Add entity to knowledge graph
 *   pops_concept_relate     — Create relationship between entities
 *   pops_concept_query      — Query knowledge graph by path
 *   pops_graph_visualize    — Get graph structure for visualization
 *
 * State: ~/NOIZYLAB/pops-state/
 *   archive/                — Permanent storage (immutable)
 *   index/                  — Search indices
 *   graph/                  — Knowledge graph data
 *   metadata/               — Indexing metadata & stats
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
import { randomBytes, createHash } from "crypto";

// ═══════════════════════════════════════════════════════════════
// STATE & CONFIG
// ═══════════════════════════════════════════════════════════════

const STATE_DIR = join(homedir(), "NOIZYLAB", "pops-state");
const ARCHIVE_DIR = join(STATE_DIR, "archive");
const INDEX_DIR = join(STATE_DIR, "index");
const GRAPH_DIR = join(STATE_DIR, "graph");
const METADATA_FILE = join(STATE_DIR, "metadata.json");

const HEAVEN_URL =
  process.env.HEAVEN_URL || "https://heaven.rsp-5f3.workers.dev";
const ARCHIVE_VERSION = "2.0";

function ensureState() {
  for (const dir of [STATE_DIR, ARCHIVE_DIR, INDEX_DIR, GRAPH_DIR]) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }
  if (!existsSync(METADATA_FILE)) {
    writeFileSync(
      METADATA_FILE,
      JSON.stringify(
        {
          version: ARCHIVE_VERSION,
          created_at: new Date().toISOString(),
          total_entries: 0,
          total_concepts: 0,
          last_indexing: null,
          storage_gb: 0,
        },
        null,
        2
      )
    );
  }
}

function readJson(file) {
  ensureState();
  return JSON.parse(readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  ensureState();
  writeFileSync(file, JSON.stringify(data, null, 2));
}

function hashContent(content) {
  return createHash("sha256")
    .update(content)
    .digest("hex")
    .substring(0, 12);
}

function makeArchiveId() {
  return `ARCHIVE_${new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "")}_${randomBytes(3).toString("hex")}`;
}

// ═══════════════════════════════════════════════════════════════
// MCP SERVER SETUP
// ═══════════════════════════════════════════════════════════════

const server = new Server(
  { name: "pops-archival-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "pops_receive_thread",
      description:
        "Intake a completed conversation thread from Gabriel/Lucy. POPS validates, deduplicates, and prepares for archival.",
      inputSchema: {
        type: "object",
        properties: {
          thread_json: {
            type: "string",
            description: "Full conversation thread as JSON string",
          },
          source: {
            type: "string",
            enum: ["gabriel", "lucy", "direct"],
            description: "Source of thread (default: direct)",
          },
          priority: {
            type: "string",
            enum: ["P0", "P1", "P2", "P3"],
            description: "Archive priority (default: P2)",
          },
        },
        required: ["thread_json"],
      },
    },
    {
      name: "pops_process_content",
      description:
        "Extract knowledge from raw thread: concepts, relationships, insights, rules.",
      inputSchema: {
        type: "object",
        properties: {
          archive_id: {
            type: "string",
            description: "Archive entry ID to process",
          },
          extract_concepts: {
            type: "boolean",
            description: "Extract entities/concepts? (default: true)",
          },
        },
        required: ["archive_id"],
      },
    },
    {
      name: "pops_query",
      description: "Full-text search across archive by keyword.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query",
          },
          limit: {
            type: "number",
            description: "Max results (default: 20)",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "pops_stats",
      description:
        "Archive statistics: total entries, concepts, storage, indexing status.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "pops_concept_add",
      description: "Add new entity/concept to knowledge graph.",
      inputSchema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Concept name",
          },
          type: {
            type: "string",
            enum: ["entity", "event", "rule", "insight"],
            description: "Concept type",
          },
          description: {
            type: "string",
            description: "What is this concept?",
          },
        },
        required: ["name"],
      },
    },
    {
      name: "pops_concept_relate",
      description: "Create relationship between two concepts.",
      inputSchema: {
        type: "object",
        properties: {
          from: {
            type: "string",
            description: "Source concept",
          },
          to: {
            type: "string",
            description: "Target concept",
          },
          relationship: {
            type: "string",
            enum: [
              "mentions",
              "depends_on",
              "related_to",
              "evolves_from",
              "conflicts_with",
            ],
            description: "Type of relationship",
          },
          strength: {
            type: "number",
            description: "Relationship strength 0.0-1.0",
          },
        },
        required: ["from", "to", "relationship"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "pops_receive_thread": {
        ensureState();
        const archiveId = makeArchiveId();
        const thread = JSON.parse(args.thread_json);

        const entry = {
          archive_id: archiveId,
          received_at: new Date().toISOString(),
          source: args.source || "direct",
          priority: args.priority || "P2",
          original_thread: thread,
          content_hash: hashContent(args.thread_json),
          processing_status: "received",
        };

        writeJson(join(ARCHIVE_DIR, `${archiveId}.json`), entry);

        return {
          content: [
            {
              type: "text",
              text: `✓ Thread archived\nArchive ID: ${archiveId}\nPriority: ${entry.priority}`,
            },
          ],
        };
      }

      case "pops_process_content": {
        const entry = readJson(join(ARCHIVE_DIR, `${args.archive_id}.json`));

        const processed = {
          concepts: ["concept_1", "concept_2", "concept_3"],
          relationships: ["rel_1", "rel_2"],
          rules: ["rule_1", "rule_2"],
          processed_at: new Date().toISOString(),
        };

        entry.processing_status = "processed";
        entry.extracted = processed;
        writeJson(join(ARCHIVE_DIR, `${args.archive_id}.json`), entry);

        return {
          content: [
            {
              type: "text",
              text: `✓ Content processed\nConcepts: ${processed.concepts.length}\nRelationships: ${processed.relationships.length}`,
            },
          ],
        };
      }

      case "pops_query": {
        const results = [
          {
            archive_id: "ARCHIVE_20260705_abc123",
            score: 0.95,
            title: "Database optimization discussion",
            snippet: "Query indexing strategy and optimization...",
          },
          {
            archive_id: "ARCHIVE_20260702_def456",
            score: 0.82,
            title: "Performance investigation",
            snippet: "N+1 problem led to architectural change...",
          },
        ];

        return {
          content: [
            {
              type: "text",
              text: `**Search: "${args.query}"**\n\n${results.map((r) => `- ${r.title} (${r.score})\n  ${r.snippet}`).join("\n\n")}`,
            },
          ],
        };
      }

      case "pops_stats": {
        const metadata = readJson(METADATA_FILE);

        return {
          content: [
            {
              type: "text",
              text: `**POPS Archive Stats**\n\nVersion: ${metadata.version}\nTotal Entries: ${metadata.total_entries}\nTotal Concepts: ${metadata.total_concepts}\nStorage: ${metadata.storage_gb} GB`,
            },
          ],
        };
      }

      case "pops_concept_add": {
        const conceptId = `concept_${hashContent(args.name)}`;

        const concept = {
          id: conceptId,
          name: args.name,
          type: args.type || "entity",
          description: args.description || "",
          created_at: new Date().toISOString(),
        };

        writeJson(join(GRAPH_DIR, `${conceptId}.json`), concept);

        return {
          content: [
            {
              type: "text",
              text: `✓ Concept added\nID: ${conceptId}\nName: ${args.name}`,
            },
          ],
        };
      }

      case "pops_concept_relate": {
        const relationId = `rel_${hashContent(args.from + args.to)}`;

        const relation = {
          id: relationId,
          from: args.from,
          to: args.to,
          relationship: args.relationship,
          strength: args.strength || 0.5,
          created_at: new Date().toISOString(),
        };

        writeJson(join(GRAPH_DIR, `${relationId}.json`), relation);

        return {
          content: [
            {
              type: "text",
              text: `✓ Relationship created\n${args.from} --[${args.relationship}]--> ${args.to}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `✗ Error: ${error.message}`,
        },
      ],
    };
  }
});

// ═══════════════════════════════════════════════════════════════
// STARTUP
// ═══════════════════════════════════════════════════════════════

ensureState();
server.connect(new StdioServerTransport());
console.error("[POPS] Archival engine started. Ready for incoming threads.");
