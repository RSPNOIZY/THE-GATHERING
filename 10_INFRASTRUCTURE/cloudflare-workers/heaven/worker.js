/**
 * HEAVEN — NOIZY.AI edge API gateway
 *
 * Role: Front door for noizy.ai. Serves the apex HTML home page, a
 *       read-only JSON API over the GABRIEL brain (agent-memory D1),
 *       and the authenticated consent enforcement surface.
 *
 * Bindings required (wrangler.toml):
 *   env.AGENT_MEMORY   — D1 database (agent-memory)         [required]
 *   env.CONSENT_DB     — D1 database (consent_db)           [required for /api/consent/*, /api/synth/*]
 *   env.MANIFEST_DB    — D1 database (manifest_db)          [deploy manifests]
 *   env.CATALOGUE_DB   — D1 database (catalogue_db)         [AVA + asset catalogue]
 *   env.SIGNUPS        — KV namespace for email captures    [optional; gracefully degrades]
 *   env.VERDICT_KEYS   — KV namespace for rotating HMAC keys [required for signed tokens]
 *   env.VOICE_ARTIFACTS — R2 bucket for authorized audio    [required for artifact slots]
 *
 * Secrets:
 *   env.HEAVEN_SHARED_SECRET  — required in x-heaven-auth header on
 *                               every authenticated POST/GET endpoint
 *
 * Public surface (unauthenticated — intentionally narrow):
 *   GET  /                     → HTML home (NOIZY.AI apex)
 *   GET  /health               → JSON binding + DB health
 *   GET  /api/gospel           → All 12 Gospel principles
 *   GET  /api/gospel/:n        → Single principle by number
 *   GET  /api/doctrine         → All doctrine lines, grouped by category
 *   GET  /api/doctrine/:code   → Single doctrine line (e.g. HVS_001)
 *   GET  /api/agents           → Public agent roles (whitelisted columns only)
 *   GET  /api/empire           → Brand/domain map from noizy_empire
 *   POST /api/signup           → Email capture (if SIGNUPS KV bound)
 *   OPTIONS /*                 → CORS preflight
 *
 * Enforcement surface (authenticated via x-heaven-auth):
 *   GET  /api/consent/status?actor_id=RSP_001   → consent coverage summary
 *   POST /api/consent/check                     → verdict without writing
 *   POST /api/synth/request                     → verdict + audit + dual-write mirror
 *                                                 + HMAC-signed token
 *                                                 + R2 upload slot
 *   POST /api/verdict/verify                    → verify a signed token (any caller)
 *   POST /api/keys/rotate                       → rotate the HMAC signing key
 *   POST /api/r2/authorize-write                → verify an R2 write against a verdict token (dry-run)
 *   PUT  /api/r2/write?key=...                  → authorized streaming write to voice-artifacts bucket
 *   GET  /api/r2/manifest?actor_id=...          → list authorized artifacts for an actor
 *   DELETE /api/r2/object?key=...&actor_id=...  → revoke artifact (R2 delete + catalogue mark)
 *   POST /api/stream/session                    → issue a Cloudflare Stream live input (dormant until accounts consolidated)
 *
 * Internal tables are NOT exposed over HTTP:
 *   memcells, consent_log, lucy_observations, ops_accounts, ops_platforms,
 *   system_failures, gabriel_commands, dreed_registry, vox_talent_profiles.
 * Those remain server-side and will be reached through the NOIZY MCP instead.
 *
 * Author: Robert Stephen Plowman / MC96ECO / HEAVEN v0.5.0
 */

import { checkConsent, logConsentEvent, writeDeployManifest, voiceOfRefusal, NEVER_CLAUSES } from './src/consent-gate.js';
import { signVerdict, verifyVerdict, rotateKeys } from './src/verdict-signer.js';
import { issueArtifactSlot } from './src/artifact-gate.js';
import { mirrorToLegacy, legacyTableHealth } from './src/dual-write-bridge.js';
import { authorizeR2Write } from './src/r2-mediator.js';
import { issueStreamSession, streamReadiness } from './src/stream-gate.js';
import { writeAuthorizedArtifact, listArtifactsByActor, revokeArtifact } from './src/r2-writer.js';

// ── Constants ────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// ── Helpers ──────────────────────────────────────────────────
function json(data, init = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status: init.status || 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': init.cache || 'public, max-age=60',
      ...CORS,
      ...SECURITY_HEADERS,
    },
  });
}

function html(body, init = {}) {
  return new Response(body, {
    status: init.status || 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      ...SECURITY_HEADERS,
    },
  });
}

function errorJSON(message, status = 500) {
  return json({ ok: false, error: message, ts: new Date().toISOString() }, { status, cache: 'no-store' });
}

async function firstRow(db, sql, params = []) {
  const stmt = params.length ? db.prepare(sql).bind(...params) : db.prepare(sql);
  return (await stmt.first()) || null;
}

async function allRows(db, sql, params = []) {
  const stmt = params.length ? db.prepare(sql).bind(...params) : db.prepare(sql);
  const res = await stmt.all();
  return res.results || [];
}

// ── Auth helper for the enforcement surface ──────────────────
function authOK(request, env) {
  if (!env.HEAVEN_SHARED_SECRET) return false;
  return request.headers.get('x-heaven-auth') === env.HEAVEN_SHARED_SECRET;
}

async function safeCount(db, sql, params = []) {
  try {
    const r = await firstRow(db, sql, params);
    return r?.n ?? 0;
  } catch (_e) {
    return null; // null means "table or db not reachable" — distinct from 0
  }
}

// ── Routes ───────────────────────────────────────────────────
async function routeHealth(env) {
  const started = Date.now();
  const report = {
    ok: true,
    service: 'HEAVEN',
    role: 'NOIZY.AI edge API gateway',
    version: env.HEAVEN_VERSION || '0.5.0',
    never_clauses_version: env.NEVER_CLAUSES_VERSION || 'v3',
    never_clauses_count: NEVER_CLAUSES.length,
    contract_version: env.CONSENT_CONTRACT_VER || 'v3',
    dual_write_legacy: String(env.DUAL_WRITE_LEGACY ?? 'true').toLowerCase() === 'true',
    ts: new Date().toISOString(),
    bindings: {
      AGENT_MEMORY:         !!env.AGENT_MEMORY,
      CONSENT_DB:           !!env.CONSENT_DB,
      MANIFEST_DB:          !!env.MANIFEST_DB,
      CATALOGUE_DB:         !!env.CATALOGUE_DB,
      SIGNUPS:              !!env.SIGNUPS,
      VERDICT_KEYS:         !!env.VERDICT_KEYS,
      VOICE_ARTIFACTS:      !!env.VOICE_ARTIFACTS,
      HEAVEN_SHARED_SECRET: !!env.HEAVEN_SHARED_SECRET,
    },
    agent_memory: { connected: false, tables: 0, memcells: 0, gospel: 0, doctrine: 0 },
    consent_db:   { connected: false, subjects: null, records: null, events: null },
    manifest_db:  { connected: false, deploys: null },
    catalogue_db: { connected: false, voices: null },
    legacy_consent_log: { reachable: false },
    verdict_keys: { current: false, previous: false },
    latency_ms: 0,
  };

  if (env.AGENT_MEMORY) {
    try {
      const tables = await firstRow(
        env.AGENT_MEMORY,
        "SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '\\_cf_%' ESCAPE '\\';"
      );
      const memcells = await firstRow(env.AGENT_MEMORY, 'SELECT COUNT(*) AS n FROM memcells;');
      const gospel   = await firstRow(env.AGENT_MEMORY, 'SELECT COUNT(*) AS n FROM gospel_deal;');
      const doctrine = await firstRow(env.AGENT_MEMORY, 'SELECT COUNT(*) AS n FROM doctrine_lines;');
      report.agent_memory = {
        connected: true,
        tables: tables?.n ?? 0,
        memcells: memcells?.n ?? 0,
        gospel: gospel?.n ?? 0,
        doctrine: doctrine?.n ?? 0,
      };
    } catch (e) {
      report.ok = false;
      report.agent_memory.error = String(e?.message || e);
    }
  }

  if (env.CONSENT_DB) {
    report.consent_db.subjects = await safeCount(env.CONSENT_DB, 'SELECT COUNT(*) AS n FROM subjects;');
    report.consent_db.records  = await safeCount(env.CONSENT_DB, 'SELECT COUNT(*) AS n FROM consent_records;');
    report.consent_db.events   = await safeCount(env.CONSENT_DB, 'SELECT COUNT(*) AS n FROM consent_events;');
    report.consent_db.connected = report.consent_db.subjects !== null;
  }
  if (env.MANIFEST_DB) {
    report.manifest_db.deploys = await safeCount(env.MANIFEST_DB, 'SELECT COUNT(*) AS n FROM deploys;');
    report.manifest_db.connected = report.manifest_db.deploys !== null;
  }
  if (env.CATALOGUE_DB) {
    report.catalogue_db.voices = await safeCount(env.CATALOGUE_DB, 'SELECT COUNT(*) AS n FROM voices;');
    report.catalogue_db.connected = report.catalogue_db.voices !== null;
  }

  // Dual-write migration window: surface legacy table reachability.
  if (report.dual_write_legacy) {
    report.legacy_consent_log = await legacyTableHealth(env);
  }

  // Verdict key presence (do not leak key material; only kid booleans).
  if (env.VERDICT_KEYS) {
    try {
      const cur  = await env.VERDICT_KEYS.get('verdict:key:current',  { type: 'json' });
      const prev = await env.VERDICT_KEYS.get('verdict:key:previous', { type: 'json' });
      report.verdict_keys = {
        current:  !!cur,
        previous: !!prev,
        current_kid:  cur?.kid  || null,
        previous_kid: prev?.kid || null,
      };
    } catch (e) {
      report.verdict_keys.error = String(e?.message || e);
    }
  }

  // Stream readiness — dormant until accounts merged.
  report.stream = streamReadiness(env);

  report.latency_ms = Date.now() - started;
  return json(report, { cache: 'no-store' });
}

// ── Enforcement surface ──────────────────────────────────────
async function routeConsentStatus(request, env) {
  if (!authOK(request, env)) return errorJSON('Unauthorized', 401);
  if (!env.CONSENT_DB)       return errorJSON('CONSENT_DB binding missing', 503);
  const url = new URL(request.url);
  const actorId = url.searchParams.get('actor_id');
  if (!actorId) return errorJSON('actor_id query param required', 400);

  const subject = await firstRow(
    env.CONSENT_DB,
    'SELECT subject_id, actor_id, legal_name, status FROM subjects WHERE actor_id = ? LIMIT 1;',
    [actorId]
  );
  const records = await allRows(
    env.CONSENT_DB,
    `SELECT record_id, action, scope, status, contract_version, granted_at, expires_at
       FROM consent_records WHERE actor_id = ? ORDER BY granted_at DESC;`,
    [actorId]
  );
  const eventCount = await safeCount(
    env.CONSENT_DB,
    'SELECT COUNT(*) AS n FROM consent_events WHERE actor_id = ?;',
    [actorId]
  );

  return json({
    ok: true,
    actor_id: actorId,
    enrolled: !!subject,
    subject: subject || null,
    records,
    record_count: records.length,
    event_count: eventCount,
  }, { cache: 'no-store' });
}

async function routeConsentCheck(request, env) {
  if (!authOK(request, env)) return errorJSON('Unauthorized', 401);
  let body;
  try { body = await request.json(); } catch { return errorJSON('Invalid JSON body', 400); }

  const { actor_id, action, scope, requester_id } = body || {};
  const verdict = await checkConsent({
    env,
    actorId: actor_id,
    action,
    scope,
    requesterId: requester_id,
  });
  // /check is dry-run: NO write to consent_events. That's what /synth/request is for.
  return json({ ok: true, verdict }, { cache: 'no-store' });
}

async function routeSynthRequest(request, env) {
  if (!authOK(request, env)) return errorJSON('Unauthorized', 401);
  let body;
  try { body = await request.json(); } catch { return errorJSON('Invalid JSON body', 400); }

  const { actor_id, action = 'synth', scope, requester_id, filename } = body || {};
  const verdict = await checkConsent({
    env,
    actorId: actor_id,
    action,
    scope,
    requesterId: requester_id,
  });

  // Always log — allowed OR denied. Audit is the product.
  const audit = await logConsentEvent({
    env,
    actorId: actor_id,
    action,
    scope,
    requesterId: requester_id,
    verdict,
  });

  // Mirror to legacy consent_log during migration window.
  const mirror = await mirrorToLegacy({ env, actorId: actor_id, action, verdict });

  if (!verdict.allowed) {
    return json({ ok: false, verdict, audit, mirror }, { status: 403, cache: 'no-store' });
  }

  // ── Sign the verdict and issue an R2 upload slot ────────────────
  let signed = null;
  try {
    const ttl = parseInt(env.VERDICT_TTL_SECONDS || '600', 10);
    signed = await signVerdict({
      env,
      verdict,
      actorId: actor_id,
      action,
      scope,
      ttlSeconds: isFinite(ttl) ? ttl : 600,
    });
  } catch (e) {
    // If signing fails (no key yet, KV unbound), we still return the
    // verdict — but we flag that no cryptographic trust is attached
    // so downstream must refuse to act.
    signed = { error: String(e?.message || e) };
  }

  const slot = await issueArtifactSlot({
    env,
    verdict,
    actorId: actor_id,
    action,
    scope,
    filename: filename || 'out.wav',
  });

  return json({
    ok: true,
    verdict,
    audit,
    mirror,
    authorization: {
      token: signed?.token || null,
      kid: signed?.kid || null,
      exp: signed?.exp || null,
      signing_error: signed?.error || null,
      note: signed?.token
        ? 'Present this token as x-heaven-verdict to NOIZYVOX. Downstream MUST call /api/verdict/verify before synthesizing.'
        : 'No signed token issued. Downstream MUST refuse to synthesize until signing is configured.',
    },
    artifact_slot: slot,
  }, { cache: 'no-store' });
}

// ── Verdict verification (callable by downstream services) ──
async function routeVerdictVerify(request, env) {
  if (!authOK(request, env)) return errorJSON('Unauthorized', 401);
  let body;
  try { body = await request.json(); } catch { return errorJSON('Invalid JSON body', 400); }
  const token = body?.token;
  if (!token) return errorJSON('token required', 400);
  const result = await verifyVerdict({ env, token });
  return json({ ok: true, ...result }, { cache: 'no-store' });
}

// ── R2 active write path + manifest + revoke ───────────────
async function routeR2Write(request, env) {
  if (!authOK(request, env)) return errorJSON('Unauthorized', 401);
  const token = request.headers.get('x-heaven-verdict');
  if (!token) return errorJSON('x-heaven-verdict header required', 400);

  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  if (!key) return errorJSON('key query param required', 400);

  const cl = request.headers.get('content-length');
  const declaredSize = cl ? parseInt(cl, 10) : null;
  if (!declaredSize || !Number.isFinite(declaredSize) || declaredSize <= 0) {
    return errorJSON('Content-Length required and must be a positive integer', 411);
  }

  const contentType = request.headers.get('content-type') || '';

  const result = await writeAuthorizedArtifact({
    env, request, token, key, declaredSize, contentType,
  });
  return json(result, { status: result.status || (result.ok ? 201 : 500), cache: 'no-store' });
}

async function routeR2Manifest(request, env) {
  if (!authOK(request, env)) return errorJSON('Unauthorized', 401);
  const url = new URL(request.url);
  const actorId   = url.searchParams.get('actor_id');
  const verdictId = url.searchParams.get('verdict_id') || undefined;
  const limit     = url.searchParams.get('limit') || '50';
  if (!actorId) return errorJSON('actor_id query param required', 400);
  const result = await listArtifactsByActor({ env, actorId, verdictId, limit });
  return json(result, { cache: 'no-store' });
}

async function routeR2Delete(request, env) {
  if (!authOK(request, env)) return errorJSON('Unauthorized', 401);
  const url = new URL(request.url);
  const key     = url.searchParams.get('key');
  const actorId = url.searchParams.get('actor_id');
  if (!key)     return errorJSON('key query param required', 400);
  if (!actorId) return errorJSON('actor_id query param required', 400);
  const result = await revokeArtifact({ env, key, actorId });
  return json(result, { status: result.status || (result.ok ? 200 : 500), cache: 'no-store' });
}

// ── R2 write mediator (dry-run; enforcement without consuming body) ───
async function routeR2AuthorizeWrite(request, env) {
  if (!authOK(request, env)) return errorJSON('Unauthorized', 401);
  let body;
  try { body = await request.json(); } catch { return errorJSON('Invalid JSON body', 400); }
  const { token, key, size_bytes } = body || {};
  if (!token) return errorJSON('token required', 400);
  if (!key)   return errorJSON('key required', 400);
  const result = await authorizeR2Write({
    env,
    token,
    key,
    sizeBytes: typeof size_bytes === 'number' ? size_bytes : undefined,
  });
  const status = result.allowed ? 200 : 403;
  return json({ ok: true, ...result }, { status, cache: 'no-store' });
}

// ── Stream session (live input — dormant until accounts merged) ──
async function routeStreamSession(request, env) {
  if (!authOK(request, env)) return errorJSON('Unauthorized', 401);
  let body;
  try { body = await request.json(); } catch { return errorJSON('Invalid JSON body', 400); }

  const { actor_id, scope, mode = 'hls', requester_id, label } = body || {};

  // Same consent flow as /api/synth/request but action is 'stream'.
  const verdict = await checkConsent({
    env,
    actorId: actor_id,
    action: 'stream',
    scope,
    requesterId: requester_id,
  });
  const audit  = await logConsentEvent({ env, actorId: actor_id, action: 'stream', scope, requesterId: requester_id, verdict });
  const mirror = await mirrorToLegacy({ env, actorId: actor_id, action: 'stream', verdict });

  if (!verdict.allowed) {
    return json({ ok: false, verdict, audit, mirror }, { status: 403, cache: 'no-store' });
  }

  // Sign the verdict (same cryptographic trust as synth).
  let signed = null;
  try {
    const ttl = parseInt(env.VERDICT_TTL_SECONDS || '600', 10);
    signed = await signVerdict({
      env, verdict,
      actorId: actor_id,
      action: 'stream',
      scope,
      ttlSeconds: isFinite(ttl) ? ttl : 600,
    });
  } catch (e) {
    signed = { error: String(e?.message || e) };
  }

  // Issue (or dormantly refuse) the Stream live input.
  const session = await issueStreamSession({
    env, verdict,
    actorId: actor_id,
    scope,
    mode,
    label,
  });

  return json({
    ok: true,
    verdict,
    audit,
    mirror,
    authorization: {
      token: signed?.token || null,
      kid: signed?.kid || null,
      exp: signed?.exp || null,
      signing_error: signed?.error || null,
    },
    stream: session,
  }, { cache: 'no-store' });
}

// ── Key rotation (admin) ───────────────────────────────────
async function routeKeysRotate(request, env) {
  if (!authOK(request, env)) return errorJSON('Unauthorized', 401);
  if (!env.VERDICT_KEYS) return errorJSON('VERDICT_KEYS KV binding missing', 503);
  try {
    const result = await rotateKeys(env);
    // Optional: record a rotation row in manifest_db.deploys as a pseudo-deploy
    if (env.MANIFEST_DB) {
      try {
        await env.MANIFEST_DB
          .prepare(`
            INSERT OR IGNORE INTO deploys
              (deploy_id, service, version, never_clauses_version, contract_version, deployed_at)
            VALUES (?, 'heaven-key-rotation', ?, ?, ?, datetime('now'));
          `)
          .bind(
            `rotate-${result.new_kid}`,
            result.new_kid,
            env.NEVER_CLAUSES_VERSION || 'v3',
            env.CONSENT_CONTRACT_VER || 'v3',
          )
          .run();
      } catch (_e) { /* non-blocking */ }
    }
    return json({ ok: true, ...result }, { cache: 'no-store' });
  } catch (e) {
    return errorJSON(String(e?.message || e), 500);
  }
}

async function routeGospelAll(env) {
  if (!env.AGENT_MEMORY) return errorJSON('AGENT_MEMORY binding missing', 503);
  const rows = await allRows(
    env.AGENT_MEMORY,
    'SELECT principle_number AS n, title, body, ratified_at FROM gospel_deal ORDER BY principle_number ASC;'
  );
  return json({ ok: true, count: rows.length, principles: rows, source: 'gospel_deal' });
}

async function routeGospelOne(env, numParam) {
  if (!env.AGENT_MEMORY) return errorJSON('AGENT_MEMORY binding missing', 503);
  const n = parseInt(numParam, 10);
  if (!Number.isFinite(n) || n < 1) return errorJSON('Invalid principle number', 400);
  const row = await firstRow(
    env.AGENT_MEMORY,
    'SELECT principle_number AS n, title, body, ratified_at FROM gospel_deal WHERE principle_number = ?;',
    [n]
  );
  if (!row) return errorJSON('Principle not found', 404);
  return json({ ok: true, principle: row });
}

async function routeDoctrineAll(env) {
  if (!env.AGENT_MEMORY) return errorJSON('AGENT_MEMORY binding missing', 503);
  const rows = await allRows(
    env.AGENT_MEMORY,
    'SELECT code, title, body, category FROM doctrine_lines ORDER BY code ASC;'
  );
  const grouped = {};
  for (const r of rows) {
    const cat = r.category || 'uncategorized';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(r);
  }
  return json({ ok: true, count: rows.length, categories: Object.keys(grouped).sort(), by_category: grouped });
}

async function routeDoctrineOne(env, code) {
  if (!env.AGENT_MEMORY) return errorJSON('AGENT_MEMORY binding missing', 503);
  if (!/^[A-Z][A-Z0-9_]{1,30}$/.test(code)) return errorJSON('Invalid doctrine code', 400);
  const row = await firstRow(
    env.AGENT_MEMORY,
    'SELECT code, title, body, category FROM doctrine_lines WHERE code = ?;',
    [code]
  );
  if (!row) return errorJSON('Doctrine line not found', 404);
  return json({ ok: true, doctrine: row });
}

async function routeAgents(env) {
  if (!env.AGENT_MEMORY) return errorJSON('AGENT_MEMORY binding missing', 503);
  // Whitelist of columns returned publicly. Persona stays internal.
  const rows = await allRows(
    env.AGENT_MEMORY,
    "SELECT agent_id, agent_name, role, status FROM agent_registry WHERE status = 'active' ORDER BY agent_name ASC;"
  );
  return json({ ok: true, count: rows.length, agents: rows });
}

async function routeEmpire(env) {
  if (!env.AGENT_MEMORY) return errorJSON('AGENT_MEMORY binding missing', 503);
  const rows = await allRows(
    env.AGENT_MEMORY,
    "SELECT brand, domain, status FROM noizy_empire WHERE status = 'active' ORDER BY brand ASC;"
  );
  return json({ ok: true, count: rows.length, empire: rows });
}

async function routeSignup(request, env) {
  try {
    const body = await request.json();
    const email = (body?.email || '').trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return errorJSON('Invalid email', 400);
    }
    if (!env.SIGNUPS) {
      // Gracefully degrade — acknowledge without persisting.
      return json({ ok: true, persisted: false, note: 'SIGNUPS KV not bound; acknowledged only' });
    }
    const key = `signup:${email}`;
    const existing = await env.SIGNUPS.get(key);
    if (existing) {
      return json({ ok: true, persisted: true, duplicate: true });
    }
    await env.SIGNUPS.put(
      key,
      JSON.stringify({
        email,
        signed_up_at: new Date().toISOString(),
        source: 'noizy.ai',
        ip: request.headers.get('CF-Connecting-IP') || 'unknown',
        country: request.headers.get('CF-IPCountry') || 'unknown',
      })
    );
    return json({ ok: true, persisted: true, duplicate: false });
  } catch (_e) {
    return errorJSON('Bad request body', 400);
  }
}

// ── Home page (HTML) ─────────────────────────────────────────
async function routeHome(env) {
  let principle = null;
  let empireCount = 0;
  let gospelCount = 0;
  if (env.AGENT_MEMORY) {
    try {
      principle = await firstRow(
        env.AGENT_MEMORY,
        'SELECT principle_number AS n, title, body FROM gospel_deal WHERE principle_number = 1;'
      );
      const [e, g] = await Promise.all([
        firstRow(env.AGENT_MEMORY, "SELECT COUNT(*) AS n FROM noizy_empire WHERE status = 'active';"),
        firstRow(env.AGENT_MEMORY, 'SELECT COUNT(*) AS n FROM gospel_deal;'),
      ]);
      empireCount = e?.n ?? 0;
      gospelCount = g?.n ?? 0;
    } catch (_e) {
      // fall through — homepage still renders
    }
  }
  const p1 = principle || { n: 1, title: 'Human Voice Sovereignty', body: 'Every human voice is sovereign territory.' };
  const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  return html(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NOIZY.AI</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;600;700&family=IBM+Plex+Mono:wght@300;500&display=swap" rel="stylesheet">
<style>
:root { --deep:#0A0E17; --panel:#151D2E; --gold:#D4A017; --white:#F1F5F9; --silver:#94A3B8; --mgray:#4A5568; --signal:#00D4FF; --restore:#00FFB3; }
* { margin:0; padding:0; box-sizing:border-box; }
body { background:var(--deep); color:var(--white); font-family:'Cormorant Garamond',Georgia,serif; line-height:1.6; min-height:100vh; display:flex; flex-direction:column; }
body::after { content:''; position:fixed; inset:0; z-index:9999; pointer-events:none; background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.03) 2px,rgba(0,0,0,0.03) 4px); }
header { padding:32px 40px; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px; }
.logo { font-size:22px; font-weight:700; letter-spacing:0.2em; }
.logo span { color:var(--gold); }
.status { font-family:'IBM Plex Mono',monospace; font-size:10px; letter-spacing:0.2em; color:var(--restore); text-transform:uppercase; }
.status-dot { display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--restore); margin-right:8px; box-shadow:0 0 8px var(--restore); animation:pulse 2.4s ease-in-out infinite; }
@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
main { flex:1; max-width:880px; margin:0 auto; padding:64px 40px; }
.eyebrow { font-family:'IBM Plex Mono',monospace; font-size:11px; letter-spacing:0.3em; text-transform:uppercase; color:var(--gold); margin-bottom:16px; }
h1 { font-size:64px; font-weight:300; line-height:1.1; letter-spacing:-0.01em; margin-bottom:24px; }
.lede { font-size:22px; color:var(--silver); line-height:1.55; max-width:640px; margin-bottom:56px; }
.principle { background:var(--panel); border:1px solid rgba(255,255,255,0.06); border-left:3px solid var(--gold); border-radius:6px; padding:32px; margin-bottom:40px; }
.principle-label { font-family:'IBM Plex Mono',monospace; font-size:10px; letter-spacing:0.25em; text-transform:uppercase; color:var(--gold); margin-bottom:12px; }
.principle h2 { font-size:28px; font-weight:600; margin-bottom:12px; }
.principle p { font-size:17px; color:var(--white); }
.stats { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:48px; }
.stat { background:var(--panel); border:1px solid rgba(255,255,255,0.06); border-radius:6px; padding:20px; text-align:center; }
.stat-val { font-size:36px; font-weight:700; color:var(--gold); line-height:1; }
.stat-label { font-family:'IBM Plex Mono',monospace; font-size:9px; letter-spacing:0.25em; text-transform:uppercase; color:var(--silver); margin-top:8px; }
.endpoints { background:rgba(0,0,0,0.25); border:1px solid rgba(255,255,255,0.06); border-radius:6px; padding:24px 28px; }
.endpoints h3 { font-family:'IBM Plex Mono',monospace; font-size:11px; letter-spacing:0.25em; text-transform:uppercase; color:var(--signal); margin-bottom:14px; }
.endpoints ul { list-style:none; font-family:'IBM Plex Mono',monospace; font-size:13px; }
.endpoints li { padding:5px 0; color:var(--silver); }
.endpoints a { color:var(--signal); text-decoration:none; }
.endpoints a:hover { color:var(--gold); text-decoration:underline; }
footer { padding:28px 40px; border-top:1px solid rgba(255,255,255,0.06); font-family:'IBM Plex Mono',monospace; font-size:10px; letter-spacing:0.2em; color:var(--mgray); text-transform:uppercase; display:flex; justify-content:space-between; flex-wrap:wrap; gap:12px; }
</style>
</head>
<body>
<header>
  <div class="logo">NOIZY<span>.AI</span></div>
  <div class="status"><span class="status-dot"></span>HEAVEN · online · edge</div>
</header>
<main>
  <div class="eyebrow">Infrastructure is Policy</div>
  <h1>The system enforces the ethics.</h1>
  <p class="lede">
    NOIZY is a human-voice sovereignty company. We do not ask for permission to protect creators &mdash; we build the systems that do it automatically. What you see here is the front door to that architecture.
  </p>

  <div class="principle">
    <div class="principle-label">Principle ${esc(p1.n)} · Gospel Deal</div>
    <h2>${esc(p1.title)}</h2>
    <p>${esc(p1.body)}</p>
  </div>

  <div class="stats">
    <div class="stat"><div class="stat-val">${esc(gospelCount)}</div><div class="stat-label">Principles</div></div>
    <div class="stat"><div class="stat-val">${esc(empireCount)}</div><div class="stat-label">Empire Nodes</div></div>
    <div class="stat"><div class="stat-val">100</div><div class="stat-label">Year Voice Estate</div></div>
  </div>

  <div class="endpoints">
    <h3>Public API</h3>
    <ul>
      <li><a href="/health">GET /health</a> &mdash; binding + DB status</li>
      <li><a href="/api/gospel">GET /api/gospel</a> &mdash; the 12 principles</li>
      <li><a href="/api/gospel/1">GET /api/gospel/:n</a> &mdash; single principle</li>
      <li><a href="/api/doctrine">GET /api/doctrine</a> &mdash; full doctrine, grouped</li>
      <li><a href="/api/doctrine/HVS_001">GET /api/doctrine/:code</a> &mdash; single line</li>
      <li><a href="/api/agents">GET /api/agents</a> &mdash; active agents (public roles)</li>
      <li><a href="/api/empire">GET /api/empire</a> &mdash; brand map</li>
    </ul>
  </div>
</main>
<footer>
  <span>&copy; Robert Stephen Plowman &middot; NOIZYFISH INC &middot; Ottawa</span>
  <span>All brand autonomy bounded by NOIZY.AI &middot; audited through GABRIEL</span>
</footer>
</body>
</html>`);
}

// ── Router ───────────────────────────────────────────────────
async function handle(request, env, ctx) {
  const url = new URL(request.url);
  const { pathname } = url;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...CORS,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-heaven-auth, x-heaven-verdict',
        ...SECURITY_HEADERS,
      },
    });
  }

  // GET — public read surface + consent status read + artifact manifest.
  if (request.method === 'GET') {
    if (pathname === '/' || pathname === '/index.html') return routeHome(env);
    if (pathname === '/health')                         return routeHealth(env);
    if (pathname === '/api/gospel')                     return routeGospelAll(env);
    if (pathname === '/api/doctrine')                   return routeDoctrineAll(env);
    if (pathname === '/api/agents')                     return routeAgents(env);
    if (pathname === '/api/empire')                     return routeEmpire(env);
    if (pathname === '/api/consent/status')             return routeConsentStatus(request, env);
    if (pathname === '/api/r2/manifest')                return routeR2Manifest(request, env);

    const gospelN = pathname.match(/^\/api\/gospel\/([0-9]+)$/);
    if (gospelN) return routeGospelOne(env, gospelN[1]);

    const doctrineCode = pathname.match(/^\/api\/doctrine\/([A-Za-z0-9_]+)$/);
    if (doctrineCode) return routeDoctrineOne(env, doctrineCode[1].toUpperCase());
  }

  // PUT — the active write path for authorized audio artifacts.
  if (request.method === 'PUT') {
    if (pathname === '/api/r2/write') return routeR2Write(request, env);
  }

  // DELETE — revoke an artifact (R2 delete + catalogue mark).
  if (request.method === 'DELETE') {
    if (pathname === '/api/r2/object') return routeR2Delete(request, env);
  }

  // POST — capture, check, enforce, sign, rotate.
  if (request.method === 'POST') {
    if (pathname === '/api/signup')         return routeSignup(request, env);
    if (pathname === '/api/consent/check')  return routeConsentCheck(request, env);
    if (pathname === '/api/synth/request')  return routeSynthRequest(request, env);
    if (pathname === '/api/verdict/verify')      return routeVerdictVerify(request, env);
    if (pathname === '/api/keys/rotate')         return routeKeysRotate(request, env);
    if (pathname === '/api/r2/authorize-write')  return routeR2AuthorizeWrite(request, env);
    if (pathname === '/api/stream/session')      return routeStreamSession(request, env);
  }

  return errorJSON('Not found', 404);
}

// Tracks whether we've recorded this isolate's deploy manifest row yet.
// One isolate = one row (INSERT OR IGNORE in manifest_db).
let DEPLOY_MANIFEST_WRITTEN = false;

export default {
  async fetch(request, env, ctx) {
    try {
      // Fire-and-forget: record this version's deploy row once per isolate.
      if (!DEPLOY_MANIFEST_WRITTEN && env.MANIFEST_DB && ctx?.waitUntil) {
        DEPLOY_MANIFEST_WRITTEN = true;
        const deployId = `heaven-${env.HEAVEN_VERSION || '0.2.0'}-${Date.now()}`;
        ctx.waitUntil(writeDeployManifest(env, deployId));
      }
      return await handle(request, env, ctx);
    } catch (e) {
      // Never leak stack traces.
      return errorJSON('Internal error', 500);
    }
  },
};
