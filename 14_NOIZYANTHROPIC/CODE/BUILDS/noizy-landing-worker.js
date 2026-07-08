// ─────────────────────────────────────────────────────────────────────────────
//  noizy.ai — Holding Page Worker
//  NOIZYFISH INC. © 2026
//  Built by Robert Stephen Plowman
//
//  DEPLOY (≈ 2 min):
//    1. https://dash.cloudflare.com  →  Workers & Pages
//    2. Open the existing Worker currently routing noizy.ai  (named "deploy")
//    3. Edit Code  →  paste this entire file over the old code
//    4. Save and Deploy
//    5. Confirm the Worker's Route covers:  noizy.ai/*  and  www.noizy.ai/*
//
//  OPTIONAL (persist email signups — add later, takes 30 sec):
//    Worker  →  Settings  →  Variables  →  KV Namespace Bindings
//      Variable name:  EMAILS_KV
//      KV namespace:   (select or create — e.g. "noizy-signups")
//    Without the binding, signups still succeed and are written to the
//    Worker's live log stream (wrangler tail / dashboard "Logs" tab).
// ─────────────────────────────────────────────────────────────────────────────

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>NOIZY — Consent-native creative infrastructure</title>
<meta name="description" content="Human Voice Sovereignty. The Plowman Standard — 75/25, perpetual, constitutional. Built by Robert Stephen Plowman.">
<meta name="theme-color" content="#0a0a0a">
<meta property="og:title" content="NOIZY — Consent-native creative infrastructure">
<meta property="og:description" content="Human Voice Sovereignty. The Plowman Standard — 75/25, perpetual, constitutional.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://noizy.ai">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%230a0a0a'/%3E%3Ctext x='50' y='72' font-family='-apple-system,sans-serif' font-size='64' font-weight='900' text-anchor='middle' fill='%23d4ff00'%3EZ%3C/text%3E%3C/svg%3E">
<style>
  *,*::before,*::after { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --bg: #0a0a0a;
    --fg: #f5f5f0;
    --muted: #8a8a85;
    --accent: #d4ff00;
    --line: #1f1f1f;
    --err: #ff5555;
  }
  html { height: 100%; }
  body {
    background: var(--bg);
    color: var(--fg);
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 5vh 6vw;
  }
  header, main, footer { width: 100%; max-width: 780px; margin: 0 auto; }

  .logo {
    font-size: clamp(56px, 11vw, 128px);
    font-weight: 900;
    letter-spacing: -0.045em;
    line-height: 0.9;
    user-select: none;
  }
  .logo span { color: var(--accent); }

  main { padding: 10vh 0 6vh; }

  .kicker {
    font-size: 12px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 28px;
  }
  .kicker::before {
    content: "";
    display: inline-block;
    width: 28px;
    height: 1px;
    background: var(--muted);
    vertical-align: middle;
    margin-right: 12px;
  }

  h1 {
    font-size: clamp(32px, 5.2vw, 60px);
    font-weight: 500;
    line-height: 1.08;
    letter-spacing: -0.02em;
    margin-bottom: 36px;
    max-width: 18ch;
  }

  .lede {
    font-size: clamp(16px, 1.35vw, 19px);
    line-height: 1.65;
    color: var(--muted);
    max-width: 58ch;
    margin-bottom: 56px;
  }
  .lede strong { color: var(--fg); font-weight: 500; }

  form {
    display: flex;
    align-items: center;
    gap: 8px;
    max-width: 480px;
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
    padding: 6px 0;
    transition: border-color 0.2s;
  }
  form:focus-within { border-color: var(--accent); }

  input[type="email"] {
    flex: 1;
    background: transparent;
    border: 0;
    color: var(--fg);
    font: inherit;
    font-size: 16px;
    padding: 14px 4px;
    outline: none;
  }
  input[type="email"]::placeholder { color: var(--muted); }

  button {
    background: transparent;
    border: 0;
    color: var(--accent);
    font: inherit;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    padding: 14px 8px;
    cursor: pointer;
    white-space: nowrap;
    transition: opacity 0.15s;
  }
  button:hover { opacity: 0.7; }
  button:disabled { opacity: 0.3; cursor: not-allowed; }

  .msg {
    margin-top: 16px;
    font-size: 13px;
    letter-spacing: 0.04em;
    color: var(--muted);
    min-height: 20px;
  }
  .msg.ok  { color: var(--accent); }
  .msg.err { color: var(--err); }

  footer {
    padding-top: 5vh;
    border-top: 1px solid var(--line);
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--muted);
  }

  @media (max-width: 640px) {
    body { padding: 4vh 5vw; }
    main { padding: 6vh 0 3vh; }
    footer { flex-direction: column; gap: 6px; }
  }

  @media (prefers-reduced-motion: no-preference) {
    main > * { animation: rise 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
    main > *:nth-child(2) { animation-delay: 0.08s; }
    main > *:nth-child(3) { animation-delay: 0.16s; }
    main > *:nth-child(4) { animation-delay: 0.24s; }
    @keyframes rise {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  }
</style>
</head>
<body>
  <header>
    <div class="logo">NOI<span>Z</span>Y</div>
  </header>

  <main>
    <div class="kicker">Now building — 2026</div>
    <h1>Consent-native creative infrastructure.</h1>
    <p class="lede">
      <strong>Human Voice Sovereignty.</strong> The Plowman Standard — 75/25, perpetual, constitutional.
      Built to protect identity, authorship, and legacy in the age of synthetic media.
    </p>

    <form id="signup" autocomplete="on" novalidate>
      <input type="email" name="email" id="email" placeholder="your@email.com" required aria-label="Email address">
      <button type="submit" id="submit">Get notified →</button>
    </form>
    <div class="msg" id="msg" role="status" aria-live="polite"></div>
  </main>

  <footer>
    <div>© NOIZYFISH INC. — Ottawa, Canada</div>
    <div>Built by Robert Stephen Plowman</div>
  </footer>

<script>
  (function () {
    const form = document.getElementById('signup');
    const msg  = document.getElementById('msg');
    const btn  = document.getElementById('submit');
    const input = document.getElementById('email');
    const EMAIL_RE = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const email = input.value.trim();
      if (!EMAIL_RE.test(email)) {
        msg.textContent = 'Please enter a valid email address.';
        msg.className = 'msg err';
        return;
      }
      btn.disabled = true;
      msg.textContent = 'Sending…';
      msg.className = 'msg';
      try {
        const r = await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email })
        });
        if (r.ok) {
          msg.textContent = 'Welcome. We will be in touch.';
          msg.className = 'msg ok';
          form.reset();
        } else {
          const t = await r.text();
          msg.textContent = t || 'Something went wrong. Please try again.';
          msg.className = 'msg err';
        }
      } catch (err) {
        msg.textContent = 'Network error. Please try again.';
        msg.className = 'msg err';
      } finally {
        btn.disabled = false;
      }
    });
  })();
</script>
</body>
</html>`;

// ─── Worker handler ──────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Email capture endpoint
    if (url.pathname === '/api/signup') {
      if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
      }
      try {
        const { email } = await request.json();
        if (!email || typeof email !== 'string' || !EMAIL_RE.test(email)) {
          return new Response('Invalid email', { status: 400 });
        }

        const record = {
          email: email.trim().toLowerCase(),
          ts: new Date().toISOString(),
          ip: request.headers.get('CF-Connecting-IP') || null,
          country: (request.cf && request.cf.country) || null,
          ua: request.headers.get('User-Agent') || null,
          ref: request.headers.get('Referer') || null,
        };

        // Persist to KV if bound; otherwise write to live logs
        if (env && env.EMAILS_KV) {
          const key = `signup:${record.ts}:${record.email}`;
          await env.EMAILS_KV.put(key, JSON.stringify(record));
        } else {
          console.log('[noizy.ai signup]', JSON.stringify(record));
        }

        return new Response('OK', {
          status: 200,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      } catch (e) {
        return new Response('Bad request', { status: 400 });
      }
    }

    // Health check
    if (url.pathname === '/healthz') {
      return new Response('ok', {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    // robots.txt — allow all for now
    if (url.pathname === '/robots.txt') {
      return new Response('User-agent: *\nAllow: /\n', {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    // Default: serve landing page (all other routes)
    return new Response(HTML, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=60',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Permissions-Policy': 'interest-cohort=()',
      },
    });
  },
};
