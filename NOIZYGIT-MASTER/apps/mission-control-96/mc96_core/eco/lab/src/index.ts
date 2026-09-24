/**
 * lab.noizy.ai — NOIZYLAB DevOps Control Plane
 * Cloudflare Worker for infrastructure monitoring, DNS proxy, deploy orchestration
 */

export interface Env {
  LAB_DB: D1Database;
  HEAVEN_DNS_URL: string;
  N8N_WEBHOOK_BASE: string;
  DISCORD_DEPLOY_WEBHOOK: string;
  DISCORD_AUDIT_WEBHOOK: string;
}

interface DeployRecord {
  id: string;
  service: string;
  environment: string;
  status: "pending" | "deploying" | "deployed" | "failed" | "rolled_back";
  commit_sha: string;
  actor: string;
  started_at: string;
  finished_at: string | null;
  notes: string;
}

interface HealthSnapshot {
  timestamp: string;
  services: Record<string, ServiceHealth>;
}

interface ServiceHealth {
  status: "LIVE" | "DOWN" | "UNREACHABLE" | "DEGRADED";
  latency_ms: number;
  checked_at: string;
}

// ── Helpers ─────────────────────────────────────────────────────────
function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

function err(message: string, status = 400): Response {
  return json({ ok: false, error: message }, status);
}

const SERVICES = [
  { name: "GABRIEL", url: "http://GOD.local:7777/health", port: 7777 },
  { name: "NOIZYSTREAM-Control", url: "http://GOD.local:7778/health", port: 7778 },
  { name: "NOIZYSTREAM-Signaling", url: "http://GOD.local:7779/", port: 7779 },
  { name: "DreamChamber", url: "http://GOD.local:7780/health", port: 7780 },
  { name: "Mirror", url: "http://GOD.local:7781/health", port: 7781 },
  { name: "Voice-Bridge", url: "http://GOD.local:8080/health", port: 8080 },
  { name: "Command-Bridge", url: "http://GOD.local:8888/health", port: 8888 },
  { name: "Ollama", url: "http://GOD.local:11434/api/tags", port: 11434 },
];

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    try {
      // ── Health ──
      if (path === "/health") {
        return json({
          service: "lab.noizy.ai",
          status: "ok",
          version: "1.0.0",
          timestamp: new Date().toISOString(),
          capabilities: ["health-monitor", "dns-proxy", "deploy-log", "service-map"],
        });
      }

      // ── Service Health Dashboard ──
      if (path === "/services" && method === "GET") {
        return await checkAllServices();
      }
      if (path === "/services/history" && method === "GET") {
        return await getHealthHistory(env);
      }

      // ── DNS Proxy (→ heaven-dns) ──
      if (path === "/dns/list" && method === "GET") {
        return await proxyDns(env, "/dns/list", "GET");
      }
      if (path === "/dns/plan" && method === "POST") {
        return await proxyDns(env, "/dns/plan", "POST", await request.text());
      }
      if (path === "/dns/apply" && method === "POST") {
        return await proxyDns(env, "/dns/apply", "POST", await request.text());
      }

      // ── Deploy Log ──
      if (path === "/deploys" && method === "GET") {
        return await listDeploys(env, url);
      }
      if (path === "/deploys" && method === "POST") {
        return await recordDeploy(env, request);
      }
      if (path.match(/^\/deploys\/[^/]+$/) && method === "PUT") {
        const id = path.split("/")[2];
        return await updateDeploy(env, id, request);
      }

      // ── Infrastructure Map ──
      if (path === "/infra/map") {
        return infraMap();
      }

      // ── Cloudflare Inventory ──
      if (path === "/infra/cloudflare") {
        return cloudflareInventory();
      }

      // ── Notify (Discord) ──
      if (path === "/notify/deploy" && method === "POST") {
        return await notifyDeploy(env, request);
      }
      if (path === "/notify/audit" && method === "POST") {
        return await notifyAudit(env, request);
      }

      return err("Not Found", 404);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Internal Server Error";
      return err(message, 500);
    }
  },
};

// ── Service Health ──────────────────────────────────────────────────

async function checkAllServices(): Promise<Response> {
  const results: Record<string, ServiceHealth> = {};
  const checks = SERVICES.map(async (s) => {
    const start = Date.now();
    try {
      const r = await fetch(s.url, { signal: AbortSignal.timeout(5000) });
      results[s.name] = {
        status: r.ok ? "LIVE" : "DOWN",
        latency_ms: Date.now() - start,
        checked_at: new Date().toISOString(),
      };
    } catch {
      results[s.name] = {
        status: "UNREACHABLE",
        latency_ms: Date.now() - start,
        checked_at: new Date().toISOString(),
      };
    }
  });
  await Promise.all(checks);

  const live = Object.values(results).filter((r) => r.status === "LIVE").length;
  return json({
    ok: true,
    summary: `${live}/${SERVICES.length} services live`,
    services: results,
    timestamp: new Date().toISOString(),
  });
}

async function getHealthHistory(env: Env): Promise<Response> {
  const result = await env.LAB_DB.prepare(
    "SELECT * FROM health_snapshots ORDER BY timestamp DESC LIMIT 50"
  ).all();
  return json({ ok: true, snapshots: result.results });
}

// ── DNS Proxy ───────────────────────────────────────────────────────

async function proxyDns(env: Env, path: string, method: string, body?: string): Promise<Response> {
  const opts: RequestInit = { method, headers: { "Content-Type": "application/json" } };
  if (body) opts.body = body;
  const res = await fetch(`${env.HEAVEN_DNS_URL}${path}`, opts);
  const data = await res.json();
  return json({ ok: true, source: "heaven-dns", ...data as object }, res.status);
}

// ── Deploy Log ──────────────────────────────────────────────────────

async function listDeploys(env: Env, url: URL): Promise<Response> {
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "25"), 100);
  const service = url.searchParams.get("service");

  let query = "SELECT * FROM deploys ORDER BY started_at DESC LIMIT ?";
  const binds: unknown[] = [limit];

  if (service) {
    query = "SELECT * FROM deploys WHERE service = ? ORDER BY started_at DESC LIMIT ?";
    binds.unshift(service);
  }

  const result = await env.LAB_DB.prepare(query).bind(...binds).all<DeployRecord>();
  return json({ ok: true, deploys: result.results, count: result.results.length });
}

async function recordDeploy(env: Env, request: Request): Promise<Response> {
  const body = await request.json<Partial<DeployRecord>>();
  if (!body.service || !body.commit_sha || !body.actor) {
    return err("service, commit_sha, and actor are required");
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await env.LAB_DB.prepare(
    `INSERT INTO deploys (id, service, environment, status, commit_sha, actor, started_at, finished_at, notes)
     VALUES (?, ?, ?, 'pending', ?, ?, ?, NULL, ?)`
  ).bind(id, body.service, body.environment || "staging", body.commit_sha, body.actor, now, body.notes || "").run();

  return json({ ok: true, id, started_at: now }, 201);
}

async function updateDeploy(env: Env, id: string, request: Request): Promise<Response> {
  const body = await request.json<Partial<DeployRecord>>();
  const now = new Date().toISOString();

  const fields: string[] = [];
  const values: unknown[] = [];
  if (body.status) { fields.push("status = ?"); values.push(body.status); }
  if (body.notes) { fields.push("notes = ?"); values.push(body.notes); }
  if (body.status === "deployed" || body.status === "failed" || body.status === "rolled_back") {
    fields.push("finished_at = ?");
    values.push(now);
  }
  if (fields.length === 0) return err("No valid fields to update");

  values.push(id);
  await env.LAB_DB.prepare(`UPDATE deploys SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
  return json({ ok: true, id, updated_at: now });
}

// ── Infrastructure Map ──────────────────────────────────────────────

function infraMap(): Response {
  return json({
    ok: true,
    local: {
      host: "GOD.local (M2 Ultra)",
      services: SERVICES.map((s) => ({ name: s.name, port: s.port })),
    },
    cloudflare: {
      primary: { account: "NOIZY.ai", id: "5f36aa9795348ea681d0b21910dfc82a" },
      legacy: { account: "Fishmusicinc", id: "2446d788cc4280f5ea22a9948410c355", note: "migrate, don't extend" },
    },
    workers: [
      { name: "heaven-dns", url: "heaven-dns.rsp-5f3.workers.dev", status: "deployed" },
      { name: "consent-gateway", status: "blocked" },
      { name: "cb01-router", status: "blocked" },
      { name: "noizy-teams-bridge", status: "ready" },
    ],
    databases: {
      d1: ["noizy-vox", "gabriel_db", "noizyproof", "noizyai-db", "fishmusicinc-db", "noizylab-repairs", "noizylab-db"],
    },
    n8n: { instance: "noizy.app.n8n.cloud", workflows: 14 },
  });
}

function cloudflareInventory(): Response {
  return json({
    ok: true,
    accounts: [
      {
        name: "NOIZY.ai",
        id: "5f36aa9795348ea681d0b21910dfc82a",
        role: "primary",
        d1: 7,
        kv: 13,
        workers: 0,
        pages: ["noizylab-ca", "noizylab-portal"],
      },
      {
        name: "Fishmusicinc",
        id: "2446d788cc4280f5ea22a9948410c355",
        role: "legacy",
        d1: 9,
        kv: 20,
        workers: 1,
        note: "migrate to NOIZY.ai — do not extend",
      },
    ],
  });
}

// ── Discord Notifications ───────────────────────────────────────────

async function notifyDeploy(env: Env, request: Request): Promise<Response> {
  const body = await request.json<{ content: string }>();
  if (!body.content) return err("content is required");

  await fetch(env.DISCORD_DEPLOY_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: `🚀 **DEPLOY** ${body.content}` }),
  });

  return json({ ok: true, notified: "deploy" });
}

async function notifyAudit(env: Env, request: Request): Promise<Response> {
  const body = await request.json<{ content: string }>();
  if (!body.content) return err("content is required");

  await fetch(env.DISCORD_AUDIT_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: `📋 **AUDIT** ${body.content}` }),
  });

  return json({ ok: true, notified: "audit" });
}
