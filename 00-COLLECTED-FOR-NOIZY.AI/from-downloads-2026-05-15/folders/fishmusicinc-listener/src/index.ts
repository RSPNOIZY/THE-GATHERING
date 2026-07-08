// =============================================================================
// fishmusicinc.com · THE LISTENER WHO NEVER SIGNS UP
// -----------------------------------------------------------------------------
// Cloudflare Worker · single file · seven breaths · no extraction.
//
// Doctrine
// --------
// "There will be no confusion, no distractions, no selling — only support,
//  amplification, and assisted curiosity."  — RSP_001 · MMXXVI
//
// Routing
// -------
//   GET /                       → the page (HTML, ~8KB on the wire)
//   GET /api/breath             → today's signal (1 line of text, JSON)
//   GET /signal.mp3             → single ambient track, lazy from R2
//   GET /robots.txt             → "everyone welcome, we measure nothing"
//   GET /humans.txt             → who built this
//   GET /privacy                → "this page collects nothing"
//   GET /.well-known/security.txt → contact for security disclosures
//   GET /sitemap.xml            → minimal sitemap (just /)
//
// Anti-routing
// ------------
// The Worker INTENTIONALLY returns the page (200) for any path that doesn't
// match the table above. There is no 404 page. A reader who arrives at
// `/store` or `/blog` does not see "page not found" — they see the dock,
// because that's all there is. This is a refusal of the assumption that
// every URL on every domain must lead somewhere different.
//
// =============================================================================

export interface Env {
  /** Optional R2 bucket binding for the ambient signal mp3. */
  AUDIO_BUCKET?: R2Bucket;
  /** Optional KV for rotating signals. If unbound, falls back to embedded list. */
  SIGNALS_KV?: KVNamespace;
}

// =============================================================================
// THE PAGE
// =============================================================================

const PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Fish Music Inc.</title>
  <meta name="description" content="The fish have begun to sing again. A NOIZY Empire company.">
  <meta name="theme-color" content="#0A1628">
  <meta name="referrer" content="no-referrer">
  <meta name="robots" content="index, follow, noimageindex">
  <meta property="og:title" content="Fish Music Inc.">
  <meta property="og:description" content="The fish have begun to sing again.">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="en_CA">
  <link rel="canonical" href="https://fishmusicinc.com/">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Inter:wght@300;400&display=swap">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>%F0%9F%90%9F</text></svg>">
  <style>
    :root {
      --ocean: #0A1628;
      --cream: #F5F1E8;
      --cream-85: rgba(245, 241, 232, 0.85);
      --cream-60: rgba(245, 241, 232, 0.60);
      --cream-30: rgba(245, 241, 232, 0.30);
      --cream-10: rgba(245, 241, 232, 0.10);
      --gold: #C9A961;
      --gold-soft: rgba(201, 169, 97, 0.20);
      --gold-glow: rgba(201, 169, 97, 0.10);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    html, body {
      background: var(--ocean);
      color: var(--cream);
      min-height: 100vh;
    }

    body {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-weight: 300;
      line-height: 1.7;
      overflow-x: hidden;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    main { display: block; }

    section {
      min-height: 100vh;
      min-height: 100svh;     /* small viewport for iOS Safari */
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 1.5rem;
      max-width: 720px;
      margin: 0 auto;
      text-align: center;
    }

    .masthead {
      font-family: 'Cinzel', 'Trajan Pro', serif;
      font-weight: 500;
      font-size: clamp(2rem, 6vw, 4rem);
      letter-spacing: 0.18em;
      color: var(--gold);
      margin-bottom: 6rem;
      line-height: 1.1;
      max-width: 100%;
      word-spacing: 0.4em;
    }

    .breath {
      font-style: italic;
      font-weight: 300;
      font-size: clamp(1.1rem, 2vw, 1.5rem);
      color: var(--cream-85);
      max-width: 540px;
      line-height: 1.7;
    }

    .gospel {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-weight: 400;
      font-size: clamp(1.5rem, 3vw, 2.25rem);
      line-height: 1.4;
      color: var(--cream);
    }

    .gospel + .gospel { margin-top: 2rem; }

    .stamp {
      font-family: 'Inter', system-ui, sans-serif;
      font-weight: 300;
      font-size: 0.7rem;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: var(--cream-60);
      margin-top: 4rem;
      line-height: 1.8;
    }

    a {
      color: var(--gold);
      text-decoration: none;
      border-bottom: 1px solid transparent;
      transition: border-color 0.4s ease;
      padding-bottom: 2px;
    }
    a:hover, a:focus-visible {
      border-bottom-color: var(--gold);
      outline: none;
    }
    a:focus-visible {
      outline: 2px solid var(--gold);
      outline-offset: 6px;
    }

    /* the only motion on the page */
    .scroll-cue {
      position: fixed;
      bottom: max(2rem, env(safe-area-inset-bottom));
      left: 50%;
      transform: translateX(-50%);
      font-family: 'Inter', system-ui, sans-serif;
      font-weight: 300;
      font-size: 0.7rem;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: var(--cream-30);
      animation: breathe 4s ease-in-out infinite;
      pointer-events: none;
      transition: opacity 0.6s ease;
      text-align: center;
    }
    .scroll-cue::after {
      content: '';
      display: block;
      margin: 0.5rem auto 0;
      width: 1px;
      height: 0.7rem;
      background: var(--cream-30);
    }
    .scroll-cue.hidden { opacity: 0; }

    @keyframes breathe {
      0%, 100% { opacity: 0.3; }
      50%      { opacity: 0.7; }
    }

    /* the listen widget — gentle, opt-in */
    .listen {
      margin-top: 3rem;
      padding: 2rem 1.5rem;
      border: 1px solid var(--gold-soft);
      border-radius: 2px;
      max-width: 380px;
      width: 100%;
    }
    .listen p {
      font-size: 0.85rem;
      color: var(--cream-60);
      margin-bottom: 1.5rem;
      letter-spacing: 0.05em;
    }
    button.play-btn {
      background: transparent;
      border: 1px solid var(--gold);
      color: var(--gold);
      padding: 0.8rem 2rem;
      font-family: 'Inter', system-ui, sans-serif;
      font-weight: 300;
      font-size: 0.8rem;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      cursor: pointer;
      transition: background 0.3s ease;
      min-height: 44px;
      min-width: 180px;
    }
    button.play-btn:hover, button.play-btn:focus-visible {
      background: var(--gold-glow);
      outline: none;
    }
    button.play-btn:focus-visible {
      outline: 2px solid var(--gold);
      outline-offset: 4px;
    }

    /* outbound link section */
    .door {
      font-family: 'Cinzel', serif;
      font-weight: 500;
      font-size: clamp(1.3rem, 2.5vw, 1.8rem);
      letter-spacing: 0.15em;
      margin-top: 1rem;
    }

    /* honour vestibular needs absolutely */
    @media (prefers-reduced-motion: reduce) {
      .scroll-cue { animation: none; opacity: 0.4; }
      a, button { transition: none; }
    }
  </style>
</head>
<body>
  <main>

    <!-- BREATH 1 · ARRIVAL -->
    <section aria-label="Welcome">
      <h1 class="masthead">Fish&nbsp;Music&nbsp;Inc.</h1>
      <p class="breath">You found the dock.</p>
    </section>

    <!-- BREATH 2 · THE SIGNAL -->
    <section aria-label="The Signal">
      <p class="gospel">The fish have begun</p>
      <p class="gospel">to sing again.</p>
    </section>

    <!-- BREATH 3 · REFUSAL OF EXTRACTION -->
    <section aria-label="What this page does not do">
      <p class="breath">There is nothing to buy here.</p>
      <p class="breath" style="margin-top:1rem;">There is nothing to sign.</p>
      <p class="breath" style="margin-top:1rem;">You are not being measured.</p>
    </section>

    <!-- BREATH 4 · THE GOSPEL -->
    <section aria-label="The Gospel">
      <p class="gospel">artists take seventy-five percent.</p>
      <p class="gospel">consent is sacred.</p>
      <p class="gospel">music is liberation.</p>
    </section>

    <!-- BREATH 5 · LIFELUV -->
    <section aria-label="What we are building">
      <p class="breath">Some songs outlive the singer.</p>
      <p class="breath" style="margin-top:0.5rem;">Some voices outlive the throat.</p>
      <p class="breath" style="margin-top:2rem;">We are building the place</p>
      <p class="breath" style="margin-top:0.25rem;">where they can stay.</p>
    </section>

    <!-- BREATH 6 · THE OFFER -->
    <section aria-label="A signal, if you'd like">
      <p class="breath">Listen, if you'd like.</p>
      <div class="listen">
        <p>One ambient signal. Loops gently. No commitment.</p>
        <button class="play-btn" type="button" id="play-btn"
                onclick="toggleSignal()" aria-pressed="false">
          ▷&nbsp;&nbsp;Play
        </button>
        <audio id="signal" preload="none" loop>
          <source src="/signal.mp3" type="audio/mpeg">
        </audio>
      </div>
    </section>

    <!-- BREATH 7 · THE DOORS -->
    <section aria-label="Onward">
      <p class="breath">When you're ready,</p>
      <p class="door"><a href="https://noizy.ai" rel="noopener">noizy.ai</a></p>
      <p class="stamp">
        Est. MMXXVI &nbsp;·&nbsp; Montréal &nbsp;·&nbsp; QC<br>
        A NOIZY Empire company
      </p>
    </section>

  </main>

  <div class="scroll-cue" id="scroll-cue" role="presentation" aria-hidden="true">
    scroll · breathe
  </div>

  <script>
    // hide scroll cue after first scroll past 100px
    (function () {
      var cue = document.getElementById('scroll-cue');
      var hidden = false;
      window.addEventListener('scroll', function () {
        if (!hidden && window.scrollY > 100) {
          hidden = true;
          cue.classList.add('hidden');
        }
      }, { passive: true });
    })();

    // gentle audio toggle, no autoplay
    function toggleSignal() {
      var a = document.getElementById('signal');
      var btn = document.getElementById('play-btn');
      if (!a) return;
      if (a.paused) {
        a.volume = 0.4;
        var p = a.play();
        if (p && p.catch) p.catch(function () {});
        btn.textContent = '◼  Pause';
        btn.setAttribute('aria-pressed', 'true');
      } else {
        a.pause();
        btn.textContent = '▷  Play';
        btn.setAttribute('aria-pressed', 'false');
      }
    }
  </script>
</body>
</html>
`;

// =============================================================================
// ROTATING SIGNALS
// -----------------------------------------------------------------------------
// /api/breath returns one line of text per UTC day. The line rotates through
// a curated set. If a KV namespace SIGNALS_KV is bound, signals can be edited
// without redeploying — KV key "signals" should hold a JSON array of strings.
// =============================================================================

const FALLBACK_SIGNALS: string[] = [
  "The fish have begun to sing again.",
  "Some songs outlive the singer.",
  "Consent is the song before the song.",
  "There is nothing here that wants to be sold.",
  "Listen with your whole face.",
  "The dock is always open.",
  "Music is liberation. The rest is paperwork.",
  "What you brought with you is enough.",
  "Sovereign frequencies, gentle delivery.",
  "The fish remember the rivers.",
];

async function getSignals(env: Env): Promise<string[]> {
  if (env.SIGNALS_KV) {
    try {
      const raw = await env.SIGNALS_KV.get("signals");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
          return parsed;
        }
      }
    } catch { /* fall through */ }
  }
  return FALLBACK_SIGNALS;
}

function todaySignal(signals: string[]): string {
  // Same line for the whole UTC day. Stable across viewers, rotates daily.
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  return signals[dayIndex % signals.length];
}

// =============================================================================
// ANCILLARY ROUTES (the kind of thing crawlers look for)
// =============================================================================

const ROBOTS_TXT = `# fishmusicinc.com · we measure nothing
User-agent: *
Allow: /

# This site sets no cookies, runs no analytics, and has no advertising.
# You are welcome to crawl freely. There is nothing here to extract.

Sitemap: https://fishmusicinc.com/sitemap.xml
`;

const HUMANS_TXT = `/* TEAM */
  Founder & Composer:    Robert Stephen Plowman (RSP_001)
  Empire:                NOIZY Empire
  Parent:                Fish Music Inc.
  Established:           MMXXVI
  Location:              Montréal, Québec, Canada

/* SITE */
  Doctrine:              No confusion. No distractions. No selling.
  Made with:             Cloudflare Workers, Cinzel, Cormorant Garamond,
                         and the deliberate refusal of attention extraction.
  Standard:              The Plowman Standard (75/25, public)
  Cookies:               None.
  Analytics:             None.
  Trackers:              None.
  Newsletters:           None.

/* THANKS */
  Thanks for visiting. You are not the product.
`;

const PRIVACY_TXT = `# Privacy

This page collects no personal information about you.
No cookies are set. No analytics scripts run. No trackers are loaded.
We do not log your IP address, browser, or any identifier.

You can verify this by inspecting the HTML and the network tab.
What you see is all there is.

If you reach out to us at rsp@noizy.ai, your email will arrive in
a Cloudflare Email Routing inbox forwarded to a personal address.
We do not share, sell, or process that mail in any other way.

That is the entire policy.

— RSP_001
`;

const SECURITY_TXT = `# https://fishmusicinc.com/.well-known/security.txt
Contact: mailto:rsp@noizy.ai
Preferred-Languages: en, fr
Canonical: https://fishmusicinc.com/.well-known/security.txt
Policy: https://fishmusicinc.com/privacy
Acknowledgments: https://fishmusicinc.com/humans.txt
`;

const SITEMAP_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://fishmusicinc.com/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;

// =============================================================================
// HEADER POLICY
// -----------------------------------------------------------------------------
// Every response from this Worker carries:
//   - strict CSP that disables third-party scripts entirely
//   - no-referrer (don't leak who's coming to where)
//   - no analytics
//   - x-powered-by stamped to NOIZY/RSP_001 (the page's signature)
// =============================================================================

const SECURITY_HEADERS: Record<string, string> = {
  "content-security-policy": [
    "default-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    "media-src 'self'",
    "script-src 'self' 'unsafe-inline'", // tiny inline script for play toggle + scroll cue
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'none'",
  ].join("; "),
  "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "x-frame-options": "DENY",
  "permissions-policy": [
    "accelerometer=()",
    "autoplay=()",
    "camera=()",
    "display-capture=()",
    "geolocation=()",
    "gyroscope=()",
    "magnetometer=()",
    "microphone=()",
    "midi=()",
    "payment=()",
    "usb=()",
  ].join(", "),
  // The page's signature
  "x-powered-by": "NOIZY/RSP_001",
  "x-listener-respect": "absolute",
};

function withSecurityHeaders(init: ResponseInit & { headers?: Record<string, string> } = {}): ResponseInit {
  return {
    ...init,
    headers: {
      ...SECURITY_HEADERS,
      ...(init.headers ?? {}),
    },
  };
}

// =============================================================================
// REQUEST HANDLER
// =============================================================================

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    // Only GET (and HEAD) are supported. Everything else gets 405.
    if (method !== "GET" && method !== "HEAD") {
      return new Response("Method Not Allowed", withSecurityHeaders({
        status: 405,
        headers: { "content-type": "text/plain", "allow": "GET, HEAD" },
      }));
    }

    // ─── /api/breath ───────────────────────────────────────────────
    if (path === "/api/breath") {
      const signals = await getSignals(env);
      const signal = todaySignal(signals);
      return new Response(
        JSON.stringify({
          signal,
          generated_at: new Date().toISOString(),
          source: "fishmusicinc.com",
        }, null, 2),
        withSecurityHeaders({
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "public, max-age=3600, s-maxage=3600",
          },
        }),
      );
    }

    // ─── /signal.mp3 ───────────────────────────────────────────────
    // Lazy fetch from R2 if bound; otherwise serve a tiny silent placeholder.
    if (path === "/signal.mp3") {
      if (env.AUDIO_BUCKET) {
        const obj = await env.AUDIO_BUCKET.get("signal.mp3");
        if (obj) {
          return new Response(obj.body, withSecurityHeaders({
            headers: {
              "content-type": "audio/mpeg",
              "cache-control": "public, max-age=86400, s-maxage=86400",
              "accept-ranges": "bytes",
              "content-length": String(obj.size),
            },
          }));
        }
      }
      // Placeholder: a 1-second silent mp3 (returned as 204 No Content
      // when no audio is provisioned, so the page doesn't break).
      return new Response(null, withSecurityHeaders({
        status: 204,
        headers: { "content-type": "audio/mpeg" },
      }));
    }

    // ─── /robots.txt ───────────────────────────────────────────────
    if (path === "/robots.txt") {
      return new Response(ROBOTS_TXT, withSecurityHeaders({
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "public, max-age=86400",
        },
      }));
    }

    // ─── /humans.txt ───────────────────────────────────────────────
    if (path === "/humans.txt") {
      return new Response(HUMANS_TXT, withSecurityHeaders({
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "public, max-age=86400",
        },
      }));
    }

    // ─── /privacy ──────────────────────────────────────────────────
    if (path === "/privacy" || path === "/privacy.txt") {
      return new Response(PRIVACY_TXT, withSecurityHeaders({
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "public, max-age=3600",
        },
      }));
    }

    // ─── /.well-known/security.txt ─────────────────────────────────
    if (path === "/.well-known/security.txt" || path === "/security.txt") {
      return new Response(SECURITY_TXT, withSecurityHeaders({
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "public, max-age=86400",
        },
      }));
    }

    // ─── /sitemap.xml ──────────────────────────────────────────────
    if (path === "/sitemap.xml") {
      return new Response(SITEMAP_XML, withSecurityHeaders({
        headers: {
          "content-type": "application/xml; charset=utf-8",
          "cache-control": "public, max-age=86400",
        },
      }));
    }

    // ─── ANY OTHER PATH: return the page ──────────────────────────
    // Doctrine: there is no 404. Wherever you are, the dock is here.
    return new Response(PAGE_HTML, withSecurityHeaders({
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=3600, s-maxage=3600",
      },
    }));
  },
};
