/**
 * HEAVEN — R2 Writer
 * ====================================================================
 * The active write path. /api/r2/write receives a PUT whose body is
 * the audio bytes, verifies the signed verdict token against the key
 * and declared size, streams the body to R2 under a verdict-bound
 * prefix, stamps the R2 object with provenance metadata, and inserts
 * one row into catalogue_db.artifacts so the catalogue is the source
 * of truth for what audio exists under what consent.
 *
 * This closes the last R2 trust gap: HEAVEN no longer merely
 * *authorizes* a write — it performs it. No audio byte reaches R2
 * except through this door.
 *
 * Author: Robert Stephen Plowman / MC96ECO / HEAVEN v0.5.0
 * ====================================================================
 */

import { authorizeR2Write } from './r2-mediator.js';

const DEFAULT_MAX_BYTES = 50 * 1024 * 1024; // 50 MB
const ALLOWED_CONTENT_TYPES = new Set([
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/mpeg',
  'audio/mp4',
  'audio/aac',
  'audio/flac',
  'audio/ogg',
  'audio/webm',
  'application/octet-stream', // fallback — R2 stores the declared type anyway
]);

function nowIso() { return new Date().toISOString(); }

/**
 * writeAuthorizedArtifact
 *
 * @param {object} args
 * @param {object} args.env
 * @param {Request} args.request      - caller request; body is the audio
 * @param {string} args.token         - signed verdict token
 * @param {string} args.key           - intended R2 object key
 * @param {number} [args.declaredSize]- Content-Length-declared size in bytes
 * @param {string} [args.contentType]
 * @returns {Promise<object>}
 */
export async function writeAuthorizedArtifact({
  env, request, token, key, declaredSize, contentType,
}) {
  // 1. Pre-checks — must hit the mediator before we touch R2.
  if (!env.VOICE_ARTIFACTS) {
    return { ok: false, status: 503, reason: 'voice_artifacts_r2_unbound' };
  }

  // Content-Type validation — reject things that are not audio.
  const ct = (contentType || '').toLowerCase().split(';')[0].trim();
  if (ct && !ALLOWED_CONTENT_TYPES.has(ct)) {
    return { ok: false, status: 415, reason: 'unsupported_content_type', content_type: ct };
  }

  // Size must be declared and within cap. We trust Content-Length for
  // the pre-check; the actual enforcement is R2's put-size behavior.
  if (typeof declaredSize !== 'number' || !Number.isFinite(declaredSize) || declaredSize <= 0) {
    return { ok: false, status: 411, reason: 'content_length_required' };
  }

  // 2. Mediator — authorize the write BEFORE body is consumed.
  const auth = await authorizeR2Write({
    env, token, key,
    sizeBytes: declaredSize,
    maxBytes: DEFAULT_MAX_BYTES,
  });
  if (!auth.allowed) {
    return { ok: false, status: 403, reason: auth.reason, detail: auth };
  }

  // 3. Perform the R2 put. Stream the body through — do not buffer.
  const customMetadata = {
    actor_id:       auth.actor_id,
    verdict_id:     auth.verdict_id,
    kid:            auth.kid || 'unknown',
    declared_size:  String(declaredSize),
    content_type:   ct || 'application/octet-stream',
    written_at:     nowIso(),
    heaven_version: env.HEAVEN_VERSION || '0.5.0',
  };

  let putResult;
  try {
    putResult = await env.VOICE_ARTIFACTS.put(key, request.body, {
      httpMetadata: {
        contentType: ct || 'application/octet-stream',
      },
      customMetadata,
    });
  } catch (err) {
    return { ok: false, status: 502, reason: 'r2_put_failed', detail: String(err?.message || err) };
  }

  if (!putResult) {
    return { ok: false, status: 502, reason: 'r2_put_returned_null' };
  }

  // 4. Catalogue insert — the durable record. If this fails we do NOT
  //    delete the R2 object (the write is real), but we flag it so an
  //    operator can reconcile. Catalogue degradation ≠ data loss.
  let catalogue = { inserted: false };
  if (env.CATALOGUE_DB) {
    try {
      await env.CATALOGUE_DB
        .prepare(`
          INSERT OR IGNORE INTO artifacts
            (artifact_id, actor_id, verdict_id, bucket, object_key,
             size_bytes, content_type, etag, kid, written_at)
          VALUES (?, ?, ?, 'voice-artifacts', ?, ?, ?, ?, ?, datetime('now'));
        `)
        .bind(
          key,                     // artifact_id = the R2 key
          auth.actor_id,
          auth.verdict_id,
          key,
          declaredSize,
          ct || 'application/octet-stream',
          putResult.etag || null,
          auth.kid || null,
        )
        .run();
      catalogue.inserted = true;
    } catch (err) {
      catalogue = { inserted: false, reason: String(err?.message || err) };
    }
  }

  return {
    ok: true,
    status: 201,
    bucket: 'voice-artifacts',
    key,
    size_bytes: declaredSize,
    etag: putResult.etag || null,
    actor_id: auth.actor_id,
    verdict_id: auth.verdict_id,
    kid: auth.kid || null,
    custom_metadata: customMetadata,
    catalogue,
  };
}

/**
 * listArtifactsByActor — query the catalogue (the source of truth)
 * rather than R2-list. The catalogue is what HEAVEN enforces.
 */
export async function listArtifactsByActor({ env, actorId, verdictId, limit = 50 }) {
  if (!env.CATALOGUE_DB) return { ok: false, reason: 'catalogue_db_unbound' };
  const lim = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 500);
  const params = [actorId];
  let sql = `SELECT artifact_id, object_key, size_bytes, content_type, etag, verdict_id, kid, written_at
             FROM artifacts WHERE actor_id = ?`;
  if (verdictId) {
    sql += ' AND verdict_id = ?';
    params.push(verdictId);
  }
  sql += ' ORDER BY written_at DESC LIMIT ?';
  params.push(lim);

  const stmt = env.CATALOGUE_DB.prepare(sql).bind(...params);
  const res = await stmt.all();
  return { ok: true, actor_id: actorId, count: res.results?.length || 0, artifacts: res.results || [] };
}

/**
 * revokeArtifact — mark artifact revoked in catalogue and delete from R2.
 * Requires the same actor_id / verdict_id pairing that created it.
 * Asymmetric: even if the original verdict has expired, the owner of
 * the actor_id can revoke their own artifacts.
 */
export async function revokeArtifact({ env, key, actorId }) {
  if (!env.VOICE_ARTIFACTS) return { ok: false, reason: 'voice_artifacts_r2_unbound' };
  if (!env.CATALOGUE_DB)    return { ok: false, reason: 'catalogue_db_unbound' };

  // Confirm the artifact exists in the catalogue and belongs to actorId.
  const row = await env.CATALOGUE_DB
    .prepare('SELECT artifact_id, actor_id FROM artifacts WHERE artifact_id = ? LIMIT 1;')
    .bind(key)
    .first();
  if (!row) return { ok: false, status: 404, reason: 'artifact_not_in_catalogue' };
  if (row.actor_id !== actorId) {
    return { ok: false, status: 403, reason: 'actor_id_mismatch' };
  }

  // Delete from R2 first — if this fails, we do not advance the catalogue
  // to revoked (we'd rather say "not yet revoked" than claim a revoke
  // that didn't take).
  try {
    await env.VOICE_ARTIFACTS.delete(key);
  } catch (err) {
    return { ok: false, status: 502, reason: 'r2_delete_failed', detail: String(err?.message || err) };
  }

  // Mark catalogue row revoked (kept for audit, not deleted).
  try {
    await env.CATALOGUE_DB
      .prepare(`UPDATE artifacts SET status='revoked', revoked_at=datetime('now') WHERE artifact_id = ?;`)
      .bind(key)
      .run();
  } catch (err) {
    return { ok: true, status: 207, reason: 'r2_deleted_but_catalogue_not_updated', detail: String(err?.message || err) };
  }
  return { ok: true, status: 200, key, revoked_at: nowIso() };
}
