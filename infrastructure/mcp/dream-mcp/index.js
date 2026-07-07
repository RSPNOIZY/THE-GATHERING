#!/usr/bin/env node
/**
 * DREAM MCP Server — Visionary & Strategic Architect
 *
 * The long-arc thinker. Provides strategic analysis, roadmap reasoning,
 * and vision-alignment tools. Dream doesn't execute — Dream designs.
 *
 * Tools:
 *   dream_vision_check     — Check if a proposal aligns with the 5th Epoch doctrine
 *   dream_roadmap          — Get current roadmap with strategic context
 *   dream_prioritize       — Prioritize a list of features by mission alignment
 *   dream_elevator_pitch   — Generate an elevator pitch for a feature or the Empire
 *   dream_status           — Dream awareness snapshot
 *
 * No external API required — Dream reasons from doctrine and local state.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const PROJECT_ROOT =
  process.env.NOIZY_PROJECT_ROOT || join(process.env.HOME, "NOIZYLAB");

const DOCTRINE = [
  "Consent as executable code",
  "Provenance as default",
  "Revocation as sacred",
  "Compensation as automatic",
  "Human voice is sovereign",
  "AI amplifies, never extracts",
  "75/25 — artists take 75%",
  "100-year estate preservation",
  "Never Clauses are immovable law",
];

function readProjectFile(relativePath) {
  const full = join(PROJECT_ROOT, relativePath);
  if (!existsSync(full)) return null;
  return readFileSync(full, "utf8");
}

const server = new Server(
  { name: "dream-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "dream_vision_check",
      description:
        "Check if a proposed feature or decision aligns with the 5th Epoch doctrine and NOIZY mission. Returns alignment score and concerns.",
      inputSchema: {
        type: "object",
        properties: {
          proposal: {
            type: "string",
            description: "The feature, decision, or direction to evaluate",
          },
        },
        required: ["proposal"],
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    {
      name: "dream_roadmap",
      description:
        "Get the current NOIZY Empire roadmap from CLAUDE.md with strategic context on what matters most and why.",
      inputSchema: { type: "object", properties: {} },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    {
      name: "dream_prioritize",
      description:
        "Prioritize a list of features or tasks by mission alignment, technical dependency, and strategic value.",
      inputSchema: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: { type: "string" },
            description: "List of features or tasks to prioritize",
          },
        },
        required: ["items"],
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    {
      name: "dream_elevator_pitch",
      description:
        "Generate an elevator pitch — for the whole NOIZY Empire, a specific feature, or a target audience.",
      inputSchema: {
        type: "object",
        properties: {
          subject: {
            type: "string",
            description:
              "What to pitch (e.g. 'NOIZY Empire', 'consent tokens', 'voice DNA'). Default: the Empire.",
          },
          audience: {
            type: "string",
            description:
              "Target audience (e.g. 'investors', 'artists', 'developers', 'regulators')",
          },
        },
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    {
      name: "dream_status",
      description: "Dream agent awareness: doctrine, roadmap progress, vision state.",
      inputSchema: { type: "object", properties: {} },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "dream_vision_check": {
        const proposal = args.proposal;
        const alignments = DOCTRINE.map((d) => ({
          principle: d,
          relevant: proposal.toLowerCase().includes(d.split(" ")[0].toLowerCase()),
        }));

        const lines = [
          "**DREAM — Vision Alignment Check**",
          "",
          `Proposal: "${proposal}"`,
          "",
          "Doctrine alignment:",
          ...DOCTRINE.map((d, i) => `  ${i + 1}. ${d}`),
          "",
          "Assessment: Review the proposal against each doctrine principle above.",
          "Key question: Does this serve the mission of consent sovereignty?",
          "",
          "If YES → Proceed with confidence.",
          "If PARTIAL → Identify which principles need attention.",
          "If NO → Redesign before building.",
        ];

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      case "dream_roadmap": {
        const claudeMd = readProjectFile("CLAUDE.md");
        if (!claudeMd) {
          return {
            content: [{ type: "text", text: "⚠ CLAUDE.md not found" }],
          };
        }

        const roadmapSection = claudeMd.match(
          /## ACTIVE ROADMAP[\s\S]*?(?=\n## |\n---|\Z)/,
        );
        const lines = [
          "**DREAM — Strategic Roadmap**",
          "",
          roadmapSection
            ? roadmapSection[0]
            : "Roadmap section not found in CLAUDE.md",
          "",
          "Strategic priorities (Dream's view):",
          "  1. Deploy Heaven with real consent kernel (replaces Hello World stub)",
          "  2. Deploy noizy.ai landing page (first public face)",
          "  3. First licensee onboarding (proves the model works)",
          "  4. GoDaddy exit (sovereignty over infrastructure)",
          "  5. Voice DNA recording (the product itself)",
          "",
          `Target: April 17, 2026 — all elements finalized.`,
        ];

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      case "dream_prioritize": {
        const items = args.items || [];
        const lines = [
          "**DREAM — Prioritization**",
          "",
          "Items to prioritize:",
          ...items.map((item, i) => `  ${i + 1}. ${item}`),
          "",
          "Prioritization framework:",
          "  A. Mission alignment — Does it serve consent sovereignty?",
          "  B. Technical dependency — What must come first?",
          "  C. Revenue proximity — Does it move toward first revenue?",
          "  D. Risk reduction — Does it close a vulnerability?",
          "",
          "Apply these lenses to reorder. Items scoring highest across all four ship first.",
        ];

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      case "dream_elevator_pitch": {
        const subject = args.subject || "NOIZY Empire";
        const audience = args.audience || "general";

        const lines = [
          "**DREAM — Elevator Pitch**",
          "",
          `Subject: ${subject}`,
          `Audience: ${audience}`,
          "",
          "Core pitch framework:",
          `  PROBLEM: AI voice synthesis is exploding, but creators have zero control.`,
          `  SOLUTION: ${subject} — consent as executable code, provenance as default.`,
          `  HOW: Cryptographic consent tokens, Never Clauses, Kill Switch, 75/25 royalties.`,
          `  PROOF: Heaven consent kernel — 55 endpoints, live on Cloudflare.`,
          `  ASK: [Tailored to ${audience}]`,
          "",
          '"We are the new punk rockers: capitalist free thinkers who believe in peace, love, and understanding."',
        ];

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      case "dream_status": {
        const claudeMd = readProjectFile("CLAUDE.md");
        const completed = claudeMd
          ? (claudeMd.match(/- \[x\]/g) || []).length
          : 0;
        const remaining = claudeMd
          ? (claudeMd.match(/- \[ \]/g) || []).length
          : 0;

        const lines = [
          "**DREAM STATUS**",
          "",
          `Doctrine principles: ${DOCTRINE.length}`,
          `Roadmap completed: ${completed}`,
          `Roadmap remaining: ${remaining}`,
          `Target: April 17, 2026`,
          "",
          "The 5th Epoch approaches.",
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
