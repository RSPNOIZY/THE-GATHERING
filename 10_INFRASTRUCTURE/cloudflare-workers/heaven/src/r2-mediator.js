/**
 * HEAVEN — R2 Write Mediator
 * ====================================================================
 * The enforcement half of the artifact-gate. /api/synth/request ISSUES
 * an authorized prefix; /api/r2/authorize-write VERIFIES that a pending
 * PUT falls inside that prefix and within size bounds.
 *
 * Flow:
 *   1. NOIZYVOX receives a signed verdict token + authorized prefix.
 *   2. Before PUTting audio bytes into R2, NOIZYVOX calls
 *      POST /api/r2/authorize-write  { token, key, size_bytes }
 *   3. HEAVEN verifies the token cryptographically, recomputes the
 *      prefix from the token payload, and confirms that:
 *        - key starts with prefix + "/"
 *        - key has no nested directories below the prefix
 *        - size_bytes is within the per-artifact cap
 *   4. HEAVEN returns { allowed: true, prefix, bucket } or a refusal.
 *
 * This closes the gap flagged at end of v0.3.0: a compromised caller
 * cannot write outside their verdict's authorized path.
 *
 * Author: Robert Stephen Plowman / MC96ECO / HEAVEN v0.4.0
 * ====================================================================
 */

import { verifyVerdict } from './verdict-signer.js';
import { keyPrefix, keyAuthorizedByVerdict } from './artifact-gate.js';

const DEFAULT_MAX_BYTES = 50 * 1024 * 1024; // 50 MB

/**
 * authorizeR2Write
 *
 * @param {object} args
 * @param {object} args.env
 * @param {string} args.token         - signed verdict token
 * @param {string} args.key           - the intended R2 object key
 * @param {number} args.sizeBytes     - the intended object size
 * @param {number} [args.maxBytes]    - override per-artifact cap
 * @returns {Promise<object>}
 */
export async function authorizeR2Write({
  env,
  token,
  key,
  sizeBytes,
  maxBytes = DEFAULT_MAX_BYTES,
}) {
  // 1. Token must be structurally valid, cryptographically signed,
  //    within ttl, and carry a payload we trust.
  const verified = await verifyVerdict({ env, token });
  if (!verified.ok) {
    return { allowed: false, reason: `token_${verified.reason}` };
  }
  const p = verified.payload;

  // 2. Recompute the authorized prefix from the token payload. We
  //    do NOT trust a prefix carried in the request body — only one
  //    derived from the signed payload can authorize.
  const prefix = keyPrefix({
    actorId: p.actor_id,
    action:  p.action,
    scope:   p.scope,
    verdictId: p.verdict_id,
  });
  if (!prefix) {
    return { allowed: false, reason: 'unsafe_verdict_path_components' };
  }

  // 3. Key must be well-formed and inside the prefix with no nesting.
  if (typeof key !== 'string' || key.length === 0 || key.length > 1024) {
    return { allowed: false, reason: 'malformed_key' };
  }
  if (!keyAuthorizedByVerdict({ key, prefix, maxBytes, sizeBytes })) {
    // Distinguish between prefix-mismatch and size-exceeded for auditability.
    if (!key.startsWith(prefix + '/')) {
      return { allowed: false, reason: 'key_outside_authorized_prefix', prefix };
    }
    if (key.slice(prefix.length + 1).includes('/')) {
      return { allowed: false, reason: 'nested_path_not_allowed', prefix };
    }
    if (typeof sizeBytes === 'number' && sizeBytes > maxBytes) {
      return { allowed: false, reason: 'size_exceeds_max_bytes', max_bytes: maxBytes };
    }
    return { allowed: false, reason: 'key_not_authorized', prefix };
  }

  return {
    allowed: true,
    bucket: 'voice-artifacts',
    prefix,
    key,
    verdict_id: p.verdict_id,
    actor_id: p.actor_id,
    kid: verified.kid,
    note: 'Proceed with the R2 PUT. Caller must re-check the final object ETag matches the pre-declared size.',
  };
}
