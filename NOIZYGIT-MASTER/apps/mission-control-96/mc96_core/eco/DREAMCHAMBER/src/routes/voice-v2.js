/**
 * voice-v2.js — DreamChamber Voice Pipeline v2
 * NOIZY Empire | GORUNFREE | RSP_001
 *
 * Handles:
 *   POST /api/voice/transcribe   — Whisper STT (file upload or path)
 *   POST /api/voice/speak        — Text → Claude tower → response
 *   POST /api/voice/pipeline     — Full: audio → Whisper → Claude → WebSocket push
 *   POST /api/voice/audiohijack  — Audio Hijack webhook (recording complete)
 *   GET  /api/voice/status       — Pipeline status
 *   GET  /api/voice/log          — Last N pipeline runs
 *   WS   /ws (existing)          — Live push of pipeline results
 */

'use strict';

const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { exec, execFile, execSync } = require('child_process');
const { promisify } = require('util');
const crypto   = require('crypto');

const router    = express.Router();
const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

// ── HEAVEN Consent + NOIZYVOX Integration ─────────────────────
const HEAVEN_URL   = process.env.HEAVEN_URL || 'https://heaven.rsp-5f3.workers.dev';
const NOIZYVOX_URL = process.env.NOIZYVOX_URL || 'http://localhost:8420';
const NOIZY_API_KEY = process.env.NOIZY_API_KEY || '';

async function verifyConsent(actorId, useCase, territory = 'CA') {
  try {
    // First: find an active consent token for this actor + use case
    const tokRes = await fetch(`${HEAVEN_URL}/api/v1/actors/${actorId}/consent-tokens`, {
      headers: { 'Content-Type': 'application/json', 'X-NOIZY-Key': NOIZY_API_KEY },
    });
    if (!tokRes.ok) {
      return { approved: false, error: `HEAVEN token lookup failed: ${tokRes.status}` };
    }
    const tokData = await tokRes.json();
    const tokens = tokData.consent_tokens || [];

    // Find a token that covers this use case (or "general")
    const validToken = tokens.find(t => {
      if (t.status !== 'active') return false;
      const cats = JSON.parse(t.use_categories || '[]');
      return cats.includes(useCase) || cats.includes('general');
    });

    if (!validToken) {
      return { approved: false, error: `No active consent token for use case: ${useCase}` };
    }

    // Submit synth request with the valid token
    const res = await fetch(`${HEAVEN_URL}/api/v1/synth-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-NOIZY-Key': NOIZY_API_KEY },
      body: JSON.stringify({
        actor_id: actorId,
        descendant_id: validToken.descendant_id || actorId,
        consent_token_id: validToken.token_id,
        use_category: useCase,
        territory,
        status: 'pending',
      }),
    });
    const data = await res.json();
    return { approved: res.ok && !data.error, data, token_id: validToken.token_id, status: res.status };
  } catch (e) {
    return { approved: false, error: e.message, status: 0 };
  }
}

async function synthesizeVoice(text, voice = 'default', language = 'en') {
  try {
    const form = new URLSearchParams();
    form.append('text', text);
    form.append('voice', voice);
    form.append('language', language);
    const res = await fetch(`${NOIZYVOX_URL}/speak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.detail || `NOIZYVOX ${res.status}` };
    }
    // Save the audio response to file
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const outPath = `${RESPONSE_DIR}/voice_${ts}.wav`;
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(outPath, buffer);
    return { success: true, path: outPath, size: buffer.length };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ── Config ─────────────────────────────────────────────────────
const HOME         = process.env.HOME || require('os').homedir();
const PIPELINE_DIR = `${HOME}/NOIZYLAB/voice-pipeline`;
const LOG_DIR      = `${HOME}/NOIZYLAB/logs/voice-pipeline`;
const UPLOAD_DIR   = `${HOME}/NOIZYLAB/voice-pipeline/uploads`;
const TRANSCRIPT_DIR = `${HOME}/NOIZYLAB/voice-pipeline/transcripts`;
const RESPONSE_DIR   = `${HOME}/NOIZYLAB/voice-pipeline/responses`;
const FFMPEG       = process.env.FFMPEG_PATH || '/opt/homebrew/bin/ffmpeg';
const WHISPER_CMD  = _detectWhisper();
const STATE_FILE   = `${HOME}/NOIZYLAB/voice-pipeline/.pipeline-state.json`;

// Lazy init — only create dirs when first request arrives (avoids EPERM at startup)
let _dirsInit = false;
function ensureDirs() {
  if (_dirsInit) return;
  try {
    [LOG_DIR, UPLOAD_DIR, TRANSCRIPT_DIR, RESPONSE_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));
    _dirsInit = true;
  } catch (e) {
    console.warn('[voice-v2] Could not create dirs:', e.message);
  }
}

// ── Multer (audio file upload) ─────────────────────────────────
const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const ts  = new Date().toISOString().replace(/[:.]/g, '-');
    const ext = path.extname(file.originalname) || '.wav';
    cb(null, `voice-${ts}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /\.(wav|m4a|mp3|ogg|opus|caf|flac|aac)$/i.test(file.originalname);
    cb(ok ? null : new Error('Invalid audio format'), ok);
  }
});

// ── Tower Definitions ──────────────────────────────────────────
const TOWERS = {
  max: {
    model:  'claude-opus-4-5',
    system: `You are Claude Max, strategic intelligence of the NOIZY.AI DreamChamber.
Robert Stephen Plowman (RSP_001) of Ottawa, Ontario is your founder. C3 spinal injury — voice-first operator.
NOIZY.AI builds a consent-native, provenance-first premium voice library.
75/25 creators always. 85/15 for RSP_001.
This input came via voice pipeline on GOD.local (M2 Ultra 192GB).
Be direct, strategic, brilliant. Treat every request as a C-suite decision.`,
  },
  code: {
    model:  'claude-sonnet-4-5',
    system: `You are Claude Code for NOIZY.AI. Robert sent this by voice via iPhone → Whisper → DreamChamber.
Build, fix, deploy. Return working code, exact commands, no filler.
Stack: Node.js, Cloudflare Workers, D1 (agent-memory), Tailscale, M2 Ultra.`,
  },
  work: {
    model:  'claude-sonnet-4-5',
    system: `You are Claude Coworker in the NOIZY.AI DreamChamber crew.
Robert's voice input came via iPhone → whisper → pipeline.
Coordinate, delegate, summarize, keep things moving.
Crew: CB01, GABRIEL, Lucy, Dream, Shirley, Engr-Keith, Family, Heaven-MCP.`,
  },
};

// ── State ──────────────────────────────────────────────────────
let pipelineState = _loadState();
let _wsRef = null; // injected by server.js

function setWss(wss) { _wsRef = wss; }

function _loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return { runs: [], lastRun: null, totalRuns: 0, errors: 0 };
  }
}

function _saveState() {
  try { fs.writeFileSync(STATE_FILE, JSON.stringify(pipelineState, null, 2)); } catch {}
}

function _pushWs(event, data) {
  if (!_wsRef) return;
  const msg = JSON.stringify({ type: `voice:${event}`, ...data, ts: Date.now() });
  _wsRef.clients?.forEach(c => {
    if (c.readyState === 1) c.send(msg);
  });
}

function _log(runId, msg) {
  const line = `[${new Date().toISOString()}] [${runId}] ${msg}\n`;
  fs.appendFileSync(`${LOG_DIR}/pipeline.log`, line);
}

// ── Whisper Detection ──────────────────────────────────────────
function _detectWhisper() {
  const candidates = [
    'mlx_whisper',
    '/opt/homebrew/bin/whisper',
    `${process.env.HOME}/.local/bin/whisper`,
    'whisper',
  ];
  for (const c of candidates) {
    try { execSync(`which ${c} 2>/dev/null || command -v ${c} 2>/dev/null`, { stdio: 'pipe' }); return c; }
    catch {}
  }
  return null;
}

// ── Transcription Engine ───────────────────────────────────────
async function transcribeAudio(inputPath, runId) {
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const wavPath  = `${UPLOAD_DIR}/${baseName}_16k.wav`;

  // Normalize to 16kHz mono WAV
  await execFileAsync(FFMPEG, [
    '-i', inputPath,
    '-ar', '16000',
    '-ac', '1',
    '-c:a', 'pcm_s16le',
    '-y', wavPath,
  ]);
  _log(runId, `Normalized: ${wavPath}`);

  let transcript = '';

  if (WHISPER_CMD === 'mlx_whisper') {
    // Apple Silicon native — fastest
    const outFile = `${TRANSCRIPT_DIR}/${baseName}.txt`;
    try {
      await execAsync(
        `mlx_whisper "${wavPath}" --model mlx-community/whisper-base.en-mlx --output-dir "${TRANSCRIPT_DIR}"`,
        { timeout: 60000 }
      );
      if (fs.existsSync(outFile)) transcript = fs.readFileSync(outFile, 'utf8').trim();
    } catch (e) {
      _log(runId, `mlx_whisper error: ${e.message}`);
    }
  } else if (WHISPER_CMD) {
    const r = await execAsync(
      `"${WHISPER_CMD}" "${wavPath}" --model base.en --output_format txt --output_dir "${TRANSCRIPT_DIR}"`,
      { timeout: 120000 }
    ).catch(e => ({ stdout: '', stderr: e.message }));
    const txtFile = `${TRANSCRIPT_DIR}/${baseName}.txt`;
    if (fs.existsSync(txtFile)) transcript = fs.readFileSync(txtFile, 'utf8').trim();
    else transcript = r.stdout.trim();
  } else {
    // Fallback: Ollama whisper-compatible (gemma3 won't do STT but log the gap)
    throw new Error('No Whisper installation found. Install: pip install mlx-whisper');
  }

  // Cleanup silent/noise transcripts
  if (!transcript || transcript.length < 3) {
    throw new Error('Transcript too short — likely silence or noise');
  }

  _log(runId, `Transcript (${transcript.length}c): ${transcript.slice(0, 100)}`);
  return { transcript, wavPath };
}

// ── Claude Tower Dispatch ──────────────────────────────────────
async function callClaude(text, tower = 'max', runId) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const cfg = TOWERS[tower] || TOWERS.max;
  _log(runId, `Calling Claude ${tower} (${cfg.model})…`);

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: {
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
    },
    body: JSON.stringify({
      model:      cfg.model,
      max_tokens: 2048,
      system:     cfg.system,
      messages:   [{ role: 'user', content: text }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Claude API ${res.status}: ${err.error?.message || 'Unknown'}`);
  }

  const data = await res.json();
  const reply = data.content?.[0]?.text || '';
  const usage = data.usage || {};

  _log(runId, `Claude replied (${reply.length}c), tokens: ${JSON.stringify(usage)}`);
  return { reply, usage, model: cfg.model };
}

// ── Auto-detect tower from text ────────────────────────────────
function detectTower(text) {
  const t = text.toLowerCase();
  if (/build|code|deploy|script|api|worker|function|install|git|fix|debug|error/.test(t)) return 'code';
  if (/task|assign|route|crew|channel|delegate|schedule|team|coordinate/.test(t)) return 'work';
  return 'max';
}

// ── Routes ─────────────────────────────────────────────────────

/**
 * POST /api/voice/transcribe
 * Upload audio → Whisper → transcript
 */
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  const runId = crypto.randomBytes(4).toString('hex');
  _log(runId, `Transcribe request: ${req.file?.originalname || req.body?.path}`);

  try {
    const inputPath = req.file?.path || req.body?.path;
    if (!inputPath || !fs.existsSync(inputPath)) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    _pushWs('transcribing', { runId, file: path.basename(inputPath) });
    const { transcript, wavPath } = await transcribeAudio(inputPath, runId);

    _pushWs('transcribed', { runId, transcript });
    res.json({ runId, transcript, wavPath });
  } catch (e) {
    _log(runId, `ERROR: ${e.message}`);
    _pushWs('error', { runId, step: 'transcribe', error: e.message });
    res.status(500).json({ error: e.message, runId });
  }
});

/**
 * POST /api/voice/speak
 * Text → Claude tower → response
 * Body: { text, tower? }
 */
router.post('/speak', async (req, res) => {
  const runId = crypto.randomBytes(4).toString('hex');
  const { text, tower: towerHint, userId = 'rsp001' } = req.body;

  if (!text) return res.status(400).json({ error: 'text required' });

  const tower = towerHint || detectTower(text);
  _log(runId, `Speak: tower=${tower}, text="${text.slice(0, 80)}"`);

  try {
    _pushWs('speaking', { runId, tower, text: text.slice(0, 100) });
    const { reply, usage, model } = await callClaude(text, tower, runId);

    // Save response
    const ts   = new Date().toISOString().replace(/[:.]/g, '-');
    const rPath = `${RESPONSE_DIR}/${ts}_${tower}.txt`;
    fs.writeFileSync(rPath, reply);

    // Log run
    const run = { runId, ts: Date.now(), tower, model, inputLen: text.length, outputLen: reply.length, usage };
    pipelineState.runs = [run, ...pipelineState.runs].slice(0, 50);
    pipelineState.lastRun = run;
    pipelineState.totalRuns++;
    _saveState();

    _pushWs('response', { runId, tower, model, reply, usage });

    res.json({ runId, tower, model, reply, usage, savedTo: rPath });
  } catch (e) {
    pipelineState.errors++;
    _saveState();
    _log(runId, `ERROR: ${e.message}`);
    _pushWs('error', { runId, step: 'speak', error: e.message });
    res.status(500).json({ error: e.message, runId });
  }
});

/**
 * POST /api/voice/pipeline
 * Full pipeline: audio file → Whisper → Claude → WebSocket push
 * Body: { path } OR multipart audio upload
 */
router.post('/pipeline', upload.single('audio'), async (req, res) => {
  const runId = crypto.randomBytes(4).toString('hex');
  const towerHint = req.body?.tower;
  const inputPath = req.file?.path || req.body?.path;

  if (!inputPath) return res.status(400).json({ error: 'audio file or path required' });
  if (!fs.existsSync(inputPath)) return res.status(400).json({ error: `File not found: ${inputPath}` });

  _log(runId, `Pipeline start: ${inputPath}`);
  res.json({ runId, status: 'running', message: 'Pipeline started — listen on WebSocket for results' });

  // Run pipeline async (already responded)
  setImmediate(async () => {
    try {
      _pushWs('pipeline:start', { runId, file: path.basename(inputPath) });

      // Step 1: Transcribe
      _pushWs('pipeline:step', { runId, step: 1, name: 'whisper' });
      const { transcript } = await transcribeAudio(inputPath, runId);
      _pushWs('pipeline:transcript', { runId, transcript });

      // Step 2: Claude
      const tower = towerHint || detectTower(transcript);
      _pushWs('pipeline:step', { runId, step: 2, name: 'claude', tower });
      const { reply, usage, model } = await callClaude(transcript, tower, runId);

      // Step 3: Notify
      _pushWs('pipeline:complete', { runId, tower, model, transcript, reply, usage });

      // macOS notification
      exec(`osascript -e 'display notification "${reply.slice(0, 80).replace(/"/g, "'")}" with title "Claude ${tower} — NOIZY"'`);

      // Log
      const run = { runId, ts: Date.now(), file: path.basename(inputPath), tower, model, transcript: transcript.slice(0, 200), reply: reply.slice(0, 200), usage };
      pipelineState.runs = [run, ...pipelineState.runs].slice(0, 50);
      pipelineState.lastRun = run;
      pipelineState.totalRuns++;
      _saveState();
      _log(runId, `Pipeline complete ✓`);

    } catch (e) {
      pipelineState.errors++;
      _saveState();
      _log(runId, `Pipeline ERROR: ${e.message}`);
      _pushWs('pipeline:error', { runId, error: e.message });
    }
  });
});

/**
 * POST /api/voice/audiohijack
 * Called by Audio Hijack's "Run Script" action when recording completes.
 * Body: { path, duration?, title? } OR just sends the file path as plain text
 */
router.post('/audiohijack', async (req, res) => {
  const runId = crypto.randomBytes(4).toString('hex');

  // Audio Hijack can POST JSON or form data
  let filePath = req.body?.path || req.body?.file || req.body?.recording;
  if (!filePath && typeof req.body === 'string') filePath = req.body.trim();

  _log(runId, `Audio Hijack webhook: ${filePath}`);

  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(400).json({ error: 'Valid file path required', received: filePath });
  }

  res.json({ runId, status: 'queued', message: 'Auto-pipeline starting' });

  // Trigger full pipeline
  setImmediate(async () => {
    try {
      _pushWs('audiohijack:received', { runId, file: path.basename(filePath) });
      const { transcript } = await transcribeAudio(filePath, runId);
      const tower = detectTower(transcript);
      const { reply, usage, model } = await callClaude(transcript, tower, runId);
      _pushWs('audiohijack:complete', { runId, tower, model, transcript, reply, usage });
      exec(`osascript -e 'display notification "${reply.slice(0, 80).replace(/"/g, "'")}" with title "Claude ${tower} — NOIZY"'`);
      _log(runId, `AudioHijack pipeline complete ✓`);
    } catch (e) {
      _log(runId, `AudioHijack ERROR: ${e.message}`);
      _pushWs('audiohijack:error', { runId, error: e.message });
    }
  });
});

/**
 * POST /api/voice/synthesize
 * Consent-gated voice synthesis: HEAVEN verify → NOIZYVOX TTS → proof chain
 * Body: { text, voice?, language?, actor_id?, use_case?, territory? }
 */
router.post('/synthesize', async (req, res) => {
  const runId = crypto.randomBytes(4).toString('hex');
  const {
    text,
    voice = 'default',
    language = 'en',
    actor_id = 'RSP_001',
    use_case = 'voice_synthesis',
    territory = 'CA',
  } = req.body;

  if (!text) return res.status(400).json({ error: 'text required' });

  ensureDirs();
  _log(runId, `Synthesize: actor=${actor_id}, voice=${voice}, text="${text.slice(0, 80)}"`);

  try {
    // STEP 1: HEAVEN consent verification — NO TOKEN, NO OUTPUT
    _pushWs('synth:consent_check', { runId, actor_id, use_case });
    const consent = await verifyConsent(actor_id, use_case, territory);

    if (!consent.approved) {
      _log(runId, `CONSENT DENIED: ${consent.error || JSON.stringify(consent.data)}`);
      _pushWs('synth:consent_denied', { runId, actor_id, reason: consent.error || 'denied' });
      return res.status(403).json({
        error: 'Consent denied',
        reason: consent.error || consent.data?.error || 'HEAVEN rejected synthesis request',
        actor_id,
        use_case,
        runId,
      });
    }
    _log(runId, `CONSENT APPROVED: ${JSON.stringify(consent.data)}`);
    _pushWs('synth:consent_approved', { runId, actor_id });

    // STEP 2: NOIZYVOX synthesis — voice clone on MPS
    _pushWs('synth:generating', { runId, voice, language });
    const synth = await synthesizeVoice(text, voice, language);

    if (!synth.success) {
      _log(runId, `SYNTHESIS FAILED: ${synth.error}`);
      _pushWs('synth:failed', { runId, error: synth.error });
      return res.status(500).json({ error: 'Synthesis failed', detail: synth.error, runId });
    }
    _log(runId, `SYNTHESIS OK: ${synth.path} (${synth.size} bytes)`);

    // STEP 3: Proof chain — log to Gabriel
    const proof = {
      runId,
      actor_id,
      use_case,
      territory,
      voice,
      text_hash: crypto.createHash('sha256').update(text).digest('hex').slice(0, 16),
      output_path: synth.path,
      output_size: synth.size,
      consent_ref: consent.data?.id || consent.data?.synth_request_id || 'approved',
      ts: Date.now(),
    };
    _pushWs('synth:complete', { runId, ...proof });

    // Log run
    const run = { ...proof, type: 'synthesis' };
    pipelineState.runs = [run, ...pipelineState.runs].slice(0, 50);
    pipelineState.lastRun = run;
    pipelineState.totalRuns++;
    _saveState();

    res.json({
      runId,
      status: 'synthesized',
      consent: 'approved',
      actor_id,
      voice,
      output: synth.path,
      size: synth.size,
      proof,
    });
  } catch (e) {
    pipelineState.errors++;
    _saveState();
    _log(runId, `SYNTH ERROR: ${e.message}`);
    _pushWs('synth:error', { runId, error: e.message });
    res.status(500).json({ error: e.message, runId });
  }
});

/**
 * GET /api/voice/status
 */
router.get('/status', (req, res) => {
  res.json({
    whisper:      WHISPER_CMD || 'not found',
    towers:       Object.keys(TOWERS),
    apiKey:       !!process.env.ANTHROPIC_API_KEY,
    totalRuns:    pipelineState.totalRuns,
    errors:       pipelineState.errors,
    lastRun:      pipelineState.lastRun,
    wsClients:    _wsRef?.clients?.size || 0,
  });
});

/**
 * GET /api/voice/log?n=20
 */
router.get('/log', (req, res) => {
  const n = parseInt(req.query.n) || 20;
  res.json({ runs: pipelineState.runs.slice(0, n), total: pipelineState.totalRuns });
});

module.exports = { router, setWss };
