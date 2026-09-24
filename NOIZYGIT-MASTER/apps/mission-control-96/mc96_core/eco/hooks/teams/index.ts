/**
 * NOIZY.AI — Microsoft Teams Bot Worker (TypeScript)
 * Cloudflare Worker that receives Teams webhooks and routes to Claude
 *
 * Route: api.noizy.ai/teams/*
 */

import type { D1Database, ExecutionContext } from '@cloudflare/workers-types';

// ── Types ──────────────────────────────────────────────────────

interface Env {
  ANTHROPIC_API_KEY: string;
  NOIZY_DB?: D1Database;
}

interface TeamsMessageBody {
  message?: string;
  channel?: string;
  sender?: string;
  webhook_url?: string;
}

type Tower = 'max' | 'code' | 'work';

// ── Router ─────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return cors(new Response(null, { status: 204 }));

    // ── Receive message from Teams (via Power Automate)
    if (url.pathname === '/teams/message' && request.method === 'POST') {
      return cors(await handleTeamsMessage(request, env));
    }

    // ── Health check
    if (url.pathname === '/teams/status') {
      return cors(new Response(JSON.stringify({
        status: 'online', service: 'NOIZY Teams Bridge',
        channels: ['claude-max', 'claude-code', 'claude-coworker', 'voice-commands']
      }), { headers: { 'Content-Type': 'application/json' } }));
    }

    return cors(new Response('NOIZY Teams Bridge — online', { status: 200 }));
  }
};

// ── Handlers ───────────────────────────────────────────────────

async function handleTeamsMessage(request: Request, env: Env): Promise<Response> {
  let body: TeamsMessageBody;
  try {
    body = await request.json() as TeamsMessageBody;
  } catch {
    return new Response('Bad JSON', { status: 400 });
  }

  const { message, channel, sender, webhook_url } = body;
  if (!message) return new Response('No message', { status: 400 });

  // Route to correct Claude tower based on channel
  const towerMap: Record<string, Tower> = {
    'claude-max': 'max',
    'claude-code': 'code',
    'claude-coworker': 'work',
    'voice-commands': 'max', // default voice → Max
  };
  const tower = towerMap[channel || ''] || 'max';

  const systemPrompts: Record<Tower, string> = {
    max: 'You are Claude Max, strategic lead of the NOIZY.AI Dream Chamber. Robert is speaking to you via Microsoft Teams from his iPhone 15 Pro Max. Be concise — this is voice-to-text input. NOIZY.AI is a premium voice library platform fighting for fair compensation for AI and human voice actors. Founded by Robert Stephen Plowman, Ottawa, Ontario, Canada.',
    code: 'You are Claude Code, the builder of NOIZY.AI. Robert is sending a build request via Teams on his iPhone. Be direct. Give code, commands, or concrete steps. No fluff.',
    work: 'You are Claude Coworker, crew coordinator for NOIZY.AI Dream Chamber. Robert sent this via Teams on iPhone. Route tasks, delegate, summarize, and keep things moving.',
  };

  // Call Claude via Anthropic API
  const claudeResp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: tower === 'max' ? 'claude-opus-4-6' : 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompts[tower],
      messages: [{ role: 'user', content: message }]
    })
  });

  const claudeData = await claudeResp.json() as any;
  const reply = claudeData.content?.[0]?.text || 'No response from Claude.';
  const towerEmoji = { max: '✦', code: '⌨️', work: '⚙️' }[tower];

  // Log to D1
  if (env.NOIZY_DB) {
    try {
      await env.NOIZY_DB.prepare(
        'INSERT INTO request_log (tower, model, message_preview, ts) VALUES (?,?,?,?)'
      ).bind(tower, claudeData.model || 'claude', message.substring(0, 100), Date.now()).run();
    } catch (_) {}
  }

  // Post reply back to Teams via incoming webhook
  if (webhook_url) {
    // Implementation of adaptive card payload removed for brevity in example,
    // but structurally identical to JS version strongly typed
  }

  return cors(new Response(JSON.stringify({
    success: true, tower, reply: reply.substring(0, 200) + '…'
  }), { headers: { 'Content-Type': 'application/json' } }));
}

function cors(r: Response): Response {
  const h = new Headers(r.headers);
  h.set('Access-Control-Allow-Origin', '*');
  h.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  h.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  return new Response(r.body, { status: r.status, headers: h });
}
