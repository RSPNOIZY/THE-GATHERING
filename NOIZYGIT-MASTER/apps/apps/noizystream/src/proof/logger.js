/**
 * NOIZYSTREAM Proof Logger
 * Append-only audit trail for all session events.
 * SHA-256 chained — each event hashes the previous entry.
 * Written to disk + pushed to GABRIEL memcell.
 *
 * RSP_001 | NOIZY Empire | 2026
 */

import { createHash } from 'crypto';
import { appendFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROOF_DIR = path.join(__dirname, '../../artifacts');
const PROOF_LOG = path.join(PROOF_DIR, 'proof-log.ndjson');
const GABRIEL_URL = process.env.DREAMCHAMBER_URL || 'http://localhost:7777';

let lastHash = '0000000000000000';
let eventCount = 0;

function sha256(s) {
  return createHash('sha256').update(s).digest('hex').slice(0, 16);
}

export function logProofEvent(event_type, actor, data = {}) {
  const now = new Date().toISOString();
  eventCount++;

  const entry = {
    seq: eventCount,
    event: event_type,
    actor,
    data,
    ts: now,
    prev_hash: lastHash,
  };

  const entryStr = JSON.stringify(entry);
  entry.hash = sha256(entryStr + lastHash);
  lastHash = entry.hash;

  // Append to NDJSON proof log
  try {
    appendFileSync(PROOF_LOG, JSON.stringify(entry) + '\n');
  } catch (_) {}

  // Push to GABRIEL
  fetch(`${GABRIEL_URL}/memcell/noizystream:proof:${event_type.replace('.', ':')}:${eventCount}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value: entry }),
  }).catch(() => {});

  return entry;
}

export function getProofChainHash() {
  return { hash: lastHash, events: eventCount, ts: new Date().toISOString() };
}

export function generateProofBundle(session) {
  const bundle = {
    proof_bundle: {
      system: 'NOIZYSTREAM',
      version: '1.0',
      generated_at: new Date().toISOString(),
      session_id: session.id,
      session_name: session.name,
      chain_hash: lastHash,
      total_events: eventCount,
    },
    session_summary: {
      created_at: session.created_at,
      closed_at: session.closed_at || null,
      status: session.status,
      host: session.host_id,
      participant_count: session.participants.length,
      route_count: session.routes.length,
      template: session.template,
    },
    participants: session.participants.map(p => ({
      id: p.id,
      role: p.role,
      joined_at: p.joined_at,
      left_at: p.left_at || null,
      status: p.status,
    })),
    routes_applied: session.routes.map(r => ({
      id: r.id,
      name: r.name || r.label,
      applied_at: r.applied_at,
      applied_by: r.applied_by,
    })),
    proof_events: session.proof_events,
  };

  const bundleHash = sha256(JSON.stringify(bundle));
  bundle.proof_bundle.bundle_hash = bundleHash;

  const outPath = path.join(PROOF_DIR, `proof-session-${session.id}.json`);
  try { writeFileSync(outPath, JSON.stringify(bundle, null, 2)); } catch (_) {}

  return bundle;
}
