/**
 * HEAVEN — Consent Gate
 * ====================================================================
 * The enforcement surface. Every synth request and every data-bearing
 * operation on an actor's voice passes through checkConsent() here
 * BEFORE any audio bytes, embeddings, or derivatives are emitted.
 *
 * This module is pure — it reads env.CONSENT_DB and env.CATALOGUE_DB
 * and returns verdicts. It never synthesizes audio itself.
 *
 * Design principles:
 *   - Default DENY. Absence of consent ≠ permission.
 *   - Every decision is logged, even denials.
 *   - Denials return a human sentence (Voice of Refusal), never a stack.
 *   - Never-Clauses are constitutional — imported, not configured.
 *
 * Author: Robert Stephen Plowman / MC96ECO / HEAVEN v0.2.0
 * ====================================================================
 */

// ── Never-Clauses: constitutional, not configurable ──────────────────
// If this array changes, bump NEVER_CLAUSES_VERSION in wrangler.toml
// and re-sign the governance hash in manifest_db.deploys.
export const NEVER_CLAUSES = Object.freeze([
  'NO_VOICE_EXPORT_WITHOUT_CONSENT_KEY',
  'NO_MODEL_TRAINING_OUTSIDE_APPROVED_SCOPE',
  'NO_IDENTITY_IMPERSONATION',
  'NO_SUBLICENSING',
  'NO_NSFW',
  'NO_POLITICAL_PERSUASION',
  'NO_MEDICAL_ADVICE',
  'NO_MINORS_VOICE_WITHOUT_GUARDIAN_CONSENT',
  'NO_DECEASED_VOICE_WITHOUT_ESTATE_CONSENT',
]);

// ── Voice of Refusal — the system says no, humanely ──────────────────
// Every denial carries a reason. Never a stack trace. Never silent.
export function voiceOfRefusal(reason, tone = 'standard') {
  const prefixes = {
    standard:    'I cannot proceed.',
    firm:        'I must decline.',
    educational: 'This request is blocked.',
  };
  const suffixes = {
    standard:    'This protects the actor and their voice.',
    firm:        'The Never-Clauses make this non-negotiable.',
    educational: 'NOIZY enforces consent at the infrastructure layer, not the policy layer.',
  };
  const p = prefixes[tone] || prefixes.standard;
  const s = suffixes[tone] || suffixes.standard;
  return `${p} ${reason} ${s}`;
}

// ── Consent verdict shape ────────────────────────────────────────────
// { allowed: boolean, reason: string, verdict_id: string, clause?: string }
function verdict(allowed, reason, extra = {}) {
  return {
    allowed,
    reason,
    verdict_id: cryptoUUID(),
    ts: new Date().toISOString(),
    ...extra,
  };
}

function cryptoUUID() {
  // Workers have crypto.randomUUID() on the global.
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  // Fallback — cheap but deterministic length.
  return 'v_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// ── checkConsent — the main gate ─────────────────────────────────────
/**
 * @param {object} args
 * @param {object} args.env           - Worker env with CONSENT_DB, CATALOGUE_DB
 * @param {string} args.actorId       - The actor/AVA owner id (e.g. RSP_001)
 * @param {string} args.action        - 'synth' | 'export' | 'train' | 'license'
 * @param {string} args.scope         - Free-text scope (e.g. 'demo/001', 'studio/fx')
 * @param {string} [args.requesterId] - Caller identity for audit
 * @returns {Promise<object>}         - Verdict
 */
export async function checkConsent({ env, actorId, action, scope, requesterId }) {
  // 1. Arg shape check — fail closed.
  if (!actorId || !action) {
    return verdict(false, voiceOfRefusal('Missing actorId or action.'), {
      clause: 'MALFORMED_REQUEST',
    });
  }

  // 2. Never-Clauses — hardcoded domain gates.
  if (action === 'nsfw' || /nsfw/i.test(scope || '')) {
    return verdict(false, voiceOfRefusal('NSFW scope is constitutionally blocked.', 'firm'), {
      clause: 'NO_NSFW',
    });
  }
  if (action === 'political' || /(campaign|endorse|political)/i.test(scope || '')) {
    return verdict(false, voiceOfRefusal('Political persuasion is constitutionally blocked.', 'firm'), {
      clause: 'NO_POLITICAL_PERSUASION',
    });
  }
  if (action === 'medical_advice' || /(medical|prescribe|diagnos)/i.test(scope || '')) {
    return verdict(false, voiceOfRefusal('Medical advice synthesis is constitutionally blocked.', 'firm'), {
      clause: 'NO_MEDICAL_ADVICE',
    });
  }

  // 3. CONSENT_DB binding — required, or we fail closed.
  if (!env.CONSENT_DB) {
    return verdict(false, voiceOfRefusal('Consent database is unreachable.', 'firm'), {
      clause: 'CONSENT_DB_UNBOUND',
    });
  }

  // 4. Subject must exist in consent_db.subjects.
  const subject = await env.CONSENT_DB
    .prepare('SELECT subject_id, actor_id, legal_name, status FROM subjects WHERE actor_id = ? LIMIT 1;')
    .bind(actorId)
    .first();

  if (!subject) {
    return verdict(false, voiceOfRefusal(`No subject record for actor_id=${actorId}.`, 'educational'), {
      clause: 'SUBJECT_NOT_ENROLLED',
    });
  }
  if (subject.status && subject.status !== 'active') {
    return verdict(false, voiceOfRefusal(`Subject ${actorId} is ${subject.status}, not active.`, 'firm'), {
      clause: 'SUBJECT_INACTIVE',
    });
  }

  // 5. Find a consent_record that covers (action, scope).
  // We match the most recent non-revoked record for this action.
  const record = await env.CONSENT_DB
    .prepare(`
      SELECT record_id, action, scope, status, contract_version, granted_at, expires_at
      FROM consent_records
      WHERE actor_id = ?
        AND action = ?
        AND status = 'granted'
        AND (expires_at IS NULL OR expires_at > datetime('now'))
      ORDER BY granted_at DESC
      LIMIT 1;
    `)
    .bind(actorId, action)
    .first();

  if (!record) {
    return verdict(false, voiceOfRefusal(
      `No active consent record for actor=${actorId} action=${action}.`,
      'educational',
    ), { clause: 'NO_ACTIVE_CONSENT_RECORD' });
  }

  // 6. Scope check — a consent record's scope must cover the requested scope.
  // record.scope '*' matches anything; otherwise exact or prefix match with '/'.
  if (record.scope && record.scope !== '*' && scope) {
    const ok = record.scope === scope || scope.startsWith(record.scope + '/');
    if (!ok) {
      return verdict(false, voiceOfRefusal(
        `Consent covers scope '${record.scope}' but request asked for '${scope}'.`,
        'educational',
      ), { clause: 'SCOPE_NOT_COVERED' });
    }
  }

  // 7. Contract-version check — never accept a record signed under an
  //    older contract version than what HEAVEN currently enforces.
  const cv = env.CONSENT_CONTRACT_VER || 'v3';
  if (record.contract_version && record.contract_version !== cv) {
    return verdict(false, voiceOfRefusal(
      `Consent was signed under contract ${record.contract_version}; HEAVEN enforces ${cv}. Re-sign required.`,
      'educational',
    ), { clause: 'CONTRACT_VERSION_MISMATCH' });
  }

  // 8. All green. Return an allowed verdict carrying the record id.
  return verdict(true, 'Consent verified.', {
    clause: null,
    record_id: record.record_id,
    contract_version: record.contract_version || cv,
    expires_at: record.expires_at || null,
  });
}

// ── logConsentEvent — append-only audit log ──────────────────────────
/**
 * Writes a row to consent_db.consent_events. Never throws — logging
 * failure must not block the caller; it just degrades audit quality.
 */
export async function logConsentEvent({ env, actorId, action, scope, requesterId, verdict: v }) {
  if (!env.CONSENT_DB) return { logged: false, reason: 'no_binding' };
  try {
    await env.CONSENT_DB
      .prepare(`
        INSERT INTO consent_events
          (event_id, actor_id, action, scope, requester_id, allowed, clause, reason, verdict_id, logged_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'));
      `)
      .bind(
        cryptoUUID(),
        actorId || null,
        action || null,
        scope || null,
        requesterId || null,
        v.allowed ? 1 : 0,
        v.clause || null,
        v.reason || null,
        v.verdict_id || null,
      )
      .run();
    return { logged: true };
  } catch (err) {
    // Do not throw. Audit failure is a yellow flag, not a gate.
    return { logged: false, reason: String(err?.message || err) };
  }
}

// ── writeDeployManifest — called on cold start / first request ───────
/**
 * Writes (or no-ops if already present) one row to manifest_db.deploys
 * describing the running HEAVEN version. Idempotent by deploy_id.
 */
export async function writeDeployManifest(env, deployId) {
  if (!env.MANIFEST_DB) return { wrote: false, reason: 'no_binding' };
  try {
    await env.MANIFEST_DB
      .prepare(`
        INSERT OR IGNORE INTO deploys
          (deploy_id, service, version, never_clauses_version, contract_version, deployed_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'));
      `)
      .bind(
        deployId,
        'heaven',
        env.HEAVEN_VERSION || '0.2.0',
        env.NEVER_CLAUSES_VERSION || 'v3',
        env.CONSENT_CONTRACT_VER || 'v3',
      )
      .run();
    return { wrote: true };
  } catch (err) {
    return { wrote: false, reason: String(err?.message || err) };
  }
}
