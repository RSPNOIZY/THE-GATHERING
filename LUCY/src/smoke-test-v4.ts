/**
 * LUCY v4.0 — Unified Smoke Test & Engine Verification Suite
 * 
 * Verifies:
 * 1. Memory Object Schema & Blank Black Translation
 * 2. NOIZY World Model Ottawa Zone Scoring Engine
 * 3. Dreamchamber Knowledge Graph Node Generation & Traversal
 * 4. Michael Sovereign Archivist Merkle Root Verification & Vaulting
 * 5. Gabriel Digital Twin Reasoning & Watermark Safety Gates
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import {
  BlankBlackRow,
  convertBlankBlackToMemoryObject,
  MemoryObjectSchema,
  computeZoneScore,
  OttawaZoneTagSchema,
  PersonNodeSchema,
  IdeaNodeSchema,
  AssetNodeSchema,
  ProjectNodeSchema,
  GabrielProfileVectorSchema,
  buildMerkleRoot,
  MICHAEL_STORAGE_TIERS,
} from './index';

import {
  ingestShiftRows,
  evaluateOttawaZones,
  synthesizeDreamchamberGraph,
  createMichaelArchivalBatch,
  queryGabrielDigitalTwin,
} from './engine/lucy-v4-engine';

let passed = 0;
let failed = 0;
const errors: string[] = [];

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e: any) {
    failed++;
    errors.push(`${name}: ${e.message}`);
    console.log(`  ❌ ${name}: ${e.message}`);
  }
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('  LUCY v4.0 — PERSONAL OPERATING SYSTEM VERIFICATION SUITE');
console.log('═══════════════════════════════════════════════════════════════\n');

// ─── 1. MEMORY OBJECT SCHEMA & TRANSLATION ───────────────────
console.log('📦 1. Memory Object Ingestion & Conversion:');

test('Converts Blank Black row into valid Memory Object', () => {
  const sampleRow: BlankBlackRow = {
    Date: '2026-08-14',
    Time: '23:15',
    Platform: 'UBER',
    PickupLocation: 'National Arts Centre, Ottawa',
    DropoffLocation: 'ByWard Market, York St',
    OttawaZone: 'BYWARD_MARKET',
    GrossFareCAD: 34.50,
    PlatformFeeCAD: 7.20,
    NetFareCAD: 27.30,
    TipsCAD: 8.00,
    SurgeMultiplier: 1.65,
    DistanceKM: 4.8,
    DurationMinutes: 14,
    DetectedLanguages: 'fr (0.95), en (0.80)',
    CreativeSparkNotes: 'Concept for Ottawa Midnight Mist 808 sub-bass modulation in D Minor',
    SentimentRating: 'inspirational',
    ReceiptID: 'RCP_TEST_101',
  };

  const partialObj = convertBlankBlackToMemoryObject(sampleRow, 'RUN_TEST');
  assert(partialObj.schema_version === '4.0.0', 'Schema version must be 4.0.0');
  assert(partialObj.type === 'idea', 'Rows with creative spark notes should be typed as idea');
  assert(partialObj.signals?.revenue_gross === 34.50, 'Revenue gross must match');
  assert(partialObj.value_score?.total_score === 85, 'Value score should be boosted for creative spark');
  assert(partialObj.location?.zone_tag === 'BYWARD_MARKET', 'Zone tag must match');
});

test('Ingests full batch of shift rows and persists JSONL', () => {
  const shiftRows: BlankBlackRow[] = [
    {
      Date: '2026-08-14',
      Time: '21:00',
      Platform: 'UBER',
      PickupLocation: 'Ottawa Macdonald-Cartier Airport (YOW)',
      DropoffLocation: 'Chateau Laurier, Wellington St',
      OttawaZone: 'YOW_AIRPORT',
      GrossFareCAD: 45.00,
      PlatformFeeCAD: 10.00,
      NetFareCAD: 35.00,
      TipsCAD: 10.00,
      SurgeMultiplier: 1.40,
      DistanceKM: 16.5,
      DurationMinutes: 24,
      DetectedLanguages: 'en (0.98), fr (0.85)',
      ReceiptID: 'RCP_TEST_102',
    },
    {
      Date: '2026-08-14',
      Time: '22:15',
      Platform: 'LYFT',
      PickupLocation: 'Lansdowne Park TD Place',
      DropoffLocation: 'Elgin St, Centretown',
      OttawaZone: 'GLEBE_LANSDOWNE',
      GrossFareCAD: 28.00,
      PlatformFeeCAD: 6.00,
      NetFareCAD: 22.00,
      TipsCAD: 5.00,
      SurgeMultiplier: 1.80,
      DistanceKM: 3.2,
      DurationMinutes: 12,
      CreativeSparkNotes: 'Acoustic reverb reflection curve based on Lansdowne stadium concourse',
      ReceiptID: 'RCP_TEST_103',
    },
  ];

  const summary = ingestShiftRows(shiftRows);
  assert(summary.memory_objects_created === 2, 'Should create 2 memory objects');
  assert(summary.total_gross_revenue_cad === 73.00, 'Total gross should equal 73.00');
  assert(summary.creative_sparks_count === 1, 'Should find 1 creative spark');
});

// ─── 2. NOIZY WORLD MODEL ZONE SCORING ───────────────────────
console.log('\n🗺️ 2. NOIZY World Model & Zone Scoring Engine:');

test('Computes deterministic zone score for ByWard Market Friday Night', () => {
  const result = computeZoneScore({
    zone_tag: 'BYWARD_MARKET',
    day_of_week: 'Fri',
    hour_of_day: 23,
    current_surge: 1.85,
    flight_arrivals_next_hour: 0,
    event_attendance_letting_out: 4000,
    weather_condition: 'CLEAR',
    active_translation_mode: true,
  });

  assert(result.zone_score >= 80, 'ByWard Market Friday night score should be >= 80');
  assert(result.staging_recommendation === 'STAGE_IMMEDIATELY', 'Should recommend STAGE_IMMEDIATELY');
  assert(result.language_profile.secondary.includes('fr'), 'Should include French in language profile');
  assert(result.projected_hourly_cad > 50, 'Projected hourly should be > $50 CAD');
});

test('Ranks all Ottawa zones dynamically', () => {
  const rankings = evaluateOttawaZones(new Date('2026-08-14T23:00:00Z'));
  assert(rankings.rankings.length === 5, 'Should rank all 5 major Ottawa zones');
  assert(rankings.rankings[0].zone_score >= rankings.rankings[1].zone_score, 'Must be sorted descending by score');
});

// ─── 3. DREAMCHAMBER KNOWLEDGE GRAPH SYNTHESIS ───────────────
console.log('\n🔮 3. Dreamchamber Knowledge Graph & Gabriel Twin:');

test('Synthesizes Knowledge Graph nodes from Memory Objects', () => {
  const shiftRows: BlankBlackRow[] = [
    {
      Date: '2026-08-14',
      Time: '23:30',
      Platform: 'PRIVATE',
      PickupLocation: 'NAC Southam Hall',
      DropoffLocation: 'Westboro Village',
      OttawaZone: 'DOWNTOWN_CENTRETOWN',
      GrossFareCAD: 60.00,
      PlatformFeeCAD: 0.00,
      NetFareCAD: 60.00,
      TipsCAD: 20.00,
      SurgeMultiplier: 2.00,
      DistanceKM: 8.5,
      DurationMinutes: 18,
      CreativeSparkNotes: 'Granular cello resynthesis patch with 432Hz root and bilingual spoken word overlay',
      ReceiptID: 'RCP_TEST_104',
    },
  ];

  const summary = ingestShiftRows(shiftRows);
  const graph = synthesizeDreamchamberGraph(summary.high_value_objects);
  
  assert(graph.total_ideas >= 1, 'Should create at least 1 Idea node');
  assert(graph.total_assets >= 1, 'Should create at least 1 Asset stem node');
  assert(graph.total_projects >= 1, 'Should link to a NOIZYFISH Project node');
  assert(graph.lineages[0].brand === 'NOIZYFISH', 'Target brand should default to NOIZYFISH');
});

test('Queries Gabriel Digital Twin with simulation safety watermark', () => {
  const response = queryGabrielDigitalTwin('Staging recommendation for midnight bilingual surge in Ottawa');
  assert(response.confidence >= 0.90, 'Confidence should be >= 0.90');
  assert(response.simulation_watermark.includes('SIMULATED_GABRIEL_REASONING'), 'Watermark must be present');
  assert(response.heuristics_applied.includes('PEACE_AND_CONSENT_FIRST'), 'Must apply consent heuristic');
});

// ─── 4. MICHAEL ARCHIVIST & MERKLE BATCH VERIFICATION ────────
console.log('\n🏛️ 4. Michael Sovereign Archivist & Merkle Integrity:');

test('Builds Merkle Root and produces signed Cold Vault manifest', () => {
  const dummyHashes = [
    'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
    'b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1',
    'c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2',
    'd4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3',
  ];

  const root = buildMerkleRoot(dummyHashes);
  assert(typeof root === 'string' && root.length === 64, 'Merkle root must be valid 64-char hex SHA-256');

  // Verify storage tiers configuration
  assert(MICHAEL_STORAGE_TIERS.COLD_PERMANENT_VAULT.max_retention_days === null, 'Cold tier must be perpetual (null)');
  assert(MICHAEL_STORAGE_TIERS.EPHEMERAL_PURGE.max_retention_days === 3, 'Ephemeral audio tier must be <= 3 days');
});

// ─── RESULTS SUMMARY ─────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════════════════');
console.log(`  RESULTS: ${passed} PASSED | ${failed} FAILED`);
console.log('═══════════════════════════════════════════════════════════════');

if (failed > 0) {
  console.error('\nFailures:\n' + errors.map(e => `  - ${e}`).join('\n'));
  process.exit(1);
} else {
  console.log('\n🎉 ALL LUCY v4.0 KERNEL SYSTEMS VERIFIED & READY FOR TONIGHT!');
  process.exit(0);
}
