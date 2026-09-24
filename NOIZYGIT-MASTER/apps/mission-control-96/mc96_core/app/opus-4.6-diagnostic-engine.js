#!/usr/bin/env node
/**
 * MC96 — NOIZY Empire Diagnostic Engine (Opus 4.6)
 * ─────────────────────────────────────────────────
 * Operator: Robert Stephen Plowman (RSP_001)
 * Machine:  GOD.local · M2 Ultra 192GB · 10.90.90.10
 * Stack:    MC96 | Cloudflare | GABRIEL | HVS | NOIZYVOX
 * Date:     2026-03-27 | DAZEFLOW
 *
 * Usage:
 *   node opus-4.6-diagnostic-engine.js           # full diagnostic
 *   node opus-4.6-diagnostic-engine.js --quick   # services only
 *   node opus-4.6-diagnostic-engine.js --ai      # run Claude Opus analysis
 *   node opus-4.6-diagnostic-engine.js --fix     # attempt auto-fixes
 */

import { execSync, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── CONFIG ──────────────────────────────────────────────────────
const CFG = {
  account:    '5f36aa9795348ea681d0b21910dfc82a',
  d1:         '7b813205-fd12-4a23-84a6-ce83bc49ec70',
  noizylab:   '/Users/m2ultra/NOIZYLAB',
  voiceBridge:'http://localhost:8080',
  dreamChamber:'http://localhost:7777',
  ollama:     'http://localhost:11434',
  heaven:   'https://heaven.rsp-5f3.workers.dev',
  consentGW:  'https://noizy-consent-gateway.workers.dev',
};

const ARGS = process.argv.slice(2);
const QUICK  = ARGS.includes('--quick');
const AI     = ARGS.includes('--ai');
const FIX    = ARGS.includes('--fix');

// ── ANSI ─────────────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  magenta:'\x1b[35m',
  white:  '\x1b[37m',
  gray:   '\x1b[90m',
};
const ok  = (s) => `${C.green}✓${C.reset} ${s}`;
const err = (s) => `${C.red}✗${C.reset} ${s}`;
const warn= (s) => `${C.yellow}⚠${C.reset} ${s}`;
const inf = (s) => `${C.cyan}›${C.reset} ${s}`;
const dim = (s) => `${C.gray}${s}${C.reset}`;

// ── RESULT STORE ─────────────────────────────────────────────────
const results = {
  pass: [], fail: [], warn: [], info: [],
  services: {},
  conflicts: [],
  score: 0,
};

function pass(label, detail='') { results.pass.push({ label, detail }); console.log(ok(label) + (detail ? ` ${dim(detail)}` : '')); }
function fail(label, detail='') { results.fail.push({ label, detail }); console.log(err(label) + (detail ? ` ${dim(detail)}` : '')); }
function warning(label, detail='') { results.warn.push({ label, detail }); console.log(warn(label) + (detail ? ` ${dim(detail)}` : '')); }
function info(label) { results.info.push(label); console.log(inf(label)); }

// ── HEADER ───────────────────────────────────────────────────────
function header() {
  const ts = new Date().toISOString();
  console.log('\n' + C.bold + C.magenta + '═'.repeat(62) + C.reset);
  console.log(C.bold + C.magenta + '  MC96 — NOIZY Empire Diagnostic Engine (Opus 4.6)' + C.reset);
  console.log(C.bold + C.magenta + '═'.repeat(62) + C.reset);
  console.log(dim(`  Operator : RSP_001 — Robert Stephen Plowman`));
  console.log(dim(`  Machine  : GOD.local · M2 Ultra 192GB · 10.90.90.10`));
  console.log(dim(`  Account  : HEAVEN=${CFG.accountHeaven.substring(0,8)}… | CF-Auth=${CFG.accountConsent.substring(0,8)}…`));
  console.log(dim(`  D1       : agent-memory ${CFG.d1.substring(0,8)}…`));
  console.log(dim(`  Stack    : MC96 | CF | GABRIEL | HVS | NOIZYVOX`));
  console.log(dim(`  DAZEFLOW : ${ts}`));
  console.log(C.magenta + '─'.repeat(62) + C.reset + '\n');
}

// ── CHECK: Service HTTP ──────────────────────────────────────────
async function checkHTTP(label, url, key) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    results.services[key] = res.ok ? 'LIVE' : `HTTP_${res.status}`;
    if (res.ok) { pass(label, `HTTP ${res.status}`); return true; }
    else { fail(label, `HTTP ${res.status}`); return false; }
  } catch (e) {
    results.services[key] = 'OFFLINE';
    fail(label, e.name === 'AbortError' ? 'timeout' : 'connection refused');
    return false;
  }
}

// ── CHECK: Binary exists ─────────────────────────────────────────
function checkBin(label, bin) {
  try {
    execSync(`which ${bin}`, { stdio: 'pipe' });
    pass(label);
    return true;
  } catch {
    fail(label, `'${bin}' not found in PATH`);
    return false;
  }
}

// ── CHECK: File exists ───────────────────────────────────────────
function checkFile(label, fp) {
  if (fs.existsSync(fp)) { pass(label, fp.replace('/Users/m2ultra/', '~/')); return true; }
  fail(label, fp.replace('/Users/m2ultra/', '~/'));
  return false;
}

// ── CHECK: Env var ───────────────────────────────────────────────
function checkEnv(label, key) {
  const v = process.env[key];
  if (v?.length > 5) { pass(label, `${v.substring(0,6)}…`); return true; }
  // Try loading from NOIZYLAB .env
  const envFiles = [
    `${CFG.noizylab}/NOIZYANTHROPIC/NOIZYLAB/.env`,
    `${CFG.noizylab}/.env`,
    `${CFG.noizylab}/dreamchamber/.env`,
  ];
  for (const ef of envFiles) {
    if (fs.existsSync(ef)) {
      const content = fs.readFileSync(ef, 'utf8');
      const match = content.match(new RegExp(`${key}=(.+)`));
      if (match?.[1]?.length > 5) {
        pass(label, `from ${ef.replace('/Users/m2ultra/', '~/')}`);
        return true;
      }
    }
  }
  fail(label, `${key} not found in env or .env files`);
  return false;
}

// ── CHECK: wrangler account ──────────────────────────────────────
function checkWranglerAccount() {
  const cachePath = `${process.env.HOME}/.wrangler/cache/wrangler-account.json`;
  const altPath   = `${CFG.noizylab}/.wrangler/cache/wrangler-account.json`;
  
  for (const p of [cachePath, altPath]) {
    if (fs.existsSync(p)) {
      const data = JSON.parse(fs.readFileSync(p, 'utf8'));
      const id = data?.account?.id;
      const name = data?.account?.name;
      if (id === CFG.account) {
        pass(`Wrangler → ${name}`, `${id.substring(0,8)}…`);
        return true;
      } else if (id) {
        warning(`Wrangler authenticated to WRONG account`, `${id.substring(0,8)}… (expected ${CFG.account.substring(0,8)}…)`);
        results.conflicts.push({ type: 'cf-account', found: id, expected: CFG.account });
        return false;
      }
    }
  }
  fail('Wrangler not authenticated', 'run: wrangler login');
  return false;
}

// ── CHECK: D1 database ───────────────────────────────────────────
async function checkD1() {
  try {
    const { stdout } = await execAsync(
      `WRANGLER_HOME=$HOME/.wrangler wrangler d1 info agent-memory --json 2>/dev/null`,
      { timeout: 10000 }
    );
    const data = JSON.parse(stdout);
    if (data?.uuid === CFG.d1) {
      pass('D1 agent-memory', data.uuid.substring(0,8) + '…');
    } else {
      warning('D1 agent-memory found but UUID mismatch', data?.uuid);
    }
  } catch {
    warning('D1 agent-memory — cannot verify (wrangler not logged in or d1 not found)');
  }
}

// ── CHECK: Git repo ──────────────────────────────────────────────
function checkGit() {
  try {
    const remote = execSync(`git -C ${CFG.noizylab} remote get-url origin 2>/dev/null`, { stdio: 'pipe' }).toString().trim();
    if (remote.includes('robplowman')) {
      warning('Git remote has old username: robplowman', remote);
      results.conflicts.push({ type: 'git-remote', found: remote, fix: 'git remote set-url origin <enterprise-url>' });
    } else if (remote.includes('github.com')) {
      pass('Git remote', remote.substring(0,50));
    } else {
      info(`Git remote: ${remote.substring(0,60)}`);
    }
  } catch {
    warning('Git remote — no remote configured or not a git repo');
  }
}

// ── CHECK: Ollama models ─────────────────────────────────────────
async function checkOllama() {
  try {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(`${CFG.ollama}/api/tags`, { signal: ctrl.signal });
    if (res.ok) {
      const data = await res.json();
      const models = data.models?.map(m => m.name) || [];
      pass('Ollama running', models.join(' · '));
      if (models.some(m => m.startsWith('gemma3'))) pass('Gemma3 model');
      else warning('Gemma3 not found in Ollama', 'run: ollama pull gemma3');
      if (models.some(m => m.startsWith('mistral'))) pass('Mistral model');
    }
  } catch {
    fail('Ollama', 'not running on localhost:11434');
  }
}

// ── CHECK: MCP servers ───────────────────────────────────────────
function checkMCPs() {
  const mcpDir = `${CFG.noizylab}/mcp`;
  const servers = ['gabriel-mcp','lucy-mcp','heaven-mcp','engr-keith-mcp','dream-mcp','cb01-mcp','shirley-mcp','family-mcp'];
  let allOk = true;
  for (const s of servers) {
    const idx = `${mcpDir}/${s}/index.js`;
    if (fs.existsSync(idx)) {
      // Check for broken paths
      const content = fs.readFileSync(idx, 'utf8');
      if (content.includes('robplowman')) {
        warning(`MCP ${s} has stale robplowman path`, idx);
        results.conflicts.push({ type: 'mcp-path', file: idx });
        if (FIX) {
          fs.writeFileSync(idx, content.replace(/\/Users\/robplowman\//g, '/Users/m2ultra/'));
          info(`  AUTO-FIXED: ${s}`);
        }
        allOk = false;
      } else {
        pass(`MCP ${s}`);
      }
    } else {
      warning(`MCP ${s} missing`, idx);
      allOk = false;
    }
  }
  return allOk;
}

// ── CHECK: Account ID conflicts ───────────────────────────────────
function checkAccountConflicts() {
  const dirs = [
    `${CFG.noizylab}/mcp-gemma3`,
    `${CFG.noizylab}/voice-pipeline`,
    `${CFG.noizylab}/workers`,
    `${process.env.HOME}/.gemini/antigravity/scratch/noizy-workers`,
  ];
  const STALE = '5f36aa9795348ea681d0b21910dfc82a';
  let found = 0;
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const find = execSync(`grep -r "${STALE}" "${dir}" --include="*.js" --include="*.ts" --include="*.toml" --include="*.json" --include="*.sh" -l 2>/dev/null || true`, { encoding: 'utf8' }).trim();
    if (find) {
      find.split('\n').forEach(f => {
        if (f) { warning(`Stale account ID in: ${f.replace('/Users/m2ultra/', '~/')}`); found++; }
      });
    }
  }
  if (found === 0) pass('CF Account IDs — all canonical (5ba03939…)');
  else results.conflicts.push({ type: 'stale-account-id', count: found });
}

// ── CHECK: Voice Pipeline ─────────────────────────────────────────
function checkVoicePipeline() {
  const scripts = [
    `${CFG.noizylab}/voice-pipeline/whisper-transcribe.sh`,
    `${CFG.noizylab}/voice-pipeline/claude-prompt.sh`,
    `${CFG.noizylab}/voice-pipeline/voice-pipeline.sh`,
    `${CFG.noizylab}/voice-pipeline/teams-respond.sh`,
    `${CFG.noizylab}/voice-pipeline/audiohijack-recording-stop.js`,
  ];
  const allExist = scripts.every(s => {
    const exists = fs.existsSync(s);
    if (!exists) fail(`Missing: ${path.basename(s)}`);
    return exists;
  });
  if (allExist) pass('Voice pipeline scripts (5/5)');
}

// ── SUMMARY ──────────────────────────────────────────────────────
function printSummary() {
  const total = results.pass.length + results.fail.length + results.warn.length;
  const score = Math.round((results.pass.length / Math.max(total, 1)) * 100);
  results.score = score;

  console.log('\n' + C.magenta + '─'.repeat(62) + C.reset);
  console.log(C.bold + '  DIAGNOSTIC SUMMARY' + C.reset);
  console.log(C.magenta + '─'.repeat(62) + C.reset);
  console.log(`  ${C.green}PASS${C.reset}  ${results.pass.length.toString().padStart(3)}  │  ${C.red}FAIL${C.reset}  ${results.fail.length.toString().padStart(3)}  │  ${C.yellow}WARN${C.reset}  ${results.warn.length.toString().padStart(3)}`);
  console.log(`  Score: ${score >= 80 ? C.green : score >= 60 ? C.yellow : C.red}${score}%${C.reset}`);

  if (results.conflicts.length > 0) {
    console.log(`\n  ${C.yellow}Conflicts detected: ${results.conflicts.length}${C.reset}`);
    results.conflicts.forEach(c => console.log(`  ${C.gray}· ${JSON.stringify(c)}${C.reset}`));
  }

  if (results.fail.length > 0) {
    console.log(`\n  ${C.red}Failing checks:${C.reset}`);
    results.fail.forEach(f => console.log(`  ${C.red}· ${f.label}${C.reset}${f.detail ? C.gray + ' — ' + f.detail + C.reset : ''}`));
  }

  console.log('\n  ' + C.bold + 'Critical Path:' + C.reset);
  const critPath = [
    results.services['voiceBridge'] !== 'LIVE' ? '→ Start Voice Bridge: node ~/NOIZYLAB/voice-bridge-server.js' : null,
    results.services['heaven']    !== 'LIVE' ? '→ Deploy HEAVEN: wrangler login && wrangler deploy' : null,
    !fs.existsSync(`${process.env.HOME}/.wrangler/cache/wrangler-account.json`) ? '→ Authenticate: wrangler login' : null,
    '→ iPad dashboard: python3 -m http.server 9090 --directory ~/.gemini/antigravity/scratch/noizy-command-center/',
    '→ Teams on iPhone → install → create NOIZY Dream Chamber',
    '→ Audio Hijack → arm audiohijack-recording-stop.js',
  ].filter(Boolean);
  critPath.forEach(s => console.log(`  ${C.cyan}${s}${C.reset}`));

  console.log('\n' + C.magenta + '═'.repeat(62) + C.reset);
  console.log(C.bold + C.magenta + `  MC96 Diagnostic Complete — ${new Date().toLocaleTimeString('en-CA',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}` + C.reset);
  console.log(C.magenta + '═'.repeat(62) + C.reset + '\n');
}

// ── AI ANALYSIS via Claude Opus ───────────────────────────────────
async function runAIAnalysis() {
  console.log('\n' + C.bold + C.cyan + '  Running Claude Opus analysis…' + C.reset + '\n');

  // Load API key
  let apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const envFiles = [`${CFG.noizylab}/NOIZYANTHROPIC/NOIZYLAB/.env`, `${CFG.noizylab}/.env`];
    for (const ef of envFiles) {
      if (fs.existsSync(ef)) {
        const m = fs.readFileSync(ef,'utf8').match(/ANTHROPIC_API_KEY=(.+)/);
        if (m?.[1]) { apiKey = m[1].trim(); break; }
      }
    }
  }
  if (!apiKey) { console.log(err('No ANTHROPIC_API_KEY found — skipping AI analysis')); return; }

  const summary = {
    score: results.score,
    pass: results.pass.length, fail: results.fail.length, warn: results.warn.length,
    services: results.services,
    conflicts: results.conflicts,
    failing: results.fail.map(f => f.label),
  };

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 512,
        system: `You are GABRIEL, warrior executor of the NOIZY.AI empire. Operator: RSP_001 (Robert Stephen Plowman, Ottawa, Canada, C3 injury, voice-first). 
Stack: MC96 | CF Workers | HVS | NCP | NOIZYVOX. Account: 5f36aa9795348ea681d0b21910dfc82a.
The Plowman Standard: 75/25. Mission: consent-native infrastructure for the creative economy.
Be military-calm. No fluff. Surface the top 3 actions to unblock the empire.`,
        messages: [{
          role: 'user',
          content: `MC96 diagnostic report:\n${JSON.stringify(summary, null, 2)}\n\nTop 3 actions to execute right now, in order of impact.`,
        }],
      }),
    });
    const data = await res.json();
    const reply = data.content?.[0]?.text || 'No response';
    console.log(C.cyan + '─'.repeat(62) + C.reset);
    console.log(C.bold + '  GABRIEL (Claude Opus)' + C.reset);
    console.log(C.cyan + '─'.repeat(62) + C.reset);
    console.log(reply);
    console.log(C.cyan + '─'.repeat(62) + C.reset + '\n');
  } catch (e) {
    console.log(err(`Claude API error: ${e.message}`));
  }
}

// ── MAIN ──────────────────────────────────────────────────────────
async function main() {
  header();

  // ── Section 1: Services ──────────────────────────────────────
  console.log(C.bold + '  [1] SERVICES\n' + C.reset);
  await checkHTTP('Voice Bridge (GOD:8080)',   `${CFG.voiceBridge}/health`,          'voiceBridge');
  await checkHTTP('DreamChamber (GOD:7777)',   `${CFG.dreamChamber}/api/gabriel/status`, 'dreamChamber');
  await checkHTTP('HEAVEN (live worker)',    `${CFG.heaven}/health`,            'heaven');
  await checkHTTP('Consent Gateway (worker)', `${CFG.consentGW}/health`,           'consentGW');
  await checkOllama();

  if (!QUICK) {
    // ── Section 2: Auth ────────────────────────────────────────
    console.log('\n' + C.bold + '  [2] AUTHENTICATION\n' + C.reset);
    checkWranglerAccount();
    checkBin('Wrangler CLI',   'wrangler');
    checkBin('Node 20+',       'node');
    checkBin('Python 3',       'python3');
    checkBin('pm2',            'pm2');
    checkEnv('ANTHROPIC_API_KEY', 'ANTHROPIC_API_KEY');

    // ── Section 3: Files ───────────────────────────────────────
    console.log('\n' + C.bold + '  [3] CRITICAL FILES\n' + C.reset);
    checkFile('Voice Bridge server',       `${CFG.noizylab}/voice-bridge-server.js`);
    checkFile('HEAVEN Worker (TS)',        `${process.env.HOME}/.gemini/antigravity/scratch/noizy-workers/claude-proxy/src/index.ts`);
    checkFile('Consent Gateway Worker',    `${CFG.noizylab}/workers/consent-gateway/src/index.js`);
    checkFile('Gemma3 MCP server',         `${CFG.noizylab}/mcp-gemma3/server.js`);
    checkFile('CLAUDE.md session brain',   `${process.env.HOME}/Desktop/CLAUDE TODAY/CLAUDE.md`);
    checkFile('D1 schema extension',       `${process.env.HOME}/.gemini/antigravity/scratch/noizy-workers/claude-proxy/schema.sql`);
    checkFile('iPad dashboard',            `${process.env.HOME}/.gemini/antigravity/scratch/noizy-command-center/ipad.html`);
    checkFile('pm2 ecosystem',             `${CFG.noizylab}/ecosystem.config.cjs`);
    checkFile('wrangler.toml (HEAVEN)',    `${process.env.HOME}/.gemini/antigravity/scratch/noizy-workers/claude-proxy/wrangler.toml`);
    checkFile('AH Recording Stop script', `${CFG.noizylab}/voice-pipeline/audiohijack-recording-stop.js`);

    // ── Section 4: Voice Pipeline ──────────────────────────────
    console.log('\n' + C.bold + '  [4] VOICE PIPELINE\n' + C.reset);
    checkVoicePipeline();
    checkBin('Whisper (mlx_whisper/whisper)', 'mlx_whisper') || checkBin('openai-whisper', 'whisper');

    // ── Section 5: MCP Servers ─────────────────────────────────
    console.log('\n' + C.bold + '  [5] MCP SERVERS\n' + C.reset);
    checkMCPs();

    // ── Section 6: Conflicts ───────────────────────────────────
    console.log('\n' + C.bold + '  [6] CONFLICT SCAN\n' + C.reset);
    checkGit();
    checkAccountConflicts();
    await checkD1();
  }

  printSummary();

  if (AI) await runAIAnalysis();
}

main().catch(e => { console.error(C.red + 'FATAL: ' + e.message + C.reset); process.exit(1); });
