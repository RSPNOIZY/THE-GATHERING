/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 *   HEAVEN WORKER — NOIZYNET DISPATCH EXTENSION
 *   Add this to heaven/worker.js to enable GOD ↔ Edge handshake
 *
 *   This code extends the existing worker.js with:
 *   1. /api/handshake  — Initiates handshake with GOD
 *   2. /api/dispatch   — Proxies requests through tunnel to GOD services
 *   3. /api/agents     — Lists available agents on GOD
 *
 *   GORUNFREE — April 2026
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ── Add this ABOVE the existing switch(subdomain) block in worker.js ─────────

// NOIZYNET Configuration
const NOIZYNET_TUNNEL = 'https://noizynet.noizy.ai'; // Set after cloudflared tunnel
const NOIZYNET_SECRET = 'GORUNFREE-2026';

function createHMACToken(secret) {
  // Workers have access to crypto.subtle
  const timestamp = Date.now().toString();
  // For simplicity in Workers, use a basic token exchange
  // Production: implement SubtleCrypto HMAC
  return `${timestamp}:${secret}`;
}

// ── NOIZYNET API ROUTES ──────────────────────────────────────────────────────
// Insert into handlePortal() or create a new handleNOIZYNET() handler

async function handleNOIZYNET(request, env, url) {
  const path = url.pathname;

  // ── HANDSHAKE: Heaven → GOD ────────────────────────────────────────────────
  if (path === '/api/handshake' || path === '/api/noizynet/handshake') {
    try {
      const tunnelUrl = env.NOIZYNET_TUNNEL || NOIZYNET_TUNNEL;
      const token = env.NOIZYNET_SECRET || NOIZYNET_SECRET;

      const response = await fetch(`${tunnelUrl}/handshake`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-NOIZYNET-Token': token,
          'User-Agent': 'Heaven/1.0 (Cloudflare Worker)',
        },
        body: JSON.stringify({
          origin: 'heaven-worker',
          edge: request.cf?.colo || 'unknown',
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      return json({
        heaven: 'CONNECTED',
        edge: {
          colo: request.cf?.colo || 'unknown',
          country: request.cf?.country || 'unknown',
          city: request.cf?.city || 'unknown',
          asn: request.cf?.asn || null,
        },
        god: data,
        message: '🜂 Heaven ↔ GOD handshake complete. NOIZYNET is live. GORUNFREE.',
      });
    } catch (err) {
      return json({
        heaven: 'DISCONNECTED',
        error: err.message,
        fallback: 'HEAVEN is operational on edge but cannot reach GOD',
        hint: 'Ensure cloudflared tunnel is running on M2 Ultra',
        message: '🜂 Heaven is alive. GOD is asleep. Wake the tunnel.',
      }, 503);
    }
  }

  // ── DISPATCH: Route request to GOD service ─────────────────────────────────
  if (path === '/api/dispatch' || path === '/api/noizynet/dispatch') {
    if (request.method !== 'POST') {
      return json({ error: 'POST required', usage: {
        target: 'heaven17|dreamchamber|gorunfree|bridge|ollama|n8n',
        method: 'GET|POST',
        path: '/health',
        payload: {},
      }}, 405);
    }

    try {
      const body = await request.json();
      const tunnelUrl = env.NOIZYNET_TUNNEL || NOIZYNET_TUNNEL;
      const token = env.NOIZYNET_SECRET || NOIZYNET_SECRET;

      const response = await fetch(`${tunnelUrl}/dispatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-NOIZYNET-Token': token,
          'User-Agent': 'Heaven/1.0 (Cloudflare Worker)',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      return json(data);
    } catch (err) {
      return json({ error: 'DISPATCH_FAILED', message: err.message }, 502);
    }
  }

  // ── AGENTS: List what's available on GOD ───────────────────────────────────
  if (path === '/api/agents' || path === '/api/noizynet/agents') {
    return json({
      agents: {
        registered: [
          { id: 'gabriel',         status: 'active', role: 'Voice + Control',     port: 17017 },
          { id: 'mc96',            status: 'active', role: 'Core Universe Engine', port: null },
          { id: 'system-guardian', status: 'stub',   role: 'System Monitoring',    port: null },
        ],
        pending: [
          { id: 'lucy',           role: 'Intimate Companion (Heaven fork)' },
          { id: 'shirl',          role: 'Family Guardian' },
          { id: 'dream',          role: 'Dream Weaver' },
          { id: 'pops',           role: 'Wisdom Keeper' },
          { id: 'engra_keith',    role: 'Engineering Mentor' },
          { id: 'cb01',           role: 'Creative Builder' },
          { id: 'euro',           role: 'European Liaison' },
          { id: 'heaven',         role: 'Dispatcher (this worker)' },
        ],
      },
      dispatch: {
        endpoint: '/api/dispatch',
        method: 'POST',
        example: {
          target: 'heaven17',
          method: 'POST',
          path: '/process',
          payload: { text: 'Hello from Heaven' },
        },
      },
      gorunfree: true,
    });
  }

  // ── STATUS: Full NOIZYNET overview ─────────────────────────────────────────
  if (path === '/api/noizynet/status') {
    try {
      const tunnelUrl = env.NOIZYNET_TUNNEL || NOIZYNET_TUNNEL;
      const token = env.NOIZYNET_SECRET || NOIZYNET_SECRET;

      const response = await fetch(`${tunnelUrl}/status`, {
        headers: { 'X-NOIZYNET-Token': token },
      });
      const data = await response.json();

      return json({
        edge: { status: 'operational', worker: 'heaven' },
        god: data,
        bridge: 'CONNECTED',
        message: '🜂 NOIZYNET operational across edge + GOD. GORUNFREE.',
      });
    } catch (err) {
      return json({
        edge: { status: 'operational', worker: 'heaven' },
        god: { status: 'unreachable' },
        bridge: 'DISCONNECTED',
      }, 200);
    }
  }

  return null; // Not a NOIZYNET route — fall through
}


// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRATION INSTRUCTIONS
// ═══════════════════════════════════════════════════════════════════════════════
//
// In worker.js, add this BEFORE the switch(subdomain) block:
//
//   // ── NOIZYNET API (any subdomain) ──────────────────
//   if (path.startsWith('/api/noizynet/') || path === '/api/handshake' || path === '/api/dispatch' || path === '/api/agents') {
//     const noizynetResponse = await handleNOIZYNET(request, env, url);
//     if (noizynetResponse) return noizynetResponse;
//   }
//
// In wrangler.toml, add:
//
//   [vars]
//   NOIZYNET_TUNNEL = "https://noizynet.noizy.ai"
//
// Then set secret:
//   wrangler secret put NOIZYNET_SECRET
//
// ═══════════════════════════════════════════════════════════════════════════════
