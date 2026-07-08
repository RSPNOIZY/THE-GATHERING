/**
 * HEAVEN — Verdict Signer
 * ====================================================================
 * Turns a consent verdict into a signed, tamper-evident token that
 * downstream services (NOIZYVOX, MCP gateway, R2 artifact writers)
 * must verify BEFORE emitting any voice bytes or derivatives.
 *
 * Design:
 *   - HMAC-SHA256 over a canonical JSON-like payload.
 *   - Rotating signing key stored in KV under "VERDICT_KEYS".
 *   - Two keys live at once: "current" and "previous". Verifiers
 *     accept both. Rotation is atomic: new becomes current, current
 *     becomes previous, previous is retired.
 *   - Tokens carry an explicit `exp` — unsigned/expired tokens are
 *     rejected even if the signature is valid.
 *
 * This is the difference between a procedural gate and a
 * cryptographic one. A compromised caller cannot bypass HEAVEN
 * because they don't hold the signing key.
 *
 * Author: Robert Stephen Plowman / MC96ECO / HEAVEN v0.3.0
 * ====================================================================
 */

// ── utilities ────────────────────────────────────────────────────────

function toB64Url(bytes) {
  // bytes: Uint8Array
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromB64Url(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function importHmacKey(rawKeyBytes) {
  return crypto.subtle.importKey(
    'raw',
    rawKeyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function canonicalPayload(p) {
  // Explicit key order — any future field additions go at the END.
  // Never reorder existing fields; that would invalidate old tokens.
  return JSON.stringify({
    v: p.v,               // token version
    kid: p.kid,           // key id used to sign
    verdict_id: p.verdict_id,
    actor_id: p.actor_id,
    action: p.action,
    scope: p.scope || null,
    record_id: p.record_id || null,
    iat: p.iat,           // issued at (unix seconds)
    exp: p.exp,           // expires at (unix seconds)
    nonce: p.nonce,
  });
}

function constantTimeEq(a, b) {
  // a, b: Uint8Array of equal length; constant-time compare.
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// ── key management (KV-backed, two-key rotation) ─────────────────────

/**
 * Layout in KV (binding VERDICT_KEYS):
 *   verdict:key:current  → { kid, material_b64url, created_at }
 *   verdict:key:previous → { kid, material_b64url, created_at }  (optional)
 *
 * rotateKeys() moves current → previous and installs a fresh current.
 * Generation is 32 random bytes (256-bit HMAC key).
 */

export async function getSigningKey(env) {
  if (!env.VERDICT_KEYS) throw new Error('VERDICT_KEYS KV binding missing');
  const raw = await env.VERDICT_KEYS.get('verdict:key:current', { type: 'json' });
  if (!raw) throw new Error('No current verdict signing key — run /api/keys/rotate first');
  const keyBytes = fromB64Url(raw.material_b64url);
  return { kid: raw.kid, cryptoKey: await importHmacKey(keyBytes) };
}

async function getVerifyKeys(env) {
  const out = [];
  const cur = await env.VERDICT_KEYS.get('verdict:key:current', { type: 'json' });
  const prev = await env.VERDICT_KEYS.get('verdict:key:previous', { type: 'json' });
  if (cur)  out.push({ kid: cur.kid,  cryptoKey: await importHmacKey(fromB64Url(cur.material_b64url)) });
  if (prev) out.push({ kid: prev.kid, cryptoKey: await importHmacKey(fromB64Url(prev.material_b64url)) });
  return out;
}

export async function rotateKeys(env) {
  if (!env.VERDICT_KEYS) throw new Error('VERDICT_KEYS KV binding missing');
  const current = await env.VERDICT_KEYS.get('verdict:key:current', { type: 'json' });

  // Generate new key.
  const raw = new Uint8Array(32);
  crypto.getRandomValues(raw);
  const newRec = {
    kid: 'k_' + Date.now().toString(36) + '_' + toB64Url(raw).slice(0, 6),
    material_b64url: toB64Url(raw),
    created_at: new Date().toISOString(),
  };

  // Move current → previous (retires whatever was previous).
  if (current) {
    await env.VERDICT_KEYS.put('verdict:key:previous', JSON.stringify(current));
  }
  await env.VERDICT_KEYS.put('verdict:key:current', JSON.stringify(newRec));

  // Optional audit row — caller writes it; signer stays side-effect-free
  // beyond the KV writes themselves.
  return {
    rotated: true,
    new_kid: newRec.kid,
    retired_kid: current?.kid || null,
    rotated_at: newRec.created_at,
  };
}

// ── sign / verify verdicts ───────────────────────────────────────────

/**
 * signVerdict
 * @param {object} args
 * @param {object} args.env
 * @param {object} args.verdict      - output of checkConsent()
 * @param {string} args.actorId
 * @param {string} args.action
 * @param {string} [args.scope]
 * @param {number} [args.ttlSeconds] - default 600 (10 minutes)
 * @returns {Promise<{token: string, exp: number, kid: string}>}
 */
export async function signVerdict({ env, verdict, actorId, action, scope, ttlSeconds = 600 }) {
  if (!verdict || !verdict.allowed) {
    throw new Error('Refusing to sign a non-allow verdict');
  }
  const { kid, cryptoKey } = await getSigningKey(env);
  const now = Math.floor(Date.now() / 1000);

  const nonce = toB64Url(crypto.getRandomValues(new Uint8Array(12)));
  const payload = {
    v: 1,
    kid,
    verdict_id: verdict.verdict_id,
    actor_id: actorId,
    action,
    scope: scope || null,
    record_id: verdict.record_id || null,
    iat: now,
    exp: now + ttlSeconds,
    nonce,
  };

  const payloadBytes = new TextEncoder().encode(canonicalPayload(payload));
  const sigBuf = await crypto.subtle.sign('HMAC', cryptoKey, payloadBytes);
  const token = toB64Url(payloadBytes) + '.' + toB64Url(new Uint8Array(sigBuf));

  return { token, exp: payload.exp, kid };
}

/**
 * verifyVerdict — accepts a token, returns a structured result.
 *   { ok: true,  payload }  on success
 *   { ok: false, reason }   on any failure
 * Never throws.
 */
export async function verifyVerdict({ env, token }) {
  if (typeof token !== 'string' || !token.includes('.')) {
    return { ok: false, reason: 'malformed_token' };
  }
  const [payloadB64, sigB64] = token.split('.', 2);
  let payloadBytes, payload;
  try {
    payloadBytes = fromB64Url(payloadB64);
    payload = JSON.parse(new TextDecoder().decode(payloadBytes));
  } catch {
    return { ok: false, reason: 'unparseable_payload' };
  }
  if (payload.v !== 1) return { ok: false, reason: 'unknown_token_version' };

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp < now) {
    return { ok: false, reason: 'expired' };
  }
  if (typeof payload.iat !== 'number' || payload.iat > now + 60) {
    // small clock skew tolerance
    return { ok: false, reason: 'issued_in_future' };
  }

  const sigBytes = fromB64Url(sigB64);
  const candidates = await getVerifyKeys(env);
  if (candidates.length === 0) return { ok: false, reason: 'no_verify_keys' };

  // Try current first, then previous. Constant-time on each candidate.
  const canonical = new TextEncoder().encode(canonicalPayload(payload));
  for (const k of candidates) {
    if (k.kid !== payload.kid) continue; // kid must match the one that signed
    const expectedBuf = await crypto.subtle.sign('HMAC', k.cryptoKey, canonical);
    if (constantTimeEq(new Uint8Array(expectedBuf), sigBytes)) {
      return { ok: true, payload, kid: k.kid };
    }
  }
  return { ok: false, reason: 'signature_mismatch_or_unknown_kid' };
}
