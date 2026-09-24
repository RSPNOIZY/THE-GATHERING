/**
 * NOIZY Proof vs Contract Validator
 *
 * Hard-fail CI if the proof bundle doesn't match the canonical route contract file.
 * Contracts are the source of truth — not hardcoded arrays, not comments.
 *
 * Usage: node scripts/validate-proof-vs-contract.mjs
 */

import fs   from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();

// ── Load proof bundle ─────────────────────────────────────────────────────────

const proofDir = path.join(cwd, 'artifacts', 'proof');
if (!fs.existsSync(proofDir)) {
  console.error('BLOCKED: artifacts/proof/ not found — run generate-proof-bundle.mjs first');
  process.exit(1);
}

const proofFiles = fs.readdirSync(proofDir).filter(f => f.endsWith('.json'));
if (proofFiles.length === 0) {
  console.error('BLOCKED: no proof bundle found in artifacts/proof/');
  process.exit(1);
}

// ── Load contract ─────────────────────────────────────────────────────────────

const contractPath = path.join(cwd, 'contracts', 'routes', 'consent-gateway.routes.json');
if (!fs.existsSync(contractPath)) {
  console.error('BLOCKED: missing contract file: contracts/routes/consent-gateway.routes.json');
  process.exit(1);
}

let contract;
try {
  contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
} catch (e) {
  console.error(`BLOCKED: could not parse contract file: ${e.message}`);
  process.exit(1);
}

// ── Compare ───────────────────────────────────────────────────────────────────

const sameSet = (a = [], b = []) =>
  Array.isArray(a) && Array.isArray(b) &&
  a.length === b.length &&
  [...a].sort().every((x, i) => x === [...b].sort()[i]);

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

  if (proof.routing_contract !== contract.routing_contract) {
    console.error(`  FAIL routing_contract`);
    console.error(`    proof:    "${proof.routing_contract}"`);
    console.error(`    contract: "${contract.routing_contract}"`);
    failed = true;
  } else {
    console.log(`  PASS routing_contract`);
  }

  if (!sameSet(proof.routes_public, contract.routes_public)) {
    console.error(`  FAIL routes_public`);
    console.error(`    proof:    ${JSON.stringify(proof.routes_public)}`);
    console.error(`    contract: ${JSON.stringify(contract.routes_public)}`);
    failed = true;
  } else {
    console.log(`  PASS routes_public: ${JSON.stringify(proof.routes_public)}`);
  }

  if (!sameSet(proof.routes_protected, contract.routes_protected)) {
    console.error(`  FAIL routes_protected`);
    console.error(`    proof:    ${JSON.stringify(proof.routes_protected)}`);
    console.error(`    contract: ${JSON.stringify(contract.routes_protected)}`);
    failed = true;
  } else {
    console.log(`  PASS routes_protected: ${JSON.stringify(proof.routes_protected)}`);
  }
}

if (failed) {
  console.error('\nFAIL: proof does not match contract — deploy blocked');
  process.exit(1);
}

console.log('\nPASS: all proof bundles match canonical route contract');
