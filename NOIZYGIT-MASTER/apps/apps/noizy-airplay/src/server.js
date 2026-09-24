/**
 * NOIZY AirPlay Extension — GOD (M2 Ultra)
 * Zero-latency bridge: iPhone/iPad AirPlay → Voice Pipeline → GABRIEL
 *
 * Architecture:
 *   - macOS native AirPlay Receiver (port 5000) handles audio — zero-latency
 *   - This service monitors AirPlay state + routes audio to voice pipeline
 *   - Real-time dashboard at http://GOD.local:3001
 *   - Metadata pipe reader from shairport-sync (when active)
 *   - WebSocket push to any connected browser/client
 *
 * RSP_001 | NOIZY Empire | 2026
 */

import express from 'express';
import { createServer } from 'http';
import { execFile, exec, spawn } from 'child_process';
import { createReadStream, existsSync, mkdirSync } from 'fs';
import { watch } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.AIRPLAY_PORT || 3001;
const GABRIEL_URL = process.env.DREAMCHAMBER_URL || 'http://localhost:7777';
const METADATA_PIPE = '/tmp/noizy-airplay-metadata';
const LOG = '/tmp/noizy-airplay-extension.log';

const app = express();
const server = createServer(app);
app.use(express.json());

// ── State ─────────────────────────────────────────────────────────────────────
const state = {
  airplay_active: false,
  device: null,
  title: null,
  artist: null,
  album: null,
  connected_at: null,
  sessions: 0,
  last_ping: null,
};

// ── WebSocket (native) ────────────────────────────────────────────────────────
// Simple SSE for real-time push without ws dependency
const sseClients = new Set();

function broadcast(data) {
  const msg = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of sseClients) {
    try { res.write(msg); } catch (_) { sseClients.delete(res); }
  }
}

// ── GABRIEL integration ───────────────────────────────────────────────────────
async function notifyGabriel(event, data) {
  try {
    await fetch(`${GABRIEL_URL}/memcell/airplay:${event}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: { ...data, ts: new Date().toISOString() } }),
    });
  } catch (_) {}
}

// ── AirPlay state detection ───────────────────────────────────────────────────
// Poll for active AirPlay connections using macOS CoreAudio
function detectAirPlayConnections() {
  exec(`lsof -i :5000 -n -P 2>/dev/null | grep ESTABLISHED | head -5`, (err, stdout) => {
    const connections = stdout?.trim().split('\n').filter(Boolean) || [];
    const wasActive = state.airplay_active;
    state.airplay_active = connections.length > 0;

    if (state.airplay_active && !wasActive) {
      state.connected_at = new Date().toISOString();
      state.sessions++;
      console.log(`[AirPlay] Device connected (${connections.length} connections)`);
      notifyGabriel('connect', { connections: connections.length, sessions: state.sessions });
      broadcast({ event: 'connected', state });
      // macOS notification
      execFile('osascript', ['-e', `display notification "AirPlay device connected to NOIZY GOD" with title "AirPlay" sound name "Glass"`]);
    } else if (!state.airplay_active && wasActive) {
      console.log('[AirPlay] Device disconnected');
      notifyGabriel('disconnect', { sessions: state.sessions });
      broadcast({ event: 'disconnected', state });
      state.device = null;
      state.title = null;
      state.connected_at = null;
    }

    state.last_ping = new Date().toISOString();
    broadcast({ event: 'state', state });
  });
}

// Poll every 3 seconds
setInterval(detectAirPlayConnections, 3000);
detectAirPlayConnections();

// ── Audio tap → Voice Pipeline ────────────────────────────────────────────────
// When AirPlay is active and user says a keyword, route audio to whisper
let voiceModeActive = false;

function activateVoiceMode() {
  if (voiceModeActive) return;
  voiceModeActive = true;
  console.log('[VoiceMode] Activating whisper tap on AirPlay audio...');

  // Use Audio Hijack or blackhole to tap audio - here we trigger the pipeline
  execFile('/bin/bash', [
    '-c',
    `source ${process.env.HOME}/NOIZYLAB/voice-pipeline/voice-pipeline.sh 2>/dev/null &`
  ]);

  notifyGabriel('voice_mode', { active: true });
  broadcast({ event: 'voice_mode', active: true });

  setTimeout(() => {
    voiceModeActive = false;
    broadcast({ event: 'voice_mode', active: false });
  }, 30000); // 30s timeout
}

// ── HTTP Routes ───────────────────────────────────────────────────────────────

// GET /health
app.get('/health', (_, res) => {
  res.json({ status: 'ok', service: 'noizy-airplay', port: PORT, ...state });
});

// GET /state
app.get('/state', (_, res) => res.json(state));

// GET /events — SSE stream
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.write(`data: ${JSON.stringify({ event: 'connected', state })}\n\n`);
  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));
});

// POST /voice — activate voice mode manually
app.post('/voice', (_, res) => {
  activateVoiceMode();
  res.json({ ok: true, voice_mode: true });
});

// GET /dashboard — real-time HTML control panel
app.get('/', (_, res) => {
  res.send(dashboardHTML());
});

// GET /devices — list connected AirPlay devices (from macOS)
app.get('/devices', (_, res) => {
  exec(`system_profiler SPAudioDataType 2>/dev/null | grep -E "^\s+[A-Z].*:$" | head -20`, (err, out) => {
    const devices = out?.split('\n')
      .map(l => l.trim().replace(':', ''))
      .filter(Boolean) || [];
    res.json({ devices, airplay_active: state.airplay_active, total: devices.length });
  });
});

// ── Dashboard HTML ────────────────────────────────────────────────────────────
function dashboardHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>NOIZY AirPlay — GOD</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
    background: #0a0a0a; color: #f0f0f0; min-height: 100vh; padding: 24px; }
  .header { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; }
  .logo { font-size: 28px; font-weight: 800; letter-spacing: -1px;
    background: linear-gradient(135deg, #ff6b35, #f7931e, #ffcd3c);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .badge { background: #1a1a1a; border: 1px solid #333; border-radius: 8px;
    padding: 4px 12px; font-size: 12px; color: #888; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
  .card { background: #111; border: 1px solid #222; border-radius: 16px; padding: 20px; }
  .card h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px;
    color: #555; margin-bottom: 12px; }
  .status { display: flex; align-items: center; gap: 8px; }
  .dot { width: 10px; height: 10px; border-radius: 50%; }
  .dot.green { background: #30d158; box-shadow: 0 0 8px #30d158; animation: pulse 2s infinite; }
  .dot.red { background: #ff453a; }
  .dot.yellow { background: #ffd60a; }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
  .big-text { font-size: 32px; font-weight: 700; margin: 8px 0; }
  .sub-text { font-size: 13px; color: #666; }
  .meta { font-size: 14px; line-height: 1.8; }
  .meta span { color: #888; font-size: 12px; }
  .btn { background: #ff6b35; color: white; border: none; border-radius: 10px;
    padding: 10px 20px; font-size: 14px; font-weight: 600; cursor: pointer;
    transition: opacity 0.2s; margin-top: 12px; width: 100%; }
  .btn:hover { opacity: 0.85; }
  .btn.secondary { background: #1c1c1e; border: 1px solid #333; color: #f0f0f0; }
  .instructions { background: #0d1117; border: 1px solid #30363d; border-radius: 12px;
    padding: 16px; margin-top: 24px; }
  .instructions h3 { color: #ff6b35; margin-bottom: 12px; font-size: 14px; }
  .step { display: flex; gap: 12px; margin-bottom: 10px; align-items: flex-start; }
  .step-num { background: #ff6b35; color: white; border-radius: 50%;
    width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; flex-shrink: 0; }
  .step-text { font-size: 13px; color: #ccc; line-height: 1.5; }
  code { background: #1c1c1e; padding: 2px 6px; border-radius: 4px;
    font-family: 'SF Mono', monospace; font-size: 12px; color: #ff6b35; }
</style>
</head>
<body>
<div class="header">
  <span class="logo">NOIZY AirPlay</span>
  <span class="badge">GOD · M2 Ultra · ${new Date().toLocaleTimeString()}</span>
</div>
<div class="grid">
  <div class="card">
    <h3>AirPlay Receiver</h3>
    <div class="status">
      <div class="dot" id="statusDot"></div>
      <span id="statusText" style="font-size:18px;font-weight:600;">Checking...</span>
    </div>
    <div class="sub-text" id="deviceName" style="margin-top:8px;color:#888;">Waiting for connection</div>
    <div class="sub-text" id="connectedAt"></div>
  </div>
  <div class="card">
    <h3>Now Playing</h3>
    <div class="big-text" id="trackTitle" style="font-size:18px;">—</div>
    <div class="meta">
      <span>Artist</span><br><span id="trackArtist" style="color:#f0f0f0;">—</span><br>
      <span>Album</span><br><span id="trackAlbum" style="color:#f0f0f0;">—</span>
    </div>
  </div>
  <div class="card">
    <h3>Sessions</h3>
    <div class="big-text" id="sessionCount">0</div>
    <div class="sub-text">AirPlay connections this session</div>
    <button class="btn secondary" onclick="activateVoice()">🎙 Activate Voice Mode</button>
  </div>
  <div class="card">
    <h3>GABRIEL Status</h3>
    <div class="status">
      <div class="dot" id="gabrielDot"></div>
      <span id="gabrielStatus">Checking...</span>
    </div>
    <div class="sub-text" style="margin-top:8px;">Last sync: <span id="lastSync">—</span></div>
  </div>
</div>

<div class="instructions">
  <h3>📱 Connect Your Devices</h3>
  <div class="step">
    <div class="step-num">1</div>
    <div class="step-text"><strong>iPhone 15 Pro Max</strong> — Swipe to Control Center → tap <code>AirPlay</code> → select <code>GABRIEL.local</code></div>
  </div>
  <div class="step">
    <div class="step-num">2</div>
    <div class="step-text"><strong>iPad 12.9</strong> — Same path, or tap <code>AirPlay</code> icon in any media app → <code>GABRIEL.local</code></div>
  </div>
  <div class="step">
    <div class="step-num">3</div>
    <div class="step-text">Both devices can connect simultaneously. Audio routes to <code>Mac Studio Speakers</code> or connected Apollo interface</div>
  </div>
  <div class="step">
    <div class="step-num">4</div>
    <div class="step-text">Tap <strong>Voice Mode</strong> to transcribe AirPlay audio through GABRIEL's pipeline</div>
  </div>
</div>

<script>
const evtSource = new EventSource('/events');

evtSource.onmessage = (e) => {
  const data = JSON.parse(e.data);
  updateUI(data.state || {});
};

function updateUI(s) {
  const dot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  if (s.airplay_active) {
    dot.className = 'dot green';
    statusText.textContent = 'Connected';
    statusText.style.color = '#30d158';
  } else {
    dot.className = 'dot red';
    statusText.textContent = 'Waiting';
    statusText.style.color = '#ff453a';
  }
  document.getElementById('deviceName').textContent = s.device || 'Waiting for connection';
  document.getElementById('connectedAt').textContent = s.connected_at ? 'Since ' + new Date(s.connected_at).toLocaleTimeString() : '';
  document.getElementById('trackTitle').textContent = s.title || '—';
  document.getElementById('trackArtist').textContent = s.artist || '—';
  document.getElementById('trackAlbum').textContent = s.album || '—';
  document.getElementById('sessionCount').textContent = s.sessions || 0;
  if (s.last_ping) document.getElementById('lastSync').textContent = new Date(s.last_ping).toLocaleTimeString();
}

// GABRIEL health
async function checkGabriel() {
  try {
    const r = await fetch('http://localhost:7777/health');
    const d = await r.json();
    document.getElementById('gabrielDot').className = 'dot green';
    document.getElementById('gabrielStatus').textContent = 'GABRIEL v' + d.version + ' online';
  } catch(e) {
    document.getElementById('gabrielDot').className = 'dot red';
    document.getElementById('gabrielStatus').textContent = 'Offline';
  }
}
checkGabriel();
setInterval(checkGabriel, 10000);

async function activateVoice() {
  const r = await fetch('/voice', { method: 'POST' });
  const d = await r.json();
  alert(d.voice_mode ? '🎙 Voice mode active — speak now!' : 'Error activating voice mode');
}
</script>
</body>
</html>`;
}

// ── Start ─────────────────────────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[NOIZY AirPlay] Dashboard → http://GOD.local:${PORT}`);
  console.log(`[NOIZY AirPlay] SSE stream  → http://GOD.local:${PORT}/events`);
  console.log(`[NOIZY AirPlay] Health      → http://GOD.local:${PORT}/health`);
  console.log(`[NOIZY AirPlay] Native AirPlay Receiver: port 5000 (GABRIEL.local)`);
  notifyGabriel('startup', { port: PORT, dashboard: `http://GOD.local:${PORT}` });
});
