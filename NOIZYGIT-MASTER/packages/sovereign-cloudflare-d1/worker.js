/**
 * ☁️ SOVEREIGN BRAIN & MEMCELLS CLOUDFLARE EDGE WORKER
 * Edge REST & GraphQL API over Cloudflare D1 and KV.
 * Fish Music Inc. · NOIZY Ecosystem · RSP_001
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname, searchParams } = url;

    // CORS Headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Sovereign-Key",
      "Content-Type": "application/json; charset=utf-8"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 1. Health & Status
      if (pathname === "/" || pathname === "/v1/health") {
        return new Response(JSON.stringify({
          status: "ONLINE",
          ecosystem: env.ECOSYSTEM || "NOIZY / FISH MUSIC INC",
          version: env.COUNCIL_VERSION || "2.0.0",
          node_location: request.cf ? request.cf.colo : "LOCAL_DEV",
          timestamp: new Date().toISOString()
        }, null, 2), { headers: corsHeaders });
      }

      // 2. Query MemCells
      if (pathname === "/v1/memcells") {
        const limit = parseInt(searchParams.get("limit") || "50", 10);
        const category = searchParams.get("category");
        let query = "SELECT * FROM sovereign_memcells";
        const params = [];

        if (category) {
          query += " WHERE category = ?";
          params.push(category);
        }
        query += " ORDER BY importance_tier ASC, updated_at DESC LIMIT ?";
        params.push(limit);

        const { results } = await env.DB.prepare(query).bind(...params).all();
        return new Response(JSON.stringify({
          status: "SUCCESS",
          count: results.length,
          memcells: results
        }, null, 2), { headers: corsHeaders });
      }

      // 3. Search Across Knowledge Graph
      if (pathname === "/v1/search") {
        const q = searchParams.get("q");
        if (!q) {
          return new Response(JSON.stringify({ error: "Missing query parameter 'q'" }), { status: 400, headers: corsHeaders });
        }
        const term = `%${q}%`;
        const { results: memResults } = await env.DB.prepare(
          "SELECT id, category, title, content FROM sovereign_memcells WHERE title LIKE ? OR content LIKE ? LIMIT 10"
        ).bind(term, term).all();

        const { results: contactResults } = await env.DB.prepare(
          "SELECT name, email, organization, role FROM sovereign_contacts WHERE name LIKE ? OR email LIKE ? OR organization LIKE ? LIMIT 10"
        ).bind(term, term, term).all();

        return new Response(JSON.stringify({
          status: "SUCCESS",
          query: q,
          results: {
            memcells: memResults,
            contacts: contactResults
          }
        }, null, 2), { headers: corsHeaders });
      }

      // 4. Council Deliberation Logging
      if (pathname === "/v1/council" && request.method === "POST") {
        const body = await request.json();
        const sessionId = "session_" + Date.now();
        await env.DB.prepare(`
          INSERT INTO sovereign_council_sessions (id, prompt, speaking_persona, creed_grounding, rag_retrieval_ms, directives, convergence_status)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          sessionId,
          body.prompt || "No prompt provided",
          body.speaking_persona || "RSP_001",
          body.creed_grounding || "Human Voice Sovereignty",
          body.rag_retrieval_ms || 0.0,
          JSON.stringify(body.directives || []),
          "CONVERGED"
        ).run();

        return new Response(JSON.stringify({
          status: "LOGGED",
          session_id: sessionId
        }, null, 2), { headers: corsHeaders });
      }

      return new Response(JSON.stringify({ error: "Endpoint not found" }), { status: 404, headers: corsHeaders });

    } catch (err) {
      return new Response(JSON.stringify({
        status: "ERROR",
        message: err.message
      }), { status: 500, headers: corsHeaders });
    }
  }
};
