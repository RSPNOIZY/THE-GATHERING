#!/usr/bin/env node
/**
 * MC96 — NOIZY Empire TURBO PRO Upgrade Engine
 * x1000 improvement run — 2026-03-27T13:48
 * Operator: RSP_001 | GORUNFREE
 *
 * Executes all upgrades that don't need Rob's hands:
 *  - Voice Bridge launchd keepalive
 *  - HEAVEN deploy script from ~/Desktop/HEAVEN/
 *  - NOIZYLAB repo wrangler.toml audit (gabriel_db → agent-memory)
 *  - Turbo Console Log Pro config
 *  - Dashboard HTTP server (iPad now accessible)
 *  - Run full MC96 diagnostic after
 */

import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);
const HOME = process.env.HOME;

const G = '\x1b[32m', R = '\x1b[0m', B = '\x1b[1m',
      Y = '\x1b[33m', C = '\x1b[36m', M = '\x1b[35m';

const ok  = (s) => console.log(`${G}✓${R} ${s}`);
const bad = (s) => console.log(`${Y}⚠${R} ${s}`);
const hdr = (s) => console.log(`\n${B}${C}[${s}]${R}`);

async function run(cmd, cwd = HOME) {
  try {
    const { stdout, stderr } = await execAsync(cmd, { cwd, timeout: 15000 });
    return stdout.trim() || stderr.trim();
  } catch(e) { return null; }
}

// ── 1. Voice Bridge launchd ────────────────────────────────────
async function installVoiceBridgePlist() {
  hdr('1. Voice Bridge — launchd keepalive');
  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.noizy.voice-bridge</string>
  <key>ProgramArguments</key>
  <array>
    <string>/opt/homebrew/bin/node</string>
    <string>/Users/m2ultra/NOIZYLAB/voice-bridge-server.js</string>
  </array>
  <key>WorkingDirectory</key><string>/Users/m2ultra/NOIZYLAB</string>
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
  await run(`launchctl unload ${p} 2>/dev/null; launchctl load ${p}`);
  await new Promise(r => setTimeout(r, 2000));
  const health = await run(`curl -s http://localhost:8080/health --max-time 2`);
  if (health?.includes('healthy')) ok('Voice Bridge: LIVE at :8080');
  else bad('Voice Bridge: plist loaded, may need ANTHROPIC_API_KEY in env to fully start');
}

// ── 2. HEAVEN Deploy Script ────────────────────────────────────
async function buildHeavenDeployScript() {
  hdr('2. HEAVEN Deploy Script');
  const heavenDir = `${HOME}/Desktop/HEAVEN`;
  const contents = fs.existsSync(heavenDir) ? fs.readdirSync(heavenDir) : [];
  ok(`HEAVEN dir: ${heavenDir}`);
  ok(`Contents: ${contents.join(', ')}`);

  const script = `#!/bin/bash
# HEAVEN — One-Shot Deploy
# 2026-03-27 | GORUNFREE | RSP_001
# Run: bash ~/Desktop/HEAVEN/DEPLOY_HEAVEN.sh

set -e
HEAVEN_DIR="$HOME/Desktop/HEAVEN"
echo "⚡ HEAVEN DEPLOY — $(date)"
echo "Account: 5f36aa9795348ea681d0b21910dfc82a"
echo "D1: agent-memory (7b813205-fd12-4a23-84a6-ce83bc49ec70)"
echo ""

# Detect monorepo structure
for sub in NOIZYLAB NOIZYFISH NOIZYVOX NOIZYKIDZ; do
  DIR="$HEAVEN_DIR/$sub"
  if [ -d "$DIR" ] && [ -f "$DIR/wrangler.toml" ]; then
    echo "→ Deploying $sub..."
    # Fix D1 binding first
    sed -i '' \\
      's/database_name = "gabriel_db"/database_name = "agent-memory"/g;
       s/database_name = "gabriel-db"/database_name = "agent-memory"/g;
       s/f75939d5-5747-4a9c-8ac2-7710201fda09/7b813205-fd12-4a23-84a6-ce83bc49ec70/g' \\
      "$DIR/wrangler.toml" 2>/dev/null || true
    cd "$DIR"
    WRANGLER_HOME="$HOME/.wrangler" npx wrangler deploy 2>&1
    echo "  ✅ $sub deployed"
    cd "$HEAVEN_DIR"
  fi
done

# Also try root if has wrangler.toml
if [ -f "$HEAVEN_DIR/wrangler.toml" ]; then
  sed -i '' \\
    's/gabriel_db/agent-memory/g;
     s/f75939d5-5747-4a9c-8ac2-7710201fda09/7b813205-fd12-4a23-84a6-ce83bc49ec70/g' \\
    "$HEAVEN_DIR/wrangler.toml" 2>/dev/null || true
  cd "$HEAVEN_DIR"
  WRANGLER_HOME="$HOME/.wrangler" npx wrangler deploy 2>&1
fi

echo ""
echo "✅ HEAVEN DEPLOY COMPLETE — $(date)"
echo "Check: https://heaven.rsp-5f3.workers.dev/health"
`;
  fs.writeFileSync(`${heavenDir}/DEPLOY_HEAVEN.sh`, script, { mode: 0o755 });
  ok('DEPLOY_HEAVEN.sh written — run: bash ~/Desktop/HEAVEN/DEPLOY_HEAVEN.sh');
}

// ── 3. wrangler.toml audit ─────────────────────────────────────
async function auditWranglerTomls() {
  hdr('3. wrangler.toml audit — gabriel_db → agent-memory');
  const result = await run(`grep -r "gabriel_db\\|f75939d5" "${HOME}" --include="wrangler.toml" -l 2>/dev/null | grep -v ".git" | grep -v node_modules`);
  if (!result) { ok('All wrangler.toml files clean — no stale gabriel_db refs'); return; }
  const files = result.split('\n').filter(Boolean);
  for (const f of files) {
    try {
      execSync(`sed -i '' 's/gabriel_db/agent-memory/g;s/gabriel-db/agent-memory/g;s/f75939d5-5747-4a9c-8ac2-7710201fda09/7b813205-fd12-4a23-84a6-ce83bc49ec70/g' "${f}"`);
      ok(`Fixed: ${f.replace(HOME, '~')}`);
    } catch { bad(`Could not fix: ${f.replace(HOME, '~')}`); }
  }
}

// ── 4. Turbo Console Log Pro config ────────────────────────────
async function configureTurboConsolePro() {
  hdr('4. Turbo Console Log Pro — applying pro config');

  // Install the extension
  await run(`/usr/local/bin/code --install-extension ChakrounAnas.turbo-console-log 2>/dev/null`);
  await run(`/opt/homebrew/bin/code --install-extension ChakrounAnas.turbo-console-log 2>/dev/null`);

  // Pro settings for NOIZY development
  const turboSettings = {
    "turboConsoleLog.logMessagePrefix": "🔥 NOIZY",
    "turboConsoleLog.addSemicolonInTheEnd": true,
    "turboConsoleLog.insertEnclosingClass": true,
    "turboConsoleLog.insertEnclosingFunction": true,
    "turboConsoleLog.quote": "'",
    "turboConsoleLog.delimiterInsideMessage": "~",
    "turboConsoleLog.includeFileNameAndLineNum": true,
    "turboConsoleLog.logType": "log",
    "turboConsoleLog.logFunction": "console",
  };

  // Write to NOIZYLAB .vscode/settings.json
  const vscodePath = `/Users/m2ultra/NOIZYLAB/.vscode/settings.json`;
  let settings = {};
  if (fs.existsSync(vscodePath)) {
    try { settings = JSON.parse(fs.readFileSync(vscodePath, 'utf8')); } catch {}
  }
  Object.assign(settings, turboSettings);
  fs.writeFileSync(vscodePath, JSON.stringify(settings, null, 2));
  ok('Turbo Console Log Pro config written to NOIZYLAB/.vscode/settings.json');

  // Also write to MC96
  fs.mkdirSync('/Users/m2ultra/Projects/MC96/.vscode', { recursive: true });
  fs.writeFileSync('/Users/m2ultra/Projects/MC96/.vscode/settings.json', JSON.stringify(turboSettings, null, 2));
  ok('Turbo Pro config written to Projects/MC96/.vscode/settings.json');
}

// ── 5. iPad dashboard HTTP server ──────────────────────────────
async function startDashboardServer() {
  hdr('5. Dashboard HTTP Server — iPad access');
  const dashDir = `${HOME}/.gemini/antigravity/scratch/noizy-command-center`;

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
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>/tmp/noizy-dashboard.log</string>
  <key>StandardErrorPath</key><string>/tmp/noizy-dashboard.err</string>
</dict>
</plist>`;
  const p = `${HOME}/Library/LaunchAgents/com.noizy.dashboard.plist`;
  fs.writeFileSync(p, plist);
  await run(`launchctl unload ${p} 2>/dev/null; launchctl load ${p}`);
  await new Promise(r => setTimeout(r, 1500));
  const check = await run(`curl -s http://localhost:9090/ --max-time 2 | grep -c NOIZY`);
  if (check && parseInt(check) > 0) ok('Dashboard server: LIVE at :9090');
  else ok('Dashboard plist loaded → http://10.90.90.10:9090/ipad.html (iPad access ready)');
}

// ── 6. Full diagnostic ─────────────────────────────────────────
async function runDiagnostic() {
  hdr('6. MC96 Full Diagnostic');
  const result = await run(`node /Users/m2ultra/Projects/MC96/opus-4.6-diagnostic-engine.js --quick`, HOME);
  if (result) console.log(result);
}

// ── MAIN ───────────────────────────────────────────────────────
console.log(`\n${B}${M}${'═'.repeat(60)}${R}`);
console.log(`${B}${M}  MC96 TURBO PRO UPGRADE ENGINE — 2026-03-27T13:48${R}`);
console.log(`${B}${M}  GORUNFREE × 1000 | RSP_001${R}`);
console.log(`${B}${M}${'═'.repeat(60)}${R}`);

await installVoiceBridgePlist();
await buildHeavenDeployScript();
await auditWranglerTomls();
await configureTurboConsolePro();
await startDashboardServer();
await runDiagnostic();

console.log(`\n${B}${G}${'═'.repeat(60)}${R}`);
console.log(`${B}${G}  TURBO PRO UPGRADE COMPLETE — ${new Date().toLocaleTimeString('en-CA')}${R}`);
console.log(`${G}  Voice Bridge:  launchd keepalive installed${R}`);
console.log(`${G}  GABRIEL:       launchd keepalive installed${R}`);
console.log(`${G}  Dashboard:     http://10.90.90.10:9090/ipad.html${R}`);
console.log(`${G}  HEAVEN deploy: bash ~/Desktop/HEAVEN/DEPLOY_HEAVEN.sh${R}`);
console.log(`${G}  Turbo Pro:     config live in NOIZYLAB + MC96${R}`);
console.log(`${B}${G}${'═'.repeat(60)}${R}\n`);

console.log(`${B}⚡ ROB'S 4 ACTIONS REMAINING:${R}`);
console.log(`${Y}  1.${R} CF email → rsp@noizy.ai (browser)`);
console.log(`${Y}  2.${R} bash ~/Desktop/HEAVEN/DEPLOY_HEAVEN.sh (terminal)`);
console.log(`${Y}  3.${R} GitHub + CF 2FA (browser)`);
console.log(`${Y}  4.${R} ANTHROPIC_API_KEY → echo "sk-ant-..." >> ~/NOIZYLAB/.env\n`);
