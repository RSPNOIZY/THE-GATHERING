// ═══════════════════════════════════════════════════════════════════════
// HEAVEN v18 — The Consent Kernel
//
// The front door. Routes all requests. Enforces all rules.
// Every voice synthesis in the NOIZY empire passes through here.
//
// 2036 Constraint #2: All endpoints under /v1/.
// 2036 Constraint #8: Idempotency keys on every mutation.
// 2036 Constraint #9: No sequential IDs in public APIs.
//
// Author: Robert Stephen Plowman
// ═══════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, HealthResponse, ApiError, Actor, NeverClause, ConsentToken, ConsentScope, LedgerEntry } from './types';
import { checkConsent, calculateRoyalty } from './consent';

const app = new Hono<{ Bindings: Env }>();
const START_TIME = Date.now();

// ── Middleware ──────────────────────────────────────────────────────────

// CORS — allow the landing page, Cloudflare Pages, and DreamChamber
app.use('*', cors({
  origin: ['https://noizy.ai', 'https://www.noizy.ai', 'https://noizy-ai-landing.pages.dev', 'http://localhost:3000', 'http://localhost:7777'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Actor-ID', 'X-Licensee-ID'],
}));

// Version header on every response
app.use('*', async (c, next) => {
  await next();
  c.header('HEAVEN-API-Version', 'v1');
  c.header('HEAVEN-Version', c.env.HEAVEN_VERSION);
  c.header('X-Powered-By', 'NOIZY.AI Consent Kernel');
});

// ── Root redirect ──────────────────────────────────────────────────────

app.get('/', (c) => {
  return c.json({
    name: 'HEAVEN',
    version: c.env.HEAVEN_VERSION,
    message: 'Consent is law. All endpoints under /v1/.',
    docs: 'https://noizy.ai/docs/api',
    health: '/v1/health',
  });
});

// ═══════════════════════════════════════════════════════════════════════
// V1 API ROUTES
// ═══════════════════════════════════════════════════════════════════════

const v1 = new Hono<{ Bindings: Env }>();

// ── Health Check ───────────────────────────────────────────────────────

v1.get('/health', async (c) => {
  const [agentOk, hvsOk] = await Promise.all([
    checkDb(c.env.DB_AGENT),
    checkDb(c.env.DB_HVS),
  ]);

  const [kvVoice, kvGabriel, kvFlags, kvGaps] = await Promise.all([
    checkKv(c.env.KV_VOICE),
    checkKv(c.env.KV_GABRIEL),
    checkKv(c.env.KV_FLAGS),
    checkKv(c.env.KV_GAPS),
  ]);

  const allOk = agentOk && hvsOk && kvVoice && kvGabriel && kvFlags && kvGaps;

  const health: HealthResponse = {
    status: allOk ? 'ok' : 'degraded',
    version: c.env.HEAVEN_VERSION,
    environment: c.env.ENVIRONMENT,
    databases: { agent_memory: agentOk, gabriel_db: hvsOk },
    kv: { voice: kvVoice, gabriel: kvGabriel, flags: kvFlags, gaps: kvGaps },
    timestamp: new Date().toISOString(),
    uptime_ms: Date.now() - START_TIME,
  };

  return c.json(health, allOk ? 200 : 503);
});

// ── Never Clauses (read-only, constitutional) ──────────────────────────

v1.get('/never-clauses', async (c) => {
  const result = await c.env.DB_HVS.prepare(
    'SELECT clause_id, clause_code, clause_text, category, is_global FROM hvs_never_clauses ORDER BY clause_id'
  ).all<NeverClause>();

  return c.json({
    count: result.results.length,
    clauses: result.results,
    note: 'These clauses are constitutional. They cannot be modified, deleted, or overridden.',
  });
});

// ── Actors ─────────────────────────────────────────────────────────────

// 2036 Constraint #1: No single-actor assumptions. Always accept actor_id.
v1.get('/actors/:actor_id', async (c) => {
  const actorId = c.req.param('actor_id');
  const result = await c.env.DB_HVS.prepare(
    'SELECT * FROM hvs_actors WHERE actor_id = ?'
  ).bind(actorId).first<Actor>();

  if (!result) {
    return c.json(makeError('Actor not found', 'ACTOR_NOT_FOUND', 404, c.env), 404);
  }

  return c.json({ actor: result });
});

v1.get('/actors', async (c) => {
  const result = await c.env.DB_HVS.prepare(
    'SELECT actor_id, display_name, country, status, is_founding, onboarded_at FROM hvs_actors ORDER BY onboarded_at'
  ).all<Actor>();

  return c.json({ count: result.results.length, actors: result.results });
});

// ── Consent Check (the core operation) ─────────────────────────────────

v1.post('/consent/check', async (c) => {
  const body = await c.req.json<{
    actor_id: string;
    licensee_id: string;
    use_case: string;
    jurisdiction: string;
    medium: string;
    consent_token_id?: string;
  }>();

  // Validate required fields
  if (!body.actor_id || !body.licensee_id || !body.use_case || !body.jurisdiction || !body.medium) {
    return c.json(makeError(
      'Missing required fields: actor_id, licensee_id, use_case, jurisdiction, medium',
      'VALIDATION_ERROR', 400, c.env
    ), 400);
  }

  // Fetch actor (Constraint #1: always by actor_id, no defaults)
  const actor = await c.env.DB_HVS.prepare(
    'SELECT * FROM hvs_actors WHERE actor_id = ?'
  ).bind(body.actor_id).first<Actor>();

  if (!actor) {
    return c.json(makeError(`Actor '${body.actor_id}' not found`, 'ACTOR_NOT_FOUND', 404, c.env), 404);
  }

  // Fetch never clauses
  const clauseResult = await c.env.DB_HVS.prepare(
    'SELECT * FROM hvs_never_clauses WHERE actor_id = ? OR is_global = 1'
  ).bind(body.actor_id).all<NeverClause>();

  // Fetch consent token (if provided)
  let consentToken: ConsentToken | null = null;
  if (body.consent_token_id) {
    const tokenRow = await c.env.DB_HVS.prepare(
      'SELECT * FROM hvs_consent_tokens WHERE token_id = ? AND actor_id = ?'
    ).bind(body.consent_token_id, body.actor_id).first<ConsentToken>();

    if (tokenRow) {
      // Parse scope JSON if stored as string
      consentToken = {
        ...tokenRow,
        scope: typeof tokenRow.scope === 'string' ? JSON.parse(tokenRow.scope as unknown as string) : tokenRow.scope,
      };
    }
  }

  // Run the pure consent check function (Constraint #3)
  const decision = checkConsent({
    actor,
    token: consentToken,
    never_clauses: clauseResult.results,
    requested_use_case: body.use_case,
    requested_jurisdiction: body.jurisdiction,
    requested_medium: body.medium,
    licensee_id: body.licensee_id,
    timestamp: new Date().toISOString(),
  });

  // Log to consent_log (Constraint #5: append-only)
  await c.env.DB_AGENT.prepare(
    `INSERT INTO consent_log (actor_id, licensee_id, use_case, jurisdiction, medium,
     decision, reason, token_id, checked_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    body.actor_id, body.licensee_id, body.use_case, body.jurisdiction, body.medium,
    decision.allowed ? 'ALLOWED' : 'DENIED', decision.reason,
    decision.token_id, decision.checked_at
  ).run();

  return c.json({ decision }, decision.allowed ? 200 : 403);
});

// ── Consent Token Management ───────────────────────────────────────────

v1.post('/consent/grant', async (c) => {
  // Constraint #8: Idempotency key required
  const idempotencyKey = c.req.header('Idempotency-Key');
  if (!idempotencyKey) {
    return c.json(makeError(
      'Idempotency-Key header required for all mutations',
      'IDEMPOTENCY_REQUIRED', 400, c.env
    ), 400);
  }

  // Check for existing idempotent response
  const cached = await c.env.KV_GABRIEL.get(`idem:${idempotencyKey}`);
  if (cached) {
    const parsed = JSON.parse(cached);
    return c.json(parsed.body, parsed.status);
  }

  const body = await c.req.json<{
    actor_id: string;
    licensee_id: string;
    scope: ConsentScope;
    duration_days?: number;
  }>();

  // Generate token ID (Constraint #9: no sequential IDs)
  const tokenId = `CT-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const expiresAt = body.duration_days
    ? new Date(Date.now() + body.duration_days * 86400000).toISOString()
    : null;

  await c.env.DB_HVS.prepare(
    `INSERT INTO hvs_consent_tokens (token_id, actor_id, licensee_id, scope, status, granted_at, expires_at)
     VALUES (?, ?, ?, ?, 'active', ?, ?)`
  ).bind(tokenId, body.actor_id, body.licensee_id, JSON.stringify(body.scope), now, expiresAt).run();

  // Log to ledger (Constraint #5: append-only)
  const eventId = `EVT-${crypto.randomUUID()}`;
  await c.env.DB_HVS.prepare(
    `INSERT INTO noizy_ledger (event_id, actor_id, licensee_id, consent_token_id, event_type, payload_json,
     amount_cad, actor_share_cad, noizy_share_cad, union_share_cad, source_system, recorded_at)
     VALUES (?, ?, ?, ?, 'consent.granted', ?, 0, 0, 0, 0, 'HEAVEN', ?)`
  ).bind(eventId, body.actor_id, body.licensee_id, tokenId, JSON.stringify(body.scope), now).run();

  const responseBody = { token_id: tokenId, status: 'active', granted_at: now, expires_at: expiresAt };
  const responseStatus = 201;

  // Cache for idempotency (24 hours)
  await c.env.KV_GABRIEL.put(
    `idem:${idempotencyKey}`,
    JSON.stringify({ body: responseBody, status: responseStatus }),
    { expirationTtl: 86400 }
  );

  return c.json(responseBody, responseStatus);
});

v1.post('/consent/revoke', async (c) => {
  const idempotencyKey = c.req.header('Idempotency-Key');
  if (!idempotencyKey) {
    return c.json(makeError('Idempotency-Key header required', 'IDEMPOTENCY_REQUIRED', 400, c.env), 400);
  }

  const cached = await c.env.KV_GABRIEL.get(`idem:${idempotencyKey}`);
  if (cached) {
    const parsed = JSON.parse(cached);
    return c.json(parsed.body, parsed.status);
  }

  const body = await c.req.json<{ token_id: string; actor_id: string; reason?: string }>();
  const now = new Date().toISOString();

  // Revoke the token
  const result = await c.env.DB_HVS.prepare(
    `UPDATE hvs_consent_tokens SET status = 'revoked', revoked_at = ? WHERE token_id = ? AND actor_id = ?`
  ).bind(now, body.token_id, body.actor_id).run();

  if (!result.meta.changes) {
    return c.json(makeError('Token not found or not owned by actor', 'TOKEN_NOT_FOUND', 404, c.env), 404);
  }

  // Log to ledger
  const eventId = `EVT-${crypto.randomUUID()}`;
  await c.env.DB_HVS.prepare(
    `INSERT INTO noizy_ledger (event_id, actor_id, consent_token_id, event_type, payload_json,
     amount_cad, actor_share_cad, noizy_share_cad, union_share_cad, source_system, recorded_at)
     VALUES (?, ?, ?, 'consent.revoked', ?, 0, 0, 0, 0, 'HEAVEN', ?)`
  ).bind(eventId, body.actor_id, body.token_id, JSON.stringify({ reason: body.reason ?? 'Actor-initiated revocation' }), now).run();

  const responseBody = { token_id: body.token_id, status: 'revoked', revoked_at: now };
  await c.env.KV_GABRIEL.put(`idem:${idempotencyKey}`, JSON.stringify({ body: responseBody, status: 200 }), { expirationTtl: 86400 });

  return c.json(responseBody);
});

// ── Agents ─────────────────────────────────────────────────────────────

v1.get('/agents', async (c) => {
  const result = await c.env.DB_AGENT.prepare(
    'SELECT agent_id, agent_name, role, status, device_target FROM agent_registry ORDER BY id'
  ).all<Agent>();

  return c.json({ count: result.results.length, agents: result.results });
});

v1.get('/agents/:agent_id', async (c) => {
  const agentId = c.req.param('agent_id');
  const result = await c.env.DB_AGENT.prepare(
    'SELECT * FROM agent_registry WHERE agent_id = ?'
  ).bind(agentId).first<Agent>();

  if (!result) {
    return c.json(makeError('Agent not found', 'AGENT_NOT_FOUND', 404, c.env), 404);
  }

  return c.json({ agent: result });
});

// ── Ledger (read-only — Constraint #5) ─────────────────────────────────

v1.get('/ledger', async (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') ?? '50'), 100);
  const offset = parseInt(c.req.query('offset') ?? '0');

  const result = await c.env.DB_HVS.prepare(
    'SELECT * FROM noizy_ledger ORDER BY recorded_at DESC LIMIT ? OFFSET ?'
  ).bind(limit, offset).all<LedgerEntry>();

  return c.json({
    count: result.results.length,
    entries: result.results,
    note: 'This ledger is append-only. No entries can be modified or deleted.',
  });
});

// ── Estates ────────────────────────────────────────────────────────────

v1.get('/estates/:actor_id', async (c) => {
  const actorId = c.req.param('actor_id');
  const result = await c.env.DB_HVS.prepare(
    'SELECT * FROM hvs_estates WHERE actor_id = ?'
  ).bind(actorId).first();

  if (!result) {
    return c.json(makeError('Estate not found', 'ESTATE_NOT_FOUND', 404, c.env), 404);
  }

  return c.json({ estate: result });
});

// ── Feature Flags ──────────────────────────────────────────────────────

v1.get('/flags/:flag_name', async (c) => {
  const flagName = c.req.param('flag_name');
  const value = await c.env.KV_FLAGS.get(flagName);

  return c.json({
    flag: flagName,
    value: value ? JSON.parse(value) : null,
    exists: value !== null,
  });
});

// ── Signup (for landing page) ──────────────────────────────────────────

v1.post('/signup', async (c) => {
  const body = await c.req.json<{
    email: string;
    name?: string;
    role?: string;
    preference?: string;
    source?: string;
    variant?: string;
  }>();

  // Accept either 'role' (landing page) or 'preference' (API direct) — normalize to preference
  const preference = body.role || body.preference;

  if (!body.email || !preference) {
    return c.json(makeError('Email and role/preference required', 'VALIDATION_ERROR', 400, c.env), 400);
  }

  // Map landing page roles to preference codes
  const preferenceMap: Record<string, string> = {
    'artist': 'voice_actor',
    'licensee': 'studio',
    'curious': 'curious',
    'voice_actor': 'voice_actor',
    'studio': 'studio',
    'developer': 'developer',
  };
  const normalizedPreference = preferenceMap[preference] || preference;

  // Store signup in KV (fast, non-blocking)
  const signupId = `SU-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  await c.env.KV_GABRIEL.put(`signup:${signupId}`, JSON.stringify({
    email: body.email,
    name: body.name ?? null,
    preference: normalizedPreference,
    signed_up_at: now,
    source: body.source ?? 'landing_page',
    variant: body.variant ?? 'unknown',
  }));

  // Log to ledger
  const eventId = `EVT-${crypto.randomUUID()}`;
  await c.env.DB_HVS.prepare(
    `INSERT INTO noizy_ledger (event_id, actor_id, event_type, payload_json,
     amount_cad, actor_share_cad, noizy_share_cad, union_share_cad, source_system, recorded_at)
     VALUES (?, 'SYSTEM', 'signup.created', ?, 0, 0, 0, 0, 'HEAVEN', ?)`
  ).bind(eventId, JSON.stringify({ email: body.email, name: body.name, preference: normalizedPreference, source: body.source }), now).run();

  return c.json({ signup_id: signupId, status: 'registered', name: body.name ?? null }, 201);
});

// ── Waitlist / Signup Stats ────────────────────────────────────────────

v1.get('/waitlist/stats', async (c) => {
  // Count signups from the ledger
  const result = await c.env.DB_HVS.prepare(
    `SELECT
       COUNT(*) as total_signups,
       SUM(CASE WHEN json_extract(payload_json, '$.preference') = 'voice_actor' THEN 1 ELSE 0 END) as artists,
       SUM(CASE WHEN json_extract(payload_json, '$.preference') = 'studio' THEN 1 ELSE 0 END) as studios,
       SUM(CASE WHEN json_extract(payload_json, '$.preference') = 'curious' THEN 1 ELSE 0 END) as curious,
       SUM(CASE WHEN json_extract(payload_json, '$.preference') = 'developer' THEN 1 ELSE 0 END) as developers,
       MIN(recorded_at) as first_signup,
       MAX(recorded_at) as latest_signup
     FROM noizy_ledger
     WHERE event_type = 'signup.created'`
  ).first();

  return c.json({
    waitlist: {
      total: result?.total_signups ?? 0,
      breakdown: {
        voice_actors: result?.artists ?? 0,
        studios: result?.studios ?? 0,
        curious: result?.curious ?? 0,
        developers: result?.developers ?? 0,
      },
      first_signup: result?.first_signup ?? null,
      latest_signup: result?.latest_signup ?? null,
    },
    timestamp: new Date().toISOString(),
  });
});

// ── System Stats (dashboard) ──────────────────────────────────────────

v1.get('/stats', async (c) => {
  const [actorCount, tokenCount, ledgerCount, clauseCount, waitlistCount] = await Promise.all([
    c.env.DB_HVS.prepare('SELECT COUNT(*) as count FROM hvs_actors').first<{ count: number }>(),
    c.env.DB_HVS.prepare('SELECT COUNT(*) as count FROM hvs_consent_tokens').first<{ count: number }>(),
    c.env.DB_HVS.prepare('SELECT COUNT(*) as count FROM noizy_ledger').first<{ count: number }>(),
    c.env.DB_HVS.prepare('SELECT COUNT(*) as count FROM hvs_never_clauses').first<{ count: number }>(),
    c.env.DB_HVS.prepare("SELECT COUNT(*) as count FROM noizy_ledger WHERE event_type = 'signup.created'").first<{ count: number }>(),
  ]);

  return c.json({
    stats: {
      actors: actorCount?.count ?? 0,
      consent_tokens: tokenCount?.count ?? 0,
      ledger_entries: ledgerCount?.count ?? 0,
      never_clauses: clauseCount?.count ?? 0,
      waitlist_signups: waitlistCount?.count ?? 0,
    },
    version: c.env.HEAVEN_VERSION,
    environment: c.env.ENVIRONMENT,
    timestamp: new Date().toISOString(),
  });
});

// ── A/B Variant Assignment ─────────────────────────────────────────────

v1.get('/variant', async (c) => {
  const variants = ['A', 'B', 'C'];

  // Check feature flag for forced variant
  const forced = await c.env.KV_FLAGS.get('hero_variant_override');
  if (forced) {
    return c.json({ variant: forced, source: 'override' });
  }

  // Random assignment
  const variant = variants[Math.floor(Math.random() * variants.length)];
  return c.json({ variant, source: 'random' });
});

// ── Mount v1 routes ────────────────────────────────────────────────────

app.route('/v1', v1);

// ── 404 catch-all ──────────────────────────────────────────────────────

app.notFound((c) => {
  return c.json(makeError(
    `Route not found. All HEAVEN endpoints are under /v1/.`,
    'NOT_FOUND', 404, c.env
  ), 404);
});

// ── Error handler ──────────────────────────────────────────────────────

app.onError((err, c) => {
  console.error('HEAVEN error:', err.message, err.stack);
  return c.json(makeError(
    'Internal server error',
    'INTERNAL_ERROR', 500, c.env
  ), 500);
});

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════

async function checkDb(db: D1Database): Promise<boolean> {
  try {
    await db.prepare('SELECT 1').first();
    return true;
  } catch {
    return false;
  }
}

async function checkKv(kv: KVNamespace): Promise<boolean> {
  try {
    await kv.get('__health_check__');
    return true;
  } catch {
    return false;
  }
}

function makeError(error: string, code: string, status: number, env: Env): ApiError {
  return {
    error,
    code,
    status,
    heaven_version: env.HEAVEN_VERSION,
    timestamp: new Date().toISOString(),
  };
}

export default app;
