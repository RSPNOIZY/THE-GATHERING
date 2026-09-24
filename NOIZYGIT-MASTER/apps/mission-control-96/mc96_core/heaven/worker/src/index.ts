/**
 * Heaven — Cloudflare Worker Edge Gateway
 * MC96 Ecosystem — NOIZYLAB
 *
 * This is the edge layer. It:
 * - Routes requests to the correct agent/service
 * - Validates Access JWTs (Cf-Access-Jwt-Assertion)
 * - Serves health and identity endpoints at the edge
 * - Proxies to origin (GOD Express API via tunnel) for heavy operations
 *
 * Runtime: Cloudflare Workers (V8 isolate, NOT Node.js)
 */

export interface Env {
  HEAVEN_KV: KVNamespace;
  HEAVEN_DB: D1Database;
  IDENTITY: string;
  ENVIRONMENT: string;
  CF_ACCESS_AUD?: string;
  CF_TEAM_DOMAIN?: string;
  ORIGIN_URL?: string;      // fallback origin (tunnel back to GOD)
  TUNNEL_DOMAIN?: string;   // e.g., "noizy.ai" — used to build agent proxy URLs
}

// ─── Agent Route Map ─────────────────────────────────────────
// Each agent has a tunnel hostname on GOD and a local port.
// The Worker proxies /agent-name/* → https://agent-name.{TUNNEL_DOMAIN}/*
// This is the single source of truth for where agents live.

const AGENT_ROUTES: Record<string, { host: string; port: number; description: string }> = {
  keith:       { host: 'keith',       port: 7006,  description: 'ENGR_KEITH — Infrastructure Engineer' },
  heaven:     { host: 'heaven',      port: 8080,  description: 'Heaven — Primary API' },
  lucy:       { host: 'lucy',        port: 8081,  description: 'Lucy — Voice Estate Guardian' },
  gabriel:    { host: 'gabriel.dreamchamber', port: 7777, description: 'GABRIEL — Release Commander' },
  dream:      { host: 'dreamchamber', port: 7777,  description: 'DreamChamber Core' },
  voice:      { host: 'voice',       port: 17017, description: 'Voice Pipeline (A.I.V.A.)' },
  'mickey-p': { host: 'mickey-p',    port: 9090,  description: 'Mickey-P — Legacy Audio Bridge' },
  n8n:        { host: 'n8n',         port: 5678,  description: 'n8n Automation — self-hosted workflow engine' },
  zapier:     { host: 'zapier',      port: 5679,  description: 'Zapier Webhook Bridge — inbound signals from Zapier' },
  ai:         { host: 'ai',          port: 3080,  description: 'Open WebUI (Ollama)' },
  metrics:    { host: 'metrics',     port: 3000,  description: 'Grafana Analytics' },
};

// ─── Router ──────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return corsResponse();
    }

    try {
      // Public routes (no JWT required)
      if (path === '/health' || path === '/api/health') {
        return jsonResponse(await handleHealth(env));
      }

      if (path === '/robots.txt') {
        return new Response('User-agent: *\nDisallow: /api/\n', {
          headers: { 'Content-Type': 'text/plain' },
        });
      }

      // Agent proxy routes — /keith/*, /lucy/*, /gabriel/*, etc.
      // These proxy through the tunnel to the correct service on GOD
      const pathSegments = path.split('/').filter(Boolean);
      const agentName = pathSegments[0];
      const agentRoute = AGENT_ROUTES[agentName];

      if (agentRoute) {
        const identity = await validateAccessJWT(request, env);
        if (!identity) {
          return jsonResponse(
            { error: 'Access denied', code: 'ACCESS_DENIED' },
            403
          );
        }

        // Log the dispatch
        try {
          await env.HEAVEN_DB.prepare(
            'INSERT INTO dispatches (agent, signal, payload, dispatched_by, dispatched_at) VALUES (?, ?, ?, ?, ?)'
          ).bind(
            agentName,
            `${request.method} ${path}`,
            '{}',
            identity.email,
            new Date().toISOString()
          ).run();
        } catch { /* non-fatal */ }

        return proxyToAgent(request, env, agentRoute, pathSegments.slice(1).join('/'));
      }

      // Protected API routes — validate Access JWT
      if (path.startsWith('/api/')) {
        const identity = await validateAccessJWT(request, env);
        if (!identity) {
          return jsonResponse(
            { error: 'Access denied', code: 'ACCESS_DENIED' },
            403
          );
        }

        // Route to handler
        if (path === '/api/whoami') {
          return jsonResponse({ identity: env.IDENTITY, user: identity });
        }

        if (path === '/api/agents') {
          return jsonResponse(await handleAgentList(env));
        }

        if (path === '/api/routes') {
          return jsonResponse({
            routes: Object.entries(AGENT_ROUTES).map(([name, r]) => ({
              path: `/${name}/*`,
              tunnel: `${r.host}.${env.TUNNEL_DOMAIN || 'noizy.ai'}`,
              port: r.port,
              description: r.description,
            })),
          });
        }

        if (path === '/api/dispatch' && request.method === 'POST') {
          return jsonResponse(await handleDispatch(request, env, identity));
        }

        // Zapier inbound webhook — no JWT (Zapier can't send CF Access tokens)
        // Validated by X-Heaven-Webhook-Secret header instead
        if (path.startsWith('/api/webhook/zapier')) {
          const secret = request.headers.get('X-Heaven-Webhook-Secret');
          const expected = (env as any).WEBHOOK_SECRET;
          if (expected && secret !== expected) {
            return jsonResponse({ error: 'Invalid webhook secret' }, 401);
          }
          const body = await request.json().catch(() => ({}));
          // Log to D1 for n8n / downstream processing
          try {
            await env.HEAVEN_DB.prepare(
              'INSERT INTO dispatches (agent, signal, payload, dispatched_by, dispatched_at) VALUES (?, ?, ?, ?, ?)'
            ).bind('zapier', 'webhook', JSON.stringify(body), 'zapier', new Date().toISOString()).run();
          } catch { /* non-fatal */ }
          return jsonResponse({ received: true, source: 'zapier', timestamp: new Date().toISOString() });
        }

        // Proxy remaining /api/* to origin
        if (env.ORIGIN_URL) {
          return proxyToOrigin(request, env);
        }

        return jsonResponse({ error: 'Not found', code: 'NOT_FOUND' }, 404);
      }

      // Root
      if (path === '/') {
        return jsonResponse({
          name: 'Heaven',
          identity: env.IDENTITY,
          version: '2.0.0-claude',
          ecosystem: 'MC96',
          baseModel: 'claude-sonnet-4-5',
          agents: Object.keys(AGENT_ROUTES).length,
          status: 'GORUNFREE',
          philosophy: 'DAZEFLOW — Dynamic, Atmospheric, Zero-endpoint, Evolutionary, Flow-native, Living, Organic, Woven',
        });
      }

      return jsonResponse({ error: 'Not found' }, 404);

    } catch (err) {
      console.error('Heaven error:', err);
      return jsonResponse(
        { error: 'Internal error', message: (err as Error).message },
        500
      );
    }
  },
};

// ─── Handlers ────────────────────────────────────────────────

async function handleHealth(env: Env): Promise<object> {
  const health: Record<string, unknown> = {
    service: `${env.IDENTITY}-worker`,
    status: 'healthy',
    runtime: 'cloudflare-workers',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: env.ENVIRONMENT,
  };

  // Check D1
  try {
    await env.HEAVEN_DB.prepare('SELECT 1').first();
    health.d1 = 'connected';
  } catch {
    health.d1 = 'disconnected';
  }

  // Check KV
  try {
    await env.HEAVEN_KV.get('__health_check');
    health.kv = 'connected';
  } catch {
    health.kv = 'disconnected';
  }

  return health;
}

async function handleAgentList(env: Env): Promise<object> {
  // Agent registry — loaded from KV or hardcoded fallback
  const cached = await env.HEAVEN_KV.get('agents:registry', 'json');
  if (cached) return cached;

  const agents = {
    agents: [
      { id: 'claude',     role: 'Base Model — Sovereign Intelligence (claude-sonnet-4-5)', status: 'active', model: 'claude-sonnet-4-5' },
      { id: 'gabriel',    role: 'Release Commander & Swarm Leader',  status: 'active' },
      { id: 'lucy',       role: 'Guardian & Voice Estate — She Helps You Not Break Shit', status: 'active' },
      { id: 'shirl',      role: 'Sample Intelligence Analyst (Living Memory)',  status: 'defined' },
      { id: 'dream',      role: 'Creative Assistant & DAW Whisperer', status: 'defined' },
      { id: 'pops',       role: 'No-Code Orchestrator',              status: 'defined' },
      { id: 'engr_keith', role: 'Infrastructure Engineer',           status: 'defined' },
      { id: 'cb01',       role: 'Consent & Contracts Bot',           status: 'defined' },
      { id: 'heaven',     role: 'DNS & Domain Sovereign — Atmospheric Gateway', status: 'active' },
    ],
    total: 9,
    ecosystem: 'MC96',
    baseModel: 'claude-sonnet-4-5',
    philosophy: 'GORUNFREE — AI & Humans in perfect symmetry & synchronicity',
  };

  // Cache for 5 minutes
  await env.HEAVEN_KV.put('agents:registry', JSON.stringify(agents), { expirationTtl: 300 });
  return agents;
}

async function handleDispatch(
  request: Request,
  env: Env,
  identity: AccessIdentity
): Promise<object> {
  const body = await request.json() as { agent?: string; signal?: string; payload?: unknown };
  const { agent, signal, payload } = body;

  if (!agent || !signal) {
    return { error: 'agent and signal are required', code: 'INVALID_REQUEST' };
  }

  // Log dispatch to D1
  try {
    await env.HEAVEN_DB.prepare(
      'INSERT INTO dispatches (agent, signal, payload, dispatched_by, dispatched_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      agent,
      signal,
      JSON.stringify(payload || {}),
      identity.email,
      new Date().toISOString()
    ).run();
  } catch (err) {
    console.error('D1 dispatch log error:', err);
  }

  return {
    dispatched: true,
    agent,
    signal,
    dispatched_by: identity.email,
    timestamp: new Date().toISOString(),
    note: 'Agent dispatch queued. Origin processing via tunnel.',
  };
}

// ─── Access JWT Validation ───────────────────────────────────

interface AccessIdentity {
  email: string;
  sub: string;
  iat: number;
  exp: number;
}

async function validateAccessJWT(
  request: Request,
  env: Env
): Promise<AccessIdentity | null> {
  const aud = env.CF_ACCESS_AUD;
  if (!aud) {
    // Dev mode — no JWT enforcement
    if (env.ENVIRONMENT !== 'production') {
      return { email: 'dev@local', sub: 'dev', iat: 0, exp: 0 };
    }
    return null;
  }

  const token =
    request.headers.get('Cf-Access-Jwt-Assertion') ||
    getCookie(request, 'CF_Authorization');

  if (!token) return null;

  try {
    const teamDomain = env.CF_TEAM_DOMAIN || 'noizylab';
    const certsUrl = `https://${teamDomain}.cloudflareaccess.com/cdn-cgi/access/certs`;
    const certsResponse = await fetch(certsUrl);
    const certs = await certsResponse.json() as { keys: JsonWebKey[] };

    // Decode JWT header to find the right key
    const [headerB64] = token.split('.');
    const header = JSON.parse(atob(headerB64)) as { kid: string; alg: string };

    const key = (certs.keys as Array<JsonWebKey & { kid: string }>).find(
      (k) => k.kid === header.kid
    );
    if (!key) return null;

    const cryptoKey = await crypto.subtle.importKey(
      'jwk',
      key,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Verify signature
    const [, payloadB64, signatureB64] = token.split('.');
    const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const signature = Uint8Array.from(atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, signature, data);
    if (!valid) return null;

    // Decode payload and check claims
    const payload = JSON.parse(atob(payloadB64)) as AccessIdentity & { aud: string[]; iss: string };

    if (!payload.aud?.includes(aud)) return null;
    if (payload.exp < Date.now() / 1000) return null;

    return {
      email: payload.email,
      sub: payload.sub,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch (err) {
    console.error('JWT validation error:', err);
    return null;
  }
}

function getCookie(request: Request, name: string): string | null {
  const cookies = request.headers.get('Cookie') || '';
  const match = cookies.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : null;
}

// ─── Agent Proxy (through tunnel) ────────────────────────────

async function proxyToAgent(
  request: Request,
  env: Env,
  route: { host: string; port: number },
  subpath: string
): Promise<Response> {
  const tunnelDomain = env.TUNNEL_DOMAIN || 'noizy.ai';
  const targetUrl = `https://${route.host}.${tunnelDomain}/${subpath}`;

  const proxyHeaders = new Headers(request.headers);
  proxyHeaders.set('X-Forwarded-By', 'Heaven/MC96');
  proxyHeaders.set('X-Original-URL', request.url);

  try {
    const proxyReq = new Request(targetUrl, {
      method: request.method,
      headers: proxyHeaders,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
    });

    const response = await fetch(proxyReq);

    // Pass through with CORS headers
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('X-Proxied-By', 'Heaven/MC96');
    responseHeaders.set('X-Tunnel-Target', `${route.host}.${tunnelDomain}`);

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (err) {
    return jsonResponse(
      {
        error: 'Agent unreachable',
        agent: route.host,
        tunnel: `${route.host}.${tunnelDomain}`,
        message: (err as Error).message,
      },
      502
    );
  }
}

// ─── Origin Proxy (fallback) ─────────────────────────────────

async function proxyToOrigin(request: Request, env: Env): Promise<Response> {
  const originUrl = new URL(request.url);
  originUrl.host = new URL(env.ORIGIN_URL!).host;
  originUrl.protocol = 'https:';

  const originRequest = new Request(originUrl.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });

  return fetch(originRequest);
}

// ─── Utilities ───────────────────────────────────────────────

function jsonResponse(data: object, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Cf-Access-Jwt-Assertion',
      'X-Powered-By': 'Heaven/MC96',
    },
  });
}

function corsResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Cf-Access-Jwt-Assertion',
      'Access-Control-Max-Age': '86400',
    },
  });
}
