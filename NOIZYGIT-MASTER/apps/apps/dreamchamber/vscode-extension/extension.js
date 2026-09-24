/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DREAMCHAMBER VSCode Extension — v2.0
 * NOIZY Empire | GORUNFREE | RSP_001
 *
 * iPhone (Continuity Mic / Airfoil) → sox → temp WAV
 *   → POST /api/voice/v2/pipeline
 *     → Whisper STT → Claude (auto tower)
 *       → WebSocket voice:pipeline:complete
 *         → extract code → insert at cursor
 *
 * Keybindings:
 *   Cmd+Shift+J  — toggle recording (push-to-talk or auto-silence)
 *   Cmd+Shift+I  — insert last response at cursor
 *   Cmd+Shift+G  — type a text command to GABRIEL
 *   Cmd+Shift+D  — open Mission Control panel
 * ═══════════════════════════════════════════════════════════════════════════
 */
'use strict';

const vscode = require('vscode');
const { spawn, execSync } = require('child_process');
const path  = require('path');
const os    = require('os');
const http  = require('http');
const fs    = require('fs');
const crypto = require('crypto');

// ── ws: use parent dreamchamber node_modules (no separate install needed) ─────
let WebSocket;
try {
  WebSocket = require(path.join(__dirname, '..', 'node_modules', 'ws'));
} catch {
  try { WebSocket = require('ws'); } catch { WebSocket = null; }
}

// ── Module state ──────────────────────────────────────────────────────────────
let ws             = null;
let reconnectTimer = null;
let statusBar      = null;
let panel          = null;
let soxProc        = null;
let isRecording    = false;
let pendingRunId   = null;
let lastResponse   = null;
let ctx            = null;
const _handledRunIds = new Set(); // dedup: HTTP response + WS push carry same runId

// ────────────────────────────────────────────────────────────────────────────
// ACTIVATE / DEACTIVATE
// ────────────────────────────────────────────────────────────────────────────
function activate(context) {
  ctx = context;

  // Status bar — always visible, shows live state
  statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
  statusBar.command = 'dreamchamber.openPanel';
  statusBar.show();
  ctx.subscriptions.push(statusBar);
  setStatus('disconnected');

  // Commands
  ctx.subscriptions.push(
    vscode.commands.registerCommand('dreamchamber.listen',     cmdToggleListen),
    vscode.commands.registerCommand('dreamchamber.insertLast', cmdInsertLast),
    vscode.commands.registerCommand('dreamchamber.openPanel',  cmdOpenPanel),
    vscode.commands.registerCommand('dreamchamber.speak',      cmdTextSpeak),
  );

  if (!WebSocket) {
    vscode.window.showErrorMessage(
      'DreamChamber: ws module not found — run: cd ~/NOIZYLAB/dreamchamber && npm install',
      'Open Terminal'
    ).then(c => {
      if (c === 'Open Terminal') {
        const t = vscode.window.createTerminal('DreamChamber Setup');
        t.show();
        t.sendText('cd ~/NOIZYLAB/dreamchamber && npm install');
      }
    });
    return;
  }

  connectWS();
}

function deactivate() {
  stopRecording();
  clearTimeout(reconnectTimer);
  if (ws) { try { ws.close(); } catch {} ws = null; }
}

// ────────────────────────────────────────────────────────────────────────────
// CONFIG
// ────────────────────────────────────────────────────────────────────────────
function cfg() {
  return vscode.workspace.getConfiguration('dreamchamber');
}

function serverBase() {
  return (cfg().get('serverUrl') || 'http://localhost:7777').replace(/\/$/, '');
}

function wsUrl() {
  return serverBase().replace(/^http/, 'ws') + '/ws';
}

function apiKey() {
  return cfg().get('apiKey') || '';
}

function silenceSeconds() {
  return parseFloat(cfg().get('silenceSeconds') || '1.8');
}

// ────────────────────────────────────────────────────────────────────────────
// WEBSOCKET — auto-reconnect, event routing
// ────────────────────────────────────────────────────────────────────────────
function connectWS() {
  if (ws && (ws.readyState === 0 || ws.readyState === 1)) return;

  const headers = { 'x-client-id': 'vscode-dreamchamber' };
  const key = apiKey();
  if (key) headers['x-dc-key'] = key;

  try {
    ws = new WebSocket(wsUrl(), { headers });
  } catch (e) {
    scheduleReconnect();
    return;
  }

  ws.on('open', () => {
    clearTimeout(reconnectTimer);
    setStatus('idle');
    toPanel({ type: 'server:connected', url: wsUrl(), ts: Date.now() });
    // Send identity header so daemon logs the client
    try { ws.send(JSON.stringify({ type: 'ping' })); } catch {}
  });

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }
    routeMessage(msg);
  });

  ws.on('close', () => {
    ws = null;
    setStatus('disconnected');
    toPanel({ type: 'server:disconnected' });
    scheduleReconnect();
  });

  ws.on('error', () => {}); // close fires after error
}

function scheduleReconnect() {
  clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(connectWS, 5000);
}

// ────────────────────────────────────────────────────────────────────────────
// MESSAGE ROUTER — handle voice pipeline events from server
// ────────────────────────────────────────────────────────────────────────────
function routeMessage(msg) {
  toPanel(msg); // mirror every event to the panel

  switch (msg.type) {
    // ── Pipeline lifecycle ──────────────────────────────────────
    case 'voice:pipeline:start':
      setStatus('transcribing');
      break;

    case 'voice:pipeline:step':
      if (msg.name === 'whisper') setStatus('transcribing');
      if (msg.name === 'claude')  setStatus('thinking', msg.tower);
      break;

    case 'voice:pipeline:transcript':
      setStatus('thinking');
      vscode.window.setStatusBarMessage(
        `DreamChamber heard: "${(msg.transcript || '').slice(0, 70)}"`, 4000
      );
      break;

    case 'voice:pipeline:complete':
      if (!pendingRunId || msg.runId === pendingRunId) {
        pendingRunId = null;
        onResponse(msg);
      }
      break;

    // ── Direct speak responses ──────────────────────────────────
    case 'voice:response':
      // speakText() already called onResponse() via HTTP — skip the WS duplicate
      if (msg.runId && _handledRunIds.has(msg.runId)) {
        _handledRunIds.delete(msg.runId);
        break;
      }
      if (!pendingRunId || msg.runId === pendingRunId) {
        pendingRunId = null;
        onResponse(msg);
      }
      break;

    // ── GABRIEL daemon response (WS transcript path) ────────────
    case 'gabriel':
      if (!pendingRunId) {
        onResponse({ reply: msg.text || '', tower: msg.tower || 'max', model: msg.model });
      }
      break;

    // ── Audio Hijack path ───────────────────────────────────────
    case 'voice:audiohijack:complete':
      onResponse(msg);
      break;

    // ── Errors ─────────────────────────────────────────────────
    case 'voice:pipeline:error':
    case 'voice:audiohijack:error':
    case 'voice:error':
      setStatus('error');
      vscode.window.showErrorMessage(`DreamChamber: ${msg.error || 'Unknown error'}`);
      setTimeout(() => setStatus('idle'), 4000);
      break;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// RESPONSE HANDLER — extract code, insert at cursor
// ────────────────────────────────────────────────────────────────────────────
function onResponse(msg) {
  const { reply = '', tower = 'max', model, transcript } = msg;
  lastResponse = { reply, tower, model, transcript, ts: Date.now() };
  setStatus('ready', tower);

  const blocks = extractCode(reply);
  const autoInsert = cfg().get('autoInsert') !== false;

  if (blocks.length === 1 && autoInsert) {
    insertAtCursor(blocks[0].code);
    vscode.window.setStatusBarMessage(
      `GABRIEL [${tower.toUpperCase()}] → ${blocks[0].lang || 'code'} inserted (${blocks[0].code.split('\n').length} lines)`,
      6000
    );
  } else if (blocks.length > 1) {
    pickAndInsert(blocks, tower);
  } else if (blocks.length === 1) {
    // autoInsert off — offer choice
    vscode.window.showInformationMessage(
      `GABRIEL [${tower.toUpperCase()}]: code ready`,
      'Insert at Cursor', 'Dismiss'
    ).then(c => { if (c === 'Insert at Cursor') insertAtCursor(blocks[0].code); });
  } else {
    // No code block — prose response
    vscode.window.showInformationMessage(
      `[${tower.toUpperCase()}] ${reply.slice(0, 140)}${reply.length > 140 ? '…' : ''}`,
      'Insert Text', 'Dismiss'
    ).then(c => { if (c === 'Insert Text') insertAtCursor(reply); });
  }

  setTimeout(() => setStatus('idle'), 10000);
}

// ────────────────────────────────────────────────────────────────────────────
// RECORDING — sox captures system default mic (iPhone via Continuity Camera)
// ────────────────────────────────────────────────────────────────────────────
function cmdToggleListen() {
  if (isRecording) {
    stopAndSubmit();
  } else {
    startRecording();
  }
}

function startRecording() {
  // Verify sox is available
  try {
    execSync('which sox 2>/dev/null || command -v sox 2>/dev/null', { stdio: 'pipe' });
  } catch {
    vscode.window.showErrorMessage(
      'DreamChamber: sox not found — required for mic capture',
      'brew install sox'
    ).then(c => {
      if (c === 'brew install sox') {
        const t = vscode.window.createTerminal('DreamChamber: Install sox');
        t.show();
        t.sendText('brew install sox && echo "✓ sox installed — press Cmd+Shift+J to record"');
      }
    });
    return;
  }

  const wavPath = path.join(os.tmpdir(), `dc-${Date.now()}-${crypto.randomBytes(3).toString('hex')}.wav`);
  const silence = silenceSeconds().toFixed(1);

  // sox -d = default audio input device
  // iPhone Continuity Mic appears as system default when selected in System Settings → Sound → Input
  // silence detection: stop after N seconds of quiet at 0.5% threshold
  soxProc = spawn('sox', [
    '-d',
    '-r', '16000',
    '-c', '1',
    '-b', '16',
    '-e', 'signed-integer',
    '-t', 'wav', wavPath,
    'silence', '1', '0.3', '0.5%',   // start trigger: 0.3s of sound above 0.5%
    '1', silence, '0.5%',             // stop trigger: N seconds of silence below 0.5%
  ]);

  soxProc._wavPath = wavPath;
  isRecording = true;
  setStatus('recording');
  toPanel({ type: 'recording:start', wavPath });
  vscode.window.setStatusBarMessage('DreamChamber: listening… (Cmd+Shift+J to stop)', 60000);

  soxProc.on('exit', (code) => {
    if (isRecording) {
      // Auto-stopped on silence
      isRecording = false;
      soxProc = null;
      submitWav(wavPath);
    }
  });

  soxProc.stderr.on('data', () => {}); // suppress sox stderr noise

  soxProc.on('error', (e) => {
    isRecording = false;
    soxProc = null;
    setStatus('error');
    vscode.window.showErrorMessage(`DreamChamber: sox error — ${e.message}`);
    setTimeout(() => setStatus('idle'), 3000);
  });
}

function stopAndSubmit() {
  const wavPath = soxProc?._wavPath;
  stopRecording();
  if (wavPath) {
    setTimeout(() => submitWav(wavPath), 300); // give sox time to flush WAV header
  } else {
    setStatus('idle');
  }
}

function stopRecording() {
  if (soxProc) {
    try { soxProc.kill('SIGTERM'); } catch {}
    soxProc = null;
  }
  isRecording = false;
  toPanel({ type: 'recording:stop' });
}

async function submitWav(wavPath) {
  // Sanity-check the file
  if (!fs.existsSync(wavPath)) {
    setStatus('idle');
    vscode.window.showWarningMessage('DreamChamber: No audio file captured — check mic permissions');
    return;
  }

  const stat = fs.statSync(wavPath);
  if (stat.size < 8000) { // ~0.25s of 16kHz 16-bit mono
    setStatus('idle');
    vscode.window.showWarningMessage('DreamChamber: Audio too short — speak closer/louder');
    fs.unlink(wavPath, () => {});
    return;
  }

  setStatus('transcribing');
  toPanel({ type: 'pipeline:submitting', size: stat.size });

  const towerHint = cfg().get('tower');
  const body = { path: wavPath };
  if (towerHint && towerHint !== 'auto') body.tower = towerHint;

  try {
    const res = await apiPost(`${serverBase()}/voice/pipeline`, body);
    pendingRunId = res.runId;
    toPanel({ type: 'pipeline:accepted', runId: res.runId });
  } catch (e) {
    setStatus('error');
    vscode.window.showErrorMessage(`DreamChamber pipeline: ${e.message}`);
    setTimeout(() => setStatus('idle'), 4000);
    fs.unlink(wavPath, () => {});
  }
  // WAV cleanup handled after pipeline:complete (server keeps it for Whisper)
}

// ────────────────────────────────────────────────────────────────────────────
// TEXT SPEAK — type a command, skip voice
// ────────────────────────────────────────────────────────────────────────────
async function cmdTextSpeak() {
  const text = await vscode.window.showInputBox({
    prompt: 'GABRIEL — What do you need built?',
    placeHolder: 'Build a Cloudflare Worker that rate-limits by IP…',
    ignoreFocusOut: true,
  });
  if (!text?.trim()) return;
  await speakText(text.trim());
}

function detectLocalTower(text) {
  const t = text.toLowerCase();
  if (/build|code|deploy|script|api|worker|function|install|git|fix|debug|error|wrangler|cloudflare/.test(t)) return 'code';
  if (/task|assign|route|crew|channel|delegate|schedule|team|coordinate/.test(t)) return 'work';
  return 'max';
}

async function speakText(text) {
  setStatus('thinking');
  toPanel({ type: 'speak:text', text });

  const body = { text, tts: false };

  try {
    const res = await apiPost(`${serverBase()}/command`, body);
    // /command returns { reply } synchronously — no WS duplicate to filter
    onResponse({ reply: res.reply || '', tower: detectLocalTower(text), model: res.model });
  } catch (e) {
    setStatus('error');
    vscode.window.showErrorMessage(`DreamChamber: ${e.message}`);
    setTimeout(() => setStatus('idle'), 4000);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// INSERT LAST
// ────────────────────────────────────────────────────────────────────────────
function cmdInsertLast() {
  if (!lastResponse) {
    vscode.window.showWarningMessage('DreamChamber: No response yet — press Cmd+Shift+J to record');
    return;
  }
  const blocks = extractCode(lastResponse.reply);
  if (blocks.length === 1) {
    insertAtCursor(blocks[0].code);
  } else if (blocks.length > 1) {
    pickAndInsert(blocks, lastResponse.tower);
  } else {
    insertAtCursor(lastResponse.reply);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// MISSION CONTROL PANEL (WebView)
// ────────────────────────────────────────────────────────────────────────────
function cmdOpenPanel() {
  if (panel) {
    panel.reveal(vscode.ViewColumn.Two);
    return;
  }

  panel = vscode.window.createWebviewPanel(
    'dreamchamber.panel',
    'GABRIEL — Mission Control',
    vscode.ViewColumn.Two,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    }
  );

  panel.webview.html = buildPanelHtml();

  // Messages from WebView → extension
  panel.webview.onDidReceiveMessage(async (msg) => {
    switch (msg.type) {
      case 'listen:toggle':  cmdToggleListen(); break;
      case 'speak:text':     if (msg.text) await speakText(msg.text); break;
      case 'insert:code':    if (msg.code) insertAtCursor(msg.code); break;
      case 'insert:last':    cmdInsertLast(); break;
      case 'panel:ready':
        // Panel just loaded — send current state
        toPanel({ type: 'status', state: ws?.readyState === 1 ? 'idle' : 'disconnected' });
        if (lastResponse) toPanel({ type: 'voice:pipeline:complete', ...lastResponse });
        break;
    }
  }, undefined, ctx.subscriptions);

  panel.onDidDispose(() => { panel = null; });
}

// ────────────────────────────────────────────────────────────────────────────
// UTILS
// ────────────────────────────────────────────────────────────────────────────
function insertAtCursor(text) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('DreamChamber: Open a file to insert code');
    return;
  }
  editor.edit(edit => {
    edit.insert(editor.selection.active, text);
  }).then(() => {
    // Best-effort format
    vscode.commands.executeCommand('editor.action.formatSelection').then(() => {}, () => {});
  });
}

async function pickAndInsert(blocks, tower) {
  const items = blocks.map((b, i) => ({
    label: `$(code) Block ${i + 1}${b.lang ? `  ·  ${b.lang}` : ''}`,
    description: b.code.split('\n')[0].slice(0, 80),
    detail: `${b.code.split('\n').length} lines`,
    code: b.code,
  }));

  const pick = await vscode.window.showQuickPick(items, {
    title: `GABRIEL [${(tower || 'max').toUpperCase()}] — Select block to insert`,
    placeHolder: 'Choose a code block',
  });
  if (pick) insertAtCursor(pick.code);
}

function extractCode(text) {
  const blocks = [];
  const re = /```(\w*)\n?([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const code = m[2].trimEnd();
    if (code.trim().length > 0) blocks.push({ lang: m[1] || '', code });
  }
  return blocks;
}

function setStatus(state, tower) {
  const ICONS = {
    idle:          '$(unmute) GABRIEL',
    recording:     '$(record) REC',
    transcribing:  '$(loading~spin) Whisper',
    thinking:      `$(loading~spin) ${(tower || 'Claude').toUpperCase()}`,
    ready:         `$(check) ${(tower || 'Done').toUpperCase()}`,
    error:         '$(error) Error',
    disconnected:  '$(debug-disconnect) DC Offline',
  };

  statusBar.text = ICONS[state] || '$(unmute) GABRIEL';
  statusBar.tooltip = [
    `DreamChamber [${state}]`,
    tower ? `tower: ${tower}` : null,
    '',
    'Cmd+Shift+J  — toggle recording',
    'Cmd+Shift+I  — insert last response',
    'Cmd+Shift+G  — type a command',
    'Click        — Mission Control',
  ].filter(Boolean).join('\n');

  statusBar.backgroundColor =
    state === 'recording'    ? new vscode.ThemeColor('statusBarItem.errorBackground') :
    state === 'disconnected' ? new vscode.ThemeColor('statusBarItem.warningBackground') :
    state === 'error'        ? new vscode.ThemeColor('statusBarItem.errorBackground') :
    undefined;

  toPanel({ type: 'status', state, tower });
}

function toPanel(msg) {
  try { panel?.webview.postMessage(msg); } catch {}
}

function apiPost(url, body) {
  return new Promise((resolve, reject) => {
    const data    = JSON.stringify(body);
    const parsed  = new URL(url);
    const options = {
      hostname: parsed.hostname,
      port:     parsed.port || 80,
      path:     parsed.pathname + (parsed.search || ''),
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const key = apiKey();
    if (key) options.headers['x-dc-key'] = key;

    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => {
        try {
          const json = JSON.parse(raw);
          if (res.statusCode >= 400) {
            reject(new Error(json.error || `HTTP ${res.statusCode}: ${json.message || raw.slice(0, 80)}`));
          } else {
            resolve(json);
          }
        } catch {
          reject(new Error(`Invalid JSON from server: ${raw.slice(0, 80)}`));
        }
      });
    });

    req.setTimeout(30000, () => { req.destroy(new Error('Request timed out (30s)')); });
    req.on('error', reject);
    req.end(data);
  });
}

// ────────────────────────────────────────────────────────────────────────────
// MISSION CONTROL — WebView HTML
// Full voice pipeline dashboard: status, transcript, response, history, controls
// ────────────────────────────────────────────────────────────────────────────
function buildPanelHtml() {
  const nonce = crypto.randomBytes(16).toString('hex');

  return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy"
  content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>DreamChamber</title>
<style nonce="${nonce}">
  :root {
    --bg:        var(--vscode-editor-background, #0d0d0d);
    --bg2:       var(--vscode-editorWidget-background, #141414);
    --bg3:       var(--vscode-input-background, #1e1e1e);
    --fg:        var(--vscode-editor-foreground, #e0e0e0);
    --fg2:       var(--vscode-descriptionForeground, #888);
    --accent:    var(--vscode-focusBorder, #ff4500);
    --green:     #00ff88;
    --yellow:    #ffcc00;
    --red:       #ff4444;
    --border:    var(--vscode-panel-border, #333);
    --font:      var(--vscode-editor-font-family, 'JetBrains Mono', monospace);
    --radius:    6px;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--bg);
    color: var(--fg);
    font-family: var(--font);
    font-size: 13px;
    line-height: 1.5;
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* ── Header ─────────────────────────────────────────── */
  .header {
    padding: 12px 16px 10px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--bg2);
    flex-shrink: 0;
  }
  .header-title {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent);
  }
  .header-sub { font-size: 11px; color: var(--fg2); }
  .server-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--red);
    flex-shrink: 0;
    transition: background 0.3s;
  }
  .server-dot.online  { background: var(--green); }
  .server-dot.pulse   { animation: pulse 1s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

  /* ── Main scroll area ─────────────────────────────────── */
  .main { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 12px; }

  /* ── PTT Button ──────────────────────────────────────── */
  .ptt-row { display: flex; gap: 8px; align-items: center; }
  .ptt-btn {
    flex: 1;
    padding: 14px;
    border: 2px solid var(--border);
    border-radius: var(--radius);
    background: var(--bg3);
    color: var(--fg);
    font-family: var(--font);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .ptt-btn:hover  { border-color: var(--accent); color: var(--accent); }
  .ptt-btn.active {
    background: #330000;
    border-color: var(--red);
    color: var(--red);
    animation: rec-pulse 0.8s ease-in-out infinite;
  }
  @keyframes rec-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.85;transform:scale(0.99)} }

  .mic-ring {
    width: 12px; height: 12px; border-radius: 50%;
    border: 2px solid currentColor;
    flex-shrink: 0;
  }
  .ptt-btn.active .mic-ring { background: var(--red); border-color: var(--red); }

  /* ── State badge ──────────────────────────────────────── */
  .state-badge {
    font-size: 11px;
    padding: 3px 8px;
    border-radius: 3px;
    background: var(--bg3);
    border: 1px solid var(--border);
    color: var(--fg2);
    letter-spacing: 0.06em;
    white-space: nowrap;
  }
  .state-badge.recording    { background:#330000; border-color:var(--red);    color:var(--red); }
  .state-badge.transcribing { background:#1a1500; border-color:var(--yellow); color:var(--yellow); }
  .state-badge.thinking     { background:#001520; border-color:#0af;          color:#0af; }
  .state-badge.ready        { background:#001a0a; border-color:var(--green);  color:var(--green); }
  .state-badge.error        { background:#330000; border-color:var(--red);    color:var(--red); }

  /* ── Panels ───────────────────────────────────────────── */
  .card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
  }
  .card-header {
    padding: 6px 10px;
    border-bottom: 1px solid var(--border);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--fg2);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .card-body { padding: 10px; }

  /* ── Transcript ───────────────────────────────────────── */
  #transcript-text {
    color: var(--yellow);
    font-size: 13px;
    min-height: 20px;
    font-style: italic;
    word-break: break-word;
  }
  #transcript-text.empty { color: var(--fg2); font-style: normal; font-size: 12px; }

  /* ── Tower badge ──────────────────────────────────────── */
  .tower-badge {
    font-size: 10px;
    padding: 2px 7px;
    border-radius: 3px;
    font-weight: 700;
    letter-spacing: 0.1em;
  }
  .tower-max  { background:#1a0040; color:#bb88ff; border:1px solid #6633cc; }
  .tower-code { background:#001520; color:#00ccff; border:1px solid #0066aa; }
  .tower-work { background:#001500; color:#00ff88; border:1px solid #006633; }

  /* ── Response ─────────────────────────────────────────── */
  #response-area {
    font-size: 12px;
    line-height: 1.6;
    color: var(--fg);
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 280px;
    overflow-y: auto;
  }
  .code-block {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 8px 10px;
    margin: 6px 0;
    font-size: 12px;
    overflow-x: auto;
    position: relative;
  }
  .code-block .lang-tag {
    font-size: 10px;
    color: var(--fg2);
    margin-bottom: 4px;
    letter-spacing: 0.05em;
  }
  .code-block pre { margin: 0; white-space: pre; font-family: var(--font); }
  .insert-btn {
    position: absolute;
    top: 6px; right: 6px;
    padding: 3px 8px;
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: 3px;
    color: var(--fg2);
    font-family: var(--font);
    font-size: 10px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .insert-btn:hover { border-color: var(--green); color: var(--green); }
  .insert-btn:active { background: #001a0a; }

  /* ── Text input ───────────────────────────────────────── */
  .input-row { display: flex; gap: 6px; }
  .text-input {
    flex: 1;
    padding: 8px 10px;
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--fg);
    font-family: var(--font);
    font-size: 12px;
    outline: none;
    transition: border-color 0.15s;
  }
  .text-input:focus { border-color: var(--accent); }
  .text-input::placeholder { color: var(--fg2); }
  .send-btn {
    padding: 8px 14px;
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--fg);
    font-family: var(--font);
    font-size: 12px;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s;
  }
  .send-btn:hover  { border-color: var(--accent); color: var(--accent); }
  .send-btn:active { background: #1a0000; }

  /* ── History ──────────────────────────────────────────── */
  .history-item {
    padding: 6px 0;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: baseline;
    gap: 8px;
    font-size: 11px;
  }
  .history-item:last-child { border-bottom: none; }
  .history-tower { flex-shrink: 0; }
  .history-text { color: var(--fg2); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .history-time { flex-shrink: 0; color: var(--fg2); font-size: 10px; }
  #history-list:empty::after { content: 'No runs yet'; color: var(--fg2); font-size: 12px; }

  /* ── Kbd hint ─────────────────────────────────────────── */
  .kbd-hints { display: flex; gap: 12px; flex-wrap: wrap; }
  .kbd { font-size: 10px; color: var(--fg2); }
  .kbd kbd {
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: 3px;
    padding: 1px 5px;
    font-family: var(--font);
    font-size: 10px;
    color: var(--fg);
  }

  /* ── Scrollbar ────────────────────────────────────────── */
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
  ::-webkit-scrollbar-thumb:hover { background: #555; }
</style>
</head>
<body>

<!-- ── HEADER ─────────────────────────────────────────────────────── -->
<div class="header">
  <div class="server-dot" id="server-dot"></div>
  <div>
    <div class="header-title">DreamChamber — GABRIEL</div>
    <div class="header-sub" id="server-label">connecting…</div>
  </div>
  <div style="flex:1"></div>
  <div class="state-badge" id="state-badge">OFFLINE</div>
</div>

<!-- ── MAIN ───────────────────────────────────────────────────────── -->
<div class="main">

  <!-- PTT button -->
  <div class="ptt-row">
    <button class="ptt-btn" id="ptt-btn" onclick="toggleListen()">
      <span class="mic-ring"></span>
      <span id="ptt-label">LISTEN  (Cmd+Shift+J)</span>
    </button>
  </div>

  <!-- Transcript -->
  <div class="card">
    <div class="card-header">
      <span>Transcript</span>
      <span id="tower-badge" style="display:none"></span>
    </div>
    <div class="card-body">
      <div id="transcript-text" class="empty">waiting for voice input…</div>
    </div>
  </div>

  <!-- Response -->
  <div class="card" id="response-card" style="display:none">
    <div class="card-header">
      <span>Response</span>
      <button class="insert-btn" style="position:static;margin-left:auto" onclick="insertLast()">Insert Last</button>
    </div>
    <div class="card-body">
      <div id="response-area"></div>
    </div>
  </div>

  <!-- Text input -->
  <div class="card">
    <div class="card-header">Type a Command</div>
    <div class="card-body">
      <div class="input-row">
        <input
          class="text-input"
          id="text-input"
          type="text"
          placeholder="Build a Cloudflare Worker that…"
          onkeydown="onInputKey(event)"
        />
        <button class="send-btn" onclick="sendText()">Send ↵</button>
      </div>
    </div>
  </div>

  <!-- History -->
  <div class="card">
    <div class="card-header">History</div>
    <div class="card-body" style="padding:6px 10px">
      <div id="history-list"></div>
    </div>
  </div>

  <!-- Keyboard hints -->
  <div class="kbd-hints">
    <span class="kbd"><kbd>⌘⇧J</kbd> listen</span>
    <span class="kbd"><kbd>⌘⇧I</kbd> insert last</span>
    <span class="kbd"><kbd>⌘⇧G</kbd> type cmd</span>
    <span class="kbd"><kbd>⌘⇧D</kbd> this panel</span>
  </div>

</div><!-- /main -->

<script nonce="${nonce}">
const vscode = acquireVsCodeApi();

// ── State ─────────────────────────────────────────────────────────
let currentState    = 'disconnected';
let lastReply       = '';
let history         = [];
let isRecording     = false;

// ── Init ──────────────────────────────────────────────────────────
window.addEventListener('load', () => {
  vscode.postMessage({ type: 'panel:ready' });
});

// ── Message handler (from extension) ──────────────────────────────
window.addEventListener('message', (event) => {
  const msg = event.data;
  switch (msg.type) {

    case 'server:connected':
      setServerOnline(true, msg.url || '');
      setStateBadge('idle');
      break;

    case 'server:disconnected':
      setServerOnline(false, '');
      setStateBadge('disconnected');
      break;

    case 'status':
      setStateBadge(msg.state, msg.tower);
      if (msg.state === 'recording') {
        isRecording = true;
        updatePttBtn(true);
      } else if (isRecording && msg.state !== 'recording') {
        isRecording = false;
        updatePttBtn(false);
      }
      break;

    case 'recording:start':
      isRecording = true;
      updatePttBtn(true);
      setTranscript('', '');
      break;

    case 'recording:stop':
      isRecording = false;
      updatePttBtn(false);
      break;

    case 'pipeline:submitting':
      setStateBadge('transcribing');
      break;

    case 'voice:pipeline:transcript':
      setTranscript(msg.transcript || '', '');
      break;

    case 'voice:pipeline:step':
      if (msg.name === 'claude' && msg.tower) setTowerBadge(msg.tower);
      break;

    case 'voice:pipeline:complete':
    case 'voice:response':
    case 'voice:audiohijack:complete': {
      const { reply = '', tower, transcript, model } = msg;
      setTranscript(transcript || '', tower || '');
      showResponse(reply, tower || '');
      addHistory(tower || 'max', transcript || reply.slice(0, 60), model);
      lastReply = reply;
      setStateBadge('ready', tower);
      break;
    }

    case 'speak:text':
      setTranscript(msg.text || '', '');
      setStateBadge('thinking');
      break;

    case 'voice:pipeline:error':
    case 'voice:error':
      setStateBadge('error');
      setTranscript('Error: ' + (msg.error || 'unknown'), '');
      break;
  }
});

// ── UI helpers ────────────────────────────────────────────────────
function setServerOnline(online, url) {
  const dot   = document.getElementById('server-dot');
  const label = document.getElementById('server-label');
  if (online) {
    dot.className = 'server-dot online';
    label.textContent = 'SERVER ONLINE';
  } else {
    dot.className = 'server-dot';
    label.textContent = 'server offline — reconnecting…';
  }
}

function setStateBadge(state, tower) {
  currentState = state;
  const el = document.getElementById('state-badge');
  const LABELS = {
    idle:          'IDLE',
    recording:     '⬤ REC',
    transcribing:  '⟳ WHISPER',
    thinking:      tower ? \`⟳ \${tower.toUpperCase()}\` : '⟳ CLAUDE',
    ready:         tower ? \`✓ \${tower.toUpperCase()}\` : '✓ DONE',
    error:         '✕ ERROR',
    disconnected:  'OFFLINE',
  };
  el.textContent  = LABELS[state] || state.toUpperCase();
  el.className    = \`state-badge \${state}\`;
}

function setTranscript(text, tower) {
  const el = document.getElementById('transcript-text');
  if (!text) {
    el.textContent = 'waiting for voice input…';
    el.className = 'empty';
  } else {
    el.textContent = \`"\${text}"\`;
    el.className = '';
  }
  if (tower) setTowerBadge(tower);
}

function setTowerBadge(tower) {
  const el = document.getElementById('tower-badge');
  const CLASS = { max: 'tower-max', code: 'tower-code', work: 'tower-work' };
  el.textContent = tower.toUpperCase();
  el.className = \`tower-badge \${CLASS[tower] || 'tower-max'}\`;
  el.style.display = '';
}

function showResponse(reply, tower) {
  const card = document.getElementById('response-card');
  const area  = document.getElementById('response-area');

  card.style.display = '';
  area.innerHTML = '';

  if (tower) setTowerBadge(tower);

  // Split on code fences, render each segment
  const parts = reply.split(/([\`]{3}\\w*\\n?[\\s\\S]*?[\`]{3})/g);
  parts.forEach(part => {
    const codeMatch = part.match(/^\`\`\`(\\w*)\\n?([\\s\\S]*?)\`\`\`$/);
    if (codeMatch) {
      const lang = codeMatch[1] || '';
      const code = codeMatch[2].trimEnd();
      const block = document.createElement('div');
      block.className = 'code-block';
      block.innerHTML =
        (lang ? \`<div class="lang-tag">\${lang}</div>\` : '') +
        \`<pre>\${escHtml(code)}</pre>\` +
        \`<button class="insert-btn" onclick="insertCode(this)">Insert</button>\`;
      block.dataset.code = code;
      area.appendChild(block);
    } else if (part.trim()) {
      const p = document.createElement('div');
      p.style.cssText = 'margin-bottom:6px;color:var(--fg2);font-size:12px';
      p.textContent = part.trim();
      area.appendChild(p);
    }
  });
}

function addHistory(tower, preview, model) {
  history.unshift({ tower, preview, model, ts: Date.now() });
  if (history.length > 8) history.pop();
  renderHistory();
}

function renderHistory() {
  const list = document.getElementById('history-list');
  list.innerHTML = '';
  history.forEach(h => {
    const age = Math.round((Date.now() - h.ts) / 1000);
    const ageStr = age < 60 ? \`\${age}s ago\` : \`\${Math.round(age/60)}m ago\`;
    const CLASS = { max: 'tower-max', code: 'tower-code', work: 'tower-work' };
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML =
      \`<span class="tower-badge \${CLASS[h.tower] || 'tower-max'} history-tower">\${h.tower.toUpperCase()}</span>\` +
      \`<span class="history-text">\${escHtml(h.preview || '')}</span>\` +
      \`<span class="history-time">\${ageStr}</span>\`;
    list.appendChild(item);
  });
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Controls ──────────────────────────────────────────────────────
function toggleListen() {
  vscode.postMessage({ type: 'listen:toggle' });
}

function updatePttBtn(active) {
  const btn   = document.getElementById('ptt-btn');
  const label = document.getElementById('ptt-label');
  if (active) {
    btn.className = 'ptt-btn active';
    label.textContent = 'STOP RECORDING  (Cmd+Shift+J)';
  } else {
    btn.className = 'ptt-btn';
    label.textContent = 'LISTEN  (Cmd+Shift+J)';
  }
}

function sendText() {
  const el   = document.getElementById('text-input');
  const text = el.value.trim();
  if (!text) return;
  el.value = '';
  vscode.postMessage({ type: 'speak:text', text });
}

function onInputKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText(); }
}

function insertCode(btn) {
  const code = btn.closest('.code-block').dataset.code;
  vscode.postMessage({ type: 'insert:code', code });
}

function insertLast() {
  vscode.postMessage({ type: 'insert:last' });
}
</script>
</body>
</html>`;
}

module.exports = { activate, deactivate };
