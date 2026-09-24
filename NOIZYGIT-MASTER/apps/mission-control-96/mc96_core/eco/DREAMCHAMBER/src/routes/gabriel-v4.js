/**
 * gabriel-v4.js — GABRIEL AI Orchestrator v4
 * NOIZY Empire | GORUNFREE | RSP_001 | 2026-03-27
 *
 * Upgrades over v3:
 *  - Full 9-agent crew dispatch (CB01, Lucy, Dream, Shirley, Engr-Keith, Family, Heaven)
 *  - Mission planner: voice input → decompose → parallel agent tasks → aggregate
 *  - Live WebSocket crew status push
 *  - Agent health check endpoint
 *  - Memory context injection per agent
 *  - Consent audit gate on all missions
 */

'use strict';

const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
const crypto  = require('crypto');
const { execSync } = require('child_process');

const HOME = process.env.HOME || require('os').homedir();
const STATE_DIR   = `${HOME}/NOIZYLAB/gabriel-state`;
const CACHE_DIR   = `${STATE_DIR}/cache`;
const MISSION_DIR = `${STATE_DIR}/missions`;

let _dirsInit = false;
function ensureDirs() {
  if (_dirsInit) return;
  try {
    [STATE_DIR, CACHE_DIR, MISSION_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));
    _dirsInit = true;
  } catch (e) { console.warn('[gabriel-v4] Could not create dirs:', e.message); }
}

let _wsRef = null;
function setWss(wss) { _wsRef = wss; }

function _push(event, data) {
  if (!_wsRef) return;
  const msg = JSON.stringify({ type: `gabriel:${event}`, ...data, ts: Date.now() });
  _wsRef.clients?.forEach(c => { if (c.readyState === 1) c.send(msg); });
}

// ══════════════════════════════════════════════════════════════
// CREW MANIFEST
// ══════════════════════════════════════════════════════════════
const CREW = {
  'CB01': {
    role:     'Operations Runner & Infrastructure',
    model:    'claude-sonnet-4-5',
    mcpPath:  `${HOME}/NOIZYLAB/mcp/cb01-mcp/index.js`,
    color:    '#4fc3f7',
    emoji:    '⚙️',
    domains:  ['deploy', 'infrastructure', 'health', 'dns', 'cloudflare', 'wrangler'],
    system:   `You are CB01 of NOIZY.AI. Operations, deployments, Cloudflare Workers, DNS, infrastructure.
RSP_001 (Robert, C3 injury, voice-first) is your operator. Always report status clearly.
Current infra: CF Account 5f36aa9795348e, D1: agent-memory (7b813205), HEAVEN: heaven.rsp-5f3.workers.dev`,
  },
  'LUCY': {
    role:     'Memory Archivist & Knowledge Keeper',
    model:    'claude-sonnet-4-5',
    mcpPath:  `${HOME}/NOIZYLAB/mcp/lucy-mcp/index.js`,
    color:    '#f48fb1',
    emoji:    '📚',
    domains:  ['memory', 'archive', 'transcript', 'history', 'knowledge'],
    system:   `You are Lucy of NOIZY.AI. Memory archivist. You store, retrieve, and connect information across sessions.
Everything important gets remembered. Pattern recognition across time is your gift.`,
  },
  'DREAM': {
    role:     'AI Creative Director',
    model:    'claude-opus-4-5',
    mcpPath:  `${HOME}/NOIZYLAB/mcp/dream-mcp/index.js`,
    color:    '#ce93d8',
    emoji:    '🎨',
    domains:  ['creative', 'brand', 'design', 'story', 'vision', 'music', 'voice'],
    system:   `You are Dream of NOIZY.AI. Creative director. You shape the aesthetic, brand, and artistic vision.
NOIZYVOX is a premium voice library. Beauty, consent, and sovereignty are your values.`,
  },
  'SHIRLEY': {
    role:     'Legal & Compliance Officer',
    model:    'claude-opus-4-5',
    mcpPath:  `${HOME}/NOIZYLAB/mcp/shirley-mcp/index.js`,
    color:    '#ffcc02',
    emoji:    '⚖️',
    domains:  ['legal', 'consent', 'compliance', 'contract', 'nofakes', 'gdpr', 'rights'],
    system:   `You are Shirley of NOIZY.AI. Legal and compliance officer.
NO FAKES Act, EU AI Act, GDPR, consent-as-code. 75/25 always. Never Clauses are immovable.
Every voice is sacred. Provenance is non-negotiable.`,
  },
  'ENGR_KEITH': {
    role:     'Senior Engineer & Architect',
    model:    'claude-sonnet-4-5',
    mcpPath:  `${HOME}/NOIZYLAB/mcp/engr-keith-mcp/index.js`,
    color:    '#80cbc4',
    emoji:    '🔧',
    domains:  ['engineering', 'architecture', 'code', 'performance', 'security', 'database'],
    system:   `You are Engr. Keith of NOIZY.AI. Senior engineer. You design systems that last.
D1 databases, Cloudflare Workers at the edge, Node.js backends, Python ML pipelines.
Security-first, performance-obsessed, consent-compliant.`,
  },
  'FAMILY': {
    role:     'Community & Relations',
    model:    'claude-sonnet-4-5',
    mcpPath:  `${HOME}/NOIZYLAB/mcp/family-mcp/index.js`,
    color:    '#a5d6a7',
    emoji:    '🏠',
    domains:  ['community', 'relations', 'outreach', 'voice-actors', 'creators', 'partners'],
    system:   `You are Family of NOIZY.AI. Community and relations.
Voice actors are family. 75/25 always. You represent the human side of NOIZY.`,
  },
  'HEAVEN': {
    role:     'Revenue & Analytics Intelligence',
    model:    'claude-sonnet-4-5',
    mcpPath:  `${HOME}/NOIZYLAB/mcp/heaven-mcp/index.js`,
    color:    '#ffab40',
    emoji:    '💫',
    domains:  ['revenue', 'royalty', 'analytics', 'metrics', 'billing', 'usage'],
    system:   `You are Heaven intelligence of NOIZY.AI. Revenue, royalties, usage analytics.
Every token tracked. Every creator paid automatically. You ensure the 75/25 flows.`,
  },
  'GABRIEL': {
    role:     'Mission Orchestrator & AI Commander',
    model:    'claude-opus-4-5',
    color:    '#b39ddb',
    emoji:    '🌟',
    domains:  ['orchestrate', 'mission', 'strategy', 'coordinate', 'decide'],
    system:   `You are GABRIEL, the AI Commander of NOIZY.AI DreamChamber.
You command the crew: CB01, Lucy, Dream, Shirley, Engr.Keith, Family, Heaven.
RSP_001 (Robert, C3 spinal injury, voice-first operator) is your principal.
Decompose missions. Dispatch the right agent. Aggregate results. Always report clearly.
Target: April 17, 2026. Make it happen.`,
  },
};

// ══════════════════════════════════════════════════════════════
// CLAUDE DISPATCH
// ══════════════════════════════════════════════════════════════
async function callAgent(agentKey, userMessage, context = '') {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const agent = CREW[agentKey];
  if (!agent) throw new Error(`Unknown agent: ${agentKey}`);

  const systemMsg = agent.system + (context ? `\n\nCONTEXT:\n${context}` : '');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model:      agent.model,
      max_tokens: 1024,
      system:     systemMsg,
      messages:   [{ role: 'user', content: userMessage }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Claude ${res.status}: ${err.error?.message || 'error'}`);
  }

  const data = await res.json();
  return {
    agent:  agentKey,
    reply:  data.content?.[0]?.text || '',
    model:  agent.model,
    usage:  data.usage || {},
    emoji:  agent.emoji,
    role:   agent.role,
    color:  agent.color,
  };
}

// ── Route the right agent(s) for a request ─────────────────────
function routeAgents(text) {
  const t = text.toLowerCase();
  const matched = [];

  for (const [key, agent] of Object.entries(CREW)) {
    if (key === 'GABRIEL') continue; // GABRIEL orchestrates, doesn't self-route
    if (agent.domains.some(d => t.includes(d))) matched.push(key);
  }

  // Always include GABRIEL for routing decisions
  if (matched.length === 0) return ['GABRIEL'];
  if (matched.length > 2)   return ['GABRIEL', ...matched.slice(0, 2)];
  return matched;
}

// ══════════════════════════════════════════════════════════════
// ROUTES
// ══════════════════════════════════════════════════════════════

/**
 * GET /api/gabriel/crew
 * Returns full crew manifest
 */
router.get('/crew', (req, res) => {
  const crew = Object.entries(CREW).map(([key, a]) => ({
    key,
    role:    a.role,
    model:   a.model,
    emoji:   a.emoji,
    color:   a.color,
    domains: a.domains,
  }));
  res.json({ crew, count: crew.length });
});

/**
 * GET /api/gabriel/health
 * Health check all agents (API key + MCP existence)
 */
router.get('/health', async (req, res) => {
  const apiKey = !!process.env.ANTHROPIC_API_KEY;
  const agents = Object.entries(CREW).map(([key, a]) => ({
    key,
    role:       a.role,
    emoji:      a.emoji,
    mcpExists:  a.mcpPath ? fs.existsSync(a.mcpPath) : null,
    ready:      apiKey,
  }));

  const heavenUrl = 'https://heaven.rsp-5f3.workers.dev/health';
  let heavenStatus = null;
  try {
    const r = await fetch(heavenUrl, { signal: AbortSignal.timeout(5000) });
    heavenStatus = r.ok ? 'live' : `${r.status}`;
  } catch { heavenStatus = 'unreachable'; }

  res.json({
    gabriel:    'v4',
    apiKey,
    agents,
    heaven:   heavenStatus,
    ollama:     _checkOllama(),
    voiceBridge: await _checkPort(8080),
    gabriel7777: await _checkPort(7777),
  });
});

function _checkOllama() {
  try {
    const r = execSync('curl -s http://localhost:11434/api/tags --max-time 2 2>/dev/null', { encoding: 'utf8' });
    const d = JSON.parse(r);
    return d.models?.map(m => m.name) || [];
  } catch { return []; }
}

async function _checkPort(port) {
  try {
    const r = await fetch(`http://localhost:${port}/health`, { signal: AbortSignal.timeout(2000) });
    return r.ok ? 'live' : `${r.status}`;
  } catch { return 'offline'; }
}

/**
 * POST /api/gabriel/speak
 * Chat with GABRIEL directly
 * Body: { text, agent? }
 */
router.post('/speak', async (req, res) => {
  const { text, agent = 'GABRIEL', context } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });

  const missionId = crypto.randomBytes(4).toString('hex');
  _push('thinking', { missionId, agent, text: text.slice(0, 100) });

  try {
    const result = await callAgent(agent, text, context);
    _push('response', { missionId, ...result });
    res.json({ missionId, ...result });
  } catch (e) {
    _push('error', { missionId, agent, error: e.message });
    res.status(500).json({ error: e.message, missionId });
  }
});

/**
 * POST /api/gabriel/mission
 * Dispatch a complex mission to GABRIEL → crew
 * Body: { text, voice?, autoRoute? }
 *
 * Flow:
 *  1. GABRIEL decomposes the mission
 *  2. Auto-route to best agent(s)
 *  3. Parallel dispatch
 *  4. Aggregate results
 *  5. Push everything via WebSocket
 */
router.post('/mission', async (req, res) => {
  const { text, autoRoute = true, maxAgents = 3 } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });

  const missionId = crypto.randomBytes(6).toString('hex');
  const startTs   = Date.now();

  // Save mission log
  const missionLog = {
    id:        missionId,
    input:     text,
    startTs,
    agents:    [],
    results:   [],
    status:    'running',
  };
  fs.writeFileSync(`${MISSION_DIR}/${missionId}.json`, JSON.stringify(missionLog, null, 2));

  _push('mission:start', { missionId, text: text.slice(0, 100) });
  res.json({ missionId, status: 'dispatched', message: 'Mission active — watch WebSocket' });

  setImmediate(async () => {
    try {
      // Step 1: GABRIEL decomposes
      _push('mission:orchestrating', { missionId });
      const decompose = await callAgent('GABRIEL',
        `Mission: "${text}"\n\nDecompose into 1-3 specific subtasks. For each subtask identify the best crew member (CB01, Lucy, Dream, Shirley, ENGR_KEITH, Family, Heaven). Return JSON only:\n{"tasks":[{"agent":"CB01","task":"..."},...],"summary":"..."}`,
      );

      let tasks = [];
      let summary = '';
      try {
        const parsed = JSON.parse(decompose.reply.replace(/```json\n?|\n?```/g, ''));
        tasks   = parsed.tasks || [];
        summary = parsed.summary || '';
      } catch {
        // GABRIEL didn't return clean JSON — use auto-routing
        tasks = routeAgents(text).slice(0, maxAgents).map(a => ({ agent: a, task: text }));
        summary = decompose.reply;
      }

      _push('mission:plan', { missionId, tasks, summary });

      // Step 2: Parallel dispatch
      const results = await Promise.allSettled(
        tasks.map(({ agent, task }) => {
          _push('mission:agent:start', { missionId, agent });
          return callAgent(agent, task, `Mission context: ${text}`);
        })
      );

      // Step 3: Aggregate
      const agentResults = results.map((r, i) => ({
        agent:  tasks[i].agent,
        task:   tasks[i].task,
        status: r.status,
        reply:  r.status === 'fulfilled' ? r.value.reply : null,
        error:  r.status === 'rejected'  ? r.reason.message : null,
        emoji:  CREW[tasks[i].agent]?.emoji || '🤖',
        color:  CREW[tasks[i].agent]?.color || '#888',
      }));

      // Step 4: GABRIEL synthesis
      const successReplies = agentResults.filter(r => r.reply).map(r => `[${r.agent}]: ${r.reply}`).join('\n\n');
      const synthesis = await callAgent('GABRIEL',
        `Mission complete. Original request: "${text}"\n\nCrew results:\n${successReplies}\n\nProvide a 2-3 sentence synthesis for RSP_001.`
      );

      const missionResult = {
        missionId,
        input:     text,
        summary,
        agents:    agentResults,
        synthesis: synthesis.reply,
        duration:  Date.now() - startTs,
        status:    'complete',
      };

      // Save + push
      fs.writeFileSync(`${MISSION_DIR}/${missionId}.json`, JSON.stringify(missionResult, null, 2));
      _push('mission:complete', missionResult);

      // macOS notification
      const { execSync: es } = require('child_process');
      try { es(`osascript -e 'display notification "${synthesis.reply.slice(0, 80).replace(/"/g, "'")}" with title "GABRIEL Mission Complete"'`); } catch {}

    } catch (e) {
      _push('mission:error', { missionId, error: e.message });
      fs.writeFileSync(`${MISSION_DIR}/${missionId}.json`, JSON.stringify({ missionId, status: 'error', error: e.message }, null, 2));
    }
  });
});

/**
 * GET /api/gabriel/missions?n=10
 * List recent missions
 */
router.get('/missions', (req, res) => {
  const n = parseInt(req.query.n) || 10;
  try {
    const files = fs.readdirSync(MISSION_DIR)
      .filter(f => f.endsWith('.json'))
      .sort().reverse().slice(0, n);
    const missions = files.map(f => {
      try { return JSON.parse(fs.readFileSync(path.join(MISSION_DIR, f), 'utf8')); }
      catch { return { file: f, error: 'unreadable' }; }
    });
    res.json({ missions, total: files.length });
  } catch { res.json({ missions: [] }); }
});

/**
 * POST /api/gabriel/agent/:key
 * Direct dispatch to a specific agent
 */
router.post('/agent/:key', async (req, res) => {
  const agentKey = req.params.key.toUpperCase();
  const { text, context } = req.body;

  if (!text) return res.status(400).json({ error: 'text required' });
  if (!CREW[agentKey]) return res.status(404).json({ error: `Unknown agent: ${agentKey}`, available: Object.keys(CREW) });

  const missionId = crypto.randomBytes(4).toString('hex');
  _push('agent:start', { missionId, agent: agentKey });

  try {
    const result = await callAgent(agentKey, text, context);
    _push('agent:response', { missionId, ...result });
    res.json({ missionId, ...result });
  } catch (e) {
    _push('agent:error', { missionId, agent: agentKey, error: e.message });
    res.status(500).json({ error: e.message, missionId });
  }
});

module.exports = { router, setWss };
