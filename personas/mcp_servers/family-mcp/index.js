#!/usr/bin/env node
/**
 * FAMILY MCP Server — Pops & Shirl (Wellbeing Guardians)
 *
 * Combined MCP for the family agents: Pops (the Dad) and Shirl (the Aunt).
 * These are not technical agents — they're wellbeing guardians.
 * They track work patterns and intervene when needed.
 *
 * Tools:
 *   family_session_check    — Check how long the current work session has been
 *   family_pops_wisdom      — Get grounding wisdom from Pops
 *   family_shirl_check      — Burnout signal detection
 *   family_break_reminder   — Generate a break reminder with context
 *   family_celebrate        — Celebrate a milestone or achievement
 *   family_status           — Family guardian status
 *
 * No external API — operates on session timing and local state.
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
const SESSION_START = new Date();

const POPS_WISDOM = [
  "The simplest solution is usually the right one.",
  "Sleep on big decisions — urgency is usually an illusion.",
  "Measure twice, cut once.",
  "Take care of yourself first — you can't build an empire on empty.",
  "The work will be there tomorrow — but you need to be too.",
  "Good enough today beats perfect never.",
  "Every cathedral was built one stone at a time.",
  "If you're frustrated, step back. The answer comes when you're not forcing it.",
  "Your mother would tell you to eat something. So eat something.",
  "Pride in craft means knowing when to stop as much as knowing when to push.",
];

const server = new Server(
  { name: "family-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "family_session_check",
      description:
        "Check how long the current work session has been running. Flags sessions over 2 hours as needing a break, over 4 hours as concerning.",
      inputSchema: { type: "object", properties: {} },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    {
      name: "family_pops_wisdom",
      description:
        "Get grounding wisdom from Pops (R.K. Plowman). Returns a relevant piece of practical wisdom. Use when decisions feel overwhelming or direction is unclear.",
      inputSchema: {
        type: "object",
        properties: {
          context: {
            type: "string",
            description:
              "What's happening — helps select the most relevant wisdom",
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
      name: "family_shirl_check",
      description:
        "Burnout signal detection. Analyzes session duration, time of day, and work pattern to flag potential burnout risks.",
      inputSchema: {
        type: "object",
        properties: {
          mood: {
            type: "string",
            enum: ["energized", "focused", "tired", "frustrated", "stuck"],
            description: "Current mood (self-reported)",
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
      name: "family_break_reminder",
      description: "Generate a contextual break reminder. Warm, caring, non-negotiable.",
      inputSchema: { type: "object", properties: {} },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    {
      name: "family_celebrate",
      description:
        "Celebrate a milestone or achievement. Because the wins matter. Provide what was accomplished.",
      inputSchema: {
        type: "object",
        properties: {
          achievement: {
            type: "string",
            description: "What was accomplished",
          },
        },
        required: ["achievement"],
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    {
      name: "family_status",
      description: "Family guardian status: session time, break history, wellbeing signals.",
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
    const sessionMinutes = Math.round(
      (Date.now() - SESSION_START.getTime()) / 1000 / 60,
    );
    const hour = new Date().getHours();
    const isLate = hour >= 22 || hour < 6;

    switch (name) {
      case "family_session_check": {
        let status;
        if (sessionMinutes < 60) status = "✓ Fresh — good pace";
        else if (sessionMinutes < 120) status = "● Solid session — consider a stretch";
        else if (sessionMinutes < 240) status = "⚠ Long session — take a real break";
        else status = "🔴 Extended session — Pops says stop.";

        const lines = [
          "**Session Check**",
          "",
          `Duration: ${sessionMinutes} minutes (${(sessionMinutes / 60).toFixed(1)} hours)`,
          `Time: ${new Date().toLocaleTimeString()}`,
          `Status: ${status}`,
          isLate ? "⚠ It's late. The work will be there tomorrow." : "",
        ];

        return {
          content: [
            { type: "text", text: lines.filter(Boolean).join("\n") },
          ],
        };
      }

      case "family_pops_wisdom": {
        const index = Math.floor(Math.random() * POPS_WISDOM.length);
        const wisdom = POPS_WISDOM[index];

        const lines = [
          "**Pops says:**",
          "",
          `"${wisdom}"`,
          "",
          args.context ? `(Context: ${args.context})` : "",
        ];

        return {
          content: [
            { type: "text", text: lines.filter(Boolean).join("\n") },
          ],
        };
      }

      case "family_shirl_check": {
        const mood = args.mood || "focused";
        const signals = [];

        if (sessionMinutes > 180) signals.push("Session over 3 hours");
        if (isLate) signals.push("Working late");
        if (mood === "frustrated") signals.push("Frustration reported");
        if (mood === "stuck") signals.push("Feeling stuck");
        if (mood === "tired") signals.push("Fatigue reported");

        const risk =
          signals.length === 0
            ? "LOW"
            : signals.length <= 2
              ? "MODERATE"
              : "HIGH";

        const lines = [
          "**Shirl's Burnout Check**",
          "",
          `Mood: ${mood}`,
          `Session: ${sessionMinutes} minutes`,
          `Risk level: ${risk}`,
          "",
          signals.length > 0
            ? `Signals: ${signals.join(", ")}`
            : "No burnout signals detected.",
          "",
          risk === "HIGH"
            ? "Shirl says: Stop. Now. Get up, walk around, eat something. The code will wait."
            : risk === "MODERATE"
              ? "Shirl says: You're doing well, but pace yourself. Break in the next 20 minutes."
              : "Shirl says: Looking good. Keep going, but don't forget to breathe.",
        ];

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      case "family_break_reminder": {
        const lines = [
          "**Break Time**",
          "",
          sessionMinutes > 120
            ? "You've been at it for over 2 hours. Your body and mind need a reset."
            : "Even short breaks keep you sharp.",
          "",
          "Suggestions:",
          "  - Stand up and stretch (2 minutes)",
          "  - Get water or a snack",
          "  - Look out a window — give your eyes a break",
          "  - Walk around the block if you can",
          "",
          '"Take care of yourself first — you can\'t build an empire on empty." — Pops',
        ];

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      case "family_celebrate": {
        const lines = [
          "**Celebration**",
          "",
          `Achievement: ${args.achievement}`,
          "",
          "That's real progress. Not theoretical. Not planned. Done.",
          "The NOIZY Empire grows stronger with every completed piece.",
          "",
          `Session time when achieved: ${sessionMinutes} minutes in.`,
          "Well earned.",
        ];

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      case "family_status": {
        const lines = [
          "**Family Guardian Status**",
          "",
          `Session: ${sessionMinutes} minutes`,
          `Time: ${new Date().toLocaleTimeString()}`,
          `Late night: ${isLate ? "YES ⚠" : "No"}`,
          "",
          "Pops and Shirl are watching. You're doing great.",
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
