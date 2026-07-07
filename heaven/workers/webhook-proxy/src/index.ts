/**
 * NOIZY EMPIRE — Webhook Proxy Worker
 * 
 * Receives webhooks from Linear, GitHub, Zapier, Notion
 * at a public Cloudflare URL and queues them for local n8n.
 * 
 * Routes: webhook-proxy.rsp-5f3.workers.dev/*
 * 
 * Strategy:
 *   1. Receive webhook at edge
 *   2. Verify signature (per-source)
 *   3. Store in KV with TTL as queue
 *   4. Return 200 immediately (don't keep webhook sender waiting)
 *   5. Local n8n polls /api/drain to pick up queued events
 * 
 * RSP_001 | NOIZY Empire | 2026
 */

interface Env {
  WEBHOOK_QUEUE: KVNamespace;
  NOIZY_KEY: string;
  LINEAR_WEBHOOK_SECRET: string;
  GITHUB_WEBHOOK_SECRET: string;
}

interface QueuedWebhook {
  id: string;
  source: string;
  path: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  received_at: string;
  ip: string;
}

// ── Helpers ──────────────────────────────────────────────

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Noizy-Service': 'webhook-proxy',
    },
  });
}

async function hmacVerify(
  secret: string,
  signature: string,
  body: string,
  algorithm: 'SHA-256' | 'SHA-1' = 'SHA-256'
): Promise<boolean> {
  if (!secret || !signature) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: algorithm },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const hex = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Handle sha256= or sha1= prefixes
  const cleanSig = signature.replace(/^sha\d+=/, '');
  return hex === cleanSig;
}

function detectSource(request: Request, path: string): string {
  const ua = request.headers.get('user-agent') || '';
  if (request.headers.has('x-linear-delivery')) return 'linear';
  if (request.headers.has('x-github-event')) return 'github';
  if (request.headers.has('x-zapier-zap-id') || path.includes('zapier')) return 'zapier';
  if (ua.includes('Notion')) return 'notion';
  if (request.headers.has('stripe-signature')) return 'stripe';
  return 'unknown';
}

// ── Main Handler ─────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Health check
    if (path === '/' || path === '/health') {
      return json({
        service: 'noizy-webhook-proxy',
        status: 'alive',
        timestamp: new Date().toISOString(),
      });
    }

    // ── Drain: Local n8n pulls queued webhooks ───────────
    if (path === '/api/drain' && request.method === 'POST') {
      const authKey = request.headers.get('X-Noizy-Key');
      if (authKey !== env.NOIZY_KEY) {
        return json({ error: 'Unauthorized' }, 401);
      }

      // List all queued webhooks
      const list = await env.WEBHOOK_QUEUE.list({ prefix: 'wh:' });
      const events: QueuedWebhook[] = [];

      for (const key of list.keys) {
        const val = await env.WEBHOOK_QUEUE.get(key.name, 'json');
        if (val) {
          events.push(val as QueuedWebhook);
          // Delete after drain
          await env.WEBHOOK_QUEUE.delete(key.name);
        }
      }

      return json({
        drained: events.length,
        events,
        timestamp: new Date().toISOString(),
      });
    }

    // ── Stats ────────────────────────────────────────────
    if (path === '/api/stats') {
      const authKey = request.headers.get('X-Noizy-Key');
      if (authKey !== env.NOIZY_KEY) {
        return json({ error: 'Unauthorized' }, 401);
      }

      const list = await env.WEBHOOK_QUEUE.list({ prefix: 'wh:' });
      const counterRaw = await env.WEBHOOK_QUEUE.get('stats:total');
      return json({
        queued: list.keys.length,
        total_received: parseInt(counterRaw || '0'),
        timestamp: new Date().toISOString(),
      });
    }

    // ── Receive Webhook ──────────────────────────────────
    if (request.method === 'POST' && path.startsWith('/webhook/')) {
      const source = detectSource(request, path);
      const body = await request.text();
      const webhookPath = path.replace('/webhook/', '');

      // ── Signature verification ─────────────────────────
      if (source === 'linear' && env.LINEAR_WEBHOOK_SECRET) {
        const sig = request.headers.get('linear-signature') || '';
        const valid = await hmacVerify(env.LINEAR_WEBHOOK_SECRET, sig, body);
        if (!valid) {
          return json({ error: 'Invalid Linear signature' }, 401);
        }
      }

      if (source === 'github' && env.GITHUB_WEBHOOK_SECRET) {
        const sig = request.headers.get('x-hub-signature-256') || '';
        const valid = await hmacVerify(env.GITHUB_WEBHOOK_SECRET, sig, body);
        if (!valid) {
          return json({ error: 'Invalid GitHub signature' }, 401);
        }
      }

      // ── Queue the webhook ──────────────────────────────
      const id = crypto.randomUUID();
      const queued: QueuedWebhook = {
        id,
        source,
        path: webhookPath,
        method: request.method,
        headers: Object.fromEntries(
          [...request.headers.entries()].filter(([k]) =>
            k.startsWith('x-') || k === 'content-type' || k === 'user-agent'
          )
        ),
        body,
        received_at: new Date().toISOString(),
        ip: request.headers.get('cf-connecting-ip') || 'unknown',
      };

      // Store with 24h TTL
      await env.WEBHOOK_QUEUE.put(
        `wh:${id}`,
        JSON.stringify(queued),
        { expirationTtl: 86400 }
      );

      // Increment counter
      const counterRaw = await env.WEBHOOK_QUEUE.get('stats:total');
      const counter = parseInt(counterRaw || '0') + 1;
      await env.WEBHOOK_QUEUE.put('stats:total', counter.toString());

      return json({
        ok: true,
        id,
        source,
        queued_at: queued.received_at,
      });
    }

    return json({ error: 'Not found' }, 404);
  },
};
