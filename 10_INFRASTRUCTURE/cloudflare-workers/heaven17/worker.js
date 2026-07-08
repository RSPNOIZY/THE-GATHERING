/**
 * NOIZY.AI — Cloudflare Worker
 * Serves the coming soon landing page and handles email signups.
 *
 * Deploy: wrangler deploy
 * Bindings: KV namespace SIGNUPS for email collection
 *
 * Author: Robert Stephen Plowman / MC96ECO
 */

// The HTML is inlined at build time — paste the full index.html content
// between the backticks, or use wrangler assets for the production version.

const HTML = `%%HTML_CONTENT%%`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle email signup API
    if (url.pathname === '/api/signup' && request.method === 'POST') {
      try {
        const { email, ts } = await request.json();

        if (!email || !email.includes('@')) {
          return new Response(JSON.stringify({ error: 'Invalid email' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Store in KV if bound, otherwise just acknowledge
        if (env.SIGNUPS) {
          await env.SIGNUPS.put(`signup:${email}`, JSON.stringify({
            email,
            signed_up_at: ts || new Date().toISOString(),
            source: 'noizy.ai',
            ip: request.headers.get('CF-Connecting-IP') || 'unknown',
            country: request.headers.get('CF-IPCountry') || 'unknown',
          }));
        }

        return new Response(JSON.stringify({ ok: true }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'https://noizy.ai',
          },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Server error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': 'https://noizy.ai',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Serve the landing page for all other routes
    return new Response(HTML, {
      headers: {
        'Content-Type': 'text/html;charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      },
    });
  },
};
