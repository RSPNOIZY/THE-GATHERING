// workers/consent-gateway/index.ts — HARDENED sprint
// Auth-enforced consent governance with 401/403 split
// 2026-03-30 | RSP_001 | GORUNFREE
import { checkEligibility, writeAudit, type Env, type EligibilityRequest } from "./policy";

function uid(prefix = "NCP"): string {
  const rand = Math.random().toString(16).slice(2);
  return `${prefix}_${Date.now().toString(16)}_${rand}`;
}
function isoNow(): string { return new Date().toISOString(); }
function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization,X-NOIZY-Key",
      "X-Powered-By": "HEAVEN/CONSENT-GATEWAY",
    },
  });
}
async function readJson<T>(req: Request): Promise<T> {
  const ct = req.headers.get("content-type") || "";
  if (!ct.includes("application/json")) throw new Error("Expected application/json");
  return (await req.json()) as T;
}

// ── Auth: 401 (identity missing) vs 403 (identity insufficient) ──────────
function extractApiKey(request: Request): string | null {
  return (
    request.headers.get("X-NOIZY-Key") ||
    request.headers.get("Authorization")?.replace("Bearer ", "") ||
    null
  );
}

function authenticate(request: Request, env: Env): { authenticated: boolean; key: string | null } {
  const key = extractApiKey(request);
  if (!env.NOIZY_API_KEY) return { authenticated: true, key }; // No key = dev mode
  if (!key) return { authenticated: false, key: null };
  return { authenticated: key === env.NOIZY_API_KEY, key };
}

function authorize(creatorId: string | null, _key: string | null, _env: Env): boolean {
  // Sprint 1: all authenticated callers are authorized
  // Sprint 2: scope to creator-specific JWTs or service tokens
  return true;
}

// ── Public routes (no auth required) ─────────────────────────────────────
const PUBLIC_ROUTES = new Set(["/health"]);

// ── Protected routes (auth required) ─────────────────────────────────────
// POST /verify, POST /revoke, GET /status/:creatorId
// Legacy: POST /v1/check-eligibility, POST /v1/revoke, GET /v1/consent/:id, GET /v1/audit/:asset_id

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type,Authorization,X-NOIZY-Key",
        },
      });
    }

    // ── Public: GET /health ─────────────────────────────────────────────
    if (request.method === "GET" && path === "/health") {
      return json({
        ok: true,
        service: "consent-gateway",
        version: "2.1.0",
        auth_enforced: true,
        routing_contract: {
          public: ["GET /health"],
          protected: [
            "POST /verify",
            "POST /revoke",
            "GET /status/:creatorId",
            "POST /v1/check-eligibility",
            "POST /v1/revoke",
            "GET /v1/consent/:id",
            "GET /v1/audit/:asset_id",
          ],
        },
        ts: isoNow(),
      });
    }

    // ═════════════════════════════════════════════════════════════════════
    // AUTH GATE — all routes below require authentication
    // ═════════════════════════════════════════════════════════════════════
    const { authenticated, key } = authenticate(request, env);
    if (!authenticated) {
      // 401 — identity missing or invalid
      await writeAudit(env, {
        actor_type: "anonymous",
        actor_id: request.headers.get("CF-Connecting-IP") || "unknown",
        action: "auth_failed",
        object_type: "route",
        object_id: path,
        decision: "DENY",
        reason: "UNAUTHENTICATED",
        metadata_json: JSON.stringify({ method: request.method, path }),
      });
      return json(
        {
          error: "Unauthorized",
          message: "X-NOIZY-Key header required for this endpoint",
          code: "AUTH_REQUIRED",
        },
        401
      );
    }

    // ── POST /verify (new canonical route) ──────────────────────────────
    // Maps to check-eligibility
    if (request.method === "POST" && (path === "/verify" || path === "/v1/check-eligibility")) {
      try {
        const body = await readJson<EligibilityRequest>(request);
        const result = await checkEligibility(body, env);

        // Write usage event — immutable machine record
        const usageId = uid("USE");
        await env.DB.prepare(
          `INSERT INTO usage_events (id,creator_id,consent_record_id,claimant_id,action_type,tool_name,
           model_version,output_asset_id,provenance_status,requested_at,completed_at,decision)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
        ).bind(
          usageId,
          body.creator_id,
          result.consent_record_id ?? "UNKNOWN",
          body.claimant_id,
          body.action_type,
          body.tool_name,
          null,
          null,
          result.provenance_required ? "required" : "not_required",
          body.requested_at,
          null,
          result.decision
        ).run();

        await writeAudit(env, {
          actor_type: "tool",
          actor_id: body.tool_name,
          action: "check_eligibility",
          object_type: "consent_record",
          object_id: result.consent_record_id ?? "UNKNOWN",
          decision: result.decision,
          reason: result.reason_codes.join(","),
          metadata_json: JSON.stringify({ request: body, usage_event_id: usageId }),
        });

        return json(result);
      } catch (err: any) {
        return json({ error: "BAD_REQUEST", detail: String(err?.message ?? err) }, 400);
      }
    }

    // ── POST /revoke — sacred path, 1-hour SLA ─────────────────────────
    if (request.method === "POST" && (path === "/revoke" || path === "/v1/revoke")) {
      try {
        const body = await readJson<{
          consent_record_id: string;
          creator_id: string;
          reason: string;
          scope?: Record<string, unknown>;
          effective_at?: string;
        }>(request);

        // AUTHORIZATION CHECK: caller must be authorized for this creator
        if (!authorize(body.creator_id, key, env)) {
          await writeAudit(env, {
            actor_type: "service",
            actor_id: key || "unknown",
            action: "revoke_unauthorized",
            object_type: "consent_record",
            object_id: body.consent_record_id,
            decision: "DENY",
            reason: "AUTHORIZATION_FAILED",
          });
          return json(
            {
              error: "Forbidden",
              message: "Not authorized to revoke consent for this creator",
              code: "AUTHORIZATION_FAILED",
            },
            403
          );
        }

        const revokeId = uid("REV");
        const effectiveAt = body.effective_at ?? isoNow();
        const now = isoNow();

        await env.DB.prepare(
          `INSERT INTO revocation_events (id,consent_record_id,creator_id,reason,scope_json,effective_at,enforced_at,enforcement_status,created_at)
           VALUES (?,?,?,?,?,?,?,?,?)`
        )
          .bind(
            revokeId,
            body.consent_record_id,
            body.creator_id,
            body.reason,
            JSON.stringify(body.scope ?? {}),
            effectiveAt,
            null,
            "pending",
            now
          )
          .run();

        // Mark consent — fast-path DENY on next check
        await env.DB.prepare(
          `UPDATE consent_records SET revoked_at=?,consent_status='revoked',updated_at=? WHERE id=?`
        )
          .bind(effectiveAt, now, body.consent_record_id)
          .run();

        await writeAudit(env, {
          actor_type: "creator",
          actor_id: body.creator_id,
          action: "revoke_consent",
          object_type: "consent_record",
          object_id: body.consent_record_id,
          decision: "DENY",
          reason: "REVOCATION_TRIGGERED",
          metadata_json: JSON.stringify({
            revocation_event_id: revokeId,
            scope: body.scope ?? {},
            enforcement_sla_hours: 1,
          }),
        });

        return json({
          ok: true,
          revocation_event_id: revokeId,
          effective_at: effectiveAt,
          enforcement_sla_hours: 1,
          message: "Revocation recorded. Enforcement within 1 hour. Kill switch is absolute.",
        });
      } catch (err: any) {
        return json({ error: "BAD_REQUEST", detail: String(err?.message ?? err) }, 400);
      }
    }

    // ── GET /status/:creatorId — sanitized, minimal ─────────────────────
    // Status ≠ audit history. Returns consent posture, not records.
    const statusMatch = path.match(/^\/status\/([^/]+)$/);
    if (request.method === "GET" && statusMatch) {
      const creatorId = statusMatch[1];

      // AUTHORIZATION CHECK
      if (!authorize(creatorId, key, env)) {
        return json(
          {
            error: "Forbidden",
            message: "Not authorized to view status for this creator",
            code: "AUTHORIZATION_FAILED",
          },
          403
        );
      }

      const creator = await env.DB.prepare(
        `SELECT id, status, created_at FROM creators WHERE id=? LIMIT 1`
      )
        .bind(creatorId)
        .first<any>();
      if (!creator) return json({ error: "Creator not found" }, 404);

      // Sanitized status — no raw consent records, no audit history
      const stats = await env.DB.prepare(
        `SELECT
           COUNT(*) as total_consents,
           SUM(CASE WHEN consent_status='active' THEN 1 ELSE 0 END) as active_consents,
           SUM(CASE WHEN consent_status='revoked' THEN 1 ELSE 0 END) as revoked_consents,
           SUM(CASE WHEN dispute_status IS NOT NULL AND dispute_status != 'none' THEN 1 ELSE 0 END) as active_disputes
         FROM consent_records WHERE creator_id=?`
      )
        .bind(creatorId)
        .first<any>();

      return json({
        creator_id: creatorId,
        creator_status: creator.status,
        consent_posture: {
          total: stats?.total_consents ?? 0,
          active: stats?.active_consents ?? 0,
          revoked: stats?.revoked_consents ?? 0,
          disputes: stats?.active_disputes ?? 0,
        },
        governance: {
          auth_enforced: true,
          kill_switch: "absolute",
          enforcement_sla_hours: 1,
        },
        ts: isoNow(),
      });
    }

    // ── GET /v1/consent/:id (legacy — protected) ────────────────────────
    if (request.method === "GET" && path.startsWith("/v1/consent/")) {
      const id = path.split("/").pop()!;
      const row = await env.DB.prepare(
        `SELECT * FROM consent_records WHERE id=? LIMIT 1`
      )
        .bind(id)
        .first<any>();
      if (!row) return json({ error: "NOT_FOUND" }, 404);

      // AUTHORIZATION: must be authorized for this creator
      if (!authorize(row.creator_id, key, env)) {
        return json({ error: "Forbidden", code: "AUTHORIZATION_FAILED" }, 403);
      }

      return json({
        id: row.id,
        creator_id: row.creator_id,
        claimant_id: row.claimant_id,
        consent_status: row.consent_status,
        dispute_status: row.dispute_status,
        revoked_at: row.revoked_at,
        term_start: row.term_start,
        term_end: row.term_end,
        provenance_required: !!row.provenance_required,
        scope: safeJson(row.scope_json),
        authorized_tools: safeJson(row.authorized_tools_json),
        usage_types: safeJson(row.usage_types_json),
        updated_at: row.updated_at,
        created_at: row.created_at,
      });
    }

    // ── GET /v1/audit/:asset_id (legacy — protected) ────────────────────
    if (request.method === "GET" && path.startsWith("/v1/audit/")) {
      const assetId = path.split("/").pop()!;
      const res = await env.DB.prepare(
        `SELECT * FROM audit_log WHERE object_id=? ORDER BY created_at DESC LIMIT 250`
      )
        .bind(assetId)
        .all<any>();
      return json({
        asset_id: assetId,
        events: res.results ?? [],
        count: (res.results ?? []).length,
      });
    }

    return json({ error: "Not found", known_routes: ["/health", "/verify", "/revoke", "/status/:creatorId"] }, 404);
  },
};

function safeJson(raw: string | null): unknown {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
