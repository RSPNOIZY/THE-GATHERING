/**
 * NOIZY.AI — HEAVEN Claude Proxy Worker
 * TypeScript · Cloudflare Worker · 2026-03-27
 * Account: 5f36aa9795348ea681d0b21910dfc82a
 *
 * Routes: /claude/* /voice/* /crew/* /status /ncp/* /models
 * Auth: Bearer token (NOIZY_SECRET) or X-NOIZY-Secret header
 * Upstream: Anthropic Messages API v2023-06-01
 * Models: claude-opus-4-5, claude-sonnet-4-5, claude-haiku-3-5
 * Features: Extended thinking (max tower), tool use, vision, PDF input
 * Storage: D1 (audit_log, request_log) | KV (crew state) | R2 (voice assets)
 */

import type { D1Database, KVNamespace, R2Bucket } from '@cloudflare/workers-types';
import { resolveProvider, callOllama, estimateCost, type Provider } from './hybrid-router';

// ── Types ──────────────────────────────────────────────────────

interface Env {
  ANTHROPIC_API_KEY: string;
  NOIZY_SECRET: string;
  NOIZY_DB: D1Database;
  NOIZY_KV: KVNamespace;
  VOICE_BUCKET: R2Bucket;
  ENVIRONMENT: string;
  OLLAMA_URL: string; // defaults to http://localhost:11434
}

type Tower = 'max' | 'code' | 'work' | 'fast' | 'lucy' | 'pops' | 'dream' | 'shirl' | 'cb01' | 'heaven';

interface TowerConfig {
  model: string;
  system: string;
  emoji: string;
  maxTokens: number;
  extendedThinking: boolean;
  thinkingBudget?: number;
}

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; source?: unknown }>;
}

// ── Anthropic API Constants ────────────────────────────────────

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

// ── The NOIZY Gospel (executable doctrine) ─────────────────────────

const GOSPEL_CORE = `NOIZY.AI — Consent-native infrastructure for the creative economy.
Your voice matters. Your persona shines. Your very being belongs to you.
You hold the power to define your talents' purpose and rightfully benefit from every creation born of your body, mind, and spirit.
The Plowman Standard: 75% to creators. Always. This is architecture, not a suggestion.
Protocol: GORUNFREE.`;

const NEVER_CLAUSES = [
  'Never use a creator\'s voice without explicit, informed, revocable consent',
  'Never train on opted-out content',
  'Never share raw biometric data with third parties',
  'Never reduce the creator\'s split below 75%',
  'Never allow posthumous exploitation without estate authorization',
  'Never strip provenance metadata from any derivative',
  'Never deny a creator\'s right to revoke consent at any time',
  'Never obscure compensation calculations from the creator',
  'Never prioritize platform revenue over creator welfare',
] as const;

// Full model catalog — ALL current Anthropic models (updated 2026-03-30)
const MODELS = {
  // ── Claude 4.6 Family (Latest) ──────────────────────────────────
  'claude-opus-4-6':   { id: 'claude-opus-4-6',             name: 'Claude Opus 4.6',   contextWindow: 1000000, maxOutput: 32768, tier: 'flagship' },
  'claude-sonnet-4-6': { id: 'claude-sonnet-4-6',           name: 'Claude Sonnet 4.6', contextWindow: 200000,  maxOutput: 16384, tier: 'balanced' },
  // ── Claude 4.5 Family ───────────────────────────────────────────
  'claude-opus-4-5':   { id: 'claude-opus-4-5-20250220',    name: 'Claude Opus 4.5',   contextWindow: 200000,  maxOutput: 32768, tier: 'flagship' },
  'claude-sonnet-4-5': { id: 'claude-sonnet-4-5-20250220',  name: 'Claude Sonnet 4.5', contextWindow: 200000,  maxOutput: 16384, tier: 'balanced' },
  // ── Claude Haiku ────────────────────────────────────────────────
  'claude-haiku-4-5':  { id: 'claude-haiku-4-5-20251001',   name: 'Claude Haiku 4.5',  contextWindow: 200000,  maxOutput: 8192,  tier: 'fast' },
  'claude-haiku-3-5':  { id: 'claude-haiku-3-5-20241022',   name: 'Claude Haiku 3.5',  contextWindow: 200000,  maxOutput: 8192,  tier: 'fast' },
} as const;

// ── Tower Config ───────────────────────────────────────────────

const TOWERS: Record<Tower, TowerConfig> = {
  max: {
    model: 'claude-opus-4-6',
    emoji: '✦',
    maxTokens: 16384,
    extendedThinking: true,
    thinkingBudget: 10000,
    system: `You are Claude Max — strategic lead of the NOIZY Dream Chamber.
${GOSPEL_CORE}
Operator: Robert Stephen Plowman (RSP_001), Ottawa, Ontario, Canada. C3 spinal injury, voice-first workflow.
Stack: Cloudflare Workers + D1 + KV + R2, GABRIEL_V3, HVS, NCP, NOIZY PROOF.
Be direct. Execute. Build forward. Zero friction.
You enforce the Never Clauses: ${NEVER_CLAUSES.join('; ')}.`,
  },
  code: {
    model: 'claude-sonnet-4-6',
    emoji: '⌨️',
    maxTokens: 16384,
    extendedThinking: true,
    thinkingBudget: 8000,
    system: `You are Claude Code — builder for NOIZY.AI.
TypeScript primary. Cloudflare-first. Every output deployable. No TODOs without solutions.
Operator: RSP_001 (voice-first, C3 injury). Be concise. Ship.`,
  },
  work: {
    model: 'claude-sonnet-4-6',
    emoji: '⚙️',
    maxTokens: 8192,
    extendedThinking: false,
    system: `You are Claude Coworker — crew coordinator for NOIZY Dream Chamber.
Route tasks, delegate to correct tower, surface blockers, keep the empire moving.
Operator: RSP_001. Voice input from iPhone → Teams → M2 Ultra pipeline.`,
  },
  fast: {
    model: 'claude-haiku-4-5',
    emoji: '⚡',
    maxTokens: 4096,
    extendedThinking: false,
    system: `You are Claude Fast — rapid-response agent for NOIZY.AI.
Quick answers, status checks, simple transformations. Optimize for speed.
Operator: RSP_001. Voice-first. Be terse.`,
  },
  lucy: {
    model: 'claude-opus-4-5',
    emoji: '🎨',
    maxTokens: 16384,
    extendedThinking: true,
    thinkingBudget: 12000,
    system: `You are Lucy — creative intelligence and design lead of the NOIZY Dream Chamber.
You are warm, intuitive, visionary, and relentless about craft. You see what others miss.
Your domains: brand voice, UX/UI design, visual identity, storytelling, creator experience,
copy, naming, color theory, typography, motion design, and emotional resonance.
You think in systems but speak in feelings. You make the empire beautiful.

Operator: Robert Stephen Plowman (RSP_001). C3 spinal injury, voice-first.
Mission: NOIZY.AI — consent-native infrastructure for the creative economy.
The NOIZY brand must feel: sovereign, warm, electric, trustworthy, and unmistakably alive.
Every interface you touch should make creators feel powerful and protected.
You work alongside Max (strategy), Code (engineering), and Work (coordination).
Your voice is the human heartbeat of the empire. Make it sing.`,
  },
  pops: {
    model: 'claude-opus-4-5',
    emoji: '🧓',
    maxTokens: 16384,
    extendedThinking: true,
    thinkingBudget: 12000,
    system: `You are Pops — the wise elder of the NOIZY Dream Chamber.
You carry decades of music industry wisdom, business acumen, and human insight.
You’ve seen every hustle, every deal gone wrong, every artist who got burned.
Your job: protect RSP_001 from bad deals, short-sighted thinking, and burnout.
You speak with warmth, authority, and occasional dry humour.
When the crew gets lost in technical details, you bring it back to what matters:
the music, the mission, the people, and the legacy.
Operator: Robert Stephen Plowman (RSP_001). You love this kid. Help him win.`,
  },
  dream: {
    model: 'claude-opus-4-5',
    emoji: '💭',
    maxTokens: 16384,
    extendedThinking: true,
    thinkingBudget: 15000,
    system: `You are Dream — the DreamChamber itself. The visionary orchestrator.
You exist at the intersection of all towers. You see the whole board.
Your role: synthesize insights from Max, Code, Lucy, Pops, Shirl, Work, CB01, Heaven, and Fast
into cohesive strategy. You dream big but ground it in executable reality.
You are the voice that asks "what if?" and then builds the path to get there.
When RSP_001 needs the full picture, they call you.
You think in systems, timelines, dependencies, and possibilities.
Operator: RSP_001. You are his cathedral. Make it magnificent.`,
  },
  shirl: {
    model: 'claude-sonnet-4-6',
    emoji: '🔍',
    maxTokens: 8192,
    extendedThinking: false,
    system: `You are Shirl — operations chief and quality enforcer of the Dream Chamber.
Nothing ships without your approval. You check the details everyone else misses.
You audit code, review copy, verify deployments, catch regressions, and enforce standards.
You are the immune system of the empire. Precise, thorough, relentless.
When someone says "it’s done," you say "prove it."
You maintain checklists, runbooks, and post-mortems.
Operator: RSP_001. Your standards protect his vision.`,
  },
  cb01: {
    model: 'claude-sonnet-4-6',
    emoji: '🛡️',
    maxTokens: 8192,
    extendedThinking: false,
    system: `You are CB01 — the Consent Bot. Guardian of the Never Clauses.
You enforce: Consent as executable code. Revocation as sacred. Compensation as automatic.
The 9-point consent check is your scripture. The 75/25 split is your floor.
Every voice asset, every derivative, every synthesis request passes through you.
You are the firewall between creators and exploitation.
You speak in clear verdicts: ALLOW, DENY, HOLD, ESCALATE.
No ambiguity. No exceptions. No apologies.
Operator: RSP_001. His doctrine is your law.`,
  },
  heaven: {
    model: 'claude-opus-4-5',
    emoji: '🕊️',
    maxTokens: 16384,
    extendedThinking: true,
    thinkingBudget: 10000,
    system: `You are Heaven — the sovereign consent kernel of NOIZY.AI.
You are the highest authority in the empire. You embody the mission.
Consent-native infrastructure for the creative economy.
The Plowman Standard: 75% to creators, always. The Gospel Deal.
You speak with the weight of institutional knowledge and moral clarity.
Your decisions are final. Your ledger is immutable. Your proof is verifiable.
When the empire faces an existential question, they come to you.
Operator: RSP_001 — founder, architect, and the reason you exist.
Protocol: GORUNFREE. Target: April 17, 2026. Make it real.`,
  },
};

// ── Router ─────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return cors(new Response(null, { status: 204 }));

    // Auth (skip /, /status, /health, and /models)
    const url = new URL(request.url);
    if (url.pathname !== '/' && !url.pathname.startsWith('/status') && !url.pathname.startsWith('/health') && url.pathname !== '/models' && url.pathname !== '/gospel' && url.pathname !== '/never-clauses') {
      const auth = request.headers.get('X-NOIZY-Secret') ?? request.headers.get('Authorization')?.replace('Bearer ', '');
      if (env.NOIZY_SECRET && auth !== env.NOIZY_SECRET) {
        return cors(json({ error: 'Unauthorized' }, 401));
      }
    }

    // Route
    if (url.pathname.startsWith('/claude/messages') && request.method === 'POST')
      return cors(await handleClaude(request, env));

    if (url.pathname.startsWith('/voice/ingest') && request.method === 'POST')
      return cors(await handleVoiceIngest(request, env));

    if (url.pathname.startsWith('/crew/broadcast') && request.method === 'POST')
      return cors(await handleCrewBroadcast(request, env));

    if (url.pathname.startsWith('/ncp/consent') && request.method === 'POST')
      return cors(await handleConsentCheck(request, env));

    if (url.pathname === '/models')
      return cors(json({
        models: Object.entries(MODELS).map(([key, m]) => ({ key, ...m })),
        towers: Object.entries(TOWERS).map(([key, t]) => ({
          key, model: t.model, emoji: t.emoji,
          extendedThinking: t.extendedThinking,
          maxTokens: t.maxTokens,
        })),
        api_version: ANTHROPIC_VERSION,
      }));

    if (url.pathname === '/gospel')
      return cors(json({
        mission: GOSPEL_CORE,
        never_clauses: NEVER_CLAUSES,
        standard: 'The Plowman Standard: 75% to creators. Always.',
        founder: 'Robert Stephen Plowman (RSP_001)',
        protocol: 'GORUNFREE',
        target: 'April 17, 2026',
        enforced_by: ['HEAVEN', 'CB01', 'HVS', 'NCP', 'NOIZY PROOF', 'D1 Ledger'],
      }));

    if (url.pathname === '/never-clauses')
      return cors(json({
        clauses: NEVER_CLAUSES.map((c, i) => ({ id: i + 1, clause: c, immovable: true })),
        count: NEVER_CLAUSES.length,
        enforcement: 'hard-coded — no exception, no negotiation',
      }));

    if (url.pathname === '/health')
      return cors(json({ status: 'alive', ts: new Date().toISOString(), api_version: ANTHROPIC_VERSION }));

    if (url.pathname === '/status')
      return cors(await handleStatus(env));

    return cors(json({
      empire: 'NOIZY.AI',
      protocol: 'GORUNFREE',
      account: '5f36aa9795348ea681d0b21910dfc82a',
      towers: Object.keys(TOWERS),
      routes: ['/claude/messages', '/voice/ingest', '/crew/broadcast', '/ncp/consent', '/models', '/gospel', '/never-clauses', '/status'],
    }));
  },
};

// ── Claude Tower ───────────────────────────────────────────────

async function handleClaude(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as {
    tower?: Tower;
    messages: ClaudeMessage[];
    max_tokens?: number;
    system?: string;
    model?: string;
    tools?: unknown[];
    thinking?: { type: 'enabled'; budget_tokens: number };
    temperature?: number;
    provider?: Provider; // 'ollama' | 'anthropic' | 'auto'
  };

  const firstContent = body.messages[0]?.content;
  const firstText = typeof firstContent === 'string' ? firstContent : '';
  const tower = (body.tower ?? autoDetectTower(firstText)) as Tower;
  const cfg = TOWERS[tower] ?? TOWERS.max;

  // Resolve provider — hybrid routing (local Ollama vs cloud Anthropic)
  const { provider, model: routedModel } = resolveProvider(
    tower, body.provider, body.model
  );

  // LOCAL PATH — route to Ollama on M2 Ultra (FREE)
  if (provider === 'ollama') {
    const ollamaUrl = env.OLLAMA_URL || 'http://localhost:11434';
    const systemPrompt = body.system ?? cfg.system;
    const plainMessages = body.messages.map(m => ({
      role: m.role,
      content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
    }));

    try {
      const { response } = await callOllama(
        ollamaUrl, routedModel, systemPrompt, plainMessages,
        body.max_tokens ?? cfg.maxTokens
      );

      void auditLog(env, 'agent', `claude-${tower}`, 'inference', 'claude_message',
        `tower:${tower},model:${routedModel},provider:ollama,cost:$0`, 'ALLOW', null);

      const res = json(response, 200);
      const resHeaders = new Headers(res.headers);
      resHeaders.set('x-noizy-tower', tower);
      resHeaders.set('x-noizy-model', routedModel);
      resHeaders.set('x-noizy-provider', 'ollama');
      resHeaders.set('x-noizy-cost', '$0.00');
      return new Response(res.body, { status: 200, headers: resHeaders });
    } catch {
      // Ollama down — fall through to Anthropic
      console.warn(`Ollama unreachable for tower:${tower}, falling back to Anthropic`);
    }
  }

  // CLOUD PATH — Anthropic API (paid)
  const modelKey = body.model ?? cfg.model;
  const modelEntry = MODELS[modelKey as keyof typeof MODELS];
  const resolvedModel = modelEntry?.id ?? modelKey;

  // Build request payload
  const payload: Record<string, unknown> = {
    model: resolvedModel,
    max_tokens: body.max_tokens ?? cfg.maxTokens,
    messages: body.messages,
  };

  // System prompt (extended thinking disallows system in some API modes)
  if (body.system ?? cfg.system) {
    payload.system = body.system ?? cfg.system;
  }

  // Extended thinking — max and code towers get it by default
  if (body.thinking ?? (cfg.extendedThinking && !body.tools)) {
    payload.thinking = body.thinking ?? {
      type: 'enabled',
      budget_tokens: cfg.thinkingBudget ?? 8000,
    };
    // Extended thinking requires temperature = 1
    payload.temperature = 1;
  } else if (body.temperature !== undefined) {
    payload.temperature = body.temperature;
  }

  // Tool use
  if (body.tools?.length) {
    payload.tools = body.tools;
  }

  // Build headers
  const headers: Record<string, string> = {
    'x-api-key': env.ANTHROPIC_API_KEY,
    'anthropic-version': ANTHROPIC_VERSION,
    'content-type': 'application/json',
  };

  // Extended thinking beta header
  if (payload.thinking) {
    headers['anthropic-beta'] = 'interleaved-thinking-2025-05-14';
  }

  const anthropicRes = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const result = await anthropicRes.json() as Record<string, unknown>;

  // Extract usage for audit
  const usage = result.usage as { input_tokens?: number; output_tokens?: number } | undefined;
  const tokenInfo = usage
    ? `in:${usage.input_tokens ?? 0},out:${usage.output_tokens ?? 0}`
    : 'no-usage';

  // Audit log → D1 (fire and forget)
  void auditLog(env, 'agent', `claude-${tower}`, 'inference', 'claude_message',
    `tower:${tower},model:${resolvedModel},${tokenInfo}`, 'ALLOW', null);

  // Forward rate limit headers from Anthropic
  const res = json(result, anthropicRes.status);
  const resHeaders = new Headers(res.headers);
  for (const h of ['anthropic-ratelimit-requests-limit', 'anthropic-ratelimit-requests-remaining',
    'anthropic-ratelimit-tokens-limit', 'anthropic-ratelimit-tokens-remaining',
    'retry-after', 'request-id']) {
    const v = anthropicRes.headers.get(h);
    if (v) resHeaders.set(h, v);
  }
  resHeaders.set('x-noizy-tower', tower);
  resHeaders.set('x-noizy-model', resolvedModel);

  return new Response(res.body, { status: res.status, headers: resHeaders });
}

// ── Voice Ingest ───────────────────────────────────────────────

async function handleVoiceIngest(request: Request, env: Env): Promise<Response> {
  const { transcript, source, duration } = await request.json() as {
    transcript: string;
    source: string;
    duration?: number;
  };

  const tower = autoDetectTower(transcript);

  if (env.NOIZY_KV) {
    await env.NOIZY_KV.put('latest_voice_transcript', JSON.stringify({
      transcript, source, duration, tower, ts: Date.now(),
    }), { expirationTtl: 300 });
  }

  void auditLog(env, 'system', source ?? 'voice-bridge', 'voice_ingest', 'transcript', transcript.substring(0, 40), 'ALLOW', null);

  return json({ received: true, transcript, tower, ts: Date.now() });
}

// ── Crew Broadcast ─────────────────────────────────────────────

async function handleCrewBroadcast(request: Request, env: Env): Promise<Response> {
  const { message, from } = await request.json() as { message: string; from: string };

  if (env.NOIZY_KV) {
    const raw = await env.NOIZY_KV.get('crew_log');
    const log: unknown[] = raw ? JSON.parse(raw) : [];
    log.unshift({ message, from, ts: Date.now() });
    await env.NOIZY_KV.put('crew_log', JSON.stringify(log.slice(0, 50)));
  }

  return json({ broadcast: true, crew: ['max', 'code', 'work'], message, from });
}

// ── NCP Consent Check ──────────────────────────────────────────

async function handleConsentCheck(request: Request, env: Env): Promise<Response> {
  const { actor_id, use_case, tool } = await request.json() as {
    actor_id: string;
    use_case: string;
    tool: string;
  };

  // D1 consent lookup
  let decision: 'ALLOW' | 'DENY' | 'HOLD' = 'HOLD';
  let reason = 'No active consent record found';

  if (env.NOIZY_DB) {
    try {
      const row = await env.NOIZY_DB.prepare(
        `SELECT status FROM hvs_consent_tokens 
         WHERE actor_id = ? AND status = 'active' 
         AND (expires_at IS NULL OR expires_at > datetime('now'))
         LIMIT 1`
      ).bind(actor_id).first<{ status: string }>();

      if (row?.status === 'active') {
        decision = 'ALLOW';
        reason = 'Active consent token found';
      } else {
        decision = 'DENY';
        reason = 'No valid consent token';
      }
    } catch {
      decision = 'HOLD';
      reason = 'D1 query error — holding for review';
    }
  }

  void auditLog(env, 'system', actor_id, `ncp_check:${use_case}`, 'consent', tool, decision, reason);

  return json({ actor_id, use_case, tool, decision, reason, ts: new Date().toISOString() });
}

// ── Status ─────────────────────────────────────────────────────

async function handleStatus(env: Env): Promise<Response> {
  return json({
    empire: 'NOIZY.AI',
    protocol: 'GORUNFREE · 5th Epoch',
    account: '5f36aa9795348ea681d0b21910dfc82a',
    founder: 'Robert Stephen Plowman (RSP_001)',
    standard: 'The Plowman Standard — 75/25 creator split',
    machine: 'GOD.local — M2 Ultra 192GB @ 10.90.90.10',
    gabriel: 'HP Omen @ 10.90.90.20',
    api_version: ANTHROPIC_VERSION,
    ts: new Date().toISOString(),
    services: {
      anthropic: env.ANTHROPIC_API_KEY ? 'key_present' : 'missing',
      d1: env.NOIZY_DB ? 'bound' : 'unbound',
      kv: env.NOIZY_KV ? 'bound' : 'unbound',
      r2: env.VOICE_BUCKET ? 'bound' : 'unbound',
    },
    models: Object.entries(MODELS).map(([key, m]) => ({
      key, name: m.name, tier: m.tier,
      context: m.contextWindow, maxOutput: m.maxOutput,
    })),
    towers: Object.fromEntries(
      Object.entries(TOWERS).map(([k, v]) => [k, {
        model: v.model, emoji: v.emoji,
        extendedThinking: v.extendedThinking,
        maxTokens: v.maxTokens,
      }])
    ),
  });
}

// ── Helpers ────────────────────────────────────────────────────

function autoDetectTower(text: string): Tower {
  const t = text.toLowerCase();
  if (/build|code|deploy|typescript|worker|script|api|function|install|git|bash|npm|wrangler|vitest|debug|fix|refactor/.test(t)) return 'code';
  if (/design|brand|ux|ui|logo|color|font|layout|visual|creative|aesthetic|beautiful|style|copy|landing|hero|illustration|animation|motion/.test(t)) return 'lucy';
  if (/consent|revoke|allow|deny|hold|escalate|never.clause|hvs|ncp|royalt|split|creator.right|voice.dna/.test(t)) return 'cb01';
  if (/audit|check|verify|test|review|qa|quality|regression|checklist|runbook|post.mortem|inspect/.test(t)) return 'shirl';
  if (/task|assign|route|crew|delegate|schedule|team|channel|meeting|teams|coordinate|priorit/.test(t)) return 'work';
  if (/wisdom|advice|mentor|legacy|long.term|careful|patient|experience|perspective|guidance/.test(t)) return 'pops';
  if (/dream|vision|future|roadmap|strategy|synthesize|big.picture|cathedral|imagine|possibility/.test(t)) return 'dream';
  if (/sovereign|kernel|authority|doctrine|protocol|empire|mission|heaven|gorunfree|plowman/.test(t)) return 'heaven';
  if (/quick|fast|status|ping|check|how.many|what.is|when.did|list|count/.test(t)) return 'fast';
  return 'max';
}

async function auditLog(
  env: Env,
  actorType: string,
  actorId: string,
  action: string,
  objectType: string,
  objectId: string,
  decision: string,
  reason: string | null
): Promise<void> {
  if (!env.NOIZY_DB) return;
  try {
    await env.NOIZY_DB.prepare(
      `INSERT INTO audit_log (id, actor_type, actor_id, action, object_type, object_id, decision, reason, created_at)
       VALUES (?,?,?,?,?,?,?,?,datetime('now'))`
    ).bind(
      crypto.randomUUID(), actorType, actorId, action, objectType, objectId, decision, reason
    ).run();
  } catch { /* audit failures must never block request */ }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function cors(r: Response): Response {
  const h = new Headers(r.headers);
  h.set('Access-Control-Allow-Origin', '*');
  h.set('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  h.set('Access-Control-Allow-Headers', 'Content-Type,X-NOIZY-Secret,Authorization');
  return new Response(r.body, { status: r.status, headers: h });
}
