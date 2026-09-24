/**
 * NOIZYSTREAM Session Manager
 * Create, join, tear down sessions with full role + permission tracking.
 * Proof-logged. GABRIEL-integrated. Creator-first.
 *
 * RSP_001 | NOIZY Empire | 2026
 */

import { randomUUID } from 'crypto';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SESSIONS_DIR = path.join(__dirname, '../../artifacts/sessions');
if (!existsSync(SESSIONS_DIR)) mkdirSync(SESSIONS_DIR, { recursive: true });

// ── Role definitions ──────────────────────────────────────────────────────────
export const ROLES = {
  HOST:        { name: 'host',        permissions: ['session:create','session:admin','route:modify','stream:publish','stream:subscribe','stream:monitor','session:record','stream:talkback'] },
  ARTIST:      { name: 'artist',      permissions: ['stream:publish','stream:subscribe','stream:talkback'] },
  CONTRIBUTOR: { name: 'contributor', permissions: ['stream:publish','stream:subscribe'] },
  LISTENER:    { name: 'listener',    permissions: ['stream:subscribe'] },
  PRODUCER:    { name: 'producer',    permissions: ['stream:monitor','stream:subscribe','stream:talkback','route:request'] },
  ADMIN:       { name: 'admin',       permissions: ['session:admin','stream:monitor','proof:read','audit:read'] },
};

export function hasPermission(role, permission) {
  const r = ROLES[role?.toUpperCase()];
  return r ? r.permissions.includes(permission) : false;
}

// ── Session store (in-memory + persisted to disk) ─────────────────────────────
const sessions = new Map();

export function createSession({ name, host_id, template = 'default', metadata = {} }) {
  const id = `NS_${Date.now().toString(16)}_${randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();

  const session = {
    id,
    name: name || `Session ${id.slice(-8)}`,
    status: 'active',
    lane: 'studio',           // studio | internet | bridge
    template,
    host_id,
    created_at: now,
    updated_at: now,
    participants: [],
    routes: [],
    proof_events: [{
      event: 'session.created',
      actor: host_id,
      ts: now,
      metadata,
    }],
    metadata,
  };

  sessions.set(id, session);
  persistSession(session);
  return session;
}

export function joinSession(session_id, { participant_id, role = 'LISTENER', display_name, metadata = {} }) {
  const session = sessions.get(session_id);
  if (!session) throw new Error(`Session ${session_id} not found`);
  if (session.status !== 'active') throw new Error(`Session ${session_id} is ${session.status}`);

  const existing = session.participants.find(p => p.id === participant_id);
  if (existing) return existing;

  const now = new Date().toISOString();
  const participant = {
    id: participant_id,
    display_name: display_name || participant_id,
    role: role.toUpperCase(),
    permissions: ROLES[role.toUpperCase()]?.permissions || [],
    joined_at: now,
    status: 'connected',
    metadata,
  };

  session.participants.push(participant);
  session.updated_at = now;
  session.proof_events.push({ event: 'participant.joined', actor: participant_id, role, ts: now });
  persistSession(session);
  return participant;
}

export function leaveSession(session_id, participant_id) {
  const session = sessions.get(session_id);
  if (!session) return;
  const now = new Date().toISOString();
  const p = session.participants.find(p => p.id === participant_id);
  if (p) {
    p.status = 'disconnected';
    p.left_at = now;
    session.proof_events.push({ event: 'participant.left', actor: participant_id, ts: now });
    session.updated_at = now;
    persistSession(session);
  }
}

export function closeSession(session_id, actor_id) {
  const session = sessions.get(session_id);
  if (!session) throw new Error(`Session ${session_id} not found`);
  const now = new Date().toISOString();
  session.status = 'closed';
  session.closed_at = now;
  session.updated_at = now;
  session.proof_events.push({ event: 'session.closed', actor: actor_id, ts: now });
  persistSession(session);
  return session;
}

export function getSession(id) {
  return sessions.get(id) || null;
}

export function listSessions(filter = {}) {
  const all = Array.from(sessions.values());
  if (filter.status) return all.filter(s => s.status === filter.status);
  return all;
}

export function applyRoute(session_id, route, actor_id) {
  const session = sessions.get(session_id);
  if (!session) throw new Error('Session not found');
  const now = new Date().toISOString();
  const r = { ...route, id: randomUUID(), applied_at: now, applied_by: actor_id };
  session.routes.push(r);
  session.proof_events.push({ event: 'route.applied', actor: actor_id, route: r.name, ts: now });
  session.updated_at = now;
  persistSession(session);
  return r;
}

function persistSession(session) {
  try {
    writeFileSync(
      path.join(SESSIONS_DIR, `${session.id}.json`),
      JSON.stringify(session, null, 2)
    );
  } catch (_) {}
}
