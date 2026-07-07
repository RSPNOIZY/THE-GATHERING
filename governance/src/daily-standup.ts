/**
 * NOIZY.AI GOVERNANCE — Daily Standup Generator v2.0
 * 
 * Generated every morning. Reports what happened, what's live,
 * what's blocked, and the next 3 moves.
 * 
 * Now integrates: Lucy nightly reports, voice capture sessions,
 * Gini monitor, royalty ledger, and D1 table counts.
 * 
 * Capture writes files. Humans bless memory. Gabriel only sees blessed truth.
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync, mkdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

// ─── CONFIG ──────────────────────────────────────────────

const NOIZYLAB = '/Users/m2ultra/NOIZYLAB';
const GOVERNANCE = join(NOIZYLAB, 'governance');
const STANDUP_DIR = join(GOVERNANCE, 'standups');
const DECISION_QUEUE = join(GOVERNANCE, 'decision-queue.json');
const LUCY_REPORTS = join(NOIZYLAB, 'lucy', 'nightly-reports');
const VOICE_SESSIONS = join(NOIZYLAB, 'noizyvox', 'voice-capture', 'sessions');

// ─── STANDUP SHAPE ───────────────────────────────────────

export interface StandupReport {
  date: string;
  generated_at: string;
  run_id: string;

  built_overnight: StandupItem[];
  live_now: StandupItem[];
  blocked: BlockedItem[];
  next_three_moves: string[];

  system_health: SystemHealth;
  decision_queue_count: number;
  blessed_count_24h: number;

  // v2.0 additions
  lucy_summary: LucySummary | null;
  voice_capture_summary: VoiceCaptureSummary;
  test_results: TestResults;
}

export interface StandupItem {
  description: string;
  path?: string;
  timestamp?: string;
}

export interface BlockedItem {
  description: string;
  reason: string;
  requires: 'human_decision' | 'external_dependency' | 'technical_fix' | 'legal_review';
}

export interface SystemHealth {
  god_uptime: string;
  ollama_status: 'running' | 'stopped' | 'unknown';
  ollama_models: number;
  gabriel_db_size: string;
  voice_pipeline: 'active' | 'idle' | 'error';
  cloudflare_workers: 'healthy' | 'degraded' | 'unknown';
  disk_available: string;
}

export interface LucySummary {
  report_date: string;
  opportunities_found: number;
  risks_detected: number;
  compassion_cleared: number;
  n8n_actions_queued: number;
}

export interface VoiceCaptureSummary {
  total_sessions: number;
  completed_sessions: number;
  total_takes_recorded: number;
  sessions_ready_for_blessing: number;
}

export interface TestResults {
  actor_protocol: number;
  governance: number;
  lucy: number;
  voice_capture: number;
  blessing_bridge: number;
  royalty_ledger: number;
  total: number;
  all_passing: boolean;
}

// ─── COLLECTORS ──────────────────────────────────────────

function getRecentFiles(dir: string, hoursAgo: number = 24): StandupItem[] {
  const items: StandupItem[] = [];
  const cutoff = Date.now() - (hoursAgo * 60 * 60 * 1000);

  try {
    const walk = (d: string, depth: number = 0) => {
      if (depth > 4) return;
      const entries = readdirSync(d, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        const full = join(d, entry.name);
        if (entry.isDirectory()) {
          walk(full, depth + 1);
        } else {
          try {
            const stat = statSync(full);
            if (stat.mtimeMs > cutoff) {
              items.push({
                description: full.replace(NOIZYLAB + '/', ''),
                path: full,
                timestamp: stat.mtime.toISOString(),
              });
            }
          } catch { /* skip unreadable */ }
        }
      }
    };
    walk(dir);
  } catch { /* dir doesn't exist */ }

  return items.sort((a, b) =>
    (b.timestamp || '').localeCompare(a.timestamp || '')
  );
}

function getSystemHealth(): SystemHealth {
  const run = (cmd: string): string => {
    try { return execSync(cmd, { encoding: 'utf-8', timeout: 5000 }).trim(); }
    catch { return 'unknown'; }
  };

  const uptime = run('uptime');

  let ollamaStatus: 'running' | 'stopped' | 'unknown' = 'unknown';
  let modelCount = 0;
  try {
    const models = run('ollama list 2>/dev/null');
    ollamaStatus = models ? 'running' : 'stopped';
    modelCount = models.split('\n').filter(l => l.trim()).length - 1;
  } catch { ollamaStatus = 'stopped'; }

  const dbPath = join(NOIZYLAB, 'gabriel.db');
  let dbSize = 'not found';
  try {
    const stat = statSync(dbPath);
    dbSize = `${(stat.size / 1024 / 1024).toFixed(1)}MB`;
  } catch { /* no db */ }

  let voicePipeline: 'active' | 'idle' | 'error' = 'idle';
  try {
    const pipState = join(NOIZYLAB, 'voice-pipeline', '.pipeline-state.json');
    if (existsSync(pipState)) {
      const state = JSON.parse(readFileSync(pipState, 'utf-8'));
      voicePipeline = state.status || 'idle';
    }
  } catch { voicePipeline = 'error'; }

  const disk = run("df -h /Users/m2ultra | tail -1 | awk '{print $4}'");

  return {
    god_uptime: uptime,
    ollama_status: ollamaStatus,
    ollama_models: modelCount,
    gabriel_db_size: dbSize,
    voice_pipeline: voicePipeline,
    cloudflare_workers: 'unknown',
    disk_available: disk,
  };
}

function getDecisionQueueCount(): number {
  try {
    if (!existsSync(DECISION_QUEUE)) return 0;
    const queue = JSON.parse(readFileSync(DECISION_QUEUE, 'utf-8'));
    return Array.isArray(queue.decisions) ? queue.decisions.filter((d: any) => d.status === 'pending').length : 0;
  } catch { return 0; }
}

function getBlessedCount24h(): number {
  const blessedDir = join(GOVERNANCE, 'blessed');
  if (!existsSync(blessedDir)) return 0;
  const cutoff = Date.now() - (24 * 60 * 60 * 1000);
  try {
    return readdirSync(blessedDir)
      .filter(f => {
        const stat = statSync(join(blessedDir, f));
        return stat.mtimeMs > cutoff;
      }).length;
  } catch { return 0; }
}

function detectBlocked(): BlockedItem[] {
  const blocked: BlockedItem[] = [];

  const holds = [
    { name: 'NOIZ Token', status: 'BLOCKED', requires: 'legal_review' as const },
    { name: 'DAO Governance', status: 'BLOCKED', requires: 'legal_review' as const },
    { name: 'Cross-Border Royalties', status: 'UNDER_REVIEW', requires: 'legal_review' as const },
  ];
  for (const hold of holds) {
    if (hold.status === 'BLOCKED') {
      blocked.push({
        description: `Legal hold: ${hold.name}`,
        reason: `Status: ${hold.status} — cannot proceed without counsel clearance`,
        requires: hold.requires,
      });
    }
  }

  try {
    if (existsSync(DECISION_QUEUE)) {
      const queue = JSON.parse(readFileSync(DECISION_QUEUE, 'utf-8'));
      if (Array.isArray(queue.decisions)) {
        for (const d of queue.decisions) {
          if (d.status === 'pending' && d.blocking) {
            blocked.push({
              description: d.title,
              reason: d.reason,
              requires: 'human_decision',
            });
          }
        }
      }
    }
  } catch { /* no queue */ }

  blocked.push({
    description: 'Cloudflare R2 not yet enabled',
    reason: 'R2 requires manual activation at dash.cloudflare.com before voice storage',
    requires: 'external_dependency',
  });

  return blocked;
}

// ─── v2.0 COLLECTORS ─────────────────────────────────────

function getLucySummary(): LucySummary | null {
  try {
    if (!existsSync(LUCY_REPORTS)) return null;
    
    const files = readdirSync(LUCY_REPORTS)
      .filter(f => f.endsWith('.json') && !f.includes('summary'))
      .sort()
      .reverse();
    
    if (files.length === 0) return null;
    
    const latest = JSON.parse(readFileSync(join(LUCY_REPORTS, files[0]), 'utf-8'));
    
    return {
      report_date: latest.analysis_date || latest.date || files[0].replace('.json', ''),
      opportunities_found: Array.isArray(latest.opportunities) ? latest.opportunities.length : 0,
      risks_detected: Array.isArray(latest.risks) ? latest.risks.length : 0,
      compassion_cleared: Array.isArray(latest.opportunities)
        ? latest.opportunities.filter((o: any) => o.compassion_cleared).length : 0,
      n8n_actions_queued: Array.isArray(latest.n8n_actions) ? latest.n8n_actions.length : 0,
    };
  } catch { return null; }
}

function getVoiceCaptureSummary(): VoiceCaptureSummary {
  const summary: VoiceCaptureSummary = {
    total_sessions: 0,
    completed_sessions: 0,
    total_takes_recorded: 0,
    sessions_ready_for_blessing: 0,
  };

  try {
    if (!existsSync(VOICE_SESSIONS)) return summary;

    const files = readdirSync(VOICE_SESSIONS).filter(f => f.endsWith('.json'));
    summary.total_sessions = files.length;

    for (const file of files) {
      try {
        const session = JSON.parse(readFileSync(join(VOICE_SESSIONS, file), 'utf-8'));
        if (session.status === 'completed') {
          summary.completed_sessions++;
          const approvedCount = Array.isArray(session.takes)
            ? session.takes.filter((t: any) => (t.status as string) === 'approved').length : 0;
          if (approvedCount > 0) summary.sessions_ready_for_blessing++;
        }
        if (Array.isArray(session.takes)) {
          summary.total_takes_recorded += session.takes.length;
        }
      } catch { /* skip bad file */ }
    }
  } catch { /* dir doesn't exist */ }

  return summary;
}

function runTestSuites(): TestResults {
  const run = (pkg: string, testFile: string): number => {
    try {
      const output = execSync(
        `cd /Users/m2ultra/NOIZYLAB/${pkg} && npx tsx ${testFile} 2>&1`,
        { encoding: 'utf-8', timeout: 30000 }
      );
      const match = output.match(/(\d+)\s+passed/);
      return match ? parseInt(match[1], 10) : 0;
    } catch {
      return 0;
    }
  };

  const results: TestResults = {
    actor_protocol: run('noizyvox/actor-protocol', 'src/fixtures/smoke-test.ts'),
    governance: run('governance', 'src/smoke-test.ts'),
    lucy: run('lucy', 'src/smoke-test.ts'),
    voice_capture: run('noizyvox/voice-capture', 'src/smoke-test.ts'),
    blessing_bridge: run('noizyvox/voice-capture', 'src/bridge-smoke-test.ts'),
    royalty_ledger: run('governance', 'src/revenue/royalty-ledger-test.ts'),
    total: 0,
    all_passing: false,
  };

  results.total = results.actor_protocol + results.governance + results.lucy
    + results.voice_capture + results.blessing_bridge + results.royalty_ledger;
  results.all_passing = results.total > 0 && [
    results.actor_protocol,
    results.governance,
    results.lucy,
    results.voice_capture,
    results.blessing_bridge,
    results.royalty_ledger,
  ].every(r => r > 0);

  return results;
}

// ─── GENERATOR ───────────────────────────────────────────

export function generateStandup(options?: { skipTests?: boolean }): StandupReport {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const runId = `standup-${dateStr}-${now.getTime()}`;

  const recentFiles = getRecentFiles(NOIZYLAB, 24);
  const built = recentFiles.slice(0, 20);

  const live: StandupItem[] = [];
  const services = [
    { name: 'Ollama', check: 'pgrep -f ollama' },
    { name: 'Voice Bridge', check: 'pgrep -f voice-bridge' },
    { name: 'GABRIEL Daemon', check: 'pgrep -f gabriel' },
    { name: 'NOIZYVOX Engine', check: 'pgrep -f noizyvox' },
    { name: 'DreamChamber', check: 'pgrep -f dreamchamber' },
    { name: 'n8n', check: 'pgrep -f n8n' },
  ];
  for (const svc of services) {
    try {
      execSync(svc.check, { encoding: 'utf-8', timeout: 3000 });
      live.push({ description: `${svc.name} — running` });
    } catch { /* not running */ }
  }

  const lucySummary = getLucySummary();
  const voiceSummary = getVoiceCaptureSummary();
  const testResults = options?.skipTests ? {
    actor_protocol: 0, governance: 0, lucy: 0,
    voice_capture: 0, blessing_bridge: 0, royalty_ledger: 0,
    total: 0, all_passing: false,
  } : runTestSuites();

  const nextMoves: string[] = [];
  if (voiceSummary.sessions_ready_for_blessing > 0) {
    nextMoves.push(`Bless ${voiceSummary.sessions_ready_for_blessing} voice capture session(s) ready for review`);
  }
  if (lucySummary && lucySummary.opportunities_found > 0) {
    nextMoves.push(`Review ${lucySummary.opportunities_found} Lucy-identified opportunities`);
  }
  const pendingDecisions = getDecisionQueueCount();
  if (pendingDecisions > 0) {
    nextMoves.push(`Resolve ${pendingDecisions} pending decision(s) in queue`);
  }
  if (nextMoves.length < 3) {
    nextMoves.push('Continue NOIZY infrastructure build — upgrade and improve');
  }
  if (nextMoves.length < 3) {
    nextMoves.push('Execute next priority from DreamChamber session');
  }

  return {
    date: dateStr,
    generated_at: now.toISOString(),
    run_id: runId,
    built_overnight: built,
    live_now: live,
    blocked: detectBlocked(),
    next_three_moves: nextMoves.slice(0, 3),
    system_health: getSystemHealth(),
    decision_queue_count: pendingDecisions,
    blessed_count_24h: getBlessedCount24h(),
    lucy_summary: lucySummary,
    voice_capture_summary: voiceSummary,
    test_results: testResults,
  };
}

// ─── WRITE TO MARKDOWN ───────────────────────────────────

export function writeStandupMarkdown(report: StandupReport): string {
  const lines: string[] = [
    `# NOIZY.AI Daily Standup — ${report.date}`,
    ``,
    `**Generated**: ${report.generated_at}`,
    `**Run ID**: ${report.run_id}`,
    ``,
    `---`,
    ``,
  ];

  if (report.test_results.total > 0) {
    const t = report.test_results;
    lines.push(`## Test Suite — ${t.total} tests ${t.all_passing ? 'ALL PASSING' : 'FAILURES DETECTED'}`, '');
    lines.push(`| Package | Tests |`);
    lines.push(`|---------|-------|`);
    lines.push(`| Actor Protocol | ${t.actor_protocol} |`);
    lines.push(`| Governance OS | ${t.governance} |`);
    lines.push(`| Lucy Nightly | ${t.lucy} |`);
    lines.push(`| Voice Capture | ${t.voice_capture} |`);
    lines.push(`| Blessing Bridge | ${t.blessing_bridge} |`);
    lines.push(`| Royalty Ledger | ${t.royalty_ledger} |`);
    lines.push(`| **TOTAL** | **${t.total}** |`);
    lines.push('');
  }

  if (report.lucy_summary) {
    const l = report.lucy_summary;
    lines.push(`## Lucy Nightly — ${l.report_date}`, '');
    lines.push(`- Opportunities: ${l.opportunities_found} (${l.compassion_cleared} compassion-cleared)`);
    lines.push(`- Risks detected: ${l.risks_detected}`);
    lines.push(`- n8n actions queued: ${l.n8n_actions_queued}`);
    lines.push('');
  }

  const v = report.voice_capture_summary;
  if (v.total_sessions > 0) {
    lines.push(`## Voice Capture`, '');
    lines.push(`- Sessions: ${v.completed_sessions}/${v.total_sessions} completed`);
    lines.push(`- Takes recorded: ${v.total_takes_recorded}`);
    lines.push(`- Ready for blessing: ${v.sessions_ready_for_blessing}`);
    lines.push('');
  }

  lines.push(`## Built Overnight`, '');
  if (report.built_overnight.length === 0) {
    lines.push('No file changes in the last 24 hours.');
  } else {
    for (const item of report.built_overnight) {
      lines.push(`- \`${item.description}\` (${item.timestamp?.split('T')[1]?.slice(0, 8) || ''})`);
    }
  }

  lines.push('', '## Live Now', '');
  if (report.live_now.length === 0) {
    lines.push('No services detected running.');
  } else {
    for (const item of report.live_now) {
      lines.push(`- ${item.description}`);
    }
  }

  lines.push('', '## Blocked', '');
  if (report.blocked.length === 0) {
    lines.push('Nothing blocked.');
  } else {
    for (const item of report.blocked) {
      lines.push(`- **${item.description}** — ${item.reason} [requires: ${item.requires}]`);
    }
  }

  lines.push('', '## Next 3 Moves', '');
  for (let i = 0; i < report.next_three_moves.length; i++) {
    lines.push(`${i + 1}. ${report.next_three_moves[i]}`);
  }

  lines.push('', '## System Health', '');
  const h = report.system_health;
  lines.push(`- **Ollama**: ${h.ollama_status} (${h.ollama_models} models)`);
  lines.push(`- **Gabriel DB**: ${h.gabriel_db_size}`);
  lines.push(`- **Voice Pipeline**: ${h.voice_pipeline}`);
  lines.push(`- **Disk Available**: ${h.disk_available}`);
  lines.push(`- **Decisions Pending**: ${report.decision_queue_count}`);
  lines.push(`- **Blessed (24h)**: ${report.blessed_count_24h}`);

  lines.push('', '---', '', '*Capture writes files. Humans bless memory. Gabriel only sees blessed truth.*');

  const md = lines.join('\n');

  if (!existsSync(STANDUP_DIR)) {
    mkdirSync(STANDUP_DIR, { recursive: true });
  }
  const filepath = join(STANDUP_DIR, `${report.date}.md`);
  writeFileSync(filepath, md);

  return filepath;
}

// ─── CLI ENTRY ───────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Generating NOIZY.AI Daily Standup v2.0...\n');
  const report = generateStandup();
  const filepath = writeStandupMarkdown(report);
  console.log(JSON.stringify(report, null, 2));
  console.log(`\nStandup written to: ${filepath}`);
}
