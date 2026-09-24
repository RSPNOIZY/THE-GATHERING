/**
 * NOIZY Proof vs Routes Validator
 *
 * CI hard-fail: if proof bundle doesn't match the canonical routing contract,
 * the deploy is blocked. No drift. No lies. Protocol > Promises.
 *
 * Usage: node scripts/validate-proof-vs-routes.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

// ── Canonical routing contract (single source of truth) ──────────────────────
// Update here when routes change — CI will enforce the update everywhere.

const CANON = {
  routes_public:    ['/health'],
  routes_protected: ['/verify', '/revoke', '/status/:creatorId'],
};

// ── Load proof bundle ─────────────────────────────────────────────────────────

const proofDir = path.join(process.cwd(), 'artifacts', 'proof');

if (!fs.existsSync(proofDir)) {
  console.error('FAIL: artifacts/proof/ directory not found — run generate-proof-bundle.mjs first');
  process.exit(1);
}

const proofFiles = fs.readdirSync(proofDir).filter(f => f.endsWith('.json'));
if (proofFiles.length === 0) {
  console.error('FAIL: no proof bundle found in artifacts/proof/');
  process.exit(1);
}

// Validate all proof files present
let failed = false;

for (const file of proofFiles) {
  const filePath = path.join(proofDir, file);
  let proof;

  try {
    proof = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.error(`FAIL: could not parse ${file}: ${e.message}`);
    failed = true;
    continue;
  }

  console.log(`checking: ${file}`);

  const eq = (a = [], b = []) =>
    a.length === b.length && [...a].sort().every((x, i) => x === [...b].sort()[i]);

  if (!eq(proof.routes_public, CANON.routes_public)) {
    console.error(`  FAIL routes_public`);
    console.error(`    proof:  ${JSON.stringify(proof.routes_public)}`);
    console.error(`    canon:  ${JSON.stringify(CANON.routes_public)}`);
    failed = true;
  } else {
    console.log(`  PASS routes_public: ${JSON.stringify(proof.routes_public)}`);
  }

  if (!eq(proof.routes_protected, CANON.routes_protected)) {
    console.error(`  FAIL routes_protected`);
    console.error(`    proof:  ${JSON.stringify(proof.routes_protected)}`);
    console.error(`    canon:  ${JSON.stringify(CANON.routes_protected)}`);
    failed = true;
  } else {
    console.log(`  PASS routes_protected: ${JSON.stringify(proof.routes_protected)}`);
  }
}

if (failed) {
  console.error('\nFAIL: proof does not match canonical routing contract — deploy blocked');
  process.exit(1);
}

console.log('\nPASS: proof matches canonical routing contract');
