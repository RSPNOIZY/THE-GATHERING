// Heaven API — Express backend
// Serves /api/chat and /health for both Heaven and Lucy identities
// Zero Trust: validates Cf-Access-Jwt-Assertion at origin
//
// BASE MODEL: Claude (Anthropic) — primary AI for all identities
// MODEL:      claude-sonnet-4-5 (pinned)
// FALLBACK:   OpenAI gpt-4o (only if no ANTHROPIC_API_KEY)
// GORUNFREE ✦

const express = require('express');
const cors = require('cors');
const { createClient } = require('redis');
const { Pool } = require('pg');
const { requireAccessJWT, attachAccessIdentity } = require('./middleware/access-jwt');

const app = express();
const PORT = process.env.PORT || 8080;
const IDENTITY = process.env.IDENTITY || 'heaven';
const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT || 
  'You are Heaven, an ethereal AI companion from NOIZYLAB DreamChamber.';

// ─── Middleware ────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '4mb' }));
app.use((req, _, next) => {
  const identity = req.accessIdentity?.email || req.ip;
  console.log(`[${IDENTITY.toUpperCase()}] ${req.method} ${req.path} ← ${identity}`);
  next();
});

// ─── Database (lazy) ──────────────────────────────────────
const db = new Pool({ connectionString: process.env.DATABASE_URL });

// ─── Redis (lazy) ─────────────────────────────────────────
let redis;
async function getRedis() {
  if (!redis) {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    redis = createClient({ url });
    await redis.connect();
  }
  return redis;
}

// ─── Health (public — no JWT required) ─────────────────────
app.get('/health', async (req, res) => {
  const status = {
    service: `${IDENTITY}-api`,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    identity: IDENTITY,
    version: '2.0.0',
    access: req.headers['cf-access-jwt-assertion'] ? 'tunnel' : 'direct',
  };
  try {
    await db.query('SELECT 1');
    status.database = 'connected';
  } catch {
    status.database = 'disconnected';
  }
  res.json(status);
});

// ─── Protected routes (JWT required in production) ─────────
app.use('/api', requireAccessJWT);

// Chat endpoint — compatible with Heaven iOS client
app.post('/api/chat', async (req, res) => {
  const { messages = [], identity: reqIdentity } = req.body;

  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Fallback echo mode (dev)
    const last = messages[messages.length - 1];
    return res.json({
      reply: `[${IDENTITY.toUpperCase()} ECHO] ${last?.content || '...'}`,
      identity: IDENTITY,
      model: 'echo',
      user: req.accessIdentity?.email || 'anonymous',
    });
  }

  try {
    // Prefer Claude (Anthropic) over OpenAI
    let reply, model;

    if (process.env.ANTHROPIC_API_KEY) {
      // ── Claude is the base model for all NOIZY AI identities ──
      const claudeTemp = IDENTITY === 'lucy' ? 0.95 : 0.75; // Lucy runs warmer
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 4096,
          temperature: claudeTemp,
          system: SYSTEM_PROMPT,
          messages: messages.slice(-30).map(m => ({
            role: m.role === 'system' ? 'user' : m.role,
            content: m.content,
          })),
        }),
      });
      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Anthropic API error: ${response.status} — ${errBody}`);
      }
      const json = await response.json();
      reply = json.content?.[0]?.text ?? '';
      model = `claude-sonnet-4-5 [${IDENTITY}@${claudeTemp}t]`;
    } else {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          temperature: IDENTITY === 'lucy' ? 0.9 : 0.8,
          max_tokens: 1024,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages.slice(-20),
          ],
        }),
      });
      if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);
      const json = await response.json();
      reply = json.choices?.[0]?.message?.content ?? '';
      model = 'gpt-4o';
    }

    // Persist to DB
    try {
      await db.query(
        'INSERT INTO messages (identity, role, content) VALUES ($1, $2, $3)',
        [IDENTITY, 'assistant', reply]
      );
    } catch {}

    return res.json({
      reply,
      identity: IDENTITY,
      model,
      user: req.accessIdentity?.email || 'anonymous',
    });
  } catch (err) {
    console.error(`[${IDENTITY}] Chat error:`, err);
    return res.status(500).json({ error: err.message });
  }
});

// Sessions endpoint
app.get('/api/sessions', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM sessions WHERE identity = $1 ORDER BY created_at DESC LIMIT 50',
      [IDENTITY]
    );
    res.json({ sessions: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Identity info (who is authenticated)
app.get('/api/whoami', (req, res) => {
  res.json({
    identity: IDENTITY,
    user: req.accessIdentity || null,
    timestamp: new Date().toISOString(),
  });
});

// ─── Start ─────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✦ ${IDENTITY.toUpperCase()} API running on :${PORT}`);
  console.log(`  Identity:    ${IDENTITY}`);
  console.log(`  Version:     2.0.0`);
  console.log(`  JWT Guard:   ${process.env.CF_ACCESS_AUD ? 'ACTIVE' : 'DEV MODE (skipped)'}`);
  console.log(`  AI Backend:  ${process.env.ANTHROPIC_API_KEY ? 'Claude' : process.env.OPENAI_API_KEY ? 'GPT-4o' : 'Echo Mode'}\n`);
});

module.exports = app;
