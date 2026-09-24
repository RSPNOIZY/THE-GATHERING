/**
 * MILESTONE #1 VERIFICATION TEST
 * 
 * Verifies GABRIEL + Agent Registry + Rule Zero + record_idea end-to-end.
 */

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 7779; // Separate test port to avoid conflicts
const DB_PATH = path.join(process.env.HOME, "NOIZYLAB", "gabriel.db");

console.log("═══════════════════════════════════════════════");
console.log("  VERIFYING MILESTONE #1 — Bounded Command Spine");
console.log("═══════════════════════════════════════════════\n");

// Start GABRIEL daemon on test port
const env = { ...process.env, GABRIEL_PORT: String(PORT), GABRIEL_API_KEY: "test-api-key" };
const daemon = spawn('node', [path.join(__dirname, 'gabriel-daemon.js')], { env });

daemon.stdout.on('data', (data) => {
  // Console logging from daemon
  // console.log(`[DAEMON] ${data}`);
});

daemon.stderr.on('data', (data) => {
  console.error(`[DAEMON ERROR] ${data}`);
});

// Wait 2 seconds for server to spin up
setTimeout(async () => {
  try {
    await runTest();
    daemon.kill();
    process.exit(0);
  } catch (e) {
    console.error(`\n❌ TEST FAILED: ${e.message}`);
    daemon.kill();
    process.exit(1);
  }
}, 2000);

function makeRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTest() {
  console.log("1. Checking health endpoint...");
  const healthRes = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: '/health',
    method: 'GET'
  });
  
  if (healthRes.status !== 200 || !healthRes.body.ok) {
    throw new Error(`Health check failed: ${JSON.stringify(healthRes.body)}`);
  }
  console.log("   ✓ Health check PASS");

  console.log("\n2. Sending unauthorized command (expecting 401)...");
  const unauthRes = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: '/api/v1/commands',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    command_id: crypto.randomUUID(),
    actor: "RSP_001",
    source: "iPhone",
    intent: "record_idea",
    parameters: { idea: "Build a custom voice filter" },
    risk_class: "low",
    timestamp: new Date().toISOString(),
    idempotency_key: crypto.randomUUID()
  });
  
  if (unauthRes.status !== 401) {
    throw new Error(`Expected 401 Unauthorized, got ${unauthRes.status}`);
  }
  console.log("   ✓ Auth gate PASS");

  console.log("\n3. Sending authorized 'record_idea' command...");
  const command_id = crypto.randomUUID();
  const idempotency_key = crypto.randomUUID();
  const commandPayload = {
    command_id,
    actor: "RSP_001",
    source: "iPad",
    intent: "record_idea",
    parameters: { idea: "Build a custom voice filter" },
    risk_class: "low",
    timestamp: new Date().toISOString(),
    idempotency_key
  };

  const commandRes = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: '/api/v1/commands',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-api-key'
    }
  }, commandPayload);

  if (commandRes.status !== 200) {
    throw new Error(`Command execution failed: ${JSON.stringify(commandRes.body)}`);
  }
  
  const { ok, plan_id, receipt } = commandRes.body;
  if (!ok || !plan_id || !receipt) {
    throw new Error(`Invalid response structure: ${JSON.stringify(commandRes.body)}`);
  }
  
  if (receipt.status !== 'success' || !receipt.signature) {
    throw new Error(`Command failed or signature missing in receipt: ${JSON.stringify(receipt)}`);
  }
  console.log(`   ✓ Command Router execution PASS (Plan: ${plan_id})`);
  console.log(`   ✓ Cryptographic Receipt: ${receipt.receipt_id} (Sig: ${receipt.signature.slice(0, 16)}...)`);

  console.log("\n4. Verifying database/in-memory records via GABRIEL verify API...");
  const verifyRes = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: `/api/v1/commands/verify?command_id=${command_id}`,
    method: 'GET',
    headers: {
      'Authorization': 'Bearer test-api-key'
    }
  });

  if (verifyRes.status !== 200) {
    throw new Error(`Verification endpoint returned ${verifyRes.status}: ${JSON.stringify(verifyRes.body)}`);
  }

  const { store, command, plan, receipt: verifyReceipt, idea } = verifyRes.body;
  console.log(`   ✓ Active Storage Engine: [${store.toUpperCase()}]`);

  if (!command || command.intent !== 'record_idea') {
    throw new Error("Command record mismatch or not found");
  }
  console.log("   ✓ Command recorded in state store");

  if (!plan || plan.status !== 'completed') {
    throw new Error("Plan record mismatch or not completed");
  }
  console.log("   ✓ Immutable Plan verified");

  if (!verifyReceipt || verifyReceipt.signature !== receipt.signature) {
    throw new Error("Receipt record mismatch in state store");
  }
  console.log("   ✓ Cryptographic Receipt verified in state store");

  if (!idea || idea.idea_text !== "Build a custom voice filter") {
    throw new Error("Idea text mismatch or not found in ideas store");
  }
  console.log(`   ✓ Idea successfully saved locally in state store: "${idea.idea_text}"`);
  
  console.log("\n═══════════════════════════════════════════════");
  console.log("  ✓ ALL MILESTONE #1 VERIFICATION CHECKS PASS  ");
  console.log("═══════════════════════════════════════════════\n");
}
