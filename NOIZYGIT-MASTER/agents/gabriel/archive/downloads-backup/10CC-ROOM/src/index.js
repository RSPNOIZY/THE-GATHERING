// 10CC ROOM - AI Constellation Orchestrator
// THINKERS plan → DOERS execute → VERIFIER checks

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === "OPTIONS") return cors();
    try {
      if (path === "/health") return health(env);
      if (path === "/" || path === "/dashboard") return dashboard();
      if (path === "/constellation") return constellation(env);
      if (path === "/think" && request.method === "POST") return think(request, env);
      if (path === "/do" && request.method === "POST") return execute(request, env);
      if (path === "/verify" && request.method === "POST") return verify(request, env);
      if (path === "/orchestrate" && request.method === "POST") return orchestrate(request, env, ctx);
      if (path === "/council" && request.method === "POST") return council(request, env);
      if (path === "/debate" && request.method === "POST") return debate(request, env);
      if (path === "/consensus" && request.method === "POST") return consensus(request, env);
      return json({ error: "Not found" }, 404);
    } catch (e) { return json({ error: e.message }, 500); }
  }
};

const THINKERS = {
  o3: { name: "OpenAI o3", provider: "openai", model: "o1-preview", role: "Strategic Reasoner" },
  r1: { name: "DeepSeek R1", provider: "deepseek", model: "deepseek-reasoner", role: "Mathematical Mind" },
  opus: { name: "Claude Opus", provider: "claude", model: "claude-3-opus-20240229", role: "Nuanced Analyst" },
  gemini: { name: "Gemini Pro", provider: "gemini", model: "gemini-1.5-pro", role: "Multimodal Visionary" },
  mistral: { name: "Mistral Large", provider: "mistral", model: "mistral-large-latest", role: "European Perspective" }
};

const DOERS = {
  gpt4: { name: "GPT-4.1", provider: "openai", model: "gpt-4o", role: "General Executor" },
  haiku: { name: "Claude Haiku", provider: "claude", model: "claude-3-5-haiku-20241022", role: "Fast Implementer" },
  llama: { name: "LLaMA 3", provider: "llama", model: "@cf/meta/llama-3.1-70b-instruct", role: "Open Source" },
  groq: { name: "Groq", provider: "groq", model: "llama-3.3-70b-versatile", role: "Speed Demon" },
  pplx: { name: "Perplexity", provider: "perplexity", model: "llama-3.1-sonar-large-128k-online", role: "Search Oracle" }
};

const VERIFIERS = {
  sonnet: { name: "Claude Sonnet", provider: "claude", model: "claude-sonnet-4-20250514", role: "Quality Guardian" },
  deepseek: { name: "DeepSeek", provider: "deepseek", model: "deepseek-chat", role: "Code Auditor" }
};

async function think(request, env) {
  const body = await safeJson(request);
  const problem = body.problem || body.prompt;
  const thinkers = body.thinkers || ["opus", "gemini"];
  if (!problem) return json({ error: "No problem" }, 400);
  
  const results = {};
  await Promise.all(thinkers.map(async (t) => {
    const thinker = THINKERS[t];
    if (!thinker) return;
    try {
      const res = await callProvider(env, thinker.provider, thinker.model, [
        { role: "system", content: `You are ${thinker.name}, a THINKER. Analyze and create a plan. Output JSON: {analysis, plan:[steps], risks}` },
        { role: "user", content: problem }
      ], 1500);
      results[t] = { name: thinker.name, response: res.content, ms: res.ms };
    } catch (e) { results[t] = { name: thinker.name, error: e.message }; }
  }));
  return json({ phase: "THINK", problem, thinkers: results }, 200);
}

async function execute(request, env) {
  const body = await safeJson(request);
  const plan = body.plan, task = body.task, doers = body.doers || ["haiku"];
  if (!plan && !task) return json({ error: "No plan/task" }, 400);
  
  const results = {};
  await Promise.all(doers.map(async (d) => {
    const doer = DOERS[d];
    if (!doer) return;
    try {
      const res = await callProvider(env, doer.provider, doer.model, [
        { role: "system", content: `You are ${doer.name}, a DOER. Execute precisely.` },
        { role: "user", content: `Task: ${task || 'Execute plan'}\n\nPlan:\n${plan}` }
      ], 2000);
      results[d] = { name: doer.name, output: res.content, ms: res.ms };
    } catch (e) { results[d] = { name: doer.name, error: e.message }; }
  }));
  return json({ phase: "DO", doers: results }, 200);
}

async function verify(request, env) {
  const body = await safeJson(request);
  const work = body.work, plan = body.plan;
  if (!work) return json({ error: "No work" }, 400);
  
  try {
    const v = VERIFIERS.sonnet;
    const res = await callProvider(env, v.provider, v.model, [
      { role: "system", content: "Review work quality. Output JSON: {approved:bool, issues:[], score:1-10}" },
      { role: "user", content: `Plan:\n${plan || 'N/A'}\n\nWork:\n${work}` }
    ], 800);
    return json({ phase: "VERIFY", verdict: res.content, ms: res.ms }, 200);
  } catch (e) { return json({ error: e.message }, 500); }
}

async function orchestrate(request, env, ctx) {
  const body = await safeJson(request);
  const problem = body.problem || body.prompt;
  if (!problem) return json({ error: "No problem" }, 400);
  
  const start = Date.now();
  const result = { problem, phases: {} };
  
  // THINK
  const t1 = Date.now();
  const thinks = await Promise.all(["opus", "gemini"].map(t => callThinker(env, t, problem)));
  result.phases.think = { results: thinks, ms: Date.now() - t1 };
  const plan = thinks.filter(t => t.plan).map(t => t.plan).join("\n---\n") || "No plan";
  result.synthesized_plan = plan;
  
  // DO
  const t2 = Date.now();
  const doer = DOERS.haiku;
  try {
    const doRes = await callProvider(env, doer.provider, doer.model, [
      { role: "system", content: "Execute the plan precisely." },
      { role: "user", content: `Problem: ${problem}\n\nPlan:\n${plan}` }
    ], 2000);
    result.phases.do = { output: doRes.content, ms: Date.now() - t2 };
  } catch (e) { result.phases.do = { error: e.message, ms: Date.now() - t2 }; }
  
  // VERIFY
  const t3 = Date.now();
  try {
    const vRes = await callProvider(env, VERIFIERS.sonnet.provider, VERIFIERS.sonnet.model, [
      { role: "system", content: "Rate 1-10. Be brief." },
      { role: "user", content: `Work:\n${result.phases.do?.output || 'N/A'}` }
    ], 500);
    result.phases.verify = { verdict: vRes.content, ms: Date.now() - t3 };
    const m = vRes.content.match(/(\d+)\s*\/?\s*10/);
    result.quality_score = m ? parseInt(m[1]) : null;
  } catch (e) { result.phases.verify = { error: e.message }; }
  
  result.final_output = result.phases.do?.output || "Failed";
  result.total_ms = Date.now() - start;
  return json(result, 200);
}

async function callThinker(env, t, problem) {
  const thinker = THINKERS[t];
  if (!thinker) return { id: t, error: "Unknown" };
  try {
    const res = await callProvider(env, thinker.provider, thinker.model, [
      { role: "system", content: `You are ${thinker.name}. Analyze, output a plan.` },
      { role: "user", content: problem }
    ], 1200);
    return { id: t, name: thinker.name, plan: res.content, ms: res.ms };
  } catch (e) { return { id: t, name: thinker.name, error: e.message }; }
}

async function council(request, env) {
  const body = await safeJson(request);
  const q = body.question || body.prompt;
  if (!q) return json({ error: "No question" }, 400);
  const results = {};
  await Promise.all(Object.entries(THINKERS).map(async ([id, t]) => {
    try {
      const res = await callProvider(env, t.provider, t.model, [{ role: "user", content: q }], 400);
      results[id] = { name: t.name, view: res.content, ms: res.ms };
    } catch (e) { results[id] = { name: t.name, error: e.message }; }
  }));
  return json({ question: q, council: results }, 200);
}

async function debate(request, env) {
  const body = await safeJson(request);
  const topic = body.topic || body.prompt;
  if (!topic) return json({ error: "No topic" }, 400);
  const pro = THINKERS.opus, con = THINKERS.gemini;
  const transcript = [];
  let proArg = "", conArg = "";
  for (let i = 0; i < 2; i++) {
    try {
      const pRes = await callProvider(env, pro.provider, pro.model, [
        { role: "user", content: `Argue FOR "${topic}". ${conArg ? 'Counter: ' + conArg : ''} Round ${i + 1}.` }
      ], 400);
      proArg = pRes.content;
      transcript.push({ round: i + 1, side: "PRO", model: pro.name, argument: proArg });
    } catch (e) { transcript.push({ round: i + 1, side: "PRO", error: e.message }); }
    try {
      const cRes = await callProvider(env, con.provider, con.model, [
        { role: "user", content: `Argue AGAINST "${topic}". Counter: ${proArg}. Round ${i + 1}.` }
      ], 400);
      conArg = cRes.content;
      transcript.push({ round: i + 1, side: "CON", model: con.name, argument: conArg });
    } catch (e) { transcript.push({ round: i + 1, side: "CON", error: e.message }); }
  }
  return json({ topic, pro: pro.name, con: con.name, transcript }, 200);
}

async function consensus(request, env) {
  const body = await safeJson(request);
  const q = body.question || body.prompt;
  if (!q) return json({ error: "No question" }, 400);
  const voters = ["haiku", "llama", "groq"];
  const votes = {};
  await Promise.all(voters.map(async (v) => {
    const m = DOERS[v];
    if (!m) return;
    try {
      const res = await callProvider(env, m.provider, m.model, [{ role: "user", content: q }], 500);
      votes[v] = { name: m.name, answer: res.content, ms: res.ms };
    } catch (e) { votes[v] = { name: m.name, error: e.message }; }
  }));
  const answers = Object.values(votes).filter(v => v.answer).map(v => v.answer);
  let consensus = "No consensus";
  if (answers.length > 0) {
    try {
      const s = await callProvider(env, DOERS.haiku.provider, DOERS.haiku.model, [
        { role: "system", content: "Synthesize into one answer." },
        { role: "user", content: answers.join("\n---\n") }
      ], 400);
      consensus = s.content;
    } catch (e) {}
  }
  return json({ question: q, votes, consensus }, 200);
}

async function callProvider(env, provider, model, messages, maxTokens) {
  const start = Date.now();
  let content = "";
  if (provider === "openai") {
    if (!env.OPENAI_API_KEY) throw new Error("OpenAI not configured");
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", headers: { "Authorization": `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens })
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    content = (await res.json()).choices?.[0]?.message?.content || "";
  } else if (provider === "claude") {
    if (!env.ANTHROPIC_API_KEY) throw new Error("Claude not configured");
    let sys = ""; const msgs = messages.filter(m => { if (m.role === "system") { sys = m.content; return false; } return true; });
    const b = { model, max_tokens: maxTokens, messages: msgs }; if (sys) b.system = sys;
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify(b)
    });
    if (!res.ok) throw new Error(`Claude ${res.status}`);
    content = (await res.json()).content?.[0]?.text || "";
  } else if (provider === "gemini") {
    if (!env.GOOGLE_API_KEY) throw new Error("Gemini not configured");
    const contents = messages.filter(m => m.role !== "system").map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GOOGLE_API_KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: maxTokens } })
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}`);
    content = (await res.json()).candidates?.[0]?.content?.parts?.[0]?.text || "";
  } else if (provider === "llama") {
    if (!env.AI) throw new Error("Workers AI not bound");
    content = (await env.AI.run(model, { messages, max_tokens: maxTokens })).response || "";
  } else if (provider === "deepseek") {
    if (!env.DEEPSEEK_API_KEY) throw new Error("DeepSeek not configured");
    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST", headers: { "Authorization": `Bearer ${env.DEEPSEEK_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens })
    });
    if (!res.ok) throw new Error(`DeepSeek ${res.status}`);
    content = (await res.json()).choices?.[0]?.message?.content || "";
  } else if (provider === "mistral") {
    if (!env.MISTRAL_API_KEY) throw new Error("Mistral not configured");
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST", headers: { "Authorization": `Bearer ${env.MISTRAL_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens })
    });
    if (!res.ok) throw new Error(`Mistral ${res.status}`);
    content = (await res.json()).choices?.[0]?.message?.content || "";
  } else if (provider === "perplexity") {
    if (!env.PERPLEXITY_API_KEY) throw new Error("Perplexity not configured");
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST", headers: { "Authorization": `Bearer ${env.PERPLEXITY_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens })
    });
    if (!res.ok) throw new Error(`Perplexity ${res.status}`);
    content = (await res.json()).choices?.[0]?.message?.content || "";
  } else if (provider === "groq") {
    if (!env.GROQ_API_KEY) throw new Error("Groq not configured");
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST", headers: { "Authorization": `Bearer ${env.GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens })
    });
    if (!res.ok) throw new Error(`Groq ${res.status}`);
    content = (await res.json()).choices?.[0]?.message?.content || "";
  } else { throw new Error(`Unknown: ${provider}`); }
  return { content, ms: Date.now() - start };
}

function constellation(env) {
  const avail = (p) => { const k = { openai: "OPENAI_API_KEY", claude: "ANTHROPIC_API_KEY", gemini: "GOOGLE_API_KEY", mistral: "MISTRAL_API_KEY", deepseek: "DEEPSEEK_API_KEY", perplexity: "PERPLEXITY_API_KEY", groq: "GROQ_API_KEY", llama: null }; return k[p] === null ? !!env.AI : !!env[k[p]]; };
  return json({
    thinkers: Object.entries(THINKERS).map(([id, t]) => ({ id, ...t, available: avail(t.provider) })),
    doers: Object.entries(DOERS).map(([id, d]) => ({ id, ...d, available: avail(d.provider) })),
    verifiers: Object.entries(VERIFIERS).map(([id, v]) => ({ id, ...v, available: avail(v.provider) }))
  }, 200);
}

function health(env) {
  const avail = (p) => { const k = { openai: "OPENAI_API_KEY", claude: "ANTHROPIC_API_KEY", gemini: "GOOGLE_API_KEY", mistral: "MISTRAL_API_KEY", deepseek: "DEEPSEEK_API_KEY", perplexity: "PERPLEXITY_API_KEY", groq: "GROQ_API_KEY", llama: null }; return k[p] === null ? !!env.AI : !!env[k[p]]; };
  const providers = {}; ["openai", "claude", "gemini", "llama", "mistral", "deepseek", "perplexity", "groq"].forEach(p => providers[p] = avail(p));
  return json({ ok: true, service: "10CC-ROOM", providers, ts: Date.now() }, 200);
}

async function safeJson(r) { try { return await r.json(); } catch { return {}; } }
function cors() { return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } }); }
function json(d, s = 200) { return new Response(JSON.stringify(d, null, 2), { status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }); }

function dashboard() { return new Response(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>10CC Room</title><style>:root{--bg:#0a0908;--card:#0d0c0a;--border:#1a1815;--gold:#d4a574;--text:#e8ddd0;--muted:#6b5a45;--green:#6a9c59;--blue:#5a8ac4;--purple:#9c6ad4}*{margin:0;padding:0;box-sizing:border-box}body{background:var(--bg);color:var(--text);font-family:-apple-system,sans-serif;padding:20px}.h{text-align:center;padding:20px;border-bottom:2px solid var(--gold);margin-bottom:20px}.logo{font-size:2rem;font-weight:900;color:var(--gold)}.sub{color:var(--muted);margin-top:5px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;max-width:1400px;margin:0 auto}.card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px}.card h3{color:var(--gold);margin-bottom:15px;font-size:.85rem;text-transform:uppercase}.agents{display:flex;flex-wrap:wrap;gap:8px}.agent{background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:8px 12px;font-size:.75rem}.agent.t{border-color:var(--purple)}.agent.d{border-color:var(--blue)}.agent.v{border-color:var(--green)}.agent .n{font-weight:700}.agent .r{color:var(--muted);font-size:.65rem}textarea{width:100%;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px;color:var(--text);resize:vertical}button{background:var(--gold);color:#000;border:none;padding:12px 20px;border-radius:8px;cursor:pointer;font-weight:700;margin:5px 5px 5px 0}button:hover{opacity:.9}.out{background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:15px;margin-top:15px;font-size:.85rem;max-height:400px;overflow-y:auto;white-space:pre-wrap}.ph{padding:10px;border-radius:6px;margin:10px 0}.ph.t{background:rgba(156,106,212,.1);border-left:3px solid var(--purple)}.ph.d{background:rgba(90,138,196,.1);border-left:3px solid var(--blue)}.ph.v{background:rgba(106,156,89,.1);border-left:3px solid var(--green)}</style></head><body><div class="h"><div class="logo">🌌 10CC ROOM</div><div class="sub">AI Constellation Orchestrator</div></div><div class="grid"><div class="card"><h3>🧠 Thinkers</h3><div class="agents" id="thinkers"></div></div><div class="card"><h3>⚡ Doers</h3><div class="agents" id="doers"></div></div><div class="card"><h3>✓ Verifiers</h3><div class="agents" id="verifiers"></div></div><div class="card" style="grid-column:1/-1"><h3>🎯 Orchestrate</h3><textarea id="problem" rows="4" placeholder="Describe the problem..."></textarea><div><button onclick="orch()">Full Orchestration</button><button onclick="council()">Council</button><button onclick="debate()">Debate</button><button onclick="cons()">Consensus</button></div><div id="out" class="out" style="display:none"></div></div></div><script>const A=location.origin;async function init(){const r=await fetch(A+"/constellation"),d=await r.json();["thinkers","doers","verifiers"].forEach(t=>{const c=document.getElementById(t);c.innerHTML="";(d[t]||[]).forEach(a=>{const e=document.createElement("div");e.className="agent "+t[0];e.innerHTML='<div class="n">'+(a.available?"●":"○")+" "+a.name+'</div><div class="r">'+a.role+"</div>";c.appendChild(e)})})}async function orch(){const p=document.getElementById("problem").value,o=document.getElementById("out");o.style.display="block";o.innerHTML="<div class='ph t'>🧠 THINKING...</div>";const r=await fetch(A+"/orchestrate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({problem:p})});const d=await r.json();o.innerHTML="<div class='ph t'>🧠 THINK ("+d.phases?.think?.ms+"ms)</div><div class='ph d'>⚡ DO ("+(d.phases?.do?.ms||"?")+"ms)</div><div class='ph v'>✓ VERIFY ("+(d.phases?.verify?.ms||"?")+"ms)</div><hr style='border-color:var(--border);margin:15px 0'><strong>Score: "+(d.quality_score||"N/A")+"/10</strong><br><br><strong>Output:</strong><br>"+(d.final_output||"Failed")}async function council(){const p=document.getElementById("problem").value,o=document.getElementById("out");o.style.display="block";o.textContent="Consulting...";const r=await fetch(A+"/council",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:p})});const d=await r.json();let h="<strong>Council:</strong><br><br>";for(const[k,v]of Object.entries(d.council||{}))h+="<strong>"+v.name+":</strong> "+(v.view||v.error)+"<br><br>";o.innerHTML=h}async function debate(){const p=document.getElementById("problem").value,o=document.getElementById("out");o.style.display="block";o.textContent="Debating...";const r=await fetch(A+"/debate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({topic:p})});const d=await r.json();let h="<strong>"+d.topic+"</strong><br>PRO: "+d.pro+" vs CON: "+d.con+"<br><br>";(d.transcript||[]).forEach(t=>h+="<div style='margin:10px 0;padding:10px;background:var(--bg);border-radius:6px'><strong>R"+t.round+" "+t.side+":</strong><br>"+(t.argument||t.error)+"</div>");o.innerHTML=h}async function cons(){const p=document.getElementById("problem").value,o=document.getElementById("out");o.style.display="block";o.textContent="Voting...";const r=await fetch(A+"/consensus",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:p})});const d=await r.json();o.innerHTML="<strong>Consensus:</strong><br>"+d.consensus}init()</script></body></html>`, { headers: { "Content-Type": "text/html" } }); }
