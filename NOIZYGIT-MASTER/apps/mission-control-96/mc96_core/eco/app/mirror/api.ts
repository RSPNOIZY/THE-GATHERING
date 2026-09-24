/**
 * NOIZY Mirror v1 — API Service
 * Port 7780 on GOD.local (M2 Ultra)
 *
 * Takes raw creative input, sends to Claude, returns structured brief + analysis.
 * Logs every run as an AutomationRun.
 */

import * as http from 'http';
import * as crypto from 'crypto';
import { MIRROR_SYSTEM_PROMPT, MIRROR_MODEL, MIRROR_MAX_TOKENS } from './prompt';
import {
  MirrorRequest,
  MirrorResponse,
  CreativeBrief,
  MirrorAnalysis,
  AutomationRun,
} from './types';

const startedAt = Date.now();
const runs: AutomationRun[] = [];

function uid(): string {
  return crypto.randomBytes(8).toString('hex');
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  };
}

// ── Call Claude ───────────────────────────────────────────────────────────────

async function callClaude(userMessage: string): Promise<Record<string, unknown>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MIRROR_MODEL,
      max_tokens: MIRROR_MAX_TOKENS,
      system: MIRROR_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Claude API ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { content?: Array<{ text?: string }> };
  const raw = data.content?.[0]?.text ?? '';

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error(`Claude returned non-JSON: ${raw.substring(0, 200)}`);
  }
}

// ── Build user message from MirrorRequest ─────────────────────────────────────

function buildUserMessage(req: MirrorRequest): string {
  let msg = `Source type: ${req.source_type}\nArtist: ${req.artist_name}\n\n`;
  msg += req.source_text;
  if (req.reference_notes) msg += `\n\nReference notes: ${req.reference_notes}`;
  if (req.voice_transcript) msg += `\n\nVoice transcript: ${req.voice_transcript}`;
  return msg;
}

// ── Mirror endpoint ───────────────────────────────────────────────────────────

async function handleMirror(body: MirrorRequest): Promise<MirrorResponse> {
  const runId = uid();
  const briefId = uid();
  const analysisId = uid();
  const now = Date.now();

  const run: AutomationRun = {
    run_id: runId,
    workflow_name: 'mirror-brief-create',
    status: 'started',
    started_at: now,
    artifact_links: [],
  };
  runs.push(run);

  try {
    const userMessage = buildUserMessage(body);
    const claude = await callClaude(userMessage);

    const brief: CreativeBrief = {
      brief_id: briefId,
      title: body.title ?? `Mirror — ${new Date().toISOString().split('T')[0]}`,
      artist_name: body.artist_name,
      source_type: body.source_type,
      source_text: body.source_text,
      emotional_target: (claude.emotional_target as string) ?? '',
      sonic_palette: (claude.sonic_palette as string[]) ?? [],
      structure_notes: (claude.structure_notes as string) ?? '',
      production_cautions: (claude.production_cautions as string[]) ?? [],
      next_moves: (claude.next_moves as string[]) ?? [],
      project_id: body.project_id,
      tags: [],
      created_at: now,
      updated_at: now,
    };

    const analysis: MirrorAnalysis = {
      analysis_id: analysisId,
      brief_id: briefId,
      interpretation: (claude.interpretation as string) ?? '',
      what_changed: (claude.what_changed as string) ?? '',
      why_changed: (claude.why_changed as string) ?? '',
      confidence_notes: (claude.confidence_notes as string) ?? '',
      suggested_lane: (claude.suggested_lane as MirrorAnalysis['suggested_lane']) ?? 'signal',
      next_moves: (claude.next_moves as string[]) ?? [],
      model_used: MIRROR_MODEL,
      run_id: runId,
      created_at: now,
    };

    run.status = 'completed';
    run.completed_at = Date.now();
    run.duration_ms = run.completed_at - run.started_at;

    return { ok: true, brief, analysis, run, ts: now };
  } catch (err: any) {
    run.status = 'failed';
    run.completed_at = Date.now();
    run.duration_ms = run.completed_at - run.started_at;
    run.error = err?.message ?? String(err);
    throw err;
  }
}

// ── HTTP Server ───────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');

  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors());
    res.end();
    return;
  }

  // GET /health
  if (url.pathname === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json', ...cors() });
    res.end(JSON.stringify({
      service: 'NOIZY Mirror',
      status: 'ok',
      uptime: Math.floor((Date.now() - startedAt) / 1000),
      totalRuns: runs.length,
      ts: Date.now(),
    }));
    return;
  }

  // POST /mirror
  if (url.pathname === '/mirror' && req.method === 'POST') {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body) as MirrorRequest;
        if (!parsed.source_text || !parsed.artist_name || !parsed.source_type) {
          res.writeHead(400, { 'Content-Type': 'application/json', ...cors() });
          res.end(JSON.stringify({ ok: false, error: 'source_text, artist_name, source_type required' }));
          return;
        }
        const result = await handleMirror(parsed);
        res.writeHead(200, { 'Content-Type': 'application/json', ...cors() });
        res.end(JSON.stringify(result));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json', ...cors() });
        res.end(JSON.stringify({ ok: false, error: err?.message ?? 'Internal error', ts: Date.now() }));
      }
    });
    return;
  }

  // GET /runs
  if (url.pathname === '/runs' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json', ...cors() });
    res.end(JSON.stringify({ ok: true, data: runs.slice(-50), ts: Date.now() }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json', ...cors() });
  res.end(JSON.stringify({ ok: false, error: 'Not found' }));
});

const PORT = Number(process.env.MIRROR_PORT ?? 7781);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[NOIZY Mirror] Service → http://0.0.0.0:${PORT}`);
});

export { server };
