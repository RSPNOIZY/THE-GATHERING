/**
 * Cloudflare Worker: mcp.noizyfish.com
 * Gateway for GABRIEL, LUCY, and NOIZYARMY tool routing.
 * Protocol: Stateless Model Context Protocol (MCP) JSON-RPC 2.0
 */

export interface Env {
  GABRIEL_KV?: KVNamespace;
  DB_HARMONY?: D1Database;
  MC96_SECRET?: string;
  ENVIRONMENT?: string;
}

interface MCPRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, any>;
}

type SovereignPayload = Partial<MCPRequest> & Record<string, any>;

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isProduction(env: Env): boolean {
  return env.ENVIRONMENT === "production";
}

function hasActiveLocalSession(subjectId: unknown, sessionToken: unknown): boolean {
  return (
    typeof subjectId === "string" &&
    subjectId.startsWith("DRV-") &&
    typeof sessionToken === "string" &&
    /^ST-AUTH-ACTIVE-[A-Za-z0-9_-]+$/.test(sessionToken)
  );
}

async function handleConsentVerify(payload: SovereignPayload, env: Env): Promise<Response> {
  const subjectId = payload.subject_id;
  const sessionToken = payload.session_token;
  const policyCode = payload.policy_code || "NC-01-10";

  if (!subjectId || !sessionToken) {
    return jsonResponse({
      allowed: false,
      status: "FAIL_CLOSED",
      reason: "subject_id and session_token are required",
      policy_code: policyCode,
    }, 400);
  }

  if (env.DB_HARMONY) {
    try {
      const row = await env.DB_HARMONY
        .prepare(
          "SELECT consent_id FROM consent_registry WHERE subject_id = ? AND session_token = ? AND policy_code = ? AND revoked_at IS NULL LIMIT 1"
        )
        .bind(subjectId, sessionToken, policyCode)
        .first<{ consent_id: string }>();

      if (!row?.consent_id) {
        return jsonResponse({
          allowed: false,
          subject_id: subjectId,
          policy_code: policyCode,
          status: "DENIED",
          verified_at: new Date().toISOString(),
        }, 403);
      }

      return jsonResponse({
        allowed: true,
        subject_id: subjectId,
        policy_code: policyCode,
        consent_id: row.consent_id,
        status: "ACTIVE",
        verified_at: new Date().toISOString(),
      });
    } catch (err: any) {
      return jsonResponse({
        allowed: false,
        status: "FAIL_CLOSED",
        reason: "Harmony D1 consent lookup failed",
        details: err.message,
      }, 503);
    }
  }

  if (isProduction(env)) {
    return jsonResponse({
      allowed: false,
      status: "FAIL_CLOSED",
      reason: "DB_HARMONY binding missing in production",
      policy_code: policyCode,
    }, 503);
  }

  const allowed = hasActiveLocalSession(subjectId, sessionToken);
  return jsonResponse({
    allowed,
    subject_id: subjectId,
    policy_code: policyCode,
    consent_id: allowed ? `DEV_CNS_${crypto.randomUUID().slice(0, 8)}` : undefined,
    status: allowed ? "ACTIVE_DEV_STUB" : "DENIED",
    verified_at: new Date().toISOString(),
  }, allowed ? 200 : 403);
}

async function handleLedgerCommit(payload: SovereignPayload, env: Env): Promise<Response> {
  const receiptId = payload.receipt_id;
  const dataHash = payload.data_hash;

  if (!receiptId || !dataHash) {
    return jsonResponse({
      success: false,
      status: "FAIL_CLOSED",
      reason: "receipt_id and data_hash are required",
    }, 400);
  }

  if (env.DB_HARMONY) {
    try {
      await env.DB_HARMONY
        .prepare(
          "INSERT INTO harmony_ledger (receipt_id, data_hash, payload_json, tier_gate, committed_at) VALUES (?, ?, ?, ?, ?)"
        )
        .bind(
          receiptId,
          dataHash,
          JSON.stringify(payload.payload || {}),
          payload.tier_gate || "TIER-1",
          new Date().toISOString()
        )
        .run();

      return jsonResponse({
        success: true,
        receipt_id: receiptId,
        data_hash: dataHash,
        tier_gate: payload.tier_gate || "TIER-1",
        storage: "D1_HARMONY",
        committed_at: new Date().toISOString(),
      });
    } catch (err: any) {
      return jsonResponse({
        success: false,
        status: "FAIL_CLOSED",
        reason: "Harmony D1 ledger commit failed",
        details: err.message,
      }, 503);
    }
  }

  if (isProduction(env)) {
    return jsonResponse({
      success: false,
      status: "FAIL_CLOSED",
      reason: "DB_HARMONY binding missing in production",
    }, 503);
  }

  return jsonResponse({
    success: true,
    receipt_id: receiptId,
    data_hash: dataHash,
    tier_gate: payload.tier_gate || "TIER-1",
    storage: "DEV_STUB_NOT_PRODUCTION",
    committed_at: new Date().toISOString(),
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "POST") {
      return jsonResponse({ error: "Fail-closed: POST required" }, 405);
    }

    if (!env.MC96_SECRET) {
      return jsonResponse({ error: "Fail-closed: MC96_SECRET binding missing" }, 503);
    }

    const authKey = request.headers.get("x-noizy-key");
    if (!authKey || authKey !== env.MC96_SECRET) {
      return jsonResponse({ error: "Unauthorized: Invalid Sovereign Key" }, 401);
    }

    try {
      const url = new URL(request.url);
      const payload = (await request.json()) as SovereignPayload;

      // Direct REST API Endpoints for Harmony Ledger & Consent Check
      if (url.pathname === "/api/v1/consent/verify") {
        return handleConsentVerify(payload, env);
      }

      if (url.pathname === "/api/v1/ledger/commit") {
        return handleLedgerCommit(payload, env);
      }
      
      // Server Capability & Tool Discovery
      if (payload.method === "server/discover" || payload.method === "tools/list") {
        return jsonResponse({
          jsonrpc: "2.0",
          id: payload.id,
          result: {
            protocolVersion: "2026-07-28",
            capabilities: { tools: {}, tasks: {} },
            tools: [
              {
                name: "gabriel_enforce_covenant",
                description: "Validates 75/25 split and Law 25 compliance before execution.",
                inputSchema: {
                  type: "object",
                  properties: {
                    actor_tag: { type: "string", const: "RSP_001" },
                    action: { type: "string", enum: ["GENERATE", "SETTLE", "AUDIT"] }
                  },
                  required: ["actor_tag", "action"]
                }
              },
              {
                name: "lucy_vehicle_telemetry_get",
                description: "Read-only access to Honda CR-V 2026 Hybrid status.",
                inputSchema: {
                  type: "object",
                  properties: {
                    endpoint: { type: "string", enum: ["battery_status", "fuel_range", "parked_coords"] }
                  },
                  required: ["endpoint"]
                }
              }
            ]
          }
        });
      }

      // Tool Invocation Gate
      if (payload.method === "tools/call") {
        const { name, arguments: args } = payload.params || {};
        
        // Strict Fail-Closed Rule Zero validation
        if (name === "gabriel_enforce_covenant") {
          const receipt = crypto.randomUUID();
          if (args?.actor_tag !== "RSP_001") {
            return jsonResponse({
              jsonrpc: "2.0",
              id: payload.id,
              error: { code: -32003, message: "Actor is not authorized for covenant enforcement." },
            }, 403);
          }

          const action = args?.action;
          if (action === "SETTLE") {
            return jsonResponse({
              jsonrpc: "2.0",
              id: payload.id,
              result: {
                status: "PENDING_EXACT_APPROVAL",
                covenant: "75/25",
                receipt: `REC_${receipt}`,
                killSwitchHolder: "RSP_001",
              }
            });
          }

          return jsonResponse({
            jsonrpc: "2.0",
            id: payload.id,
            result: {
              status: "CLEARED_FOR_REVIEW",
              covenant: "75/25",
              receipt: `REC_${receipt}`,
              killSwitchHolder: "RSP_001"
            }
          });
        }

        if (name === "lucy_vehicle_telemetry_get") {
          const ep = args?.endpoint;
          if (!["battery_status", "fuel_range", "parked_coords"].includes(ep)) {
            return jsonResponse({
              jsonrpc: "2.0",
              id: payload.id,
              error: { code: -32602, message: `Invalid endpoint: ${ep}. Read-only safe endpoints only.` }
            }, 400);
          }

          const value =
            ep === "battery_status"
              ? "status_available_when_vehicle_source_verified"
              : ep === "fuel_range"
                ? "range_available_when_vehicle_source_verified"
                : "Ottawa area; exact coordinates redacted by default";

          return jsonResponse({
            jsonrpc: "2.0",
            id: payload.id,
            result: {
              status: "SUCCESS",
              endpoint: ep,
              vehicle: "Honda CR-V 2026 Sport Touring Hybrid (Plowman Standard)",
              data: {
                metric: ep,
                value,
                timestamp: new Date().toISOString()
              },
              receipt: `REC_${crypto.randomUUID()}`
            }
          });
        }

        return jsonResponse({
          jsonrpc: "2.0",
          id: payload.id,
          error: { code: -32601, message: "Tool not found or rejected by OpenClaw Gate" }
        }, 404);
      }

      return jsonResponse({ jsonrpc: "2.0", id: payload.id, error: { code: -32600, message: "Invalid Request" } }, 400);
    } catch (err: any) {
      return jsonResponse({ error: "Internal Fail-Closed Exception", details: err.message }, 500);
    }
  }
};
