/**
 * NOIZY Empire — Unified Health Monitor
 * Single-pane view of ALL services on GOD (M2 Ultra)
 * Auto-refreshes, alerts GABRIEL on failures, speaks critical events
 *
 * Port: 9090
 * RSP_001 | NOIZY Empire | 2026
 */

import http from 'http';

const PORT = 9090;
const GABRIEL = 'http://localhost:7777';
const CHECK_INTERVAL = 15000; // 15 seconds

const SERVICES = [
  { name: 'GABRIEL',       port: 7777,  path: '/health',         key: 'healthy', tier: 'critical' },
  { name: 'Voice Bridge',  port: 8080,  path: '/health',         key: 'healthy', tier: 'critical' },
  { name: 'NOIZYVOX',      port: 8421,  path: '/api/v1/health',  key: 'ok',      tier: 'critical' },
  { name: 'NOIZYSTREAM',   port: 4040,  path: '/health',         key: 'LIVE',    tier: 'core' },
  { name: 'AirPlay',       port: 3001,  path: '/health',         key: 'ok',      tier: 'core' },
  { name: 'Command Center',port: 8888,  path: '/',               key: null,      tier: 'support' },
  { name: 'Ollama',        port: 11434, path: '/api/tags',       key: 'models',  tier: 'core' },
  { name: 'n8n',           port: 5678,  path: '/healthz',        key: 'ok',      tier: 'support' },
  { name: 'Heaven (edge)', port: null,  path: null, url: 'https://heaven.rsp-5f3.workers.dev/health', key: 'LIVE', tier: 'critical' },
  { name: 'DreamChamber',  port: 7780,  path: '/health',         key: 'healthy', tier: 'critical' },
  { name: 'NOIZYVOX Engine',port: 8420, path: '/',               key: 'NOIZYVOX', tier: 'critical' },
  { name: 'NOIZYSTREAM Ctl',port: 7778, path: '/health',         key: 'ok',      tier: 'core' },
];

const state = { services: [], lastCheck: null, uptime: 0, alerts: [] };
const startTime = Date.now();

async function checkService(svc) {
  const url = svc.url || `http://localhost:${svc.port}${svc.path}`;
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    const latency = Date.now() - start;
    const text = await res.text();
    const ok = svc.key ? text.includes(svc.key) : res.ok;
    return { ...svc, status: ok ? 'up' : 'degraded', latency, code: res.status, ts: new Date().toISOString() };
  } catch (e) {
    return { ...svc, status: 'down', latency: Date.now() - start, error: e.message, ts: new Date().toISOString() };
  }
}

async function runChecks() {
  const results = await Promise.all(SERVICES.map(checkService));
  const prevDown = state.services.filter(s => s.status === 'down').map(s => s.name);
  const nowDown = results.filter(s => s.status === 'down').map(s => s.name);
  const newDown = nowDown.filter(n => !prevDown.includes(n));
  const recovered = prevDown.filter(n => !nowDown.includes(n));

  state.services = results;
  state.lastCheck = new Date().toISOString();
  state.uptime = Math.floor((Date.now() - startTime) / 1000);

  // Alert on new failures
  for (const name of newDown) {
    const alert = { event: 'service_down', name, ts: state.lastCheck };
    state.alerts.unshift(alert);
    if (state.alerts.length > 50) state.alerts.pop();
    // Notify GABRIEL
    fetch(`${GABRIEL}/memcell/health:alert:${Date.now()}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: alert }),
    }).catch(() => {});
  }
  for (const name of recovered) {
    state.alerts.unshift({ event: 'service_recovered', name, ts: state.lastCheck });
  }
}

setInterval(runChecks, CHECK_INTERVAL);
runChecks();

// HTTP server
const server = http.createServer(async (req, res) => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  if (req.url === '/api/status') {
    const up = state.services.filter(s => s.status === 'up').length;
    const total = state.services.length;
    res.writeHead(200, headers);
    return res.end(JSON.stringify({ services: state.services, up, total, score: Math.round(up/total*100), uptime: state.uptime, lastCheck: state.lastCheck }));
  }

  if (req.url === '/api/alerts') {
    res.writeHead(200, headers);
    return res.end(JSON.stringify({ alerts: state.alerts }));
  }

  if (req.url === '/health') {
    res.writeHead(200, headers);
    return res.end(JSON.stringify({ status: 'ok', service: 'noizy-health-monitor' }));
  }

  // Dashboard HTML
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>NOIZY Health Monitor</title>
<meta http-equiv="refresh" content="15">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'SF Pro',sans-serif;background:#050508;color:#e0e0e0;padding:20px}
.hdr{display:flex;align-items:center;gap:12px;margin-bottom:24px}
.logo{font-size:22px;font-weight:900;background:linear-gradient(135deg,#30d158,#40c8ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.score{font-size:48px;font-weight:900;margin:0 16px}
.score.perfect{color:#30d158}.score.good{color:#ffd60a}.score.bad{color:#ff453a}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}
.svc{background:#0a0a10;border:1px solid #1a1a2a;border-radius:12px;padding:14px;transition:border-color .3s}
.svc.up{border-color:#1a3a1a}.svc.down{border-color:#3a1a1a;animation:pulse-red 2s infinite}
.svc.degraded{border-color:#3a3a1a}
@keyframes pulse-red{0%,100%{border-color:#3a1a1a}50%{border-color:#ff453a}}
.svc-name{font-size:13px;font-weight:600;margin-bottom:4px}
.svc-status{display:flex;align-items:center;gap:6px}
.dot{width:8px;height:8px;border-radius:50%}
.dot.up{background:#30d158;box-shadow:0 0 6px #30d158}
.dot.down{background:#ff453a;box-shadow:0 0 6px #ff453a}
.dot.degraded{background:#ffd60a}
.svc-meta{font-size:11px;color:#555;margin-top:4px}
.tier{font-size:9px;text-transform:uppercase;letter-spacing:1px;padding:2px 6px;border-radius:4px;background:#111;color:#666}
.tier.critical{color:#ff453a;background:#1a0a0a}
.tier.core{color:#40c8ff;background:#0a0a1a}
.alerts{margin-top:20px;background:#0a0a10;border:1px solid #1a1a2a;border-radius:10px;padding:12px;max-height:150px;overflow-y:auto}
.alert{font-size:11px;color:#666;line-height:1.8;font-family:monospace}
.alert.down{color:#ff453a}.alert.recovered{color:#30d158}
footer{margin-top:20px;font-size:11px;color:#333;text-align:center}
</style>
</head>
<body>
<div class="hdr">
  <span class="logo">NOIZY HEALTH</span>
  <span class="score" id="score">—</span>
  <div><div style="font-size:11px;color:#555">GOD.local | M2 Ultra</div><div style="font-size:11px;color:#333" id="lastCheck">checking...</div></div>
</div>
<div class="grid" id="grid"></div>
<div class="alerts" id="alerts"><div class="alert">Waiting for first check...</div></div>
<footer>Auto-refresh: 15s | GABRIEL-integrated | Protocol: GORUNFREE</footer>
<script>
async function refresh() {
  try {
    const r = await fetch('/api/status');
    const d = await r.json();
    const scoreEl = document.getElementById('score');
    scoreEl.textContent = d.score + '%';
    scoreEl.className = 'score ' + (d.score===100?'perfect':d.score>=75?'good':'bad');
    document.getElementById('lastCheck').textContent = 'Last: ' + new Date(d.lastCheck).toLocaleTimeString() + ' | Uptime: ' + Math.floor(d.uptime/60) + 'm';
    document.getElementById('grid').innerHTML = d.services.map(s => \`
      <div class="svc \${s.status}">
        <div class="svc-name">\${s.name} <span class="tier \${s.tier}">\${s.tier}</span></div>
        <div class="svc-status"><div class="dot \${s.status}"></div>\${s.status.toUpperCase()} <span style="color:#333;font-size:11px">\${s.latency}ms</span></div>
        <div class="svc-meta">:\${s.port||'edge'} \${s.error||''}</div>
      </div>\`).join('');
    const ar = await fetch('/api/alerts');
    const ad = await ar.json();
    if (ad.alerts.length) {
      document.getElementById('alerts').innerHTML = ad.alerts.slice(0,20).map(a =>
        '<div class="alert '+(a.event.includes('down')?'down':'recovered')+'">' +
        new Date(a.ts).toLocaleTimeString() + ' ' + a.event + ': ' + a.name + '</div>'
      ).join('');
    }
  } catch(e) { console.error(e); }
}
refresh();
setInterval(refresh, 15000);
</script>
</body>
</html>`);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[NOIZY Health] Dashboard → http://GOD.local:${PORT}`);
  console.log(`[NOIZY Health] API       → http://GOD.local:${PORT}/api/status`);
  console.log(`[NOIZY Health] Checking ${SERVICES.length} services every ${CHECK_INTERVAL/1000}s`);
});
