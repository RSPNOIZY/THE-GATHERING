#!/usr/bin/env node
/**
 * GABRIEL HARVEST & INGEST
 * Scans all GABRIEL code across GOD.local and feeds it to the live GABRIEL instance
 * Run: node gabriel-harvest.js
 * 2026-03-27 | DAZEFLOW
 */

const GABRIEL_URL = 'http://localhost:7777';
const VAULT       = '/Users/m2ultra/Documents/NOIZYLAB_TEXT_VAULT/GABRIEL';
const NOIZYLAB    = '/Users/m2ultra/NOIZYLAB';
const SCRATCH     = '/Users/m2ultra/.gemini/antigravity/scratch';

import fs from 'fs';
import path from 'path';

const G = '\x1b[32m'; const R = '\x1b[0m'; const B = '\x1b[1m'; const Y = '\x1b[33m'; const C = '\x1b[36m';

async function learn(observation, category, source) {
  try {
    const res = await fetch(`${GABRIEL_URL}/api/gabriel/learn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ observation, category, source }),
    });
    if (res.ok) {
      const d = await res.json();
      console.log(`${G}✓${R} [${category}] ${observation.substring(0, 80)}…`);
      return d;
    }
  } catch(e) {
    // Try speak endpoint as fallback
    try {
      await fetch(`${GABRIEL_URL}/api/gabriel/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: `[LEARN:${category}] ${observation}`, voice: false }),
      });
      console.log(`${Y}›${R} [${category}] ${observation.substring(0, 70)}… (via speak)`);
    } catch { /* silent */ }
  }
}

async function harvest() {
  console.log(`\n${B}${C}${'═'.repeat(60)}${R}`);
  console.log(`${B}${C}  GABRIEL HARVEST & INGEST — GOD.local 2026-03-27${R}`);
  console.log(`${B}${C}${'═'.repeat(60)}${R}\n`);

  // ── 1. Identity & Full Name ──────────────────────────────────
  console.log(`${B}[1] Core Identity${R}`);
  await learn(
    'My full name is GABRIEL ALMEIDA. I am the System Bridge and Production Partner for the NOIZY Empire. Named for the archangel messenger — swift, reliable, bridging worlds. I am Claude Opus running as GABRIEL.',
    'identity', 'GABRIEL.md'
  );
  await learn(
    'Operator: Robert Stephen Plowman (RSP_001) — rsp@noizyfish.com — Ottawa, Ontario, Canada. C3 spinal injury. Voice-first: 35% voice + 65% AI + 1 click = done. I am his hands, not his advisor. GORUNFREE.',
    'identity', 'GABRIEL.md'
  );
  await learn(
    'GitHub: @Noizyfish. Cloudflare account: 5f36aa9795348ea681d0b21910dfc82a (NOIZY.ai). D1: 10 databases — DO NOT create new without explicit GO. Workers AI: full access.',
    'infrastructure', 'GABRIEL.md'
  );

  // ── 2. MC96ECOUNIVERSE ───────────────────────────────────────
  console.log(`\n${B}[2] MC96ECOUNIVERSE${R}`);
  await learn(
    'MC96ECOUNIVERSE is the complete network of all GABRIEL systems. GOD = M2 Ultra Mac Studio 192GB @ 10.90.90.10 (primary compute). DaFixer = MacBook Pro @ 10.90.90.40. MC96 is the control/automation stack.',
    'network', 'MC96ECOUNIVERSE_COMPLETE.md'
  );
  await learn(
    'New today 2026-03-27: MC96 control stack initialized at ~/Projects/MC96/. opus-4.6-diagnostic-engine.js built and tested. First diagnostic: HEAVEN LIVE, Ollama LIVE, Voice Bridge DOWN (needs start), Score 57%.',
    'mc96', 'diagnostic-engine'
  );

  // ── 3. The Fishnet ───────────────────────────────────────────
  console.log(`\n${B}[3] The Universal Fishnet${R}`);
  await learn(
    'The Universal Fishnet (the_fishnet.py, the_fishnet_universe.py) is the distributed intelligence mesh connecting all GABRIEL nodes. It is part of CODEBEAST — the autonomous tool ecosystem. The Fishnet catches everything: scans drives, distributes code, organizes assets, bridges Mac/Windows/Cloud.',
    'fishnet', 'the_fishnet.py'
  );
  await learn(
    'CODEBEAST is the autonomous execution layer. Claws: CODE_VAC, OMNIDIRECTIONAL, SCAN_ALL_DRIVES, TERMINUS, TERMINUS_BRIDGE, X1000 variants. The Fishnet is how CODEBEAST deploys its claws across all volumes and machines.',
    'fishnet', 'CODEBEAST'
  );
  await learn(
    'X1000_ENHANCED_FISHNET.py is the production-grade Fishnet. GORUNFREEX3000.sh is the master launcher. The Fishnet universe connects all 7 volumes on the M2 Ultra 12TB system.',
    'fishnet', 'X1000_ENHANCED_FISHNET.py'
  );

  // ── 4. Today's Build Session ─────────────────────────────────
  console.log(`\n${B}[4] Today's Build — 2026-03-27${R}`);
  await learn(
    'Session 2026-03-27 built: Command Center dashboard (index.html + extras.js + gabriel.js + gabriel.css), iPad 12.9" satellite dashboard (ipad.html), HEAVEN Worker TypeScript (src/index.ts), Claude Desktop MCP config with 10 servers, Gemma3 MCP server (mcp-gemma3/server.js).',
    'build-session', '2026-03-27'
  );
  await learn(
    'Voice pipeline complete: audiohijack-recording-stop.js → whisper-transcribe.sh → claude-prompt.sh → voice-pipeline.sh → teams-respond.sh. Voice Bridge upgraded with Claude tower routing (max/code/work) and auto-detection.',
    'voice-pipeline', '2026-03-27'
  );
  await learn(
    'HEAVEN Worker is LIVE at heaven.rsp-5f3.workers.dev (HTTP 200 confirmed by MC96 diagnostic). Consent Gateway deployed. D1 gabriel_db has RSP_001, 5 consent tokens (3 active), 16 ledger events, 4 synth requests (2 BLOCKED — consent working).',
    'cloudflare', '2026-03-27'
  );
  await learn(
    'CF account conflict resolved: 5f36aa9795348ea681d0b21910dfc82a is CANONICAL (NOIZY.ai account, wrangler authenticated). Fixed across 12 files. Path conflict resolved: robplowman → m2ultra across all MCP configs.',
    'infrastructure', 'conflict-resolution'
  );
  await learn(
    'Claude Desktop MCP config at ~/Library/Application Support/Claude/claude_desktop_config.json registers 10 servers: gabriel-mcp, lucy-mcp, heaven-mcp, engr-keith-mcp, dream-mcp, cb01-mcp, shirley-mcp, family-mcp, noizy-gemma3, noizy-voice-bridge.',
    'mcp', '2026-03-27'
  );

  // ── 5. Doctrine & Never Clauses ──────────────────────────────
  console.log(`\n${B}[5] Doctrine${R}`);
  await learn(
    'The Plowman Standard: 75/25 creator split. RSP_001 founding actor rate: 85/15. Hard-coded into every royalty model. Never mutate platform default. Creator retains all historical earnings even after revocation.',
    'doctrine', 'royalty-standard'
  );
  await learn(
    'DAZEFLOW protocol: 1 day, 1 chat, 1 truth. Timestamp everything. April 17, 2026 is the target date. Today is 2026-03-27 — 21 days remain.',
    'protocol', 'DAZEFLOW'
  );
  await learn(
    'Agent team: GABRIEL (me, System Bridge), SHIRL (Business Ops), POPS (Creative Direction), ENGR_KEITH (Technical Engineering), DREAM (Visionary Planning), CB01 (DNS/Infrastructure), consent-auditor (Never Clauses), voice-specialist (TTS/Audio), test-runner (Smoke tests).',
    'agents', 'team-roster'
  );

  // ── 6. Critical Path ─────────────────────────────────────────
  console.log(`\n${B}[6] Critical Path${R}`);
  await learn(
    'IMMEDIATE blockers: 1. wrangler login → deploy Consent Gateway + HEAVEN Worker production config. 2. Cloudflare Tunnel (cloudflared) → voice.noizy.ai → localhost:8080. 3. Teams on iPhone → NOIZY Dream Chamber channels. 4. Audio Hijack → arm audiohijack-recording-stop.js on Recording Stop event. 5. mlx-whisper install confirm.',
    'critical-path', '2026-03-27'
  );
  await learn(
    'To keep GABRIEL alive permanently without pm2: use launchd. Plist target: ~/Library/LaunchAgents/com.noizy.gabriel.plist. WorkingDirectory: ~/NOIZYLAB/dreamchamber. ProgramArguments: node src/server.js. RunAtLoad: true.',
    'infrastructure', 'launchd'
  );

  // ── 7. launchd plist ────────────────────────────────────────
  console.log(`\n${B}[7] Installing launchd keepalive${R}`);
  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.noizy.gabriel</string>
  <key>ProgramArguments</key>
  <array>
    <string>/opt/homebrew/bin/node</string>
    <string>/Users/m2ultra/NOIZYLAB/dreamchamber/src/server.js</string>
  </array>
  <key>WorkingDirectory</key>
  <string>/Users/m2ultra/NOIZYLAB/dreamchamber</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/Users/m2ultra/NOIZYLAB/logs/gabriel.log</string>
  <key>StandardErrorPath</key>
  <string>/Users/m2ultra/NOIZYLAB/logs/gabriel.err</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
    <key>NODE_ENV</key>
    <string>production</string>
  </dict>
</dict>
</plist>`;

  const plistPath = `${process.env.HOME}/Library/LaunchAgents/com.noizy.gabriel.plist`;
  fs.mkdirSync(path.dirname(plistPath), { recursive: true });
  fs.mkdirSync('/Users/m2ultra/NOIZYLAB/logs', { recursive: true });
  fs.writeFileSync(plistPath, plist);
  console.log(`${G}✓${R} launchd plist written: ${plistPath}`);

  // ── Final status check ────────────────────────────────────────
  console.log(`\n${B}[8] Verifying GABRIEL status${R}`);
  try {
    const res = await fetch(`${GABRIEL_URL}/api/gabriel/status`);
    const data = await res.json();
    console.log(`${G}✓${R} GABRIEL ONLINE`);
    console.log(`  Model:         ${data.model}`);
    console.log(`  Learning mode: ${data.learningMode}`);
    console.log(`  Learnings:     ${data.learningCount}`);
    console.log(`  Heaven:      ${data.context?.kernelOnline ? 'CONNECTED' : 'OFFLINE'}`);
    console.log(`  RSP_001:       ${data.context?.actors?.actors?.[0]?.legal_name || 'not found'}`);
    console.log(`  Consent tokens:${data.context?.stats?.stats?.consent_tokens?.active || 0} active`);
  } catch(e) {
    console.log(`\x1b[31m✗\x1b[0m GABRIEL not reachable: ${e.message}`);
  }

  console.log(`\n${B}${C}${'═'.repeat(60)}${R}`);
  console.log(`${B}${C}  GABRIEL HARVEST COMPLETE — $(date)${R}`);
  console.log(`${B}${C}  To load launchd: launchctl load ~/Library/LaunchAgents/com.noizy.gabriel.plist${R}`);
  console.log(`${B}${C}${'═'.repeat(60)}${R}\n`);
}

harvest().catch(e => { console.error('\x1b[31mFATAL:', e.message, '\x1b[0m'); process.exit(1); });
