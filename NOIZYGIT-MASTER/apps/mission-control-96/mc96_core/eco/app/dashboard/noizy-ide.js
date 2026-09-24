// NOIZY IDE — JavaScript Engine
// RSP_001 · DAZEFLOW 2026-03-27 · GABRIEL V4

const CFG = {
  gabriel: 'http://localhost:7777',
  bridge:  'http://localhost:8080',
  ollama:  'http://localhost:11434',
  consent: 'http://localhost:7778',
  synth:   'http://localhost:7780',
  codex:   'http://localhost:7782',
  ethics:  'http://localhost:7785',
  cfAcct:  '2446d788cc4280f5ea22a9948410c355',
  target:  new Date('2026-04-17T00:00:00-04:00'),
};

// ── NAVIGATION ─────────────────────────────────────────────
function navigate(screen) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.rlink').forEach(l => l.classList.remove('active'));
  const s = document.getElementById('screen-' + screen);
  if (s) s.classList.add('active');
  const l = document.querySelector(`[data-screen="${screen}"]`);
  if (l) l.classList.add('active');
}

// ── CLOCK + COUNTDOWN ──────────────────────────────────────
function tick() {
  const now = new Date();
  const el = document.getElementById('clock');
  if (el) el.textContent = now.toLocaleTimeString('en-CA', { hour:'2-digit', minute:'2-digit', second:'2-digit' });

  const diff = CFG.target - now;
  const cd = document.getElementById('countdown');
  if (cd && diff > 0) {
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    cd.textContent = `APR 17 — ${d}d ${h}h ${m}m`;
  }
  const ss = document.getElementById('ssSession');
  if (ss) ss.textContent = now.toISOString().split('T')[0];
}
setInterval(tick, 1000);
tick();

// ── STATUS CHECKS ──────────────────────────────────────────
const SERVICES = [
  { id: 'gabriel', url: CFG.gabriel + '/health',    name: 'GABRIEL V4' },
  { id: 'bridge',  url: CFG.bridge  + '/health',    name: 'Voice Bridge' },
  { id: 'ollama',  url: CFG.ollama  + '/api/tags',  name: 'Ollama' },
  { id: 'consent', url: CFG.consent + '/health',    name: 'Consent Oracle' },
  { id: 'synth',   url: CFG.synth   + '/health',    name: 'Synthesis Oracle' },
  { id: 'codex',   url: CFG.codex   + '/health',    name: 'Mutation Codex' },
];

async function checkServices() {
  for (const svc of SERVICES) {
    const dot = document.getElementById('dot-' + svc.id);
    const badge = document.getElementById('badge-' + svc.id);
    if (dot) dot.className = 'sys-dot checking';
    try {
      const r = await fetch(svc.url, { signal: AbortSignal.timeout(3000) });
      const ok = r.ok;
      if (dot) dot.className = 'sys-dot ' + (ok ? 'live' : 'down');
      if (badge) { badge.textContent = ok ? 'LIVE' : 'DOWN'; badge.className = 'sys-badge ' + (ok ? 'live' : 'down'); }
    } catch {
      if (dot) dot.className = 'sys-dot down';
      if (badge) { badge.textContent = 'DOWN'; badge.className = 'sys-badge down'; }
    }
  }
}
setInterval(checkServices, 30000);
checkServices();

// ── TURBO SCRIPTS ──────────────────────────────────────────
function output(msg) {
  const el = document.getElementById('rrOutput');
  if (!el) return;
  el.textContent = msg;
}

async function runTurbo(turbo, arg) {
  const label = arg ? `${turbo} ${arg}` : turbo;
  output(`⚡ Running ${label}…`);
  showModal(`Turbo ${label}`, `⚡ Running ${label}…\n\nAttempting: node ~/NOIZYLAB/noizybeast/turbo-scripts/noizybeast-turbo.js ${label}\n\n`);

  try {
    const res = await fetch(`${CFG.gabriel}/turbo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ turbo, arg, operator: 'RSP_001', source: 'noizy-ide' }),
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      const data = await res.json();
      const result = data.result || data.output || JSON.stringify(data, null, 2);
      appendModal(result);
      output(`✅ ${label} complete`);
    } else {
      appendModal(`⚠ GABRIEL returned ${res.status}\n\nGABRIEL offline — run locally:\nnode ~/NOIZYLAB/noizybeast/turbo-scripts/noizybeast-turbo.js ${turbo} ${arg||''}`);
      output(`⚠ GABRIEL offline — see modal`);
    }
  } catch {
    const fallback = localFallback(turbo, arg);
    appendModal(fallback);
    output(`⚠ Offline — showing local guide`);
  }
}

function promptTurbo(turbo, label) {
  const val = prompt(label);
  if (val) runTurbo(turbo, val);
}

function localFallback(turbo, arg) {
  const base = 'node ~/NOIZYLAB/noizybeast/turbo-scripts/noizybeast-turbo.js';
  const guides = {
    T1: `${base} T1 "${arg || 'your-intent'}"\n\nScaffolds full project structure with wrangler.toml, package.json, index.ts, and deploy manifest.`,
    T2: `${base} T2\n\nGenerates today's session doc with GABRIEL status, standing orders, and priority queue.`,
    T3: `${base} T3 ${arg || 'heaven17'}\n\nRuns wrangler dry-run → deploy → smoke test → returns live URL.\nFix auth first: bash ~/NOIZYLAB/noizybeast/turbo-scripts/fix-cryptotokenkit.sh`,
    T4: `${base} T4\n\nExtracts session knowledge → pushes to GABRIEL memcells.`,
    T5: `${base} T5 ${arg || 'voice-id'}\n\nReturns: consent status · allowed mutations · royalty rate · expiry.`,
    T6: `${base} T6 ${arg || 'asset-id'}\n\nReturns full mutation chain from raw input to final output.`,
    T7: `${base} T7 ${arg || 'voice-id'} "your text here"\n\nRuns: Whisper → XTTS-v2 → RVC → C2PA wrap → returns audio + confidence score.`,
    T8: `${base} T8 T2\n\nRuns any turbo at X1000 quality (tightened thresholds: spectral>0.90 emotional>0.88).`,
    T9: `${base} T9 "${arg || 'describe issue'}"\n\nDiagnoses → fixes → validates → reports.`,
    T10: `${base} T10\n\nGenerates session summary: what was built, decisions, queue, Plowman Chronicles entry.`,
  };
  return `⚠ GABRIEL offline — run locally:\n\n${guides[turbo] || base + ' ' + turbo}`;
}

// ── MODAL ──────────────────────────────────────────────────
function showModal(title, content) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalOutput').textContent = content;
  document.getElementById('modalOverlay').classList.add('open');
}
function appendModal(text) {
  const el = document.getElementById('modalOutput');
  if (el) el.textContent += '\n' + text;
}
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}
document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});

// ── RECOVERY BOARD DATA ────────────────────────────────────
const RECOVERY_ITEMS = [
  { name: 'HEAVEN17 Worker', type: 'Worker · TypeScript', class: 'keep', status: 'undeployed',
    body: 'Keystone deployment. Real code exists in repo but Hello World stub is live. Highest priority recovery.', urgency: 'CRITICAL',
    meta: ['keystone', 'CF Workers', 'stub-deployed'], rec: 'Deploy immediately via T3' },
  { name: 'Consent Architecture Blueprint', type: 'Doctrine · Slack', class: 'danger', status: 'danger',
    body: 'Located in Slack. Slack retention policy may purge permanently. Archive immediately.', urgency: 'CRITICAL',
    meta: ['rights', 'slack', 'retention-risk'], rec: 'Export from Slack NOW' },
  { name: 'Founder Blueprint', type: 'Doctrine · Google Drive', class: 'missing', status: 'missing',
    body: 'Referenced in MC96ECO_MASTER_OPERATIONS.docx as highest-value asset. Not yet recovered from indexed sources.', urgency: 'HIGH',
    meta: ['doctrine', 'google-drive', 'missing'], rec: 'Search Google Drive → Drive recovery' },
  { name: 'IP Catalog v2.0', type: 'Catalog · Location Unknown', class: 'missing', status: 'missing',
    body: 'Named in master operations doc. Contains rights inventory for all NOIZY IP. Not indexed.', urgency: 'HIGH',
    meta: ['rights', 'ip', 'missing'], rec: 'Search 34TB archive' },
  { name: 'Voice Archive', type: 'Media · Archive', class: 'keep', status: 'endangered',
    body: 'Primary voice recordings from RSP_001. 34TB archive. Crown jewel. Needs indexing and C2PA wrapping.', urgency: 'HIGH',
    meta: ['voice', 'crown-jewel', 'unindexed'], rec: 'Index → attach C2PA immediately' },
  { name: 'UniversalSearchInterface V1.5', type: 'App · Location Unknown', class: 'upgrade', status: 'missing',
    body: 'Referenced in Living Brain HTML. Likely the search layer for the empire. Recover and integrate.', urgency: 'MED',
    meta: ['app', 'missing', 'upgrade'], rec: 'Search NOIZYLAB repos' },
  { name: 'gabriel_db (20 HVS tables)', type: 'D1 Database · CONFIRMED', class: 'keep', status: 'canonical',
    body: 'CONFIRMED: hvs_voice_dna, hvs_consent_tokens, hvs_lineage, hvs_estates, provenance_records, royalty_events. 75/25 split live.', urgency: 'LOW',
    meta: ['d1', 'hvsdb', 'consent', 'royalty'], rec: 'Wire to Consent Oracle MCP' },
  { name: 'DreamChamber v1 (gabriel-v3.js)', type: 'Server · NOIZYLAB', class: 'upgrade', status: 'stale',
    body: 'Existing DreamChamber implementation at NOIZYLAB/dreamchamber. Upgrade to v2 with GABRIEL V4 routing.', urgency: 'HIGH',
    meta: ['server', 'upgrade', 'v2-needed'], rec: 'Upgrade to V4 architecture' },
  { name: 'deploy.sh / smoke_test.sh', type: 'Shell Scripts · NOIZYLAB', class: 'keep', status: 'canonical',
    body: 'Deploy and smoke test scripts. Bind to T3 Deploy Cannon.', urgency: 'LOW',
    meta: ['scripts', 'deploy', 'live'], rec: 'Wire to T3 Cannon' },
  { name: 'Gemma3 MCP Server', type: 'MCP Server · GOD.local', class: 'keep', status: 'live',
    body: 'Running on GOD.local:11434. 10 tools registered. Path fix applied (robplowman → m2ultra).', urgency: 'LOW',
    meta: ['mcp', 'ollama', 'live'], rec: 'Maintain' },
  { name: 'mc96-network MCP', type: 'MCP Server · EXISTS', class: 'keep', status: 'live',
    body: 'Already exists and running. Fourth MCP in the dream machine. Wire to synthesis pipeline.', urgency: 'LOW',
    meta: ['mcp', 'live', 'wire-needed'], rec: 'Wire to Synthesis Oracle' },
  { name: 'consent-oracle MCP', type: 'MCP Server · PLANNED', class: 'upgrade', status: 'missing',
    body: 'Wraps gabriel_db HVS tables. Exposes can_i_do() tool. First of 3 MCPs needed to complete the dream machine.', urgency: 'HIGH',
    meta: ['mcp', 'planned', 'dream-machine'], rec: 'Build next — wraps existing HVS tables' },
];

function renderRecovery(filter = 'all') {
  const board = document.getElementById('recoveryBoard');
  if (!board) return;
  const items = filter === 'all' ? RECOVERY_ITEMS : RECOVERY_ITEMS.filter(i => i.class === filter);
  board.innerHTML = items.map(item => `
    <div class="rec-card rc-${item.class}">
      <div class="rec-card-top">
        <div>
          <div class="rec-card-name">${item.name}</div>
          <div class="rec-card-type">${item.type}</div>
        </div>
        <span class="truth-chip ${item.status}">${item.status.toUpperCase()}</span>
      </div>
      <div class="rec-card-body">${item.body}</div>
      <div class="rec-card-meta">${item.meta.map(t => `<span class="truth-chip stale">${t}</span>`).join('')}</div>
      <div style="font-size:10px;color:var(--cyan);margin-bottom:10px">→ ${item.rec}</div>
      <div class="rec-card-actions">
        <button class="rca">Mark Canonical</button>
        <button class="rca">Archive</button>
        <button class="rca">Pin</button>
      </div>
    </div>`).join('');
}

function filterRecovery(f) {
  document.querySelectorAll('.rtab').forEach(t => t.classList.remove('active'));
  const tab = document.querySelector(`.rtab.${f}`) || document.querySelector('.rtab');
  if (tab) tab.classList.add('active');
  // Map filter names to class names
  const map = { all: 'all', keep: 'keep', merge: 'merge', upgrade: 'upgrade', kill: 'kill', missing: 'missing', danger: 'danger' };
  renderRecovery(map[f]);
}

// ── REPO DATA ──────────────────────────────────────────────
const REPOS = [
  { name: 'HEAVEN17',          purpose: 'Keystone Cloudflare Worker — Claude proxy, consent gate, voice routing. ALL downstream surfaces depend on this.', health: 30, color: '#ef4444', status: 'undeployed', branch: 'main', runtime: 'CF Workers', deploy: 'STUB ONLY' },
  { name: 'noizybeast',        purpose: 'NOIZYBEAST core — turbo scripts, CLAUDE.md, project registry, session brain.', health: 75, color: '#f59e0b', status: 'canonical', branch: 'main', runtime: 'Node.js', deploy: 'LOCAL' },
  { name: 'dreamchamber',      purpose: 'DreamChamber v1 server — GABRIEL v3 routes, WebSocket, multi-agent routing. Upgrading to V4.', health: 60, color: '#f59e0b', status: 'stale', branch: 'main', runtime: 'Node.js :7777', deploy: 'LOCAL' },
  { name: 'consent-gateway',   purpose: 'Cloudflare Worker — consent verification middleware. TypeScript. HVS tables integration.', health: 55, color: '#22d3ee', status: 'stale', branch: 'main', runtime: 'CF Workers', deploy: 'NOT DEPLOYED' },
  { name: 'mcp-gemma3',        purpose: 'Gemma3 MCP Server — 10 tools, Ollama backend, GOD.local:11434. Path fix applied.', health: 85, color: '#10b981', status: 'live', branch: 'main', runtime: 'Node.js :11434', deploy: 'LIVE' },
  { name: 'voice-pipeline',    purpose: 'Audio Hijack integration, recording stop scripts, voice routing logic.', health: 45, color: '#c084fc', status: 'stale', branch: 'main', runtime: 'Node.js', deploy: 'PARTIAL' },
  { name: 'MC96',              purpose: 'MC96 project — turbo-pro-upgrade, network scripts, production music tools.', health: 50, color: '#f97316', status: 'stale', branch: 'main', runtime: 'Node.js', deploy: 'LOCAL' },
  { name: 'workers',           purpose: 'CF Workers monorepo — multiple workers including consent-gateway.', health: 40, color: '#22d3ee', status: 'stale', branch: 'main', runtime: 'CF Workers', deploy: 'MIXED' },
];

function renderRepos() {
  const grid = document.getElementById('repoGrid');
  if (!grid) return;
  grid.innerHTML = REPOS.map(r => `
    <div class="repo-card">
      <div class="repo-accent" style="background:${r.color}"></div>
      <div class="repo-top">
        <div class="repo-name">${r.name}</div>
        <span class="truth-chip ${r.status}">${r.status.toUpperCase()}</span>
      </div>
      <div class="repo-purpose">${r.purpose}</div>
      <div class="repo-health">
        <span style="font-size:10px;color:var(--muted)">Health</span>
        <div class="rh-bar"><div class="rh-fill" style="width:${r.health}%;background:${r.color}"></div></div>
        <span class="rh-pct">${r.health}%</span>
      </div>
      <div class="repo-stats">
        <span class="repo-stat">⎇ ${r.branch}</span>
        <span class="repo-stat">${r.runtime}</span>
        <span class="repo-stat">${r.deploy}</span>
      </div>
      <div class="repo-actions">
        <button class="repo-btn primary" onclick="runTurbo('T3','${r.name.toLowerCase()}')">⚡ Deploy</button>
        <button class="repo-btn" onclick="runTurbo('T9','${r.name} health check')">🔧 Fix Canon</button>
        <button class="repo-btn">📋 README</button>
      </div>
    </div>`).join('');
}

// ── RITUALS DATA ───────────────────────────────────────────
const RITUALS = [
  { name: 'reset-keychains.sh', purpose: 'Universal Keychain & Token Reset. Fixes CRYPTOKENKITERROR-3, SSH agent hangs, and auth loops.',
    path: '~/NOIZYLAB/noizy-workers/scripts/reset-keychains.sh', cat: 'restore', danger: 1,
    tags: ['keychain', 'wrangler', 'github', 'ssh'], last: 'not run' },
  { name: 'fix-cryptotokenkit.sh', purpose: 'Fix macOS CryptoTokenKit Error -3. Clears broken wrangler keychain entry, restarts CTK daemon.',
    path: '~/NOIZYLAB/noizybeast/turbo-scripts/fix-cryptotokenkit.sh', cat: 'restore', danger: 0,
    tags: ['keychain', 'wrangler', 'auth'], last: 'not run' },
  { name: 'T3 Deploy Cannon', purpose: 'Validate → build → wrangler deploy → smoke test → return live URL. One command.',
    path: 'node turbo-scripts/noizybeast-turbo.js T3 [worker]', cat: 'deploy', danger: 1,
    tags: ['CF Workers', 'wrangler', 'smoke test'], last: 'not run' },
  { name: 'T2 Flow Sync', purpose: 'Generate daily session doc with timestamp, GABRIEL status, standing orders, priority queue.',
    path: 'node turbo-scripts/noizybeast-turbo.js T2', cat: 'restore', danger: 0,
    tags: ['session', 'context', 'GABRIEL'], last: 'not run' },
  { name: 'T9 Fix Canon', purpose: 'Diagnose any system issue → apply fix → validate → report. One command to resolution.',
    path: 'node turbo-scripts/noizybeast-turbo.js T9 "issue"', cat: 'validate', danger: 1,
    tags: ['diagnose', 'fix', 'validate'], last: 'not run' },
  { name: 'gcloud auth application-default login', purpose: 'Fix GKE MCP ADC credentials error. Sets Google Cloud Application Default Credentials.',
    path: 'gcloud auth application-default login', cat: 'restore', danger: 0,
    tags: ['gcloud', 'ADC', 'credentials', 'GKE'], last: 'not run' },
  { name: 'wrangler login', purpose: 'Authenticate Cloudflare CLI. Required before any worker deploy.',
    path: 'wrangler login', cat: 'restore', danger: 0,
    tags: ['cloudflare', 'auth', 'deploy-required'], last: 'not run' },
  { name: 'T4 Cell Burst', purpose: 'Extract session knowledge, decisions, and patterns → push to GABRIEL memcells before closing tab.',
    path: 'node turbo-scripts/noizybeast-turbo.js T4', cat: 'align', danger: 0,
    tags: ['memory', 'GABRIEL', 'knowledge'], last: 'not run' },
  { name: 'T10 Dream Capture', purpose: 'End-of-session: what was built, decisions, queue, Plowman Chronicles narrative entry.',
    path: 'node turbo-scripts/noizybeast-turbo.js T10', cat: 'align', danger: 0,
    tags: ['session', 'memory', 'chronicles'], last: 'not run' },
  { name: 'pm2 start ecosystem.config.cjs', purpose: 'Start all NOIZY services under PM2 process manager. Keeps Voice Bridge, GABRIEL, DreamChamber alive.',
    path: 'cd ~/NOIZYLAB && pm2 start ecosystem.config.cjs', cat: 'restore', danger: 1,
    tags: ['pm2', 'services', 'voice-bridge'], last: 'not run' },
  { name: 'GABRIEL_GOD_SETUP.sh', purpose: 'Full GOD.local workstation setup ritual. Installs deps, starts services, verifies all MCPs.',
    path: '~/NOIZYLAB/noizybeast/GABRIEL_GOD_SETUP.sh', cat: 'restore', danger: 2,
    tags: ['setup', 'workstation', 'full-reset'], last: 'not run' },
];

function renderRituals(filter = 'all') {
  const grid = document.getElementById('ritualsGrid');
  if (!grid) return;
  const items = filter === 'all' ? RITUALS : RITUALS.filter(r => r.cat === filter);
  grid.innerHTML = items.map(r => `
    <div class="ritual-card ${r.danger >= 2 ? 'danger' : ''}">
      <div class="ritual-top">
        <div class="ritual-name">${r.name}</div>
        ${r.danger === 2 ? '<span class="truth-chip danger">⚠ DANGER</span>' : r.danger === 1 ? '<span class="truth-chip stale">CAUTION</span>' : '<span class="truth-chip live">SAFE</span>'}
      </div>
      <div class="ritual-purpose">${r.purpose}</div>
      <div class="ritual-path">${r.path}</div>
      <div class="ritual-meta">${r.tags.map(t => `<span class="ritual-tag">${t}</span>`).join('')}</div>
      <div class="ritual-actions">
        <button class="ritual-btn run" onclick="runRitual('${r.name}', '${r.path}')">▶ Run</button>
        <button class="ritual-btn" onclick="copyToClipboard('${r.path}')">📋 Copy</button>
      </div>
    </div>`).join('');
}

function filterRituals(f) {
  document.querySelectorAll('.rcat').forEach(c => c.classList.remove('active'));
  document.querySelector(`.rcat.${f}`) || document.querySelector('.rcat');
  renderRituals(f === 'all' ? 'all' : f);
}

function runRitual(name, path) {
  showModal(`Ritual: ${name}`, `▶ Running ritual: ${name}\n\nCommand:\n${path}\n\nThis would execute via GABRIEL. GABRIEL offline — copy & run in terminal.\n\n📋 Click Copy in the ritual card to copy the command.`);
}

function copyToClipboard(text) {
  navigator.clipboard?.writeText(text).then(() => {
    output(`📋 Copied: ${text.substring(0, 40)}…`);
  });
}

// ── AGENTS DATA ────────────────────────────────────────────
function renderAgents() {
  const grid = document.getElementById('agentsGrid');
  if (!grid) return;
  const agents = [
    { name: 'GABRIEL', role: 'Warrior Executor · Runtime Enforcer', icon: '⚡', color: '#10b981', status: 'CHECKING', addr: ':7777' },
    { name: 'Claude Max', role: 'Strategy · Legal · Long-form · Architecture', icon: '✦', color: '#c084fc', status: 'ACTIVE', addr: 'Anthropic API' },
    { name: 'Claude Code', role: 'Build · Deploy · CF Workers · APIs', icon: '⌨', color: '#22d3ee', status: 'ACTIVE', addr: 'Antigravity IDE' },
    { name: 'Claude Coworker', role: 'Crew Coordination · Task Routing · Teams', icon: '⚙', color: '#818cf8', status: 'ROUTING', addr: 'Teams Channels' },
    { name: 'SHIRL', role: 'Planned — Creative Production Agent', icon: '🎨', color: '#f59e0b', status: 'PLANNED', addr: 'TBD' },
    { name: 'POPS / ENGR', role: 'Planned — Engineering + Domain Agents', icon: '🔧', color: '#64748b', status: 'PLANNED', addr: 'TBD' },
  ];
  grid.innerHTML = agents.map(a => `
    <div class="agent-card">
      <div class="agent-avatar" style="border-color:${a.color};background:${a.color}18">
        <span style="color:${a.color}">${a.icon}</span>
      </div>
      <div class="agent-name" style="color:${a.color}">${a.name}</div>
      <div class="agent-role">${a.role}</div>
      <div class="agent-status"><span class="truth-chip ${a.status.toLowerCase() === 'active' ? 'live' : a.status.toLowerCase() === 'planned' ? 'missing' : 'stale'}">${a.status}</span></div>
      <div style="font-size:9px;color:var(--muted);margin-bottom:10px;font-family:var(--mono)">${a.addr}</div>
      <button class="agent-btn" onclick="runTurbo('T9','route task to ${a.name}')">Route Task →</button>
    </div>`).join('');
}

// ── QUICK SEARCH ───────────────────────────────────────────
function quickSearch(val) {
  if (!val || val.length < 2) return;
  const all = [...RECOVERY_ITEMS, ...REPOS, ...RITUALS];
  const hits = all.filter(i => (i.name + ' ' + (i.purpose || i.body || '')).toLowerCase().includes(val.toLowerCase()));
  const out = document.getElementById('rrOutput');
  if (out) out.textContent = hits.length ? hits.map(h => `→ ${h.name}`).join('\n') : 'No results';
}

// ── SESSION MODE ───────────────────────────────────────────
function setMode(mode) {
  document.querySelectorAll('.smode').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.smode').forEach(b => { if (b.textContent.toLowerCase() === mode) b.classList.add('active'); });
  const actions = { open: 'T2', build: 'T1', review: 'T5', close: 'T10' };
  if (actions[mode]) output(`Session mode: ${mode.toUpperCase()} — suggested: ${actions[mode]}`);
}

// ── EMERGENCY STOP ─────────────────────────────────────────
function emergencyStop() {
  if (!confirm('EMERGENCY STOP — halt all GABRIEL agents and synthesis pipelines?')) return;
  fetch(CFG.gabriel + '/stop', { method: 'POST' }).catch(() => {});
  output('🛑 Emergency stop signal sent to GABRIEL :7777');
  showModal('Emergency Stop', '🛑 Emergency stop signal sent.\n\nAll GABRIEL agents instructed to halt.\nAll active synthesis suspended.\n\nIf GABRIEL is offline, manually stop:\n  pm2 stop all\n  pkill -f "noizybeast"');
}

// ── RECOVERY TABS FIX ──────────────────────────────────────
document.querySelectorAll('.rtab').forEach(tab => {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.rtab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
  });
});

// ── INIT ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderRecovery();
  renderRepos();
  renderRituals();
  renderAgents();
});
    color: "#10b981",
    status: "live",
    branch: "main",
    runtime: "Node.js :11434",
    deploy: "LIVE",
  },
  {
    name: "voice-pipeline",
    purpose:
      "Audio Hijack integration, recording stop scripts, voice routing logic.",
    health: 45,
    color: "#c084fc",
    status: "stale",
    branch: "main",
    runtime: "Node.js",
    deploy: "PARTIAL",
  },
  {
    name: "MC96",
    purpose:
      "MC96 project — turbo-pro-upgrade, network scripts, production music tools.",
    health: 50,
    color: "#f97316",
    status: "stale",
    branch: "main",
    runtime: "Node.js",
    deploy: "LOCAL",
  },
  {
    name: "workers",
    purpose:
      "CF Workers monorepo — multiple workers including consent-gateway.",
    health: 40,
    color: "#22d3ee",
    status: "stale",
    branch: "main",
    runtime: "CF Workers",
    deploy: "MIXED",
  },
];

function renderRepos() {
  const grid = document.getElementById("repoGrid");
  if (!grid) return;
  grid.innerHTML = REPOS.map(
    (r) => `
    <div class="repo-card">
      <div class="repo-accent" style="background:${r.color}"></div>
      <div class="repo-top">
        <div class="repo-name">${r.name}</div>
        <span class="truth-chip ${r.status}">${r.status.toUpperCase()}</span>
      </div>
      <div class="repo-purpose">${r.purpose}</div>
      <div class="repo-health">
        <span style="font-size:10px;color:var(--muted)">Health</span>
        <div class="rh-bar"><div class="rh-fill" style="width:${r.health}%;background:${r.color}"></div></div>
        <span class="rh-pct">${r.health}%</span>
      </div>
      <div class="repo-stats">
        <span class="repo-stat">⎇ ${r.branch}</span>
        <span class="repo-stat">${r.runtime}</span>
        <span class="repo-stat">${r.deploy}</span>
      </div>
      <div class="repo-actions">
        <button class="repo-btn primary" onclick="runTurbo('T3','${r.name.toLowerCase()}')">⚡ Deploy</button>
        <button class="repo-btn" onclick="runTurbo('T9','${r.name} health check')">🔧 Fix Canon</button>
        <button class="repo-btn">📋 README</button>
      </div>
    </div>`,
  ).join("");
}

// ── RITUALS DATA ───────────────────────────────────────────
const RITUALS = [
  {
    name: "reset-keychains.sh",
    purpose:
      "Universal Keychain & Token Reset. Fixes CRYPTOKENKITERROR-3, SSH agent hangs, and auth loops.",
    path: "~/NOIZYLAB/noizy-workers/scripts/reset-keychains.sh",
    cat: "restore",
    danger: 1,
    tags: ["keychain", "wrangler", "github", "ssh"],
    last: "not run",
  },
  {
    name: "fix-cryptotokenkit.sh",
    purpose:
      "Fix macOS CryptoTokenKit Error -3. Clears broken wrangler keychain entry, restarts CTK daemon.",
    path: "~/NOIZYLAB/noizybeast/turbo-scripts/fix-cryptotokenkit.sh",
    cat: "restore",
    danger: 0,
    tags: ["keychain", "wrangler", "auth"],
    last: "not run",
  },
  {
    name: "T3 Deploy Cannon",
    purpose:
      "Validate → build → wrangler deploy → smoke test → return live URL. One command.",
    path: "node turbo-scripts/noizybeast-turbo.js T3 [worker]",
    cat: "deploy",
    danger: 1,
    tags: ["CF Workers", "wrangler", "smoke test"],
    last: "not run",
  },
  {
    name: "T2 Flow Sync",
    purpose:
      "Generate daily session doc with timestamp, GABRIEL status, standing orders, priority queue.",
    path: "node turbo-scripts/noizybeast-turbo.js T2",
    cat: "restore",
    danger: 0,
    tags: ["session", "context", "GABRIEL"],
    last: "not run",
  },
  {
    name: "T9 Fix Canon",
    purpose:
      "Diagnose any system issue → apply fix → validate → report. One command to resolution.",
    path: 'node turbo-scripts/noizybeast-turbo.js T9 "issue"',
    cat: "validate",
    danger: 1,
    tags: ["diagnose", "fix", "validate"],
    last: "not run",
  },
  {
    name: "gcloud auth application-default login",
    purpose:
      "Fix GKE MCP ADC credentials error. Sets Google Cloud Application Default Credentials.",
    path: "gcloud auth application-default login",
    cat: "restore",
    danger: 0,
    tags: ["gcloud", "ADC", "credentials", "GKE"],
    last: "not run",
  },
  {
    name: "wrangler login",
    purpose: "Authenticate Cloudflare CLI. Required before any worker deploy.",
    path: "wrangler login",
    cat: "restore",
    danger: 0,
    tags: ["cloudflare", "auth", "deploy-required"],
    last: "not run",
  },
  {
    name: "T4 Cell Burst",
    purpose:
      "Extract session knowledge, decisions, and patterns → push to GABRIEL memcells before closing tab.",
    path: "node turbo-scripts/noizybeast-turbo.js T4",
    cat: "align",
    danger: 0,
    tags: ["memory", "GABRIEL", "knowledge"],
    last: "not run",
  },
  {
    name: "T10 Dream Capture",
    purpose:
      "End-of-session: what was built, decisions, queue, Plowman Chronicles narrative entry.",
    path: "node turbo-scripts/noizybeast-turbo.js T10",
    cat: "align",
    danger: 0,
    tags: ["session", "memory", "chronicles"],
    last: "not run",
  },
  {
    name: "pm2 start ecosystem.config.cjs",
    purpose:
      "Start all NOIZY services under PM2 process manager. Keeps Voice Bridge, GABRIEL, DreamChamber alive.",
    path: "cd ~/NOIZYLAB && pm2 start ecosystem.config.cjs",
    cat: "restore",
    danger: 1,
    tags: ["pm2", "services", "voice-bridge"],
    last: "not run",
  },
  {
    name: "GABRIEL_GOD_SETUP.sh",
    purpose:
      "Full GOD.local workstation setup ritual. Installs deps, starts services, verifies all MCPs.",
    path: "~/NOIZYLAB/noizybeast/GABRIEL_GOD_SETUP.sh",
    cat: "restore",
    danger: 2,
    tags: ["setup", "workstation", "full-reset"],
    last: "not run",
  },
];

function renderRituals(filter = "all") {
  const grid = document.getElementById("ritualsGrid");
  if (!grid) return;
  const items =
    filter === "all" ? RITUALS : RITUALS.filter((r) => r.cat === filter);
  grid.innerHTML = items
    .map(
      (r) => `
    <div class="ritual-card ${r.danger >= 2 ? "danger" : ""}">
      <div class="ritual-top">
        <div class="ritual-name">${r.name}</div>
        ${r.danger === 2 ? '<span class="truth-chip danger">⚠ DANGER</span>' : r.danger === 1 ? '<span class="truth-chip stale">CAUTION</span>' : '<span class="truth-chip live">SAFE</span>'}
      </div>
      <div class="ritual-purpose">${r.purpose}</div>
      <div class="ritual-path">${r.path}</div>
      <div class="ritual-meta">${r.tags.map((t) => `<span class="ritual-tag">${t}</span>`).join("")}</div>
      <div class="ritual-actions">
        <button class="ritual-btn run" onclick="runRitual('${r.name}', '${r.path}')">▶ Run</button>
        <button class="ritual-btn" onclick="copyToClipboard('${r.path}')">📋 Copy</button>
      </div>
    </div>`,
    )
    .join("");
}

function filterRituals(f) {
  document
    .querySelectorAll(".rcat")
    .forEach((c) => c.classList.remove("active"));
  document.querySelector(`.rcat.${f}`) || document.querySelector(".rcat");
  renderRituals(f === "all" ? "all" : f);
}

function runRitual(name, path) {
  showModal(
    `Ritual: ${name}`,
    `▶ Running ritual: ${name}\n\nCommand:\n${path}\n\nThis would execute via GABRIEL. GABRIEL offline — copy & run in terminal.\n\n📋 Click Copy in the ritual card to copy the command.`,
  );
}

function copyToClipboard(text) {
  navigator.clipboard?.writeText(text).then(() => {
    output(`📋 Copied: ${text.substring(0, 40)}…`);
  });
}

// ── AGENTS DATA ────────────────────────────────────────────
function renderAgents() {
  const grid = document.getElementById("agentsGrid");
  if (!grid) return;
  const agents = [
    {
      name: "GABRIEL",
      role: "Warrior Executor · Runtime Enforcer",
      icon: "⚡",
      color: "#10b981",
      status: "CHECKING",
      addr: ":7777",
    },
    {
      name: "Claude Max",
      role: "Strategy · Legal · Long-form · Architecture",
      icon: "✦",
      color: "#c084fc",
      status: "ACTIVE",
      addr: "Anthropic API",
    },
    {
      name: "Claude Code",
      role: "Build · Deploy · CF Workers · APIs",
      icon: "⌨",
      color: "#22d3ee",
      status: "ACTIVE",
      addr: "Antigravity IDE",
    },
    {
      name: "Claude Coworker",
      role: "Crew Coordination · Task Routing · Teams",
      icon: "⚙",
      color: "#818cf8",
      status: "ROUTING",
      addr: "Teams Channels",
    },
    {
      name: "SHIRL",
      role: "Planned — Creative Production Agent",
      icon: "🎨",
      color: "#f59e0b",
      status: "PLANNED",
      addr: "TBD",
    },
    {
      name: "POPS / ENGR",
      role: "Planned — Engineering + Domain Agents",
      icon: "🔧",
      color: "#64748b",
      status: "PLANNED",
      addr: "TBD",
    },
  ];
  grid.innerHTML = agents
    .map(
      (a) => `
    <div class="agent-card">
      <div class="agent-avatar" style="border-color:${a.color};background:${a.color}18">
        <span style="color:${a.color}">${a.icon}</span>
      </div>
      <div class="agent-name" style="color:${a.color}">${a.name}</div>
      <div class="agent-role">${a.role}</div>
      <div class="agent-status"><span class="truth-chip ${a.status.toLowerCase() === "active" ? "live" : a.status.toLowerCase() === "planned" ? "missing" : "stale"}">${a.status}</span></div>
      <div style="font-size:9px;color:var(--muted);margin-bottom:10px;font-family:var(--mono)">${a.addr}</div>
      <button class="agent-btn" onclick="runTurbo('T9','route task to ${a.name}')">Route Task →</button>
    </div>`,
    )
    .join("");
}

// ── QUICK SEARCH ───────────────────────────────────────────
function quickSearch(val) {
  if (!val || val.length < 2) return;
  const all = [...RECOVERY_ITEMS, ...REPOS, ...RITUALS];
  const hits = all.filter((i) =>
    (i.name + " " + (i.purpose || i.body || ""))
      .toLowerCase()
      .includes(val.toLowerCase()),
  );
  const out = document.getElementById("rrOutput");
  if (out)
    out.textContent = hits.length
      ? hits.map((h) => `→ ${h.name}`).join("\n")
      : "No results";
}

// ── SESSION MODE ───────────────────────────────────────────
function setMode(mode) {
  document
    .querySelectorAll(".smode")
    .forEach((b) => b.classList.remove("active"));
  document.querySelectorAll(".smode").forEach((b) => {
    if (b.textContent.toLowerCase() === mode) b.classList.add("active");
  });
  const actions = { open: "T2", build: "T1", review: "T5", close: "T10" };
  if (actions[mode])
    output(`Session mode: ${mode.toUpperCase()} — suggested: ${actions[mode]}`);
}

// ── EMERGENCY STOP ─────────────────────────────────────────
function emergencyStop() {
  if (
    !confirm(
      "EMERGENCY STOP — halt all GABRIEL agents and synthesis pipelines?",
    )
  )
    return;
  fetch(CFG.gabriel + "/stop", { method: "POST" }).catch(() => {});
  output("🛑 Emergency stop signal sent to GABRIEL :7777");
  showModal(
    "Emergency Stop",
    '🛑 Emergency stop signal sent.\n\nAll GABRIEL agents instructed to halt.\nAll active synthesis suspended.\n\nIf GABRIEL is offline, manually stop:\n  pm2 stop all\n  pkill -f "noizybeast"',
  );
}

// ── RECOVERY TABS FIX ──────────────────────────────────────
document.querySelectorAll(".rtab").forEach((tab) => {
  tab.addEventListener("click", function () {
    document
      .querySelectorAll(".rtab")
      .forEach((t) => t.classList.remove("active"));
    this.classList.add("active");
  });
});

// ── INIT ───────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  renderRecovery();
  renderRepos();
  renderRituals();
  renderAgents();
});
