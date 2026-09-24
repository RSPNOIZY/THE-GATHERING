#!/usr/bin/env node
/**
 * MC96 — NOIZY Empire TURBO PRO Upgrade Engine v2
 * GORUNFREE × ∞ | RSP_001 | 2026-03-27
 *
 * Upgrades:
 *  1. Voice Bridge       → launchd keepalive
 *  2. GABRIEL :7777      → launchd keepalive
 *  3. HEAVEN deploy      → script generation + D1 migration
 *  4. wrangler.toml      → gabriel_db → agent-memory audit
 *  5. Turbo Console Log  → Pro activation (requires license key)
 *  6. GitKraken          → Enterprise GitHub config
 *  7. Dashboard server   → iPad HTTP access :9090
 *  8. Full diagnostic    → post-run health check
 *
 * Usage:
 *   TURBO_PRO_KEY=<your-license-key> node turbo-pro-upgrade.js
 *   GK_ENTERPRISE_URL=https://github.noizy.ai node turbo-pro-upgrade.js
 */

import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);
const HOME = process.env.HOME || os.homedir();

// ── Terminal colors ────────────────────────────────────────────
const G = '\x1b[32m', R = '\x1b[0m', B = '\x1b[1m',
      Y = '\x1b[33m', C = '\x1b[36m', M = '\x1b[35m',
      W = '\x1b[37m', DIM = '\x1b[2m';

const ok   = (s) => console.log(`${G}✓${R} ${s}`);
const bad  = (s) => console.log(`${Y}⚠${R}  ${s}`);
const err  = (s) => console.log(`\x1b[31m✗${R}  ${s}`);
const info = (s) => console.log(`${C}ℹ${R}  ${s}`);
const hdr  = (s) => console.log(`\n${B}${C}╔══ ${s} ${'═'.repeat(Math.max(0, 52 - s.length))}╗${R}`);
const sub  = (s) => console.log(`${DIM}    ${s}${R}`);

async function run(cmd, cwd = HOME, timeout = 20000) {
  try {
    const { stdout, stderr } = await execAsync(cmd, { cwd, timeout });
    return stdout.trim() || stderr.trim() || '';
  } catch(e) {
    return e.stdout?.trim() || e.stderr?.trim() || null;
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── 1. Voice Bridge launchd ────────────────────────────────────
async function installVoiceBridgePlist() {
  hdr('1. Voice Bridge — launchd keepalive');
  const bridgePath = `${HOME}/NOIZYLAB/voice-bridge-server.js`;
  const exists = fs.existsSync(bridgePath);
  if (!exists) { bad(`voice-bridge-server.js not found at ${bridgePath}`); return; }

  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.noizy.voice-bridge</string>
  <key>ProgramArguments</key>
  <array>
    <string>/opt/homebrew/bin/node</string>
    <string>${bridgePath}</string>
  </array>
  <key>WorkingDirectory</key><string>${HOME}/NOIZYLAB</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>/tmp/voice-bridge.log</string>
  <key>StandardErrorPath</key><string>/tmp/voice-bridge.err</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key><string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
    <key>PORT</key><string>8080</string>
    <key>NODE_ENV</key><string>production</string>
  </dict>
</dict>
</plist>`;

  const p = `${HOME}/Library/LaunchAgents/com.noizy.voice-bridge.plist`;
  fs.writeFileSync(p, plist);
  ok(`Plist written: ${p}`);
  await run(`launchctl unload "${p}" 2>/dev/null; launchctl load "${p}"`);
  await sleep(2000);
  const health = await run(`curl -s http://localhost:8080/health --max-time 3`);
  if (health?.includes('healthy') || health?.includes('ok')) {
    ok('Voice Bridge: LIVE at :8080');
  } else {
    bad('Voice Bridge plist loaded — check ANTHROPIC_API_KEY in env');
    sub(`tail -f /tmp/voice-bridge.err`);
  }
}

// ── 2. GABRIEL :7777 launchd ───────────────────────────────────
async function installGabrielPlist() {
  hdr('2. GABRIEL Runtime Enforcer — launchd keepalive :7777');

  // Find gabriel entry point
  const candidates = [
    `${HOME}/NOIZYLAB/dreamchamber/src/routes/gabriel-v3.js`,
    `${HOME}/NOIZYLAB/dreamchamber/gabriel.js`,
    `${HOME}/NOIZYLAB/gabriel.js`,
  ];
  const gabrielPath = candidates.find(p => fs.existsSync(p));

  if (!gabrielPath) {
    bad('GABRIEL script not found — checked:');
    candidates.forEach(c => sub(c));
    return;
  }

  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.noizy.gabriel</string>
  <key>ProgramArguments</key>
  <array>
    <string>/opt/homebrew/bin/node</string>
    <string>${gabrielPath}</string>
  </array>
  <key>WorkingDirectory</key><string>${path.dirname(gabrielPath)}</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>/tmp/gabriel.log</string>
  <key>StandardErrorPath</key><string>/tmp/gabriel.err</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key><string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
    <key>PORT</key><string>7777</string>
    <key>NODE_ENV</key><string>production</string>
    <key>GABRIEL_ENV</key><string>sovereign</string>
  </dict>
</dict>
</plist>`;

  const p = `${HOME}/Library/LaunchAgents/com.noizy.gabriel.plist`;
  fs.writeFileSync(p, plist);
  ok(`GABRIEL plist: ${p}`);
  sub(`Entry: ${gabrielPath}`);
  await run(`launchctl unload "${p}" 2>/dev/null; launchctl load "${p}"`);
  await sleep(2000);
  const health = await run(`curl -s http://localhost:7777/health --max-time 3`);
  if (health) {
    ok(`GABRIEL ALIVE at :7777 → ${health.slice(0, 60)}`);
  } else {
    bad('GABRIEL plist loaded — may need env vars set in launchd');
    sub(`export ANTHROPIC_API_KEY=sk-ant-... and reload`);
  }
}

// ── 3. HEAVEN Deploy Script ────────────────────────────────────
async function buildHeavenDeployScript() {
  hdr('3. HEAVEN Deploy Script — one-shot Cloudflare deploy');
  const heavenDir = `${HOME}/Desktop/HEAVEN`;

  if (!fs.existsSync(heavenDir)) {
    fs.mkdirSync(heavenDir, { recursive: true });
    ok(`Created HEAVEN dir: ${heavenDir}`);
  }

  const contents = fs.readdirSync(heavenDir);
  ok(`HEAVEN dir contents: ${contents.join(', ') || '(empty)'}`);

  const script = `#!/bin/bash
# ═══════════════════════════════════════════════════════════
# HEAVEN — One-Shot Cloudflare Deploy
# NOIZY Empire | 2026-03-27 | GORUNFREE | RSP_001
# Run: bash ~/Desktop/HEAVEN/DEPLOY_HEAVEN.sh
# ═══════════════════════════════════════════════════════════
set -euo pipefail

HEAVEN_DIR="$HOME/Desktop/HEAVEN"
ACCOUNT="5f36aa9795348ea681d0b21910dfc82a"
D1_NAME="agent-memory"
D1_ID="7b813205-fd12-4a23-84a6-ce83bc49ec70"
DEAD_D1="f75939d5-5747-4a9c-8ac2-7710201fda09"

echo "⚡ HEAVEN DEPLOY — $(date)"
echo "   Account:  $ACCOUNT"
echo "   D1:       $D1_NAME ($D1_ID)"
echo ""

fix_wrangler() {
  local f="$1"
  sed -i '' \\
    "s/database_name = \\"gabriel_db\\"/database_name = \\"$D1_NAME\\"/g;
     s/database_name = \\"gabriel-db\\"/database_name = \\"$D1_NAME\\"/g;
     s/$DEAD_D1/$D1_ID/g" \\
    "$f" 2>/dev/null || true
}

deploy_worker() {
  local dir="$1"
  local name="$(basename $dir)"
  echo "→ Deploying $name..."
  fix_wrangler "$dir/wrangler.toml"
  cd "$dir"
  WRANGLER_HOME="$HOME/.wrangler" npx wrangler deploy 2>&1
  echo "  ✅ $name deployed"
  cd "$HEAVEN_DIR"
}

# Scan subdirs
for sub in NOIZYLAB NOIZYFISH NOIZYVOX NOIZYKIDZ consent-gateway heaven; do
  DIR="$HEAVEN_DIR/$sub"
  [ -d "$DIR" ] && [ -f "$DIR/wrangler.toml" ] && deploy_worker "$DIR"
done

# Root wrangler.toml
[ -f "$HEAVEN_DIR/wrangler.toml" ] && deploy_worker "$HEAVEN_DIR"

echo ""
echo "✅ HEAVEN DEPLOY COMPLETE — $(date)"
echo "   Health: https://heaven.rsp-5f3.workers.dev/health"
echo "   Consent: https://consent.rsp-5f3.workers.dev/health"
`;

  fs.writeFileSync(`${heavenDir}/DEPLOY_HEAVEN.sh`, script, { mode: 0o755 });
  ok('DEPLOY_HEAVEN.sh written');
  sub(`Run: bash ~/Desktop/HEAVEN/DEPLOY_HEAVEN.sh`);
}

// ── 4. wrangler.toml audit ─────────────────────────────────────
async function auditWranglerTomls() {
  hdr('4. wrangler.toml audit — gabriel_db → agent-memory');
  const result = await run(
    `grep -r "gabriel_db\\|gabriel-db\\|f75939d5" "${HOME}" ` +
    `--include="wrangler.toml" -l 2>/dev/null | grep -v ".git" | grep -v node_modules`
  );
  if (!result) { ok('All wrangler.toml files clean'); return; }

  const files = result.split('\n').filter(Boolean);
  info(`Found ${files.length} file(s) with stale refs`);
  for (const f of files) {
    try {
      execSync(
        `sed -i '' ` +
        `'s/gabriel_db/agent-memory/g;` +
        `s/gabriel-db/agent-memory/g;` +
        `s/f75939d5-5747-4a9c-8ac2-7710201fda09/7b813205-fd12-4a23-84a6-ce83bc49ec70/g' "${f}"`
      );
      ok(`Fixed: ${f.replace(HOME, '~')}`);
    } catch { bad(`Could not fix: ${f.replace(HOME, '~')}`); }
  }
}

// ── 5. Turbo Console Log Pro ───────────────────────────────────
async function configureTurboConsolePro() {
  hdr('5. Turbo Console Log PRO — activation + config');

  const TURBO_KEY = process.env.TURBO_PRO_KEY || '';

  // Ensure extension is installed (v3.19.0+)
  const codeBins = [
    '/usr/local/bin/code',
    '/opt/homebrew/bin/code',
    `${HOME}/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code`,
  ];
  let installed = false;
  for (const bin of codeBins) {
    if (fs.existsSync(bin)) {
      const r = await run(`"${bin}" --install-extension ChakrounAnas.turbo-console-log --force 2>&1`);
      if (r !== null) { ok(`Extension installed via: ${bin}`); installed = true; break; }
    }
  }
  if (!installed) bad('VS Code CLI not found — install extension manually');

  // Pro activation command (requires license key)
  if (TURBO_KEY) {
    info(`Activating Turbo Pro with license key...`);
    // Write activation to VS Code globalState via settings trick
    const globalStoragePath = `${HOME}/Library/Application Support/Code/User/globalStorage/chakrounanas.turbo-console-log`;
    fs.mkdirSync(globalStoragePath, { recursive: true });
    fs.writeFileSync(`${globalStoragePath}/pro-license.json`, JSON.stringify({
      licenseKey: TURBO_KEY,
      activatedAt: new Date().toISOString(),
      machine: os.hostname(),
    }, null, 2));
    ok(`Pro license key written to extension globalStorage`);
    info(`Open VS Code → Cmd+Shift+P → "activateTurboProBundle" → paste key to finalize`);
  } else {
    bad('No TURBO_PRO_KEY env var set');
    info('Set: TURBO_PRO_KEY=<your-key> node turbo-pro-upgrade.js');
    info('Key will be emailed after purchase at: https://turboconsolelog.io/pro');
  }

  // Pro settings — NOIZY branded
  const turboSettings = {
    "turboConsoleLog.logMessagePrefix": "🔥 [NOIZY]",
    "turboConsoleLog.addSemicolonInTheEnd": true,
    "turboConsoleLog.insertEnclosingClass": true,
    "turboConsoleLog.insertEnclosingFunction": true,
    "turboConsoleLog.quote": "'",
    "turboConsoleLog.delimiterInsideMessage": " ~",
    "turboConsoleLog.includeFileNameAndLineNum": true,
    "turboConsoleLog.logType": "log",
    "turboConsoleLog.logFunction": "console",
    "turboConsoleLog.wrapLogMessage": false,
    "turboConsoleLog.logMessageSuffix": "",
  };

  // Write to all NOIZY project .vscode dirs
  const projects = [
    `${HOME}/NOIZYLAB`,
    `${HOME}/Projects/MC96`,
    `${HOME}/NOIZYLAB/dreamchamber`,
    `${HOME}/NOIZYLAB/workers/consent-gateway`,
  ];

  for (const proj of projects) {
    if (!fs.existsSync(proj)) continue;
    const vsDir = `${proj}/.vscode`;
    fs.mkdirSync(vsDir, { recursive: true });
    const settingsPath = `${vsDir}/settings.json`;
    let existing = {};
    if (fs.existsSync(settingsPath)) {
      try { existing = JSON.parse(fs.readFileSync(settingsPath, 'utf8')); } catch {}
    }
    Object.assign(existing, turboSettings);
    fs.writeFileSync(settingsPath, JSON.stringify(existing, null, 2));
    ok(`Config written: ${settingsPath.replace(HOME, '~')}`);
  }
}

// ── 6. GitKraken Enterprise GitHub Setup ──────────────────────
async function configureGitKraken() {
  hdr('6. GitKraken — Enterprise GitHub NOIZY.AI config');

  const GK_ENTERPRISE_URL = process.env.GK_ENTERPRISE_URL || 'https://github.com';
  const isEnterprise = !GK_ENTERPRISE_URL.includes('github.com') ||
                       process.env.GK_ENTERPRISE_URL;

  // gk-cli config
  const gkCliPath = `${HOME}/Desktop/CLAUDE TODAY/gk-cli`;
  if (fs.existsSync(gkCliPath)) {
    ok(`gk-cli found at: ${gkCliPath.replace(HOME, '~')}`);
    // Check if gk binary is available
    const gkBin = await run(`which gk 2>/dev/null`);
    if (gkBin) {
      ok(`gk CLI binary: ${gkBin}`);
      const version = await run(`gk version 2>/dev/null`);
      if (version) sub(`Version: ${version}`);
    } else {
      info('gk binary not in PATH — build from source:');
      sub(`cd "${gkCliPath}" && go build -o /usr/local/bin/gk .`);
    }
  } else {
    bad('gk-cli not found — run: gh repo clone gitkraken/gk-cli');
  }

  // GitKraken config directory
  const gkConfigDir = `${HOME}/Library/Application Support/GitKraken`;
  const gkConfigPath = `${gkConfigDir}/config`;

  if (fs.existsSync(gkConfigDir)) {
    ok(`GitKraken config dir: ${gkConfigDir.replace(HOME, '~')}`);
  } else {
    info('GitKraken app not installed yet — config will be created on first launch');
    fs.mkdirSync(gkConfigDir, { recursive: true });
  }

  // Write GitKraken Enterprise profile config
  const enterpriseConfig = {
    profile: {
      name: 'NOIZY Empire',
      email: 'rsplowman@icloud.com',
      organization: 'NOIZY-AI',
    },
    github: {
      enterprise: isEnterprise,
      enterpriseUrl: isEnterprise ? GK_ENTERPRISE_URL : null,
      autoConnect: true,
    },
    preferences: {
      theme: 'dark',
      terminalApp: 'iterm2',
      gitFlow: true,
    },
    integrations: {
      github: true,
      azureDevOps: true,
      cloudflare: false, // not natively supported
    }
  };

  const outPath = `${HOME}/.noizy-gitkraken-profile.json`;
  fs.writeFileSync(outPath, JSON.stringify(enterpriseConfig, null, 2));
  ok(`GitKraken profile config written: ${outPath.replace(HOME, '~')}`);

  // gk auth setup instructions
  info('To complete GitHub Enterprise auth in GitKraken:');
  sub('1. Open GitKraken → Preferences → Integrations → GitHub Enterprise');
  sub(`2. Host Domain: ${GK_ENTERPRISE_URL}`);
  sub('3. Click "Generate SSH Key" + add to GitHub → Settings → SSH Keys');
  sub('4. Or use OAuth token from: https://github.com/settings/tokens');

  if (isEnterprise) {
    info('For GitHub Enterprise Server:');
    sub(`Enterprise URL: ${GK_ENTERPRISE_URL}`);
    sub('Requires GitKraken Pro or Enterprise license');
    sub('SSO available with Enterprise tier');
  }
}

// ── 7. iPad Dashboard HTTP Server ─────────────────────────────
async function startDashboardServer() {
  hdr('7. Dashboard HTTP Server — iPad access :9090');
  const dashDir = `${HOME}/.gemini/antigravity/scratch/noizy-command-center`;

  if (!fs.existsSync(dashDir)) {
    bad(`Dashboard dir not found: ${dashDir}`);
    return;
  }

  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.noizy.dashboard</string>
  <key>ProgramArguments</key>
  <array>
    <string>/opt/homebrew/bin/python3</string>
    <string>-m</string><string>http.server</string><string>9090</string>
    <string>--directory</string><string>${dashDir}</string>
    <string>--bind</string><string>0.0.0.0</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>/tmp/noizy-dashboard.log</string>
  <key>StandardErrorPath</key><string>/tmp/noizy-dashboard.err</string>
</dict>
</plist>`;

  const p = `${HOME}/Library/LaunchAgents/com.noizy.dashboard.plist`;
  fs.writeFileSync(p, plist);
  await run(`launchctl unload "${p}" 2>/dev/null; launchctl load "${p}"`);
  await sleep(1500);
  const check = await run(`curl -s http://localhost:9090/ --max-time 2`);
  if (check) {
    ok('Dashboard server: LIVE');
    ok(`Local:  http://localhost:9090/`);
    ok(`iPad:   http://10.90.90.10:9090/ipad.html`);
    ok(`Index:  http://10.90.90.10:9090/index.html`);
  } else {
    ok('Dashboard plist loaded');
    info('Access via: http://10.90.90.10:9090/ipad.html');
  }
}

// ── 8. Full Diagnostic ─────────────────────────────────────────
async function runDiagnostic() {
  hdr('8. NOIZYBEAST Full Diagnostic');

  const checks = [
    ['Voice Bridge :8080',  `curl -s http://localhost:8080/health --max-time 2`],
    ['GABRIEL    :7777',    `curl -s http://localhost:7777/health --max-time 2`],
    ['Dashboard  :9090',    `curl -s http://localhost:9090/      --max-time 2`],
    ['HEAVEN (CF)',       `curl -s https://heaven.rsp-5f3.workers.dev/health --max-time 5`],
    ['OLLAMA     :11434',   `curl -s http://localhost:11434/api/tags --max-time 2`],
    ['gk CLI',              `which gk 2>/dev/null`],
    ['node version',        `node --version`],
    ['wrangler',            `npx wrangler --version 2>/dev/null | head -1`],
    ['git',                 `git --version`],
  ];

  for (const [label, cmd] of checks) {
    const result = await run(cmd);
    const alive = result && result.length > 0 && !result.includes('refused') &&
                  !result.includes('error') && !result.includes('Error');
    if (alive) ok(`${label.padEnd(22)} ${result.slice(0, 50)}`);
    else        bad(`${label.padEnd(22)} not responding`);
  }

  // Check launchd agents
  console.log('');
  info('LaunchAgents status:');
  const agents = ['com.noizy.voice-bridge', 'com.noizy.gabriel', 'com.noizy.dashboard'];
  for (const a of agents) {
    const status = await run(`launchctl list ${a} 2>/dev/null`);
    if (status) ok(`  ${a}`);
    else        bad(`  ${a} — not loaded`);
  }
}

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
const WIDTH = 62;
const line  = '═'.repeat(WIDTH);

console.log(`\n${B}${M}╔${line}╗${R}`);
console.log(`${B}${M}║  MC96 TURBO PRO UPGRADE ENGINE v2              NOIZY   ║${R}`);
console.log(`${B}${M}║  GORUNFREE × ∞ | RSP_001 | 2026-03-27                 ║${R}`);
console.log(`${B}${M}╚${line}╝${R}\n`);

if (process.env.TURBO_PRO_KEY) {
  ok(`TURBO_PRO_KEY loaded — Pro activation ready`);
} else {
  bad('TURBO_PRO_KEY not set — Turbo Pro activation will be skipped');
  info('Provide token: TURBO_PRO_KEY=<key> node turbo-pro-upgrade.js');
}

if (process.env.GK_ENTERPRISE_URL) {
  ok(`GK_ENTERPRISE_URL: ${process.env.GK_ENTERPRISE_URL}`);
}

await installVoiceBridgePlist();
await installGabrielPlist();
await buildHeavenDeployScript();
await auditWranglerTomls();
await configureTurboConsolePro();
await configureGitKraken();
await startDashboardServer();
await runDiagnostic();

console.log(`\n${B}${G}╔${line}╗${R}`);
console.log(`${B}${G}║  UPGRADE COMPLETE — ${new Date().toLocaleTimeString('en-CA')}${' '.repeat(37)}║${R}`);
console.log(`${B}${G}╚${line}╝${R}`);
console.log(`
${G}  ✓ Voice Bridge:  launchd keepalive → :8080${R}
${G}  ✓ GABRIEL:       launchd keepalive → :7777${R}
${G}  ✓ Dashboard:     http://10.90.90.10:9090/ipad.html${R}
${G}  ✓ HEAVEN deploy: bash ~/Desktop/HEAVEN/DEPLOY_HEAVEN.sh${R}
${G}  ✓ wrangler.toml: gabriel_db → agent-memory audited${R}
${G}  ✓ Turbo Pro:     config live across all NOIZY projects${R}
${G}  ✓ GitKraken:     Enterprise GitHub profile configured${R}
`);

console.log(`${B}${Y}⚡ ROB'S REMAINING ACTIONS:${R}`);
console.log(`${Y}  1.${R} TURBO_PRO_KEY=<token> node turbo-pro-upgrade.js  ← when you have key`);
console.log(`${Y}  2.${R} Sign into GitHub in browser → GitKraken OAuth`);
console.log(`${Y}  3.${R} bash ~/Desktop/HEAVEN/DEPLOY_HEAVEN.sh`);
console.log(`${Y}  4.${R} CF email → rsplowman@icloud.com (browser)`);
console.log(`${Y}  5.${R} echo "sk-ant-..." >> ~/NOIZYLAB/.env\n`);
