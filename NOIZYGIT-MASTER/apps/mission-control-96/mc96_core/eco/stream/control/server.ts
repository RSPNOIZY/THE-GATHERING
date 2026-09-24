/**
 * NOIZYSTREAM — Control Service
 * Port 7778 on GOD.local (M2 Ultra)
 *
 * Responsibilities:
 *   - Session lifecycle (create / start / end)
 *   - Participant join / role assignment
 *   - Endpoint registration
 *   - Route CRUD
 *   - Route template application
 *   - Health + proof endpoints
 *
 * Emits proof records for every state mutation.
 * Pure Node.js HTTP — no framework deps required.
 */

import * as http from 'http';
import * as crypto from 'crypto';
import { ProofLogger } from '../proof/logger';
import {
  Session,
  SessionState,
  SessionMode,
  Participant,
  StreamEndpoint,
  Route,
  RouteTemplate,
  ROLE_DEFINITIONS,
  CreateSessionRequest,
  JoinSessionRequest,
  RegisterEndpointRequest,
  CreateRouteRequest,
  ModifyRouteRequest,
  ApiResponse,
  HealthStatus,
} from '../types';

// ── Store (in-memory; swap for D1 or SQLite in production) ────────────────────

const sessions = new Map<string, Session>();
const templates = new Map<string, RouteTemplate>();
const proof = new ProofLogger();
const startedAt = Date.now();

// ── IDs ───────────────────────────────────────────────────────────────────────

function uid(): string {
  return crypto.randomBytes(8).toString('hex');
}

// ── Session helpers ───────────────────────────────────────────────────────────

function getSession(id: string): Session | undefined {
  return sessions.get(id);
}

function requireSession(id: string): Session {
  const s = sessions.get(id);
  if (!s) throw { code: 404, message: `Session not found: ${id}` };
  return s;
}

function hasPermission(session: Session, userId: string, permission: string): boolean {
  const p = session.participants.find(pt => pt.userId === userId);
  if (!p) return false;
  const role = ROLE_DEFINITIONS[p.roleId];
  return role.permissions.includes(permission as any);
}

// ── Routing table ─────────────────────────────────────────────────────────────

type Handler = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  params: Record<string, string>,
  body: unknown
) => Promise<void>;

interface Route_Entry {
  method: string;
  pattern: RegExp;
  keys: string[];
  handler: Handler;
}

const routes: Route_Entry[] = [];

function on(method: string, path: string, handler: Handler) {
  const keys: string[] = [];
  const pattern = new RegExp(
    '^' + path.replace(/:([a-z]+)/g, (_m, k) => { keys.push(k); return '([^/]+)'; }) + '$'
  );
  routes.push({ method, pattern, keys, handler });
}

// ── Response helpers ──────────────────────────────────────────────────────────

function ok<T>(res: http.ServerResponse, data: T, status = 200) {
  const body: ApiResponse<T> = { ok: true, data, ts: Date.now() };
  res.writeHead(status, { 'Content-Type': 'application/json', ...cors() });
  res.end(JSON.stringify(body));
}

function fail(res: http.ServerResponse, status: number, message: string) {
  const body: ApiResponse = { ok: false, error: message, ts: Date.now() };
  res.writeHead(status, { 'Content-Type': 'application/json', ...cors() });
  res.end(JSON.stringify(body));
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  };
}

// ── Route definitions ─────────────────────────────────────────────────────────

// GET /health
on('GET', '/health', async (_req, res, _p) => {
  const status: HealthStatus = {
    service: 'NOIZYSTREAM Control',
    status: 'ok',
    uptime: Math.floor((Date.now() - startedAt) / 1000),
    activeSessions: [...sessions.values()].filter(s => s.state !== 'ended').length,
    lanes: { dante: 'unknown', webrtc: 'up', aes67: 'unknown' },
    ts: Date.now(),
  };
  ok(res, status);
});

// GET /sessions
on('GET', '/sessions', async (_req, res, _p) => {
  ok(res, [...sessions.values()].map(s => ({
    id: s.id,
    name: s.name,
    state: s.state,
    mode: s.mode,
    participants: s.participants.length,
    routes: s.routes.length,
    createdAt: s.createdAt,
  })));
});

// POST /sessions
on('POST', '/sessions', async (_req, res, _p, body) => {
  const req = body as CreateSessionRequest;
  if (!req.name || !req.mode || !req.hostUserId) {
    return fail(res, 400, 'name, mode, hostUserId required');
  }

  const id = uid();
  const hostParticipant: Participant = {
    userId: req.hostUserId,
    displayName: 'Host',
    roleId: 'host',
    joinedAt: Date.now(),
    endpointIds: [],
  };

  const session: Session = {
    id,
    name: req.name,
    state: 'idle',
    mode: req.mode as SessionMode,
    hostUserId: req.hostUserId,
    participants: [hostParticipant],
    endpoints: [],
    routes: [],
    templateId: req.templateId,
    createdAt: Date.now(),
  };

  // Apply template if provided
  if (req.templateId) {
    const tmpl = templates.get(req.templateId);
    if (tmpl) {
      session.routes = tmpl.routes.map(r => ({
        ...r,
        id: uid(),
        sessionId: id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: req.hostUserId,
      }));
    }
  }

  sessions.set(id, session);
  proof.write(id, req.hostUserId, 'session.created', { sessionId: id, name: req.name, mode: req.mode });
  ok(res, session, 201);
});

// GET /sessions/:sessionId
on('GET', '/sessions/:sessionId', async (_req, res, { sessionId }) => {
  const s = requireSession(sessionId);
  ok(res, s);
});

// POST /sessions/:sessionId/start
on('POST', '/sessions/:sessionId/start', async (_req, res, { sessionId }, body) => {
  const { userId } = body as { userId: string };
  const s = requireSession(sessionId);
  if (!hasPermission(s, userId, 'session:create')) return fail(res, 403, 'Forbidden');
  if (s.state !== 'idle') return fail(res, 409, `Cannot start session in state: ${s.state}`);

  s.state = 'live';
  s.startedAt = Date.now();
  proof.write(sessionId, userId, 'session.started', { sessionId });
  ok(res, { state: s.state, startedAt: s.startedAt });
});

// POST /sessions/:sessionId/end
on('POST', '/sessions/:sessionId/end', async (_req, res, { sessionId }, body) => {
  const { userId } = body as { userId: string };
  const s = requireSession(sessionId);
  if (!hasPermission(s, userId, 'session:end')) return fail(res, 403, 'Forbidden');

  s.state = 'ended';
  s.endedAt = Date.now();
  proof.write(sessionId, userId, 'session.ended', { sessionId });
  ok(res, { state: s.state, endedAt: s.endedAt });
});

// DELETE /sessions/:sessionId
on('DELETE', '/sessions/:sessionId', async (_req, res, { sessionId }) => {
  const s = requireSession(sessionId);
  sessions.delete(sessionId);
  proof.write(sessionId, 'system', 'session.ended', { deleted: true });
  ok(res, { deleted: true, id: sessionId });
});

// POST /sessions/:sessionId/join
on('POST', '/sessions/:sessionId/join', async (_req, res, { sessionId }, body) => {
  const req = body as JoinSessionRequest;
  const s = requireSession(sessionId);
  if (s.state === 'ended') return fail(res, 409, 'Session has ended');

  const existing = s.participants.find(p => p.userId === req.userId);
  if (existing) return fail(res, 409, `User ${req.userId} already in session`);

  const role = ROLE_DEFINITIONS[req.roleId];
  if (!role) return fail(res, 400, `Unknown role: ${req.roleId}`);

  // Check maxInstances
  if (role.maxInstances !== null) {
    const count = s.participants.filter(p => p.roleId === req.roleId).length;
    if (count >= role.maxInstances) return fail(res, 409, `Role ${req.roleId} at capacity`);
  }

  const participant: Participant = {
    userId: req.userId,
    displayName: req.displayName,
    roleId: req.roleId,
    joinedAt: Date.now(),
    endpointIds: [],
  };
  s.participants.push(participant);
  proof.write(sessionId, req.userId, 'participant.joined', { roleId: req.roleId, displayName: req.displayName });
  ok(res, participant);
});

// DELETE /sessions/:sessionId/participants/:userId
on('DELETE', '/sessions/:sessionId/participants/:userId', async (_req, res, { sessionId, userId }) => {
  const s = requireSession(sessionId);
  const idx = s.participants.findIndex(p => p.userId === userId);
  if (idx === -1) return fail(res, 404, `Participant ${userId} not found`);

  s.participants[idx].leftAt = Date.now();
  s.participants.splice(idx, 1);
  proof.write(sessionId, userId, 'participant.left', { userId });
  ok(res, { left: true, userId });
});

// POST /sessions/:sessionId/endpoints
on('POST', '/sessions/:sessionId/endpoints', async (_req, res, { sessionId }, body) => {
  const req = body as RegisterEndpointRequest;
  const s = requireSession(sessionId);
  const participant = s.participants.find(p => p.userId === req.userId);
  if (!participant) return fail(res, 403, 'Not a session participant');

  const endpoint: StreamEndpoint = {
    ...req.endpoint,
    id: uid(),
    active: true,
    ownedByUserId: req.userId,
  };
  s.endpoints.push(endpoint);
  participant.endpointIds.push(endpoint.id);
  proof.write(sessionId, req.userId, 'endpoint.registered', { endpointId: endpoint.id, lane: endpoint.lane, label: endpoint.label });
  ok(res, endpoint, 201);
});

// DELETE /sessions/:sessionId/endpoints/:endpointId
on('DELETE', '/sessions/:sessionId/endpoints/:endpointId', async (_req, res, { sessionId, endpointId }) => {
  const s = requireSession(sessionId);
  const idx = s.endpoints.findIndex(e => e.id === endpointId);
  if (idx === -1) return fail(res, 404, `Endpoint ${endpointId} not found`);

  s.endpoints[idx].active = false;
  proof.write(sessionId, 'system', 'endpoint.deregistered', { endpointId });
  ok(res, { deregistered: true, endpointId });
});

// GET /sessions/:sessionId/routes
on('GET', '/sessions/:sessionId/routes', async (_req, res, { sessionId }) => {
  const s = requireSession(sessionId);
  ok(res, s.routes);
});

// POST /sessions/:sessionId/routes
on('POST', '/sessions/:sessionId/routes', async (_req, res, { sessionId }, body) => {
  const req = body as CreateRouteRequest;
  const s = requireSession(sessionId);

  const source = s.endpoints.find(e => e.id === req.sourceEndpointId);
  if (!source) return fail(res, 400, `Source endpoint not found: ${req.sourceEndpointId}`);
  for (const sinkId of req.sinkEndpointIds) {
    if (!s.endpoints.find(e => e.id === sinkId)) return fail(res, 400, `Sink endpoint not found: ${sinkId}`);
  }

  const route: Route = {
    id: uid(),
    sessionId,
    label: req.label,
    sourceEndpointId: req.sourceEndpointId,
    sinkEndpointIds: req.sinkEndpointIds,
    lane: req.lane,
    gain: req.gain ?? 1.0,
    muted: false,
    latencyMs: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: (body as any).userId ?? 'unknown',
  };
  s.routes.push(route);
  proof.write(sessionId, route.createdBy, 'route.created', { routeId: route.id, label: route.label, lane: route.lane });
  ok(res, route, 201);
});

// PUT /sessions/:sessionId/routes/:routeId
on('PUT', '/sessions/:sessionId/routes/:routeId', async (_req, res, { sessionId, routeId }, body) => {
  const mod = body as ModifyRouteRequest;
  const s = requireSession(sessionId);
  const route = s.routes.find(r => r.id === routeId);
  if (!route) return fail(res, 404, `Route ${routeId} not found`);

  if (mod.gain !== undefined) route.gain = Math.max(0, Math.min(1, mod.gain));
  if (mod.muted !== undefined) route.muted = mod.muted;
  if (mod.sinkEndpointIds !== undefined) route.sinkEndpointIds = mod.sinkEndpointIds;
  route.updatedAt = Date.now();

  proof.write(sessionId, (body as any).userId ?? 'unknown', 'route.modified', { routeId, ...mod });
  ok(res, route);
});

// DELETE /sessions/:sessionId/routes/:routeId
on('DELETE', '/sessions/:sessionId/routes/:routeId', async (_req, res, { sessionId, routeId }) => {
  const s = requireSession(sessionId);
  const idx = s.routes.findIndex(r => r.id === routeId);
  if (idx === -1) return fail(res, 404, `Route ${routeId} not found`);

  s.routes.splice(idx, 1);
  proof.write(sessionId, 'system', 'route.deleted', { routeId });
  ok(res, { deleted: true, routeId });
});

// GET /sessions/:sessionId/proof
on('GET', '/sessions/:sessionId/proof', async (_req, res, { sessionId }) => {
  requireSession(sessionId);
  ok(res, proof.get(sessionId));
});

// GET /sessions/:sessionId/manifest
on('GET', '/sessions/:sessionId/manifest', async (_req, res, { sessionId }) => {
  const s = requireSession(sessionId);
  ok(res, proof.manifest(s));
});

// GET /templates
on('GET', '/templates', async (_req, res) => {
  ok(res, [...templates.values()]);
});

// POST /templates
on('POST', '/templates', async (_req, res, _p, body) => {
  const tmpl = body as Omit<RouteTemplate, 'id' | 'createdAt'>;
  const id = uid();
  const full: RouteTemplate = { ...tmpl, id, createdAt: Date.now() };
  templates.set(id, full);
  ok(res, full, 201);
});

// ── HTTP Server ───────────────────────────────────────────────────────────────

async function parseBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => { data += c; });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch { reject(new Error('Invalid JSON')); }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const method = req.method ?? 'GET';
  const url = new URL(req.url ?? '/', `http://localhost`);
  const pathname = url.pathname;

  if (method === 'OPTIONS') {
    res.writeHead(204, cors());
    res.end();
    return;
  }

  for (const entry of routes) {
    if (entry.method !== method) continue;
    const m = pathname.match(entry.pattern);
    if (!m) continue;

    const params: Record<string, string> = {};
    entry.keys.forEach((k, i) => { params[k] = m[i + 1]; });

    let body: unknown = {};
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try { body = await parseBody(req); }
      catch {
        fail(res, 400, 'Invalid JSON body');
        return;
      }
    }

    try {
      await entry.handler(req, res, params, body);
    } catch (err: any) {
      if (err?.code && err?.message) {
        fail(res, err.code, err.message);
      } else {
        console.error('[control] unhandled error:', err);
        fail(res, 500, 'Internal server error');
      }
    }
    return;
  }

  fail(res, 404, `Not found: ${method} ${pathname}`);
});

const PORT = Number(process.env.NOIZYSTREAM_CONTROL_PORT ?? 7778);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[NOIZYSTREAM] Control service → http://0.0.0.0:${PORT}`);
});

export { server };
