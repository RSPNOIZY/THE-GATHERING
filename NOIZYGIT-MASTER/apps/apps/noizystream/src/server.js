/**
 * NOIZYSTREAM — Creator-controlled audio fabric
 *
 * Two-lane audio system:
 *   Studio lane:   Dante (deterministic, uncompressed, low-latency local backbone)
 *   Internet lane: WebRTC (authenticated remote edge — listen, talkback, approvals)
 *   Interop lane:  AES67 (cross-vendor pro-audio compatibility where needed)
 *
 * v1: Studio spine — sessions, routes, proof, Dante topology, dashboard
 * v2: WebRTC signaling, remote contributor, multi-room orchestration
 *
 * Control plane: port 4040 (HTTP REST + WebSocket)
 * Signaling:     port 4040/signal (WebSocket)
 * Dashboard:     http://GOD.local:4040
 *
 * RSP_001 | NOIZY Empire | 2026
 */

import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

import { createSession, joinSession, closeSession, getSession, listSessions, applyRoute } from './sessions/manager.js';
import { getTemplate, listTemplates, buildRouteManifest } from './routes/templates.js';
import { requireAuth, requirePermission, issueToken, issueSessionToken } from './auth/permissions.js';
import { ROLES } from './sessions/manager.js';
import { logProofEvent, getProofChainHash, generateProofBundle } from './proof/logger.js';
import { getTopology } from './dante/controller.js';
import { attachSignaling, getSignalingStats } from './signaling/server.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.NOIZYSTREAM_PORT || 4040;
const GABRIEL_URL = process.env.DREAMCHAMBER_URL || 'http://localhost:7777';

const app = express();
const server = createServer(app);
app.use(express.json());

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-NOIZY-Key',
};
app.use((req, res, next) => { Object.entries(CORS).forEach(([k,v]) => res.setHeader(k, v)); if (req.method === 'OPTIONS') return res.sendStatus(204); next(); });

// Attach WebSocket signaling
attachSignaling(server);

// ── Public ────────────────────────────────────────────────────────────────────

app.get('/health', async (_, res) => {
  const proof = getProofChainHash();
  let gabrielOk = false;
  try { const r = await fetch(`${GABRIEL_URL}/health`); gabrielOk = (await r.json()).ok === true; } catch {}
  res.json({
    status: 'LIVE',
    service: 'noizystream',
    version: '1.0.0',
    lanes: { studio: 'dante', internet: 'webrtc', interop: 'aes67' },
    sessions: listSessions({ status: 'active' }).length,
    proof_hash: proof.hash,
    proof_events: proof.events,
    gabriel: gabrielOk ? 'connected' : 'offline',
    signaling: { path: '/signal', stats: getSignalingStats() },
    ts: new Date().toISOString(),
  });
});

app.get('/', (_, res) => res.send(dashboardHTML()));

// ── Auth token (dev/local) ────────────────────────────────────────────────────

app.post('/auth/token', (req, res) => {
  const { subject, role = 'LISTENER', session_id, permissions } = req.body;
  if (!subject) return res.status(400).json({ error: 'subject required' });
  const rolePerms = permissions || ROLES[role?.toUpperCase()]?.permissions || ['stream:subscribe'];
  const token = issueToken({ sub: subject, role, permissions: rolePerms, session_id });
  res.json({ token, subject, role, permissions: rolePerms });
});

// ── Sessions ──────────────────────────────────────────────────────────────────

// GET /sessions — list all (protected)
app.get('/sessions', requireAuth, (req, res) => {
  const sessions = listSessions(req.query.status ? { status: req.query.status } : {});
  res.json({ sessions, count: sessions.length });
});

// POST /sessions — create session (host only)
app.post('/sessions', requireAuth, requirePermission('session:create'), (req, res) => {
  const { name, template = 'default', metadata } = req.body;
  const session = createSession({ name, host_id: req.auth.sub || req.auth.subject, template, metadata });
  logProofEvent('api.session.created', req.auth.sub, { session_id: session.id });

  // Notify GABRIEL
  fetch(`${GABRIEL_URL}/memcell/noizystream:session:${session.id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value: { session_id: session.id, name: session.name, status: 'active', ts: session.created_at } }),
  }).catch(() => {});

  res.status(201).json(session);
});

// GET /sessions/:id — get session
app.get('/sessions/:id', requireAuth, (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

// POST /sessions/:id/join — join session
app.post('/sessions/:id/join', requireAuth, requirePermission('session:join'), (req, res) => {
  const { display_name } = req.body;
  const role = req.auth.role || 'LISTENER';
  try {
    const participant = joinSession(req.params.id, {
      participant_id: req.auth.sub || req.auth.subject,
      role,
      display_name,
    });
    const token = issueSessionToken(req.params.id, participant.id, participant.role, participant.permissions);
    logProofEvent('api.session.join', participant.id, { session_id: req.params.id, role });
    res.json({ participant, session_token: token });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE /sessions/:id — close session (admin)
app.delete('/sessions/:id', requireAuth, requirePermission('session:admin'), (req, res) => {
  try {
    const session = closeSession(req.params.id, req.auth.sub || req.auth.subject);
    const bundle = generateProofBundle(session);
    logProofEvent('api.session.closed', req.auth.sub, { session_id: req.params.id });
    res.json({ closed: true, proof_bundle: bundle });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /routes/templates — list available templates
app.get('/routes/templates', requireAuth, (_, res) => {
  res.json({ templates: listTemplates() });
});

// POST /sessions/:id/routes — apply route template
app.post('/sessions/:id/routes', requireAuth, requirePermission('route:modify'), (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const { template = session.template, custom_route } = req.body;
  const manifest = buildRouteManifest(session, template);

  if (custom_route) {
    const applied = applyRoute(req.params.id, custom_route, req.auth.sub || req.auth.subject);
    return res.json({ route: applied, manifest });
  }

  // Apply all routes from template
  manifest.routes.forEach(r => applyRoute(req.params.id, r, req.auth.sub));
  logProofEvent('api.routes.applied', req.auth.sub, { session_id: req.params.id, template });
  res.json({ manifest, applied: manifest.routes.length });
});

// ── Dante topology ────────────────────────────────────────────────────────────

app.get('/dante/topology', requireAuth, async (_, res) => {
  const topology = await getTopology();
  res.json(topology);
});

// ── Proof ─────────────────────────────────────────────────────────────────────

app.get('/proof', requireAuth, requirePermission('proof:read'), (_, res) => {
  res.json(getProofChainHash());
});

app.get('/proof/session/:id', requireAuth, requirePermission('proof:read'), (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(generateProofBundle(session));
});

// ── Start ─────────────────────────────────────────────────────────────────────

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[NOIZYSTREAM] Control plane  → http://GOD.local:${PORT}`);
  console.log(`[NOIZYSTREAM] WebSocket      → ws://GOD.local:${PORT}/signal`);
  console.log(`[NOIZYSTREAM] Dashboard      → http://GOD.local:${PORT}`);
  console.log(`[NOIZYSTREAM] Dante topology → GET /dante/topology`);
  logProofEvent('system.startup', 'NOIZYSTREAM', { port: PORT, version: '1.0.0' });

  // Notify GABRIEL
  fetch(`${GABRIEL_URL}/memcell/noizystream:status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value: { status: 'online', port: PORT, ts: new Date().toISOString() } }),
  }).catch(() => {});
});

// ── Dashboard ─────────────────────────────────────────────────────────────────
function dashboardHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>NOIZYSTREAM — GOD</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif;background:#060608;color:#e8e8e8;padding:24px;min-height:100vh}
  .header{display:flex;align-items:center;gap:16px;margin-bottom:32px}
  .logo{font-size:26px;font-weight:900;letter-spacing:-1.5px;
    background:linear-gradient(135deg,#6e40ff,#bf40ff,#ff40a0);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent}
  .tagline{font-size:12px;color:#555;letter-spacing:.5px}
  .version{background:#111;border:1px solid #222;border-radius:6px;padding:3px 10px;font-size:11px;color:#666}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;margin-bottom:24px}
  .card{background:#0e0e12;border:1px solid #1e1e2a;border-radius:14px;padding:18px}
  .card h3{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#444;margin-bottom:10px}
  .lane{display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #1a1a22}
  .lane:last-child{border-bottom:none}
  .lane-dot{width:8px;height:8px;border-radius:50%}
  .lane-label{font-size:13px;font-weight:500}
  .lane-sub{font-size:11px;color:#555;margin-left:auto}
  .purple{background:#6e40ff;box-shadow:0 0 6px #6e40ff}
  .blue{background:#40a0ff;box-shadow:0 0 6px #40a0ff}
  .green{background:#30d158;box-shadow:0 0 6px #30d158;animation:pulse 2s infinite}
  .orange{background:#ff9500;box-shadow:0 0 6px #ff9500}
  .red{background:#ff453a}
  .gray{background:#444}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
  .big{font-size:36px;font-weight:700;color:#fff}
  .sessions-list{max-height:200px;overflow-y:auto}
  .session-item{display:flex;align-items:center;gap:8px;padding:8px;background:#0a0a0e;border-radius:8px;margin-bottom:6px;font-size:12px}
  .btn{background:#6e40ff;color:#fff;border:none;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;transition:opacity .2s;margin:4px;width:calc(50% - 8px)}
  .btn:hover{opacity:.8}
  .btn.secondary{background:#1a1a22;border:1px solid #2a2a3a;color:#aaa}
  .btn.danger{background:#3a1010;border:1px solid #ff453a;color:#ff453a}
  .form-row{margin-bottom:10px}
  .form-row label{display:block;font-size:11px;color:#555;margin-bottom:4px}
  .form-row input,select{width:100%;background:#0a0a0e;border:1px solid #2a2a3a;border-radius:6px;padding:8px;color:#e8e8e8;font-size:13px}
  .log{background:#040406;border:1px solid #1a1a22;border-radius:8px;padding:12px;font-family:'SF Mono',monospace;font-size:11px;max-height:180px;overflow-y:auto;color:#666}
  .log .entry{color:#888;line-height:1.8}
  .log .entry.event{color:#6e40ff}
  .log .entry.join{color:#30d158}
  .log .entry.error{color:#ff453a}
  select{cursor:pointer}
</style>
</head>
<body>
<div class="header">
  <span class="logo">NOIZYSTREAM</span>
  <div>
    <div class="tagline">CREATOR-CONTROLLED AUDIO FABRIC</div>
    <div style="font-size:11px;color:#444;margin-top:2px">Dante · WebRTC · AES67 · GOD.local</div>
  </div>
  <span class="version" style="margin-left:auto">v1.0 · <span id="sessionCount">0</span> active sessions</span>
</div>
<div class="grid">
  <div class="card">
    <h3>Audio Lanes</h3>
    <div class="lane"><div class="lane-dot purple"></div><span class="lane-label">Studio</span><span class="lane-sub">Dante · local · &lt;1ms</span></div>
    <div class="lane"><div class="lane-dot blue" id="internetDot"></div><span class="lane-label">Internet</span><span class="lane-sub">WebRTC · remote</span></div>
    <div class="lane"><div class="lane-dot gray"></div><span class="lane-label">AES67</span><span class="lane-sub">Interop · on demand</span></div>
  </div>
  <div class="card">
    <h3>System</h3>
    <div class="lane"><div class="lane-dot" id="gabrielDot" style="background:#444"></div><span class="lane-label">GABRIEL</span><span class="lane-sub" id="gabrielSub">checking...</span></div>
    <div class="lane"><div class="lane-dot green"></div><span class="lane-label">AirPlay</span><span class="lane-sub">port 5000 active</span></div>
    <div class="lane"><div class="lane-dot" id="danteDot" style="background:#444"></div><span class="lane-label">Dante VSC</span><span class="lane-sub" id="danteSub">checking...</span></div>
  </div>
  <div class="card">
    <h3>Active Sessions</h3>
    <div class="big" id="activeCount">0</div>
    <div style="font-size:12px;color:#444;margin-top:4px" id="totalSessions">0 total</div>
  </div>
  <div class="card">
    <h3>Proof Chain</h3>
    <div style="font-size:11px;color:#6e40ff;font-family:monospace" id="proofHash">—</div>
    <div style="font-size:11px;color:#444;margin-top:4px"><span id="proofEvents">0</span> events · <span id="proofTs">—</span></div>
  </div>
</div>

<div class="grid">
  <div class="card" style="grid-column:span 2">
    <h3>Create Session</h3>
    <div class="form-row"><label>Session Name</label><input id="sessionName" placeholder="My Recording Session"></div>
    <div class="form-row"><label>Route Template</label>
      <select id="templateSelect">
        <option value="default">Default Studio — Record + Monitor</option>
        <option value="tracking">Tracking — Multi-source</option>
        <option value="remote_approval">Remote Approval — Studio + WebRTC</option>
        <option value="voice_pipeline">Voice Pipeline — Mic → GABRIEL</option>
        <option value="mixing">Mix Session</option>
        <option value="mastering">Mastering Session</option>
      </select>
    </div>
    <button class="btn" onclick="createSession()">Create Session</button>
    <button class="btn secondary" onclick="loadSessions()">Refresh Sessions</button>
  </div>
  <div class="card">
    <h3>Get Auth Token</h3>
    <div class="form-row"><label>Subject ID</label><input id="tokenSubject" placeholder="rsp_001" value="rsp_001"></div>
    <div class="form-row"><label>Role</label>
      <select id="tokenRole">
        <option value="HOST">Host / Engineer</option>
        <option value="ARTIST">Artist</option>
        <option value="CONTRIBUTOR">Contributor</option>
        <option value="LISTENER">Listener</option>
        <option value="PRODUCER">Producer / Director</option>
      </select>
    </div>
    <button class="btn" onclick="getToken()">Get Token</button>
  </div>
</div>

<div class="grid">
  <div class="card" style="grid-column:span 2">
    <h3>Sessions</h3>
    <div class="sessions-list" id="sessionsList"><div style="color:#333;font-size:12px">No sessions yet</div></div>
  </div>
  <div class="card">
    <h3>Proof Events</h3>
    <div class="log" id="proofLog"></div>
  </div>
</div>

<div id="tokenOutput" style="display:none;background:#0a0a12;border:1px solid #2a2a3a;border-radius:10px;padding:14px;margin-top:16px">
  <div style="font-size:11px;color:#555;margin-bottom:6px">AUTH TOKEN</div>
  <div style="font-size:11px;font-family:monospace;color:#6e40ff;word-break:break-all" id="tokenText"></div>
</div>

<script>
let authToken = null;

async function fetchHealth() {
  try {
    const r = await fetch('/health');
    const d = await r.json();
    document.getElementById('sessionCount').textContent = d.sessions;
    document.getElementById('activeCount').textContent = d.sessions;
    document.getElementById('proofHash').textContent = d.proof_hash || '—';
    document.getElementById('proofEvents').textContent = d.proof_events || 0;
    document.getElementById('proofTs').textContent = new Date().toLocaleTimeString();
    document.getElementById('gabrielDot').style.background = d.gabriel === 'connected' ? '#30d158' : '#ff453a';
    document.getElementById('gabrielSub').textContent = d.gabriel;
  } catch(e) { console.error(e); }
}

async function fetchDante() {
  if (!authToken) return;
  try {
    const r = await fetch('/dante/topology', { headers: { Authorization: 'Bearer ' + authToken } });
    const d = await r.json();
    const danteDot = document.getElementById('danteDot');
    danteDot.style.background = d.dante?.installed ? '#6e40ff' : '#444';
    document.getElementById('danteSub').textContent = d.dante?.installed ? 'VSC detected' : 'Not installed';
  } catch {}
}

async function loadSessions() {
  if (!authToken) return;
  try {
    const r = await fetch('/sessions', { headers: { Authorization: 'Bearer ' + authToken } });
    const d = await r.json();
    document.getElementById('totalSessions').textContent = d.count + ' total';
    document.getElementById('activeCount').textContent = d.sessions.filter(s => s.status === 'active').length;
    const list = document.getElementById('sessionsList');
    if (d.sessions.length === 0) { list.innerHTML = '<div style="color:#333;font-size:12px">No sessions</div>'; return; }
    list.innerHTML = d.sessions.map(s => \`
      <div class="session-item">
        <div class="lane-dot \${s.status==='active'?'green':'gray'}"></div>
        <span style="font-weight:600">\${s.name}</span>
        <span style="color:#444">\${s.id.slice(-8)}</span>
        <span style="color:#555;margin-left:auto">\${s.participants?.length||0} participants · \${s.template}</span>
        <button onclick="closeSession('\${s.id}')" style="background:#3a1010;border:1px solid #ff453a;color:#ff453a;border-radius:4px;padding:2px 8px;font-size:10px;cursor:pointer">Close</button>
      </div>
    \`).join('');
  } catch {}
}

async function createSession() {
  if (!authToken) { alert('Get an auth token first'); return; }
  const name = document.getElementById('sessionName').value || 'New Session';
  const template = document.getElementById('templateSelect').value;
  const r = await fetch('/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + authToken },
    body: JSON.stringify({ name, template }),
  });
  const d = await r.json();
  addProofLog(\`session.created: \${d.name} (\${d.id?.slice(-8)})\`, 'join');
  loadSessions();
  fetchHealth();
}

async function closeSession(id) {
  if (!confirm('Close session ' + id + '?')) return;
  await fetch(\`/sessions/\${id}\`, { method: 'DELETE', headers: { Authorization: 'Bearer ' + authToken } });
  loadSessions();
  fetchHealth();
}

async function getToken() {
  const subject = document.getElementById('tokenSubject').value;
  const role = document.getElementById('tokenRole').value;
  const r = await fetch('/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, role }),
  });
  const d = await r.json();
  authToken = d.token;
  document.getElementById('tokenOutput').style.display = 'block';
  document.getElementById('tokenText').textContent = d.token;
  addProofLog(\`token.issued: \${subject} as \${role}\`, 'event');
  loadSessions();
  fetchDante();
}

function addProofLog(text, type='entry') {
  const log = document.getElementById('proofLog');
  const div = document.createElement('div');
  div.className = 'entry ' + type;
  div.textContent = new Date().toLocaleTimeString() + ' ' + text;
  log.insertBefore(div, log.firstChild);
  if (log.children.length > 50) log.removeChild(log.lastChild);
}

// WebSocket for real-time updates
function connectWS() {
  const ws = new WebSocket('ws://' + location.host + '/signal');
  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.type === 'joined') addProofLog('peer.joined: ' + msg.participant_id + ' (' + msg.role + ')', 'join');
    } catch {}
  };
  ws.onclose = () => setTimeout(connectWS, 3000);
}

fetchHealth();
setInterval(fetchHealth, 5000);
connectWS();
</script>
</body>
</html>`;
}
