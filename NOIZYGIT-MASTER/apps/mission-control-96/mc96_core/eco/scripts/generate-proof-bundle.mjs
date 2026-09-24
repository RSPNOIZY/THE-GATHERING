/**
 * NOIZY Proof Bundle Generator
 *
 * Writes a deterministic JSON artifact recording the exact state of a deploy:
 * worker name, environment, git SHA, routing contract, and active bindings.
 *
 * Does NOT print secrets. All values come from env vars.
 *
 * Usage (CI or local):
 *   PROOF_SYSTEM=NOIZY \
 *   PROOF_COMPONENT=consent-gateway \
 *   PROOF_WORKER_NAME=consent-gateway \
 *   PROOF_ENVIRONMENT=staging \
 *   PROOF_GIT_SHA=$(git rev-parse HEAD) \
 *   PROOF_ROUTING_CONTRACT="TOP_LEVEL:/health,/verify,/revoke,/status/:creatorId" \
 *   PROOF_PUBLIC_ROUTES="/health" \
 *   PROOF_PROTECTED_ROUTES="/verify,/revoke,/status/:creatorId" \
 *   PROOF_KV_BINDINGS="CONSENT_KV" \
 *   PROOF_D1_BINDINGS="AGENT_MEMORY" \
 *   node scripts/generate-proof-bundle.mjs
 *
 * Output: artifacts/proof/<component>.<environment>.json
 */

import fs   from 'node:fs';
import path from 'node:path';

function req(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function csv(name) {
  return (process.env[name] || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

const component = req('PROOF_COMPONENT');
const env       = req('PROOF_ENVIRONMENT');

const bundle = {
  schema_version:   '1',
  system:           req('PROOF_SYSTEM'),
  component,
  worker_name:      req('PROOF_WORKER_NAME'),
  environment:      env,
  deployed_at:      new Date().toISOString(),
  git_sha:          req('PROOF_GIT_SHA'),
  routing_contract: req('PROOF_ROUTING_CONTRACT'),
  routes_public:    csv('PROOF_PUBLIC_ROUTES'),
  routes_protected: csv('PROOF_PROTECTED_ROUTES'),
  bindings: {
    kv: csv('PROOF_KV_BINDINGS'),
    d1: csv('PROOF_D1_BINDINGS'),
  },
};

const outDir  = path.join(process.cwd(), 'artifacts', 'proof');
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, `${component}.${env}.json`);
fs.writeFileSync(outPath, JSON.stringify(bundle, null, 2) + '\n');

console.log(`wrote ${outPath}`);
console.log(JSON.stringify(bundle, null, 2));
