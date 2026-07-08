// Round-trip test for r2-mediator.js — proves the four refusal
// reasons fire correctly and the happy path allows.
import { signVerdict, rotateKeys }   from '../src/verdict-signer.js';
import { authorizeR2Write }          from '../src/r2-mediator.js';
import { keyPrefix }                 from '../src/artifact-gate.js';

// Mock KV.
const kv = new Map();
const MockKV = {
  get: async (k, opts) => {
    const v = kv.get(k);
    if (!v) return null;
    return opts?.type === 'json' ? JSON.parse(v) : v;
  },
  put: async (k, v) => { kv.set(k, v); },
};
const env = { VERDICT_KEYS: MockKV };

await rotateKeys(env);

const verdict = { allowed: true, verdict_id: 'v_test_r2', record_id: 'rec' };
const actorId = 'RSP_001';
const action = 'synth';
const scope = 'demo/001';

const { token } = await signVerdict({ env, verdict, actorId, action, scope, ttlSeconds: 120 });
const prefix = keyPrefix({ actorId, action, scope, verdictId: verdict.verdict_id });
console.log('authorized prefix:', prefix);

// 1. HAPPY PATH — key inside prefix, under size cap.
const r1 = await authorizeR2Write({
  env, token,
  key: `${prefix}/take-01.wav`,
  sizeBytes: 2 * 1024 * 1024,
});
console.log('1 happy:          ', r1.allowed, r1.reason || 'ok');

// 2. Prefix mismatch — different actor.
const r2 = await authorizeR2Write({
  env, token,
  key: `OTHER_ACTOR/synth/demo/001/XXX/take.wav`,
  sizeBytes: 1024,
});
console.log('2 bad prefix:     ', r2.allowed, r2.reason);

// 3. Nested path below prefix.
const r3 = await authorizeR2Write({
  env, token,
  key: `${prefix}/sub/take.wav`,
  sizeBytes: 1024,
});
console.log('3 nested:         ', r3.allowed, r3.reason);

// 4. Size exceeds cap.
const r4 = await authorizeR2Write({
  env, token,
  key: `${prefix}/huge.wav`,
  sizeBytes: 500 * 1024 * 1024,
});
console.log('4 size exceeded:  ', r4.allowed, r4.reason);

// 5. Malformed key (empty).
const r5 = await authorizeR2Write({
  env, token,
  key: '',
  sizeBytes: 1024,
});
console.log('5 empty key:      ', r5.allowed, r5.reason);

// 6. Tampered token.
const tampered = token.slice(0, -3) + 'AAA';
const r6 = await authorizeR2Write({
  env, token: tampered,
  key: `${prefix}/take.wav`,
  sizeBytes: 1024,
});
console.log('6 tampered token: ', r6.allowed, r6.reason);

// 7. Expired token.
const { token: shortToken } = await signVerdict({
  env, verdict, actorId, action, scope, ttlSeconds: -5,
});
const r7 = await authorizeR2Write({
  env, token: shortToken,
  key: `${prefix}/take.wav`,
  sizeBytes: 1024,
});
console.log('7 expired token:  ', r7.allowed, r7.reason);
