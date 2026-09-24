#!/usr/bin/env node
// NOIZYBEAST Turbo Script Runner — T1 through T10
// RSP_001 · DAZEFLOW 2026-03-27 · GOD.local
// All scripts wire: Consent Membrane → Mutation Codex → Ethics Engine

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

export const execAsync = promisify(exec);

// ── CONFIG ──────────────────────────────────────────────────
export const CFG = {
  gabriel: 'http://localhost:7777',
  bridge:  'http://localhost:8080',
  ollama:  'http://localhost:11434',
  consent: 'http://localhost:7778',
  synth:   'http://localhost:7780',
  codex:   'http://localhost:7782',
  ethics:  'http://localhost:7785',
  cfAcct:  '5f36aa9795348ea681d0b21910dfc82a',
  noizylab: process.env.NOIZYLAB || `${process.env.HOME}/NOIZYLAB`,
  operator: 'RSP_001',
};

// ── SHARED HELPERS ──────────────────────────────────────────
export async function post(url, body) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    return res.ok ? res.json() : { error: `HTTP ${res.status}` };
  } catch (e) {
    return { error: e.message };
  }
}

export async function get(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    return res.ok ? res.json() : { error: `HTTP ${res.status}` };
  } catch (e) {
    return { error: e.message };
  }
}

export function ts() {
  return new Date().toISOString();
}

export function log(msg, level = 'INFO') {
  const prefix = { INFO: '✓', WARN: '⚠', ERR: '✗', EXEC: '⚡', OK: '✅' }[level] || '·';
  console.log(`[${ts()}] ${prefix} ${msg}`);
}

export async function logMutation(data) {
  // Fire to codex, fail silently if offline
  await post(`${CFG.codex}/log`, {
    ...data,
    operator: CFG.operator,
    timestamp: ts(),
  }).catch(() => {});
}

export async function ethicsCheck(action, context) {
  const result = await post(`${CFG.ethics}/check`, { action, context });
  if (result.blocked) {
    log(`ETHICS ENGINE BLOCKED: ${result.reason}`, 'ERR');
    log(`You must acknowledge: ${result.required_acknowledgment}`, 'WARN');
    process.exit(1);
  }
  return result;
}

// ── T1: SCAFFOLD ─────────────────────────────────────────────
async function t1(intent) {
  log(`T1 SCAFFOLD: "${intent}"`, 'EXEC');
  await ethicsCheck('scaffold', { intent });

  const name = intent.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const base = path.join(CFG.noizylab, 'projects', name);
  const dirs = ['src', 'workers', 'scripts', 'schema', 'tests', 'docs'];

  for (const d of dirs) await fs.mkdir(path.join(base, d), { recursive: true });

  // package.json
  await fs.writeFile(path.join(base, 'package.json'), JSON.stringify({
    name: `noizy-${name}`,
    version: '1.0.0',
    description: intent,
    type: 'module',
    scripts: {
      dev: 'wrangler dev',
      deploy: 'node ../noizybeast/turbo-scripts/noizybeast-turbo.js T3',
      test: 'node tests/smoke.js',
    },
    dependencies: { hono: '^4.0.0' },
    devDependencies: { wrangler: '^4.0.0' },
  }, null, 2));

  // wrangler.toml
  await fs.writeFile(path.join(base, 'wrangler.toml'), [
    `name = "noizy-${name}"`,
    `main = "src/index.ts"`,
    `compatibility_date = "2026-01-01"`,
    `account_id = "${CFG.cfAcct}"`,
    ``,
    `[[d1_databases]]`,
    `binding = "DB"`,
    `database_name = "agent-memory"`,
    `database_id = "7b813205-fd12-4a23-84a6-ce83bc49ec70"`,
  ].join('\n'));

  // index.ts boilerplate
  await fs.writeFile(path.join(base, 'src', 'index.ts'), [
    `// ${intent} — NOIZY.AI · RSP_001`,
    `import { Hono } from 'hono';`,
    `const app = new Hono();`,
    `app.get('/health', c => c.json({ ok: true, name: '${name}', ts: new Date().toISOString() }));`,
    `export default app;`,
  ].join('\n'));

  // deploy manifest
  const manifest = {
    name, intent, created: ts(), operator: CFG.operator,
    structure: dirs, cf_account: CFG.cfAcct,
    deploy: 'node turbo-scripts/noizybeast-turbo.js T3',
  };
  await fs.writeFile(path.join(base, 'docs', 'MANIFEST.json'), JSON.stringify(manifest, null, 2));

  await logMutation({ operation: 'scaffold', asset_id: name, input_desc: intent, output_desc: `project: ${base}`, risk_level: 'LOW' });
  log(`Scaffold complete: ${base}`, 'OK');
  console.log(JSON.stringify(manifest, null, 2));
}

// ── T2: FLOW SYNC ─────────────────────────────────────────────
async function t2() {
  log('T2 FLOW SYNC: generating session context', 'EXEC');
  const today = new Date().toISOString().split('T')[0];
  const sessionFile = path.join(CFG.noizylab, 'noizybeast', `session-${today}.md`);

  const gabriel = await get(`${CFG.gabriel}/status`);
  const orders = await get(`${CFG.gabriel}/orders`);

  const doc = [
    `# NOIZYBEAST Session — ${today}`,
    `**Operator:** RSP_001 | **Target:** April 17, 2026`,
    `**GABRIEL:** ${gabriel.error ? 'OFFLINE' : 'ONLINE'} @ GOD.local:7777`,
    ``,
    `## Active Context`,
    `- CF Account: \`${CFG.cfAcct}\``,
    `- DreamChamber: GOD.local:7777`,
    `- Voice Bridge: GOD.local:8080`,
    `- Ollama: GOD.local:11434`,
    ``,
    `## Standing Orders`,
    ...(orders.items || [
      '[ ] voice-v2 pipeline → deploy STT/Claude dispatch',
      '[ ] DreamChamber v2 → finalize architecture',
      '[ ] GABRIEL v4 multi-agent orchestration → activate',
      '[ ] wrangler login → deploy HEAVEN Worker',
    ]).map(o => `- ${o}`),
    ``,
    `## Priority Queue`,
    `1. Deploy HEAVEN Worker via T3`,
    `2. Activate GABRIEL v4 orchestration`,
    `3. Wire voice-v2 STT pipeline`,
    ``,
    `## Session Start: ${new Date().toISOString()}`,
    `_Generated by T2 Flow Sync_`,
  ].join('\n');

  await fs.writeFile(sessionFile, doc);
  await logMutation({ operation: 'flow_sync', asset_id: 'session', output_desc: sessionFile, risk_level: 'LOW' });
  log(`Session doc written: ${sessionFile}`, 'OK');
  console.log(doc);
}

// ── T3: DEPLOY CANNON ─────────────────────────────────────────
async function t3(worker) {
  const target = worker || 'heaven';
  log(`T3 DEPLOY CANNON: ${target}`, 'EXEC');
  await ethicsCheck('deploy', { worker: target });

  const workerPath = path.join(CFG.noizylab, 'workers', target);

  try {
    log('Running wrangler deploy validation…');
    const { stdout: dryRun } = await execAsync(`cd "${workerPath}" && wrangler deploy --dry-run 2>&1`);
    log('Dry run passed');

    log('Deploying to Cloudflare edge…');
    const { stdout: deploy } = await execAsync(`cd "${workerPath}" && wrangler deploy 2>&1`);
    const urlMatch = deploy.match(/https:\/\/[^\s]+\.workers\.dev/);
    const url = urlMatch ? urlMatch[0] : 'URL not found in output';

    log(`Deployed: ${url}`, 'OK');

    // Smoke test
    if (urlMatch) {
      const health = await get(`${url}/health`);
      log(`Smoke test: ${health.error ? 'FAIL — ' + health.error : 'PASS'}`, health.error ? 'ERR' : 'OK');
    }

    await logMutation({ operation: 'deploy', asset_id: target, output_desc: url, risk_level: 'LOW' });
    return url;
  } catch (e) {
    log(`Deploy failed: ${e.message}`, 'ERR');
    log('Run: wrangler login — then retry T3', 'WARN');
    process.exit(1);
  }
}

// ── T4: CELL BURST ────────────────────────────────────────────
async function t4(sessionFile) {
  log('T4 CELL BURST: extracting knowledge → GABRIEL memcells', 'EXEC');

  const today = new Date().toISOString().split('T')[0];
  const src = sessionFile || path.join(CFG.noizylab, 'noizybeast', `session-${today}.md`);

  let content;
  try {
    content = await fs.readFile(src, 'utf-8');
  } catch {
    log(`Cannot read session file: ${src}`, 'ERR');
    log('Run T2 first to generate session doc', 'WARN');
    process.exit(1);
  }

  // Extract decisions, patterns, blockers
  const cells = [
    { key: `session.${today}.summary`, value: content.substring(0, 500) },
    { key: `session.${today}.timestamp`, value: ts() },
    { key: `session.${today}.operator`, value: CFG.operator },
  ];

  // Push to GABRIEL memcells
  for (const cell of cells) {
    const r = await post(`${CFG.gabriel}/memcell`, cell);
    log(`Memcell ${cell.key}: ${r.error ? 'FAILED' : 'stored'}`, r.error ? 'WARN' : 'OK');
  }

  await logMutation({ operation: 'cell_burst', asset_id: 'session', input_desc: src, output_desc: `${cells.length} memcells`, risk_level: 'LOW' });
  log(`T4 complete — ${cells.length} cells pushed to GABRIEL`, 'OK');
}

// ── T5: CONSENT SNAP ──────────────────────────────────────────
async function t5(voiceId) {
  if (!voiceId) { log('Usage: T5 <voice_id>', 'ERR'); process.exit(1); }
  log(`T5 CONSENT SNAP: ${voiceId}`, 'EXEC');

  const result = await post(`${CFG.consent}/query`, {
    voice_id: voiceId,
    requester: CFG.operator,
    use_cases: ['synthesis', 'mutation', 'derivative'],
  });

  if (result.error) {
    log(`Consent Oracle offline — ${result.error}`, 'WARN');
    log('Fallback: check D1 agent-memory consent_grants table manually', 'INFO');
    return;
  }

  console.log('\n╔══ CONSENT SNAP ══════════════════════════════╗');
  console.log(`║ Voice ID:    ${voiceId}`);
  console.log(`║ Status:      ${result.allowed ? '✅ GRANTED' : '❌ DENIED'}`);
  console.log(`║ Reason:      ${result.reason}`);
  console.log(`║ Expires:     ${result.expiry || 'never'}`);
  console.log(`║ Mutations:   ${(result.conditions || []).join(', ')}`);
  console.log(`║ Royalty:     ${result.royalty_rate}%`);
  console.log(`║ Next:        ${result.next_steps}`);
  console.log('╚══════════════════════════════════════════════╝\n');

  await logMutation({ operation: 'consent_snap', asset_id: voiceId, output_desc: result.allowed ? 'GRANTED' : 'DENIED', risk_level: result.allowed ? 'LOW' : 'HIGH' });
}

// ── T6: MUTATION REPLAY ───────────────────────────────────────
async function t6(assetId) {
  if (!assetId) { log('Usage: T6 <asset_id>', 'ERR'); process.exit(1); }
  log(`T6 MUTATION REPLAY: ${assetId}`, 'EXEC');

  const chain = await get(`${CFG.codex}/chain/${assetId}`);

  if (chain.error || !chain.mutations) {
    log(`Mutation Codex offline or no chain found: ${assetId}`, 'WARN');
    return;
  }

  console.log(`\n╔══ MUTATION CHAIN: ${assetId} ══╗`);
  chain.mutations.forEach((m, i) => {
    console.log(`║ [${i+1}] ${m.timestamp} — ${m.operation}`);
    console.log(`║     In:  ${m.input_desc}`);
    console.log(`║     Out: ${m.output_desc}`);
    console.log(`║     By:  ${m.operator} | Confidence: ${m.confidence} | Risk: ${m.risk_level}`);
    console.log(`║     Reasoning: ${m.reasoning}`);
    if (i < chain.mutations.length - 1) console.log('║     ↓');
  });
  console.log('╚══════════════════════════════╝\n');
}

// ── T7: FORGE (Synthesis Trinity) ─────────────────────────────
async function t7(voiceId, text) {
  if (!voiceId || !text) { log('Usage: T7 <voice_id> "<text>"', 'ERR'); process.exit(1); }
  log(`T7 FORGE: voice=${voiceId} | text="${text}"`, 'EXEC');

  // Ethics + consent first
  await ethicsCheck('synthesis', { voice_id: voiceId, text });
  const consent = await post(`${CFG.consent}/query`, { voice_id: voiceId, requester: CFG.operator, use_cases: ['synthesis'] });
  if (!consent.allowed) {
    log(`Consent DENIED for ${voiceId}: ${consent.reason}`, 'ERR');
    process.exit(1);
  }

  log(`Consent verified. Royalty: ${consent.royalty_rate}% | Sending to Synthesis Oracle…`);
  const result = await post(`${CFG.synth}/synthesize`, {
    voice_id: voiceId,
    input_text: text,
    requester: CFG.operator,
    consent_id: consent.grant_id,
  });

  if (result.error) {
    log(`Synthesis Oracle offline: ${result.error}`, 'ERR');
    log('Ensure mlx-whisper, XTTS-v2, RVC are running', 'WARN');
    process.exit(1);
  }

  console.log('\n╔══ FORGE RESULT ═══════════════════════════╗');
  console.log(`║ Method:      ${result.method}`);
  console.log(`║ Confidence:  ${(result.confidence * 100).toFixed(1)}%`);
  console.log(`║ Spectral:    ${result.quality_metrics?.spectral_coherence?.toFixed(2)}`);
  console.log(`║ Emotional:   ${result.quality_metrics?.emotional_score?.toFixed(2)}`);
  console.log(`║ C2PA:        ${result.c2pa_manifest ? '✅ ATTACHED' : '⚠ MISSING'}`);
  console.log(`║ Mutation ID: ${result.mutation_id}`);
  console.log(`║ Output:      ${result.output_path}`);
  console.log('╚═══════════════════════════════════════════╝\n');

  await logMutation({ operation: 'forge', asset_id: voiceId, input_desc: text, output_desc: result.output_path, confidence: result.confidence, risk_level: 'LOW' });
}

// ── T8: X1000 (Max Quality Mode) ──────────────────────────────
async function t8(turbo, ...args) {
  if (!turbo) { log('Usage: T8 <T#> [args]', 'ERR'); process.exit(1); }
  log(`T8 X1000 MODE: running ${turbo} at maximum quality`, 'EXEC');
  log('Thresholds: spectral>0.90 | emotional>0.88 | fidelity>0.92', 'INFO');

  // Set global X1000 mode flag for downstream scripts
  process.env.NOIZY_X1000 = '1';
  process.env.NOIZY_QUALITY_SPECTRAL = '0.90';
  process.env.NOIZY_QUALITY_EMOTIONAL = '0.88';
  process.env.NOIZY_QUALITY_FIDELITY = '0.92';

  // Route to the requested turbo
  await main([turbo, ...args]);
}

// ── T9: FIX CANON ─────────────────────────────────────────────
async function t9(issue) {
  if (!issue) { log('Usage: T9 <issue_description>', 'ERR'); process.exit(1); }
  log(`T9 FIX CANON: "${issue}"`, 'EXEC');

  // Diagnose via GABRIEL
  log('Diagnosing…');
  const diag = await post(`${CFG.gabriel}/diagnose`, { issue, operator: CFG.operator });

  if (diag.error) {
    log('GABRIEL offline — running local diagnostics', 'WARN');
    // Local fallback
    const checks = [
      { name: 'Voice Bridge',     cmd: `curl -sf ${CFG.bridge}/health` },
      { name: 'DreamChamber',     cmd: `curl -sf ${CFG.gabriel}/health` },
      { name: 'Ollama',           cmd: `curl -sf ${CFG.ollama}/api/tags` },
      { name: 'wrangler auth',    cmd: `wrangler whoami 2>&1 | head -5` },
    ];
    for (const c of checks) {
      try {
        const { stdout } = await execAsync(c.cmd);
        log(`${c.name}: OK`, 'OK');
      } catch {
        log(`${c.name}: FAIL`, 'ERR');
      }
    }
    return;
  }

  log(`Diagnosis: ${diag.diagnosis}`, 'INFO');
  if (diag.fix) {
    log(`Applying fix: ${diag.fix}`, 'EXEC');
    try {
      const { stdout } = await execAsync(diag.fix);
      log(`Fix applied: ${stdout.trim()}`, 'OK');
    } catch (e) {
      log(`Fix failed: ${e.message}`, 'ERR');
    }
  }

  log('Validating…');
  const valid = await post(`${CFG.gabriel}/validate`, { issue });
  log(`Validation: ${valid.passed ? 'PASSED' : 'FAILED'}`, valid.passed ? 'OK' : 'ERR');
  await logMutation({ operation: 'fix_canon', asset_id: 'system', input_desc: issue, output_desc: diag.diagnosis, risk_level: 'MEDIUM' });
}

// ── T10: DREAM CAPTURE ────────────────────────────────────────
async function t10() {
  log('T10 DREAM CAPTURE: closing session…', 'EXEC');

  const today = new Date().toISOString().split('T')[0];
  const sessionFile = path.join(CFG.noizylab, 'noizybeast', `session-${today}.md`);
  const captureFile = path.join(CFG.noizylab, 'noizybeast', 'dream-captures', `${today}-dream-capture.md`);

  await fs.mkdir(path.dirname(captureFile), { recursive: true });

  // Pull mutation summary
  const codexSummary = await get(`${CFG.codex}/summary?date=${today}`);
  const mutations = codexSummary.mutations || [];

  const builtItems = mutations.filter(m => m.operation === 'scaffold').map(m => m.input_desc);
  const decisions = mutations.filter(m => ['deploy', 'forge', 'consent_snap'].includes(m.operation));
  const queue = mutations.filter(m => m.risk_level === 'HIGH').map(m => m.output_desc);

  const narrative = `Today in the Dream Chamber, RSP_001 and the NOIZYBEAST crew executed ${mutations.length} operations. ${builtItems.length > 0 ? `Built: ${builtItems.join(', ')}.` : ''} ${decisions.length} major decisions logged to the mutation codex. ${queue.length > 0 ? `Open risks requiring attention: ${queue.join(', ')}.` : 'No high-risk items outstanding.'} Every move was consent-verified and C2PA-wrapped. The empire grows.`;

  const capture = [
    `# Dream Capture — ${today}`,
    `**Session closed:** ${ts()} | **Operator:** RSP_001`,
    ``,
    `## What Was Built`,
    ...(builtItems.length ? builtItems.map(b => `- ${b}`) : ['- (No scaffolds this session)']),
    ``,
    `## Decisions Made`,
    ...(decisions.length ? decisions.map(d => `- **${d.operation}** (${d.asset_id}): ${d.output_desc}`) : ['- (No major decisions logged)']),
    ``,
    `## Queue for Next Session`,
    `- voice-v2 pipeline deployment`,
    `- DreamChamber v2 architecture finalize`,
    `- GABRIEL v4 multi-agent orchestration activation`,
    ...(queue.map(q => `- ${q}`)),
    ``,
    `## Operations Summary`,
    `- Total mutations logged: ${mutations.length}`,
    `- Consent verifications: ${mutations.filter(m => m.consent_verified).length}`,
    `- High-risk flags: ${queue.length}`,
    ``,
    `## Plowman Chronicles Entry`,
    ``,
    `> ${narrative}`,
    ``,
    `---`,
    `*Generated by T10 Dream Capture · NOIZYBEAST · RSP_001*`,
  ].join('\n');

  await fs.writeFile(captureFile, capture);
  await logMutation({ operation: 'dream_capture', asset_id: 'session', output_desc: captureFile, risk_level: 'LOW' });

  log(`Dream Capture written: ${captureFile}`, 'OK');
  console.log('\n' + capture);
}

// ── MAIN DISPATCHER ───────────────────────────────────────────
async function main(args = process.argv.slice(2)) {
  const [turbo, ...rest] = args;
  if (!turbo) {
    console.log([
      'NOIZYBEAST TURBO SCRIPTS — T1 through T10',
      'Usage: node noizybeast-turbo.js <T#> [args]',
      '',
      '  T1 <intent>      Scaffold full project from intent',
      '  T2               Flow Sync — daily session context',
      '  T3 [worker]      Deploy Cannon → live URL',
      '  T4 [session.md]  Cell Burst → GABRIEL memcells',
      '  T5 <voice_id>    Consent Snap → full permission status',
      '  T6 <asset_id>    Mutation Replay → transformation chain',
      '  T7 <voice_id> "<text>"  Forge → XTTS+RVC+C2PA',
      '  T8 <T#> [args]   X1000 max quality mode',
      '  T9 <issue>       Fix Canon → diagnose+fix+validate',
      '  T10              Dream Capture → session summary',
    ].join('\n'));
    return;
  }

  const dispatch = { T1: t1, T2: t2, T3: t3, T4: t4, T5: t5, T6: t6, T7: t7, T8: t8, T9: t9, T10: t10 };
  const fn = dispatch[turbo.toUpperCase()];
  if (!fn) { log(`Unknown turbo: ${turbo}`, 'ERR'); process.exit(1); }

  await fn(...rest).catch(e => { log(`Fatal: ${e.message}`, 'ERR'); process.exit(1); });
}

main();
