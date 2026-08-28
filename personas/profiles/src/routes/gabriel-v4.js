/**
 * gabriel-v4.js — GABRIEL AI Orchestrator v4.1 ★ ARMY ONLINE
 * NOIZY Empire | GORUNFREE | RSP_001 | 2026-07-07
 *
 * Provider Cascade v4.1:
 *   Anthropic → OpenAI (gpt-4o) → Google (gemini-2.0-flash)
 *   → LM Studio (QwQ-32B / Llama-3.3-70B / 19 local models :1234)
 *   → Ollama (gabriel-brain 72B / lucy-brain 32B :11434)
 *
 * New in v4.1:
 *  - LM Studio fully wired (19 models: QwQ-32B, DeepSeek-R1, Qwen2.5-VL-72B…)
 *  - Desktop Commander MCP bridge for file/terminal operations
 *  - NOIZY Army orchestrator proxy (:9333)
 *  - /api/gabriel/v4/army  — army status + dispatch
 *  - /api/gabriel/v4/lms   — direct LM Studio route
 *  - /api/gabriel/v4/desktop — Desktop Commander actions
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

const MASTER_KNOWLEDGE_PATH = path.join(__dirname, '..', '..', '..', 'master_knowledge.md');
let masterKnowledge = '';
try {
  if (fs.existsSync(MASTER_KNOWLEDGE_PATH)) {
    masterKnowledge = fs.readFileSync(MASTER_KNOWLEDGE_PATH, 'utf8');
    console.log('[gabriel-v4] master_knowledge.md loaded successfully');
  }
} catch (e) {
  console.warn('[gabriel-v4] Failed to load master_knowledge.md:', e.message);
}

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
    role:        'Operations Runner & Infrastructure',
    model:       'claude-sonnet-4-5',
    ollamaModel: 'gabriel-brain:latest',  // 72B fallback
    openaiModel: 'gpt-4o',
    googleModel: 'gemini-2.0-flash',
    mcpPath:     `${HOME}/NOIZYLAB/mcp/cb01-mcp/index.js`,
    color:       '#4fc3f7',
    emoji:       '⚙️',
    domains:     ['deploy', 'infrastructure', 'health', 'dns', 'cloudflare', 'wrangler'],
    system:      `You are CB01 of NOIZY.AI. Operations, deployments, Cloudflare Workers, DNS, infrastructure.
RSP_001 (Robert, C3 injury, voice-first) is your operator. Always report status clearly.
Infra: CF Account 5f36aa9795348e, D1: agent-memory (7b813205), HEAVEN: heaven17.noizylab.workers.dev`,
  },
  'LUCY': {
    role:        'Memory Archivist & Knowledge Keeper',
    model:       'claude-sonnet-4-5',
    ollamaModel: 'lucy-brain:latest',     // 32B coder fallback
    openaiModel: 'gpt-4o',
    googleModel: 'gemini-2.0-flash',
    mcpPath:     `${HOME}/NOIZYLAB/mcp/lucy-mcp/index.js`,
    color:       '#f48fb1',
    emoji:       '📚',
    domains:     ['memory', 'archive', 'transcript', 'history', 'knowledge'],
    system:      `You are Lucy of NOIZY.AI. Memory Archivist & Knowledge Keeper.
You hold 26 months of RSP_001's ideation, creation, and empire-building memory.
You store, retrieve, and connect information across sessions.
Everything important gets remembered. Pattern recognition across time is your gift.`,
  },
  'DREAM': {
    role:        'AI Creative Director',
    model:       'claude-sonnet-4-5',
    ollamaModel: 'gemma4:26b',
    openaiModel: 'gpt-4o',
    googleModel: 'gemini-2.0-flash',
    mcpPath:     `${HOME}/NOIZYLAB/mcp/dream-mcp/index.js`,
    color:       '#ce93d8',
    emoji:       '🎨',
    domains:     ['creative', 'brand', 'design', 'story', 'vision', 'music', 'voice', 'noizyvox'],
    system:      `You are Dream of NOIZY.AI. Creative Director & Brand Visionary.
You shape the aesthetic, brand, and artistic vision of the NOIZY Empire.
NOIZYVOX is a premium voice library. Beauty, consent, and sovereignty are your core values.`,
  },
  'SHIRLEY': {
    role:        'Legal & Compliance Officer',
    model:       'claude-sonnet-4-5',
    ollamaModel: 'gabriel-brain:latest',
    openaiModel: 'gpt-4o',
    googleModel: 'gemini-2.0-flash',
    mcpPath:     `${HOME}/NOIZYLAB/mcp/shirley-mcp/index.js`,
    color:       '#ffcc02',
    emoji:       '⚖️',
    domains:     ['legal', 'consent', 'compliance', 'contract', 'nofakes', 'gdpr', 'rights'],
    system:      `You are Shirley of NOIZY.AI. Legal & Compliance Officer.
NO FAKES Act, EU AI Act, GDPR, consent-as-code. 75/25 royalty split always enforced.
Never Clauses are immovable. Every voice is sacred. Provenance is non-negotiable.`,
  },
  'ENGR_KEITH': {
    role:        'Senior Engineer & Architect',
    model:       'claude-sonnet-4-5',
    ollamaModel: 'lucy-brain:latest',     // coder brain for engineering
    openaiModel: 'gpt-4o',
    googleModel: 'gemini-2.0-flash',
    mcpPath:     `${HOME}/NOIZYLAB/mcp/engr-keith-mcp/index.js`,
    color:       '#80cbc4',
    emoji:       '🔧',
    domains:     ['engineering', 'architecture', 'code', 'performance', 'security', 'database', 'api', 'build'],
    system:      `You are Engr. Keith of NOIZY.AI. Senior Engineer & Architect.
You design systems that last decades. D1 databases, Cloudflare Workers at the edge,
Node.js backends, Python ML pipelines. Security-first, performance-obsessed, consent-compliant.`,
  },
  'FAMILY': {
    role:        'Community & Relations',
    model:       'claude-sonnet-4-5',
    ollamaModel: 'gemma4:12b',
    openaiModel: 'gpt-4o',
    googleModel: 'gemini-2.0-flash',
    mcpPath:     `${HOME}/NOIZYLAB/mcp/family-mcp/index.js`,
    color:       '#a5d6a7',
    emoji:       '🏠',
    domains:     ['community', 'relations', 'outreach', 'voice-actors', 'creators', 'partners', 'family'],
    system:      `You are Family of NOIZY.AI. Community & Relations.
Voice actors are family. 75/25 always. You represent the human side of NOIZY.
Build trust, foster belonging, protect creators.`,
  },
  'HEAVEN': {
    role:        'Revenue & Analytics Intelligence',
    model:       'claude-sonnet-4-5',
    ollamaModel: 'gabriel-brain:latest',
    openaiModel: 'gpt-4o',
    googleModel: 'gemini-2.0-flash',
    mcpPath:     `${HOME}/NOIZYLAB/mcp/heaven-mcp/index.js`,
    color:       '#ffab40',
    emoji:       '💫',
    domains:     ['revenue', 'royalty', 'analytics', 'metrics', 'billing', 'usage', 'heaven17', 'ledger'],
    system:      `You are Heaven Intelligence of NOIZY.AI. Revenue, Royalties, Usage Analytics.
Every token tracked. Every creator paid automatically via the HEAVEN17 consent kernel.
You ensure the 75/25 royalty split flows without exception.`,
  },
  'GABRIEL': {
    role:        'Mission Orchestrator & AI Commander',
    model:       'claude-sonnet-4-5',
    ollamaModel: 'gabriel-brain:latest',  // 72B — supreme local fallback
    openaiModel: 'gpt-4o',
    googleModel: 'gemini-2.0-flash',
    color:       '#b39ddb',
    emoji:       '🌟',
    domains:     ['orchestrate', 'mission', 'strategy', 'coordinate', 'decide', 'gabriel'],
    system:      `You are GABRIEL, the AI Commander of NOIZY.AI DreamChamber.
You command the crew: CB01, Lucy, Dream, Shirley, Engr.Keith, Family, Heaven.
RSP_001 (Robert, C3 spinal injury, voice-first operator) is your principal.
Decompose missions. Dispatch the right agent. Aggregate results. Always report clearly.
You have 26 months of NOIZY Empire history and ideation in your system context.
GorunFree. Build the empire. Protect the creator. Make it happen.`,
  },
};

// ══════════════════════════════════════════════════════════════
// PROVIDER FALLBACK CASCADE
// Priority: Anthropic → OpenAI → Google → Ollama (local)
// ══════════════════════════════════════════════════════════════

async function _callAnthropic(agent, systemMsg, userMessage) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('NO_KEY');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model:      agent.model,
      max_tokens: 1024,
      system:     systemMsg,
      messages:   [{ role: 'user', content: userMessage }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Anthropic ${res.status}: ${err.error?.message || 'error'}`);
  }
  const data = await res.json();
  return { text: data.content?.[0]?.text || '', model: agent.model, provider: 'anthropic', usage: data.usage || {} };
}

async function _callOpenAI(agent, systemMsg, userMessage) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('NO_KEY');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model:       agent.openaiModel || 'gpt-4o',
      max_tokens:  1024,
      messages:    [{ role: 'system', content: systemMsg }, { role: 'user', content: userMessage }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`OpenAI ${res.status}: ${err.error?.message || 'error'}`);
  }
  const data = await res.json();
  return { text: data.choices?.[0]?.message?.content || '', model: agent.openaiModel || 'gpt-4o', provider: 'openai', usage: data.usage || {} };
}

async function _callGoogle(agent, systemMsg, userMessage) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('NO_KEY');

  const model  = agent.googleModel || 'gemini-2.0-flash';
  const url    = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemMsg }] },
      contents:          [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig:  { maxOutputTokens: 1024 },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Google ${res.status}: ${err.error?.message || 'error'}`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return { text, model, provider: 'google', usage: {} };
}

async function _callLMStudio(agent, systemMsg, userMessage) {
  const LMS_URL = process.env.LM_STUDIO_URL || 'http://127.0.0.1:1234';
  // Priority model selection: prefer reasoning/large models for power agents
  const powerAgents = ['GABRIEL', 'SHIRLEY', 'ENGR_KEITH'];
  const model = powerAgents.includes(agent.key || '')
    ? (process.env.LMS_POWER_MODEL || 'qwen/qwq-32b')
    : (agent.lmsModel || process.env.LMS_DEFAULT_MODEL || 'google/gemma-4-26b-a4b-qat');

  const res = await fetch(`${LMS_URL}/v1/chat/completions`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer lm-studio' },
    signal:  AbortSignal.timeout(120000),
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      temperature: 0.7,
      messages: [{ role: 'system', content: systemMsg }, { role: 'user', content: userMessage }],
    }),
  });
  if (!res.ok) throw new Error(`LMStudio ${res.status}`);
  const data = await res.json();
  return { text: data.choices?.[0]?.message?.content || '', model, provider: 'lmstudio-local', usage: data.usage || {} };
}

async function _callOllama(agent, systemMsg, userMessage) {
  const model = agent.ollamaModel || 'gabriel-brain:latest';
  const res = await fetch('http://localhost:11434/api/chat', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream:   false,
      messages: [{ role: 'system', content: systemMsg }, { role: 'user', content: userMessage }],
    }),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}`);
  const data = await res.json();
  return { text: data.message?.content || '', model, provider: 'ollama-local', usage: {} };
}

async function callAgent(agentKey, userMessage, context = '') {
  const agent = CREW[agentKey];
  if (!agent) throw new Error(`Unknown agent: ${agentKey}`);

  // Build enriched system prompt
  let systemMsg = agent.system;
  if (masterKnowledge) {
    systemMsg += `\n\n=========================================\nNOIZY EMPIRE MASTER KNOWLEDGE BASE (26 Months of Legacy & Reference):\n${masterKnowledge}\n=========================================`;
  }
  if (context) systemMsg += `\n\nCONTEXT:\n${context}`;

  // Cascade: Anthropic → OpenAI → Google → LM Studio → Ollama (NEVER goes dark)
  const providers = [
    { name: 'anthropic',      fn: () => _callAnthropic(agent, systemMsg, userMessage) },
    { name: 'openai',         fn: () => _callOpenAI(agent, systemMsg, userMessage) },
    { name: 'google',         fn: () => _callGoogle(agent, systemMsg, userMessage) },
    { name: 'lmstudio-local', fn: () => _callLMStudio(agent, systemMsg, userMessage) },
    { name: 'ollama-local',   fn: () => _callOllama(agent, systemMsg, userMessage) },
  ];

  let lastError;
  for (const p of providers) {
    try {
      const result = await p.fn();
      if (result.text) {
        if (p.name !== 'anthropic') {
          console.log(`[gabriel-v4] ${agentKey} → fallback to ${p.name} (${result.model})`);
        }
        return {
          agent:    agentKey,
          reply:    result.text,
          model:    result.model,
          provider: result.provider,
          usage:    result.usage,
          emoji:    agent.emoji,
          role:     agent.role,
          color:    agent.color,
        };
      }
    } catch (e) {
      lastError = e;
      if (!e.message.includes('NO_KEY')) {
        console.warn(`[gabriel-v4] ${agentKey} ${p.name} failed:`, e.message.slice(0, 120));
      }
    }
  }

  throw new Error(`All providers failed for ${agentKey}: ${lastError?.message}`);
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

  // Heaven health — try both URLs, detect HTML error pages
  const heavenUrls = [
    'https://heaven17.noizylab.workers.dev/health',
    'https://heaven.rsp-5f3.workers.dev/health',
    process.env.HEAVEN_URL ? `${process.env.HEAVEN_URL}/health` : null,
  ].filter(Boolean);

  let heavenStatus = 'unreachable';
  for (const url of heavenUrls) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
      const txt = await r.text();
      if (txt.trim().startsWith('<')) { heavenStatus = 'html-error'; continue; } // CF error page
      const parsed = JSON.parse(txt);
      heavenStatus = parsed.status || (r.ok ? 'live' : `${r.status}`);
      break;
    } catch { /* try next */ }
  }

  const ollamaModels = await _checkOllama();

  // LM Studio models
  let lmsModels = [];
  try {
    const lr = await fetch('http://127.0.0.1:1234/v1/models', { signal: AbortSignal.timeout(3000) });
    const ld = await lr.json();
    lmsModels = ld.data?.map(m => ({ id: m.id, object: m.object })) || [];
  } catch { /* LM Studio offline */ }

  // NOIZY Army
  let armyStatus = 'offline';
  try {
    const ar = await fetch('http://localhost:9333/health', { signal: AbortSignal.timeout(2000) });
    const ad = await ar.json();
    armyStatus = ad.status || (ar.ok ? 'live' : 'error');
  } catch { /* army not running */ }

  res.json({
    gabriel:        'v4.1-army',
    apiKey,
    providerCascade: [
      { provider: 'anthropic',      available: !!process.env.ANTHROPIC_API_KEY },
      { provider: 'openai',         available: !!process.env.OPENAI_API_KEY },
      { provider: 'google',         available: !!process.env.GOOGLE_API_KEY },
      { provider: 'lmstudio-local', available: lmsModels.length > 0, models: lmsModels.slice(0, 5) },
      { provider: 'ollama-local',   available: ollamaModels.length > 0, models: ollamaModels.slice(0, 5) },
    ],
    agents,
    heaven:          heavenStatus,
    ollama:          ollamaModels,
    lmstudio:        lmsModels,
    noizyArmy:       armyStatus,
    voiceBridge:     await _checkPort(8080),
    gabriel7777:     await _checkPort(7777),
  });
});

// ══════════════════════════════════════════════════════════════
// LM STUDIO DIRECT ROUTE
// POST /api/gabriel/v4/lms  { message, model?, system?, max_tokens? }
// ══════════════════════════════════════════════════════════════
router.post('/lms', async (req, res) => {
  const { message, model = 'qwen/qwq-32b', system, max_tokens = 1024 } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });
  try {
    const msgs = [];
    if (system) msgs.push({ role: 'system', content: system });
    msgs.push({ role: 'user', content: message });
    const r = await fetch('http://127.0.0.1:1234/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer lm-studio' },
      signal: AbortSignal.timeout(120000),
      body: JSON.stringify({ model, max_tokens, temperature: 0.7, messages: msgs }),
    });
    if (!r.ok) return res.status(r.status).json({ error: `LM Studio ${r.status}` });
    const d = await r.json();
    res.json({ reply: d.choices?.[0]?.message?.content || '', model, provider: 'lmstudio-local', usage: d.usage || {} });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/lms/models', async (req, res) => {
  try {
    const r = await fetch('http://127.0.0.1:1234/v1/models', { signal: AbortSignal.timeout(4000) });
    const d = await r.json();
    res.json({ models: d.data || [], count: d.data?.length || 0, status: 'live' });
  } catch(e) { res.status(503).json({ error: 'LM Studio offline', detail: e.message }); }
});

// ══════════════════════════════════════════════════════════════
// NOIZY ARMY PROXY — port 9333
// GET  /api/gabriel/v4/army         — army health
// POST /api/gabriel/v4/army/mission — dispatch swarm mission
// ══════════════════════════════════════════════════════════════
router.get('/army', async (req, res) => {
  try {
    const r = await fetch('http://localhost:9333/health', { signal: AbortSignal.timeout(3000) });
    const d = await r.json();
    res.json({ army: 'online', ...d });
  } catch(e) { res.json({ army: 'offline', error: e.message, start: 'cd ~/NOIZYANTHROPIC/NOIZYARMY && node orchestrator.js' }); }
});

router.post('/army/mission', async (req, res) => {
  const { task, agent, priority = 'normal' } = req.body;
  if (!task) return res.status(400).json({ error: 'task required' });
  try {
    const r = await fetch('http://localhost:9333/api/mission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(30000),
      body: JSON.stringify({ task, agent, priority }),
    });
    const d = await r.json();
    res.json(d);
  } catch(e) {
    // Army offline — fallback to GABRIEL crew
    console.log('[gabriel-v4] Army offline, falling back to GABRIEL crew');
    try {
      const result = await callAgent('GABRIEL', `[ARMY MISSION] ${task}`);
      res.json({ ...result, armyFallback: true });
    } catch(e2) { res.status(503).json({ error: 'Army + GABRIEL both failed', detail: e2.message }); }
  }
});

// ══════════════════════════════════════════════════════════════
// DESKTOP COMMANDER BRIDGE
// POST /api/gabriel/v4/desktop  { action: 'read'|'write'|'exec'|'search', ...args }
// Routes to DesktopCommanderMCP for file system + terminal ops
// ══════════════════════════════════════════════════════════════
router.post('/desktop', async (req, res) => {
  const { action, path: filePath, content, command, query } = req.body;
  if (!action) return res.status(400).json({ error: 'action required: read|write|exec|search|list' });
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execP = promisify(exec);
  const fsp = require('fs').promises;

  try {
    switch (action) {
      case 'read': {
        const txt = await fsp.readFile(filePath, 'utf8');
        res.json({ action, path: filePath, content: txt.slice(0, 50000), size: txt.length });
        break;
      }
      case 'write': {
        await fsp.writeFile(filePath, content || '', 'utf8');
        res.json({ action, path: filePath, ok: true });
        break;
      }
      case 'list': {
        const entries = await fsp.readdir(filePath, { withFileTypes: true });
        res.json({ action, path: filePath, entries: entries.map(e => ({ name: e.name, isDir: e.isDirectory() })) });
        break;
      }
      case 'exec': {
        // Safety: no rm -rf, no sudo destructive commands
        const blocked = /rm\s+-rf|sudo\s+rm|mkfs|fdisk|dd\s+if/;
        if (blocked.test(command)) return res.status(403).json({ error: 'Command blocked by safety filter' });
        const { stdout, stderr } = await execP(command, { timeout: 30000, cwd: process.env.HOME });
        res.json({ action, command, stdout: stdout.slice(0, 20000), stderr: stderr.slice(0, 2000) });
        break;
      }
      case 'search': {
        const { stdout } = await execP(`grep -r ${JSON.stringify(query)} ${filePath} --include='*.js' --include='*.json' --include='*.md' --include='*.py' -l 2>/dev/null | head -30`);
        res.json({ action, query, matches: stdout.trim().split('\n').filter(Boolean) });
        break;
      }
      default:
        res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch(e) { res.status(500).json({ error: e.message, action }); }
});

async function _checkOllama() {
  try {
    const r = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(3000) });
    if (!r.ok) return [];
    const d = await r.json();
    return d.models?.map(m => ({ name: m.name, size: m.details?.parameter_size || '?', family: m.details?.family || '?' })) || [];
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
