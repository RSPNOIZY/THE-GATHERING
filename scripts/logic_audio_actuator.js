#!/usr/bin/env node
/**
 * ⚡ NOIZY OS — LOGIC PRO & AUDIO HIJACK ACTUATOR
 * Author: Robert Stephen Plowman (RSP) / MC96ECO
 *
 * This command-line utility executes AppleScript to control Logic Pro X 
 * and Audio Hijack, enabling AI agents on the M2 Ultra to actuate the physical studio.
 *
 * Usage:
 *   node scripts/logic_audio_actuator.js --app logic --action play
 *   node scripts/logic_audio_actuator.js --app logic --action stop
 *   node scripts/logic_audio_actuator.js --app hijack --action start --session "Gabriel Recording"
 *   node scripts/logic_audio_actuator.js --app hijack --action stop --session "Gabriel Recording"
 */

const { exec } = require('child_process');

// Parse arguments
const args = {};
process.argv.slice(2).forEach((val, index, array) => {
  if (val.startsWith('--')) {
    const key = val.substring(2);
    const nextVal = array[index + 1];
    if (nextVal && !nextVal.startsWith('--')) {
      args[key] = nextVal;
    } else {
      args[key] = true;
    }
  }
});

const app = args.app;
const action = args.action;
const session = args.session || 'Gabriel Recording';

if (!app || !action) {
  console.log(`
❌ Missing required arguments.
Usage:
  node logic_audio_actuator.js --app [logic|hijack] --action [play|stop|record|start] --session "[session_name]"
  `);
  process.exit(1);
}

// Build AppleScript based on arguments
let script = '';

if (app === 'logic') {
  switch (action) {
    case 'play':
      script = 'tell application "Logic Pro" to play';
      break;
    case 'stop':
      script = 'tell application "Logic Pro" to stop';
      break;
    case 'record':
      script = 'tell application "Logic Pro" to record';
      break;
    case 'name':
      script = 'tell application "Logic Pro" to get name of front document';
      break;
    default:
      console.error(`❌ Unsupported action "${action}" for Logic Pro.`);
      process.exit(1);
  }
} else if (app === 'hijack') {
  switch (action) {
    case 'start':
      script = `tell application "Audio Hijack" to start hijacking session "${session}"`;
      break;
    case 'stop':
      script = `tell application "Audio Hijack" to stop hijacking session "${session}"`;
      break;
    default:
      console.error(`❌ Unsupported action "${action}" for Audio Hijack.`);
      process.exit(1);
  }
} else {
  console.error(`❌ Unsupported application "${app}". Use "logic" or "hijack".`);
  process.exit(1);
}

// Execute AppleScript
console.log(`📡 [ACTUATING] App: ${app} | Action: ${action} | Session: ${session}`);
exec(`osascript -e '${script}'`, (err, stdout, stderr) => {
  if (err) {
    console.error(`❌ Action failed:`, stderr.trim());
    process.exit(1);
  }
  
  const output = stdout.trim();
  if (output) {
    console.log(`✅ [SUCCESS]:`, output);
  } else {
    console.log(`✅ [SUCCESS]: Command executed successfully.`);
  }
});
