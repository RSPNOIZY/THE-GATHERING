/**
 * NOIZYSTREAM Auth & Permissions
 * JWT-based role assignment. Scoped permissions per session.
 * Compatible with GOD-local API key mode AND production JWT/JWKS.
 *
 * RSP_001 | NOIZY Empire | 2026
 */

import { createHmac, randomBytes } from 'crypto';

const SECRET = process.env.NOIZYSTREAM_SECRET || randomBytes(32).toString('hex');

// ── Permission scopes ─────────────────────────────────────────────────────────
export const PERMISSIONS = [
  'session:create',
  'session:join',
  'session:admin',
  'stream:publish',
  'stream:subscribe',
  'stream:monitor',
  'stream:talkback',
  'route:modify',
  'route:request',
  'session:record',
  'proof:read',
  'audit:read',
];

// ── Simple HMAC token (v1 — no external IdP needed) ──────────────────────────
function b64url(s) {
  return Buffer.from(s).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function issueToken(payload, expiresInSeconds = 3600) {
  const now = Math.floor(Date.now() / 1000);
  const claims = { ...payload, iat: now, exp: now + expiresInSeconds, iss: 'noizystream' };
  const payloadPart = b64url(JSON.stringify(claims));
  const sig = createHmac('sha256', SECRET).update(payloadPart).digest('base64url');
  return `${payloadPart}.${sig}`;
}

export function verifyToken(token) {
  if (!token) return null;
  const t = token.startsWith('Bearer ') ? token.slice(7) : token;
  const [payloadPart, sig] = t.split('.');
  if (!payloadPart || !sig) return null;
  const expected = createHmac('sha256', SECRET).update(payloadPart).digest('base64url');
  if (sig !== expected) return null;
  try {
    const claims = JSON.parse(Buffer.from(payloadPart, 'base64url').toString());
    if (claims.exp && Math.floor(Date.now() / 1000) >= claims.exp) return null;
    return claims;
  } catch { return null; }
}

// ── Middleware ────────────────────────────────────────────────────────────────
export function requireAuth(req, res, next) {
  // GOD-local: X-NOIZY-Key passes as host
  const apiKey = req.headers['x-noizy-key'];
  if (apiKey && apiKey === process.env.NOIZY_API_KEY) {
    req.auth = { subject: 'api-key', role: 'HOST', permissions: Object.values(PERMISSIONS), mode: 'api-key' };
    return next();
  }
  // JWT Bearer
  const token = req.headers['authorization'];
  const claims = verifyToken(token);
  if (!claims) return res.status(401).json({ error: 'Unauthorized' });
  req.auth = { ...claims, mode: 'jwt' };
  next();
}

export function requirePermission(permission) {
  return (req, res, next) => {
    const perms = req.auth?.permissions || [];
    if (!perms.includes(permission)) {
      return res.status(403).json({ error: `Forbidden — requires ${permission}` });
    }
    next();
  };
}

// ── Session token for participants ────────────────────────────────────────────
export function issueSessionToken(session_id, participant_id, role, permissions) {
  return issueToken({ sub: participant_id, session_id, role, permissions }, 28800); // 8h
}
