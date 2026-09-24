// ╔═══════════════════════════════════════════════════════════════════════════════╗
// ║  🧠 10CC ROOM - AI CONSTELLATION ORCHESTRATOR                                 ║
// ║  5 Thinkers • 5 Doers • 2 Verifiers • 3 Special Modes                        ║
// ╚═══════════════════════════════════════════════════════════════════════════════╝

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === "OPTIONS") return cors();
    
    try {
      // Core endpoints
      if (path === "/" || path === "/dashboard") return dashboard();
      if (path === "/health") return health(env);
      if (path === "/constellation") return constellation(env);
      
      // Orchestration
      if (path === "/orchestrate" && request.method === "POST") return orchestrate(request, env);
      if (path === "/think" && request.method === "POST") return think(request, env);
      if (path === "/do" && request.method === "POST") return execute(request, env);
      if (path === "/verify" && request.method === "POST") return verify(request, env);
      
      // Special modes
      if (path === "/council" && request.method === "POST") return council(request, env);
      if (path === "/debate" && request.method === "POST") return debate(request, env);
      if (path === "/consensus" && request.method === "POST") return consensus(request, env);
      
      // History
      if (path === "/history") return getHistory(env);
      
      return json({ error: "Not found", endpoints: ["/orchestrate", "/think", "/do", "/verify", "/council", "/debate", "/consensus"] }, 404);
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🧠 THE CONSTELLATION
// ═══════════════════════════════════════════════════════════════════════════════

const THINKERS = {
  opus:    { provider: "claude",   model: "claude-3-opus-20240229",    name: "Claude Opus",    role: "Nuanced Analyst",       icon: "🎭" },
  gemini:  { provider: "gemini",   model: "gemini-1.5-pro",            name: "Gemini Pro",     role: "Multimodal Visionary",  icon: "♊" },
  o3:      { provider: "openai",   model: "o1-preview",                name: "OpenAI o3",      role: "Strategic Reasoner",    icon: "🔮" },
  r1:      { provider: "deepseek", model: "deepseek-reasoner",         name: "DeepSeek R1",    role: "Mathematical Mind",     icon: "🧮" },
  mistral: { provider: "mistral",  model: "mistral-large-latest",      name: "Mistral Large",  role: "European Perspective",  icon: "🌊" }
};

const DOERS = {
  haiku:  { provider: "claude",     model: "claude-3-5-haiku-20241022",          name: "Claude Haiku",  role: "Fast Implementer",  icon: "⚡" },
  gpt4:   { provider: "openai",     model: "gpt-4o",                              name: "GPT-4o",        role: "General Executor",  icon: "🤖" },
  llama:  { provider: "workersai",  model: "@cf/meta/llama-3.1-70b-instruct",    name: "LLaMA 3.1",     role: "Open Source Power", icon: "🦙" },
  groq:   { provider: "groq",       model: "llama-3.3-70b-versatile",             name: "Groq",          role: "Speed Demon",       icon: "🚀" },
  pplx:   { provider: "perplexity", model: "llama-3.1-sonar-large-128k-online",   name: "Perplexity",    role: "Search Oracle",     icon: "🔍" }
};

const VERIFIERS = {
  sonnet:   { provider: "claude",   model: "claude-sonnet-4-20250514", name: "Claude Sonnet",  role: "Quality Guardian", icon: "✅" },
  deepseek: { provider: "deepseek", model: "deepseek-chat",            name: "DeepSeek Chat",  role: "Code Auditor",     icon: "🔬" }
};

// ═══════════════════════════════════════════════════════════════════════════════
// FULL ORCHESTRATION: Think → Do → Verify
// ═══════════════════════════════════════════════════════════════════════════════

async function orchestrate(request, env) {
  const start = Date.now();
  const body = await safeJson(request);
  const problem = body.problem || body.prompt;
  if (!problem) return json({ error: "No problem provided" }, 400);
  
  const config = body.config || {};
  const thinkerIds = config.thinkers || ["opus", "gemini"];
  const doerId = config.doer || "haiku";
  
  const result = { phase: "ORCHESTRATE", pipeline_id: crypto.randomUUID(), phases: {} };
  
  // PHASE 1: THINK
  result.phases.think = { start: Date.now(), thinkers: [] };
  const thinkPromises = thinkerIds.slice(0, 3).map(id => 
    callAgent(env, THINKERS[id], "THINKER", `Analyze and create a plan:\n\n${problem}`).catch(e => ({ error: e.message, id }))
  );
  const thinkResults = await Promise.all(thinkPromises);
  result.phases.think.thinkers = thinkResults.map((r, i) => ({ id: thinkerIds[i], ...r }));
  result.phases.think.ms = Date.now() - result.phases.think.start;
  
  // Synthesize plan
  const plans = thinkResults.filter(r => r.content).map(r => r.content);
  result.synthesized_plan = plans.join("\n\n───────────────\n\n") || "No plans generated";
  
  // PHASE 2: DO
  result.phases.do = { start: Date.now() };
  const doer = DOERS[doerId] || DOERS.haiku;
  const doResult = await callAgent(env, doer, "EXECUTOR", `PROBLEM:\n${problem}\n\nPLAN:\n${result.synthesized_plan}\n\nExecute now.`).catch(e => ({ error: e.message }));
  result.phases.do = { ...result.phases.do, ...doResult, ms: Date.now() - result.phases.do.start };
  result.final_output = doResult.content;
  
  // PHASE 3: VERIFY
  result.phases.verify = { start: Date.now() };
  const verifyResult = await callAgent(env, VERIFIERS.sonnet, "VERIFIER", 
    `Rate this work 1-10. Output JSON: {"score":N,"issues":[],"approved":bool}\n\nWORK:\n${(doResult.content || "").slice(0, 4000)}`
  ).catch(e => ({ error: e.message }));
  result.phases.verify = { ...result.phases.verify, ...verifyResult, ms: Date.now() - result.phases.verify.start };
  
  // Extract score
  const scoreMatch = (verifyResult.content || "").match(/(\d+)\s*\/?\s*10|"score"\s*:\s*(\d+)/i);
  result.quality_score = scoreMatch ? parseInt(scoreMatch[1] || scoreMatch[2]) : null;
  
  result.total_ms = Date.now() - start;
  
  // Log to KV
  if (env.CONFIG) {
    await env.CONFIG.put(`orch:${result.pipeline_id}`, JSON.stringify({
      problem: problem.slice(0, 100),
      score: result.quality_score,
      ms: result.total_ms,
      ts: Date.now()
    }), { expirationTtl: 604800 });
  }
  
  return json(result);
}

// ═══════════════════════════════════════════════════════════════════════════════
// INDIVIDUAL PHASES
// ═══════════════════════════════════════════════════════════════════════════════

async function think(request, env) {
  const start = Date.now();
  const body = await safeJson(request);
  const problem = body.problem || body.prompt;
  if (!problem) return json({ error: "No problem" }, 400);
  
  const thinkerIds = body.thinkers || ["opus", "gemini"];
  const results = await Promise.all(
    thinkerIds.slice(0, 5).map(id => {
      const t = THINKERS[id];
      if (!t) return { id, error: "Unknown thinker" };
      return callAgent(env, t, "THINKER", problem).then(r => ({ id, ...r })).catch(e => ({ id, error: e.message }));
    })
  );
  
  return json({ phase: "THINK", thinkers: results, ms: Date.now() - start });
}

async function execute(request, env) {
  const start = Date.now();
  const body = await safeJson(request);
  const task = body.task || body.plan || body.prompt;
  if (!task) return json({ error: "No task" }, 400);
  
  const doerId = body.doer || "haiku";
  const doer = DOERS[doerId] || DOERS.haiku;
  const result = await callAgent(env, doer, "EXECUTOR", task).catch(e => ({ error: e.message }));
  
  return json({ phase: "DO", doer: doerId, ...result, ms: Date.now() - start });
}

async function verify(request, env) {
  const start = Date.now();
  const body = await safeJson(request);
  const work = body.work || body.output;
  if (!work) return json({ error: "No work to verify" }, 400);
  
  const verifierId = body.verifier || "sonnet";
  const verifier = VERIFIERS[verifierId] || VERIFIERS.sonnet;
  const result = await callAgent(env, verifier, "VERIFIER", 
    `Rate 1-10. Output: {"score":N,"issues":[],"approved":bool}\n\nWORK:\n${work.slice(0, 5000)}`
  ).catch(e => ({ error: e.message }));
  
  const scoreMatch = (result.content || "").match(/(\d+)\s*\/?\s*10|"score"\s*:\s*(\d+)/i);
  
  return json({ phase: "VERIFY", verifier: verifierId, ...result, score: scoreMatch ? parseInt(scoreMatch[1] || scoreMatch[2]) : null, ms: Date.now() - start });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPECIAL MODES
// ═══════════════════════════════════════════════════════════════════════════════

// COUNCIL: All thinkers give independent opinions
async function council(request, env) {
  const start = Date.now();
  const body = await safeJson(request);
  const question = body.question || body.prompt;
  if (!question) return json({ error: "No question" }, 400);
  
  const thinkerIds = Object.keys(THINKERS);
  const results = await Promise.all(
    thinkerIds.map(id => 
      callAgent(env, THINKERS[id], "COUNCIL MEMBER", `Answer briefly (2-3 sentences):\n\n${question}`)
        .then(r => ({ id, name: THINKERS[id].name, icon: THINKERS[id].icon, ...r }))
        .catch(e => ({ id, name: THINKERS[id].name, icon: THINKERS[id].icon, error: e.message }))
    )
  );
  
  return json({ mode: "COUNCIL", question, council: results, ms: Date.now() - start });
}

// DEBATE: Two models argue pro/con
async function debate(request, env) {
  const start = Date.now();
  const body = await safeJson(request);
  const topic = body.topic || body.prompt;
  if (!topic) return json({ error: "No topic" }, 400);
  
  const proId = body.pro || "opus";
  const conId = body.con || "gemini";
  const rounds = Math.min(body.rounds || 2, 3);
  
  const proAgent = THINKERS[proId] || THINKERS.opus;
  const conAgent = THINKERS[conId] || THINKERS.gemini;
  
  const transcript = [];
  let lastArg = "";
  
  for (let round = 1; round <= rounds; round++) {
    // PRO argues
    const proPrompt = round === 1 
      ? `Argue IN FAVOR of: "${topic}"\n\nBe persuasive. 2-3 sentences.`
      : `Counter this argument and continue arguing IN FAVOR of: "${topic}"\n\nOpponent said: "${lastArg}"\n\n2-3 sentences.`;
    
    const proResult = await callAgent(env, proAgent, "DEBATER (PRO)", proPrompt).catch(e => ({ content: `Error: ${e.message}` }));
    transcript.push({ round, side: "PRO", model: proId, icon: proAgent.icon, argument: proResult.content });
    lastArg = proResult.content;
    
    // CON argues
    const conPrompt = `Counter this and argue AGAINST: "${topic}"\n\nOpponent said: "${lastArg}"\n\n2-3 sentences.`;
    const conResult = await callAgent(env, conAgent, "DEBATER (CON)", conPrompt).catch(e => ({ content: `Error: ${e.message}` }));
    transcript.push({ round, side: "CON", model: conId, icon: conAgent.icon, argument: conResult.content });
    lastArg = conResult.content;
  }
  
  return json({ mode: "DEBATE", topic, pro: proId, con: conId, rounds, transcript, ms: Date.now() - start });
}

// CONSENSUS: Multiple models vote, then synthesize
async function consensus(request, env) {
  const start = Date.now();
  const body = await safeJson(request);
  const question = body.question || body.prompt;
  if (!question) return json({ error: "No question" }, 400);
  
  const voterIds = body.voters || ["haiku", "llama", "groq"];
  
  // Collect votes
  const votes = await Promise.all(
    voterIds.slice(0, 5).map(id => {
      const agent = DOERS[id] || THINKERS[id];
      if (!agent) return { id, error: "Unknown agent" };
      return callAgent(env, agent, "VOTER", `Answer concisely:\n\n${question}`)
        .then(r => ({ id, icon: agent.icon, vote: r.content }))
        .catch(e => ({ id, error: e.message }));
    })
  );
  
  // Synthesize consensus
  const validVotes = votes.filter(v => v.vote).map(v => `${v.id}: ${v.vote}`).join("\n\n");
  const synthesizer = DOERS.haiku;
  const synthesis = await callAgent(env, synthesizer, "SYNTHESIZER", 
    `Synthesize these responses into a single consensus answer:\n\n${validVotes}\n\nProvide one unified response.`
  ).catch(e => ({ content: `Error: ${e.message}` }));
  
  return json({ mode: "CONSENSUS", question, votes, consensus: synthesis.content, ms: Date.now() - start });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER ROUTER
// ═══════════════════════════════════════════════════════════════════════════════

async function callAgent(env, agent, role, prompt) {
  const start = Date.now();
  const systemPrompt = `You are ${agent.name}, ${agent.role}. Role: ${role}. Be concise and precise.`;
  
  let content;
  
  switch (agent.provider) {
    case "claude":
      if (!env.ANTHROPIC_API_KEY) throw new Error(`${agent.name} not configured`);
      const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
        body: JSON.stringify({ model: agent.model, max_tokens: 2000, system: systemPrompt, messages: [{ role: "user", content: prompt }] })
      });
      if (!claudeRes.ok) throw new Error(`Claude ${claudeRes.status}`);
      content = (await claudeRes.json()).content?.[0]?.text || "";
      break;
      
    case "openai":
      if (!env.OPENAI_API_KEY) throw new Error(`${agent.name} not configured`);
      const oaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: agent.model, max_tokens: 2000, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }] })
      });
      if (!oaiRes.ok) throw new Error(`OpenAI ${oaiRes.status}`);
      content = (await oaiRes.json()).choices?.[0]?.message?.content || "";
      break;
      
    case "gemini":
      if (!env.GOOGLE_API_KEY) throw new Error(`${agent.name} not configured`);
      const gemRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${agent.model}:generateContent?key=${env.GOOGLE_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 2000 } })
      });
      if (!gemRes.ok) throw new Error(`Gemini ${gemRes.status}`);
      content = (await gemRes.json()).candidates?.[0]?.content?.parts?.[0]?.text || "";
      break;
      
    case "workersai":
      if (!env.AI) throw new Error("Workers AI not bound");
      const aiRes = await env.AI.run(agent.model, { messages: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }], max_tokens: 2000 });
      content = aiRes.response || "";
      break;
      
    case "deepseek":
      if (!env.DEEPSEEK_API_KEY) throw new Error(`${agent.name} not configured`);
      const dsRes = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${env.DEEPSEEK_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: agent.model, max_tokens: 2000, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }] })
      });
      if (!dsRes.ok) throw new Error(`DeepSeek ${dsRes.status}`);
      content = (await dsRes.json()).choices?.[0]?.message?.content || "";
      break;
      
    case "mistral":
      if (!env.MISTRAL_API_KEY) throw new Error(`${agent.name} not configured`);
      const mistRes = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${env.MISTRAL_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: agent.model, max_tokens: 2000, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }] })
      });
      if (!mistRes.ok) throw new Error(`Mistral ${mistRes.status}`);
      content = (await mistRes.json()).choices?.[0]?.message?.content || "";
      break;
      
    case "groq":
      if (!env.GROQ_API_KEY) throw new Error(`${agent.name} not configured`);
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${env.GROQ_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: agent.model, max_tokens: 2000, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }] })
      });
      if (!groqRes.ok) throw new Error(`Groq ${groqRes.status}`);
      content = (await groqRes.json()).choices?.[0]?.message?.content || "";
      break;
      
    case "perplexity":
      if (!env.PERPLEXITY_API_KEY) throw new Error(`${agent.name} not configured`);
      const pplxRes = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${env.PERPLEXITY_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: agent.model, max_tokens: 2000, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }] })
      });
      if (!pplxRes.ok) throw new Error(`Perplexity ${pplxRes.status}`);
      content = (await pplxRes.json()).choices?.[0]?.message?.content || "";
      break;
      
    default:
      throw new Error(`Unknown provider: ${agent.provider}`);
  }
  
  return { content, ms: Date.now() - start };
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

function constellation(env) {
  const checkAvail = (p) => {
    const keys = { claude: "ANTHROPIC_API_KEY", openai: "OPENAI_API_KEY", gemini: "GOOGLE_API_KEY", mistral: "MISTRAL_API_KEY", deepseek: "DEEPSEEK_API_KEY", perplexity: "PERPLEXITY_API_KEY", groq: "GROQ_API_KEY", workersai: null };
    return keys[p] === null ? !!env.AI : !!env[keys[p]];
  };
  
  return json({
    thinkers: Object.entries(THINKERS).map(([id, t]) => ({ id, ...t, available: checkAvail(t.provider) })),
    doers: Object.entries(DOERS).map(([id, d]) => ({ id, ...d, available: checkAvail(d.provider) })),
    verifiers: Object.entries(VERIFIERS).map(([id, v]) => ({ id, ...v, available: checkAvail(v.provider) })),
    modes: ["orchestrate", "council", "debate", "consensus"]
  });
}

function health(env) {
  const providers = {};
  ["claude", "openai", "gemini", "mistral", "deepseek", "perplexity", "groq"].forEach(p => {
    const keys = { claude: "ANTHROPIC_API_KEY", openai: "OPENAI_API_KEY", gemini: "GOOGLE_API_KEY", mistral: "MISTRAL_API_KEY", deepseek: "DEEPSEEK_API_KEY", perplexity: "PERPLEXITY_API_KEY", groq: "GROQ_API_KEY" };
    providers[p] = !!env[keys[p]];
  });
  providers.workersai = !!env.AI;
  
  return json({ ok: true, service: "10CC-ROOM", version: "1.0", agents: { thinkers: 5, doers: 5, verifiers: 2 }, providers });
}

async function getHistory(env) {
  if (!env.CONFIG) return json({ history: [] });
  const list = await env.CONFIG.list({ prefix: "orch:" });
  const items = await Promise.all(list.keys.slice(-20).map(k => env.CONFIG.get(k.name, "json")));
  return json({ history: items.filter(Boolean) });
}

async function safeJson(r) { try { return await r.json(); } catch { return {}; } }
function cors() { return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } }); }
function json(d, s = 200) { return new Response(JSON.stringify(d, null, 2), { status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }); }

function dashboard() {
  return new Response(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>10CC Room</title><style>:root{--bg:#0a0908;--card:#0d0c0a;--border:#1a1815;--gold:#d4a574;--text:#e8ddd0;--muted:#6b5a45;--green:#6a9c59;--purple:#9c6ad4;--blue:#5a8ac4;--red:#c45959}*{margin:0;padding:0;box-sizing:border-box}body{background:var(--bg);color:var(--text);font-family:-apple-system,sans-serif;padding:15px}.h{text-align:center;padding:15px;border-bottom:2px solid var(--gold);margin-bottom:15px}.logo{font-size:1.6rem;font-weight:900;color:var(--gold)}.sub{color:var(--muted);font-size:.7rem;margin-top:5px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;max-width:1400px;margin:0 auto}.card{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px}.card h3{color:var(--gold);margin-bottom:10px;font-size:.7rem;text-transform:uppercase;display:flex;align-items:center;gap:6px}.agents{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:6px}.agent{background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:8px;font-size:.7rem;display:flex;align-items:center;gap:6px}.agent.thinker{border-left:2px solid var(--purple)}.agent.doer{border-left:2px solid var(--blue)}.agent.verifier{border-left:2px solid var(--green)}.agent .icon{font-size:1rem}.agent .name{font-weight:700}.agent .avail{width:6px;height:6px;border-radius:50%;margin-left:auto}.agent .avail.on{background:var(--green)}.agent .avail.off{background:var(--red)}textarea{width:100%;background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:8px;color:var(--text);resize:vertical;font-size:.8rem}button{background:var(--gold);color:#000;border:none;padding:8px 14px;border-radius:6px;cursor:pointer;font-weight:700;font-size:.75rem;margin:4px 4px 4px 0}.btn-purple{background:var(--purple);color:#fff}.btn-blue{background:var(--blue);color:#fff}.btn-green{background:var(--green);color:#fff}.out{background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:10px;margin-top:10px;font-size:.7rem;max-height:350px;overflow-y:auto;white-space:pre-wrap}.phase{padding:8px;margin:6px 0;border-radius:4px;border-left:3px solid var(--border)}.phase.think{border-color:var(--purple)}.phase.do{border-color:var(--blue)}.phase.verify{border-color:var(--green)}.phase b{display:block;margin-bottom:4px}</style></head><body><div class="h"><div class="logo">🧠 10CC ROOM</div><div class="sub">AI Constellation Orchestrator • 5 Thinkers • 5 Doers • 2 Verifiers</div></div><div class="grid"><div class="card"><h3>🎭 Thinkers</h3><div class="agents" id="thinkers"></div></div><div class="card"><h3>⚡ Doers</h3><div class="agents" id="doers"></div></div><div class="card"><h3>✅ Verifiers</h3><div class="agents" id="verifiers"></div></div><div class="card" style="grid-column:1/-1"><h3>🎯 Orchestrate</h3><textarea id="prompt" rows="3" placeholder="Enter your problem..."></textarea><div><button onclick="orchestrate()">🔄 Full Orchestration</button><button class="btn-purple" onclick="runCouncil()">👥 Council</button><button class="btn-blue" onclick="runDebate()">⚔️ Debate</button><button class="btn-green" onclick="runConsensus()">🤝 Consensus</button></div><div id="out" class="out" style="display:none"></div></div></div><script>const A=location.origin;async function load(){try{const r=await fetch(A+"/constellation"),d=await r.json();render("thinkers",d.thinkers,"thinker");render("doers",d.doers,"doer");render("verifiers",d.verifiers,"verifier")}catch(e){console.error(e)}}function render(id,agents,cls){const c=document.getElementById(id);c.innerHTML=agents.map(a=>'<div class="agent '+cls+'"><span class="icon">'+a.icon+'</span><span class="name">'+a.id+'</span><span class="avail '+(a.available?"on":"off")+'"></span></div>').join("")}async function orchestrate(){const p=document.getElementById("prompt").value,o=document.getElementById("out");if(!p)return;o.style.display="block";o.innerHTML="<b>Orchestrating...</b>";try{const r=await fetch(A+"/orchestrate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({problem:p})});const d=await r.json();let h='<div class="phase think"><b>🎭 THINK ('+d.phases?.think?.ms+'ms)</b>';d.phases?.think?.thinkers?.forEach(t=>{h+=t.id+": "+(t.content?.slice(0,150)||t.error)+"...\\n"});h+='</div><div class="phase do"><b>⚡ DO ('+d.phases?.do?.ms+'ms)</b>'+(d.final_output?.slice(0,500)||"No output")+'</div><div class="phase verify"><b>✅ VERIFY ('+d.phases?.verify?.ms+'ms)</b>Score: '+(d.quality_score||"?")+'/10</div><div><b>Total:</b> '+d.total_ms+'ms</div>';o.innerHTML=h}catch(e){o.innerHTML="Error: "+e.message}}async function runCouncil(){const p=document.getElementById("prompt").value,o=document.getElementById("out");if(!p)return;o.style.display="block";o.innerHTML="<b>Consulting council...</b>";try{const r=await fetch(A+"/council",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:p})});const d=await r.json();let h="<b>👥 COUNCIL ("+d.ms+"ms)</b>\\n\\n";d.council?.forEach(c=>{h+=c.icon+" <b>"+c.id+":</b> "+(c.content||c.error)+"\\n\\n"});o.innerHTML=h}catch(e){o.innerHTML="Error: "+e.message}}async function runDebate(){const p=document.getElementById("prompt").value,o=document.getElementById("out");if(!p)return;o.style.display="block";o.innerHTML="<b>Starting debate...</b>";try{const r=await fetch(A+"/debate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({topic:p})});const d=await r.json();let h="<b>⚔️ DEBATE: "+d.topic+"</b> ("+d.ms+"ms)\\n\\n";d.transcript?.forEach(t=>{h+="Round "+t.round+" "+t.icon+" <b>"+t.side+":</b> "+t.argument+"\\n\\n"});o.innerHTML=h}catch(e){o.innerHTML="Error: "+e.message}}async function runConsensus(){const p=document.getElementById("prompt").value,o=document.getElementById("out");if(!p)return;o.style.display="block";o.innerHTML="<b>Building consensus...</b>";try{const r=await fetch(A+"/consensus",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:p})});const d=await r.json();let h="<b>🤝 CONSENSUS</b> ("+d.ms+"ms)\\n\\nVotes:\\n";d.votes?.forEach(v=>{h+=v.icon+" "+v.id+": "+(v.vote?.slice(0,100)||v.error)+"...\\n"});h+="\\n<b>Synthesized:</b>\\n"+d.consensus;o.innerHTML=h}catch(e){o.innerHTML="Error: "+e.message}}load()</script></body></html>`, { headers: { "Content-Type": "text/html" } });
}
