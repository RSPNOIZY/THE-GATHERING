#!/usr/bin/env node
/**
 * NOIZY.AI — Gemma 3 MCP Setup Assistant
 * Model Context Protocol server powered by Gemma 3 (local Ollama on GOD.local)
 * Acts as agentic task assistant: file ops, shell, Cloudflare, pipeline setup
 *
 * Usage:  node server.js
 * Config: Add to Claude Desktop or any MCP client
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

const OLLAMA_URL  = process.env.OLLAMA_URL  || 'http://localhost:11434';
const GEMMA_MODEL = process.env.GEMMA_MODEL || 'gemma3:latest';
const NOIZYLAB    = process.env.NOIZYLAB_DIR || '/Users/m2ultra/NOIZYLAB';
const CF_ACCOUNT  = '5f36aa9795348ea681d0b21910dfc82a';

// ═══════════════════════════════════════════════════════════
//  MCP SERVER
// ═══════════════════════════════════════════════════════════

const server = new Server(
  { name: 'noizy-gemma3-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// ── LIST TOOLS ─────────────────────────────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'gemma3_ask',
      description: 'Ask Gemma 3 (local, M2 Ultra) a question. Use for agentic planning, setup guidance, code review, and task breakdown.',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Your question or task for Gemma 3' },
          context: { type: 'string', description: 'Optional system context (e.g. "you are a devops expert")' },
        },
        required: ['prompt'],
      },
    },
    {
      name: 'run_shell',
      description: 'Run a shell command on GOD.local (M2 Ultra). Safe commands only — reads, status checks, file operations.',
      inputSchema: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Shell command to run' },
          cwd: { type: 'string', description: 'Working directory (default: NOIZYLAB)' },
        },
        required: ['command'],
      },
    },
    {
      name: 'read_file',
      description: 'Read a file from the NOIZY filesystem on GOD.local',
      inputSchema: {
        type: 'object',
        properties: {
          filepath: { type: 'string', description: 'Absolute or NOIZYLAB-relative path' },
        },
        required: ['filepath'],
      },
    },
    {
      name: 'write_file',
      description: 'Write or create a file on GOD.local',
      inputSchema: {
        type: 'object',
        properties: {
          filepath: { type: 'string', description: 'Absolute or NOIZYLAB-relative path' },
          content: { type: 'string', description: 'File content to write' },
        },
        required: ['filepath', 'content'],
      },
    },
    {
      name: 'list_dir',
      description: 'List files in a directory on GOD.local',
      inputSchema: {
        type: 'object',
        properties: {
          dirpath: { type: 'string', description: 'Directory path (default: NOIZYLAB)' },
        },
      },
    },
    {
      name: 'cloudflare_status',
      description: 'Check Cloudflare Workers, R2, D1 status for NOIZY account',
      inputSchema: {
        type: 'object',
        properties: {
          token: { type: 'string', description: 'CF API token (optional, uses env if present)' },
          resource: { type: 'string', enum: ['workers', 'r2', 'd1', 'kv', 'all'], description: 'Which resource to check' },
        },
      },
    },
    {
      name: 'voice_pipeline_status',
      description: 'Check the NOIZY voice pipeline — Whisper, Claude API, Voice Bridge, Audio Hijack scripts',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'noizy_setup_guide',
      description: 'Get Gemma 3\'s step-by-step setup guidance for a specific NOIZY component',
      inputSchema: {
        type: 'object',
        properties: {
          component: {
            type: 'string',
            enum: ['whisper', 'cloudflare-tunnel', 'teams-bot', 'audio-hijack', 'wrangler', 'mcp-config', 'voice-pipeline', 'full-stack'],
            description: 'Which component to get setup help for',
          },
        },
        required: ['component'],
      },
    },
    {
      name: 'ollama_models',
      description: 'List models installed in Ollama on GOD.local',
      inputSchema: { type: 'object', properties: {} },
    },
  ],
}));

// ── CALL TOOL ──────────────────────────────────────────────
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {

      case 'gemma3_ask': {
        const reply = await askGemma3(args.prompt, args.context);
        return { content: [{ type: 'text', text: reply }] };
      }

      case 'run_shell': {
        const cwd = args.cwd || NOIZYLAB;
        const { stdout, stderr } = await execAsync(args.command, { cwd, timeout: 30000 });
        return { content: [{ type: 'text', text: stdout || stderr || '(no output)' }] };
      }

      case 'read_file': {
        const fp = resolvePath(args.filepath);
        const content = fs.readFileSync(fp, 'utf8');
        return { content: [{ type: 'text', text: content }] };
      }

      case 'write_file': {
        const fp = resolvePath(args.filepath);
        fs.mkdirSync(path.dirname(fp), { recursive: true });
        fs.writeFileSync(fp, args.content, 'utf8');
        return { content: [{ type: 'text', text: `✅ Written: ${fp}` }] };
      }

      case 'list_dir': {
        const dp = resolvePath(args.dirpath || NOIZYLAB);
        const files = fs.readdirSync(dp).map(f => {
          const stat = fs.statSync(path.join(dp, f));
          return `${stat.isDirectory() ? '📁' : '📄'} ${f}`;
        });
        return { content: [{ type: 'text', text: files.join('\n') }] };
      }

      case 'cloudflare_status': {
        const token = args.token || process.env.CLOUDFLARE_API_TOKEN || '';
        if (!token) return { content: [{ type: 'text', text: '⚠️ No CF token — set CLOUDFLARE_API_TOKEN in env or pass token arg' }] };
        const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      }

      case 'voice_pipeline_status': {
        const checks = [
          ['Whisper',       'which whisper || which mlx_whisper || ls ~/whisper.cpp/main 2>/dev/null || echo NOT_FOUND'],
          ['Voice Bridge',  'curl -s http://localhost:8080/health 2>/dev/null || echo NOT_RUNNING'],
          ['Ollama+Gemma3', 'curl -s http://localhost:11434/api/tags 2>/dev/null | python3 -c "import sys,json; models=[m[\'name\'] for m in json.load(sys.stdin)[\'models\']]; print(\'MODELS:\',\', \'.join(models))" 2>/dev/null || echo NOT_RUNNING'],
          ['Pipeline Dir',  `ls ${NOIZYLAB}/voice-pipeline/ 2>/dev/null || echo MISSING`],
          ['API Key',       'echo $ANTHROPIC_API_KEY | cut -c1-8 | sed "s/./*/g" || echo NOT_SET'],
        ];
        const results = [];
        for (const [label, cmd] of checks) {
          try {
            const { stdout } = await execAsync(cmd, { timeout: 5000 });
            results.push(`${label}: ${stdout.trim() || '✅'}`);
          } catch {
            results.push(`${label}: ❌ ERROR`);
          }
        }
        return { content: [{ type: 'text', text: results.join('\n') }] };
      }

      case 'noizy_setup_guide': {
        const guides = {
          'whisper': 'Install mlx-whisper for Apple Silicon: pip3 install mlx-whisper\nTest: mlx_whisper your-audio.wav --model mlx-community/whisper-base.en-mlx\nOr use openai-whisper: pip3 install openai-whisper && whisper audio.wav --model base.en',
          'cloudflare-tunnel': 'brew install cloudflared\ncloudflared tunnel login\ncloudflared tunnel create noizy-voice-bridge\ncloudflared tunnel route dns noizy-voice-bridge voice.noizy.ai\ncloudflared tunnel run --url http://localhost:8080 noizy-voice-bridge',
          'teams-bot': 'Teams → channel → ... → Connectors → Incoming Webhook → Create\nCopy webhook URL → add to NOIZYLAB/.env as TEAMS_WEBHOOK_URL\nPower Automate: New flow → When Teams message posted → HTTP POST to voice.noizy.ai/power-automate-webhook',
          'audio-hijack': '1. Audio Hijack → Window → Script Library → User Scripts → New Script\n2. Paste: ~/NOIZYLAB/voice-pipeline/audiohijack-recording-stop.js\n3. Session → Scripting tab → New Automation → Recording Stop → select script\n4. Start recording → script auto-fires when recording stops',
          'wrangler': 'wrangler login (opens browser)\ncd ~/NOIZYLAB/../noizy-command-center/../noizy-workers/claude-proxy\nwrangler secret put ANTHROPIC_API_KEY\nwrangler deploy',
          'mcp-config': 'Add to Claude Desktop config (~/.claude/claude_desktop_config.json):\n{"mcpServers":{"noizy-gemma3":{"command":"node","args":["/Users/m2ultra/NOIZYLAB/mcp-gemma3/server.js"]}}}',
          'voice-pipeline': 'Pipeline flow:\n1. Audio Hijack captures Teams audio → WAV file saved\n2. audiohijack-recording-stop.js fires on Recording Stop\n3. whisper-transcribe.sh → transcript.txt\n4. claude-prompt.sh → Claude API response\n5. teams-respond.sh → posts back to Teams channel',
          'full-stack': 'Full NOIZY stack setup order:\n1. Whisper (pip3 install mlx-whisper)\n2. Voice Bridge (node NOIZYLAB/voice-bridge-server.js)\n3. Audio Hijack script (paste JS into AH Script Library)\n4. Cloudflare Tunnel (cloudflared for remote access)\n5. Teams webhook + Power Automate flow\n6. Wrangler + CF Worker deploy\n7. MCP server (this, node mcp-gemma3/server.js)',
        };
        const guide = guides[args.component] || 'Component not found';
        const gemmaEnhanced = await askGemma3(
          `You are the NOIZY.AI MCP Setup Assistant running on GOD.local (M2 Ultra 192GB). Expand and improve this setup guide for "${args.component}":\n\n${guide}\n\nAdd any gotchas, tips specific to Apple Silicon M2 Ultra, and make it actionable.`,
          'You are a concise devops assistant. Give practical steps only.'
        );
        return { content: [{ type: 'text', text: gemmaEnhanced }] };
      }

      case 'ollama_models': {
        const res = await fetch(`${OLLAMA_URL}/api/tags`);
        const data = await res.json();
        const models = data.models.map(m => `${m.name} (${(m.size/1e9).toFixed(1)}GB)`);
        return { content: [{ type: 'text', text: `Ollama models on GOD.local:\n${models.join('\n')}` }] };
      }

      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (err) {
    return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
  }
});

// ── GEMMA 3 via Ollama ─────────────────────────────────────
async function askGemma3(prompt, systemContext = '') {
  const sys = systemContext || `You are the NOIZY.AI MCP Setup Assistant, powered by Gemma 3 running locally on GOD.local (M2 Ultra, 192GB RAM). You help Robert Stephen Plowman of Ottawa, Ontario, Canada set up and manage the NOIZY.AI voice library empire. Be concise, practical, and agentic. NOIZY.AI fights for fair compensation of AI and human voice actors.`;

  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: GEMMA_MODEL,
      messages: [
        { role: 'system', content: sys },
        { role: 'user',   content: prompt },
      ],
      stream: false,
    }),
  });
  const data = await res.json();
  return data.message?.content || 'No response from Gemma 3';
}

// ── PATH HELPER ─────────────────────────────────────────────
function resolvePath(p) {
  if (path.isAbsolute(p)) return p;
  return path.join(NOIZYLAB, p);
}

// ── START ───────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
console.error('🤖 NOIZY Gemma3 MCP Server running — GOD.local');
console.error(`📍 Ollama: ${OLLAMA_URL} | Model: ${GEMMA_MODEL}`);
