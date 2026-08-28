import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

console.clear();
console.log("=====================================================================");
console.log("🛡️ [AGENTS GUARDIAN] DECENTRALIZED PROCESS LIFECYCLE MONITOR ENGINE");
console.log("=====================================================================");
console.log("🤖 Status: Active. Ensuring all local assistant engines run forever...\n");

const CRITICAL_SERVICES = [
  { name: 'Desktop API Hub', script: 'app-apis/desktop-orchestrator.js', port: 9600 },
  { name: 'FOSS Multi-Brain Hub', script: 'system-core/multi-brain/hub-orchestrator.js', port: 9700 },
  { name: 'Noizy Neural Command Core', script: 'system-core/multi-brain/neural-core.js', port: 9800 },
  { name: 'Monetization API Hub', script: 'system-core/multi-brain/monetization-core.js', port: 9850 },
  { name: 'Sovereign Local App Bridge', script: 'system-core/multi-brain/local-app-bridge.js', port: 9950 },
  { name: 'Sovereign Management Dashboard', script: 'system-core/multi-brain/dashboard-core.js', port: 9900 },
  { name: 'Slack Bot Fleet', script: 'slack-bots/orchestrator.js', port: null },
  { name: 'Discord Bot Fleet', script: 'discord-bots/orchestrator.js', port: null }
];

const runningProcesses = {};

function launchService(service) {
  console.log(`🚀 Starting core agent framework branch: [${service.name}]`);
  
  const child = spawn('node', [service.script], {
    cwd: process.cwd(),
    stdio: 'ignore',
    detached: true
  });
  
  child.unref();
  runningProcesses[service.script] = child;

  const launchAlert = `${service.name} environment instantiated successfully. Secure listener active.`;
  execSync(`say -r 170 "${launchAlert}"`);
}

function monitorLifecycleLoop() {
  CRITICAL_SERVICES.forEach(service => {
    let needsRestart = false;

    if (service.port) {
      try {
        execSync(`lsof -i :${service.port}`);
      } catch (error) {
        needsRestart = true;
      }
    } else {
      const childProc = runningProcesses[service.script];
      if (!childProc || childProc.killed) {
        needsRestart = true;
      }
    }

    if (needsRestart) {
      console.log(`⚠️ Alert: Service failure verified on [${service.name}]. Initializing hot-reload...`);
      execSync(`say -r 168 "Warning. Service drop detected on ${service.name}. Executing emergency hot reload."`);
      launchService(service);
    }
  });
}

CRITICAL_SERVICES.forEach(service => launchService(service));
setInterval(monitorLifecycleLoop, 10000);
