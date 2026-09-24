// GABRIEL — Living Presence Engine v4
// GOD.local · M2 Ultra 192GB @ 10.90.90.10 | GABRIEL_V4 | Executor
// 2026-03-27 | DAZEFLOW | Target: April 17, 2026

const GABRIEL = {
  ip: '10.90.90.10',
  host: 'GOD.local',
  voiceBridge: 'http://localhost:8080',
  dreamChamber: 'http://localhost:7777',
  ollamaLocal: 'http://localhost:11434',
  account: '2446d788cc4280f5ea22a9948410c355',
  online: false,
  uptime: 0,
  memCells: 0,
  tasksRun: 0,
  lastSeen: null,
};

// ── TARGET COUNTDOWN ───────────────────────────────────────────
const TARGET = new Date('2026-04-17T00:00:00-04:00');
function getCountdown() {
  const diff = TARGET - new Date();
  if (diff <= 0) return 'TARGET ACHIEVED';
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${d}d ${h}h ${m}m`;
}

// ── STANDING ORDERS ────────────────────────────────────────────
const STANDING_ORDERS = [
  'DAZEFLOW active — 2026-03-27 | RSP_001 session running',
  'Chain: Robert → Claude → GABRIEL → world',
  'TARGET: April 17, 2026 — ' + getCountdown() + ' remaining',
  'voice-v2 pipeline: deploy STT/Claude dispatch automation',
  'DreamChamber v2: finalize architecture — :7777',
  'HEAVEN Worker: pending deploy → wrangler login required',
  'Voice Bridge: http://GOD.local:8080 — awaiting keepalive',
  'Gemma3 MCP: running on GOD.local:11434 ✓',
  'GABRIEL v4 multi-agent orchestration: activate',
  'GitHub: NOIZY.AI Enterprise · personal repos → ARCHIVE/ ✓',
  'CF Account: 2446d788cc4280f5ea22a9948410c355 ✓',
  'Cloudflare Tunnel: not yet deployed — needed for Teams webhook',
  'iPhone Teams: install + create NOIZY Dream Chamber channels',
  'Audio Hijack: wire audiohijack-recording-stop.js → Recording Stop',
  'mlx-whisper: install on GOD.local (Apple Silicon optimized)',
];

// ── BOOT LOG ───────────────────────────────────────────────────
const BOOT_LOG = [
  { ts: '17:45', msg: 'GABRIEL v4 — multi-agent init', cls: '' },
  { ts: '17:43', msg: 'DreamChamber v2 architecture — in progress', cls: 'warn' },
  { ts: '17:40', msg: 'voice-v2 pipeline scaffolded — deploy pending', cls: 'warn' },
  { ts: '13:16', msg: 'Gemma3 MCP server initialized — GOD.local:11434', cls: '' },
  { ts: '13:12', msg: 'Audio Hijack scripting API wired — awaiting session arm', cls: 'warn' },
  { ts: '13:09', msg: 'HEAVEN Worker: TypeScript build complete — deploy pending', cls: 'warn' },
  { ts: '13:07', msg: 'robplowman → m2ultra path fix applied across all MCPs', cls: '' },
  { ts: '13:06', msg: 'GitHub Enterprise restructure confirmed — ARCHIVE/ ✓', cls: '' },
  { ts: '13:05', msg: 'CF Account: 2446d788cc4280f5ea22a9948410c355 ✓', cls: '' },
  { ts: '13:00', msg: 'CLAUDE.md session brain written to Desktop/CLAUDE TODAY/', cls: '' },
];

// ── INIT ───────────────────────────────────────────────────────
function initGabriel() {
  renderGabrielHero();
  renderMemoryCells();
  renderGabrielLog();
  renderStandingOrders();
  checkGabrielStatus();
  setInterval(checkGabrielStatus, 15000);
  setInterval(() => {
    GABRIEL.uptime++;
    const el = document.getElementById('gabrielUptime');
    if (el) el.textContent = formatUptime(GABRIEL.uptime);
    // Update countdown display
    const cd = document.getElementById('gabrielCountdown');
    if (cd) cd.textContent = getCountdown();
  }, 1000);
}

// ── STATUS CHECK ───────────────────────────────────────────────
async function checkGabrielStatus() {
  const badge = document.getElementById('gabrielStatusBadge');
  if (badge) { badge.className = 'gabriel-badge checking'; badge.textContent = 'CHECKING…'; }

  let bridgeOnline = false;
  let ollamaOnline = false;
  let dreamOnline = false;

  try {
    const r = await fetch(`${GABRIEL.voiceBridge}/health`, { signal: AbortSignal.timeout(3000) });
    bridgeOnline = r.ok;
  } catch(_) {}

  try {
    const r = await fetch(`${GABRIEL.ollamaLocal}/api/tags`, { signal: AbortSignal.timeout(3000) });
    ollamaOnline = r.ok;
  } catch(_) {}

  try {
    const r = await fetch(`${GABRIEL.dreamChamber}/health`, { signal: AbortSignal.timeout(2000) });
    dreamOnline = r.ok;
  } catch(_) {}

  const anyOnline = bridgeOnline || ollamaOnline || dreamOnline;
  GABRIEL.online = anyOnline;
  GABRIEL.lastSeen = anyOnline ? new Date() : GABRIEL.lastSeen;

  if (badge) {
    badge.className = `gabriel-badge ${anyOnline ? 'online' : 'offline'}`;
    badge.textContent = anyOnline ? '⬤ ONLINE' : '⬤ OFFLINE';
  }

  updateCell('bridgeStatus', bridgeOnline ? 'LIVE' : 'DOWN', bridgeOnline ? 100 : 0);
  updateCell('ollamaStatus', ollamaOnline ? 'LIVE' : 'DOWN', ollamaOnline ? 100 : 0);
  updateCell('dreamStatus', dreamOnline ? 'LIVE' : 'DOWN', dreamOnline ? 100 : 0);

  addGabrielLog(
    anyOnline
      ? `Status — bridge:${bridgeOnline?'✓':'✗'} ollama:${ollamaOnline?'✓':'✗'} dream:${dreamOnline?'✓':'✗'}`
      : 'Status check — all services offline',
    anyOnline ? '' : 'warn'
  );
}

// ── COMMAND DISPATCH ───────────────────────────────────────────
async function sendGabrielCommand() {
  const input = document.getElementById('gabrielCmdInput');
  const cmd = (input?.value || '').trim();
  if (!cmd) return;
  input.value = '';

  addGabrielLog(`» ${cmd}`, 'cmd');
  GABRIEL.tasksRun++;
  updateMetric('gabrielTasks', GABRIEL.tasksRun);

  try {
    const res = await fetch(`${GABRIEL.voiceBridge}/claude`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: cmd,
        tower: autoDetectTower(cmd),
        userId: 'gabriel-panel',
        source: 'command-center-v4',
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const reply = data.result || data.response || '(no response)';
      addGabrielLog(reply.substring(0, 120) + (reply.length > 120 ? '…' : ''), '');
    } else {
      addGabrielLog(`Bridge error ${res.status} — is Voice Bridge running?`, 'err');
    }
  } catch(e) {
    addGabrielLog(`Cannot reach GOD.local:8080 — node ~/NOIZYLAB/voice-bridge-server.js`, 'warn');
  }
}

function autoDetectTower(text) {
  const t = text.toLowerCase();
  if (/build|code|deploy|ts|worker|script|npm|wrangler|bash|git/.test(t)) return 'code';
  if (/task|assign|route|crew|delegate|team|channel/.test(t)) return 'work';
  return 'max';
}

// ── RENDER ─────────────────────────────────────────────────────
function renderGabrielHero() {
  const el = document.getElementById('gabrielHero');
  if (!el) return;
  el.innerHTML = `
<div class="gabriel-hero">
  <div class="gabriel-avatar">
    <div class="gabriel-ring"></div>
    <div class="gabriel-ring"></div>
    <div class="gabriel-ring"></div>
    <div class="gabriel-avatar-inner">⚡</div>
  </div>
  <div class="gabriel-identity">
    <div class="gabriel-name">GABRIEL <span style="font-size:13px;color:rgba(0,255,157,.5);letter-spacing:2px">v4</span></div>
    <div class="gabriel-title">Warrior Executor · GABRIEL_V4 · GOD.local · M2 Ultra 192GB @ 10.90.90.10</div>
    <div class="gabriel-ip">GOD.local @ 10.90.90.10 &nbsp;|&nbsp; DaFixer → 10.90.90.40 &nbsp;|&nbsp; Voice Bridge :8080 &nbsp;|&nbsp; DreamChamber :7777 &nbsp;|&nbsp; Ollama :11434</div>
    <div class="gabriel-doctrine">
      Military-calm. No hype. No flattery. Ships things — doesn't narrate about shipping things.
      Chain of command: Robert → Claude → GABRIEL → world.
      Every action either serves creator sovereignty or it doesn't belong here.
    </div>
  </div>
  <div class="gabriel-status-col">
    <div class="gabriel-badge checking" id="gabrielStatusBadge">⬤ CHECKING…</div>
    <div class="gabriel-badge" style="background:rgba(192,132,252,.1);color:var(--neon);border-color:rgba(192,132,252,.2)">GABRIEL_V4</div>
    <div class="gabriel-badge" style="background:rgba(251,191,36,.08);color:var(--gold);border-color:rgba(251,191,36,.2)">85/15 RSP_001</div>
    <div class="gabriel-badge" style="background:rgba(248,113,113,.08);color:#f87171;border-color:rgba(248,113,113,.2);font-size:8px" id="gabrielCountdown">${getCountdown()}</div>
  </div>
</div>`;
}

function renderMemoryCells() {
  const el = document.getElementById('gabrielCells');
  if (!el) return;
  const cells = [
    { id:'bridgeStatus',  title:'Voice Bridge',    value:'…',     sub:'GOD.local:8080',  pct:0 },
    { id:'ollamaStatus',  title:'Ollama / Gemma3', value:'…',     sub:'localhost:11434',  pct:0 },
    { id:'dreamStatus',   title:'DreamChamber',    value:'…',     sub:'localhost:7777',   pct:0 },
    { id:'gabrielTasks',  title:'Tasks Run',       value:'0',     sub:'this session',     pct:0 },
    { id:'gabrielUptime', title:'Uptime',          value:'0:00',  sub:'session clock',    pct:0 },
    { id:'mcpCount',      title:'MCP Servers',     value:'10',    sub:'registered',       pct:100 },
  ];
  el.innerHTML = cells.map(c => `
<div class="gabriel-cell">
  <div class="gabriel-cell-title">${c.title}</div>
  <div class="gabriel-cell-value" id="${c.id}">${c.value}</div>
  <div class="gabriel-cell-sub">${c.sub}</div>
  <div class="gabriel-cell-bar"><div class="gabriel-cell-fill" id="${c.id}Bar" style="width:${c.pct}%"></div></div>
</div>`).join('');
}

function renderGabrielLog() {
  const el = document.getElementById('gabrielLog');
  if (!el) return;
  el.innerHTML = BOOT_LOG.map(l =>
    `<div class="gl-line"><span class="gl-ts">${l.ts}</span><span class="gl-msg ${l.cls}">${l.msg}</span></div>`
  ).join('');
}

function renderStandingOrders() {
  const el = document.getElementById('gabrielOrders');
  if (!el) return;
  el.innerHTML = STANDING_ORDERS.map((o) => {
    const done = o.includes('✓');
    const warn = o.includes('pending') || o.includes('required') || o.includes('awaiting') || o.includes('not yet') || o.includes('activate') || o.includes('in progress');
    const cls = done ? 'color:var(--green)' : warn ? 'color:var(--gabriel-amber)' : 'color:var(--muted)';
    return `<div style="font-size:10px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.04);display:flex;gap:8px;align-items:flex-start">
      <span style="${cls};flex-shrink:0">${done ? '✓' : warn ? '⚠' : '·'}</span>
      <span style="${cls};line-height:1.4">${o}</span>
    </div>`;
  }).join('');
}

// ── HELPERS ────────────────────────────────────────────────────
function addGabrielLog(msg, cls) {
  const el = document.getElementById('gabrielLog');
  if (!el) return;
  const ts = new Date().toTimeString().substring(0,5);
  const div = document.createElement('div');
  div.className = 'gl-line';
  div.innerHTML = `<span class="gl-ts">${ts}</span><span class="gl-msg ${cls}">${msg}</span>`;
  el.insertBefore(div, el.firstChild);
  while (el.children.length > 30) el.removeChild(el.lastChild);
}

function updateCell(id, value, pct) {
  const el = document.getElementById(id);
  const bar = document.getElementById(id + 'Bar');
  if (el) {
    el.textContent = value;
    el.style.color = value === 'LIVE' ? 'var(--gabriel-primary)' : value === 'DOWN' ? 'var(--gabriel-red)' : '';
  }
  if (bar) bar.style.width = pct + '%';
}

function updateMetric(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function formatUptime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2,'0')}`;
}

// ── KEYBOARD ───────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  initGabriel();
  const input = document.getElementById('gabrielCmdInput');
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') sendGabrielCommand();
    });
  }
});
