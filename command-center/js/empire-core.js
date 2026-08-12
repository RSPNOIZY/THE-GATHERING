/**
 * ═══════════════════════════════════════════════════════════════
 * NOIZY EMPIRE COMMAND CENTER — Core Engine
 * Loads empire-registry.json and renders all 11 panels
 * ═══════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  let REGISTRY = null;

  // ── Bootstrap ──
  async function boot() {
    try {
      const res = await fetch('empire-registry.json');
      REGISTRY = await res.json();
    } catch (e) {
      console.error('Failed to load empire registry:', e);
      document.querySelector('.empire-content').innerHTML =
        '<div class="covenant-block"><h3>Registry Load Failed</h3><p>Could not load empire-registry.json</p></div>';
      return;
    }

    document.getElementById('version-tag').textContent = 'v' + REGISTRY.version;
    document.getElementById('machine-tag').textContent = REGISTRY.machine;

    renderOverview();
    renderBrands();
    renderAgents();
    renderHeaven();
    renderInfrastructure();
    renderTools();
    renderDreamChamber();
    renderProjects();
    renderBridge();
    renderSchemas();
    renderRoadmap();

    setupNav();
    setupSearch();
  }

  // ── Navigation ──
  function setupNav() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const panel = document.getElementById('panel-' + tab.dataset.panel);
        if (panel) panel.classList.add('active');
      });
    });
  }

  // ── Search ──
  function setupSearch() {
    const input = document.getElementById('global-search');
    input.addEventListener('input', () => {
      const q = input.value.toLowerCase().trim();
      if (!q) {
        document.querySelectorAll('.card, .service-row, .tool-item, .checklist-item, .never-clause').forEach(el => {
          el.style.display = '';
        });
        return;
      }
      document.querySelectorAll('.card, .service-row, .tool-item, .checklist-item, .never-clause').forEach(el => {
        const text = el.textContent.toLowerCase();
        el.style.display = text.includes(q) ? '' : 'none';
      });
    });
  }

  // ── Helpers ──
  function badge(status) {
    const map = {
      active: 'badge-active', building: 'badge-building', planned: 'badge-planned',
      offline: 'badge-offline', staging: 'badge-staging', archive: 'badge-archive',
      stub: 'badge-archive'
    };
    return `<span class="badge ${map[status] || 'badge-archive'}">${status}</span>`;
  }

  function tag(text, cls) {
    return `<span class="tag ${cls || ''}">${text}</span>`;
  }

  // ═══ OVERVIEW ═══
  function renderOverview() {
    const stats = [
      { value: REGISTRY.brands.length, label: 'Brands' },
      { value: REGISTRY.agents.length, label: 'Agents' },
      { value: REGISTRY.services.length, label: 'Services' },
      { value: Object.values(REGISTRY.tools).flat().length, label: 'Tools' },
      { value: REGISTRY.cloudflare.workers.length, label: 'Workers' },
      { value: REGISTRY.database_schemas.length, label: 'DB Schemas' },
      { value: REGISTRY.projects.length, label: 'Projects' },
      { value: REGISTRY.unified_bridge_modules.length, label: 'Bridge Modules' }
    ];

    document.getElementById('stats-overview').innerHTML = stats.map(s => `
      <div class="stat-card">
        <div class="stat-value">${s.value}</div>
        <div class="stat-label">${s.label}</div>
      </div>
    `).join('');

    // Brand summary cards
    document.getElementById('overview-brands').innerHTML = REGISTRY.brands.map(b => `
      <div class="card">
        <div class="card-header">
          <span class="card-title">${b.name}</span>
          ${badge(b.status)}
        </div>
        <div class="card-body">${b.description}</div>
        <div class="card-footer">
          ${b.domain ? tag(b.domain, 'tag-gold') : ''}
          ${b.owner_agent ? tag('⤷ ' + b.owner_agent, 'tag-purple') : ''}
          ${b.port ? tag(':' + b.port) : ''}
        </div>
      </div>
    `).join('');

    // Never Clauses
    const neverClauses = [
      'NEVER synthesize a voice without a valid, non-expired NCP consent token',
      'NEVER allow consent token transfer between actors',
      'NEVER process synthesis after Kill Switch activation without re-consent',
      'NEVER store biometric voice data without explicit storage consent',
      'NEVER use a voice for commercial purposes without commercial scope in token',
      'NEVER exceed the territorial scope defined in the consent token',
      'NEVER retain synthesis outputs beyond the license term without archival consent',
      'NEVER allow royalty modification after ledger append (ledger is immutable)',
      'NEVER expose Voice DNA biometric data via public endpoints'
    ];

    document.getElementById('never-clauses-list').innerHTML = neverClauses.map((clause, i) => `
      <div class="never-clause">
        <span class="nc-id">NC-${i + 1}</span>
        <span class="nc-text">${clause}</span>
      </div>
    `).join('');
  }

  // ═══ BRANDS ═══
  function renderBrands() {
    document.getElementById('brand-count').textContent = REGISTRY.brands.length;
    document.getElementById('brands-grid').innerHTML = REGISTRY.brands.map(b => `
      <div class="card">
        <div class="card-header">
          <div>
            <span class="card-title">${b.name}</span>
            ${b.domain ? `<div class="card-subtitle">${b.domain}</div>` : ''}
          </div>
          ${badge(b.status)}
        </div>
        <div class="card-body">
          <p>${b.description}</p>
          ${b.master_doc ? `<p class="mt-lg" style="font-size: 0.75rem;"><span class="text-muted">Master doc:</span> <span class="mono text-purple">${b.master_doc}</span></p>` : ''}
          ${b.stack ? `<p style="font-size: 0.75rem;"><span class="text-muted">Stack:</span> <span class="mono">${b.stack}</span></p>` : ''}
          ${b.local_path ? `<p style="font-size: 0.75rem;"><span class="text-muted">Path:</span> <span class="mono">${b.local_path}</span></p>` : ''}
        </div>
        <div class="card-footer">
          ${b.owner_agent ? tag('Owner: ' + b.owner_agent, 'tag-purple') : ''}
          ${b.port ? tag('Port :' + b.port, 'tag-gold') : ''}
          ${(b.subpaths || []).map(s => tag(s)).join('')}
        </div>
      </div>
    `).join('');
  }

  // ═══ AGENTS ═══
  function renderAgents() {
    document.getElementById('agent-count').textContent = REGISTRY.agents.length + ' agents';
    document.getElementById('agents-grid').innerHTML = REGISTRY.agents.map(a => `
      <div class="card">
        <div class="card-header">
          <div>
            <span class="card-title">${a.name}</span>
            ${a.full_name ? `<div class="card-subtitle">${a.full_name}</div>` : ''}
          </div>
          ${badge(a.status || 'active')}
        </div>
        <div class="card-body">
          <p>${a.role}</p>
          ${a.acronym ? `<p class="mt-lg" style="font-size: 0.7rem; color: var(--text-muted); font-style: italic;">${a.acronym}</p>` : ''}
          ${a.master_doc ? `<p style="font-size: 0.75rem; margin-top: 8px;"><span class="text-muted">Doctrine:</span> <span class="mono text-purple">${a.master_doc}</span></p>` : ''}
        </div>
        <div class="card-footer">
          ${a.voice ? tag('🔊 ' + a.voice, 'tag-gold') : ''}
          ${a.port ? tag(':' + a.port) : ''}
          ${(a.owns || []).map(o => tag(o, 'tag-purple')).join('')}
          ${(a.advises || []).map(o => tag('⤷ ' + o)).join('')}
        </div>
      </div>
    `).join('');
  }

  // ═══ HEAVEN ═══
  function renderHeaven() {
    const cf = REGISTRY.cloudflare;
    document.getElementById('heaven-content').innerHTML = `
      <div class="covenant-block">
        <h3>Heaven = The Consent/Sovereignty Kernel</h3>
        <blockquote>"Public / is open; /api/v1/*, /gabriel, /health require the auth token."</blockquote>
        <p class="mt-lg mono" style="font-size: 0.8rem; color: var(--text-secondary);">
          Live at: <span class="text-gold">heaven.rsp-5f3.workers.dev</span> · Auth: X-NOIZY-Key header
        </p>
      </div>

      <div class="section-header"><h2>Heaven API Endpoints</h2></div>
      <table class="empire-table mb-xl">
        <thead><tr><th>Method</th><th>Path</th><th>Purpose</th></tr></thead>
        <tbody>
          <tr><td class="mono">GET</td><td class="mono text-purple">/health</td><td>System status</td></tr>
          <tr><td class="mono">POST</td><td class="mono text-purple">/api/v1/synth-requests</td><td>Create synthesis request (NCP enforced)</td></tr>
          <tr><td class="mono">POST</td><td class="mono text-purple">/api/v1/consent-tokens</td><td>Create consent token</td></tr>
          <tr><td class="mono">POST</td><td class="mono text-purple">/api/v1/consent-tokens/:id/revoke</td><td>Kill Switch</td></tr>
          <tr><td class="mono">GET</td><td class="mono text-purple">/api/v1/actors/:id/never-clauses</td><td>Actor's immovable prohibitions</td></tr>
          <tr><td class="mono">POST</td><td class="mono text-purple">/api/v1/ledger/append</td><td>Usage report (fire-and-forget)</td></tr>
          <tr><td class="mono">GET</td><td class="mono text-purple">/api/v1/kpi/trust</td><td>Consent health metrics</td></tr>
        </tbody>
      </table>

      <div class="section-header"><h2>Cloudflare Workers</h2></div>
      <div class="card-grid mb-xl">
        ${cf.workers.map(w => `
          <div class="card">
            <div class="card-header">
              <span class="card-title">${w.name}</span>
              ${badge('active')}
            </div>
            <div class="card-body">
              ${w.url ? `<p class="mono text-gold" style="font-size: 0.8rem;">${w.url}</p>` : ''}
              <p class="mono" style="font-size: 0.75rem; color: var(--text-muted);">${w.path}</p>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="section-header"><h2>D1 Databases</h2></div>
      <table class="empire-table mb-xl">
        <thead><tr><th>Name</th><th>ID</th><th>Purpose</th></tr></thead>
        <tbody>
          ${cf.d1_databases.map(d => `
            <tr><td class="mono text-gold">${d.name}</td><td class="mono">${d.id}</td><td>${d.purpose}</td></tr>
          `).join('')}
        </tbody>
      </table>

      <div class="section-header"><h2>KV Namespaces</h2></div>
      <table class="empire-table mb-xl">
        <thead><tr><th>Name</th><th>ID</th></tr></thead>
        <tbody>
          ${cf.kv_namespaces.map(k => `
            <tr><td class="mono text-purple">${k.name}</td><td class="mono">${k.id}</td></tr>
          `).join('')}
        </tbody>
      </table>

      <div class="section-header"><h2>Domains</h2></div>
      <div class="card-grid">
        ${cf.domains.map(d => `
          <div class="card">
            <div class="card-header">
              <span class="card-title">${d.domain}</span>
              ${badge(d.status.toLowerCase().includes('active') ? 'active' : 'building')}
            </div>
            <div class="card-footer">${tag(d.plan)} ${tag(d.status)}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ═══ INFRASTRUCTURE ═══
  function renderInfrastructure() {
    document.getElementById('service-count').textContent = REGISTRY.services.length + ' services';
    document.getElementById('infra-content').innerHTML = `
      <div class="section-header"><h2>Service Matrix</h2></div>
      <div class="service-grid mb-xl">
        ${REGISTRY.services.map(s => `
          <div class="service-row">
            <span class="service-port">:${s.port}</span>
            <div>
              <div class="service-name">${s.name}</div>
              <div class="service-desc">${s.desc}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="section-header"><h2>Ollama Models (Local AI)</h2></div>
      <table class="empire-table mb-xl">
        <thead><tr><th>Model</th><th>Size</th><th>Role</th></tr></thead>
        <tbody>
          ${REGISTRY.ollama_models.map(m => `
            <tr><td class="mono text-purple">${m.name}</td><td class="mono">${m.size}</td><td>${m.role}</td></tr>
          `).join('')}
        </tbody>
      </table>

      <div class="section-header"><h2>Storage Tiers</h2></div>
      <div class="card-grid">
        <div class="card">
          <div class="card-header"><span class="card-title">Tier 0 — Hot (Local)</span>${badge('active')}</div>
          <div class="card-body mono" style="font-size: 0.75rem;">${REGISTRY.storage_tiers.tier_0_hot}</div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Tier 1 — Warm (Rideshare)</span>${badge('active')}</div>
          <div class="card-body mono" style="font-size: 0.75rem;">${REGISTRY.storage_tiers.tier_1_warm}</div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Tier 2 — Cloud Mirrors</span>${badge('active')}</div>
          <div class="card-body mono" style="font-size: 0.75rem;">${REGISTRY.storage_tiers.tier_2_cloud.join('<br>')}</div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Tier 3 — Cold Vaults</span>${badge('archive')}</div>
          <div class="card-body mono" style="font-size: 0.75rem;">${REGISTRY.storage_tiers.tier_3_cold.join('<br>')}</div>
        </div>
      </div>
    `;
  }

  // ═══ TOOLS ═══
  function renderTools() {
    const allTools = Object.values(REGISTRY.tools).flat();
    document.getElementById('tools-count').textContent = allTools.length + ' tools';

    const categoryIcons = {
      deploy: '🚀', audit: '🔍', voice: '🎙️', security: '🔒', empire: '👑',
      gabriel: '🗡️', infrastructure: '🏗️', maintenance: '🔧', testing: '🧪',
      git: '📦', disaster_recovery: '🆘', validation: '✅', docs: '📄',
      fish: '🐟', accessibility: '♿', features: '🎛️'
    };

    document.getElementById('tools-content').innerHTML = Object.entries(REGISTRY.tools).map(([cat, tools]) => `
      <div class="tools-category">
        <h3>${categoryIcons[cat] || '🔹'} ${cat.replace(/_/g, ' ')}</h3>
        <div class="tools-list">
          ${tools.map(t => `<span class="tool-item" title="Click to copy">${t}</span>`).join('')}
        </div>
      </div>
    `).join('');

    // Click-to-copy
    document.querySelectorAll('.tool-item').forEach(item => {
      item.addEventListener('click', () => {
        navigator.clipboard.writeText(item.textContent).then(() => {
          const orig = item.textContent;
          item.textContent = '✓ copied';
          item.style.color = 'var(--status-active)';
          setTimeout(() => {
            item.textContent = orig;
            item.style.color = '';
          }, 1200);
        });
      });
    });
  }

  // ═══ DREAMCHAMBER ═══
  function renderDreamChamber() {
    const folders = [
      { name: 'GABRIEL', icon: '🗡️', desc: '63+ canonical files. Daemon, prompts, turbo-scripts, VPN, voice engine, MCP, n8n workflows, Postman, modelfiles, iOS app.', master: 'MASTER_GABRIEL.md' },
      { name: 'AGENTS', icon: '👥', desc: '9 master doctrines — GABRIEL, SHIRL, POPS, DREAM, ENGR_KEITH, LUCY, CLAUDE, SHELPER, JESSY.', master: 'README.md' },
      { name: 'MC96ECO', icon: '🌌', desc: 'MC96 ecosystem root. CLI, Swift diagnostics, briefings, audits, n8n backups, command-center dashboards.', master: 'MASTER_MC96.md' },
      { name: 'NOIZY.AI', icon: '🌐', desc: 'Public face. Landing page, consent portal, API docs. Cloudflare Pages.', master: 'MASTER_NOIZY_AI.md' },
      { name: 'NOIZYVOX', icon: '🎙️', desc: 'Voice ownership protocol. FastAPI :8090. XTTS v2. Kill Switch.', master: 'MASTER_NOIZYVOX.md' },
      { name: 'FISHMUSICINC', icon: '🐟', desc: 'Legacy music-rights brand. Publishing + back-catalog.', master: null },
      { name: 'NOIZYKIDZ', icon: '🧒', desc: 'Haptic music education. Deaf-first. 1% GORUNFREE Trust Clause.', master: null },
      { name: 'audio', icon: '🔊', desc: 'Audio processing pipeline assets.', master: null },
      { name: 'bridge', icon: '🌉', desc: 'Bridge integration modules.', master: null },
      { name: 'vision', icon: '👁️', desc: 'Vision and multimodal processing.', master: null },
      { name: 'web', icon: '🕸️', desc: 'Web assets and components.', master: null }
    ];

    document.getElementById('dreamchamber-content').innerHTML = `
      <div class="covenant-block">
        <h3>The Sacred Creative Space</h3>
        <blockquote>"DreamChamber is her room." — DREAM owns the creative space. GABRIEL executes. LUCY archives.</blockquote>
        <p class="mt-lg mono" style="font-size: 0.8rem; color: var(--text-muted);">
          Path: THE-GATHERING/DREAMCHAMBER/ · Port :7777 · Swift Package + GRDB+FTS5
        </p>
      </div>

      <div class="card-grid card-grid-3">
        ${folders.map(f => `
          <div class="card">
            <div class="card-header">
              <span class="card-title">${f.icon} ${f.name}</span>
            </div>
            <div class="card-body">
              <p>${f.desc}</p>
              ${f.master ? `<p class="mt-lg" style="font-size: 0.75rem;"><span class="text-muted">Master:</span> <span class="mono text-gold">${f.master}</span></p>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ═══ PROJECTS ═══
  function renderProjects() {
    document.getElementById('project-count').textContent = REGISTRY.projects.length;
    document.getElementById('projects-grid').innerHTML = REGISTRY.projects.map(p => `
      <div class="card">
        <div class="card-header">
          <span class="card-title">${p.name}</span>
          ${badge(p.status)}
        </div>
        <div class="card-body">
          <p class="mono" style="font-size: 0.75rem;">${p.path}</p>
          ${p.modules ? `<p style="margin-top: 8px;">${p.modules} Python modules</p>` : ''}
        </div>
      </div>
    `).join('');
  }

  // ═══ BRIDGE ═══
  function renderBridge() {
    document.getElementById('bridge-content').innerHTML = `
      <div class="covenant-block">
        <h3>UNIFIED-BRIDGE — HOT-ROD Integration Layer</h3>
        <blockquote>Cross-platform auth, file sync, encrypted transport, remote display, and performance metrics — bridging Mac ↔ Windows ↔ Cloud ↔ iPad ↔ VSCode.</blockquote>
        <p class="mt-lg mono" style="font-size: 0.8rem; color: var(--text-muted);">
          Path: PROJECTS/UNIFIED-BRIDGE/ · 7 Python modules · Full implementation guide available
        </p>
      </div>

      <div class="card-grid card-grid-3">
        ${REGISTRY.unified_bridge_modules.map(m => `
          <div class="card">
            <div class="card-header">
              <span class="card-title">${m.purpose}</span>
              ${badge('active')}
            </div>
            <div class="card-body">
              <p class="mono" style="font-size: 0.75rem; color: var(--hz-purple-light);">${m.file}</p>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="section-header mt-lg"><h2>Architecture Documents</h2></div>
      <div class="card-grid">
        <div class="card">
          <div class="card-header"><span class="card-title">Implementation Summary</span></div>
          <div class="card-body mono" style="font-size: 0.75rem;">FINAL_IMPLEMENTATION_SUMMARY.md · 28.8 KB</div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">HOT-ROD Guide</span></div>
          <div class="card-body mono" style="font-size: 0.75rem;">HOTROD_IMPLEMENTATION_GUIDE.md · 13.4 KB</div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Quick Start</span></div>
          <div class="card-body mono" style="font-size: 0.75rem;">QUICK_START_EXAMPLES.py · 13.6 KB</div>
        </div>
      </div>
    `;
  }

  // ═══ SCHEMAS ═══
  function renderSchemas() {
    document.getElementById('schema-count').textContent = REGISTRY.database_schemas.length + ' migrations';
    document.getElementById('schemas-content').innerHTML = `
      <div class="section-header"><h2>Supabase Migrations</h2></div>
      <table class="empire-table mb-xl">
        <thead><tr><th>File</th><th>Purpose</th></tr></thead>
        <tbody>
          ${REGISTRY.database_schemas.map(s => `
            <tr><td class="mono text-purple">${s.file}</td><td>${s.purpose}</td></tr>
          `).join('')}
        </tbody>
      </table>

      <div class="section-header"><h2>MC96 Manifest</h2></div>
      <div class="card-grid card-grid-2">
        <div class="card">
          <div class="card-header"><span class="card-title">Invariants (Hardcoded)</span></div>
          <div class="card-body">
            <p><span class="text-gold">Rule Zero:</span> ${REGISTRY.invariants.rule_zero}</p>
            <p><span class="text-gold">Plowman Standard:</span> ${REGISTRY.invariants.plowman_standard}</p>
            <p><span class="text-gold">Founding Actor:</span> ${REGISTRY.invariants.founding_actor_rate}</p>
            <p><span class="text-gold">GORUNFREE Trust:</span> ${REGISTRY.invariants.gorunfree_trust}</p>
            <p><span class="text-gold">Provenance:</span> ${REGISTRY.invariants.provenance}</p>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">NCP v1.0 Consent Token</span></div>
          <div class="card-body">
            <div class="code-block">{
  "ncp_version": "1.0",
  "creator_voice_id": "HVS_UUID",
  "consent_record": {
    "granted_by": "creator_id",
    "granted_to": "claimant_id",
    "usage_types": ["synthesis", "training"],
    "royalty_split": {
      "creator_pct": 75,
      "platform_pct": 25
    },
    "revocation_trigger": {
      "notice_period_days": 0,
      "enforcement_sla_hours": 1
    }
  }
}</div>
          </div>
        </div>
      </div>

      <div class="section-header mt-lg"><h2>Control Plane Types</h2></div>
      <div class="card-grid">
        <div class="card">
          <div class="card-header"><span class="card-title">control-plane/</span></div>
          <div class="card-body">
            <p>TypeScript orchestration engine</p>
            <div style="margin-top: 8px;">
              ${['index.ts', 'audio/', 'provenance/', 'types/', 'video/'].map(f => tag(f, 'tag-purple')).join(' ')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ═══ ROADMAP ═══
  function renderRoadmap() {
    const milestones = [
      { year: 'March 1996', desc: 'Rob records a Transformers VO. The thought: "If I die tomorrow, this voice is still property. Whose?"', past: true },
      { year: '2023', desc: 'The diving accident. C3 spinal injury. Rob builds NERVE adaptive input.', past: true },
      { year: '2024-2025', desc: 'MC96ECO takes shape. NOIZYVOX protocol drafted. Heaven Worker deployed. Consent Kernel formalized.', past: true },
      { year: 'March 25, 2026', desc: 'GABRIEL_EXECUTOR_v1.0 locked. NOIZY Empire goes operational.', past: true },
      { year: 'April 17, 2026', desc: 'Launch milestone. DreamChamber consolidation lands. 396 Hz activation session.', past: true },
      { year: '2026 Q2', desc: 'Launch, onboard first 100 artists, Guild of Artists assembly.', current: true },
      { year: '2026 Q4', desc: 'NOIZYKIDZ pilot in 3 schools (haptic curriculum).', future: true },
      { year: '2027', desc: '10,000 artists, federated Heaven across 3 regions.', future: true },
      { year: '2028', desc: 'First C-level departure — RSP_001 steps back from daily ops. Guild takes governance.', future: true },
      { year: '2030', desc: 'Format migration v2 (whatever lossless format succeeds FLAC).', future: true },
      { year: '2036', desc: 'Founding covenant celebrates 10th anniversary. Artist families paid continuously for a decade. The voice outlived the voice actor.', future: true }
    ];

    const royaltyTable = `
      <div class="section-header mt-lg"><h2>Royalty Architecture</h2></div>
      <table class="empire-table mb-xl">
        <thead><tr><th>Tier</th><th>Creator</th><th>Platform</th><th>Trust</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td class="text-gold">NCP v1.0 Default</td><td class="mono">75%</td><td class="mono">25%</td><td>—</td><td>Plowman Standard. Non-configurable.</td></tr>
          <tr><td class="text-gold">RSP_001 Founding</td><td class="mono">85%</td><td class="mono">15%</td><td>—</td><td>Founder's rate.</td></tr>
          <tr><td class="text-gold">GORUNFREE Trust</td><td>—</td><td>—</td><td class="mono text-gold">1% → NOIZYKIDZ</td><td>Irremovable. From platform share.</td></tr>
        </tbody>
      </table>
    `;

    const next25 = [
      { num: 1, title: 'Complete noizy.ai NS delegation', desc: 'Point GoDaddy NS to HEAVEN CF account', priority: 'UNBLOCKER' },
      { num: 2, title: 'Activate Cloudflare Email Routing', desc: 'catch-all *@noizy.ai → rsplowman@icloud.com', priority: 'UNBLOCKER' },
      { num: 3, title: 'Bind heaven.noizy.ai custom route', desc: 'wrangler deploy with routes heaven.noizy.ai/*', priority: 'UNBLOCKER' },
      { num: 4, title: 'Bind consent.noizy.ai + cb01.noizy.ai', desc: 'Consent Gateway + CB01 Router workers', priority: 'UNBLOCKER' },
      { num: 5, title: 'Upgrade Wrangler 4.53.0 → latest', desc: 'npm i -g wrangler@latest', priority: 'UNBLOCKER' },
      { num: 6, title: 'Run 9-point Never Clause audit', desc: 'All 9 clauses return enforced · ledger entry written', priority: 'CONSENT' },
      { num: 7, title: 'Seed RSP_001 founding consent token', desc: 'actor RSP_001, scope founding, is_active=1', priority: 'CONSENT' },
      { num: 8, title: 'Wire Kill Switch to production', desc: '/kill-switch endpoint + X-NOIZY-Key + actor signature', priority: 'CONSENT' },
      { num: 9, title: 'C2PA sign one synth response', desc: 'c2pa verify output.wav returns valid manifest', priority: 'CONSENT' },
      { num: 10, title: 'Ledger append test (idempotent)', desc: '3 identical POSTs → 3 distinct entries', priority: 'CONSENT' },
      { num: 11, title: 'Publish under heaven.noizy.ai', desc: 'Update all docs/clients to new URL', priority: 'PROOF' },
      { num: 12, title: 'Deploy landing page to noizy.ai', desc: 'wrangler pages deploy → SSL live', priority: 'PROOF' },
      { num: 13, title: 'Lock the 3-layer watermark', desc: 'Acoustic + perceptual + cryptographic', priority: 'PROOF' },
      { num: 14, title: 'Archive Voice DNA sample to OAIS/PREMIS', desc: 'Capture → encrypt → PREMIS metadata → cold store', priority: 'PROOF' },
      { num: 15, title: '100-year verification dry run', desc: 'Verify with archive-only key material', priority: 'PROOF' },
      { num: 16, title: 'Slack webhook for CRITICAL events', desc: 'Fire on kill-switch + Never-Clause violation', priority: 'DEPLOY' },
      { num: 17, title: 'Health dashboard online', desc: '15-service health matrix live', priority: 'DEPLOY' },
      { num: 18, title: 'deploy.sh smoke tests green', desc: 'Exit code 0 on clean run', priority: 'DEPLOY' },
      { num: 19, title: 'Backup gabriel_db to R2', desc: 'wrangler d1 export → R2 with datestamp', priority: 'DEPLOY' },
      { num: 20, title: 'Rotate NOIZY_API_KEY', desc: 'New key 200, old key 401', priority: 'DEPLOY' },
      { num: 21, title: 'Public brief at noizy.ai/mission', desc: 'Mission + Never Clauses static page', priority: 'LAUNCH' },
      { num: 22, title: 'DMCA enforcement template', desc: 'Template with rsp@noizy.ai as notice address', priority: 'LAUNCH' },
      { num: 23, title: 'Sample artist onboarding e2e', desc: 'Create actor → token → synth → revoke → verify', priority: 'LAUNCH' },
      { num: 24, title: '396 Hz activation recording', desc: 'DreamChamber :7777 · mic chain · 30-min arc', priority: 'LAUNCH' },
      { num: 25, title: 'Ship announcement — drafted, held', desc: 'Slack + email + landing banner — one click', priority: 'LAUNCH' }
    ];

    const priorityColors = {
      'UNBLOCKER': 'var(--status-offline)',
      'CONSENT': 'var(--status-building)',
      'PROOF': 'var(--status-planned)',
      'DEPLOY': 'var(--status-active)',
      'LAUNCH': 'var(--hz-gold)'
    };

    document.getElementById('roadmap-content').innerHTML = `
      <div class="covenant-block">
        <h3>North Star</h3>
        <blockquote>"If a system makes humans invisible, disposable, or uncompensated — we do not build it."</blockquote>
      </div>

      ${royaltyTable}

      <div class="section-header"><h2>The Founding Story</h2></div>
      <div class="timeline mb-xl">
        ${milestones.map(m => `
          <div class="timeline-item ${m.current ? 'current' : ''}">
            <div class="timeline-year">${m.year}</div>
            <div class="timeline-desc">${m.desc}</div>
          </div>
        `).join('')}
      </div>

      <div class="section-header"><h2>Next 25 Moves</h2></div>
      <ul class="checklist">
        ${next25.map(m => `
          <li class="checklist-item">
            <span class="checklist-num">${m.num}</span>
            <div class="checklist-content">
              <h4>${m.title} <span style="font-size: 0.65rem; font-weight: 600; color: ${priorityColors[m.priority]}; margin-left: 8px;">${m.priority}</span></h4>
              <p>${m.desc}</p>
            </div>
          </li>
        `).join('')}
      </ul>
    `;
  }

  // ── Launch ──
  document.addEventListener('DOMContentLoaded', boot);
})();
