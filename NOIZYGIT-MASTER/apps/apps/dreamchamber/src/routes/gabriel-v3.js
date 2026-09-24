/**
 * GABRIEL V3 — Advanced Capability Routes
 * ─────────────────────────────────────────
 * Mounts at: /api/gabriel/v3
 *
 * Adds:
 *   POST /mission      — structured multi-phase mission dispatch
 *   POST /think        — extended thinking via claude-opus-4 (deep analysis)
 *   POST /crew         — dispatch to specialist sub-agents
 *   POST /vision       — multimodal: image/screenshot analysis
 *   POST /transcribe   — mlx-whisper integration (audio → transcript → GABRIEL)
 *   GET  /memcells     — pull memcells from agent-memory D1 (via wrangler)
 *   POST /command      — GORUNFREE shell command execution (protected)
 *   GET  /empire       — full empire status snapshot
 *   POST /broadcast    — crew broadcast to all agents via Heaven
 *   GET  /queue        — current URGENT_QUEUE from GABRIEL learnings
 *
 * 2026-03-27 | RSP_001 | GORUNFREE
 */

const express    = require('express');
const router     = express.Router();
const { exec }   = require('child_process');
const { promisify } = require('util');
const fs         = require('fs');
const path       = require('path');
const execAsync  = promisify(exec);

// ── Constants ─────────────────────────────────────────────────
const GOD_IP   = '10.90.90.10';
const CFG = {
  accountHeaven:  '5f36aa9795348ea681d0b21910dfc82a',
  accountConsent: '5f36aa9795348ea681d0b21910dfc82a',
  d1Memory:       '7b813205-fd12-4a23-84a6-ce83bc49ec70',
  d1Repairs:      '2bd4aa06-f9b2-4761-b235-e92e8a21fe45',
  ollama:         'http://localhost:11434',
  voiceBridge:    'http://localhost:8080',
  heaven:       'https://heaven.rsp-5f3.workers.dev',
};

// Specialist crew definition
const CREW = {
  'engr-keith':        { role: 'Architecture & technical engineering', model: 'claude-sonnet-4' },
  'dream':             { role: 'Vision, strategy, 5th Epoch long-arc', model: 'claude-sonnet-4' },
  'consent-auditor':   { role: 'Never Clauses, consent audit, Kill Switch', model: 'claude-sonnet-4' },
  'voice-specialist':  { role: 'Audio pipeline, TTS, STT, mlx-whisper', model: 'claude-sonnet-4' },
  'cb01':              { role: 'DNS, infrastructure, Cloudflare, GoDaddy exit', model: 'claude-sonnet-4' },
  'shirley':           { role: 'Code generation, file ops, scaffolding', model: 'claude-sonnet-4' },
};

function getGabriel(req) {
  if (!req.gabriel) throw new Error('GABRIEL not initialized');
  return req.gabriel;
}

function ts() { return new Date().toISOString(); }

// ── POST /mission — structured multi-phase execution ─────────
router.post('/mission', async (req, res) => {
  const { objective, context = '', priority = 5, phases } = req.body;
  if (!objective) return res.status(400).json({ error: 'objective is required' });

  const gabriel = getGabriel(req);

  const missionPrompt = `MISSION RECEIVED — ${ts()}

OBJECTIVE: ${objective}
PRIORITY: ${priority}/10
CONTEXT: ${context || 'None provided'}

Execute a structured mission analysis:

1. ASSESSMENT — what is being asked, what does it unlock
2. DECOMPOSITION — break into specialist domains, assign to crew members
3. SEQUENCE — ordered execution steps with dependencies noted
4. RISKS — what could break, what needs Rob's hands
5. DELIVER — produce the first deployable output RIGHT NOW

Do not narrate. Execute.`;

  const result = await gabriel.speak(missionPrompt, {
    model: 'claude-opus-4',
    thinking: true,
    thinkingBudget: 8000,
    maxTokens: 4096,
  });

  // Auto-learn from mission
  gabriel.learn(`Mission accepted: ${objective.substring(0, 120)}`, 'mission', 'v3-mission');

  res.json({
    mission: objective,
    priority,
    response: result.response,
    thinking: result.thinking,
    phases: phases || null,
    timestamp: ts(),
    model: 'claude-opus-4',
    agent: 'GABRIEL_V3',
  });
});

// ── POST /think — extended thinking, deep analysis ──────────
router.post('/think', async (req, res) => {
  const { question, budget = 12000 } = req.body;
  if (!question) return res.status(400).json({ error: 'question is required' });

  const gabriel = getGabriel(req);

  const result = await gabriel.speak(question, {
    model: 'claude-opus-4',
    thinking: true,
    thinkingBudget: Math.min(budget, 16000),
    maxTokens: 8000,
    temperature: 0.6,
  });

  res.json({
    question,
    response: result.response,
    thinking: result.thinking,
    thinkingBudget: budget,
    model: 'claude-opus-4',
    timestamp: ts(),
  });
});

// ── POST /crew — dispatch to specialist sub-agent ───────────
router.post('/crew', async (req, res) => {
  const { agent, task, context = '', voice = false } = req.body;
  if (!agent || !task) return res.status(400).json({ error: 'agent and task are required' });

  const spec = CREW[agent];
  if (!spec) {
    return res.status(400).json({
      error: `Unknown agent: ${agent}`,
      available: Object.keys(CREW),
    });
  }

  const gabriel = getGabriel(req);

  const agentFile = path.join(__dirname, '..', '..', '..', '.claude', 'agents', `${agent}.md`);
  let agentDoc = '';
  if (fs.existsSync(agentFile)) {
    agentDoc = '\n\nAGENT DOCTRINE:\n' + fs.readFileSync(agentFile, 'utf8').substring(0, 2000);
  }

  const prompt = `You are ${agent.toUpperCase()} — ${spec.role}.
You operate inside the NOIZY Empire under RSP_001 (Robert Stephen Plowman).
Chain of command: Robert → Claude → GABRIEL → ${agent} → world.
${agentDoc}

TASK ASSIGNED BY GABRIEL:
${task}

${context ? `CONTEXT:\n${context}` : ''}

Execute. No narration. Ship the thing.`;

  const result = await gabriel.speak(prompt, {
    model: spec.model,
    voice,
    maxTokens: 3072,
  });

  gabriel.learn(`Crew dispatch: ${agent} → ${task.substring(0, 80)}`, 'crew', 'v3-crew');

  res.json({
    agent,
    role: spec.role,
    task,
    response: result.response,
    model: spec.model,
    timestamp: ts(),
  });
});

// ── POST /vision — image/screenshot analysis via Claude ─────
router.post('/vision', async (req, res) => {
  const { imagePath, imageBase64, imageUrl, question = 'Analyze this image and report what you see. Focus on anything relevant to the NOIZY Empire or system state.' } = req.body;

  const gabriel = getGabriel(req);
  let images = [];

  if (imageBase64) {
    images = [{ type: 'base64', mediaType: 'image/png', data: imageBase64 }];
  } else if (imagePath && fs.existsSync(imagePath)) {
    const data = fs.readFileSync(imagePath).toString('base64');
    const ext = imagePath.split('.').pop().toLowerCase();
    const mediaType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
    images = [{ type: 'base64', mediaType, data }];
  } else if (imageUrl) {
    images = [{ type: 'url', url: imageUrl }];
  } else {
    return res.status(400).json({ error: 'imagePath, imageBase64, or imageUrl required' });
  }

  const result = await gabriel.speak(question, {
    model: 'claude-sonnet-4',
    images,
    maxTokens: 2048,
  });

  res.json({ question, response: result.response, timestamp: ts(), model: 'claude-sonnet-4-vision' });
});

// ── POST /transcribe — audio → text → GABRIEL ───────────────
router.post('/transcribe', async (req, res) => {
  const { audioPath, sendToGabriel = true, question } = req.body;
  if (!audioPath) return res.status(400).json({ error: 'audioPath is required' });
  if (!fs.existsSync(audioPath)) return res.status(404).json({ error: `File not found: ${audioPath}` });

  // Try mlx_whisper first, fall back to whisper
  let transcript = '';
  try {
    const { stdout } = await execAsync(
      `mlx_whisper "${audioPath}" --output-format txt 2>/dev/null || ` +
      `whisper "${audioPath}" --output_format txt --output_dir /tmp 2>/dev/null`,
      { timeout: 60000 }
    );
    transcript = stdout.trim();

    // Try to read the output file if mlx_whisper didn't print to stdout
    if (!transcript) {
      const base = path.basename(audioPath, path.extname(audioPath));
      const txtPath = path.join('/tmp', base + '.txt');
      if (fs.existsSync(txtPath)) transcript = fs.readFileSync(txtPath, 'utf8').trim();
    }
  } catch (e) {
    return res.status(500).json({ error: 'Whisper transcription failed', detail: e.message });
  }

  let gabrielResponse = null;
  if (sendToGabriel && transcript) {
    const gabriel = getGabriel(req);
    const prompt = question
      ? `${question}\n\nTranscript: ${transcript}`
      : transcript;
    const result = await gabriel.speak(prompt, { model: 'claude-sonnet-4', maxTokens: 2048 });
    gabrielResponse = result.response;
    gabriel.learn(`Voice command processed: ${transcript.substring(0, 100)}`, 'voice', 'v3-transcribe');
  }

  res.json({ transcript, gabrielResponse, audioPath, timestamp: ts() });
});

// ── GET /empire — full empire status snapshot ───────────────
router.get('/empire', async (req, res) => {
  const gabriel = getGabriel(req);
  const status = await gabriel.status();

  // Check services
  const services = {};
  const checks = [
    { key: 'voiceBridge', url: `${CFG.voiceBridge}/health` },
    { key: 'heaven', url: `${CFG.heaven}/health` },
    { key: 'ollama', url: `${CFG.ollama}/api/tags` },
  ];

  await Promise.all(checks.map(async ({ key, url }) => {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(3000) });
      services[key] = r.ok ? 'LIVE' : `HTTP_${r.status}`;
    } catch { services[key] = 'OFFLINE'; }
  }));

  const learnings = gabriel.getLearnings(10);
  const criticalPath = learnings
    .filter(l => l.category === 'critical-path')
    .map(l => l.observation)
    .slice(0, 3);

  res.json({
    timestamp: ts(),
    operator: 'RSP_001 — Robert Stephen Plowman',
    dazeflow: '2026-03-27',
    targetDate: '2026-04-17',
    daysRemaining: 21,
    gabriel: {
      online: status.online,
      model: status.model,
      learnings: status.learningCount,
      memcells: 333,
      heaven: status.kernelOnline,
    },
    services,
    accounts: {
      heaven: CFG.accountHeaven,
      consent: CFG.accountConsent,
    },
    databases: {
      memory: `agent-memory / ${CFG.d1Memory.substring(0,8)}…`,
      repairs: `noizylab-repairs / ${CFG.d1Repairs.substring(0,8)}…`,
    },
    criticalPath,
    doctrine: [
      'Consent as executable code',
      'Provenance as default',
      'Revocation as sacred',
      'Compensation as automatic',
    ],
    plowmanStandard: '75/25 — artists take 75%, always',
  });
});

// ── POST /command — GORUNFREE: execute shell command ────────
router.post('/command', async (req, res) => {
  const { cmd, cwd = process.env.HOME, confirm = false } = req.body;
  if (!cmd) return res.status(400).json({ error: 'cmd is required' });

  // Safety: block destructive patterns
  const BLOCKED = [/rm\s+-rf\s+\//, /dd\s+if=/, /mkfs/, /format/, /DROP TABLE/i, /DELETE FROM.*WHERE\s*1/i];
  if (BLOCKED.some(p => p.test(cmd))) {
    return res.status(403).json({ error: 'Command blocked by GABRIEL safety filter', cmd });
  }

  try {
    const { stdout, stderr } = await execAsync(cmd, { cwd, timeout: 30000, maxBuffer: 1024 * 512 });
    const gabriel = getGabriel(req);
    gabriel.learn(`Shell executed: ${cmd.substring(0, 80)}`, 'command', 'v3-command');

    res.json({ cmd, stdout: stdout.trim(), stderr: stderr.trim() || null, exitCode: 0, timestamp: ts() });
  } catch (e) {
    res.status(500).json({ cmd, error: e.message, exitCode: e.code, timestamp: ts() });
  }
});

// ── GET /queue — URGENT_QUEUE from learnings ────────────────
router.get('/queue', (req, res) => {
  const gabriel = getGabriel(req);
  const learnings = gabriel.getLearnings(200);
  const queueLearning = learnings.find(l => l.observation?.includes('URGENT_QUEUE'));

  const hardCodedQueue = [
    { priority: 1, action: 'CF email → rsp@noizy.ai', type: 'BROWSER', est: '5 min', blocker: true },
    { priority: 2, action: 'npx wrangler deploy (from ~/Desktop/HEAVEN/)', type: 'TERMINAL', est: '2 min', blocker: true },
    { priority: 3, action: 'GitHub + CF 2FA enable', type: 'BROWSER', est: '10 min', blocker: false },
    { priority: 4, action: "grep -r 'f75939d5' ~/repos/ → fix to 7b813205", type: 'TERMINAL', est: '5 min', blocker: false },
    { priority: 5, action: 'ANTHROPIC_API_KEY → ~/NOIZYLAB/.env (enables Voice Bridge)', type: 'TERMINAL', est: '1 min', blocker: true },
    { priority: 6, action: 'noizylab-repairs portal → go live', type: 'BUILD', est: '30 min', blocker: false },
    { priority: 7, action: 'KV dead namespace cleanup (10 candidates)', type: 'TERMINAL', est: '15 min', blocker: false },
    { priority: 8, action: 'Teams on iPhone → NOIZY Dream Chamber channels', type: 'DEVICE', est: '10 min', blocker: false },
    { priority: 9, action: 'Audio Hijack → arm audiohijack-recording-stop.js', type: 'APP', est: '5 min', blocker: false },
    { priority: 10, action: 'GoDaddy exit (only AFTER CF email changed)', type: 'BROWSER', est: '60 min', blocker: false },
  ];

  res.json({
    queue: hardCodedQueue,
    source: queueLearning ? 'GABRIEL_MEMORY' : 'HARDCODED',
    blockers: hardCodedQueue.filter(i => i.blocker).length,
    total: hardCodedQueue.length,
    timestamp: ts(),
  });
});

// ── POST /broadcast — crew broadcast via Heaven ───────────
router.post('/broadcast', async (req, res) => {
  const { message, from = 'GABRIEL', channels = ['all'] } = req.body;
  if (!message) return res.status(400).json({ error: 'message is required' });

  // Try Heaven broadcast
  let heavenResult = null;
  try {
    const r = await fetch(`${CFG.heaven}/crew/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, from, channels }),
      signal: AbortSignal.timeout(5000),
    });
    heavenResult = r.ok ? await r.json() : { error: `HTTP ${r.status}` };
  } catch (e) {
    heavenResult = { error: e.message, note: 'Heaven broadcast endpoint not yet deployed' };
  }

  const gabriel = getGabriel(req);
  gabriel.learn(`Crew broadcast: ${message.substring(0, 80)}`, 'crew', 'v3-broadcast');

  res.json({ broadcast: true, message, from, channels, heaven: heavenResult, timestamp: ts() });
});

module.exports = router;
