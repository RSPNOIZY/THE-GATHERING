/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 *   ███╗   ██╗ ██████╗ ██╗███████╗██╗   ██╗███╗   ██╗███████╗████████╗
 *   ████╗  ██║██╔═══██╗██║╚══███╔╝╚██╗ ██╔╝████╗  ██║██╔════╝╚══██╔══╝
 *   ██╔██╗ ██║██║   ██║██║  ███╔╝  ╚████╔╝ ██╔██╗ ██║█████╗     ██║
 *   ██║╚██╗██║██║   ██║██║ ███╔╝    ╚██╔╝  ██║╚██╗██║██╔══╝     ██║
 *   ██║ ╚████║╚██████╔╝██║███████╗   ██║   ██║ ╚████║███████╗   ██║
 *   ╚═╝  ╚═══╝ ╚═════╝ ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═══╝╚══════╝   ╚═╝
 *
 *   NOIZYNET HANDSHAKE SERVICE
 *   Runs on GOD (M2 Ultra) — The bridge between Heaven (edge) and local agents
 *
 *   "Nobody Died. Everybody LIVES Here."
 *   GORUNFREE — Rob Plowman — April 2026
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import http from 'node:http';
import crypto from 'node:crypto';

// ── CONFIG ───────────────────────────────────────────────────────────────────

const PORT = process.env.NOIZYNET_PORT || 17777;
const SHARED_SECRET = process.env.NOIZYNET_SECRET || 'GORUNFREE-2026';

const LOCAL_SERVICES = {
  heaven17:     { url: 'http://localhost:17017', name: 'heaven17 Voice Pipeline' },
  dreamchamber: { url: 'http://localhost:7777',  name: 'DreamChamber Core' },
  gorunfree:    { url: 'http://localhost:9099',  name: 'GORUNFREE Voice Server' },
  bridge:       { url: 'http://localhost:7778',  name: 'Accessibility Bridge' },
  ollama:       { url: 'http://localhost:11434', name: 'Ollama LLM Engine' },
  n8n:          { url: 'http://localhost:5678',  name: 'n8n Automation' },
};

// ── STATE ────────────────────────────────────────────────────────────────────

let handshakeCount = 0;
let lastHandshake = null;
let sessionId = null;
const startTime = Date.now();

// ── HELPERS ──────────────────────────────────────────────────────────────────

function jsonResponse(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'X-Powered-By': 'NOIZYNET on GOD',
    'X-GORUNFREE': 'true',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-NOIZYNET-Token, X-Agent-ID',
  });
  res.end(JSON.stringify(data, null, 2));
}

function generateSessionId() {
  return `NOIZYNET-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

function verifyToken(req) {
  const token = req.headers['x-noizynet-token'];
  if (!token) return false;
  // HMAC verification: token = HMAC-SHA256(timestamp, secret)
  // For handshake, accept the shared secret directly or HMAC
  return token === SHARED_SECRET || verifyHMAC(token);
}

function verifyHMAC(token) {
  try {
    const [timestamp, hmac] = token.split(':');
    const expected = crypto.createHmac('sha256', SHARED_SECRET)
      .update(timestamp)
      .digest('hex');
    // Time window: 5 minutes
    const age = Date.now() - parseInt(timestamp);
    return hmac === expected && age < 300000;
  } catch {
    return false;
  }
}

function createToken() {
  const timestamp = Date.now().toString();
  const hmac = crypto.createHmac('sha256', SHARED_SECRET)
    .update(timestamp)
    .digest('hex');
  return `${timestamp}:${hmac}`;
}

async function probeService(key) {
  const svc = LOCAL_SERVICES[key];
  if (!svc) return { service: key, status: 'unknown' };

  try {
    const healthUrl = key === 'ollama'
      ? `${svc.url}/api/version`
      : `${svc.url}/health`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const resp = await fetch(healthUrl, { signal: controller.signal });
    clearTimeout(timeout);

    const data = await resp.json().catch(() => ({}));
    return {
      service: key,
      name: svc.name,
      status: 'alive',
      port: new URL(svc.url).port,
      response: data,
    };
  } catch (err) {
    return {
      service: key,
      name: svc.name,
      status: 'unreachable',
      error: err.message,
    };
  }
}

async function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
  });
}

// ── ROUTE HANDLERS ───────────────────────────────────────────────────────────

async function handleHandshake(req, res) {
  // Verify the caller
  if (!verifyToken(req)) {
    return jsonResponse(res, {
      error: 'HANDSHAKE_DENIED',
      message: 'Invalid or missing X-NOIZYNET-Token header',
      hint: 'Send HMAC-SHA256(timestamp, secret) as timestamp:hmac',
    }, 403);
  }

  // Probe all local services
  const serviceProbes = await Promise.all(
    Object.keys(LOCAL_SERVICES).map(probeService)
  );

  // Generate session
  sessionId = generateSessionId();
  handshakeCount++;
  lastHandshake = new Date().toISOString();

  const alive = serviceProbes.filter(s => s.status === 'alive');
  const dead = serviceProbes.filter(s => s.status !== 'alive');

  const greeting = {
    handshake: 'ACCEPTED',
    protocol: 'NOIZYNET/1.0',
    session: sessionId,
    timestamp: lastHandshake,
    handshakeNumber: handshakeCount,

    god: {
      hostname: 'M2 Ultra',
      codename: 'GOD',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      arch: 'arm64',
      cores: 24,
      memory: '192GB Unified',
      gpu: '76-core',
    },

    services: {
      alive: alive.length,
      total: Object.keys(LOCAL_SERVICES).length,
      details: serviceProbes,
    },

    agents: {
      registered: ['gabriel', 'mc96', 'system-guardian'],
      available: alive.map(s => s.service),
      pending: ['lucy', 'shirl', 'dream', 'pops', 'engra_keith', 'cb01', 'euro', 'heaven'],
    },

    capabilities: {
      voice: alive.some(s => s.service === 'heaven17'),
      llm: alive.some(s => s.service === 'ollama'),
      orchestration: alive.some(s => s.service === 'dreamchamber'),
      automation: alive.some(s => s.service === 'n8n'),
      accessibility: alive.some(s => s.service === 'bridge'),
    },

    returnToken: createToken(),

    message: dead.length === 0
      ? '🜂 ALL SYSTEMS OPERATIONAL. Welcome to NOIZYNET, Heaven. GORUNFREE.'
      : `🜂 ${alive.length}/${Object.keys(LOCAL_SERVICES).length} services online. ${dead.map(d => d.service).join(', ')} unreachable. GORUNFREE.`,
  };

  console.log(`\n🜂 HANDSHAKE #${handshakeCount} ACCEPTED`);
  console.log(`   Session: ${sessionId}`);
  console.log(`   Services: ${alive.length}/${Object.keys(LOCAL_SERVICES).length} alive`);
  console.log(`   From: ${req.headers['user-agent'] || 'unknown'}\n`);

  return jsonResponse(res, greeting);
}

async function handleDispatch(req, res) {
  if (!verifyToken(req)) {
    return jsonResponse(res, { error: 'AUTH_REQUIRED' }, 403);
  }

  const body = await readBody(req);
  const { target, method, path, payload } = body;

  const svc = LOCAL_SERVICES[target];
  if (!svc) {
    return jsonResponse(res, {
      error: 'UNKNOWN_TARGET',
      available: Object.keys(LOCAL_SERVICES),
    }, 404);
  }

  try {
    const targetUrl = `${svc.url}${path || '/'}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const resp = await fetch(targetUrl, {
      method: method || 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: payload ? JSON.stringify(payload) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await resp.text();
    let parsed;
    try { parsed = JSON.parse(data); } catch { parsed = data; }

    return jsonResponse(res, {
      dispatched: true,
      target,
      path: path || '/',
      status: resp.status,
      response: parsed,
    });
  } catch (err) {
    return jsonResponse(res, {
      dispatched: false,
      target,
      error: err.message,
    }, 502);
  }
}

async function handleHealth(req, res) {
  return jsonResponse(res, {
    service: 'NOIZYNET Handshake',
    version: '1.0.0',
    status: 'online',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    handshakes: handshakeCount,
    lastHandshake,
    session: sessionId,
    gorunfree: true,
  });
}

async function handleStatus(req, res) {
  const serviceProbes = await Promise.all(
    Object.keys(LOCAL_SERVICES).map(probeService)
  );
  return jsonResponse(res, {
    noizynet: 'GOD',
    services: serviceProbes,
    timestamp: new Date().toISOString(),
  });
}

// ── SERVER ───────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-NOIZYNET-Token, X-Agent-ID',
    });
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  try {
    switch (path) {
      case '/handshake':
        return await handleHandshake(req, res);
      case '/dispatch':
        return await handleDispatch(req, res);
      case '/health':
        return await handleHealth(req, res);
      case '/status':
        return await handleStatus(req, res);
      default:
        return jsonResponse(res, {
          service: 'NOIZYNET',
          endpoints: ['/handshake', '/dispatch', '/health', '/status'],
          message: 'GORUNFREE — Nobody Died. Everybody LIVES Here.',
        });
    }
  } catch (err) {
    console.error('[NOIZYNET] Error:', err);
    return jsonResponse(res, { error: err.message }, 500);
  }
});

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   🜂 NOIZYNET HANDSHAKE SERVICE                          ║
║   Running on GOD (M2 Ultra)                              ║
║   Port: ${PORT}                                          ║
║                                                          ║
║   Endpoints:                                             ║
║     POST /handshake  — Heaven ↔ GOD bridge               ║
║     POST /dispatch   — Route to local service            ║
║     GET  /health     — Service health                    ║
║     GET  /status     — All service probes                ║
║                                                          ║
║   Waiting for Heaven to say hello...                     ║
║   GORUNFREE                                              ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `);
});
