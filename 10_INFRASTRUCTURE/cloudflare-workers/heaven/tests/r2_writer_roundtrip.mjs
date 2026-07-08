// Round-trip test for r2-writer.js — proves the streaming write gate,
// metadata stamping, catalogue insert, manifest read, and revoke.
// Mocks R2 + D1 + KV so we test logic without real Cloudflare calls.
import { signVerdict, rotateKeys } from '../src/verdict-signer.js';
import { keyPrefix }               from '../src/artifact-gate.js';
import {
  writeAuthorizedArtifact,
  listArtifactsByActor,
  revokeArtifact,
} from '../src/r2-writer.js';

// ── Mock KV ─────────────────────────────────────────────────────────
const kvStore = new Map();
const MockKV = {
  get: async (k, opts) => {
    const v = kvStore.get(k);
    if (!v) return null;
    return opts?.type === 'json' ? JSON.parse(v) : v;
  },
  put: async (k, v) => { kvStore.set(k, v); },
};

// ── Mock R2 ─────────────────────────────────────────────────────────
const r2Store = new Map();
let putCallCount = 0;
const MockR2 = {
  put: async (key, body, opts = {}) => {
    putCallCount++;
    // Read ReadableStream fully for test (in real Worker, R2 streams it).
    let totalBytes = 0;
    if (body && typeof body.getReader === 'function') {
      const reader = body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        totalBytes += value.length;
      }
    } else if (typeof body === 'string') {
      totalBytes = body.length;
    }
    const etag = 'mock-etag-' + putCallCount;
    r2Store.set(key, {
      key, etag, size: totalBytes,
      httpMetadata: opts.httpMetadata || {},
      customMetadata: opts.customMetadata || {},
    });
    return { etag };
  },
  delete: async (key) => { r2Store.delete(key); return null; },
};

// ── Mock D1 (catalogue_db) ──────────────────────────────────────────
const artifacts = [];
const MockD1 = {
  prepare: (sql) => ({
    _sql: sql,
    _params: [],
    bind(...p) { this._params = p; return this; },
    async run() {
      if (/INSERT OR IGNORE INTO artifacts/.test(this._sql)) {
        const [artifact_id, actor_id, verdict_id, object_key, size_bytes, content_type, etag, kid] = this._params;
        if (!artifacts.find((a) => a.artifact_id === artifact_id)) {
          artifacts.push({
            artifact_id, actor_id, verdict_id,
            bucket: 'voice-artifacts',
            object_key, size_bytes, content_type, etag, kid,
            status: 'active',
            written_at: new Date().toISOString(),
          });
        }
        return { success: true };
      }
      if (/UPDATE artifacts SET status='revoked'/.test(this._sql)) {
        const [key] = this._params;
        const a = artifacts.find((x) => x.artifact_id === key);
        if (a) { a.status = 'revoked'; a.revoked_at = new Date().toISOString(); }
        return { success: true };
      }
      return { success: true };
    },
    async first() {
      if (/SELECT artifact_id, actor_id FROM artifacts/.test(this._sql)) {
        const [key] = this._params;
        return artifacts.find((a) => a.artifact_id === key) || null;
      }
      return null;
    },
    async all() {
      if (/SELECT artifact_id, object_key, size_bytes, content_type, etag, verdict_id, kid, written_at/.test(this._sql)) {
        const [actorId, maybeVerdictOrLimit, maybeLimit] = this._params;
        let rows = artifacts.filter((a) => a.actor_id === actorId);
        if (/AND verdict_id = \?/.test(this._sql)) {
          rows = rows.filter((a) => a.verdict_id === maybeVerdictOrLimit);
        }
        return { results: rows };
      }
      return { results: [] };
    },
  }),
};

const env = {
  VERDICT_KEYS:     MockKV,
  VOICE_ARTIFACTS:  MockR2,
  CATALOGUE_DB:     MockD1,
  HEAVEN_VERSION:   '0.5.0-test',
};

// ── Helper: build a Request-like object with a stream body ──────────
function makeBody(str) {
  const bytes = new TextEncoder().encode(str);
  const stream = new ReadableStream({
    start(controller) { controller.enqueue(bytes); controller.close(); },
  });
  return { stream, byteLength: bytes.length };
}
function makeRequest(body) {
  return { body: body.stream };
}

// ── Setup ───────────────────────────────────────────────────────────
await rotateKeys(env);
const verdict = { allowed: true, verdict_id: 'v_test_writer', record_id: 'rec' };
const actorId = 'RSP_001';
const action  = 'synth';
const scope   = 'demo/001';

const { token } = await signVerdict({ env, verdict, actorId, action, scope, ttlSeconds: 120 });
const prefix = keyPrefix({ actorId, action, scope, verdictId: verdict.verdict_id });
const key    = `${prefix}/take-01.wav`;
console.log('prefix:', prefix);
console.log('key:   ', key);

// 1. HAPPY PATH — authorized write.
{
  const b = makeBody('RIFF....WAVEfmt fake audio data');
  const r = await writeAuthorizedArtifact({
    env, request: makeRequest(b), token, key,
    declaredSize: b.byteLength, contentType: 'audio/wav',
  });
  console.log('1 write happy:   ', r.ok, r.status, r.catalogue?.inserted, 'etag:', r.etag);
}

// 2. CATALOGUE has 1 row.
{
  const m = await listArtifactsByActor({ env, actorId });
  console.log('2 manifest:      ', m.count, 'row:', m.artifacts[0]?.artifact_id);
}

// 3. PREFIX MISMATCH — 403.
{
  const b = makeBody('x');
  const r = await writeAuthorizedArtifact({
    env, request: makeRequest(b), token,
    key: 'WRONG_ACTOR/synth/demo/001/XXX/bad.wav',
    declaredSize: b.byteLength, contentType: 'audio/wav',
  });
  console.log('3 prefix mismatch:', r.ok, r.status, r.reason);
}

// 4. UNSUPPORTED CONTENT TYPE — 415.
{
  const b = makeBody('x');
  const r = await writeAuthorizedArtifact({
    env, request: makeRequest(b), token, key,
    declaredSize: b.byteLength, contentType: 'application/zip',
  });
  console.log('4 bad content-type:', r.ok, r.status, r.reason);
}

// 5. MISSING CONTENT-LENGTH — 411.
{
  const b = makeBody('x');
  const r = await writeAuthorizedArtifact({
    env, request: makeRequest(b), token, key,
    declaredSize: null, contentType: 'audio/wav',
  });
  console.log('5 missing len:   ', r.ok, r.status, r.reason);
}

// 6. SIZE EXCEEDS CAP — 403 from mediator (before any R2 call).
{
  const b = makeBody('x');
  const r = await writeAuthorizedArtifact({
    env, request: makeRequest(b), token, key,
    declaredSize: 500 * 1024 * 1024, contentType: 'audio/wav',
  });
  console.log('6 size cap:      ', r.ok, r.status, r.reason);
}

// 7. REVOKE — wrong actor id.
{
  const r = await revokeArtifact({ env, key, actorId: 'OTHER_ACTOR' });
  console.log('7 revoke wrong:  ', r.ok, r.status, r.reason);
}

// 8. REVOKE — correct owner.
{
  const r = await revokeArtifact({ env, key, actorId });
  console.log('8 revoke right:  ', r.ok, r.status);
}

// 9. After revoke — R2 object gone, catalogue row still present w/ status=revoked.
{
  const inR2 = r2Store.has(key);
  const row  = artifacts.find((a) => a.artifact_id === key);
  console.log('9 post-revoke:   r2_has=', inR2, 'catalogue_status=', row?.status, 'revoked_at:', !!row?.revoked_at);
}

// 10. Manifest after revoke — row still shows up (audit retention).
{
  const m = await listArtifactsByActor({ env, actorId });
  console.log('10 manifest post:', m.count, 'status[0]:', m.artifacts[0]?.artifact_id);
}
