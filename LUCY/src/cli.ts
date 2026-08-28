#!/usr/bin/env npx tsx
/**
 * LUCY v4.0 — Command Line Interface
 * 
 * Usage:
 *   npx tsx src/cli.ts score              # Score Ottawa zones in real-time
 *   npx tsx src/cli.ts ingest [file.json] # Ingest shift records into Memory Objects
 *   npx tsx src/cli.ts graph              # Build Dreamchamber Knowledge Graph nodes
 *   npx tsx src/cli.ts archive            # Trigger Michael Merkle archival batch
 *   npx tsx src/cli.ts twin "query"       # Query Gabriel Digital Twin
 *   npx tsx src/cli.ts test               # Run smoke test suite
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  evaluateOttawaZones,
  ingestShiftRows,
  synthesizeDreamchamberGraph,
  createMichaelArchivalBatch,
  queryGabrielDigitalTwin,
  ENGINE_PATHS,
} from './engine/lucy-v4-engine';
import { BlankBlackRow, MemoryObject } from './schemas/memory-object';

const command = process.argv[2] || 'score';
const arg = process.argv[3];

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  🜂 LUCY v4.0 PERSONAL OPERATING SYSTEM CLI');
  console.log('  Role: Experience → Knowledge → Wisdom → Legacy');
  console.log('═══════════════════════════════════════════════════════════════\n');

  switch (command) {
    case 'score': {
      console.log('🗺️ Evaluating Ottawa / YOW Real-Time Surge & Zone Intelligence...\n');
      const results = evaluateOttawaZones();
      console.log(`Evaluated at: ${results.evaluated_at} (${results.day_of_week} ${results.hour_of_day}:00)\n`);
      
      console.log('ZONE                   SCORE  REVENUE/HR  REC                WAIT POINT');
      console.log('─────────────────────────────────────────────────────────────────────────────');
      for (const z of results.rankings) {
        const zoneStr = z.zone_tag.padEnd(22);
        const scoreStr = `${z.zone_score}/100`.padEnd(7);
        const revStr = `$${z.projected_hourly_cad}/hr`.padEnd(12);
        const recStr = z.staging_recommendation.padEnd(19);
        console.log(`${zoneStr} ${scoreStr} ${revStr} ${recStr} ${z.recommended_wait_point}`);
      }
      console.log('\nTop Recommendation: ' + results.rankings[0].reasoning);
      break;
    }

    case 'ingest': {
      let rows: BlankBlackRow[] = [];
      if (arg && fs.existsSync(arg)) {
        console.log(`📥 Reading shift records from ${arg}...`);
        rows = JSON.parse(fs.readFileSync(arg, 'utf8'));
      } else {
        console.log('📥 No input file specified; using default active shift demonstration batch...');
        rows = [
          {
            Date: new Date().toISOString().split('T')[0],
            Time: '22:30',
            Platform: 'UBER',
            PickupLocation: 'ByWard Market, William St',
            DropoffLocation: 'Glebe, Bank St',
            OttawaZone: 'BYWARD_MARKET',
            GrossFareCAD: 32.50,
            PlatformFeeCAD: 6.80,
            NetFareCAD: 25.70,
            TipsCAD: 8.00,
            SurgeMultiplier: 1.70,
            DistanceKM: 5.2,
            DurationMinutes: 15,
            DetectedLanguages: 'en (0.95), fr (0.90)',
            CreativeSparkNotes: 'Warm polyphonic synth chords modulating over Ottawa midnight rain texture',
            SentimentRating: 'inspirational',
            ReceiptID: `RCP_${Date.now()}_01`,
          },
          {
            Date: new Date().toISOString().split('T')[0],
            Time: '23:15',
            Platform: 'PRIVATE',
            PickupLocation: 'NAC Southam Hall',
            DropoffLocation: 'YOW Airport',
            OttawaZone: 'DOWNTOWN_CENTRETOWN',
            GrossFareCAD: 55.00,
            PlatformFeeCAD: 0.00,
            NetFareCAD: 55.00,
            TipsCAD: 15.00,
            SurgeMultiplier: 1.50,
            DistanceKM: 15.8,
            DurationMinutes: 22,
            DetectedLanguages: 'fr (0.98)',
            ReceiptID: `RCP_${Date.now()}_02`,
          }
        ];
      }

      const summary = ingestShiftRows(rows);
      console.log(`\n✅ Ingestion Complete!`);
      console.log(`  Run ID:                ${summary.run_id}`);
      console.log(`  Records Processed:     ${summary.total_records_processed}`);
      console.log(`  Memory Objects Formed: ${summary.memory_objects_created}`);
      console.log(`  Creative Sparks:       ${summary.creative_sparks_count}`);
      console.log(`  Gross Revenue:         $${summary.total_gross_revenue_cad} CAD`);
      console.log(`  Distance Logged:       ${summary.total_distance_km} km`);
      console.log(`  Vault Storage:         ${summary.manifest_path}`);
      break;
    }

    case 'graph': {
      console.log('🔮 Synthesizing Dreamchamber Knowledge Graph...');
      const today = new Date().toISOString().split('T')[0];
      const warmFile = path.join(ENGINE_PATHS.WARM_VAULT_DIR, `memory_objects_${today}.jsonl`);
      
      let objects: MemoryObject[] = [];
      if (fs.existsSync(warmFile)) {
        const lines = fs.readFileSync(warmFile, 'utf8').trim().split('\n');
        objects = lines.filter(Boolean).map(l => JSON.parse(l));
      }

      const graph = synthesizeDreamchamberGraph(objects);
      console.log(`\n✅ Graph Synthesis Complete:`);
      console.log(`  Ideas Created:    ${graph.total_ideas}`);
      console.log(`  Stems Created:    ${graph.total_assets}`);
      console.log(`  Projects Linked:  ${graph.total_projects}`);
      for (const line of graph.lineages) {
        console.log(`    • [${line.brand}] "${line.idea_title}" (Origin: ${line.origin_zone})`);
      }
      break;
    }

    case 'archive': {
      console.log('🏛️ Triggering Michael Sovereign Archivist Batching...');
      const today = new Date().toISOString().split('T')[0];
      const warmFile = path.join(ENGINE_PATHS.WARM_VAULT_DIR, `memory_objects_${today}.jsonl`);
      
      let objects: MemoryObject[] = [];
      if (fs.existsSync(warmFile)) {
        const lines = fs.readFileSync(warmFile, 'utf8').trim().split('\n');
        objects = lines.filter(Boolean).map(l => JSON.parse(l));
      }

      const manifest = createMichaelArchivalBatch(objects, 'COLD_PERMANENT_VAULT');
      console.log(`\n✅ Merkle Batch Created:`);
      console.log(`  Manifest ID:       ${manifest.manifest_id}`);
      console.log(`  Total Objects:     ${manifest.total_memory_objects_count}`);
      console.log(`  Merkle Root:       ${manifest.merkle_root_hash}`);
      console.log(`  Ed25519 Signature: ${manifest.ed25519_signature}`);
      console.log(`  Archival Tier:     ${manifest.tier}`);
      break;
    }

    case 'twin': {
      const prompt = arg || 'Where should we stage tonight and what sonic textures should we explore?';
      console.log(`🤖 Querying Gabriel Digital Twin: "${prompt}"\n`);
      const response = queryGabrielDigitalTwin(prompt);
      console.log(response.simulated_response);
      console.log(`\nConfidence: ${(response.confidence * 100).toFixed(1)}%`);
      console.log(`Watermark:  ${response.simulation_watermark}`);
      break;
    }

    default:
      console.log(`Unknown command "${command}". Available: score, ingest, graph, archive, twin, test`);
  }
}

main().catch(err => {
  console.error('CLI Error:', err);
  process.exit(1);
});
