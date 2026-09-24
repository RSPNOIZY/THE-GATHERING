// ═══════════════════════════════════════════════════════════════════════════
// NOIZYLAB EDGE - Zero Trust Gateway to GABRIEL
// ═══════════════════════════════════════════════════════════════════════════

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") return cors(env);

    try {
      if (path === "/health") return health(env);
      if (path === "/" || path === "/dashboard") return dashboard();
      
      // GABRIEL routes
      if (path === "/gabriel/exec" && request.method === "POST") return gabrielExec(request, env);
      if (path === "/gabriel/status") return gabrielStatus(env);
      if (path.startsWith("/gabriel/")) return gabrielProxy(request, env, path.replace("/gabriel", ""));
      
      // AI routes
      if (path === "/ai" && request.method === "POST") return ai(request, env);
      if (path === "/speak" && request.method === "POST") return speak(request, env, ctx);
      if (path === "/tts" && request.method === "POST") return tts(request, env, ctx);
      
      if (path === "/voices") return voices(env);

      return json({ error: "Not found", path }, 404, env);
    } catch (e) {
      return json({ error: e.message }, 500, env);
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// GABRIEL TUNNEL
// ═══════════════════════════════════════════════════════════════════════════

async function gabrielExec(request, env) {
  const body = await safeJson(request);
  const cmd = body.cmd || "";
  
  if (!cmd) return json({ error: "No command" }, 400, env);
  if (!env.GABRIEL_URL) return json({ error: "GABRIEL_URL not configured" }, 503, env);
  if (isDangerous(cmd)) return json({ error: "Command blocked" }, 403, env);
  
  try {
    const res = await fetch(`${env.GABRIEL_URL}/exec`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...accessHeaders(env) },
      body: JSON.stringify({ cmd, timeout: body.timeout || 30 })
    });
    return new Response(res.body, { status: res.status, headers: { "Content-Type": "application/json", ...corsHeaders(env) } });
  } catch (e) {
    return json({ error: `GABRIEL unreachable: ${e.message}` }, 502, env);
  }
}

async function gabrielStatus(env) {
  if (!env.GABRIEL_URL) return json({ status: "unconfigured", tunnel: null }, 503, env);
  
  try {
    const start = Date.now();
    const res = await fetch(`${env.GABRIEL_URL}/health`, { headers: accessHeaders(env) });
    const latency = Date.now() - start;
    const data = await res.json().catch(() => ({}));
    return json({ status: res.ok ? "online" : "error", latency_ms: latency, tunnel: "connected", gabriel: data }, 200, env);
  } catch (e) {
    return json({ status: "offline", tunnel: "disconnected", error: e.message }, 200, env);
  }
}

async function gabrielProxy(request, env, path) {
  if (!env.GABRIEL_URL) return json({ error: "GABRIEL_URL not configured" }, 503, env);
  
  try {
    const res = await fetch(`${env.GABRIEL_URL}${path}`, {
      method: request.method,
      headers: { ...Object.fromEntries(request.headers), ...accessHeaders(env) },
      body: request.method !== "GET" ? request.body : undefined
    });
    return new Response(res.body, { status: res.status, headers: res.headers });
  } catch (e) {
    return json({ error: `Proxy failed: ${e.message}` }, 502, env);
  }
}

function accessHeaders(env) {
  if (env.CF_ACCESS_CLIENT_ID && env.CF_ACCESS_CLIENT_SECRET) {
    return { "CF-Access-Client-Id": env.CF_ACCESS_CLIENT_ID, "CF-Access-Client-Secret": env.CF_ACCESS_CLIENT_SECRET };
  }
  return {};
}

function isDangerous(cmd) {
  const patterns = [/rm\s+-rf\s+[\/\\]/, /format\s+[a-z]:/i, /del\s+\/[sq]/i, /shutdown/i, /restart/i];
  return patterns.some(p => p.test(cmd));
}

// ═══════════════════════════════════════════════════════════════════════════
// AI + TTS
// ═══════════════════════════════════════════════════════════════════════════

async function ai(request, env) {
  const body = await safeJson(request);
  if (!body.prompt) return json({ error: "No prompt" }, 400, env);
  if (!env.AI) return json({ error: "AI not configured" }, 503, env);

  const start = Date.now();
  const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
    messages: [
      { role: "system", content: "You are NOIZYLAB AI. Be concise and direct." },
      { role: "user", content: body.prompt }
    ],
    max_tokens: body.max_tokens || 500
  });

  return json({ response: response.response, ms: Date.now() - start }, 200, env);
}

async function speak(request, env, ctx) {
  const body = await safeJson(request);
  if (!body.prompt) return json({ error: "No prompt" }, 400, env);
  if (!env.AI || !env.ELEVENLABS_API_KEY) return json({ error: "AI/TTS not configured" }, 503, env);

  const aiRes = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
    messages: [
      { role: "system", content: "You are NOIZYLAB AI. Keep response under 150 words." },
      { role: "user", content: body.prompt }
    ],
    max_tokens: 300
  });

  const text = aiRes.response;
  const audioBuf = await elevenLabs(env, text, body.mode || "tech");

  return audio(audioBuf, env, { "x-genius-text": encodeURIComponent(text.slice(0, 500)) });
}

async function tts(request, env, ctx) {
  if (env.GENIUS01_HMAC_SECRET) {
    const err = await verifyHmac(request, env);
    if (err) return json({ error: err }, 401, env);
  }

  const body = await safeJson(request);
  if (!body.text) return json({ error: "No text" }, 400, env);
  if (!env.ELEVENLABS_API_KEY) return json({ error: "TTS not configured" }, 503, env);

  const audioBuf = await elevenLabs(env, body.text, body.mode || "tech");
  return audio(audioBuf, env);
}

async function elevenLabs(env, text, mode) {
  const settings = {
    tech: { stability: 0.60, similarity_boost: 0.80, speaker_boost: true },
    concierge: { stability: 0.45, similarity_boost: 0.85, speaker_boost: true },
    calm: { stability: 0.70, similarity_boost: 0.75, speaker_boost: false },
    urgent: { stability: 0.30, similarity_boost: 0.85, speaker_boost: true }
  }[mode] || { stability: 0.50, similarity_boost: 0.80, speaker_boost: true };

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${env.ELEVENLABS_VOICE_ID}`, {
    method: "POST",
    headers: { "xi-api-key": env.ELEVENLABS_API_KEY, "content-type": "application/json", "accept": "audio/mpeg" },
    body: JSON.stringify({ text, model_id: env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2", voice_settings: settings })
  });

  if (!res.ok) throw new Error(`ElevenLabs ${res.status}`);
  return await res.arrayBuffer();
}

async function verifyHmac(request, env) {
  const ts = request.headers.get("x-genius-timestamp");
  const nonce = request.headers.get("x-genius-nonce");
  const sig = request.headers.get("x-genius-signature");
  if (!ts || !nonce || !sig) return "Missing HMAC headers";
  if (Math.abs(Date.now() - Number(ts)) > 300000) return "Expired";
  
  const body = await request.clone().text();
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.GENIUS01_HMAC_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expected = [...new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${ts}.${nonce}.${body}`)))].map(b => b.toString(16).padStart(2, "0")).join("");
  
  return sig === expected ? null : "Invalid signature";
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════════════════

function health(env) {
  return json({
    ok: true, service: "NOIZYLAB-EDGE", version: "2.0",
    bindings: { ai: !!env.AI, tts: !!env.ELEVENLABS_API_KEY, r2: !!env.AUDIO_CACHE, gabriel: !!env.GABRIEL_URL, access: !!(env.CF_ACCESS_CLIENT_ID && env.CF_ACCESS_CLIENT_SECRET) },
    ts: Date.now()
  }, 200, env);
}

function voices(env) { return json({ modes: ["tech", "concierge", "calm", "urgent"] }, 200, env); }
async function safeJson(r) { try { return await r.json(); } catch { return {}; } }
function corsHeaders(env) { return { "Access-Control-Allow-Origin": env.ALLOW_ORIGINS || "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-genius-timestamp, x-genius-nonce, x-genius-signature" }; }
function cors(env) { return new Response(null, { status: 204, headers: corsHeaders(env) }); }
function json(data, status = 200, env = {}) { return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", ...corsHeaders(env) } }); }
function audio(data, env, extra = {}) { return new Response(data, { headers: { "Content-Type": "audio/mpeg", ...corsHeaders(env), ...extra } }); }

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

function dashboard() { return new Response(DASH, { headers: { "Content-Type": "text/html" } }); }

const DASH = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NOIZYLAB EDGE</title>
<style>:root{--bg:#0a0908;--card:#0d0c0a;--border:#1a1815;--gold:#d4a574;--text:#e8ddd0;--muted:#6b5a45;--green:#6a9c59;--purple:#9c6ad4;--red:#c45959}*{margin:0;padding:0;box-sizing:border-box}body{background:var(--bg);color:var(--text);font-family:-apple-system,sans-serif;min-height:100vh;padding:20px}.header{text-align:center;padding:20px;border-bottom:2px solid var(--gold);margin-bottom:20px}.logo{font-size:1.5rem;font-weight:900;color:var(--gold);letter-spacing:3px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px;max-width:1200px;margin:0 auto}.card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px}.card h3{color:var(--gold);margin-bottom:15px;font-size:.9rem;text-transform:uppercase}.status{display:flex;align-items:center;gap:10px;margin:10px 0}.dot{width:10px;height:10px;border-radius:50%}.dot.green{background:var(--green)}.dot.red{background:var(--red)}.dot.yellow{background:#c4a559}input,textarea{width:100%;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px;color:var(--text);margin:8px 0}button{background:var(--gold);color:#000;border:none;padding:12px 20px;border-radius:8px;cursor:pointer;font-weight:700;margin:5px}.output{background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:15px;margin-top:15px;font-family:monospace;font-size:.8rem;color:var(--purple);max-height:200px;overflow-y:auto;white-space:pre-wrap}</style>
</head><body>
<div class="header"><div class="logo">NOIZYLAB EDGE</div></div>
<div class="grid">
  <div class="card"><h3>GABRIEL Status</h3><div class="status"><div class="dot" id="gd"></div><span id="gs">Checking...</span></div><div id="gi" class="output"></div><button onclick="checkG()">Refresh</button></div>
  <div class="card"><h3>Execute on GABRIEL</h3><input id="cmd" placeholder="Command..."><button onclick="execC()">Execute</button><div id="co" class="output"></div></div>
  <div class="card"><h3>AI</h3><textarea id="prompt" rows="3" placeholder="Ask..."></textarea><button onclick="askAI()">Ask</button><button onclick="speakAI()">Speak</button><div id="ao" class="output"></div></div>
</div>
<script>
const A=location.origin;
async function checkG(){document.getElementById('gs').textContent='...';try{const r=await fetch(A+'/gabriel/status');const d=await r.json();document.getElementById('gd').className='dot '+(d.status==='online'?'green':d.status==='offline'?'red':'yellow');document.getElementById('gs').textContent=d.status+(d.latency_ms?' ('+d.latency_ms+'ms)':'');document.getElementById('gi').textContent=JSON.stringify(d,null,2)}catch(e){document.getElementById('gd').className='dot red';document.getElementById('gs').textContent='Error'}}
async function execC(){const c=document.getElementById('cmd').value,o=document.getElementById('co');o.textContent='...';try{const r=await fetch(A+'/gabriel/exec',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cmd:c})});const d=await r.json();o.textContent=d.output||d.error||JSON.stringify(d)}catch(e){o.textContent='Error: '+e.message}}
async function askAI(){const p=document.getElementById('prompt').value,o=document.getElementById('ao');o.textContent='...';try{const r=await fetch(A+'/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:p})});const d=await r.json();o.textContent=d.response||d.error}catch(e){o.textContent='Error: '+e.message}}
async function speakAI(){const p=document.getElementById('prompt').value,o=document.getElementById('ao');o.textContent='...';try{const r=await fetch(A+'/speak',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:p})});if(r.ok){const b=await r.blob();new Audio(URL.createObjectURL(b)).play();o.textContent=decodeURIComponent(r.headers.get('x-genius-text')||'Playing...')}else{const d=await r.json();o.textContent=d.error}}catch(e){o.textContent='Error: '+e.message}}
checkG();
</script></body></html>`;
