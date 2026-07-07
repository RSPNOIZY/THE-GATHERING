/**
 * NOIZY Admin Worker — Internal admin endpoints
 * Route: admin.noizy.ai/*
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const apiKey = request.headers.get("X-NOIZY-Key");

    if (!apiKey || apiKey !== env.NOIZY_API_KEY) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    switch (url.pathname) {
      case "/health":
        return Response.json({
          success: true,
          service: "noizy-admin",
          timestamp: new Date().toISOString(),
        });

      case "/dns-status":
        return Response.json({
          success: true,
          data: {
            domains: ["noizy.ai", "noizyfish.com", "fishmusicinc.com", "noizyfish.ca"],
            note: "DNS status checked via Cloudflare API",
          },
          timestamp: new Date().toISOString(),
        });

      case "/infra-status":
        return Response.json({
          success: true,
          data: {
            heaven: "heaven.rsp-5f3.workers.dev",
            landing: "noizy-landing.rsp-5f3.workers.dev",
            admin: "noizy-admin.rsp-5f3.workers.dev",
            d1: "gabriel_db",
            kv: ["GABRIEL_KV", "GABRIEL_VOICE"],
          },
          timestamp: new Date().toISOString(),
        });

      default:
        return Response.json({ success: false, error: "Not found" }, { status: 404 });
    }
  },
};
