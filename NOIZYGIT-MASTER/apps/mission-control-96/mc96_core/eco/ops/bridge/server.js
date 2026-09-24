import http from 'node:http';

const PORT = process.env.PORT || 8888;
const BIND = process.env.BIND || '127.0.0.1'; // localhost only — security boundary
const START_TIME = new Date().toISOString();

// ── Route Table ─────────────────────────────────────────────────────
const routes = {
  'GET /health': handleHealth,
  'GET /status': handleStatus,
  'POST /command': handleCommand,
  'POST /relay': handleRelay,
  'GET /services': handleServices,
};

function handleHealth(_req, body) {
  return { ok: true, service: 'noizy-command-bridge', version: '2.0.0', uptime: process.uptime(), started: START_TIME };
}

function handleStatus(_req, body) {
  return {
    ok: true,
    pid: process.pid,
    memory: process.memoryUsage(),
    uptime_s: Math.round(process.uptime()),
    node: process.version,
    host: BIND,
    port: PORT,
  };
}

function handleCommand(_req, body) {
  let parsed;
  try { parsed = JSON.parse(body); } catch { return { ok: false, error: 'Invalid JSON' }; }

  if (!parsed.intent) return { ok: false, error: 'Missing intent field' };

  // Log command (stdout for docker logs)
  console.log(`[CMD] intent=${parsed.intent} source=${parsed.source || 'unknown'} at=${new Date().toISOString()}`);

  return {
    ok: true,
    intent: parsed.intent,
    source: parsed.source || 'unknown',
    received_at: new Date().toISOString(),
    note: 'Command received — forward to n8n or service manually',
  };
}

function handleRelay(_req, body) {
  // Generic relay — accepts any payload, logs it, returns acknowledgment
  const truncated = body.slice(0, 5000);
  console.log(`[RELAY] ${truncated.slice(0, 200)} at=${new Date().toISOString()}`);
  return { ok: true, relayed: true, bytes: body.length, received_at: new Date().toISOString() };
}

async function handleServices(_req, body) {
  const targets = [
    { name: 'GABRIEL', url: 'http://127.0.0.1:7777/health' },
    { name: 'NOIZYSTREAM-Control', url: 'http://127.0.0.1:7778/health' },
    { name: 'DreamChamber', url: 'http://127.0.0.1:7780/health' },
    { name: 'Voice-Bridge', url: 'http://127.0.0.1:8080/health' },
    { name: 'Ollama', url: 'http://127.0.0.1:11434/api/tags' },
  ];

  const results = {};
  await Promise.all(targets.map(async (t) => {
    try {
      const r = await fetch(t.url, { signal: AbortSignal.timeout(3000) });
      results[t.name] = r.ok ? 'LIVE' : `DOWN (${r.status})`;
    } catch {
      results[t.name] = 'UNREACHABLE';
    }
  }));

  return { ok: true, services: results, checked_at: new Date().toISOString() };
}

// ── Server ──────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const key = `${req.method} ${url.pathname}`;
  const handler = routes[key];

  res.setHeader('Content-Type', 'application/json');

  if (!handler) {
    // Fallback: accept any POST for backwards compat
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        res.end(JSON.stringify({ ok: true, received: body.slice(0, 5000) }));
      });
      return;
    }
    res.writeHead(404);
    return res.end(JSON.stringify({ ok: false, error: 'Not Found', routes: Object.keys(routes) }));
  }

  // Collect body for POST
  let body = '';
  if (req.method === 'POST') {
    await new Promise((resolve) => {
      req.on('data', chunk => { body += chunk; });
      req.on('end', resolve);
    });
  }

  try {
    const result = await handler(req, body);
    res.writeHead(200);
    res.end(JSON.stringify(result));
  } catch (e) {
    res.writeHead(500);
    res.end(JSON.stringify({ ok: false, error: e.message || 'Internal Error' }));
  }
});

server.listen(PORT, BIND, () => {
  console.log(`noizy-command-bridge v2.0 listening on ${BIND}:${PORT}`);
  console.log(`Routes: ${Object.keys(routes).join(', ')}`);
});
