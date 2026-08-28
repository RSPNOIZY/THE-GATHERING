/**
 * NOIZY Stack End-to-End Integration Verification Suite
 * 
 * Verifies:
 * 1. Supabase Schema Migration Integrity (001 - 004)
 * 2. MCP Worker Router & Tool Discovery
 * 3. LUCY Vehicular Telemetry & Multimodal Processing
 * 4. NOIZYARMY Swarm Gating & Never Clause Enforcement
 */

import * as fs from 'fs';
import * as path from 'path';
import assert from 'assert';

import { TelemetryProcessor } from '../LUCY/src/telemetry/telemetry-processor.ts';
import { AgentGatingEngine } from '../agents/noizyarmy/agent-gating.ts';
import { SwarmOrchestrator } from '../agents/noizyarmy/swarm-orchestrator.ts';
import { MCP_TOOLS } from '../infrastructure/mcp-worker/src/registry.ts';
import { handleC2PACreate } from '../infrastructure/mcp-worker/src/handlers/c2pa.ts';

console.log('🚀 Running NOIZY Sovereign Stack Verification...\n');

// ─── TEST 1: Supabase Migrations Exist & Have Valid Content ─────────
console.log('🔹 [1/4] Verifying Supabase Schema Migrations...');
const migrationsDir = '/Users/m2ultra/THE-GATHERING/supabase/migrations';
const expectedMigrations = [
  '001_core.sql',
  '002_telemetry_multimodal.sql',
  '003_swarm_agents.sql',
  '004_audit_evidence_c2pa.sql',
];

for (const mig of expectedMigrations) {
  const migPath = path.join(migrationsDir, mig);
  assert(fs.existsSync(migPath), `Migration file missing: ${mig}`);
  const content = fs.readFileSync(migPath, 'utf-8');
  assert(content.length > 500, `Migration file suspiciously short: ${mig}`);
  assert(content.includes('CREATE TABLE'), `Migration missing table definitions: ${mig}`);
  console.log(`   ✅ ${mig} verified (${(content.length / 1024).toFixed(1)} KB)`);
}

// ─── TEST 2: MCP Tool Registry & Handlers ────────────────────────────
console.log('\n🔹 [2/4] Verifying MCP Tool Discovery & C2PA Invariant Engine...');
assert(MCP_TOOLS.length >= 6, 'MCP Tool Registry should contain at least 6 core tools');
const c2paTool = MCP_TOOLS.find((t) => t.name === 'c2pa_manifest_create');
assert(c2paTool, 'Missing c2pa_manifest_create tool definition');

// Verify C2PA Invariant Enforcement (Split >= 75%)
(async () => {
  const validManifest = await handleC2PACreate(
    {
      asset_id: 'TRK_001_NOIZY',
      asset_title: 'Sovereign Frequency',
      asset_sha256: 'abc123hash',
      creator_split_pct: 75.0,
    },
    {}
  );
  assert(validManifest.success, 'Valid C2PA manifest creation failed');
  assert(validManifest.manifest_urn.startsWith('urn:uuid:c2pa_'), 'Invalid manifest URN');
  console.log('   ✅ Valid C2PA Manifest Generated with 75/25 Invariant.');

  // Test Invariant Violation Rejection
  try {
    await handleC2PACreate(
      {
        asset_id: 'TRK_002_VIOLATION',
        asset_title: 'Illegal Split',
        asset_sha256: 'xyz987hash',
        creator_split_pct: 60.0, // Should throw!
      },
      {}
    );
    assert.fail('Expected 60% creator split to throw invariant violation!');
  } catch (err: any) {
    assert(err.message.includes('INVARIANT VIOLATION'), 'Expected invariant error');
    console.log('   ✅ Invariant Guard correctly rejected illegal 60% creator split.');
  }

  // ─── TEST 3: LUCY Vehicular Telemetry & Ottawa Zone Scoring ─────────
  console.log('\n🔹 [3/4] Verifying LUCY Telemetry & Multimodal Anomaly Detection...');
  const processor = new TelemetryProcessor(20);

  // Test Normal Frame in YOW Airport Zone
  const normalEvent = processor.processFrame({
    timestamp: new Date().toISOString(),
    latitude: 45.3225,
    longitude: -75.6692,
    speed_kmh: 65.0,
    coolant_temp_c: 88,
    accel_x_g: -0.05,
    accel_y_g: 0.02,
  });
  assert.strictEqual(normalEvent.zone_code, 'YOW_OTTAWA_AIRPORT');
  assert.strictEqual(normalEvent.zone_multiplier, 1.65);
  assert.strictEqual(normalEvent.anomalies.length, 0);
  console.log(`   ✅ Zone Scoring: Coordinates (45.3225, -75.6692) mapped to ${normalEvent.zone_code} (Multiplier: ${normalEvent.zone_multiplier}x)`);

  // Test Sudden Braking Anomaly Frame
  const shockEvent = processor.processFrame({
    timestamp: new Date().toISOString(),
    latitude: 45.4215,
    longitude: -75.6972,
    speed_kmh: 40.0,
    coolant_temp_c: 90,
    accel_x_g: -0.62, // Severe deceleration (> 0.45g)
    accel_y_g: 0.10,
  });
  assert(shockEvent.anomalies.length > 0, 'Processor should detect sudden braking anomaly');
  console.log(`   ✅ Anomaly Detection: Successfully flagged [${shockEvent.anomalies[0]}]`);

  // ─── TEST 4: NOIZYARMY Swarm Gating & DAG Execution ──────────────────
  console.log('\n🔹 [4/4] Verifying NOIZYARMY Swarm Gating & Never Clause Policies...');

  // Test 1: Gating blocks unpermitted payout on T1 sandbox agent
  const blockedDecision = AgentGatingEngine.evaluate('T1_SANDBOX', {
    actionType: 'PAYOUT',
    targetResource: 'stripe://transfers',
  });
  assert.strictEqual(blockedDecision.allowed, false);
  console.log(`   ✅ Gating Engine blocked PAYOUT on T1 sandbox agent (${blockedDecision.reason})`);

  // Test 2: Gating blocks violation of 75/25 creator split
  const neverClauseDecision = AgentGatingEngine.evaluate('T3_PRODUCTION', {
    actionType: 'WRITE',
    targetResource: 'supabase://contracts',
    parameters: { creator_split_pct: 50.0 },
  });
  assert.strictEqual(neverClauseDecision.allowed, false);
  assert.strictEqual(neverClauseDecision.policyCode, 'NEVER_CLAUSE_75_25');
  console.log('   ✅ Never Clause Policy strictly blocked attempt to lower creator split below 75%.');

  // Test 3: Swarm DAG Orchestrator
  const orchestrator = new SwarmOrchestrator('T3_PRODUCTION');
  const mission = orchestrator.planMission(
    'Deploy Vehicular Edge Gateways',
    'Deploy LUCY real-time telemetry pipelines to all mobile nodes.'
  );
  assert.strictEqual(mission.tasks.length, 4);
  const executed = await orchestrator.executeMission(mission);
  assert.strictEqual(executed.status, 'COMPLETED');
  console.log(`   ✅ Swarm Mission DAG executed successfully across ${executed.tasks.length} specialized bees.\n`);
  console.log('🏆 ALL SOVEREIGN STACK TESTS PASSED PERFECTLY!\n');
})();
