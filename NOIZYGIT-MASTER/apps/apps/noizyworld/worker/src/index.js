/**
 * NOIZYWORLD — Day-to-day task & delegation edge worker
 *
 * The operating table between RSP and the 9-agent AI fleet.
 * - Tasks, delegations, status transitions — all D1-backed
 * - Append-only event outbox mirrored to HEAVEN ledger
 * - Scoped API keys per agent + RSP master key
 *
 * Auth:   X-NOIZY-Key: <bearer token>
 * Errors: { error: string, code: string } with HTTP 4xx/5xx
 * OK:     { ok: true, data?: ... }
 *
 * Runtime: Cloudflare Workers
 */

const AGENT_IDS = ['rsp','claude','gabriel','lucy','shirl','dream','pops','engr_keith','cb01','heaven'];
const VALID_STATUSES = ['inbox','triaged','assigned','doing','blocked','review','done','cancelled'];
const VALID_PRIORITIES = ['urgent','high','normal','low','idle'];
const MAX_DELEGATION_DEPTH = 5;

// ─── Entry ──────────────────────────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname, searchParams } = url;

    if (request.method === 'OPTIONS') return cors();

    try {
      // Public routes
      if (pathname === '/' || pathname === '/health') return json(await health(env));
      if (pathname === '/robots.txt') return new Response('User-agent: *\nDisallow: /api/\n', { headers: { 'Content-Type': 'text/plain' } });

      // Auth-gated below
      if (!pathname.startsWith('/api/')) return json({ error: 'Not found', code: 'NOT_FOUND' }, 404);

      const auth = await authenticate(request, env);
      if (!auth.ok) return json({ error: auth.reason, code: 'UNAUTHORIZED' }, 401);
      const actor = auth.agent_id;

      // Agent introspection
      if (pathname === '/api/whoami') return json({ ok: true, data: { agent: actor, scopes: auth.scopes } });
      if (pathname === '/api/agents' && request.method === 'GET') return json({ ok: true, data: await listAgents(env) });

      // Tasks
      if (pathname === '/api/tasks' && request.method === 'GET')  return json({ ok: true, data: await listTasks(env, searchParams) });
      if (pathname === '/api/tasks' && request.method === 'POST') return json({ ok: true, data: await createTask(env, request, actor) }, 201);

      const taskMatch = pathname.match(/^\/api\/tasks\/([A-Za-z0-9_-]+)$/);
      if (taskMatch) {
        const id = taskMatch[1];
        if (request.method === 'GET')    return json({ ok: true, data: await getTask(env, id) });
        if (request.method === 'PATCH')  return json({ ok: true, data: await patchTask(env, id, request, actor) });
        if (request.method === 'DELETE') return json({ ok: true, data: await softDeleteTask(env, id, actor) });
      }

      const delegateMatch = pathname.match(/^\/api\/tasks\/([A-Za-z0-9_-]+)\/delegate$/);
      if (delegateMatch && request.method === 'POST') {
        return json({ ok: true, data: await delegateTask(env, delegateMatch[1], request, actor) });
      }

      const commentMatch = pathname.match(/^\/api\/tasks\/([A-Za-z0-9_-]+)\/comments$/);
      if (commentMatch) {
        if (request.method === 'GET')  return json({ ok: true, data: await listComments(env, commentMatch[1]) });
        if (request.method === 'POST') return json({ ok: true, data: await addComment(env, commentMatch[1], request, actor) }, 201);
      }

      // Ledger introspection (RSP-only)
      if (pathname === '/api/ledger' && request.method === 'GET') {
        if (actor !== 'rsp') return json({ error: 'Ledger is RSP-only', code: 'FORBIDDEN' }, 403);
        return json({ ok: true, data: await listLedger(env, searchParams) });
      }

      return json({ error: 'Not found', code: 'NOT_FOUND' }, 404);
    } catch (err) {
      console.error('noizyworld error:', err);
      return json({ error: 'Internal error', code: 'INTERNAL', message: err?.message }, 500);
    }
  },
};

// ─── Auth ────────────────────────────────────────────────────────────────
async function authenticate(request, env) {
  const key = request.headers.get('X-NOIZY-Key');
  if (!key) return { ok: false, reason: 'Missing X-NOIZY-Key header' };
  const hash = await sha256(key);
  const row = await env.NW_DB.prepare(
    'SELECT agent_id, scopes FROM nw_api_keys WHERE key_hash = ? AND revoked_at IS NULL'
  ).bind(hash).first();
  if (!row) return { ok: false, reason: 'Invalid or revoked key' };
  await env.NW_DB.prepare('UPDATE nw_api_keys SET last_used_at = datetime("now") WHERE key_hash = ?').bind(hash).run();
  return { ok: true, agent_id: row.agent_id, scopes: JSON.parse(row.scopes || '["read","write"]') };
}

async function sha256(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Handlers ────────────────────────────────────────────────────────────
async function health(env) {
  const out = { service: 'noizyworld', status: 'healthy', version: '0.1.0', timestamp: new Date().toISOString() };
  try { await env.NW_DB.prepare('SELECT 1').first(); out.d1 = 'connected'; } catch { out.d1 = 'disconnected'; }
  try { await env.NWORLD_KV?.get('__hc'); out.kv = 'connected'; } catch { out.kv = 'disconnected'; }
  try {
    const r = await env.NW_DB.prepare('SELECT COUNT(*) AS n FROM nw_tasks WHERE deleted_at IS NULL').first();
    out.open_tasks = r?.n ?? 0;
  } catch { out.open_tasks = null; }
  return out;
}

async function listAgents(env) {
  const { results } = await env.NW_DB.prepare(
    'SELECT id, display_name, kind, role, email, active FROM nw_agents WHERE active = 1 ORDER BY kind, id'
  ).all();
  return results;
}

async function listTasks(env, params) {
  const status = params.get('status');
  const assigned_to = params.get('assigned_to');
  const project_id = params.get('project_id');
  const limit = Math.min(parseInt(params.get('limit') || '100'), 500);

  const clauses = ['deleted_at IS NULL'];
  const binds = [];
  if (status) { clauses.push('status = ?'); binds.push(status); }
  if (assigned_to) { clauses.push('assigned_to = ?'); binds.push(assigned_to); }
  if (project_id) { clauses.push('project_id = ?'); binds.push(project_id); }

  const sql = `SELECT * FROM nw_tasks WHERE ${clauses.join(' AND ')} ORDER BY
    CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 WHEN 'low' THEN 3 ELSE 4 END,
    COALESCE(due_at, scheduled_for, created_at) ASC
    LIMIT ?`;
  binds.push(limit);
  const { results } = await env.NW_DB.prepare(sql).bind(...binds).all();
  return results;
}

async function getTask(env, id) {
  const task = await env.NW_DB.prepare('SELECT * FROM nw_tasks WHERE id = ? AND deleted_at IS NULL').bind(id).first();
  if (!task) throw httpError(404, 'Task not found', 'NOT_FOUND');
  const { results: history } = await env.NW_DB.prepare(
    'SELECT * FROM nw_status_history WHERE task_id = ? ORDER BY changed_at ASC'
  ).bind(id).all();
  const { results: delegations } = await env.NW_DB.prepare(
    'SELECT * FROM nw_delegations WHERE task_id = ? ORDER BY created_at ASC'
  ).bind(id).all();
  return { ...task, history, delegations };
}

async function createTask(env, request, actor) {
  const body = await request.json().catch(() => ({}));
  if (!body.title) throw httpError(400, 'title is required', 'INVALID');
  if (body.priority && !VALID_PRIORITIES.includes(body.priority)) throw httpError(400, 'invalid priority', 'INVALID');

  const id = crypto.randomUUID();
  const assigned = body.assigned_to || null;
  if (assigned && !AGENT_IDS.includes(assigned)) throw httpError(400, 'invalid assigned_to agent', 'INVALID');

  await env.NW_DB.prepare(
    `INSERT INTO nw_tasks (id, title, body, status, priority, labels, project_id, parent_id, assigned_to, created_by, scheduled_for, due_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    body.title,
    body.body || null,
    assigned ? 'assigned' : 'inbox',
    body.priority || 'normal',
    JSON.stringify(body.labels || []),
    body.project_id || null,
    body.parent_id || null,
    assigned,
    actor,
    body.scheduled_for || null,
    body.due_at || null
  ).run();

  await recordStatusChange(env, id, null, assigned ? 'assigned' : 'inbox', actor, 'Created');
  await enqueueLedger(env, 'task.created', id, actor, { title: body.title, assigned_to: assigned });
  return getTask(env, id);
}

async function patchTask(env, id, request, actor) {
  const body = await request.json().catch(() => ({}));
  const task = await env.NW_DB.prepare('SELECT * FROM nw_tasks WHERE id = ? AND deleted_at IS NULL').bind(id).first();
  if (!task) throw httpError(404, 'Task not found', 'NOT_FOUND');

  const updates = [];
  const binds = [];
  if (body.title !== undefined) { updates.push('title = ?'); binds.push(body.title); }
  if (body.body !== undefined)  { updates.push('body = ?');  binds.push(body.body); }
  if (body.priority !== undefined) {
    if (!VALID_PRIORITIES.includes(body.priority)) throw httpError(400, 'invalid priority', 'INVALID');
    updates.push('priority = ?'); binds.push(body.priority);
  }
  if (body.labels !== undefined) { updates.push('labels = ?'); binds.push(JSON.stringify(body.labels)); }
  if (body.scheduled_for !== undefined) { updates.push('scheduled_for = ?'); binds.push(body.scheduled_for); }
  if (body.due_at !== undefined) { updates.push('due_at = ?'); binds.push(body.due_at); }

  let statusChanged = null;
  if (body.status !== undefined && body.status !== task.status) {
    if (!VALID_STATUSES.includes(body.status)) throw httpError(400, 'invalid status', 'INVALID');
    updates.push('status = ?'); binds.push(body.status);
    if (body.status === 'doing' && !task.started_at) { updates.push('started_at = datetime("now")'); }
    if (body.status === 'done' || body.status === 'cancelled') { updates.push('completed_at = datetime("now")'); }
    statusChanged = { from: task.status, to: body.status };
  }

  if (!updates.length) return getTask(env, id);
  updates.push('updated_at = datetime("now")');
  binds.push(id);
  await env.NW_DB.prepare(`UPDATE nw_tasks SET ${updates.join(', ')} WHERE id = ?`).bind(...binds).run();

  if (statusChanged) {
    await recordStatusChange(env, id, statusChanged.from, statusChanged.to, actor, body.note || null);
    await enqueueLedger(env, 'task.status', id, actor, statusChanged);
  }
  return getTask(env, id);
}

async function softDeleteTask(env, id, actor) {
  await env.NW_DB.prepare('UPDATE nw_tasks SET deleted_at = datetime("now"), updated_at = datetime("now") WHERE id = ?').bind(id).run();
  await enqueueLedger(env, 'task.deleted', id, actor, {});
  return { id, deleted: true };
}

async function delegateTask(env, id, request, actor) {
  const body = await request.json().catch(() => ({}));
  if (!body.to) throw httpError(400, 'to (agent_id) is required', 'INVALID');
  if (!AGENT_IDS.includes(body.to)) throw httpError(400, 'invalid target agent', 'INVALID');

  const task = await env.NW_DB.prepare('SELECT * FROM nw_tasks WHERE id = ? AND deleted_at IS NULL').bind(id).first();
  if (!task) throw httpError(404, 'Task not found', 'NOT_FOUND');

  const depth = await env.NW_DB.prepare('SELECT COUNT(*) AS n FROM nw_delegations WHERE task_id = ?').bind(id).first();
  if ((depth?.n ?? 0) >= MAX_DELEGATION_DEPTH) throw httpError(400, 'max delegation depth reached', 'TOO_DEEP');

  await env.NW_DB.prepare(
    'INSERT INTO nw_delegations (task_id, from_agent, to_agent, reason) VALUES (?, ?, ?, ?)'
  ).bind(id, actor, body.to, body.reason || null).run();

  await env.NW_DB.prepare(
    'UPDATE nw_tasks SET assigned_to = ?, status = CASE WHEN status = "inbox" THEN "assigned" ELSE status END, updated_at = datetime("now") WHERE id = ?'
  ).bind(body.to, id).run();

  await recordStatusChange(env, id, task.status, task.status === 'inbox' ? 'assigned' : task.status, actor, `delegated to ${body.to}`);
  await enqueueLedger(env, 'task.delegated', id, actor, { to: body.to, reason: body.reason });
  return getTask(env, id);
}

async function listComments(env, taskId) {
  const { results } = await env.NW_DB.prepare(
    'SELECT * FROM nw_comments WHERE task_id = ? ORDER BY created_at ASC'
  ).bind(taskId).all();
  return results;
}

async function addComment(env, taskId, request, actor) {
  const body = await request.json().catch(() => ({}));
  if (!body.body) throw httpError(400, 'body is required', 'INVALID');
  const r = await env.NW_DB.prepare(
    'INSERT INTO nw_comments (task_id, author_id, body, attachments) VALUES (?, ?, ?, ?) RETURNING *'
  ).bind(taskId, actor, body.body, JSON.stringify(body.attachments || [])).first();
  await enqueueLedger(env, 'task.comment', taskId, actor, { comment_id: r.id });
  return r;
}

async function listLedger(env, params) {
  const limit = Math.min(parseInt(params.get('limit') || '100'), 1000);
  const { results } = await env.NW_DB.prepare(
    'SELECT * FROM nw_ledger_outbox ORDER BY id DESC LIMIT ?'
  ).bind(limit).all();
  return results;
}

// ─── Helpers ─────────────────────────────────────────────────────────────
async function recordStatusChange(env, taskId, from, to, actor, note) {
  await env.NW_DB.prepare(
    'INSERT INTO nw_status_history (task_id, from_status, to_status, changed_by, note) VALUES (?, ?, ?, ?, ?)'
  ).bind(taskId, from, to, actor, note).run();
}

async function enqueueLedger(env, eventType, taskId, actorId, payload) {
  await env.NW_DB.prepare(
    'INSERT INTO nw_ledger_outbox (event_type, task_id, actor_id, payload) VALUES (?, ?, ?, ?)'
  ).bind(eventType, taskId, actorId, JSON.stringify(payload)).run();
}

function httpError(status, message, code) {
  const e = new Error(message);
  e.status = status;
  e.code = code;
  return e;
}

function json(data, status = 200) {
  const payload = data instanceof Error
    ? { error: data.message, code: data.code || 'ERROR' }
    : data;
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-NOIZY-Key',
      'X-Powered-By': 'NOIZYWORLD/RSP_001',
    },
  });
}

function cors() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-NOIZY-Key',
      'Access-Control-Max-Age': '86400',
    },
  });
}
