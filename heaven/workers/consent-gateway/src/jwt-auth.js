/**
 * JWT/JWKS Authentication — NOIZY Consent Gateway
 * Production auth upgrade: RS256 JWT verification against JWKS endpoint
 * RSP_001 | NOIZY Empire | 2026
 *
 * Usage: replace X-NOIZY-Key with Authorization: Bearer <JWT>
 * Set env vars: JWT_JWKS_URL, JWT_ISSUER, JWT_AUDIENCE
 */

function b64urlToBytes(input) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const raw = atob(padded);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function parseJsonPart(part) {
  return JSON.parse(new TextDecoder().decode(b64urlToBytes(part)));
}

function normalizeAud(aud) {
  if (!aud) return [];
  return Array.isArray(aud) ? aud : [aud];
}

async function importRsaPublicKey(jwk) {
  return crypto.subtle.importKey(
    "jwk", jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false, ["verify"]
  );
}

async function verifyJwtSignature(token, jwk) {
  const [headerPart, payloadPart, signaturePart] = token.split(".");
  if (!headerPart || !payloadPart || !signaturePart) return false;
  const signingInput = new TextEncoder().encode(`${headerPart}.${payloadPart}`);
  const signature = b64urlToBytes(signaturePart);
  const key = await importRsaPublicKey(jwk);
  return crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, signature, signingInput);
}

// Cache JWKS for 10 minutes to avoid fetching on every request
const jwksCache = { data: null, fetched: 0, ttl: 600_000 };

async function fetchJwks(jwksUrl) {
  const now = Date.now();
  if (jwksCache.data && (now - jwksCache.fetched) < jwksCache.ttl) {
    return jwksCache.data;
  }
  const res = await fetch(jwksUrl, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`JWKS fetch failed: ${res.status}`);
  jwksCache.data = await res.json();
  jwksCache.fetched = now;
  return jwksCache.data;
}

function validateClaims(payload, env) {
  const now = Math.floor(Date.now() / 1000);
  if (!payload.sub) return false;
  if (env.JWT_ISSUER && payload.iss !== env.JWT_ISSUER) return false;
  if (env.JWT_AUDIENCE && !normalizeAud(payload.aud).includes(env.JWT_AUDIENCE)) return false;
  if (payload.nbf && now < payload.nbf) return false;
  if (payload.exp && now >= payload.exp) return false;
  return true;
}

/**
 * Authenticate via JWT Bearer token.
 * Returns AuthContext or null (unauthenticated).
 */
export async function authenticateJwt(request, env) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  if (!env.JWT_JWKS_URL) return null; // JWT mode not configured

  const token = authHeader.slice("Bearer ".length).trim();
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  let header, payload;
  try {
    header = parseJsonPart(parts[0]);
    payload = parseJsonPart(parts[1]);
  } catch { return null; }

  if (header.alg !== "RS256") return null;

  try {
    const jwks = await fetchJwks(env.JWT_JWKS_URL);
    const jwk = jwks.keys?.find(k =>
      (!header.kid || k.kid === header.kid) && k.kty === "RSA"
    );
    if (!jwk) return null;

    const valid = await verifyJwtSignature(token, jwk);
    if (!valid) return null;
    if (!validateClaims(payload, env)) return null;

    const scopes = payload.scopes
      ?? payload.scope?.split(" ").filter(Boolean)
      ?? [];

    return {
      subject: payload.sub,
      creatorId: payload.creatorId ?? payload.creator_id,
      roles: payload.roles ?? [],
      scopes,
      authenticated: true,
      mode: "jwt",
    };
  } catch (e) {
    console.error("[jwt-auth] verification error:", e.message);
    return null;
  }
}

/**
 * Fallback: authenticate via X-NOIZY-Key header (current default).
 * Returns AuthContext or null.
 */
export function authenticateApiKey(request, env) {
  if (!env.NOIZY_API_KEY) return { subject: "dev", authenticated: true, mode: "dev" };
  const key = request.headers.get("X-NOIZY-Key") || request.headers.get("x-noizy-key");
  if (!key || key !== env.NOIZY_API_KEY) return null;
  return {
    subject: "api-key-caller",
    creatorId: null,
    roles: ["service"],
    scopes: ["consent:read", "consent:verify", "consent:revoke"],
    authenticated: true,
    mode: "api-key",
  };
}

/**
 * Primary authenticate function — JWT first, API key fallback.
 * In JWT_JWKS_URL is set: JWT-only mode.
 * Otherwise: API key mode.
 */
export async function authenticate(request, env) {
  if (env.JWT_JWKS_URL) {
    return await authenticateJwt(request, env);
  }
  return authenticateApiKey(request, env);
}
