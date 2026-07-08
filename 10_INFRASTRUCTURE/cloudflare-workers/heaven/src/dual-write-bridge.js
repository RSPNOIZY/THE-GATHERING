/**
 * HEAVEN — Dual-Write Bridge
 * ====================================================================
 * During the migration from the legacy agent-memory.consent_log table
 * to the new consent_db.consent_events table, HEAVEN writes to BOTH.
 *
 * This prevents an audit gap. When the migration window closes — set
 * env.DUAL_WRITE_LEGACY = "false" in wrangler.toml — the bridge goes
 * silent and only the new table is written.
 *
 * The legacy schema (inferred from briefing §5 and the existing
 * registry):
 *   consent_log(
 *     consent_id TEXT PRIMARY KEY,
 *     artist_id  TEXT,
 *     action     TEXT,
 *     decision   TEXT,          -- 'allow' | 'deny'
 *     reason     TEXT,
 *     contract   TEXT,          -- e.g. 'v3'
 *     logged_by  TEXT,          -- 'heaven'
 *     logged_at  TEXT
 *   )
 *
 * The new schema (consent_db.consent_events) is richer. The bridge
 * projects down onto the legacy shape so the old analytics don't
 * break while the new ones are being built.
 *
 * This module never throws. Audit-mirror failure is logged (via
 * console) but does not block the caller.
 *
 * Author: Robert Stephen Plowman / MC96ECO / HEAVEN v0.3.0
 * ====================================================================
 */

function nowIso() { return new Date().toISOString(); }

/**
 * mirrorToLegacy
 *
 * @param {object} args
 * @param {object} args.env       - Worker env with AGENT_MEMORY
 * @param {string} args.actorId
 * @param {string} args.action
 * @param {object} args.verdict   - verdict from checkConsent()
 */
export async function mirrorToLegacy({ env, actorId, action, verdict }) {
  // Feature flag — when migration window is over, flip DUAL_WRITE_LEGACY
  // to "false" in wrangler.toml and redeploy. No code change needed.
  const on = String(env.DUAL_WRITE_LEGACY ?? 'true').toLowerCase() === 'true';
  if (!on) return { mirrored: false, reason: 'dual_write_disabled' };
  if (!env.AGENT_MEMORY) return { mirrored: false, reason: 'no_agent_memory_binding' };

  try {
    // Idempotent by consent_id = verdict_id. If the row is already
    // there from an earlier attempt, we skip silently.
    await env.AGENT_MEMORY
      .prepare(`
        INSERT OR IGNORE INTO consent_log
          (consent_id, artist_id, action, decision, reason, contract, logged_by, logged_at)
        VALUES (?, ?, ?, ?, ?, ?, 'heaven', ?);
      `)
      .bind(
        verdict.verdict_id,
        actorId || null,
        action || null,
        verdict.allowed ? 'allow' : 'deny',
        verdict.reason || null,
        env.CONSENT_CONTRACT_VER || 'v3',
        nowIso(),
      )
      .run();
    return { mirrored: true };
  } catch (err) {
    // Legacy table may not exist yet on this account (e.g. fresh
    // provisioning). That's fine — the new system is authoritative.
    console.warn('[dual-write] mirror failed:', String(err?.message || err));
    return { mirrored: false, reason: String(err?.message || err) };
  }
}

/**
 * legacyTableHealth — probe the legacy consent_log for readiness,
 * returned as part of /health for the migration window.
 */
export async function legacyTableHealth(env) {
  if (!env.AGENT_MEMORY) return { reachable: false, reason: 'no_binding' };
  try {
    const row = await env.AGENT_MEMORY
      .prepare('SELECT COUNT(*) AS n FROM consent_log;')
      .first();
    return { reachable: true, rows: row?.n ?? 0 };
  } catch (err) {
    return { reachable: false, reason: String(err?.message || err) };
  }
}
