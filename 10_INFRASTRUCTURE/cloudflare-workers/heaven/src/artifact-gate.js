/**
 * HEAVEN — Artifact Gate
 * ====================================================================
 * Issues short-lived, verdict-bound upload slots for the voice_artifacts
 * R2 bucket. The rule: no audio file can land in R2 unless it's written
 * to a key path that HEAVEN has authorized under an active verdict.
 *
 * Key layout under the VOICE_ARTIFACTS bucket:
 *
 *   {actor_id}/{action}/{scope}/{verdict_id}/{filename}
 *
 * Example:
 *   RSP_001/synth/demo/001/v_8fj3kc9x/take-01.wav
 *
 * This gate is called AFTER a verdict has been allowed and signed.
 * The flow is:
 *   1. checkConsent() → allowed verdict
 *   2. logConsentEvent()
 *   3. signVerdict()  → signed token
 *   4. issueArtifactSlot() → authorized R2 key prefix + max_bytes + ttl
 *
 * The synthesis engine (NOIZYVOX) then writes ONLY under that prefix,
 * presenting the signed token to the MCP mediator. HEAVEN itself does
 * not proxy audio bytes; it issues the authorization.
 *
 * Why prefix, not a pre-signed URL? Cloudflare R2 presigned URLs via
 * Workers require the AWS S3-compatible flow with signed headers. That
 * adds a dependency and more moving parts than we need right now. A
 * verdict-bound key prefix + a separately signed token gives us the
 * same security property: the downstream writer proves the token
 * matches the path on every write, and the MCP mediator enforces it.
 *
 * Author: Robert Stephen Plowman / MC96ECO / HEAVEN v0.3.0
 * ====================================================================
 */

const MAX_BYTES_DEFAULT = 50 * 1024 * 1024; // 50 MB per artifact
const TTL_SECONDS_DEFAULT = 900;            // 15 minutes to start an upload

// Strict: letters, digits, underscore, dash, dot. No slashes.
// Used for the atomic components (actor_id, action, filename, verdict_id).
function sanitize(s) {
  if (typeof s !== 'string' || s.length === 0) return null;
  if (s.length > 128) return null;
  if (!/^[A-Za-z0-9_.\-]+$/.test(s)) return null;
  if (s.includes('..')) return null;
  return s;
}

// Scope is the one path-like field: segments joined by '/'.
// Each segment individually must pass the strict sanitize.
function sanitizeScope(scope) {
  if (scope === null || scope === undefined || scope === '') return '_'; // sentinel
  if (typeof scope !== 'string') return null;
  if (scope.length > 128) return null;
  if (scope.startsWith('/') || scope.endsWith('/') || scope.includes('//')) return null;
  const segments = scope.split('/');
  if (segments.length === 0 || segments.length > 8) return null;
  for (const seg of segments) if (sanitize(seg) === null) return null;
  return scope;
}

/**
 * Build the bucket key prefix an authorized upload can write under.
 * Returns null if any component would be unsafe.
 */
export function keyPrefix({ actorId, action, scope, verdictId }) {
  const a  = sanitize(actorId);
  const ac = sanitize(action);
  const s  = sanitizeScope(scope);
  const v  = sanitize(verdictId);
  if (a === null || ac === null || s === null || v === null) return null;
  // Scope '_' is the sentinel for null/empty; it still joins cleanly.
  return [a, ac, s, v].join('/');
}

/**
 * issueArtifactSlot
 *
 * @param {object} args
 * @param {object} args.env
 * @param {object} args.verdict            - allowed verdict from checkConsent()
 * @param {string} args.actorId
 * @param {string} args.action
 * @param {string} [args.scope]
 * @param {string} [args.filename='out.wav']
 * @param {number} [args.maxBytes]
 * @param {number} [args.ttlSeconds]
 * @returns {Promise<object>}
 */
export async function issueArtifactSlot({
  env,
  verdict,
  actorId,
  action,
  scope,
  filename = 'out.wav',
  maxBytes = MAX_BYTES_DEFAULT,
  ttlSeconds = TTL_SECONDS_DEFAULT,
}) {
  if (!verdict || !verdict.allowed) {
    return { ok: false, reason: 'no_allowed_verdict' };
  }
  if (!env.VOICE_ARTIFACTS) {
    return { ok: false, reason: 'voice_artifacts_r2_unbound' };
  }
  const safeFile = sanitize(filename);
  if (!safeFile) {
    return { ok: false, reason: 'unsafe_filename' };
  }
  const prefix = keyPrefix({
    actorId,
    action,
    scope,
    verdictId: verdict.verdict_id,
  });
  if (!prefix) return { ok: false, reason: 'unsafe_path_components' };

  const now = Math.floor(Date.now() / 1000);
  return {
    ok: true,
    bucket: 'voice_artifacts',
    key: `${prefix}/${safeFile}`,
    prefix,
    max_bytes: maxBytes,
    expires_at: now + ttlSeconds,
    note: 'Uploader must present the signed verdict token. MCP mediator enforces key==prefix/filename and max_bytes.',
  };
}

/**
 * Guard for server-side writes: validate a key matches the authorized
 * prefix and size is within bounds. Called by the MCP mediator (or,
 * in local dev, directly by the worker when accepting writes).
 */
export function keyAuthorizedByVerdict({ key, prefix, maxBytes, sizeBytes }) {
  if (typeof key !== 'string' || typeof prefix !== 'string') return false;
  if (!key.startsWith(prefix + '/')) return false;
  if (key.slice(prefix.length + 1).includes('/')) return false; // no nested dirs
  if (typeof sizeBytes === 'number' && sizeBytes > maxBytes) return false;
  return true;
}
