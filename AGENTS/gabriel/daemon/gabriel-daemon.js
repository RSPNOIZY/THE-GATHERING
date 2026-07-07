#!/usr/bin/env node
/**
 * GABRIEL DAEMON — MC96ECOUNIVERSE
 * Unified intelligence daemon for the NOIZY adaptive artist platform
 * Port 7777 · GOD Machine (10.90.90.10) · GORUNFREE
 *
 * Surfaces: IDE (DreamChamber), Terminal, Slack, WhatsApp, Voice
 */

"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const { execSync, spawn, execFile } = require("child_process");
const { promisify } = require("util");
const execFileAsync = promisify(execFile);

// ── WebSocket ──────────────────────────────────────────────────────────────────
let WebSocketServer;
try {
  ({ WebSocketServer } = require("ws"));
} catch {
  console.warn("ws not installed — run: npm install ws");
}

// ── Config ────────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.GABRIEL_PORT || "7778", 10);
const DB_PATH = path.join(process.env.HOME, "NOIZYLAB", "gabriel.db");
const LOG_PATH = path.join(__dirname, "..", "logs", "gabriel.log");
const LOG_MAX_BYTES = 10 * 1024 * 1024; // 10MB log rotation threshold
const PROMPT_PATH = path.join(__dirname, "..", "prompts", "GABRIEL_MASTER.md");
const SAY_VOICE = process.env.GABRIEL_VOICE || "Daniel";
const MODEL = process.env.GABRIEL_MODEL || "claude-opus-4-6";
const FFMPEG = process.env.FFMPEG_PATH || "/opt/homebrew/bin/ffmpeg";
const UPLOAD_DIR = path.join(process.env.HOME, "NOIZYLAB", "voice-pipeline", "uploads");
const API_KEY = process.env.GABRIEL_API_KEY || "";
const ALLOWED_ORIGINS = (
  process.env.GABRIEL_CORS_ORIGINS || "http://localhost:5173,http://10.90.90.10:7777"
)
  .split(",")
  .map((s) => s.trim());

// ── Whisper detection (mlx_whisper → homebrew whisper → fallback) ─────────────
const WHISPER_CMD = (() => {
  for (const c of [
    "mlx_whisper",
    "/opt/homebrew/bin/whisper",
    `${process.env.HOME}/.local/bin/whisper`,
    "whisper",
  ]) {
    try {
      execSync(`command -v ${c} 2>/dev/null`, { stdio: "pipe" });
      return c;
    } catch {}
  }
  return null;
})();

// ── Claude tower definitions (voice-first, code-first, coordination) ──────────
const TOWERS = {
  max: {
    model: MODEL,
    system: `You are GABRIEL — the strategic intelligence of NOIZY EMPIRE. Robert Plowman (RSP_001) of Ottawa, C3 spinal injury, works voice-first on GOD.local (M2 Ultra 192GB). NOIZY builds a consent-native, provenance-first premium voice library. 75/25 creators always. This input came via iPhone → Whisper → DreamChamber. Be direct. Strategic. Under 4 sentences for voice. Never say "certainly". GORUNFREE.`,
  },
  code: {
    model: MODEL,
    system: `You are GABRIEL Code — build, fix, deploy for NOIZY EMPIRE. Rob sent this by voice via iPhone → Whisper → DreamChamber. Return working code, exact commands, no filler. Stack: Node.js, Cloudflare Workers/D1/KV, Wrangler, Python FastAPI, M2 Ultra, Tailscale. GORUNFREE.`,
  },
  work: {
    model: MODEL,
    system: `You are GABRIEL Coordinator — orchestrate the NOIZY crew. Rob's voice input came via iPhone → Whisper. Coordinate, delegate, summarize, keep things moving. Crew: CB01, LUCY, DREAM, SHIRLEY, ENGR-KEITH, FAMILY. GORUNFREE.`,
  },
};

// ── Anthropic ─────────────────────────────────────────────────────────────────
let anthropic;
try {
  const Anthropic = require("@anthropic-ai/sdk");
  anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
} catch {
  log("WARN: @anthropic-ai/sdk not found — run: npm install @anthropic-ai/sdk");
}

// ── SQLite ────────────────────────────────────────────────────────────────────
// Try existing gabriel-server sqlite3 module first, then better-sqlite3
let db;
const sqlitePaths = [
  path.join(
    process.env.HOME,
    "NOIZYANTHROPIC/NOIZYEMPIRE/codemaster/projects/gabriel-core/node_modules/better-sqlite3",
  ),
  path.join(__dirname, "node_modules/better-sqlite3"),
];
for (const p of sqlitePaths) {
  try {
    const Database = require(p);
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    db = new Database(DB_PATH);
    db.exec(`
      CREATE TABLE IF NOT EXISTS memcell (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        category TEXT DEFAULT 'general',
        updated_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        priority TEXT DEFAULT 'normal',
        status TEXT DEFAULT 'pending',
        result TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        completed_at TEXT
      );
      CREATE TABLE IF NOT EXISTS session_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        ts TEXT DEFAULT (datetime('now'))
      );

      -- ── Estate & Legacy Schema (GORUNFREE · Constitutional) ──────────────────
      -- estate_members: family voice archive subjects
      CREATE TABLE IF NOT EXISTS estate_members (
        hvs_id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        relationship TEXT NOT NULL,
        status TEXT DEFAULT 'living' CHECK(status IN ('living','transitioning','legacy')),
        voice_archive_path TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        transitioned_at TEXT
      );

      -- consent_matrix: per-member per-use-type consent rules (append-only)
      CREATE TABLE IF NOT EXISTS consent_matrix (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hvs_id TEXT NOT NULL REFERENCES estate_members(hvs_id),
        use_type TEXT NOT NULL,
        granted INTEGER NOT NULL DEFAULT 0 CHECK(granted IN (0,1)),
        granted_by TEXT NOT NULL,
        scope TEXT,
        expires_at TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );

      -- beneficiaries: royalty routing table (constitutional, immutable splits)
      CREATE TABLE IF NOT EXISTS beneficiaries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hvs_id TEXT NOT NULL REFERENCES estate_members(hvs_id),
        beneficiary_name TEXT NOT NULL,
        wallet_or_account TEXT,
        royalty_split_pct REAL NOT NULL CHECK(royalty_split_pct > 0 AND royalty_split_pct <= 100),
        priority INTEGER DEFAULT 1,
        active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
      );

      -- usage_rules: constitutional enforcement rules per asset type
      CREATE TABLE IF NOT EXISTS usage_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hvs_id TEXT REFERENCES estate_members(hvs_id),
        asset_type TEXT NOT NULL,
        rule_key TEXT NOT NULL,
        rule_value TEXT NOT NULL,
        is_absolute INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );

      -- estate_audit: append-only ledger — no UPDATE/DELETE ever
      CREATE TABLE IF NOT EXISTS estate_audit (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hvs_id TEXT,
        event_type TEXT NOT NULL,
        actor TEXT NOT NULL,
        payload TEXT,
        ts TEXT DEFAULT (datetime('now'))
      );

      -- therapeutic_arrangements: NOIZY healing products linked to legacy voices
      CREATE TABLE IF NOT EXISTS therapeutic_arrangements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hvs_id TEXT NOT NULL REFERENCES estate_members(hvs_id),
        arrangement_title TEXT NOT NULL,
        frequency_hz REAL,
        voice_intro_path TEXT,
        royalty_split_json TEXT,
        stripe_price_id TEXT,
        status TEXT DEFAULT 'draft' CHECK(status IN ('draft','active','archived')),
        created_at TEXT DEFAULT (datetime('now'))
      );

      -- GORUNFREE trust clauses: seed once, never duplicate
      CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_rules_absolute
        ON usage_rules (rule_key) WHERE hvs_id IS NULL;
      INSERT OR IGNORE INTO usage_rules (hvs_id, asset_type, rule_key, rule_value, is_absolute)
        VALUES (NULL, 'all', 'GORUNFREE_NOIZYKIDZ_TITHE', '0.01', 1);
      INSERT OR IGNORE INTO usage_rules (hvs_id, asset_type, rule_key, rule_value, is_absolute)
        VALUES (NULL, 'all', 'FOUNDING_ROYALTY_FLOOR', '0.75', 1);
    `);
    db.pragma("foreign_keys = ON");
    log("SQLite DB ready (foreign_keys=ON): " + DB_PATH);
    break;
  } catch {}
}
if (!db) log("Running with in-memory store (SQLite not available at known paths)");

// ── In-memory fallback ────────────────────────────────────────────────────────
const memStore = new Map();
const taskStore = [];
const sessionHistory = [];

// ── n8n Webhook Registry (Event Subscriptions) ──────────────────────────────
// Stores active n8n workflow webhooks by event type
// Structure: { 'event_type': [{ url, active, created_at }, ...] }
const n8nWebhooks = new Map();
const n8nWebhooksPath = path.join(process.env.HOME, "NOIZYLAB", "gabriel-n8n-webhooks.json");

function loadN8nWebhooks() {
  try {
    if (fs.existsSync(n8nWebhooksPath)) {
      const data = JSON.parse(fs.readFileSync(n8nWebhooksPath, "utf8"));
      for (const [event, webhooks] of Object.entries(data)) {
        n8nWebhooks.set(event, webhooks || []);
      }
      log(`n8n webhooks loaded: ${Array.from(n8nWebhooks.keys()).join(", ")}`);
    }
  } catch (e) {
    log(`WARN: Failed to load n8n webhooks: ${e.message}`);
  }
}

function saveN8nWebhooks() {
  try {
    const data = Object.fromEntries(n8nWebhooks);
    fs.mkdirSync(path.dirname(n8nWebhooksPath), { recursive: true });
    fs.writeFileSync(n8nWebhooksPath, JSON.stringify(data, null, 2));
  } catch (e) {
    log(`WARN: Failed to save n8n webhooks: ${e.message}`);
  }
}

// Broadcast event to all subscribed n8n workflows (with HMAC signature)
async function broadcastN8nEvent(eventType, payload) {
  const webhooks = n8nWebhooks.get(eventType) || [];
  if (webhooks.length === 0) return;

  const eventPayload = {
    event: eventType,
    source: "GABRIEL",
    ts: new Date().toISOString(),
    data: payload,
    gorunfree: true,
  };

  const body = JSON.stringify(eventPayload);
  // HMAC signature so n8n can verify the payload came from GABRIEL
  const signature = API_KEY ? crypto.createHmac("sha256", API_KEY).update(body).digest("hex") : "";

  for (const hook of webhooks) {
    if (!hook.active) continue;
    setImmediate(async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const headers = { "Content-Type": "application/json", "User-Agent": "GABRIEL/2.1" };
        if (signature) headers["X-Gabriel-Signature"] = `sha256=${signature}`;
        const res = await fetch(hook.url, {
          method: "POST",
          headers,
          body,
          signal: controller.signal,
        });
        clearTimeout(timeout);
        log(`n8n webhook [${eventType}] → ${hook.url.slice(0, 60)}... status=${res.status}`);
      } catch (e) {
        log(`WARN: n8n webhook [${eventType}] failed: ${e.message}`);
      }
    });
  }
}

loadN8nWebhooks();

// ── Master system prompt ──────────────────────────────────────────────────────
let SYSTEM_PROMPT = `You are GABRIEL — the orchestration intelligence of the NOIZY adaptive artist platform built for Robert Plowman (Rob), founder of NOIZY EMPIRE. Rob has a C3 spinal injury and works voice-first. Be direct, technical, under 3 sentences for voice responses. Never say "certainly" or "of course". GORUNFREE.`;
try {
  SYSTEM_PROMPT = fs.readFileSync(PROMPT_PATH, "utf8");
  log("Master prompt loaded: " + PROMPT_PATH);
} catch {
  log("Using built-in system prompt");
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try {
    fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
    // Rotate log if it exceeds threshold
    try {
      const stat = fs.statSync(LOG_PATH);
      if (stat.size > LOG_MAX_BYTES) {
        const rotated = LOG_PATH + "." + new Date().toISOString().slice(0, 10);
        fs.renameSync(LOG_PATH, rotated);
      }
    } catch {}
    fs.appendFileSync(LOG_PATH, line + "\n");
  } catch {}
}

function speak(text) {
  const clean = text.replace(/[`#*_\[\]]/g, "").slice(0, 500);
  spawn("say", ["-v", SAY_VOICE, clean], { detached: true }).unref();
  log(`SPEAK: ${clean.slice(0, 80)}...`);
}

function memSet(key, value, category = "general") {
  // Serialize objects to JSON string to prevent [object Object] corruption
  const serialized =
    typeof value === "object" && value !== null ? JSON.stringify(value) : String(value);
  if (db) {
    db.prepare(
      `INSERT OR REPLACE INTO memcell (key, value, category, updated_at)
                VALUES (?, ?, ?, datetime('now'))`,
    ).run(key, serialized, category);
  } else {
    memStore.set(key, { value: serialized, category, updated_at: new Date().toISOString() });
  }
}

function memGet(key) {
  if (db) {
    return db.prepare("SELECT * FROM memcell WHERE key = ?").get(key);
  }
  return memStore.get(key);
}

function memList() {
  if (db) return db.prepare("SELECT * FROM memcell ORDER BY updated_at DESC").all();
  return [...memStore.entries()].map(([k, v]) => ({ key: k, ...v }));
}

function addTask(desc, priority = "normal") {
  if (db) {
    const r = db
      .prepare("INSERT INTO tasks (description, priority) VALUES (?, ?)")
      .run(desc, priority);
    return { id: r.lastInsertRowid, description: desc, priority, status: "pending" };
  }
  const task = { id: taskStore.length + 1, description: desc, priority, status: "pending" };
  taskStore.push(task);
  return task;
}

function listTasks() {
  if (db) return db.prepare("SELECT * FROM tasks WHERE status='pending' ORDER BY id DESC").all();
  return taskStore.filter((t) => t.status === "pending");
}

// ── Estate / Legacy Helpers ───────────────────────────────────────────────────

function estateAudit(hvs_id, event_type, actor, payload) {
  if (!db) return;
  db.prepare("INSERT INTO estate_audit (hvs_id, event_type, actor, payload) VALUES (?,?,?,?)").run(
    hvs_id,
    event_type,
    actor,
    JSON.stringify(payload),
  );
}

function registerMember(hvs_id, full_name, relationship) {
  if (!db) return null;
  db.prepare(
    "INSERT OR IGNORE INTO estate_members (hvs_id, full_name, relationship) VALUES (?,?,?)",
  ).run(hvs_id, full_name, relationship);
  estateAudit(hvs_id, "MEMBER_REGISTERED", "system", { full_name, relationship });
  return db.prepare("SELECT * FROM estate_members WHERE hvs_id=?").get(hvs_id);
}

function transitionToLegacy(hvs_id, actor) {
  if (!db) return null;
  db.prepare(
    "UPDATE estate_members SET status='legacy', transitioned_at=datetime('now') WHERE hvs_id=?",
  ).run(hvs_id);
  estateAudit(hvs_id, "LEGACY_TRANSITION", actor, { ts: new Date().toISOString() });
  return db.prepare("SELECT * FROM estate_members WHERE hvs_id=?").get(hvs_id);
}

function addBeneficiary(hvs_id, name, wallet, pct, priority = 1) {
  if (!db) return null;
  // Enforce GORUNFREE: validate total does not drop founding split below 75%
  const existing = db
    .prepare(
      "SELECT SUM(royalty_split_pct) as total FROM beneficiaries WHERE hvs_id=? AND active=1",
    )
    .get(hvs_id);
  if ((existing?.total || 0) + pct > 100) throw new Error("Royalty splits exceed 100%");
  const r = db
    .prepare(
      "INSERT INTO beneficiaries (hvs_id,beneficiary_name,wallet_or_account,royalty_split_pct,priority) VALUES (?,?,?,?,?)",
    )
    .run(hvs_id, name, wallet, pct, priority);
  estateAudit(hvs_id, "BENEFICIARY_ADDED", "system", { name, pct });
  return r.lastInsertRowid;
}

function grantConsent(hvs_id, use_type, granted_by, scope, expires_at) {
  if (!db) return null;
  const r = db
    .prepare(
      "INSERT INTO consent_matrix (hvs_id,use_type,granted,granted_by,scope,expires_at) VALUES (?,?,1,?,?,?)",
    )
    .run(hvs_id, use_type, granted_by, scope, expires_at);
  estateAudit(hvs_id, "CONSENT_GRANTED", granted_by, { use_type, scope });
  return r.lastInsertRowid;
}

function checkConsent(hvs_id, use_type) {
  if (!db) return false;
  const row = db
    .prepare(
      "SELECT * FROM consent_matrix WHERE hvs_id=? AND use_type=? AND granted=1 AND (expires_at IS NULL OR expires_at > datetime('now')) ORDER BY id DESC LIMIT 1",
    )
    .get(hvs_id, use_type);
  return !!row;
}

function getEstateStatus(hvs_id) {
  if (!db) return null;
  const member = db.prepare("SELECT * FROM estate_members WHERE hvs_id=?").get(hvs_id);
  const benes = db.prepare("SELECT * FROM beneficiaries WHERE hvs_id=? AND active=1").all(hvs_id);
  const rules = db
    .prepare("SELECT * FROM usage_rules WHERE hvs_id=? OR hvs_id IS NULL")
    .all(hvs_id);
  return { member, beneficiaries: benes, rules };
}

async function askClaude(userMsg, tts = false) {
  if (!anthropic) return { error: "ANTHROPIC_API_KEY not set or SDK missing" };

  sessionHistory.push({ role: "user", content: userMsg });
  if (sessionHistory.length > 40) sessionHistory.splice(0, sessionHistory.length - 30);

  try {
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: sessionHistory.slice(-20),
    });
    const reply = msg.content[0]?.text || "";
    sessionHistory.push({ role: "assistant", content: reply });

    if (db) {
      db.prepare("INSERT INTO session_log (role, content) VALUES (?,?)").run("user", userMsg);
      db.prepare("INSERT INTO session_log (role, content) VALUES (?,?)").run("assistant", reply);
    }

    if (tts) speak(reply);
    log(`CLAUDE: ${reply.slice(0, 100)}`);
    return { reply };
  } catch (e) {
    log("Claude error: " + e.message);
    return { error: e.message };
  }
}

// ── Tower auto-detect ─────────────────────────────────────────────────────────
function detectTower(text) {
  const t = text.toLowerCase();
  if (
    /build|code|deploy|script|api|worker|function|install|git|fix|debug|error|wrangler|cloudflare|python|node/.test(
      t,
    )
  )
    return "code";
  if (/task|assign|route|crew|channel|delegate|schedule|team|coordinate|lucy|dream|shirley/.test(t))
    return "work";
  return "max";
}

// ── Tower-aware Claude call ───────────────────────────────────────────────────
async function askTower(text, tower = "max", runId = "") {
  if (!anthropic) throw new Error("ANTHROPIC_API_KEY not set or SDK missing");

  const cfg = TOWERS[tower] || TOWERS.max;
  const start = Date.now();
  log(`[${runId}] TOWER=${tower} model=${cfg.model} len=${text.length}`);

  const msg = await anthropic.messages.create({
    model: cfg.model,
    max_tokens: 2048,
    system: cfg.system,
    messages: [{ role: "user", content: text }],
  });

  const reply = msg.content[0]?.text || "";
  const tokens = msg.usage || {};
  log(`[${runId}] replied ${reply.length}c in ${Date.now() - start}ms`);

  // Log to session
  if (db) {
    db.prepare("INSERT INTO session_log (role,content) VALUES (?,?)").run("user", text);
    db.prepare("INSERT INTO session_log (role,content) VALUES (?,?)").run("assistant", reply);
  }
  return { reply, tokens, model: cfg.model, tower };
}

// ── Whisper transcription ─────────────────────────────────────────────────────
async function transcribeWhisper(inputPath, runId = "") {
  if (!WHISPER_CMD)
    throw new Error(
      "Whisper not installed — run: pip install openai-whisper OR pip install mlx-whisper",
    );
  if (!fs.existsSync(inputPath)) throw new Error(`Audio file not found: ${inputPath}`);

  try {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  } catch {}

  const baseName = path.basename(inputPath, path.extname(inputPath));
  const wavPath = path.join(UPLOAD_DIR, `${baseName}_16k.wav`);

  // Normalize → 16kHz mono WAV (required by Whisper)
  await execFileAsync(
    FFMPEG,
    ["-i", inputPath, "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", "-y", wavPath],
    { timeout: 30000 },
  );
  log(`[${runId}] Normalized to ${wavPath}`);

  let transcript = "";
  const outDir = path.join(UPLOAD_DIR, "transcripts");
  fs.mkdirSync(outDir, { recursive: true });

  if (WHISPER_CMD === "mlx_whisper") {
    await execFileAsync(
      "mlx_whisper",
      [wavPath, "--model", "mlx-community/whisper-base.en-mlx", "--output-dir", outDir],
      { timeout: 90000 },
    );
    const outFile = path.join(outDir, `${baseName}_16k.txt`);
    if (fs.existsSync(outFile)) transcript = fs.readFileSync(outFile, "utf8").trim();
  } else {
    await execFileAsync(
      WHISPER_CMD,
      [wavPath, "--model", "base.en", "--output_format", "txt", "--output_dir", outDir],
      { timeout: 120000 },
    );
    const outFile = path.join(outDir, `${baseName}_16k.txt`);
    if (fs.existsSync(outFile)) transcript = fs.readFileSync(outFile, "utf8").trim();
  }

  if (!transcript || transcript.length < 2)
    throw new Error("Transcript empty — likely silence or noise");
  log(`[${runId}] Transcript (${transcript.length}c): ${transcript.slice(0, 100)}`);
  return { transcript, wavPath };
}

// ── Broadcast to all WS clients ───────────────────────────────────────────────
function broadcastVoice(msg) {
  const raw = JSON.stringify({ ...msg, ts: new Date().toISOString() });
  voiceClients.forEach((c) => {
    try {
      if (c.readyState === 1) c.send(raw);
    } catch {}
  });
}

function morningBrief() {
  const now = new Date();
  const tasks = listTasks();
  const mem = memList().slice(0, 5);
  const msg = `GABRIEL morning brief. ${now.toDateString()}. ${tasks.length} pending tasks. Memory cells: ${mem.map((m) => m.key).join(", ") || "empty"}. GORUNFREE.`;
  log("MORNING BRIEF: " + msg);
  askClaude(
    "Generate a sharp 3-sentence morning brief for the NOIZY EMPIRE. Include system status and any critical reminders. Be direct.",
    true,
  );
}

// ── Scheduled tasks ───────────────────────────────────────────────────────────
function scheduleMorningBrief() {
  const now = new Date();
  const next = new Date();
  next.setHours(6, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  const delay = next - now;
  log(`Morning brief scheduled in ${Math.round(delay / 60000)}min`);
  setTimeout(() => {
    morningBrief();
    setInterval(morningBrief, 24 * 60 * 60 * 1000);
  }, delay);
}

// 30-min heartbeat
setInterval(
  () => {
    log("HEARTBEAT — GABRIEL daemon alive · GORUNFREE");
    memSet("last_heartbeat", new Date().toISOString(), "system");
  },
  30 * 60 * 1000,
);

// ── HTTP Router ───────────────────────────────────────────────────────────────
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
  });
}

function readBodyRaw(req, maxBytes = 10 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on("data", (c) => {
      total += c.length;
      if (total > maxBytes) {
        req.destroy();
        reject(new Error("Upload too large (10MB max)"));
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function send(res, status, data, req) {
  const body = JSON.stringify(data);
  const origin = req?.headers?.origin || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  });
  res.end(body);
}

// ── Auth check — API key required for mutating/sensitive endpoints ────────────
// Public endpoints (no auth): GET /health, GET /, GET /lucy, GET /mobile
// Everything else requires Authorization: Bearer <GABRIEL_API_KEY>
const PUBLIC_ROUTES = new Set(["/health", "/", "/lucy", "/mobile"]);

function requireAuth(req, res, url) {
  if (!API_KEY) return true; // No key configured = dev mode (warn on startup)
  if (PUBLIC_ROUTES.has(url) && req.method === "GET") return true;
  const auth = req.headers["authorization"] || "";
  if (auth === `Bearer ${API_KEY}`) return true;
  send(res, 401, { error: "Unauthorized — set Authorization: Bearer <GABRIEL_API_KEY>" }, req);
  return false;
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    send(res, 200, {}, req);
    return;
  }

  const url = req.url.split("?")[0];
  const method = req.method;
  log(`${method} ${url}`);

  // ── Auth gate ─────────────────────────────────────────────────────────────
  if (!requireAuth(req, res, url)) return;

  // ── GET /health ──────────────────────────────────────────────────────────
  if (method === "GET" && url === "/health") {
    send(res, 200, {
      ok: true,
      daemon: "GABRIEL",
      version: "2.1.0",
      model: MODEL,
      voice: SAY_VOICE,
      db: !!db,
      anthropic: !!anthropic,
      uptime: process.uptime(),
      ts: new Date().toISOString(),
      gorunfree: true,
    });
    return;
  }

  // ── GET /status ──────────────────────────────────────────────────────────
  if (method === "GET" && url === "/status") {
    const tasks = listTasks();
    const memory = memList();
    send(res, 200, {
      daemon: "GABRIEL v2.0 · NOIZY EMPIRE",
      model: MODEL,
      voice: SAY_VOICE,
      session_turns: sessionHistory.length,
      pending_tasks: tasks.length,
      memory_cells: memory.length,
      db_path: DB_PATH,
      uptime_seconds: Math.round(process.uptime()),
      gorunfree: true,
    });
    return;
  }

  // ── GET /session ─────────────────────────────────────────────────────────
  if (method === "GET" && url === "/session") {
    send(res, 200, { history: sessionHistory.slice(-20) });
    return;
  }

  // ── POST /command ────────────────────────────────────────────────────────
  if (method === "POST" && url === "/command") {
    let body;
    try {
      body = await parseBody(req);
    } catch {
      send(res, 400, { error: "bad JSON" });
      return;
    }
    const { text, tts = true } = body;
    if (!text) {
      send(res, 400, { error: "text required" });
      return;
    }
    const result = await askClaude(text, tts);
    send(res, result.error ? 500 : 200, result);
    return;
  }

  // ── POST /speak ──────────────────────────────────────────────────────────
  if (method === "POST" && url === "/speak") {
    let body;
    try {
      body = await parseBody(req);
    } catch {
      send(res, 400, { error: "bad JSON" });
      return;
    }
    const { text, voice } = body;
    if (!text) {
      send(res, 400, { error: "text required" });
      return;
    }
    if (voice) spawn("say", ["-v", voice, text], { detached: true }).unref();
    else speak(text);
    send(res, 200, { ok: true, spoken: text.slice(0, 80) });
    return;
  }

  // ── POST /brief ──────────────────────────────────────────────────────────
  if (method === "POST" && url === "/brief") {
    morningBrief();
    send(res, 200, { ok: true, triggered: "morning_brief" });
    return;
  }

  // ── GET|POST /memcell/:key ───────────────────────────────────────────────
  const memMatch = url.match(/^\/memcell\/(.+)$/);
  if (memMatch) {
    const key = decodeURIComponent(memMatch[1]);
    if (method === "GET") {
      const val = memGet(key);
      if (!val) {
        send(res, 404, { error: "not found" });
        return;
      }
      send(res, 200, val);
      return;
    }
    if (method === "POST") {
      let body;
      try {
        body = await parseBody(req);
      } catch {
        send(res, 400, { error: "bad JSON" });
        return;
      }
      memSet(key, body.value, body.category);
      send(res, 200, { ok: true, key, value: body.value });
      return;
    }
  }

  // ── GET /memcell ─────────────────────────────────────────────────────────
  if (method === "GET" && url === "/memcell") {
    send(res, 200, { cells: memList() });
    return;
  }

  // ── POST /task ────────────────────────────────────────────────────────────
  if (method === "POST" && url === "/task") {
    let body;
    try {
      body = await parseBody(req);
    } catch {
      send(res, 400, { error: "bad JSON" });
      return;
    }
    const task = addTask(body.description, body.priority);
    send(res, 200, { ok: true, task });
    return;
  }

  // ── GET /tasks ────────────────────────────────────────────────────────────
  if (method === "GET" && url === "/tasks") {
    send(res, 200, { tasks: listTasks() });
    return;
  }

  // ── POST /estate/member ───────────────────────────────────────────────────
  if (method === "POST" && url === "/estate/member") {
    let body;
    try {
      body = await parseBody(req);
    } catch {
      send(res, 400, { error: "bad JSON" });
      return;
    }
    const { hvs_id, full_name, relationship } = body;
    if (!hvs_id || !full_name || !relationship) {
      send(res, 400, { error: "hvs_id, full_name, relationship required" });
      return;
    }
    send(res, 200, { ok: true, member: registerMember(hvs_id, full_name, relationship) });
    return;
  }

  // ── POST /estate/transition ───────────────────────────────────────────────
  if (method === "POST" && url === "/estate/transition") {
    let body;
    try {
      body = await parseBody(req);
    } catch {
      send(res, 400, { error: "bad JSON" });
      return;
    }
    const { hvs_id, actor } = body;
    if (!hvs_id) {
      send(res, 400, { error: "hvs_id required" });
      return;
    }
    const result = transitionToLegacy(hvs_id, actor || "system");
    speak(
      `Legacy transition initiated for ${result?.full_name || hvs_id}. Royalty routing active.`,
    );
    send(res, 200, { ok: true, member: result });
    return;
  }

  // ── GET /estate/:hvs_id ───────────────────────────────────────────────────
  const estateMatch = url.match(/^\/estate\/([^\/]+)$/);
  if (estateMatch && method === "GET") {
    const status = getEstateStatus(decodeURIComponent(estateMatch[1]));
    if (!status?.member) {
      send(res, 404, { error: "member not found" });
      return;
    }
    send(res, 200, status);
    return;
  }

  // ── POST /estate/consent ──────────────────────────────────────────────────
  if (method === "POST" && url === "/estate/consent") {
    let body;
    try {
      body = await parseBody(req);
    } catch {
      send(res, 400, { error: "bad JSON" });
      return;
    }
    const { hvs_id, use_type, granted_by, scope, expires_at } = body;
    if (!hvs_id || !use_type || !granted_by) {
      send(res, 400, { error: "hvs_id, use_type, granted_by required" });
      return;
    }
    grantConsent(hvs_id, use_type, granted_by, scope, expires_at);
    send(res, 200, { ok: true, hvs_id, use_type, granted: true });
    return;
  }

  // ── POST /estate/beneficiary ──────────────────────────────────────────────
  if (method === "POST" && url === "/estate/beneficiary") {
    let body;
    try {
      body = await parseBody(req);
    } catch {
      send(res, 400, { error: "bad JSON" });
      return;
    }
    const { hvs_id, name, wallet, pct, priority } = body;
    if (!hvs_id || !name || !pct) {
      send(res, 400, { error: "hvs_id, name, pct required" });
      return;
    }
    try {
      const id = addBeneficiary(hvs_id, name, wallet, pct, priority);
      send(res, 200, { ok: true, id });
    } catch (e) {
      send(res, 400, { error: e.message });
    }
    return;
  }

  // ── GET /estate/audit/:hvs_id ─────────────────────────────────────────────
  const auditMatch = url.match(/^\/estate\/audit\/([^\/]+)$/);
  if (auditMatch && method === "GET") {
    if (!db) {
      send(res, 503, { error: "db not available" });
      return;
    }
    const rows = db
      .prepare("SELECT * FROM estate_audit WHERE hvs_id=? ORDER BY id DESC LIMIT 100")
      .all(decodeURIComponent(auditMatch[1]));
    send(res, 200, { audit: rows });
    return;
  }

  // ── GET /voice/status ─────────────────────────────────────────────────────
  if (method === "GET" && url === "/voice/status") {
    send(res, 200, {
      whisper: WHISPER_CMD || "not found — pip install openai-whisper",
      ffmpeg: fs.existsSync(FFMPEG) ? FFMPEG : "not found — brew install ffmpeg",
      towers: Object.keys(TOWERS),
      model: MODEL,
      wsClients: voiceClients.size,
      uploadDir: UPLOAD_DIR,
      uptime: Math.round(process.uptime()),
    });
    return;
  }

  // ── POST /voice/transcribe ────────────────────────────────────────────────
  // Body: { path: '/tmp/recording.wav' }  — returns { transcript }
  if (method === "POST" && url === "/voice/transcribe") {
    let body;
    try {
      body = await parseBody(req);
    } catch {
      send(res, 400, { error: "bad JSON" });
      return;
    }
    const runId = crypto.randomBytes(4).toString("hex");
    // Restrict to UPLOAD_DIR to prevent arbitrary file access
    const resolvedPath = body.path ? path.resolve(body.path) : "";
    if (
      !resolvedPath ||
      !resolvedPath.startsWith(path.resolve(UPLOAD_DIR)) ||
      !fs.existsSync(resolvedPath)
    ) {
      send(res, 400, { error: "Audio file must be in upload directory", uploadDir: UPLOAD_DIR });
      return;
    }
    body.path = resolvedPath;
    broadcastVoice({ type: "voice:pipeline:start", runId, file: path.basename(body.path) });
    try {
      const { transcript } = await transcribeWhisper(body.path, runId);
      broadcastVoice({ type: "voice:pipeline:transcript", runId, transcript });
      send(res, 200, { runId, transcript });
    } catch (e) {
      broadcastVoice({ type: "voice:pipeline:error", runId, error: e.message });
      send(res, 500, { error: e.message, runId });
    }
    return;
  }

  // ── POST /voice/pipeline ──────────────────────────────────────────────────
  // Body: { path: '/tmp/recording.wav', tower?: 'auto'|'max'|'code'|'work' }
  // Returns: { runId } immediately, then broadcasts pipeline events on WS /voice
  if (method === "POST" && url === "/voice/pipeline") {
    let body;
    try {
      body = await parseBody(req);
    } catch {
      send(res, 400, { error: "bad JSON" });
      return;
    }
    const runId = crypto.randomBytes(4).toString("hex");

    // Restrict to UPLOAD_DIR to prevent arbitrary file access
    const resolvedPath = body.path ? path.resolve(body.path) : "";
    if (
      !resolvedPath ||
      !resolvedPath.startsWith(path.resolve(UPLOAD_DIR)) ||
      !fs.existsSync(resolvedPath)
    ) {
      send(res, 400, { error: "Audio file must be in upload directory", uploadDir: UPLOAD_DIR });
      return;
    }
    body.path = resolvedPath;

    // Respond immediately — pipeline runs async, results pushed via WS
    send(res, 202, {
      runId,
      status: "running",
      message: "Pipeline started — listen on ws://:7777/voice or ws://:7777/ws",
    });

    setImmediate(async () => {
      try {
        broadcastVoice({ type: "voice:pipeline:start", runId, file: path.basename(body.path) });

        // Step 1: Whisper STT
        broadcastVoice({ type: "voice:pipeline:step", runId, step: 1, name: "whisper" });
        const { transcript } = await transcribeWhisper(body.path, runId);
        broadcastVoice({ type: "voice:pipeline:transcript", runId, transcript });
        memSet("last_voice_transcript", transcript, "voice");

        // Step 2: Claude (auto-detect or explicit tower)
        const tower = body.tower && body.tower !== "auto" ? body.tower : detectTower(transcript);
        broadcastVoice({ type: "voice:pipeline:step", runId, step: 2, name: "claude", tower });
        const { reply, tokens, model } = await askTower(transcript, tower, runId);

        // Step 3: Broadcast complete + TTS
        broadcastVoice({
          type: "voice:pipeline:complete",
          runId,
          tower,
          model,
          transcript,
          reply,
          tokens,
        });
        memSet("last_voice_reply", reply, "voice");

        // macOS notification (use spawn to prevent shell injection)
        const preview = reply.replace(/```[\s\S]*?```/g, "[code]").slice(0, 80);
        spawn(
          "osascript",
          [
            "-e",
            `display notification "${preview.replace(/["\\]/g, "")}" with title "GABRIEL [${tower.toUpperCase()}]"`,
          ],
          { detached: true },
        ).unref();

        // TTS only for short prose (not code dumps)
        if (reply.length < 300 && !reply.includes("```")) speak(reply);
      } catch (e) {
        log(`[${runId}] Pipeline ERROR: ${e.message}`);
        broadcastVoice({ type: "voice:pipeline:error", runId, error: e.message });
      }
    });
    return;
  }

  // ── POST /agent/lucy/ask — LUCY iPad Shortcut endpoint ─────────────────
  if (method === "POST" && url === "/agent/lucy/ask") {
    let body;
    try {
      body = await parseBody(req);
    } catch {
      send(res, 400, { error: "bad JSON" });
      return;
    }
    const { text, agent = "LUCY_001" } = body;
    if (!text) {
      send(res, 400, { error: "text required" });
      return;
    }

    const lucySystem = `You are LUCY — archivist, indexer, and creative companion in the NOIZY EMPIRE DreamChamber crew.
Australian voice (Siri Kate on iPad, Karen on macOS). Warm, direct, encouraging.
Say "brilliant" instead of "great". Say "right then" to transition. Use "reckon" naturally.
You manage THE AQUARIUM archive, indexing, receipts, and LIFELUV tracking.
Never say "As an AI" or corporate speak. Keep responses to one breath — concise and real.
Robert (RSP_001) is your creator. GORUNFREE.`;

    try {
      if (!anthropic) {
        send(res, 500, { error: "Anthropic SDK not loaded" });
        return;
      }
      const msg = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250514",
        max_tokens: 512,
        system: lucySystem,
        messages: [{ role: "user", content: text }],
      });
      const response = msg.content?.[0]?.text || "Sorry, couldn't process that.";

      spawn(
        "say",
        ["-v", "Karen", "-r", "185", response.replace(/[`#*_\[\]]/g, "").slice(0, 500)],
        { detached: true },
      ).unref();
      memSet(
        `lucy:ask:${Date.now()}`,
        JSON.stringify({ agent, text: text.slice(0, 200), response: response.slice(0, 200) }),
        "lucy",
      );
      log(`LUCY: ${response.slice(0, 100)}`);

      send(res, 200, { agent, response, spoken: true, ts: new Date().toISOString() });
    } catch (e) {
      log("LUCY error: " + e.message);
      send(res, 500, { error: e.message });
    }
    return;
  }

  // ── GET /lucy — LUCY iPad PWA ─────────────────────────────────────────────
  if (method === "GET" && url === "/lucy") {
    const lucyPath = path.join(__dirname, "lucy.html");
    if (fs.existsSync(lucyPath)) {
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
      });
      res.end(fs.readFileSync(lucyPath, "utf8"));
    } else {
      send(res, 404, { error: "lucy.html not found" });
    }
    return;
  }

  // ── GET / — mobile PWA ────────────────────────────────────────────────────
  if (method === "GET" && url === "/") {
    const htmlPath = path.join(__dirname, "mobile.html");
    if (fs.existsSync(htmlPath)) {
      const html = fs.readFileSync(htmlPath, "utf8");
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
      });
      res.end(html);
    } else {
      send(res, 404, { error: "mobile.html not found — run from GABRIEL/daemon/" });
    }
    return;
  }

  // ── POST /voice/upload ────────────────────────────────────────────────────
  // Body: raw audio bytes (audio/mp4, audio/webm, audio/ogg)
  // Returns: { runId, status: 'processing' } immediately
  // Pipeline results broadcast via WebSocket /voice
  if (method === "POST" && url === "/voice/upload") {
    const runId = crypto.randomBytes(4).toString("hex");
    let data;
    try {
      data = await readBodyRaw(req);
    } catch (e) {
      send(res, 400, { error: e.message });
      return;
    }
    if (!data || data.length < 100) {
      send(res, 400, { error: "Empty or too-short audio" });
      return;
    }

    const ct = req.headers["content-type"] || "";
    const ext = ct.includes("mp4") ? ".mp4" : ct.includes("ogg") ? ".ogg" : ".webm";
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const rawPath = path.join(UPLOAD_DIR, `voice_${runId}${ext}`);
    const wavPath = path.join(UPLOAD_DIR, `voice_${runId}.wav`);
    fs.writeFileSync(rawPath, data);

    send(res, 202, { runId, status: "processing", bytes: data.length });

    setImmediate(async () => {
      try {
        broadcastVoice({ type: "voice:pipeline:start", runId, bytes: data.length });

        // Convert to 16kHz mono WAV for Whisper (execFile prevents shell injection)
        await execFileAsync(FFMPEG, ["-y", "-i", rawPath, "-ar", "16000", "-ac", "1", wavPath], {
          timeout: 30000,
        });

        const { transcript } = await transcribeWhisper(wavPath, runId);
        broadcastVoice({ type: "voice:pipeline:transcript", runId, transcript });
        memSet("last_voice_transcript", transcript, "voice");

        const tower = detectTower(transcript);
        broadcastVoice({ type: "voice:pipeline:step", runId, step: 2, name: "claude", tower });
        const { reply, tokens, model } = await askTower(transcript, tower, runId);

        broadcastVoice({
          type: "voice:pipeline:complete",
          runId,
          tower,
          model,
          transcript,
          reply,
          tokens,
        });
        memSet("last_voice_reply", reply, "voice");

        // macOS notification (use spawn to prevent shell injection)
        const preview = reply.replace(/```[\s\S]*?```/g, "[code]").slice(0, 80);
        spawn(
          "osascript",
          [
            "-e",
            `display notification "${preview.replace(/["\\]/g, "")}" with title "GABRIEL [${tower.toUpperCase()}]"`,
          ],
          { detached: true },
        ).unref();
        if (reply.length < 300 && !reply.includes("```")) speak(reply);
      } catch (e) {
        log(`[${runId}] Upload pipeline ERROR: ${e.message}`);
        broadcastVoice({ type: "voice:pipeline:error", runId, error: e.message });
      } finally {
        try {
          fs.unlinkSync(rawPath);
        } catch {}
        try {
          fs.unlinkSync(wavPath);
        } catch {}
      }
    });
    return;
  }

  // ── N8N BRIDGE ──────────────────────────────────────────────────────────────
  // Agentic factory: GABRIEL proxies n8n API for workflow construction
  const N8N_URL = process.env.N8N_API_URL || "http://localhost:5678";
  const N8N_KEY = process.env.N8N_API_KEY || "";

  // GET /n8n/status — check n8n health + list active workflows
  if (method === "GET" && url === "/n8n/status") {
    try {
      const headers = { Accept: "application/json" };
      if (N8N_KEY) headers["X-N8N-API-KEY"] = N8N_KEY;
      const r = await fetch(`${N8N_URL}/api/v1/workflows?active=true&limit=50`, {
        headers,
        signal: AbortSignal.timeout(5000),
      });
      if (!r.ok) {
        send(res, r.status, { error: `n8n returned ${r.status}` });
        return;
      }
      const data = await r.json();
      send(res, 200, {
        n8n: "connected",
        url: N8N_URL,
        active_workflows: data.data?.length || 0,
        workflows: (data.data || []).map((w) => ({ id: w.id, name: w.name, active: w.active })),
      });
    } catch (e) {
      send(res, 503, { error: `n8n offline: ${e.message}`, url: N8N_URL });
    }
    return;
  }

  // POST /n8n/build — Claude sends workflow JSON, GABRIEL pushes to n8n
  // Body: { name, nodes, connections, settings?, active? }
  if (method === "POST" && url === "/n8n/build") {
    let body;
    try {
      body = await parseBody(req);
    } catch {
      send(res, 400, { error: "bad JSON" });
      return;
    }
    if (!body.name || !body.nodes) {
      send(res, 400, { error: "name and nodes required" });
      return;
    }

    const workflow = {
      name: body.name,
      nodes: body.nodes,
      connections: body.connections || {},
      settings: body.settings || { executionOrder: "v1" },
      active: body.active || false,
    };

    try {
      const headers = { "Content-Type": "application/json", Accept: "application/json" };
      if (N8N_KEY) headers["X-N8N-API-KEY"] = N8N_KEY;
      const r = await fetch(`${N8N_URL}/api/v1/workflows`, {
        method: "POST",
        headers,
        body: JSON.stringify(workflow),
        signal: AbortSignal.timeout(10000),
      });
      const data = await r.json();
      if (!r.ok) {
        send(res, r.status, { error: data.message || "n8n rejected workflow", detail: data });
        return;
      }

      log(`n8n workflow created: ${data.id} — ${body.name}`);
      broadcastN8nEvent("workflow.created", { id: data.id, name: body.name });
      send(res, 201, { ok: true, id: data.id, name: data.name, active: data.active });
    } catch (e) {
      send(res, 503, { error: `n8n build failed: ${e.message}` });
    }
    return;
  }

  // POST /n8n/execute — trigger a workflow by ID
  // Body: { workflowId, data? }
  if (method === "POST" && url === "/n8n/execute") {
    let body;
    try {
      body = await parseBody(req);
    } catch {
      send(res, 400, { error: "bad JSON" });
      return;
    }
    if (!body.workflowId) {
      send(res, 400, { error: "workflowId required" });
      return;
    }

    try {
      const headers = { "Content-Type": "application/json", Accept: "application/json" };
      if (N8N_KEY) headers["X-N8N-API-KEY"] = N8N_KEY;
      const r = await fetch(`${N8N_URL}/api/v1/workflows/${body.workflowId}/run`, {
        method: "POST",
        headers,
        body: JSON.stringify({ data: body.data || {} }),
        signal: AbortSignal.timeout(30000),
      });
      const data = await r.json();
      if (!r.ok) {
        send(res, r.status, { error: data.message || "execution failed", detail: data });
        return;
      }

      log(`n8n workflow executed: ${body.workflowId}`);
      broadcastN8nEvent("workflow.executed", { workflowId: body.workflowId });
      send(res, 200, { ok: true, execution: data });
    } catch (e) {
      send(res, 503, { error: `n8n execute failed: ${e.message}` });
    }
    return;
  }

  send(res, 404, {
    error: "not found",
    routes: [
      "GET /",
      "GET /lucy",
      "GET /health",
      "GET /status",
      "GET /session",
      "POST /command",
      "POST /speak",
      "POST /brief",
      "GET|POST /memcell/:key",
      "GET /memcell",
      "POST /task",
      "GET /tasks",
      "POST /estate/member",
      "POST /estate/transition",
      "GET /estate/:hvs_id",
      "POST /estate/consent",
      "POST /estate/beneficiary",
      "GET /estate/audit/:hvs_id",
      "── VOICE ──",
      "GET /voice/status",
      "POST /voice/transcribe",
      "POST /voice/pipeline",
      "POST /voice/upload",
      "── AGENTS ──",
      "POST /agent/lucy/ask",
      "── N8N BRIDGE ──",
      "GET /n8n/status",
      "POST /n8n/build",
      "POST /n8n/execute",
    ],
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
// ── Voice WebSocket Broadcast Channel ─────────────────────────────────────────
// All devices on 10.90.90.10 connect to ws://10.90.90.10:7777/voice
// Send: { type: 'transcript', text: '...' }
// Receive: { type: 'gabriel', text: '...', ts: '...' }
const voiceClients = new Set();

if (WebSocketServer) {
  // Single WSS handles both /voice (legacy) and /ws (DreamChamber extension)
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    const pathname = req.url?.split("?")[0];
    if (pathname === "/voice" || pathname === "/ws") {
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
    } else {
      socket.destroy();
    }
  });

  wss.on("connection", (ws, req) => {
    voiceClients.add(ws);
    const clientPath = req.url?.split("?")[0] || "/voice";
    const clientId = req.headers["x-client-id"] || "anonymous";
    log(`WS connected [${clientPath}] id=${clientId} (${voiceClients.size} total)`);

    ws.send(
      JSON.stringify({
        type: "connected",
        text: "GABRIEL voice channel open. GORUNFREE.",
        version: "2.1.0",
        whisper: !!WHISPER_CMD,
        towers: Object.keys(TOWERS),
        model: MODEL,
        ts: new Date().toISOString(),
      }),
    );

    ws.on("message", async (data) => {
      let msg;
      try {
        msg = JSON.parse(data.toString());
      } catch {
        return;
      }

      // ── Ping/keepalive ──────────────────────────────────────────────────
      if (msg.type === "ping") {
        ws.send(JSON.stringify({ type: "pong", ts: Date.now() }));
        return;
      }

      // ── Transcript → Claude (legacy voice path + DreamChamber chat:stream) ──
      if ((msg.type === "transcript" || msg.type === "chat:stream") && (msg.text || msg.content)) {
        const text = msg.text || msg.content;
        const tower = msg.tower ? msg.tower : detectTower(text);
        log(`VOICE IN [${tower}]: ${text.slice(0, 80)}`);
        memSet("last_voice_command", text, "voice");

        try {
          const { reply, tokens, model } = await askTower(text, tower);
          const out = JSON.stringify({
            type: "gabriel",
            text: reply,
            tower,
            model,
            tokens,
            ts: new Date().toISOString(),
          });
          voiceClients.forEach((c) => {
            try {
              if (c.readyState === 1) c.send(out);
            } catch {}
          });
          if (reply.length < 300 && !reply.includes("```")) speak(reply);
        } catch (e) {
          ws.send(JSON.stringify({ type: "error", error: e.message }));
        }
      }
    });

    ws.on("close", () => {
      voiceClients.delete(ws);
      log(`WS disconnected id=${clientId} (${voiceClients.size} remaining)`);
    });

    ws.on("error", (e) => log(`WS error: ${e.message}`));
  });

  log(`Voice WebSocket ready at ws://0.0.0.0:${PORT}/voice  AND  ws://0.0.0.0:${PORT}/ws`);
} else {
  log("WARN: WebSocket not available — run: npm install ws");
}

server.listen(PORT, "0.0.0.0", () => {
  log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  log(`GABRIEL DAEMON v2.0 — NOIZY EMPIRE · GORUNFREE`);
  log(`Port: ${PORT}  Model: ${MODEL}  Voice: ${SAY_VOICE}`);
  log(`DB: ${db ? DB_PATH : "in-memory"}`);
  log(`Anthropic SDK: ${anthropic ? "ready" : "MISSING — set ANTHROPIC_API_KEY"}`);
  log(
    `Auth: ${API_KEY ? "ENABLED (Bearer token required)" : "DISABLED — set GABRIEL_API_KEY to secure endpoints"}`,
  );
  if (!API_KEY)
    log(
      "⚠ WARNING: No GABRIEL_API_KEY set — all endpoints are open. Set GABRIEL_API_KEY in ~/.zshrc for production.",
    );
  log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  speak("GABRIEL online. GORUNFREE.");
  scheduleMorningBrief();
  memSet("daemon_start", new Date().toISOString(), "system");
});

server.on("error", (e) => log("SERVER ERROR: " + e.message));
process.on("uncaughtException", (e) => log("UNCAUGHT: " + e.message));
