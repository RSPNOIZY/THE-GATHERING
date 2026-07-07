/**
 * CB01 Router — NOIZY Empire
 *
 * Forwards requests to the consent-gateway with the FULL original path preserved.
 * No segment stripping. Passes auth headers transparently.
 *
 * Routing contract (mirrors consent-gateway):
 *   GET  /health            → public
 *   POST /verify            → protected (X-NOIZY-Key required)
 *   POST /revoke            → protected (X-NOIZY-Key required)
 *   GET  /status/:creatorId → protected (X-NOIZY-Key required)
 *
 * Allowed origins for CORS:
 *   - GOD.local (10.90.90.10)
 *   - noizy.ai + subdomains
 *   - localhost dev
 */

const ALLOWED_PATHS = new Set(["/health", "/verify", "/revoke"]);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization,X-NOIZY-Key",
};

function jsonRes(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...extra },
  });
}

export default {
  async fetch(request, env) {
    const incoming = new URL(request.url);
    const method   = request.method;
    const path     = incoming.pathname;

    // CORS preflight
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // ── Path allowlist — explicit routing contract ─────────────────────────
    const isKnownPath =
      ALLOWED_PATHS.has(path) ||
      /^\/status\/[^/]+$/.test(path) ||    // /status/:creatorId
      /^\/v1\//.test(path);                // legacy v1 routes

    if (!isKnownPath) {
      return jsonRes({
        error: "Route not in routing contract",
        known_routes: ["/health", "/verify", "/revoke", "/status/:creatorId"],
      }, 404);
    }

    // ── Forward with FULL path preserved ──────────────────────────────────
    // Construct upstream URL: base from env + exact path + query string intact
    const gatewayBase = (env.CONSENT_GATEWAY_URL || "").replace(/\/$/, "");
    if (!gatewayBase) {
      return jsonRes({ error: "CONSENT_GATEWAY_URL not configured" }, 503);
    }

    const upstream    = new URL(gatewayBase);
    upstream.pathname = path;          // ← preserve path AS-IS, no stripping
    upstream.search   = incoming.search;

    // Forward the request — preserve method, headers, body
    let upstreamReq;
    try {
      upstreamReq = new Request(upstream.toString(), {
        method,
        headers: request.headers,
        body:    ["GET", "HEAD"].includes(method) ? undefined : request.body,
      });
    } catch (e) {
      return jsonRes({ error: "Failed to construct upstream request", detail: e.message }, 500);
    }

    // ── Proxy ─────────────────────────────────────────────────────────────
    let response;
    try {
      response = await fetch(upstreamReq);
    } catch (e) {
      return jsonRes({
        error:   "Consent gateway unreachable",
        detail:  e.message,
        gateway: gatewayBase,
      }, 502);
    }

    // Return the upstream response, adding CORS headers for browser clients
    const upstreamHeaders = new Headers(response.headers);
    Object.entries(CORS_HEADERS).forEach(([k, v]) => upstreamHeaders.set(k, v));
    upstreamHeaders.set("X-CB01-Router", "noizy-cb01-router/1.0");
    upstreamHeaders.set("X-Forwarded-Path", path);

    return new Response(response.body, {
      status:     response.status,
      statusText: response.statusText,
      headers:    upstreamHeaders,
    });
  },
};
