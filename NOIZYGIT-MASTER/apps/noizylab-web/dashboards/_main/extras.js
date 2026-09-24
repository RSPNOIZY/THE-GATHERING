// NOIZY.AI Dashboard Extras — Activity Feed, Deploy Panel, Charts, Terminal

const ACCOUNT_ID = '5f36aa9795348ea681d0b21910dfc82a';
const GITHUB_ORG = 'NOIZY.AI Enterprise';
const GITHUB_RULE = 'All personal repos → ARCHIVE/ inside NOIZY.AI Enterprise';

// ── ACTIVITY FEED ──────────────────────────────────────────
const feedEvents = [
  { icon:'✅', msg:'GitHub restructure complete — personal repos → <strong>ARCHIVE/</strong> inside NOIZY.AI Enterprise', tag:'build', time:'just now' },
  { icon:'🔒', msg:'GitHub org: <strong>NOIZY.AI Enterprise only</strong> — no public repos', tag:'build', time:'1m ago' },
  { icon:'⚡', msg:'Cloudflare Worker <strong>claude-proxy</strong> ready to deploy', tag:'cf', time:'2m ago' },
  { icon:'🎙️', msg:'Logitech USB mic detected — Voice Command active', tag:'voice', time:'3m ago' },
  { icon:'⌨️', msg:'Claude Code: <strong>noizy-workers</strong> project scaffolded', tag:'build', time:'4m ago' },
  { icon:'🌙', msg:'Dream Chamber crew initialized — 6 members online', tag:'crew', time:'5m ago' },
  { icon:'🗄️', msg:'D1 schema ready: <strong>noizy-royalty-db</strong>', tag:'cf', time:'6m ago' },
  { icon:'☁️', msg:'Account ID <code>5ba03939…</code> locked into Config', tag:'cf', time:'7m ago' },
];

function renderFeed() {
  const el = document.getElementById('activityFeed');
  if (!el) return;
  el.innerHTML = '';
  feedEvents.forEach(e => {
    const div = document.createElement('div');
    div.className = 'feed-item';
    div.innerHTML = `<div class="fi-icon">${e.icon}</div><div class="fi-body"><div class="fi-msg">${e.msg}<span class="fi-tag ${e.tag}">${e.tag.toUpperCase()}</span></div><div class="fi-time">${e.time}</div></div>`;
    el.appendChild(div);
  });
}

function addFeedEvent(icon, msg, tag) {
  feedEvents.unshift({ icon, msg, tag, time: 'just now' });
  feedEvents.forEach((e, i) => { if (i > 0) e.time = `${i}m ago`; });
  renderFeed();
}

// ── DEPLOY PANEL ───────────────────────────────────────────
const workers = [
  { icon:'🤖', name:'claude-proxy-worker', desc:'Claude API proxy · rate limit · D1 logging', status:'ready' },
  { icon:'🎙️', name:'voice-consent-worker', desc:'Consent gate · audit trail · No Fakes Act', status:'ready' },
  { icon:'💰', name:'royalty-tracker-worker', desc:'Royalty records → D1 → Stripe webhook', status:'planned' },
  { icon:'📊', name:'analytics-ingest-worker', desc:'CF Analytics Engine ingest · real-time events', status:'planned' },
];

function renderDeploy() {
  const el = document.getElementById('deployList');
  if (!el) return;
  el.innerHTML = '';
  workers.forEach(w => {
    const div = document.createElement('div');
    div.className = 'deploy-item';
    const btnClass = w.status === 'ready' ? 'deploy' : (w.status === 'done' ? 'done' : 'plan');
    const btnText = w.status === 'ready' ? '⚡ DEPLOY' : (w.status === 'done' ? '✅ LIVE' : '⏳ PLANNED');
    div.innerHTML = `<div class="di-icon">${w.icon}</div><div class="di-info"><div class="di-name">${w.name}</div><div class="di-desc">${w.desc}</div></div><button class="di-btn ${btnClass}" onclick="deployWorker('${w.name}',this)">${btnText}</button>`;
    el.appendChild(div);
  });
}

function deployWorker(name, btn) {
  if (btn.classList.contains('plan') || btn.classList.contains('done')) return;
  btn.textContent = '⏳ DEPLOYING…';
  btn.disabled = true;
  addFeedEvent('⚡', `Deploying <strong>${name}</strong> to Cloudflare…`, 'cf');
  termPrint(`$ wrangler deploy --name ${name}`, 'info');
  termPrint(`⚡ Uploading… account: ${ACCOUNT_ID}`, '');
  setTimeout(() => {
    termPrint(`✅ Deployed: https://${name}.noizy.workers.dev`, '');
    btn.className = 'di-btn done';
    btn.textContent = '✅ LIVE';
    btn.disabled = false;
    addFeedEvent('✅', `<strong>${name}</strong> is now LIVE on Cloudflare edge`, 'cf');
  }, 2500);
}

// ── MINI CHARTS ────────────────────────────────────────────
function renderCharts() {
  const cfData = [30,55,40,70,85,60,90];
  const voiceData = [10,20,15,40,35,50,45];
  const crewData = [80,60,90,70,95,85,100];
  renderBar('chartCF', cfData, 'neon');
  renderBar('chartVoice', voiceData, 'cyan');
  renderBar('chartCrew', crewData, 'gold');
}

function renderBar(id, data, cls) {
  const el = document.getElementById(id);
  if (!el) return;
  const max = Math.max(...data);
  el.innerHTML = data.map(v =>
    `<div class="bar ${cls}" style="height:${Math.round((v/max)*100)}%"></div>`
  ).join('');
}

// ── TERMINAL ───────────────────────────────────────────────
const termLines = [
  { text: '⛅  NOIZY.AI Cloudflare Worker CLI — Wrangler 4.53.0', cls: 'info' },
  { text: '─────────────────────────────────────────────', cls: 'dim' },
  { text: `✓  CF Account: ${ACCOUNT_ID}`, cls: '' },
  { text: '✓  Workers project: noizy-claude-proxy', cls: '' },
  { text: '✓  D1 schema: noizy-royalty-db [READY]', cls: '' },
  { text: '✓  R2 bucket: noizy-voice-library [READY]', cls: '' },
  { text: '─────────────────────────────────────────────', cls: 'dim' },
  { text: '✓  GitHub: NOIZY.AI Enterprise org [ACTIVE]', cls: '' },
  { text: '✓  Personal repos → ARCHIVE/ folder [DONE]', cls: '' },
  { text: '✓  No public repos — Enterprise-only policy enforced', cls: '' },
  { text: '─────────────────────────────────────────────', cls: 'dim' },
  { text: '⚠  wrangler login required before deploy', cls: 'warn' },
  { text: '→  Run: wrangler login (browser will open)', cls: 'dim' },
];

function renderTerminal() {
  const el = document.getElementById('termOutput');
  if (!el) return;
  el.innerHTML = termLines.map(l =>
    `<div class="term-line ${l.cls}">${l.text}</div>`
  ).join('') + '<span class="term-cursor"></span>';
  el.scrollTop = el.scrollHeight;
}

function termPrint(text, cls) {
  termLines.push({ text, cls: cls || '' });
  renderTerminal();
}

// ── GITHUB STATUS ──────────────────────────────────────────
function renderGitStatus() {
  const el = document.getElementById('gitStatus');
  if (!el) return;
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:14px;padding:14px 18px;border-radius:12px;background:rgba(52,211,153,.04);border:1px solid rgba(52,211,153,.25)">
      <span style="font-size:24px">✅</span>
      <div style="flex:1">
        <div style="font-size:12px;font-weight:700;color:var(--green)">GitHub — Enterprise Org Active · Restructure Complete</div>
        <div style="font-size:10px;color:var(--muted);margin-top:3px;line-height:1.5">
          All personal repos moved to <strong style="color:var(--green)">ARCHIVE/</strong> inside <strong style="color:var(--green)">NOIZY.AI Enterprise</strong>.
          No public repos. No personal GitHub accounts for NOIZY work. Enterprise org is the single source of truth.
        </div>
      </div>
      <div style="display:flex;gap:6px;flex-direction:column;align-items:flex-end">
        <div style="font-size:9px;padding:3px 8px;border-radius:5px;background:rgba(52,211,153,.15);color:var(--green);border:1px solid rgba(52,211,153,.25);letter-spacing:1px;white-space:nowrap">ENTERPRISE ✓</div>
        <div style="font-size:9px;padding:3px 8px;border-radius:5px;background:rgba(52,211,153,.15);color:var(--green);border:1px solid rgba(52,211,153,.25);letter-spacing:1px;white-space:nowrap">ARCHIVE/ ✓</div>
      </div>
    </div>`;
}

// ── INIT ───────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  renderFeed();
  renderDeploy();
  renderCharts();
  renderTerminal();
  renderGitStatus();

  // Simulate live activity
  setInterval(() => {
    const events = [
      { icon:'📡', msg:'CF edge health check — all nodes nominal', tag:'cf' },
      { icon:'🎙️', msg:'Voice input signal detected — routing to crew', tag:'voice' },
      { icon:'✦', msg:'Claude Max processing long-form strategy request', tag:'crew' },
      { icon:'⌨️', msg:'Claude Code: Worker build in progress', tag:'build' },
      { icon:'💰', msg:'Royalty record queued in D1', tag:'cf' },
    ];
    const e = events[Math.floor(Math.random() * events.length)];
    addFeedEvent(e.icon, e.msg, e.tag);
  }, 8000);
});
