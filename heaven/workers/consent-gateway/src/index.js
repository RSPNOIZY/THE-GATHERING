/**
 * NOIZY Consent Gateway v1.0
 * Cloudflare Worker — D1 backend
 *
 * The first executable slice of the NOIZY consent-native OS.
 * Every voice/creator-linked action passes through here first.
 *
 * Author: Robert Stephen Plowman (RSP_001) — rsp@noizyfish.com
 * Architecture: NOIZY Constitution v2.0 → Policy v2.0 → Runtime
 *
 * Routes:
 *   POST /v1/check-eligibility   — 10-check decision matrix → ALLOW/HOLD/DENY/ESCALATE
 *   POST /v1/revoke              — creator revokes consent scope
 *   GET  /v1/consent/:id         — full normalized consent state
 *   GET  /v1/audit/:asset_id     — audit history for asset or creator
 *   GET  /health                 — service health (public)
 */

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization,X-NOIZY-Key",
  "X-Powered-By": "NOIZY-CONSENT-GATEWAY/1.0",
  "Cache-Control": "no-store",
};

const ENFORCEMENT_SLA_HOURS = 1;

// ── Helpers ───────────────────────────────────────────────────────────────────

function uuid() {
  return crypto.randomUUID();
}

function now() {
  return new Date().toISOString();
}

function jsonRes(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), { status, headers: CORS });
}

function errRes(message, status = 400, reason_codes = []) {
  return jsonRes({ error: message, reason_codes }, status);
}

function safeJson(str, fallback) {
  try {
    return str ? JSON.parse(str) : fallback;
  } catch (_) {
    return fallback;
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
// JWT first (if JWT_JWKS_URL set), API key fallback
import { authenticate as jwtAuthenticate, authenticateApiKey } from "./jwt-auth.js";

async function authenticate(request, env) {
  if (env.JWT_JWKS_URL) {
    const ctx = await jwtAuthenticate(request, env);
    return ctx !== null;
  }
  const ctx = authenticateApiKey(request, env);
  return ctx !== null;
}

// ── Audit Log ─────────────────────────────────────────────────────────────────

async function writeAudit(db, params) {
  try {
    await db
      .prepare(
        `INSERT INTO audit_log
           (id, actor_type, actor_id, action, object_type, object_id,
            decision, reason, reason_codes_json, metadata_json, prompt_version)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`
      )
      .bind(
        uuid(),
        params.actor_type || "system",
        params.actor_id || "system",
        params.action,
        params.object_type || "consent_record",
        params.object_id || "unknown",
        params.decision || null,
        params.reason || null,
        JSON.stringify(params.reason_codes || []),
        JSON.stringify(params.metadata || {}),
        "GABRIEL_EXECUTOR_v1.0",
      )
      .run();
  } catch (e) {
    console.error("[NOIZY AUDIT FAIL]", e.message, params);
  }
}

// ── Decision Matrix ───────────────────────────────────────────────────────────

/**
 * Run the 10-check NOIZY action decision matrix.
 *
 * Checks (in order — first failure wins):
 *  1. Identity linked    → HOLD if creator/HVS not found
 *  2. Consent exists     → DENY if no NCP record found
 *  3. Consent active     → DENY if status != active
 *  4. Scope valid        → DENY if action_type not in usage_types
 *  5. Time valid         → DENY if outside term
 *  6. Tool authorized    → HOLD/DENY based on clearance registry
 *  7. Provenance ready   → HOLD if required but pipeline unavailable
 *  8. Royalty route ready→ HOLD if monetized but payout path missing
 *  9. Dispute clear      → ESCALATE if dispute_status != none
 * 10. Revocation clear   → DENY if revoked_at set or active revocation event
 */
async function runDecisionMatrix(db, params) {
  const {
    creator_id,
    hvs_id,
    claimant_id,
    action_type,
    tool_name,
    requested_scope = {},
    requested_at = now(),
  } = params;

  const reason_codes = [];

  // ── Check 1: Identity linked ──────────────────────────────────────────────
  if (!creator_id && !hvs_id) {
    return { decision: "DENY", reason_codes: ["IDENTITY_NOT_PROVIDED"] };
  }

  const creator = creator_id
    ? await db.prepare("SELECT * FROM creators WHERE id = ?").bind(creator_id).first()
    : await db
        .prepare(
          `SELECT c.* FROM creators c
           JOIN hvs_records h ON c.id = h.creator_id
           WHERE h.id = ? LIMIT 1`
        )
        .bind(hvs_id)
        .first();

  if (!creator) {
    return { decision: "HOLD", reason_codes: ["IDENTITY_NOT_FOUND"] };
  }

  // ── Check 2: Consent exists ───────────────────────────────────────────────
  const consent = await db
    .prepare(
      `SELECT * FROM consent_records
       WHERE creator_id = ? AND claimant_id = ? AND consent_status != 'revoked'
       ORDER BY created_at DESC LIMIT 1`
    )
    .bind(creator.id, claimant_id)
    .first();

  if (!consent) {
    return { decision: "DENY", reason_codes: ["CONSENT_NOT_FOUND"], consent_record_id: null };
  }

  // ── Check 10: Revocation clear (checked before status — revocation overrides) ──
  if (consent.revoked_at) {
    return { decision: "DENY", reason_codes: ["CONSENT_REVOKED"], consent_record_id: consent.id };
  }

  const activeRevocation = await db
    .prepare(
      `SELECT id FROM revocation_events
       WHERE consent_record_id = ? AND enforcement_status != 'failed'
       LIMIT 1`
    )
    .bind(consent.id)
    .first();

  if (activeRevocation) {
    return { decision: "DENY", reason_codes: ["CONSENT_REVOKED"], consent_record_id: consent.id };
  }

  // ── Check 3: Consent active ───────────────────────────────────────────────
  if (consent.consent_status !== "active") {
    const codeMap = {
      expired: "CONSENT_EXPIRED",
      disputed: "CONSENT_DISPUTED",
      suspended: "CONSENT_INACTIVE",
      draft: "CONSENT_INACTIVE",
      pending_signature: "CONSENT_INACTIVE",
    };
    const code = codeMap[consent.consent_status] || "CONSENT_INACTIVE";
    return { decision: "DENY", reason_codes: [code], consent_record_id: consent.id };
  }

  // ── Check 9: Dispute clear ────────────────────────────────────────────────
  if (consent.dispute_status !== "none") {
    return { decision: "ESCALATE", reason_codes: ["DISPUTED_RIGHTS_ASSERTION"], consent_record_id: consent.id };
  }

  // ── Check 4: Scope valid ──────────────────────────────────────────────────
  const scope = safeJson(consent.scope_json, {});
  const exclusions = scope.exclusions || [];
  const usage_types = safeJson(consent.usage_types_json, []);

  // 4a: Exclusions always win — checked BEFORE usage_types
  if (action_type && exclusions.includes(action_type)) {
    return { decision: "DENY", reason_codes: ["USAGE_EXCLUDED_BY_SCOPE"], consent_record_id: consent.id };
  }

  // 4b: Action must be in usage_types
  if (action_type && usage_types.length > 0 && !usage_types.includes(action_type)) {
    return { decision: "DENY", reason_codes: ["USAGE_NOT_IN_SCOPE"], consent_record_id: consent.id };
  }

  // 4c: Territory authorization
  if (requested_scope.territory) {
    const geo = scope.geographic || [];
    if (!geo.includes("global") && !geo.includes(requested_scope.territory)) {
      return { decision: "DENY", reason_codes: ["TERRITORY_NOT_AUTHORIZED"], consent_record_id: consent.id };
    }
  }

  // ── Check 5: Time valid ───────────────────────────────────────────────────
  const reqTime = new Date(requested_at);
  if (reqTime < new Date(consent.term_start)) {
    return { decision: "DENY", reason_codes: ["CONSENT_NOT_YET_EFFECTIVE"], consent_record_id: consent.id };
  }
  if (reqTime > new Date(consent.term_end)) {
    return { decision: "DENY", reason_codes: ["CONSENT_EXPIRED"], consent_record_id: consent.id };
  }

  // ── Check 6: Tool authorized ──────────────────────────────────────────────
  if (tool_name) {
    const authorized_tools = safeJson(consent.authorized_tools_json, []);
    const toolInNcp = authorized_tools.length === 0 || authorized_tools.includes(tool_name);

    const clearance = await db
      .prepare("SELECT * FROM tool_clearance_registry WHERE tool_name = ?")
      .bind(tool_name)
      .first();

    if (!clearance) {
      return { decision: "HOLD", reason_codes: ["TOOL_UNKNOWN"], consent_record_id: consent.id };
    }
    if (clearance.clearance_status === "blocked") {
      return { decision: "DENY", reason_codes: ["TOOL_BLOCKED"], consent_record_id: consent.id };
    }
    if (clearance.clearance_status === "pending_review") {
      return { decision: "HOLD", reason_codes: ["TOOL_PENDING_REVIEW"], consent_record_id: consent.id };
    }
    if (!toolInNcp) {
      return { decision: "HOLD", reason_codes: ["TOOL_NOT_AUTHORIZED"], consent_record_id: consent.id };
    }
  }

  // ── Check 7: Provenance ready ─────────────────────────────────────────────
  // Fail-open: absent key or unbound KV = pipeline assumed healthy.
  // Ops activates hold by writing NOIZY_KV key "provenance:pipeline:status" = "degraded" | "down".
  // Clear by deleting the key or writing any other value.
  const provenance_required = consent.provenance_required === 1;
  let provenance_ready = true;
  if (provenance_required && env.NOIZY_KV) {
    try {
      const pipelineStatus = await env.NOIZY_KV.get("provenance:pipeline:status");
      if (pipelineStatus === "degraded" || pipelineStatus === "down") {
        provenance_ready = false;
      }
    } catch (_) {
      // KV read failure → fail-open (don't block consent on infrastructure error)
    }
  }
  if (provenance_required && !provenance_ready) {
    return { decision: "HOLD", reason_codes: ["PROVENANCE_PIPELINE_UNAVAILABLE"], consent_record_id: consent.id };
  }

  // ── Check 8: Royalty route ready ──────────────────────────────────────────
  const payment_terms = safeJson(consent.payment_terms_json, {});
  const monetized = requested_scope.commercial === true;
  let royalty_route_status = "not_applicable";

  if (monetized) {
    if (typeof payment_terms.creator_pct !== "number") {
      return {
        decision: "HOLD",
        reason_codes: ["ROYALTY_ROUTE_NOT_READY"],
        consent_record_id: consent.id,
        royalty_route_status: "not_ready",
      };
    }
    royalty_route_status = "ready";
  }

  // ── All checks passed → ALLOW ─────────────────────────────────────────────
  reason_codes.push("CONSENT_VALID", "SCOPE_VALID");
  if (tool_name) reason_codes.push("TOOL_AUTHORIZED");
  if (provenance_required) reason_codes.push("PROVENANCE_READY");
  if (monetized) reason_codes.push("ROYALTY_ROUTE_READY");

  return {
    decision: "ALLOW",
    reason_codes,
    consent_record_id: consent.id,
    creator_id: creator.id,
    provenance_required,
    royalty_route_status,
    payment_terms: {
      creator_pct: payment_terms.creator_pct ?? 75,
      platform_pct: payment_terms.platform_pct ?? 25,
      currency: payment_terms.currency || "USD",
      payout_window_days: payment_terms.payout_window_days || 7,
    },
  };
}

// ── Route Handlers ────────────────────────────────────────────────────────────

async function handleCheckEligibility(request, env) {
  let body;
  try { body = await request.json(); } catch (_) {
    return errRes("Invalid JSON body", 400);
  }

  const { creator_id, hvs_id, claimant_id, action_type, tool_name } = body;
  if (!claimant_id) return errRes("claimant_id is required", 400);
  if (!creator_id && !hvs_id) return errRes("creator_id or hvs_id is required", 400);
  if (!action_type) return errRes("action_type is required", 400);

  const db = env.NOIZY_DB;
  const result = await runDecisionMatrix(db, body);

  await writeAudit(db, {
    actor_type: "claimant",
    actor_id: claimant_id,
    action: `check_eligibility:${action_type}`,
    object_id: result.consent_record_id || creator_id || hvs_id,
    decision: result.decision,
    reason_codes: result.reason_codes,
    metadata: { tool_name, action_type, requested_scope: body.requested_scope },
  });

  // Log usage event (fire-and-forget)
  db.prepare(
    `INSERT INTO usage_events
       (id, creator_id, consent_record_id, claimant_id, action_type,
        tool_name, decision, reason_codes_json, requested_at)
     VALUES (?,?,?,?,?,?,?,?,?)`
  )
    .bind(
      uuid(),
      result.creator_id || creator_id || hvs_id || "unknown",
      result.consent_record_id || null,
      claimant_id,
      action_type,
      tool_name || null,
      result.decision,
      JSON.stringify(result.reason_codes),
      now(),
    )
    .run()
    .catch((e) => console.error("[NOIZY] Usage event write failed:", e.message));

  return jsonRes({ ...result, executed_at: now(), gateway_version: "1.0" });
}

async function handleRevoke(request, env) {
  let body;
  try { body = await request.json(); } catch (_) {
    return errRes("Invalid JSON body", 400);
  }

  const { consent_record_id, requested_by, reason, effective_scope } = body;
  if (!consent_record_id) return errRes("consent_record_id is required", 400);
  if (!requested_by) return errRes("requested_by is required", 400);
  if (!reason) return errRes("reason is required", 400);

  const db = env.NOIZY_DB;
  const consent = await db.prepare("SELECT * FROM consent_records WHERE id = ?").bind(consent_record_id).first();
  if (!consent) return errRes("Consent record not found", 404);

  if (requested_by !== consent.creator_id) {
    return errRes("Not authorized to revoke this consent record", 403);
  }

  const effective_at = now();
  const sla_deadline = new Date(Date.now() + ENFORCEMENT_SLA_HOURS * 60 * 60 * 1000).toISOString();
  const revocation_id = uuid();

  await db
    .prepare(
      `INSERT INTO revocation_events
         (id, consent_record_id, creator_id, reason, scope_json,
          effective_at, enforcement_status, requested_by)
       VALUES (?,?,?,?,?,?,?,?)`
    )
    .bind(
      revocation_id,
      consent_record_id,
      consent.creator_id,
      reason,
      JSON.stringify(effective_scope || {}),
      effective_at,
      "pending",
      requested_by,
    )
    .run();

  await db
    .prepare(
      `UPDATE consent_records
       SET consent_status = 'revoked', revoked_at = ?, updated_at = ?
       WHERE id = ?`
    )
    .bind(effective_at, now(), consent_record_id)
    .run();

  await writeAudit(db, {
    actor_type: "creator",
    actor_id: requested_by,
    action: "revoke_consent",
    object_id: consent_record_id,
    decision: "DENY",
    reason,
    reason_codes: ["CONSENT_REVOKED"],
    metadata: { revocation_id, sla_deadline },
  });

  return jsonRes({
    revocation_accepted: true,
    revocation_id,
    consent_record_id,
    effective_at,
    sla_deadline,
    enforcement_status: "pending",
    message: `Revocation accepted. All covered scopes enforced within ${ENFORCEMENT_SLA_HOURS}h.`,
  }, 201);
}

async function handleGetConsent(id, env) {
  const consent = await env.NOIZY_DB
    .prepare("SELECT * FROM consent_records WHERE id = ?")
    .bind(id)
    .first();

  if (!consent) return errRes("Consent record not found", 404);

  return jsonRes({
    consent_record: {
      ...consent,
      usage_types: safeJson(consent.usage_types_json, []),
      authorized_tools: safeJson(consent.authorized_tools_json, []),
      scope: safeJson(consent.scope_json, {}),
      payment_terms: safeJson(consent.payment_terms_json, {}),
      inheritance_rules: safeJson(consent.inheritance_rules_json, {}),
      signature: safeJson(consent.signature_json, {}),
      usage_types_json: undefined,
      authorized_tools_json: undefined,
      scope_json: undefined,
      payment_terms_json: undefined,
      inheritance_rules_json: undefined,
      signature_json: undefined,
    },
  });
}

async function handleGetAudit(asset_id, env, url) {
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);

  const { results } = await env.NOIZY_DB
    .prepare(`SELECT * FROM audit_log WHERE object_id = ? ORDER BY created_at DESC LIMIT ?`)
    .bind(asset_id, limit)
    .all();

  return jsonRes({
    asset_id,
    audit_entries: results.map((r) => ({
      ...r,
      reason_codes: safeJson(r.reason_codes_json, []),
      metadata: safeJson(r.metadata_json, {}),
      reason_codes_json: undefined,
      metadata_json: undefined,
    })),
    count: results.length,
  });
}

// ── Creator Status ────────────────────────────────────────────────────────────
// Returns ONLY: { creator_id, status, updated_at }
// No consent history, events, audit records, or revocation metadata
async function handleGetCreatorStatus(creatorId, env) {
  const creator = await env.NOIZY_DB
    .prepare("SELECT id, status, updated_at FROM creators WHERE id = ?")
    .bind(creatorId)
    .first();

  if (!creator) return errRes("Creator not found", 404);

  return jsonRes({
    creator_id:  creator.id,
    status:      creator.status,
    updated_at:  creator.updated_at,
  });
}

// ── Main Fetch Handler ────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname: path, } = url;
    const method = request.method;

    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    // ── Internal proof introspection (ops-only) ────────────────────────────
    if (path === "/__proof" && method === "GET") {
      const NOIZY_PROOF_KEY = env.NOIZY_PROOF_KEY || env.NOIZY_API_KEY;
      const reqKey = request.headers.get("X-NOIZY-Key") || request.headers.get("x-noizy-key");
      if (!NOIZY_PROOF_KEY || reqKey !== NOIZY_PROOF_KEY) {
        return errRes("Unauthorized", 401);
      }
      const routingContract = {
        public:    ["/health"],
        protected: ["/verify", "/revoke", "/status/:creatorId"],
        legacy:    ["/v1/check-eligibility", "/v1/revoke", "/v1/consent/:id", "/v1/audit/:asset_id"],
        auth_model: env.JWT_JWKS_URL ? "JWT RS256 (JWKS)" : "X-NOIZY-Key",
        constitution: "v2.0",
        policy: "v2.0",
      };
      let dbOk = false;
      try { await env.NOIZY_DB.prepare("SELECT 1").first(); dbOk = true; } catch (_) {}
      return jsonRes({
        service: "noizy-consent-gateway",
        version: "1.1",
        environment: env.NOIZY_ENV || "production",
        routing_contract: routingContract,
        governance: {
          plowman_standard: "75/25 creator split",
          revocation_is_sacred: true,
          status_is_sanitized: true,
          ncp_protocol: "active",
        },
        bindings: {
          db: dbOk ? "connected" : "error",
          jwt_mode: !!env.JWT_JWKS_URL,
        },
        timestamp: now(),
      });
    }

    // ── Public ─────────────────────────────────────────────────────────────
    if (path === "/health" && method === "GET") {
      let dbOk = false;
      try { await env.NOIZY_DB.prepare("SELECT 1").first(); dbOk = true; } catch (_) {}
      return jsonRes({
        status: dbOk ? "LIVE" : "DEGRADED",
        service: "noizy-consent-gateway",
        version: "1.1",
        constitution: "v2.0",
        policy: "v2.0",
        sla_hours: ENFORCEMENT_SLA_HOURS,
        db: dbOk ? "connected" : "error",
        routing_contract: {
          public:    ["/health"],
          protected: ["/verify", "/revoke", "/status/:creatorId"],
          legacy:    ["/v1/check-eligibility", "/v1/revoke", "/v1/consent/:id", "/v1/audit/:asset_id"],
        },
      });
    }

    // ── Auth gate — 401 for all protected routes ────────────────────────────
    if (!(await authenticate(request, env))) {
      return errRes("Unauthorized — X-NOIZY-Key required", 401);
    }

    // ── Canonical protected routes ──────────────────────────────────────────

    // POST /verify — top-level eligibility check (canonical)
    if (path === "/verify" && method === "POST") {
      return handleCheckEligibility(request, env);
    }

    // POST /revoke — top-level revocation (canonical)
    // Authorization: caller must be the consent record's creator_id (403 otherwise)
    if (path === "/revoke" && method === "POST") {
      return handleRevoke(request, env);
    }

    // GET /status/:creatorId — sanitized creator status only
    // Returns: { creator_id, status, updated_at } — no history, no events
    const statusMatch = path.match(/^\/status\/([^/]+)$/);
    if (statusMatch && method === "GET") {
      return handleGetCreatorStatus(statusMatch[1], env);
    }

    // ── Legacy v1 routes — preserved for backward compatibility ────────────

    if (path === "/v1/check-eligibility" && method === "POST") {
      return handleCheckEligibility(request, env);
    }

    if (path === "/v1/revoke" && method === "POST") {
      return handleRevoke(request, env);
    }

    const consentMatch = path.match(/^\/v1\/consent\/([^/]+)$/);
    if (consentMatch && method === "GET") {
      return handleGetConsent(consentMatch[1], env);
    }

    const auditMatch = path.match(/^\/v1\/audit\/([^/]+)$/);
    if (auditMatch && method === "GET") {
      return handleGetAudit(auditMatch[1], env, url);
    }

    return errRes("Not found", 404);
  },
};
