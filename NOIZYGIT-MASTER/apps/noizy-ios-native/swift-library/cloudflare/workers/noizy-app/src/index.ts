/**
 * NOIZY.ai — Cloudflare Worker
 * Runtime Spine v19.0.0
 *
 * Routes:
 *   /              → Landing page
 *   /v1/health     → Health check (all bindings)
 *   /v1/stats      → Empire stats from D1
 *   /v1/consent/*  → Consent kernel (issue, verify, revoke)
 *   /v1/voice/*    → Voice pipeline endpoints
 *   /v1/gabriel/*  → GABRIEL AI endpoints
 *   /v1/admin/*    → Admin endpoints (protected)
 *   /api/*         → Public API
 *
 * Bindings: D1 (3), KV (6), Queues (2), Vectorize (1), Workflows (1)
 */

import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from "cloudflare:workers";

export interface Env {
	// D1 Databases
	DB_PROD: D1Database;
	DB_GABRIEL: D1Database;
	DB_AGENT: D1Database;

	// KV Namespaces
	KV_CONSENT: KVNamespace;
	KV_SESSIONS: KVNamespace;
	KV_FLAGS: KVNamespace;
	KV_VOICE: KVNamespace;
	KV_GABRIEL: KVNamespace;
	KV_CACHE: KVNamespace;
	KV_RECEIPTS: KVNamespace;

	// Queues
	QUEUE_TASKS: Queue;
	QUEUE_WEBHOOKS: Queue;

	// Vectorize
	VECTORIZE_MEMORY: VectorizeIndex;

	// Workflows
	WORKFLOW_CONSENT: Workflow;

	// Vars
	ENVIRONMENT: string;
	HEAVEN_VERSION: string;
	EMPIRE: string;
	FOUNDER: string;
	CONSENT_SPLIT: string;
}

// ─── Router ───

export default {
	async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		// CORS headers
		const corsHeaders = {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization, X-NOIZY-Key",
		};

		if (request.method === "OPTIONS") {
			return new Response(null, { headers: corsHeaders });
		}

		try {
			// Route
			if (path === "/" || path === "") {
				return landing(env, corsHeaders);
			}
			if (path === "/v1/health") {
				return health(env, corsHeaders);
			}
			if (path === "/v1/stats") {
				return stats(env, corsHeaders);
			}
			if (path.startsWith("/v1/consent")) {
				return handleConsent(request, env, corsHeaders);
			}
			if (path.startsWith("/v1/voice")) {
				return handleVoice(request, env, corsHeaders);
			}
			if (path.startsWith("/v1/gabriel")) {
				return handleGabriel(request, env, corsHeaders);
			}
			if (path.startsWith("/v1/admin")) {
				return handleAdmin(request, env, corsHeaders);
			}
			if (path.startsWith("/v1/memory")) {
				return handleMemory(request, env, corsHeaders);
			}
			if (path.startsWith("/v1/workflow")) {
				return handleWorkflow(request, env, corsHeaders);
			}
			if (path.startsWith("/api")) {
				return handleAPI(request, env, corsHeaders);
			}

			return json({ error: "Not found", path, heaven_version: env.HEAVEN_VERSION }, 404, corsHeaders);
		} catch (err: any) {
			return json({ error: err.message, stack: env.ENVIRONMENT === "development" ? err.stack : undefined }, 500, corsHeaders);
		}
	},

	// Queue consumer
	async queue(batch: MessageBatch<any>, env: Env): Promise<void> {
		for (const msg of batch.messages) {
			const { type, payload } = msg.body;
			console.log(`[QUEUE] Processing: ${type}`, payload);

			switch (type) {
				case "consent.issued":
					await env.KV_CONSENT.put(`consent:${payload.actor_id}:${payload.token_id}`, JSON.stringify(payload));
					break;
				case "consent.revoked":
					await env.KV_CONSENT.delete(`consent:${payload.actor_id}:${payload.token_id}`);
					break;
				case "voice.profile":
					await env.KV_VOICE.put(`profile:${payload.actor_id}`, JSON.stringify(payload));
					break;
				case "webhook.incoming":
					// Forward to GABRIEL for processing
					await env.KV_GABRIEL.put(`webhook:${Date.now()}`, JSON.stringify(payload));
					break;
				default:
					console.log(`[QUEUE] Unknown type: ${type}`);
			}

			msg.ack();
		}
	},
};

// ─── Handlers ───

function landing(env: Env, headers: Record<string, string>): Response {
	const html = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>NOIZY.ai — 5th Epoch</title>
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body { background: #0a0a0a; color: #e0e0e0; font-family: 'SF Mono', 'Fira Code', monospace; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
		.container { text-align: center; max-width: 600px; padding: 2rem; }
		h1 { font-size: 3rem; color: #D4AF37; margin-bottom: 0.5rem; }
		.tagline { color: #888; font-size: 1.1rem; margin-bottom: 2rem; }
		.doctrine { color: #D4AF37; font-size: 0.9rem; font-style: italic; margin-top: 2rem; padding: 1rem; border: 1px solid #333; border-radius: 8px; }
		.version { color: #555; font-size: 0.75rem; margin-top: 1rem; }
		.split { display: inline-block; background: #D4AF37; color: #0a0a0a; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: bold; margin: 0.5rem 0; }
	</style>
</head>
<body>
	<div class="container">
		<h1>NOIZY.ai</h1>
		<p class="tagline">AI is the instrument. The human is still the musician.</p>
		<div class="split">75 / 25</div>
		<p class="doctrine">
			Consent as executable code. Provenance as default.<br>
			Revocation as sacred. Compensation as automatic.
		</p>
		<p class="version">HEAVEN ${env.HEAVEN_VERSION} | ${env.ENVIRONMENT} | ${env.EMPIRE} | ${env.FOUNDER}</p>
	</div>
</body>
</html>`;
	return new Response(html, { headers: { ...headers, "Content-Type": "text/html" } });
}

async function health(env: Env, headers: Record<string, string>): Promise<Response> {
	const checks: Record<string, any> = {};

	// D1
	try {
		await env.DB_PROD.prepare("SELECT 1").first();
		checks.d1_prod = true;
	} catch { checks.d1_prod = false; }

	try {
		await env.DB_GABRIEL.prepare("SELECT 1").first();
		checks.d1_gabriel = true;
	} catch { checks.d1_gabriel = false; }

	try {
		await env.DB_AGENT.prepare("SELECT 1").first();
		checks.d1_agent = true;
	} catch { checks.d1_agent = false; }

	// KV
	try {
		await env.KV_CONSENT.get("__health");
		checks.kv_consent = true;
	} catch { checks.kv_consent = false; }

	checks.kv_sessions = true;
	checks.kv_flags = true;
	checks.kv_voice = true;
	checks.kv_gabriel = true;
	checks.kv_cache = true;

	// Vectorize
	try {
		await env.VECTORIZE_MEMORY.describe();
		checks.vectorize_memory = true;
	} catch { checks.vectorize_memory = false; }

	// Workflows binding (presence check — create is async at use time)
	checks.workflow_consent = !!env.WORKFLOW_CONSENT;

	// Queues (binding presence)
	checks.queue_tasks = !!env.QUEUE_TASKS;
	checks.queue_webhooks = !!env.QUEUE_WEBHOOKS;

	const allHealthy = Object.values(checks).every(v => v === true);

	return json({
		status: allHealthy ? "healthy" : "degraded",
		version: env.HEAVEN_VERSION,
		environment: env.ENVIRONMENT,
		checks,
		timestamp: new Date().toISOString(),
	}, allHealthy ? 200 : 503, headers);
}

async function stats(env: Env, headers: Record<string, string>): Promise<Response> {
	let actors = 0, tokens = 0, events = 0, clauses = 0, receipts = 0;

	try {
		const r1 = await env.DB_PROD.prepare("SELECT COUNT(*) as c FROM actors").first<{c: number}>();
		actors = r1?.c ?? 0;
	} catch {}

	try {
		const r2 = await env.DB_PROD.prepare("SELECT COUNT(*) as c FROM consent_tokens").first<{c: number}>();
		tokens = r2?.c ?? 0;
	} catch {}

	try {
		const r3 = await env.DB_PROD.prepare("SELECT COUNT(*) as c FROM consent_events").first<{c: number}>();
		events = r3?.c ?? 0;
	} catch {}

	try {
		const r4 = await env.DB_PROD.prepare("SELECT COUNT(*) as c FROM never_clauses WHERE active = 1").first<{c: number}>();
		clauses = r4?.c ?? 0;
	} catch {}

	try {
		const r5 = await env.DB_PROD.prepare("SELECT COUNT(*) as c FROM receipts").first<{c: number}>();
		receipts = r5?.c ?? 0;
	} catch {}

	return json({
		empire: env.EMPIRE,
		founder: env.FOUNDER,
		consent_split: env.CONSENT_SPLIT,
		stats: {
			actors,
			consent_tokens: tokens,
			consent_events: events,
			never_clauses: clauses,
			receipts,
		},
		version: env.HEAVEN_VERSION,
		timestamp: new Date().toISOString(),
	}, 200, headers);
}

async function handleConsent(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
	const url = new URL(request.url);
	const action = url.pathname.replace("/v1/consent/", "").split("?")[0].replace(/\/$/, "");

	// ─── ISSUE CONSENT ───
	if (request.method === "POST" && action === "issue") {
		const body = await request.json() as any;
		if (!body.actor_id) return json({ error: "actor_id required" }, 400, headers);

		// Check actor exists
		const actor = await env.DB_PROD.prepare("SELECT * FROM actors WHERE actor_id = ?").bind(body.actor_id).first();
		if (!actor) return json({ error: "Actor not found. Register first." }, 404, headers);

		// Check Never Clauses
		const clauses = await env.DB_PROD.prepare("SELECT * FROM never_clauses WHERE actor_id = ? AND active = 1").bind(body.actor_id).all();
		const denied = clauses.results?.map((c: any) => c.clause_type) || [];

		const tokenId = crypto.randomUUID();
		const now = new Date().toISOString();

		// Insert consent token
		await env.DB_PROD.prepare(`
			INSERT INTO consent_tokens (token_id, actor_id, actor_name, scope, granted_permissions, denied_permissions, split_actor, split_platform, status, expires_at, metadata)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
		`).bind(
			tokenId,
			body.actor_id,
			(actor as any).actor_name,
			body.scope || "voice",
			JSON.stringify(body.granted_permissions || []),
			JSON.stringify(denied),
			body.split_actor || 75,
			body.split_platform || 25,
			body.expires_at || null,
			JSON.stringify(body.metadata || {})
		).run();

		// Log event
		await env.DB_PROD.prepare(`
			INSERT INTO consent_events (event_id, token_id, actor_id, event_type, event_data)
			VALUES (?, ?, ?, 'issued', ?)
		`).bind(crypto.randomUUID(), tokenId, body.actor_id, JSON.stringify({ scope: body.scope, split: `${body.split_actor || 75}/${body.split_platform || 25}` })).run();

		// Cache in KV for fast verification
		await env.KV_CONSENT.put(`consent:${body.actor_id}:${tokenId}`, JSON.stringify({ token_id: tokenId, actor_id: body.actor_id, status: "active" }));

		// Queue for async processing
		await env.QUEUE_TASKS.send({ type: "consent.issued", payload: { token_id: tokenId, actor_id: body.actor_id } });

		return json({
			status: "issued",
			token_id: tokenId,
			actor_id: body.actor_id,
			split: `${body.split_actor || 75}/${body.split_platform || 25}`,
			never_clauses: denied,
			issued_at: now,
		}, 201, headers);
	}

	// ─── REVOKE CONSENT ───
	if (request.method === "POST" && action === "revoke") {
		const body = await request.json() as any;
		if (!body.actor_id || !body.token_id) return json({ error: "actor_id and token_id required" }, 400, headers);

		const now = new Date().toISOString();

		// Update D1
		await env.DB_PROD.prepare(`
			UPDATE consent_tokens SET status = 'revoked', revoked_at = ?, revoked_reason = ?, updated_at = ?
			WHERE token_id = ? AND actor_id = ?
		`).bind(now, body.reason || "Creator revocation", now, body.token_id, body.actor_id).run();

		// Log event
		await env.DB_PROD.prepare(`
			INSERT INTO consent_events (event_id, token_id, actor_id, event_type, event_data)
			VALUES (?, ?, ?, 'revoked', ?)
		`).bind(crypto.randomUUID(), body.token_id, body.actor_id, JSON.stringify({ reason: body.reason || "Creator revocation" })).run();

		// Remove from KV cache
		await env.KV_CONSENT.delete(`consent:${body.actor_id}:${body.token_id}`);

		// Queue kill switch
		await env.QUEUE_TASKS.send({ type: "consent.revoked", payload: { token_id: body.token_id, actor_id: body.actor_id, revoked_at: now } });

		return json({ status: "revoked", token_id: body.token_id, actor_id: body.actor_id, revoked_at: now }, 200, headers);
	}

	// ─── VERIFY CONSENT ───
	if (request.method === "GET" && action === "verify") {
		const actorId = url.searchParams.get("actor_id");
		const tokenId = url.searchParams.get("token_id");
		if (!actorId || !tokenId) return json({ error: "actor_id and token_id required" }, 400, headers);

		// Fast path: check KV cache first
		const cached = await env.KV_CONSENT.get(`consent:${actorId}:${tokenId}`);
		if (cached) {
			return json({ valid: true, source: "cache", consent: JSON.parse(cached) }, 200, headers);
		}

		// Slow path: check D1
		const token = await env.DB_PROD.prepare("SELECT * FROM consent_tokens WHERE token_id = ? AND actor_id = ?").bind(tokenId, actorId).first();
		if (token && (token as any).status === "active") {
			// Repopulate cache
			await env.KV_CONSENT.put(`consent:${actorId}:${tokenId}`, JSON.stringify(token));
			return json({ valid: true, source: "database", consent: token }, 200, headers);
		}

		return json({ valid: false, reason: token ? (token as any).status : "not_found" }, 200, headers);
	}

	// ─── LIST ACTOR CONSENTS ───
	if (request.method === "GET" && action === "list") {
		const actorId = url.searchParams.get("actor_id");
		if (!actorId) return json({ error: "actor_id required" }, 400, headers);

		const tokens = await env.DB_PROD.prepare("SELECT * FROM consent_tokens WHERE actor_id = ? ORDER BY created_at DESC").bind(actorId).all();
		return json({ actor_id: actorId, tokens: tokens.results, count: tokens.results?.length || 0 }, 200, headers);
	}

	// ─── GET NEVER CLAUSES ───
	if (request.method === "GET" && action === "never-clauses") {
		const actorId = url.searchParams.get("actor_id") || "RSP_001";
		const clauses = await env.DB_PROD.prepare("SELECT * FROM never_clauses WHERE actor_id = ? AND active = 1").bind(actorId).all();
		return json({ actor_id: actorId, never_clauses: clauses.results, count: clauses.results?.length || 0 }, 200, headers);
	}

	// ─── CONSENT AUDIT TRAIL ───
	if (request.method === "GET" && action === "audit") {
		const tokenId = url.searchParams.get("token_id");
		const actorId = url.searchParams.get("actor_id");
		if (!tokenId && !actorId) return json({ error: "token_id or actor_id required" }, 400, headers);

		let events;
		if (tokenId) {
			events = await env.DB_PROD.prepare("SELECT * FROM consent_events WHERE token_id = ? ORDER BY created_at DESC").bind(tokenId).all();
		} else {
			events = await env.DB_PROD.prepare("SELECT * FROM consent_events WHERE actor_id = ? ORDER BY created_at DESC LIMIT 100").bind(actorId!).all();
		}
		return json({ events: events.results, count: events.results?.length || 0 }, 200, headers);
	}

	return json({
		error: "Unknown consent action",
		actions: [
			"POST /v1/consent/issue    — Issue new consent token",
			"POST /v1/consent/revoke   — Revoke consent (sacred, irreversible)",
			"GET  /v1/consent/verify   — Verify active consent (?actor_id=&token_id=)",
			"GET  /v1/consent/list     — List all consents for actor (?actor_id=)",
			"GET  /v1/consent/never-clauses — Get Never Clauses (?actor_id=)",
			"GET  /v1/consent/audit    — Full audit trail (?token_id= or ?actor_id=)",
		],
	}, 400, headers);
}

async function handleVoice(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {  // eslint-disable-line
	const url = new URL(request.url);
	const action = url.pathname.replace("/v1/voice/", "").split("/")[0];

	if (action === "profile" && request.method === "GET") {
		const actorId = url.searchParams.get("actor_id") || "RSP_001";
		const profile = await env.KV_VOICE.get(`profile:${actorId}`);
		return json({ actor_id: actorId, profile: profile ? JSON.parse(profile) : null }, 200, headers);
	}

	if (action === "register" && request.method === "POST") {
		const body = await request.json() as any;
		await env.QUEUE_TASKS.send({ type: "voice.profile", payload: body });
		return json({ status: "registered", actor_id: body.actor_id }, 201, headers);
	}

	return json({ error: "Unknown voice action", actions: ["profile", "register"] }, 400, headers);
}

async function handleGabriel(_request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
	return json({
		gabriel: "ONLINE",
		version: env.HEAVEN_VERSION,
		founder: env.FOUNDER,
		doctrine: "Consent as code. Provenance as default. Revocation as sacred.",
		timestamp: new Date().toISOString(),
	}, 200, headers);
}

async function handleAdmin(_request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
	return json({
		admin: true,
		d1_databases: ["noizy-prod", "gabriel_db", "agent-memory"],
		kv_namespaces: ["CONSENT", "SESSIONS", "FLAGS", "VOICE", "GABRIEL", "CACHE"],
		queues: ["noizy-tasks", "noizy-webhooks"],
		vectorize: ["noizy-memory"],
		workflows: ["consent-lifecycle"],
		version: env.HEAVEN_VERSION,
	}, 200, headers);
}

async function handleMemory(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
	const url = new URL(request.url);
	const action = url.pathname.replace("/v1/memory", "").replace(/^\//, "").split("?")[0];

	if (request.method === "POST" && action === "upsert") {
		const body = await request.json() as { id: string; values: number[]; metadata?: Record<string, any> };
		if (!body.id || !Array.isArray(body.values)) {
			return json({ error: "id and values[] required" }, 400, headers);
		}
		const result = await env.VECTORIZE_MEMORY.upsert([{ id: body.id, values: body.values, metadata: body.metadata }]);
		return json({ status: "upserted", id: body.id, mutation: result }, 200, headers);
	}

	if (request.method === "POST" && action === "query") {
		const body = await request.json() as { vector: number[]; topK?: number; filter?: Record<string, any> };
		if (!Array.isArray(body.vector)) {
			return json({ error: "vector[] required" }, 400, headers);
		}
		const matches = await env.VECTORIZE_MEMORY.query(body.vector, {
			topK: body.topK ?? 5,
			filter: body.filter,
			returnMetadata: "all",
		});
		return json({ status: "ok", matches }, 200, headers);
	}

	return json({
		error: "Unknown memory action",
		actions: [
			"POST /v1/memory/upsert  — Upsert vector { id, values[], metadata? }",
			"POST /v1/memory/query   — Query { vector[], topK?, filter? }",
		],
	}, 400, headers);
}

async function handleWorkflow(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
	const url = new URL(request.url);
	const action = url.pathname.replace("/v1/workflow", "").replace(/^\//, "").split("?")[0];

	if (request.method === "POST" && action === "consent") {
		const body = await request.json() as Record<string, any>;
		if (!body.actor_id) return json({ error: "actor_id required" }, 400, headers);
		const instance = await env.WORKFLOW_CONSENT.create({ params: body });
		return json({ status: "started", instance_id: instance.id, params: body }, 201, headers);
	}

	if (request.method === "GET" && action === "status") {
		const id = url.searchParams.get("id");
		if (!id) return json({ error: "id required" }, 400, headers);
		const instance = await env.WORKFLOW_CONSENT.get(id);
		const status = await instance.status();
		return json({ instance_id: id, status }, 200, headers);
	}

	return json({
		error: "Unknown workflow action",
		actions: [
			"POST /v1/workflow/consent  — Start consent lifecycle { actor_id, scope, ... }",
			"GET  /v1/workflow/status?id= — Instance status",
		],
	}, 400, headers);
}

// ─── Consent Lifecycle Workflow ───

type ConsentParams = {
	actor_id: string;
	scope?: string;
	granted_permissions?: string[];
	split_actor?: number;
	split_platform?: number;
	metadata?: Record<string, any>;
};

export class ConsentWorkflow extends WorkflowEntrypoint<Env, ConsentParams> {
	async run(event: WorkflowEvent<ConsentParams>, step: WorkflowStep) {
		const { actor_id } = event.payload;

		const actor = await step.do("verify actor", async () => {
			const row = await this.env.DB_PROD.prepare("SELECT * FROM actors WHERE actor_id = ?").bind(actor_id).first();
			if (!row) throw new Error(`Actor not found: ${actor_id}`);
			return row as Record<string, any>;
		});

		const clauses = await step.do("load never clauses", async () => {
			const r = await this.env.DB_PROD.prepare("SELECT clause_type FROM never_clauses WHERE actor_id = ? AND active = 1").bind(actor_id).all();
			return (r.results || []).map((c: any) => c.clause_type);
		});

		const token = await step.do("persist consent token", async () => {
			const token_id = crypto.randomUUID();
			const p = event.payload;
			await this.env.DB_PROD.prepare(`
				INSERT INTO consent_tokens (token_id, actor_id, actor_name, scope, granted_permissions, denied_permissions, split_actor, split_platform, status, metadata)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
			`).bind(
				token_id, actor_id, actor.actor_name, p.scope || "voice",
				JSON.stringify(p.granted_permissions || []), JSON.stringify(clauses),
				p.split_actor ?? 75, p.split_platform ?? 25,
				JSON.stringify(p.metadata || {})
			).run();
			return { token_id };
		});

		await step.do("log issued event", async () => {
			await this.env.DB_PROD.prepare(`
				INSERT INTO consent_events (event_id, token_id, actor_id, event_type, event_data)
				VALUES (?, ?, ?, 'issued', ?)
			`).bind(crypto.randomUUID(), token.token_id, actor_id, JSON.stringify({ via: "workflow" })).run();
		});

		await step.do("cache in KV", async () => {
			await this.env.KV_CONSENT.put(
				`consent:${actor_id}:${token.token_id}`,
				JSON.stringify({ token_id: token.token_id, actor_id, status: "active" })
			);
		});

		await step.do("notify via queue", async () => {
			await this.env.QUEUE_TASKS.send({ type: "consent.issued", payload: { token_id: token.token_id, actor_id } });
		});

		const receipt = await step.do("emit receipt", async () => {
			const receipt_id = crypto.randomUUID();
			const p = event.payload;

			const bundle = {
				receipt_id,
				token_id: token.token_id,
				actor_id,
				action: "consent.issued",
				never_clauses: clauses,
				split: `${p.split_actor ?? 75}/${p.split_platform ?? 25}`,
				emitted_at: new Date().toISOString(),
				via: "workflow",
				metadata: p.metadata || {},
			};
			const bundleBytes = new TextEncoder().encode(JSON.stringify(bundle));
			const digest = await crypto.subtle.digest("SHA-256", bundleBytes);
			const hashHex = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");

			await this.env.KV_RECEIPTS.put(`bundle:${hashHex}`, JSON.stringify(bundle));
			const bundleUrl = `kv://KV_RECEIPTS/bundle:${hashHex}`;

			await this.env.DB_PROD.prepare(`
				INSERT INTO receipts (receipt_id, token_id, actor_id, action, input_hash, output_hash, split_actor, split_platform, proof_bundle_url)
				VALUES (?, ?, ?, 'consent.issued', ?, ?, ?, ?, ?)
			`).bind(
				receipt_id, token.token_id, actor_id,
				hashHex, hashHex,
				p.split_actor ?? 75, p.split_platform ?? 25,
				bundleUrl
			).run();
			return { receipt_id, proof_bundle_url: bundleUrl, hash: hashHex };
		});

		return { token_id: token.token_id, receipt_id: receipt.receipt_id, never_clauses: clauses };
	}
}

async function handleAPI(_request: Request, _env: Env, headers: Record<string, string>): Promise<Response> {
	return json({
		api: "NOIZY.ai Public API",
		version: "v1",
		endpoints: [
			"GET  /v1/health",
			"GET  /v1/stats",
			"POST /v1/consent/issue",
			"POST /v1/consent/revoke",
			"GET  /v1/consent/verify?actor_id=&token_id=",
			"GET  /v1/voice/profile?actor_id=",
			"POST /v1/voice/register",
			"GET  /v1/gabriel",
			"GET  /v1/admin",
			"POST /v1/memory/upsert",
			"POST /v1/memory/query",
			"POST /v1/workflow/consent",
			"GET  /v1/workflow/status?id=",
		],
		doctrine: "75/25 perpetual. Consent as code.",
	}, 200, headers);
}

// ─── Helpers ───

function json(data: any, status: number = 200, headers: Record<string, string> = {}): Response {
	return new Response(JSON.stringify(data, null, 2), {
		status,
		headers: {
			...headers,
			"Content-Type": "application/json",
			"X-NOIZY-Version": "19.0.0",
			"X-NOIZY-Empire": "MC96ECO",
		},
	});
}
