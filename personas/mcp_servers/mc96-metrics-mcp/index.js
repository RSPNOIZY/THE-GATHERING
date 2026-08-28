#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const server = new Server(
  { name: "mc96-metrics-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "metrics_get_activity",
      description: "Analyze the JSONL logs in THE-GATHERING/telemetry/ to visualize how much creative work has been done.",
      inputSchema: { type: "object", properties: {} },
    }
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "metrics_get_activity") {
      const receiptFile = join(homedir(), "RSPNOIZY", "THE-GATHERING", "discord", "receipts.jsonl");
      
      if (!existsSync(receiptFile)) {
        return {
          content: [{ type: "text", text: "No telemetry data found yet." }]
        };
      }

      const content = readFileSync(receiptFile, 'utf8');
      const lines = content.split('\n').filter(l => l.trim().length > 0);
      
      let dazeflowCount = 0;
      let recentEntries = [];

      lines.forEach(line => {
        try {
          const entry = JSON.parse(line);
          if (entry.action === "dazeflow_log") {
            dazeflowCount++;
            recentEntries.push(`[${entry.timestamp.slice(0,10)}] ${entry.type || "note"}: ${entry.entry}`);
          }
        } catch (e) {
          // Skip invalid JSON
        }
      });

      const summary = `**MC96 Metrics Snapshot**\n` +
                      `- Total Dazeflow Entries Logged: ${dazeflowCount}\n\n` +
                      `**Recent Activity:**\n${recentEntries.slice(-5).join("\n")}`;

      return {
        content: [{ type: "text", text: summary }],
      };
    }

    throw new Error(`Tool not found: ${name}`);
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error: ${err.message}` }],
      isError: true,
    };
  }
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MC96 Metrics MCP server running on stdio");
}

run().catch(console.error);
