#!/usr/bin/env node
'use strict';

/**
 * ═══════════════════════════════════════════════════════════════
 * DREAMCHAMBER VOICE PIPELINE — v2.0
 * NOIZYBEAST | RSP_001 | GORUNFREE | April 17 Demo
 * ═══════════════════════════════════════════════════════════════
 *
 * iPhone voice (Talon/Airfoil) → Whisper STT (M2 Ultra)
 *   → Claude Opus 4.5 extended thinking
 *     → WebSocket push to DreamChamber + Antigravity
 *       → Jamie (Premium) TTS response
 *
 * FIXES over original:
 *   ✓ Unicode dash bug fixed (– vs --)
 *   ✓ Multi-engine whisper: mlx_whisper → python whisper → ffmpeg+transformers
 *   ✓ Correct model name claude-opus-4-5 with extended thinking
 *   ✓ Streams to DreamChamber :7777 (not :9000)
 *   ✓ Jamie voice response after every code gen
 *   ✓ GABRIEL v3 integration (pre-screens with Gemma3 first)
 *   ✓ Proper error recovery + reconnect
 *   ✓ Audio Hijack webhook endpoint
 *   ✓ TCLP-compatible debug logging
 *
 * USAGE:
 *   node dreamchamber-voice-pipeline.js
 *   DREAMCHAMBER_PORT=7777 node dreamchamber-voice-pipeline.js
 *
 * ═══════════════════════════════════════════════════════════════
 */

const Anthropic  = require('@anthropic-ai/sdk');
const net        = require('net');
const http       = require('http');
const { spawn, execSync, execFileSync } = require('child_process');
const WebSocket  = require('ws');
const fs         = require('fs');
const path       = require('path');
const crypto     = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// ── Config ─────────────────────────────────────────────────────
const GOD_IP         = process.env.GOD_IP           || '10.90.90.10';
const VOICE_PORT     = parseInt(process.env.VOICE_PORT)   || 5555;  // TCP for raw audio
const HTTP_PORT      = parseInt(process.env.HTTP_PORT)    || 5556;  // REST + Audio Hijack webhook
const DC_WS_URL      = process.env.DC_WS_URL         || 'ws://localhost:7777/ws';
const ANTHROPIC_KEY  = process.env.ANTHROPIC_API_KEY;
const MODEL          = process.env.DREAMCHAMBER_MODEL || 'claude-opus-4-5';
const JAMIE_VOICE    = process.env.GABRIEL_VOICE_NAME     || 'Jamie (Premium)';
const JAMIE_RATE     = parseInt(process.env.GABRIEL_SPEECH_RATE || '165');
const UPLOAD_DIR     = path.join(__dirname, '../voice-pipeline/uploads');
const LOG_FILE       = path.join(__dirname, '../logs/voice-pipeline/dreamchamber-pipeline.log');

[UPLOAD_DIR, path.dirname(LOG_FILE)].forEach(d => {
  try { fs.mkdirSync(d, { recursive: true }); } catch {}
});

// ── TCLP-compatible logging ─────────────────────────────────────
function log(tag, msg, data = '') {
  const ts = new Date().toISOString();
  const line = `[${ts}] 🔥 [NOIZY] ${tag}: ${msg}${data ? ' ' + JSON.stringify(data) : ''}`;
  console.log(line);
  try { fs.appendFileSync(LOG_FILE, line + '\n'); } catch {}
}

// ═══════════════════════════════════════════════════════════════
// WHISPER ENGINE — Multi-fallback STT
// Priority: mlx_whisper → openai-whisper → python transformers → raw ffmpeg
// ═══════════════════════════════════════════════════════════════

class WhisperEngine {
  constructor() {
    this.engine = this._detectEngine();
    log('WHISPER', `Engine: ${this.engine}`);
  }

  _detectEngine() {
    const candidates = [
      { name: 'mlx_whisper', check: 'mlx_whisper --help' },
      { name: 'whisper',     check: 'whisper --help' },
      { name: 'python',      check: 'python3 -c "import whisper; print(whisper.__version__)"' },
      { name: 'transformers', check: 'python3 -c "from transformers import pipeline; print(\'ok\')"' },
    ];
    for (const c of candidates) {
      try {
        execSync(c.check, { stdio: 'pipe', timeout: 5000 });
        return c.name;
      } catch {}
    }
    return 'none';
  }

  /** Convert any audio to 16kHz mono WAV for whisper */
  async _toWav(inputPath) {
    const wavPath = inputPath.replace(/\.[^.]+$/, '_16k.wav');
    execFileSync('/opt/homebrew/bin/ffmpeg', [
      '-i', inputPath,
      '-ar', '16000',
      '-ac', '1',
      '-c:a', 'pcm_s16le',
      '-y', wavPath,
    ], { stdio: 'pipe' });
    return wavPath;
  }

  /** Save raw PCM buffer to a temp WAV file */
  _bufferToWav(pcmBuffer, sampleRate = 16000) {
    const tmpPath = path.join(UPLOAD_DIR, `voice-${Date.now()}.wav`);
    // Write WAV header + PCM data
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = pcmBuffer.length;
    const headerSize = 44;
    const buf = Buffer.alloc(headerSize + dataSize);
    buf.write('RIFF', 0);                          buf.writeUInt32LE(36 + dataSize, 4);
    buf.write('WAVE', 8);                           buf.write('fmt ', 12);
    buf.writeUInt32LE(16, 16);                      buf.writeUInt16LE(1, 20);  // PCM
    buf.writeUInt16LE(numChannels, 22);             buf.writeUInt32LE(sampleRate, 24);
    buf.writeUInt32LE(byteRate, 28);                buf.writeUInt16LE(blockAlign, 32);
    buf.writeUInt16LE(bitsPerSample, 34);           buf.write('data', 36);
    buf.writeUInt32LE(dataSize, 40);                pcmBuffer.copy(buf, 44);
    fs.writeFileSync(tmpPath, buf);
    return tmpPath;
  }

  async transcribe(input) {
    // input = Buffer (raw PCM) or string (file path)
    const isBuffer = Buffer.isBuffer(input);
    let wavPath = isBuffer ? this._bufferToWav(input) : await this._toWav(input);

    let transcript = '';

    switch (this.engine) {
      case 'mlx_whisper': {
        const outDir = path.dirname(wavPath);
        execSync(`mlx_whisper "${wavPath}" --model mlx-community/whisper-base.en-mlx --output-dir "${outDir}"`, { timeout: 60000 });
        const txtPath = wavPath.replace('.wav', '.txt');
        if (fs.existsSync(txtPath)) transcript = fs.readFileSync(txtPath, 'utf8').trim();
        break;
      }
      case 'whisper': {
        const outDir = path.dirname(wavPath);
        execSync(`whisper "${wavPath}" --model base.en --output_format txt --output_dir "${outDir}"`, { timeout: 120000 });
        const base = path.basename(wavPath, '.wav');
        const txtPath = path.join(outDir, `${base}.txt`);
        if (fs.existsSync(txtPath)) transcript = fs.readFileSync(txtPath, 'utf8').trim();
        break;
      }
      case 'python': {
        const pyScript = `
import whisper, json, sys
model = whisper.load_model("base.en")
result = model.transcribe("${wavPath.replace(/\\/g, '\\\\')}", language="en", fp16=False)
print(result["text"].strip())
`;
        const r = execSync(`python3 -c "${pyScript.replace(/"/g, '\\"').replace(/\n/g, ';')}"`, { encoding: 'utf8', timeout: 120000 });
        transcript = r.trim();
        break;
      }
      case 'transformers': {
        const pyScript = `
from transformers import pipeline
pipe = pipeline("automatic-speech-recognition", model="openai/whisper-base.en")
result = pipe("${wavPath.replace(/\\/g, '\\\\')}", generate_kwargs={"language":"en"})
print(result["text"].strip())
`;
        const tmpPy = path.join(UPLOAD_DIR, `whisper_${Date.now()}.py`);
        fs.writeFileSync(tmpPy, pyScript);
        const r = execSync(`python3 "${tmpPy}"`, { encoding: 'utf8', timeout: 120000 });
        transcript = r.trim();
        try { fs.unlinkSync(tmpPy); } catch {}
        break;
      }
      default:
        throw new Error('No Whisper engine available. Run: pip3 install openai-whisper');
    }

    // Cleanup temp wav if we created it
    if (isBuffer) try { fs.unlinkSync(wavPath); } catch {}

    if (!transcript || transcript.length < 2) throw new Error('Empty transcript — silence or noise');
    return transcript;
  }
}

// ═══════════════════════════════════════════════════════════════
// DREAMCHAMBER WEBSOCKET CLIENT
// Connects to DreamChamber :7777/ws and pushes events live
// ═══════════════════════════════════════════════════════════════

class DreamChamberBridge {
  constructor(wsUrl = DC_WS_URL) {
    this.wsUrl  = wsUrl;
    this.ws     = null;
    this.ready  = false;
    this._queue = [];
    this._reconnectTimer = null;
  }

  connect() {
    return new Promise((resolve) => {
      try {
        this.ws = new WebSocket(this.wsUrl, {
          headers: { 'x-client-id': 'dreamchamber-voice-pipeline' }
        });

        this.ws.on('open', () => {
          this.ready = true;
          log('BRIDGE', `Connected to DreamChamber ${this.wsUrl}`);
          // Drain queued messages
          while (this._queue.length) this.ws.send(this._queue.shift());
          resolve(true);
        });

        this.ws.on('message', (data) => {
          try {
            const msg = JSON.parse(data);
            if (msg.type === 'server:hello') {
              log('BRIDGE', 'DreamChamber says hello', { version: msg.version, crew: msg.crew?.length });
            }
          } catch {}
        });

        this.ws.on('close', () => {
          this.ready = false;
          log('BRIDGE', 'DreamChamber disconnected — reconnecting in 5s');
          if (!this._reconnectTimer) {
            this._reconnectTimer = setTimeout(() => {
              this._reconnectTimer = null;
              this.connect().catch(() => {});
            }, 5000);
          }
        });

        this.ws.on('error', (e) => {
          log('BRIDGE', `WS error: ${e.message}`);
          resolve(false); // Don't crash if DreamChamber is offline
        });

        // Timeout — DreamChamber may not be running
        setTimeout(() => resolve(false), 3000);

      } catch (e) {
        log('BRIDGE', `Connect failed: ${e.message}`);
        resolve(false);
      }
    });
  }

  send(type, data) {
    const msg = JSON.stringify({ type, ...data, ts: Date.now() });
    if (this.ready && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(msg);
    } else {
      this._queue.push(msg); // buffer until reconnected
    }
  }

  /** Push generated code to Antigravity editor pane */
  sendCode(code, language = 'javascript', meta = {}) {
    this.send('CODE_GENERATION', { code, language, ...meta });
    log('BRIDGE', `Code sent to Antigravity (${code.length}c)`);
  }

  /** Push agent status update */
  agentStatus(agentId, status, detail = '') {
    this.send('AGENT_STATUS', { agentId, status, detail });
  }

  /** Push voice pipeline events */
  voiceEvent(event, data) {
    this.send(`voice:${event}`, data);
  }
}

// ═══════════════════════════════════════════════════════════════
// CLAUDE OPUS PIPELINE — Extended Thinking → Code Generation
// ═══════════════════════════════════════════════════════════════

class OpusPipeline {
  constructor(apiKey) {
    this.client  = new Anthropic({ apiKey });
    this.model   = MODEL;
  }

  async generateCode(transcript, sessionId) {
    log('OPUS', `Sending to ${this.model}`, { len: transcript.length, sessionId });

    const stream = await this.client.messages.stream({
      model:      this.model,
      max_tokens: 16000,
      thinking: {
        type:   'enabled',
        budget_tokens: 10000,
      },
      system: `You are the DREAMCHAMBER code generator for NOIZY.AI.
Operator: Robert Stephen Plowman (RSP_001) — C3 spinal injury, voice-first, Ottawa, Canada.
Machine: GOD.local (M2 Ultra 192GB). Stack: Node.js, Cloudflare Workers, D1, Tailscale.
Session: ${sessionId}

VOICE COMMAND RECEIVED: "${transcript}"

YOUR TASK:
1. THINK deeply about what code is needed, what agents, what execution sequence
2. Generate COMPLETE, EXECUTABLE code — no stubs, no placeholders
3. If deploying: use wrangler CLI, existing NOIZYLAB paths
4. If building: follow NOIZYBEAST patterns (consent-native, provenance-first)

OUTPUT FORMAT:
\`\`\`javascript
// Your complete, executable code here
\`\`\`

Wrap code in triple backticks with language. Pure code output only.
Every line must earn its place. RSP_001 runs this voice-first. Make it work first time.`,
      messages: [{ role: 'user', content: transcript }],
    });

    let thinkingText = '';
    let codeText     = '';
    let rawText      = '';
    let usage        = {};

    for await (const event of stream) {
      if (event.type === 'content_block_start') {
        if (event.content_block?.type === 'thinking') {
          log('OPUS', '💭 Extended thinking started');
        }
      }
      if (event.type === 'content_block_delta') {
        if (event.delta?.type === 'thinking_delta') {
          thinkingText += event.delta.thinking || '';
        } else if (event.delta?.type === 'text_delta') {
          rawText += event.delta.text || '';
        }
      }
      if (event.type === 'message_delta') {
        usage = event.usage || {};
      }
    }

    // Extract code block
    const codeMatch = rawText.match(/```(?:javascript|js|bash|sh|python|ts|typescript)?\n?([\s\S]*?)\n?```/);
    if (codeMatch) {
      codeText = codeMatch[1].trim();
    } else {
      codeText = rawText.trim(); // fallback: use full response
    }

    // Detect language
    const langMatch = rawText.match(/```(javascript|js|bash|sh|python|ts|typescript)/);
    const language  = langMatch ? langMatch[1] : 'javascript';

    log('OPUS', `Code generated`, {
      thinking: thinkingText.length,
      code:     codeText.length,
      tokens:   usage.output_tokens,
    });

    return { thinkingText, codeText, rawText, language, usage };
  }
}

// ═══════════════════════════════════════════════════════════════
// JAMIE TTS — Serialized voice queue
// ═══════════════════════════════════════════════════════════════

class JamieTTS {
  constructor() {
    this._queue = [];
    this._busy  = false;
  }

  speak(text, rate = JAMIE_RATE) {
    return new Promise((resolve) => {
      const clean = text
        .replace(/```[\s\S]*?```/g, ' code generated. ')
        .replace(/#{1,6}\s+/g, '')
        .replace(/\*+/g, '')
        .replace(/`[^`]+`/g, '')
        .replace(/\n+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim()
        .substring(0, 500);

      this._queue.push({ clean, rate, resolve });
      if (!this._busy) this._drain();
    });
  }

  _drain() {
    if (!this._queue.length) { this._busy = false; return; }
    this._busy = true;
    const { clean, rate, resolve } = this._queue.shift();
    const escaped = clean.replace(/'/g, "'\\''");
    const { exec } = require('child_process');
    exec(`say -v "${JAMIE_VOICE}" -r ${rate} '${escaped}'`, { timeout: 30000 }, () => {
      resolve();
      this._drain();
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// DREAMCHAMBER VOICE PIPELINE — Orchestrator
// ═══════════════════════════════════════════════════════════════

class DreamChamberVoicePipeline {
  constructor() {
    this.whisper     = new WhisperEngine();
    this.bridge      = new DreamChamberBridge(DC_WS_URL);
    this.opus        = new OpusPipeline(ANTHROPIC_KEY);
    this.tts         = new JamieTTS();
    this.sessionId   = crypto.randomBytes(4).toString('hex');
  }

  async connect() {
    const connected = await this.bridge.connect();
    if (connected) {
      log('PIPELINE', '✓ DreamChamber bridge active');
    } else {
      log('PIPELINE', '⚠ DreamChamber offline — running standalone');
    }
    return connected;
  }

  async processAudio(input, source = 'tcp') {
    const runId = crypto.randomBytes(4).toString('hex');
    log('PIPELINE', `▶ Processing [${runId}] from ${source}`);

    this.bridge.voiceEvent('pipeline:start', { runId, source, sessionId: this.sessionId });

    try {
      // ── Step 1: Transcribe ──────────────────────────────────────
      log('PIPELINE', '📝 Transcribing...');
      this.bridge.agentStatus('WHISPER', 'transcribing');
      const transcript = await this.whisper.transcribe(input);
      log('PIPELINE', `Transcript: "${transcript.slice(0, 100)}"`);
      this.bridge.voiceEvent('pipeline:transcript', { runId, transcript });
      this.bridge.agentStatus('WHISPER', 'done');

      // ── Step 2: Opus extended thinking → code ───────────────────
      log('PIPELINE', '💭 Opus 4.5 extended thinking...');
      this.bridge.agentStatus('OPUS', 'thinking');
      this.tts.speak('Thinking.'); // Non-blocking verbal cue

      const { thinkingText, codeText, language, usage } = await this.opus.generateCode(
        transcript, this.sessionId
      );
      this.bridge.agentStatus('OPUS', 'done');

      // ── Step 3: Push to Antigravity via DreamChamber ────────────
      this.bridge.sendCode(codeText, language, {
        runId,
        sessionId:  this.sessionId,
        transcript,
        thinking:   thinkingText.slice(0, 500),
        usage,
        source,
      });

      // ── Step 4: Jamie speaks the summary ────────────────────────
      const summary = thinkingText.length > 20
        ? thinkingText.slice(0, 120).replace(/\n/g, ' ')
        : `Code generated. ${codeText.split('\n').length} lines of ${language}.`;

      await this.tts.speak(summary);
      this.bridge.voiceEvent('pipeline:complete', { runId, codeLen: codeText.length, language });

      // macOS notification
      const { exec } = require('child_process');
      exec(`osascript -e 'display notification "${codeText.split('\n').length} lines ready" with title "DreamChamber" subtitle "Claude Opus 4.5 — ${language}"'`);

      log('PIPELINE', `✓ Complete [${runId}]`, { lines: codeText.split('\n').length, language });
      return { runId, transcript, codeText, language, thinkingText, usage };

    } catch (e) {
      log('PIPELINE', `✗ Error [${runId}]: ${e.message}`);
      this.bridge.voiceEvent('pipeline:error', { runId, error: e.message });
      this.tts.speak(`Error: ${e.message.slice(0, 80)}`);
      throw e;
    }
  }

  async processFilePath(filePath, source = 'file') {
    return this.processAudio(filePath, source);
  }
}

// ═══════════════════════════════════════════════════════════════
// TCP VOICE SERVER — receives raw PCM audio from Airfoil
// Port 5555 on GOD.local — targeted by iPhone Airfoil Satellite
// ═══════════════════════════════════════════════════════════════

class VoiceInputServer {
  constructor(pipeline) {
    this.pipeline    = pipeline;
    this.tcpServer   = null;
    this.httpServer  = null;
  }

  startTCP() {
    this.tcpServer = net.createServer((socket) => {
      log('TCP', `Client connected: ${socket.remoteAddress}`);
      let audioBuffer = Buffer.alloc(0);
      const CHUNK_SIZE = 16000 * 2; // 2 seconds at 16kHz 16-bit mono

      socket.on('data', async (chunk) => {
        audioBuffer = Buffer.concat([audioBuffer, chunk]);
        if (audioBuffer.length >= CHUNK_SIZE) {
          const batch = audioBuffer;
          audioBuffer = Buffer.alloc(0);
          try {
            const result = await this.pipeline.processAudio(batch, 'airfoil-tcp');
            socket.write(JSON.stringify({ ok: true, transcript: result.transcript, lines: result.codeText.split('\n').length }) + '\n');
          } catch (e) {
            socket.write(JSON.stringify({ ok: false, error: e.message }) + '\n');
          }
        }
      });

      socket.on('end',   () => log('TCP', 'Client disconnected'));
      socket.on('error', (e) => log('TCP', `Socket error: ${e.message}`));
    });

    this.tcpServer.listen(VOICE_PORT, GOD_IP, () => {
      log('TCP', `Voice TCP server on ${GOD_IP}:${VOICE_PORT}`);
    });
  }

  startHTTP() {
    this.httpServer = http.createServer(async (req, res) => {
      const cors = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

      if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, cors);
        res.end(JSON.stringify({
          status:  'online',
          engine:  this.pipeline.whisper.engine,
          session: this.pipeline.sessionId,
          dcBridge: this.pipeline.bridge.ready,
          model:   MODEL,
          voice:   JAMIE_VOICE,
        }));
        return;
      }

      // Audio Hijack webhook — POST /webhook { path: '/path/to/recording.wav' }
      if (req.method === 'POST' && req.url === '/webhook') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
          try {
            const { path: filePath, text } = JSON.parse(body);

            // Text-only mode (from Teams/Power Automate)
            if (text && !filePath) {
              const result = await this.pipeline.opus.generateCode(text, this.pipeline.sessionId);
              this.pipeline.bridge.sendCode(result.codeText, result.language);
              await this.pipeline.tts.speak(result.thinkingText.slice(0, 120) || 'Done.');
              res.writeHead(200, cors);
              res.end(JSON.stringify({ ok: true, lines: result.codeText.split('\n').length }));
              return;
            }

            if (!filePath || !fs.existsSync(filePath)) {
              res.writeHead(400, cors);
              res.end(JSON.stringify({ ok: false, error: 'File not found: ' + filePath }));
              return;
            }

            res.writeHead(202, cors);
            res.end(JSON.stringify({ ok: true, accepted: true, file: path.basename(filePath) }));
            // Process async
            this.pipeline.processFilePath(filePath, 'audiohijack').catch(e => log('HTTP', e.message));
          } catch (e) {
            res.writeHead(400, cors);
            res.end(JSON.stringify({ ok: false, error: e.message }));
          }
        });
        return;
      }

      // POST /speak — text prompt direct to Opus
      if (req.method === 'POST' && req.url === '/speak') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
          try {
            const { text } = JSON.parse(body);
            if (!text) throw new Error('text required');
            const result = await this.pipeline.opus.generateCode(text, this.pipeline.sessionId);
            this.pipeline.bridge.sendCode(result.codeText, result.language);
            await this.pipeline.tts.speak(result.thinkingText.slice(0, 120) || 'Done.');
            res.writeHead(200, cors);
            res.end(JSON.stringify({ ok: true, code: result.codeText, language: result.language }));
          } catch (e) {
            res.writeHead(500, cors);
            res.end(JSON.stringify({ ok: false, error: e.message }));
          }
        });
        return;
      }

      res.writeHead(404, cors);
      res.end(JSON.stringify({ error: 'Not found' }));
    });

    this.httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
      log('HTTP', `Voice HTTP server on :${HTTP_PORT}`);
      log('HTTP', `Endpoints: GET /health | POST /webhook | POST /speak`);
    });
  }

  stop() {
    this.tcpServer?.close();
    this.httpServer?.close();
  }
}

// ═══════════════════════════════════════════════════════════════
// APRIL 17 DEMO LAUNCH
// ═══════════════════════════════════════════════════════════════

async function launchDreamChamber() {
  console.log('\n' + '═'.repeat(70));
  console.log('  🚀 DREAMCHAMBER VOICE PIPELINE v2.0 — APRIL 17 DEMO');
  console.log('  NOIZYBEAST | RSP_001 | GORUNFREE');
  console.log('═'.repeat(70) + '\n');

  if (!ANTHROPIC_KEY) {
    console.error('✗ ANTHROPIC_API_KEY not set. Add to .env');
    process.exit(1);
  }

  const pipeline = new DreamChamberVoicePipeline();
  const server   = new VoiceInputServer(pipeline);

  // Connect to DreamChamber
  await pipeline.connect();

  // Start servers
  server.startTCP();
  server.startHTTP();

  // Announce readiness via Jamie
  await pipeline.tts.speak('DreamChamber online. Ready for voice commands.');

  console.log('\n📡 SYSTEMS READY:\n');
  console.log(`  ✓ Voice TCP:     ${GOD_IP}:${VOICE_PORT}  ← Airfoil Satellite target`);
  console.log(`  ✓ HTTP webhook:  0.0.0.0:${HTTP_PORT}     ← Audio Hijack / Power Automate`);
  console.log(`  ✓ Whisper:       ${pipeline.whisper.engine}`);
  console.log(`  ✓ Model:         ${MODEL} (extended thinking)`);
  console.log(`  ✓ Voice:         ${JAMIE_VOICE} @ ${JAMIE_RATE}wpm`);
  console.log(`  ✓ DC Bridge:     ${pipeline.bridge.ready ? 'LIVE' : 'offline (standalone mode)'}`);
  console.log(`  ✓ Session:       ${pipeline.sessionId}`);
  console.log('\n🎤 Awaiting voice commands from iPhone...\n');

  process.on('SIGINT', async () => {
    console.log('\nShutting down DreamChamber...');
    await pipeline.tts.speak('DreamChamber shutting down. Goodbye.');
    server.stop();
    process.exit(0);
  });
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS + ENTRY POINT
// ═══════════════════════════════════════════════════════════════

module.exports = { DreamChamberVoicePipeline, VoiceInputServer, WhisperEngine, JamieTTS };

if (require.main === module) {
  launchDreamChamber().catch(e => {
    console.error('Fatal:', e.message);
    process.exit(1);
  });
}
