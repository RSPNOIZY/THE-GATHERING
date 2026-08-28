import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs";
import path from "path";
import { exec } from "child_process";

// Core NOIZY paths
const NOIZY_ROOT = "/Users/m2ultra/NOIZYANTHROPIC";
const AUDIO_PROFILE_PATH = path.join(NOIZY_ROOT, "catalog", "audio_profile.json");
const AUDIO_RAG_SCRIPT = path.join(NOIZY_ROOT, "musical-computing-machine", "src", "audio_rag.py");
const MEMCELLS_PATH = path.join(NOIZY_ROOT, "catalog", "memcells", "audio_profile.json");

const server = new Server(
  {
    name: "supersonic-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Read the audio profile safely
function getAudioProfile() {
  try {
    if (fs.existsSync(AUDIO_PROFILE_PATH)) {
      return JSON.parse(fs.readFileSync(AUDIO_PROFILE_PATH, "utf-8"));
    }
  } catch (err) {
    console.error("Failed to read Audio Profile:", err);
  }
  return {};
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "query_semantic_audio",
        description: "DREAM's Tool: Search the Audio Profile for stems matching a specific acoustic vibe (brightness, percussiveness).",
        inputSchema: {
          type: "object",
          properties: {
            vibe: {
              type: "string",
              description: "The vibe to search for. Options: 'bright', 'dark', 'percussive', 'ambient'",
            },
          },
          required: ["vibe"],
        },
      },
      {
        name: "trigger_audio_ingestion",
        description: "ENGR_KEITH's Tool: Force a rebuild of the audio catalog by executing the librosa audio_rag pipeline.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "extract_stem_metadata",
        description: "POPS's Tool: Extract mathematical metadata for a specific stem to pipe into automation workflows.",
        inputSchema: {
          type: "object",
          properties: {
            stem_name: {
              type: "string",
              description: "The name of the stem (without .wav extension)",
            },
          },
          required: ["stem_name"],
        },
      },
      {
        name: "publish_audio_profile",
        description: "HEAVEN17's Tool: Publish the semantic RAG profile to the NOIZY.ai memcells repository for global backup.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const profile = getAudioProfile();

  if (request.params.name === "query_semantic_audio") {
    const { vibe } = request.params.arguments;
    let results = [];
    
    for (const [stem, features] of Object.entries(profile)) {
      if (vibe === "bright" && features.brightness_hz > 2000) results.push(stem);
      if (vibe === "dark" && features.brightness_hz < 1000) results.push(stem);
      if (vibe === "percussive" && features.percussiveness_zcr > 0.05) results.push(stem);
      if (vibe === "ambient" && features.percussiveness_zcr < 0.02) results.push(stem);
    }
    
    return {
      content: [{ type: "text", text: `Semantic Matches for '${vibe}':\n${results.join("\n")}` }],
    };
  }

  if (request.params.name === "trigger_audio_ingestion") {
    return new Promise((resolve) => {
      exec(`python3 ${AUDIO_RAG_SCRIPT}`, (error, stdout, stderr) => {
        if (error) {
          resolve({ content: [{ type: "text", text: `Ingestion Failed: ${stderr}` }] });
        } else {
          resolve({ content: [{ type: "text", text: `Ingestion Complete:\n${stdout}` }] });
        }
      });
    });
  }

  if (request.params.name === "extract_stem_metadata") {
    const { stem_name } = request.params.arguments;
    if (profile[stem_name]) {
      return {
        content: [{ type: "text", text: JSON.stringify(profile[stem_name], null, 2) }],
      };
    }
    return {
      content: [{ type: "text", text: `Stem '${stem_name}' not found in the Audio Profile.` }],
    };
  }

  if (request.params.name === "publish_audio_profile") {
    try {
      fs.mkdirSync(path.dirname(MEMCELLS_PATH), { recursive: true });
      fs.copyFileSync(AUDIO_PROFILE_PATH, MEMCELLS_PATH);
      return {
        content: [{ type: "text", text: `HEAVEN17: Audio Profile successfully published to ${MEMCELLS_PATH}` }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `HEAVEN17: Failed to publish - ${err.message}` }],
      };
    }
  }

  throw new Error(`Tool not found: ${request.params.name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("🚀 2056 SUPERSONIC Audio Enhancing MCP Server Running on stdio");
}

main().catch((error) => {
  console.error("Server Error:", error);
  process.exit(1);
});
