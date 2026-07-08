/**
 * NOIZY Edge Bridge — voice-mcp.noizy.ai
 *
 * Authenticates MCP clients at the Cloudflare edge, then forwards to the
 * M2 Ultra Dreamchamber via a Cloudflare Tunnel public hostname.
 *
 * Required bindings (wrangler.toml):
 *   - env.NOIZY_MCP_AUTH_TOKEN  (secret)   — shared-secret bearer token
 *   - env.TUNNEL_ORIGIN          (var)      — e.g. "https://voice.noizy.ai"
 *
 * Security notes:
 *   - Uses timing-safe comparison on the auth token.
 *   - Rejects non-HTTPS in production.
 *   - Does NOT cache; every request re-validates.
 */

function timingSafeEqual(a, b) {
  // Strings of different lengths cannot be equal, but we still compare
  // a fixed length to avoid revealing length via timing.
  const aBuf = new TextEncoder().encode(a);
  const bBuf = new TextEncoder().encode(b);
  const len = Math.max(aBuf.length, bBuf.length);
  let diff = aBuf.length ^ bBuf.length;
  for (let i = 0; i < len; i++) {
    diff |= (aBuf[i] ?? 0) ^ (bBuf[i] ?? 0);
  }
  return diff === 0;
}

export default {
  async fetch(request, env, ctx) {
    // 1. HTTPS only (defense in depth; CF proxy enforces, this catches misconfig).
    const url = new URL(request.url);
    if (url.protocol !== "https:" && env.ENVIRONMENT !== "development") {
      return new Response("HTTPS required", { status: 400 });
    }

    // 2. Strict auth check (timing-safe).
    const authHeader = request.headers.get("Authorization") || "";
    const expectedToken = `Bearer ${env.NOIZY_MCP_AUTH_TOKEN ?? ""}`;
    if (!env.NOIZY_MCP_AUTH_TOKEN || !timingSafeEqual(authHeader, expectedToken)) {
      return new Response("Unauthorized", {
        status: 401,
        headers: { "WWW-Authenticate": 'Bearer realm="noizy-mcp"' },
      });
    }

    // 3. Forward to the Dreamchamber tunnel origin.
    //    TUNNEL_ORIGIN points at the CF Tunnel public hostname (voice.noizy.ai)
    //    or an internal service-binding URL. The tunnel on the M2 Ultra handles
    //    the final hop to localhost:4096.
    if (!env.TUNNEL_ORIGIN) {
      return new Response("Misconfigured: TUNNEL_ORIGIN not set", { status: 500 });
    }

    const target = new URL(env.TUNNEL_ORIGIN);
    target.pathname = url.pathname;
    target.search = url.search;

    // Rebuild headers, drop hop-by-hop ones, preserve auth downstream if the
    // tunnel expects it (otherwise strip here).
    const fwdHeaders = new Headers(request.headers);
    fwdHeaders.set("X-Forwarded-Host", url.hostname);
    fwdHeaders.set("X-Forwarded-Proto", "https");
    fwdHeaders.set("X-NOIZY-Edge", "voice-bridge-remote/v1");

    const fwdRequest = new Request(target.toString(), {
      method: request.method,
      headers: fwdHeaders,
      body: request.body,
      redirect: "manual",
    });

    try {
      const response = await fetch(fwdRequest);
      return response;
    } catch (err) {
      return new Response(`Upstream tunnel unreachable: ${err.message}`, {
        status: 502,
      });
    }
  },
};
