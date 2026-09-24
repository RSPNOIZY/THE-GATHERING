/**
 * hooks.noizy.ai — HooksHQ Integration & Webhook Router
 * Cloudflare Worker for n8n orchestration, GitHub webhook relay, Discord notifications
 */

export interface Env {
  HOOKS_DB: D1Database;
  N8N_WEBHOOK_BASE: string;
  DISCORD_DEPLOY_WEBHOOK: string;
  DISCORD_AUDIT_WEBHOOK: string;
  WEBHOOK_SECRET: string;
  STRIPE_WEBHOOK_SECRET: string;
  NOIZY_API_KEY: string;
}

interface WebhookLog {
  id: string;
  source: string;
  intent: string;
  status: "received" | "forwarded" | "failed";
  payload_hash: string;
  response_code: number | null;
  created_at: string;
}

type Intent =
  | "check_dns" | "deploy_system" | "plan_dns" | "apply_dns"
  | "health_check" | "sync_notion" | "consent_revoke"
  | "github_push" | "github_pr" | "stripe_event" | "voice_event";

interface CommandPayload {
  intent: Intent;
  params: Record<string, unknown>;
  source: string;
}

// ── n8n Workflow Map ────────────────────────────────────────────────
const WORKFLOW_MAP: Record<string, string> = {
  check_dns: "noizy-command",
  deploy_system: "noizy-command",
  plan_dns: "noizy-command",
  apply_dns: "noizy-command",
  health_check: "noizy-command",
  sync_notion: "noizy-command",
  consent_revoke: "consent-revoke",
  github_push: "github-push",
  github_pr: "github-push",
  stripe_event: "stripe-event",
  voice_event: "voice-event",
};

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

async function hashPayload(payload: string): Promise<string> {
  const data = new TextEncoder().encode(payload);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Webhook-Secret",
        },
      });
    }

    try {
      // ── Health ──
      if (path === "/health") {
        return json({
          service: "hooks.noizy.ai",
          status: "ok",
          version: "1.0.0",
          timestamp: new Date().toISOString(),
          capabilities: ["command-router", "github-relay", "discord-notify", "webhook-log"],
          n8n_workflows: Object.keys(WORKFLOW_MAP).length,
        });
      }

      // ── Command Router (→ n8n) ──
      if (path === "/command" && method === "POST") {
        return await routeCommand(env, request);
      }

      // ── GitHub Webhook Relay ──
      if (path === "/webhook/github" && method === "POST") {
        return await handleGitHub(env, request);
      }

      // ── Stripe Webhook Relay ──
      if (path === "/webhook/stripe" && method === "POST") {
        return await handleStripe(env, request);
      }

      // ── Discord Notifications ──
      if (path === "/notify/deploy" && method === "POST") {
        return await notifyDeploy(env, request);
      }
      if (path === "/notify/audit" && method === "POST") {
        return await notifyAudit(env, request);
      }

      // ── Consent Killswitch (instant, no queuing) ──
      if (path === "/killswitch/consent" && method === "POST") {
        return await consentKillswitch(env, request);
      }

      // ── Killswitch Status ──
      const killswitchStatusMatch = path.match(/^\/killswitch\/status\/([^/]+)$/);
      if (killswitchStatusMatch && method === "GET")
      {
        const key = request.headers.get("X-NOIZY-Key") || url.searchParams.get("key");
        if (!env.NOIZY_API_KEY || key !== env.NOIZY_API_KEY)
        {
          return err("Unauthorized", 401);
        }
        return await killswitchStatus(env, killswitchStatusMatch[1]);
      }

      // ── Webhook Logs ──
      if (path === "/logs" && method === "GET") {
        const key = request.headers.get("X-NOIZY-Key") || url.searchParams.get("key");
        if (!env.NOIZY_API_KEY || key !== env.NOIZY_API_KEY)
        {
          return err("Unauthorized", 401);
        }
        return await listLogs(env, url);
      }

      // ── Workflow Catalog ──
      if (path === "/workflows") {
        return workflowCatalog();
      }

      // ── n8n Health ──
      if (path === "/n8n/health") {
        return await n8nHealth(env);
      }

      return err("Not Found", 404);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Internal Server Error";
      return err(message, 500);
    }
  },
};

// ── Command Router ──────────────────────────────────────────────────

async function routeCommand(env: Env, request: Request): Promise<Response> {
  const raw = await request.text();
  const body = JSON.parse(raw) as CommandPayload;

  if (!body.intent || !body.source) return err("intent and source are required");

  const webhookPath = WORKFLOW_MAP[body.intent];
  if (!webhookPath) return err(`Unknown intent: ${body.intent}`);

  const n8nUrl = `${env.N8N_WEBHOOK_BASE}/${webhookPath}`;
  const payloadHash = await hashPayload(raw);

  // Forward to n8n
  let responseCode: number;
  let result: unknown;
  try {
    const res = await fetch(n8nUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: raw,
    });
    responseCode = res.status;
    result = await res.json().catch(async () => ({ raw: await res.text() }));
  } catch (e) {
    responseCode = 0;
    result = { error: e instanceof Error ? e.message : "fetch failed" };
  }

  // Log
  await logWebhook(env, body.source, body.intent, responseCode > 0 ? "forwarded" : "failed", payloadHash, responseCode);

  return json({
    ok: responseCode >= 200 && responseCode < 300,
    intent: body.intent,
    source: body.source,
    n8n_status: responseCode,
    result,
    logged: true,
  });
}

// ── GitHub Webhook ──────────────────────────────────────────────────

async function handleGitHub(env: Env, request: Request): Promise<Response> {
  const event = request.headers.get("X-GitHub-Event") || "unknown";
  const raw = await request.text();
  const payloadHash = await hashPayload(raw);

  // ── Edge Security: Validate GitHub Webhook Signature ──
  const signature = request.headers.get("X-Hub-Signature-256");
  if (env.WEBHOOK_SECRET && signature)
  {
    try
    {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw", encoder.encode(env.WEBHOOK_SECRET),
        { name: "HMAC", hash: "SHA-256" }, false, ["verify", "sign"]
      );
      const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(raw));
      const expected = "sha256=" + [...new Uint8Array(mac)].map(b => b.toString(16).padStart(2, "0")).join("");

      if (signature !== expected)
      {
        await logWebhook(env, "github", "auth_failure", "failed", payloadHash, 401);
        return err("Invalid signature", 401);
      }
    } catch (e)
    {
      return err("Signature verification failed", 500);
    }
  }

  const intent: Intent = event === "pull_request" ? "github_pr" : "github_push";
  const webhookPath = WORKFLOW_MAP[intent];

  let responseCode = 0;
  try {
    const res = await fetch(`${env.N8N_WEBHOOK_BASE}/${webhookPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-GitHub-Event": event,
      },
      body: raw,
    });
    responseCode = res.status;
  } catch { /* fire and forget to n8n */ }

  await logWebhook(env, "github", intent, responseCode >= 200 ? "forwarded" : "failed", payloadHash, responseCode);

  return json({ ok: true, event, intent, forwarded: responseCode >= 200 });
}

// ── Stripe Webhook ──────────────────────────────────────────────────

async function handleStripe(env: Env, request: Request): Promise<Response> {
  const raw = await request.text();
  const payloadHash = await hashPayload(raw);

  // ── Edge Security: Validate Stripe Webhook Signature ──
  const signature = request.headers.get("Stripe-Signature");
  if (env.STRIPE_WEBHOOK_SECRET && signature)
  {
    try
    {
      const parsedSig = signature.split(',').reduce((acc, pair) =>
      {
        const [key, value] = pair.split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      if (!parsedSig.t || !parsedSig.v1) return err("Invalid signature format", 401);

      const signedPayload = `${parsedSig.t}.${raw}`;
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw", encoder.encode(env.STRIPE_WEBHOOK_SECRET),
        { name: "HMAC", hash: "SHA-256" }, false, ["verify", "sign"]
      );
      const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
      const expected = [...new Uint8Array(mac)].map(b => b.toString(16).padStart(2, "0")).join("");

      if (parsedSig.v1 !== expected)
      {
        await logWebhook(env, "stripe", "auth_failure", "failed", payloadHash, 401);
        return err("Invalid Stripe signature", 401);
      }
    } catch (e)
    {
      return err("Signature verification failed", 500);
    }
  }

  let responseCode = 0;
  try {
    const res = await fetch(`${env.N8N_WEBHOOK_BASE}/stripe-event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: raw,
    });
    responseCode = res.status;
  } catch { /* fire and forget */ }

  await logWebhook(env, "stripe", "stripe_event", responseCode >= 200 ? "forwarded" : "failed", payloadHash, responseCode);

  return json({ ok: true, intent: "stripe_event", forwarded: responseCode >= 200 });
}

// ── Consent Killswitch (instant — no queuing) ───────────────────────

async function killswitchStatus(env: Env, actor_id: string): Promise<Response>
{
  try
  {
    const res = await fetch(`https://heaven.noizy.ai/api/v1/actors/${actor_id}/consent-tokens`, {
      headers: { "X-NOIZY-Key": env.NOIZY_API_KEY }
    });
    if (!res.ok) return err(`Heaven API error: ${res.status}`, res.status);

    const data = await res.json() as any;
    const tokens = data.consent_tokens || [];
    const revoked = tokens.filter((t: any) => t.status === "revoked");
    const active = tokens.filter((t: any) => t.status === "active");

    return json({
      ok: true,
      actor_id,
      kill_switch_engaged: revoked.length > 0 && active.length === 0,
      summary: {
        total_tokens: tokens.length,
        active: active.length,
        revoked: revoked.length
      },
      revoked_tokens: revoked.map((t: any) => ({
        token_id: t.token_id,
        revoked_at: t.revoked_at,
        reason: t.revocation_reason
      }))
    });
  } catch (e)
  {
    return err("Failed to query Heaven kernel", 500);
  }
}

async function consentKillswitch(env: Env, request: Request): Promise<Response> {
  const body = await request.json<{ user_id: string; scope?: string; reason?: string }>();
  if (!body.user_id) return err("user_id is required");

  // Instant forward — consent killswitch must never be queued
  const res = await fetch(`${env.N8N_WEBHOOK_BASE}/consent-revoke`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: "consent_revoke",
      params: body,
      source: "hooks-killswitch",
      priority: "critical",
      timestamp: new Date().toISOString(),
    }),
  });

  await logWebhook(env, "killswitch", "consent_revoke",
    res.ok ? "forwarded" : "failed", body.user_id, res.status);

  return json({
    ok: res.ok,
    killswitch: "fired",
    user_id: body.user_id,
    scope: body.scope || "all",
    instant: true,
  });
}

// ── Discord Notifications ───────────────────────────────────────────

async function notifyDeploy(env: Env, request: Request): Promise<Response> {
  const body = await request.json<{ content: string }>();
  if (!body.content) return err("content is required");

  await fetch(env.DISCORD_DEPLOY_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: body.content }),
  });

  return json({ ok: true, channel: "deploy" });
}

async function notifyAudit(env: Env, request: Request): Promise<Response> {
  const body = await request.json<{ content: string }>();
  if (!body.content) return err("content is required");

  await fetch(env.DISCORD_AUDIT_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: body.content }),
  });

  return json({ ok: true, channel: "audit" });
}

// ── Webhook Logging ─────────────────────────────────────────────────

async function logWebhook(
  env: Env, source: string, intent: string, status: string,
  payloadHash: string, responseCode: number
): Promise<void> {
  try {
    await env.HOOKS_DB.prepare(
      `INSERT INTO webhook_logs (id, source, intent, status, payload_hash, response_code, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(crypto.randomUUID(), source, intent, status, payloadHash, responseCode, new Date().toISOString()).run();
  } catch { /* logging failure should never block the webhook */ }
}

async function listLogs(env: Env, url: URL): Promise<Response> {
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);
  const source = url.searchParams.get("source");

  let query = "SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT ?";
  const binds: unknown[] = [limit];

  if (source) {
    query = "SELECT * FROM webhook_logs WHERE source = ? ORDER BY created_at DESC LIMIT ?";
    binds.unshift(source);
  }

  const result = await env.HOOKS_DB.prepare(query).bind(...binds).all<WebhookLog>();
  return json({ ok: true, logs: result.results, count: result.results.length });
}

// ── Workflow Catalog ────────────────────────────────────────────────

function workflowCatalog(): Response {
  return json({
    ok: true,
    workflows: [
      { name: "GitHub → GABRIEL", file: "01_github_to_gabriel.json", trigger: "webhook: github-push" },
      { name: "Stripe → Ledger", file: "02_stripe_to_ledger.json", trigger: "webhook: stripe-event" },
      { name: "Voice → DreamChamber", file: "03_voice_to_dreamchamber.json", trigger: "webhook: voice-event" },
      { name: "Health Monitor", file: "04_health_monitor_alerts.json", trigger: "cron or webhook" },
      { name: "Notion Sync", file: "05_notion_sync.json", trigger: "webhook: notion-update" },
      { name: "Consent Killswitch", file: "06_consent_revoke_killswitch.json", trigger: "webhook: consent-revoke", priority: "critical" },
      { name: "Notion → GitHub Deploy", file: "07_notion_to_github_deploy.json", trigger: "webhook: notion-task-trigger" },
      { name: "GitHub Deploy Pipeline", file: "github_deploy_pipeline.json", trigger: "webhook: github-push" },
      { name: "DreamChamber Auto", file: "dreamchamber_automation.json", trigger: "webhook" },
      { name: "Heaven Webhook", file: "heaven_webhook.json", trigger: "webhook" },
      { name: "Complete Orchestrator", file: "noizy_complete_webhook_orchestrator.json", trigger: "webhook" },
      { name: "Notion Watcher", file: "notion_sync_watcher.json", trigger: "polling" },
      { name: "Enterprise Sync", file: "github_enterprise_sync.json", trigger: "webhook: enterprise-sync" },
      { name: "Evidence Pack", file: "generate_evidence_workflow.json", trigger: "webhook: generate-evidence" },
    ],
    n8n_instance: "noizy.app.n8n.cloud",
    total: 14,
  });
}

// ── n8n Health ──────────────────────────────────────────────────────

async function n8nHealth(env: Env): Promise<Response> {
  try {
    const start = Date.now();
    const res = await fetch(`${env.N8N_WEBHOOK_BASE.replace("/webhook", "")}/healthz`, {
      signal: AbortSignal.timeout(5000),
    });
    return json({
      ok: true,
      n8n: res.ok ? "LIVE" : `DOWN (${res.status})`,
      latency_ms: Date.now() - start,
    });
  } catch {
    return json({ ok: true, n8n: "UNREACHABLE", latency_ms: -1 });
  }
}
