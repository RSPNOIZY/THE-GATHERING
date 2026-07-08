// ============================================================
// LUCY WORKER — API Gateway for the Lucy Mesh
// Architect: Robert Stephen Plowman
// Charter: ../00-LUCY-MESH-CHARTER.md
// ============================================================
// Endpoints:
//   GET  /api/mesh     — current device_status, with staleness flag
//   POST /api/chat     — route a user message through Claude, persist both turns
//   POST /api/ping     — heartbeat from any agent, updates device_status
//   GET  /api/history  — recent messages for a session (for PWA rehydration)
//
// Auth: every POST requires header `x-lucy-auth: <LUCY_SHARED_SECRET>`.
// GETs are CORS-gated to ALLOWED_ORIGIN.
// ============================================================

export interface Env {
  AGENT_MEMORY: D1Database;
  ANTHROPIC_API_KEY: string;
  LUCY_SHARED_SECRET: string;
  ALLOWED_ORIGIN: string;
  CLAUDE_MODEL: string;
  CONTEXT_TURNS: string;
}

// ---------- small helpers ----------------------------------

const STALE_SECONDS = 90; // heartbeat older than this = offline

function cors(env: Env): HeadersInit {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-lucy-auth",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(body: unknown, status = 200, env?: Env): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(env ? cors(env) : {}),
    },
  });
}

function requireAuth(request: Request, env: Env): Response | null {
  const provided = request.headers.get("x-lucy-auth");
  if (!provided || provided !== env.LUCY_SHARED_SECRET) {
    return json({ error: "unauthorized" }, 401, env);
  }
  return null;
}

async function safeJson<T = any>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

// ---------- D1 helpers -------------------------------------

async function ensureSession(env: Env, sessionId: string, deviceId: string) {
  await env.AGENT_MEMORY.prepare(
    `INSERT INTO sessions (session_id, device_id, start_time, last_active, status)
     VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'active')
     ON CONFLICT(session_id) DO UPDATE SET last_active = CURRENT_TIMESTAMP`
  ).bind(sessionId, deviceId).run();
}

async function logMessage(
  env: Env,
  sessionId: string,
  role: "user" | "assistant" | "system",
  content: string,
  agentId: string | null
) {
  await env.AGENT_MEMORY.prepare(
    `INSERT INTO messages (message_id, session_id, agent_id, role, content)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(crypto.randomUUID(), sessionId, agentId, role, content).run();
}

async function recentTurns(env: Env, sessionId: string, limit: number) {
  const { results } = await env.AGENT_MEMORY.prepare(
    `SELECT role, content
     FROM messages
     WHERE session_id = ? AND role IN ('user','assistant')
     ORDER BY timestamp DESC
     LIMIT ?`
  ).bind(sessionId, limit).all<{ role: string; content: string }>();
  // Return chronological order for Claude.
  return (results ?? []).reverse();
}

// ---------- endpoint handlers ------------------------------

async function handleMesh(env: Env): Promise<Response> {
  const { results } = await env.AGENT_MEMORY.prepare(
    `SELECT agent_id, surface, status, current_task, last_ping,
            (strftime('%s','now') - strftime('%s', last_ping)) AS seconds_since_ping
     FROM device_status
     ORDER BY agent_id`
  ).all<any>();

  const mesh = (results ?? []).map((row) => ({
    ...row,
    live: row.seconds_since_ping !== null && row.seconds_since_ping <= STALE_SECONDS,
  }));
  return json({ mesh, stale_threshold_seconds: STALE_SECONDS }, 200, env);
}

async function handlePing(request: Request, env: Env): Promise<Response> {
  const body = await safeJson<{ agent_id?: string; status?: string; current_task?: string }>(request);
  if (!body?.agent_id) return json({ error: "agent_id required" }, 400, env);

  const status = body.status ?? "idle";
  const task = body.current_task ?? null;

  await env.AGENT_MEMORY.prepare(
    `UPDATE device_status
     SET status = ?, current_task = ?, last_ping = CURRENT_TIMESTAMP
     WHERE agent_id = ?`
  ).bind(status, task, body.agent_id).run();

  return json({ ok: true, agent_id: body.agent_id }, 200, env);
}

async function handleHistory(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 200);
  if (!sessionId) return json({ error: "session_id required" }, 400, env);

  const { results } = await env.AGENT_MEMORY.prepare(
    `SELECT message_id, agent_id, role, content, timestamp
     FROM messages
     WHERE session_id = ?
     ORDER BY timestamp DESC
     LIMIT ?`
  ).bind(sessionId, limit).all();

  return json({ session_id: sessionId, messages: (results ?? []).reverse() }, 200, env);
}

async function handleChat(request: Request, env: Env): Promise<Response> {
  const body = await safeJson<{
    session_id?: string;
    device_id?: string;
    agent_id?: string;
    message?: string;
  }>(request);

  if (!body?.session_id || !body.message || typeof body.message !== "string") {
    return json({ error: "session_id and message are required" }, 400, env);
  }
  if (body.message.length > 16000) {
    return json({ error: "message too long" }, 413, env);
  }

  const sessionId = body.session_id;
  const deviceId = body.device_id ?? "unknown";
  const agentId = body.agent_id ?? null;

  await ensureSession(env, sessionId, deviceId);
  await logMessage(env, sessionId, "user", body.message, agentId);

  // Build conversation context from D1. Lucy's memory is the whole point.
  const contextTurns = Math.max(2, parseInt(env.CONTEXT_TURNS ?? "12", 10) || 12);
  const prior = await recentTurns(env, sessionId, contextTurns);

  // The just-inserted user message is already the last turn in `prior`, so
  // send prior as-is. If somehow it isn't (race), append it defensively.
  const lastIsUser = prior.length > 0 && prior[prior.length - 1].role === "user";
  const messagesForClaude = lastIsUser
    ? prior
    : [...prior, { role: "user", content: body.message }];

  let assistantText = "";
  try {
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: env.CLAUDE_MODEL,
        max_tokens: 1024,
        system:
          "You are Claude, operating as the reasoning partner inside the Lucy Mesh " +
          "— a personal AI operating layer for Robert Stephen Plowman. Be grounded, " +
          "calm, precise, and honest. Stress-test ideas when warranted. Do not " +
          "cheerlead. Treat identity and authorship with care.",
        messages: messagesForClaude,
      }),
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text();
      await logMessage(env, sessionId, "system", `[claude_error] ${errText}`, "Pops");
      return json({ error: "claude_upstream_error", detail: errText.slice(0, 500) }, 502, env);
    }

    const data: any = await claudeRes.json();
    assistantText =
      Array.isArray(data.content) && data.content[0]?.text
        ? data.content[0].text
        : "(no content returned)";
  } catch (e: any) {
    await logMessage(env, sessionId, "system", `[claude_exception] ${String(e?.message ?? e)}`, "Pops");
    return json({ error: "claude_fetch_failed" }, 502, env);
  }

  await logMessage(env, sessionId, "assistant", assistantText, agentId);
  return json({ session_id: sessionId, response: assistantText }, 200, env);
}

// ---------- router -----------------------------------------

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors(env) });
    }

    const url = new URL(request.url);

    try {
      // Public GETs
      if (request.method === "GET" && url.pathname === "/api/mesh") {
        return await handleMesh(env);
      }
      if (request.method === "GET" && url.pathname === "/api/history") {
        return await handleHistory(request, env);
      }
      if (request.method === "GET" && url.pathname === "/api/health") {
        return json({ ok: true, service: "lucy-worker", time: new Date().toISOString() }, 200, env);
      }

      // Authed POSTs
      if (request.method === "POST" && url.pathname === "/api/chat") {
        const deny = requireAuth(request, env);
        if (deny) return deny;
        return await handleChat(request, env);
      }
      if (request.method === "POST" && url.pathname === "/api/ping") {
        const deny = requireAuth(request, env);
        if (deny) return deny;
        return await handlePing(request, env);
      }

      return json({ error: "not_found", path: url.pathname }, 404, env);
    } catch (e: any) {
      return json({ error: "internal_error", detail: String(e?.message ?? e) }, 500, env);
    }
  },
};
