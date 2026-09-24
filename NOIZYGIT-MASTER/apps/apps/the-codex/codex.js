/**
 * THE CODEX — The 500-Year Living Document
 * ═══════════════════════════════════════════════════════════════
 *
 * Like Da Vinci's notebooks — art, science, engineering, vision — unified.
 *
 * The Codex connects every NOIZY system into one queryable intelligence:
 *   - Ask it anything about the empire and it routes to the right system
 *   - It remembers every session, every decision, every proof event
 *   - It bridges local AI (Ollama) with cloud AI (Anthropic)
 *   - It enforces consent at every layer (Never Clauses are immovable)
 *   - It speaks through GABRIEL and writes to the ledger
 *
 * Port: 5500
 * RSP_001 | GORUNFREE | 2026
 * ═══════════════════════════════════════════════════════════════
 */

import http from 'http';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.CODEX_PORT || 5500;
const manifest = JSON.parse(readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));

// ── Service Registry ──────────────────────────────────────────────────────────
const SERVICES = manifest.services;

async function query(serviceName, endpoint, method = 'GET', body = null) {
  const svc = SERVICES[serviceName];
  if (!svc) return { error: `Unknown service: ${serviceName}` };
  const url = `${svc.url}${endpoint}`;
  try {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { ...opts, signal: controller.signal });
    clearTimeout(timeout);
    return await res.json();
  } catch (e) {
    return { error: e.message, service: serviceName, url };
  }
}

// ── The Codex Brain — intent router ───────────────────────────────────────────
async function routeIntent(text) {
  const t = text.toLowerCase();

  // Health / status queries
  if (/status|health|alive|running|services/.test(t)) {
    return await query('health', '/api/status');
  }

  // Consent / legal / revoke
  if (/consent|revoke|never.*clause|kill.*switch|rights|plowman/.test(t)) {
    return { intent: 'consent', service: 'heaven', response: await query('heaven', '/health') };
  }

  // Audio / voice / stream
  if (/audio|voice|stream|dante|airplay|mic|record/.test(t)) {
    const stream = await query('noizystream', '/health');
    const airplay = await query('airplay', '/state');
    return { intent: 'audio', noizystream: stream, airplay };
  }

  // Code / build / deploy
  if (/code|build|deploy|worker|function|test/.test(t)) {
    return { intent: 'code', tower: 'code', route: 'voice_bridge', endpoint: '/claude' };
  }

  // Vision / strategy / dream
  if (/vision|future|epoch|strategy|dream|legacy/.test(t)) {
    return { intent: 'vision', tower: 'dream', route: 'voice_bridge' };
  }

  // Family / wellbeing
  if (/pops|shirl|family|break|tired|burnout/.test(t)) {
    return { intent: 'wellbeing', tower: 'pops', route: 'voice_bridge' };
  }

  // Models / local AI
  if (/model|ollama|llama|gemma|whisper|local/.test(t)) {
    return await query('ollama', '/api/tags');
  }

  // Default → GABRIEL
  return await query('gabriel', '/health');
}

// ── Unified query endpoint ────────────────────────────────────────────────────
async function handleCodexQuery(text, options = {}) {
  const startTime = Date.now();
  const intent = await routeIntent(text);
  const latency = Date.now() - startTime;

  // Log to GABRIEL memcell
  query('gabriel', `/memcell/codex:query:${Date.now()}`, 'POST', {
    value: { query: text, intent: intent?.intent || 'default', latency, ts: new Date().toISOString() }
  }).catch(() => {});

  return {
    codex: true,
    query: text,
    intent: intent?.intent || 'routed',
    result: intent,
    latency_ms: latency,
    model_fleet: manifest.ollama_models.length,
    towers: manifest.towers.length,
    agents: manifest.agents.length,
    services: Object.keys(SERVICES).length,
    ts: new Date().toISOString(),
  };
}

// ── Full empire snapshot ──────────────────────────────────────────────────────
async function empireSnapshot() {
  const checks = await Promise.allSettled(
    Object.entries(SERVICES).map(async ([name, svc]) => {
      const start = Date.now();
      try {
        const healthPath = name === 'noizyvox' ? '/api/v1/health'
          : name === 'ollama' ? '/api/tags'
          : name === 'n8n' ? '/healthz'
          : '/health';
        const res = await fetch(`${svc.url}${healthPath}`, { signal: AbortSignal.timeout(5000) });
        const data = await res.json();
        return { name, status: 'up', latency: Date.now() - start, role: svc.role };
      } catch (e) {
        return { name, status: 'down', latency: Date.now() - start, role: svc.role, error: e.message };
      }
    })
  );

  const services = checks.map(c => c.value || c.reason);
  const up = services.filter(s => s.status === 'up').length;
  const total = services.length;

  return {
    empire: 'NOIZY.AI',
    codex_version: manifest.version,
    score: Math.round(up / total * 100),
    services,
    up, total,
    tests: manifest.tests.total,
    models: manifest.ollama_models.length,
    towers: manifest.towers.length,
    agents: manifest.agents.length,
    storage: manifest.storage.total_estimated,
    target: manifest.target,
    days_remaining: Math.ceil((new Date(manifest.target) - new Date()) / 86400000),
    gospel: 'Embrace your power. Amplify your voice. Unite with us. GORUNFREE.',
    ts: new Date().toISOString(),
  };
}

// ── HTTP Server ───────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'X-Powered-By': 'THE-CODEX/RSP_001',
  };

  if (req.method === 'OPTIONS') return res.writeHead(204, headers).end();

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  // GET /health
  if (path === '/health') {
    res.writeHead(200, headers);
    return res.end(JSON.stringify({ status: 'alive', service: 'the-codex', version: manifest.version, port: PORT }));
  }

  // GET /empire — full snapshot
  if (path === '/empire') {
    const snapshot = await empireSnapshot();
    res.writeHead(200, headers);
    return res.end(JSON.stringify(snapshot));
  }

  // GET /manifest
  if (path === '/manifest') {
    res.writeHead(200, headers);
    return res.end(JSON.stringify(manifest));
  }

  // POST /query — the universal question endpoint
  if (path === '/query' && req.method === 'POST') {
    let body = '';
    for await (const chunk of req) body += chunk;
    try {
      const { text } = JSON.parse(body);
      if (!text) {
        res.writeHead(400, headers);
        return res.end(JSON.stringify({ error: 'text required' }));
      }
      const result = await handleCodexQuery(text);
      res.writeHead(200, headers);
      return res.end(JSON.stringify(result));
    } catch (e) {
      res.writeHead(400, headers);
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // GET / — dashboard
  if (path === '/') {
    const snapshot = await empireSnapshot();
    res.writeHead(200, { 'Content-Type': 'text/html', ...headers });
    return res.end(codexDashboard(snapshot));
  }

  res.writeHead(404, headers);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[THE CODEX] The 500-Year Living Document`);
  console.log(`[THE CODEX] Dashboard → http://GOD.local:${PORT}`);
  console.log(`[THE CODEX] Empire    → http://GOD.local:${PORT}/empire`);
  console.log(`[THE CODEX] Query     → POST http://GOD.local:${PORT}/query`);
  console.log(`[THE CODEX] ${manifest.agents.length} agents · ${manifest.towers.length} towers · ${manifest.ollama_models.length} models · ${Object.keys(SERVICES).length} services`);

  query('gabriel', '/memcell/codex:boot', 'POST', {
    value: { event: 'codex.online', port: PORT, ts: new Date().toISOString() }
  }).catch(() => {});
});

// ── Dashboard HTML ────────────────────────────────────────────────────────────
function codexDashboard(snapshot) {
  const svcRows = snapshot.services.map(s =>
    `<div class="svc ${s.status}"><div class="dot ${s.status}"></div><span class="name">${s.name}</span><span class="role">${s.role}</span><span class="ms">${s.latency}ms</span></div>`
  ).join('');

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>THE CODEX — NOIZY Empire</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'SF Pro',sans-serif;background:#030306;color:#d0d0d0;min-height:100vh;padding:24px}
.hdr{text-align:center;margin-bottom:32px}
.logo{font-size:32px;font-weight:900;letter-spacing:4px;background:linear-gradient(135deg,#d4a017,#e8c840,#d4a017);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.sub{font-size:11px;color:#444;letter-spacing:3px;margin-top:4px}
.score-ring{width:120px;height:120px;border-radius:50%;border:3px solid ${snapshot.score===100?'#30d158':'#ffd60a'};display:flex;align-items:center;justify-content:center;margin:16px auto;font-size:36px;font-weight:900;color:${snapshot.score===100?'#30d158':'#ffd60a'}}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px;margin:20px 0}
.stat{background:#0a0a10;border:1px solid #1a1a2a;border-radius:10px;padding:12px;text-align:center}
.stat .n{font-size:24px;font-weight:800;color:#fff}
.stat .l{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:#444;margin-top:4px}
.svcs{margin:20px 0}
.svc{display:flex;align-items:center;gap:8px;padding:8px;background:#0a0a10;border-radius:8px;margin-bottom:4px;font-size:12px}
.dot{width:8px;height:8px;border-radius:50%}
.dot.up{background:#30d158;box-shadow:0 0 6px #30d158}
.dot.down{background:#ff453a;box-shadow:0 0 6px #ff453a}
.name{font-weight:600;width:120px}
.role{color:#555;flex:1}
.ms{color:#333;font-family:monospace}
.query-box{margin:24px 0}
.query-box input{width:100%;background:#0a0a10;border:1px solid #2a2a3a;border-radius:10px;padding:12px 16px;color:#e0e0e0;font-size:14px;outline:none}
.query-box input:focus{border-color:#d4a017}
#result{background:#0a0a10;border:1px solid #1a1a2a;border-radius:10px;padding:12px;margin-top:12px;font-family:monospace;font-size:11px;color:#666;max-height:200px;overflow-y:auto;display:none}
.gospel{text-align:center;margin-top:24px;font-style:italic;color:#333;font-size:12px}
.countdown{text-align:center;margin:12px 0;font-size:13px;color:#d4a017}
</style></head><body>
<div class="hdr">
<div class="logo">THE CODEX</div>
<div class="sub">THE 500-YEAR LIVING DOCUMENT · NOIZY EMPIRE</div>
</div>
<div class="score-ring">${snapshot.score}%</div>
<div class="countdown">${snapshot.days_remaining} days to April 17 · ${snapshot.up}/${snapshot.total} services</div>
<div class="stats">
<div class="stat"><div class="n">${snapshot.tests}</div><div class="l">Tests</div></div>
<div class="stat"><div class="n">${snapshot.models}</div><div class="l">AI Models</div></div>
<div class="stat"><div class="n">${snapshot.towers}</div><div class="l">Towers</div></div>
<div class="stat"><div class="n">${snapshot.agents}</div><div class="l">Agents</div></div>
<div class="stat"><div class="n">${snapshot.storage}</div><div class="l">Storage</div></div>
</div>
<div class="svcs">${svcRows}</div>
<div class="query-box">
<input id="q" placeholder="Ask the Codex anything..." onkeydown="if(event.key==='Enter')askCodex()">
<div id="result"></div>
</div>
<div class="gospel">${snapshot.gospel}</div>
<script>
async function askCodex(){
  const q=document.getElementById('q').value;if(!q)return;
  const r=document.getElementById('result');r.style.display='block';r.textContent='Thinking...';
  try{const res=await fetch('/query',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:q})});
  const d=await res.json();r.textContent=JSON.stringify(d,null,2);}catch(e){r.textContent='Error: '+e.message;}
}
</script>
</body></html>`;
}
