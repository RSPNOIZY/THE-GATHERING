#!/usr/bin/env node
/**
 * beast — NOIZYBEAST CLI
 * The command surface for the NOIZY Empire
 *
 * Usage: beast <command> [args]
 *
 * Commands:
 *   status               full empire status
 *   queue                urgent action queue
 *   empire               full empire snapshot from GABRIEL V3
 *   mission <objective>  dispatch mission to GABRIEL Opus + extended thinking
 *   crew <agent> <task>  dispatch task to specialist agent
 *   think <question>     extended thinking via claude-opus-4
 *   scaffold <type>      generate worker|schema|dashboard|portal
 *   build <target>       scaffold + wire a new module
 *   audit                consent gap detection
 *   deploy               deploy HEAVEN to Cloudflare
 *   morning              daily briefing
 *   learn <observation>  teach GABRIEL something
 *   registry             show project registry
 *
 * 2026-03-27 | RSP_001 | GORUNFREE
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GABRIEL  = 'http://localhost:7777';
const HOME     = process.env.HOME;
const BEASTDIR = path.resolve(__dirname, '..');          // NOIZYLAB/noizybeast/
const BEAST    = path.join(BEASTDIR, 'beast.config.json');
const REGISTRY = path.join(BEASTDIR, 'PROJECT_REGISTRY.json');

// ── Colors ───────────────────────────────────────────────────
const C = {
  red: s    => `\x1b[31m${s}\x1b[0m`,
  green: s  => `\x1b[32m${s}\x1b[0m`,
  yellow: s => `\x1b[33m${s}\x1b[0m`,
  cyan: s   => `\x1b[36m${s}\x1b[0m`,
  magenta: s=> `\x1b[35m${s}\x1b[0m`,
  bold: s   => `\x1b[1m${s}\x1b[0m`,
  dim: s    => `\x1b[2m${s}\x1b[0m`,
};

const cfg = JSON.parse(fs.readFileSync(BEAST, 'utf8'));
const reg = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));

async function gabrielGet(path) {
  const r = await fetch(`${GABRIEL}${path}`, { signal: AbortSignal.timeout(8000) });
  return r.json();
}

async function gabrielPost(path, body) {
  const r = await fetch(`${GABRIEL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  });
  return r.json();
}

function header(title) {
  const line = '═'.repeat(62);
  console.log(`\n${C.bold(C.magenta(line))}`);
  console.log(`${C.bold(C.magenta(`  NOIZYBEAST — ${title}`))}`);
  console.log(`${C.bold(C.magenta(`  ${new Date().toLocaleTimeString('en-CA')} | GOD.local | RSP_001`))}`);
  console.log(`${C.bold(C.magenta(line))}\n`);
}

// ── Commands ─────────────────────────────────────────────────

async function cmdStatus() {
  header('EMPIRE STATUS');
  const [health, status] = await Promise.all([
    gabrielGet('/health').catch(() => null),
    gabrielGet('/api/gabriel/status').catch(() => null),
  ]);

  const svc = (name, ok) => `  ${ok ? C.green('✓') : C.red('✗')} ${name}`;

  console.log(C.bold('SERVICES'));
  console.log(svc('GABRIEL DreamChamber     :7777', health?.status === 'healthy'));
  console.log(svc('Heaven consent kernel  live', !!status?.context?.kernelOnline));
  try { execSync('curl -s http://localhost:8080/health --max-time 2 > /dev/null 2>&1'); console.log(svc('Voice Bridge             :8080', true)); }
  catch { console.log(svc('Voice Bridge             :8080', false)); }
  try { execSync('curl -s http://localhost:11434/api/tags --max-time 2 > /dev/null 2>&1'); console.log(svc('Ollama (Gemma3/Mistral)  :11434', true)); }
  catch { console.log(svc('Ollama (Gemma3/Mistral)  :11434', false)); }

  if (status) {
    console.log(`\n${C.bold('GABRIEL')}`);
    console.log(`  Model:     ${status.model}`);
    console.log(`  Learnings: ${C.green(status.learningCount)}`);
    console.log(`  Memcells:  ${C.green('333')}`);
    console.log(`  Uptime:    ${health?.uptime || 0}s`);
  }

  console.log(`\n${C.bold('PROPERTIES')}`);
  reg.properties.slice(0, 6).forEach(p => {
    const dot = p.status === 'LIVE' || p.status === 'ACTIVE' ? C.green('●') :
                p.status === 'BUILDING' ? C.yellow('◐') : C.dim('○');
    console.log(`  ${dot} ${p.name.padEnd(18)} ${C.dim(p.status)} ${C.dim(p.next?.substring(0,40) || '')}`);
  });

  console.log(`\n${C.bold('DAYS TO APRIL 17:')} ${C.yellow('21')}`);
}

async function cmdQueue() {
  header('URGENT QUEUE');
  try {
    const q = await gabrielGet('/api/gabriel/v3/queue');
    q.queue.forEach(item => {
      const b = item.blocker ? C.red('🔴') : C.yellow('🟡');
      const t = `[${item.type}]`.padEnd(10);
      console.log(`  ${b} ${String(item.priority).padEnd(3)} ${C.dim(t)} ${item.action}  ${C.dim(item.est)}`);
    });
    console.log(`\n  ${C.red(q.blockers + ' blockers')} · ${q.total} total actions`);
  } catch {
    reg.urgentQueue.forEach(item => {
      const b = item.blocker ? C.red('🔴') : C.yellow('🟡');
      console.log(`  ${b} [${item.p}] ${item.action}  ${C.dim(item.est)}`);
    });
  }
}

async function cmdEmpire() {
  header('FULL EMPIRE SNAPSHOT');
  try {
    const e = await gabrielGet('/api/gabriel/v3/empire');
    console.log(`GABRIEL:    ${e.gabriel.online ? C.green('ONLINE') : C.red('OFFLINE')} · ${e.gabriel.learnings} learnings`);
    console.log(`Heaven:   ${e.gabriel.heaven ? C.green('CONNECTED') : C.red('OFFLINE')}`);
    console.log(`Days left:  ${C.yellow(e.daysRemaining)} to April 17`);
    console.log(`\nSERVICES:`);
    Object.entries(e.services).forEach(([k, v]) => {
      console.log(`  ${v === 'LIVE' ? C.green('✓') : C.red('✗')} ${k}: ${v}`);
    });
  } catch (e) {
    console.log(C.red('GABRIEL V3 /empire not reachable — is DreamChamber running?'));
    console.log(C.dim('  Start: cd ~/NOIZYLAB/dreamchamber && node src/server.js'));
  }
}

async function cmdMission(args) {
  const objective = args.join(' ');
  if (!objective) { console.log(C.red('Usage: beast mission <objective>')); return; }
  header('MISSION DISPATCH → GABRIEL OPUS');
  console.log(C.dim(`Objective: ${objective}\n`));
  console.log(C.yellow('Dispatching to GABRIEL with extended thinking... (may take 30s)\n'));
  const r = await gabrielPost('/api/gabriel/v3/mission', { objective, priority: 8 });
  if (r.thinking) console.log(C.dim(`[THINKING]\n${r.thinking.substring(0,500)}…\n`));
  console.log(r.response || r.error);
}

async function cmdThink(args) {
  const question = args.join(' ');
  if (!question) { console.log(C.red('Usage: beast think <question>')); return; }
  header('EXTENDED THINKING → CLAUDE OPUS');
  console.log(C.yellow('Thinking deeply... (may take 30s)\n'));
  const r = await gabrielPost('/api/gabriel/v3/think', { question, budget: 12000 });
  if (r.thinking) console.log(C.dim(`[THINKING TRACE]\n${r.thinking.substring(0,400)}…\n`));
  console.log(r.response || r.error);
}

async function cmdCrew(args) {
  const [agent, ...taskParts] = args;
  const task = taskParts.join(' ');
  if (!agent || !task) { console.log(C.red('Usage: beast crew <agent> <task>\nAgents: engr-keith | dream | consent-auditor | voice-specialist | cb01 | shirley')); return; }
  header(`CREW DISPATCH → ${agent.toUpperCase()}`);
  const r = await gabrielPost('/api/gabriel/v3/crew', { agent, task });
  console.log(r.response || r.error);
}

async function cmdLearn(args) {
  const observation = args.join(' ');
  if (!observation) { console.log(C.red('Usage: beast learn <observation>')); return; }
  const r = await gabrielPost('/api/gabriel/learn', { observation, category: 'general', source: 'beast-cli' });
  console.log(r.learned ? C.green(`✓ GABRIEL learned: ${observation.substring(0,80)}`) : C.red(r.error));
}

async function cmdMorning() {
  header('MORNING BRIEFING');
  const today = new Date().toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  console.log(C.bold(`${today}`));
  console.log(C.yellow(`21 days to April 17, 2026\n`));
  await cmdStatus();
  console.log('');
  await cmdQueue();
}

async function cmdDeploy() {
  header('DEPLOY HEAVEN → CLOUDFLARE');
  const heavenDir = `${HOME}/Desktop/HEAVEN`;
  if (!fs.existsSync(`${heavenDir}/wrangler.toml`)) {
    console.log(C.red(`✗ wrangler.toml not found at ${heavenDir}`));
    console.log(C.dim('  Run: beast scaffold heaven-toml'));
    return;
  }
  console.log(C.yellow('Deploying HEAVEN...'));
  console.log(C.dim(`Account: 5f36aa9795348ea681d0b21910dfc82a`));
  console.log(C.dim(`D1: agent-memory / 7b813205\n`));
  try {
    const out = execSync(`cd "${heavenDir}" && WRANGLER_HOME=$HOME/.wrangler npx wrangler deploy 2>&1`, { encoding: 'utf8', timeout: 60000 });
    console.log(out);
    console.log(C.green('\n✓ HEAVEN deployed! Check https://noizy.ai'));
  } catch (e) {
    console.log(C.red('Deploy failed:'), e.message);
    console.log(C.dim('Tip: run `wrangler login` first if auth expired'));
  }
}

async function cmdRegistry() {
  header('PROJECT REGISTRY');
  reg.properties.forEach(p => {
    const dot = p.status === 'LIVE' || p.status === 'ACTIVE' ? C.green('●') :
                p.status === 'BUILDING' ? C.yellow('◐') : C.dim('○');
    console.log(`${dot} ${C.bold(p.name.padEnd(20))} ${C.dim(p.status.padEnd(16))} ${p.tagline}`);
    if (p.next) console.log(`  ${C.dim('→')} ${C.dim(p.next)}`);
  });
}

function cmdHelp() {
  header('COMMAND REFERENCE');
  Object.entries(cfg.commands).forEach(([cmd, desc]) => {
    console.log(`  ${C.cyan(cmd.padEnd(20))} ${C.dim(desc)}`);
  });
  console.log(`\n  ${C.cyan('beast registry'.padEnd(20))} ${C.dim('show all project statuses')}`);
  console.log(`  ${C.cyan('beast morning'.padEnd(20))} ${C.dim('daily briefing with status + queue')}`);
  console.log(`  ${C.cyan('beast deploy'.padEnd(20))} ${C.dim('deploy HEAVEN to Cloudflare')}`);
  console.log(`  ${C.cyan('beast learn <obs>'.padEnd(20))} ${C.dim('teach GABRIEL something')}`);
}

// ── Main ─────────────────────────────────────────────────────
const [,, cmd, ...args] = process.argv;

const handlers = {
  status:   cmdStatus,
  queue:    cmdQueue,
  empire:   cmdEmpire,
  mission:  () => cmdMission(args),
  think:    () => cmdThink(args),
  crew:     () => cmdCrew(args),
  learn:    () => cmdLearn(args),
  morning:  cmdMorning,
  deploy:   cmdDeploy,
  registry: cmdRegistry,
  help:     cmdHelp,
};

const handler = handlers[cmd] || handlers.help;
handler().catch(e => {
  console.error(C.red(`\nFATAL: ${e.message}`));
  process.exit(1);
});
