const express = require("express");
const { createServer } = require("http");
const { WebSocketServer } = require("ws");
const cors = require("cors");
const dotenv = require("dotenv");
const winston = require("winston");
const path = require("path");
const fs = require("fs");

// Load environment variables
dotenv.config();

// Ensure logs directory exists
const LOGS_DIR = path.join(__dirname, "..", "logs");
fs.mkdirSync(LOGS_DIR, { recursive: true });

// Initialize logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    new winston.transports.File({
      filename: path.join(LOGS_DIR, "dreamchamber.log"),
    }),
  ],
});

// Import routers
const apiRouter          = require('./routes/api');
const healthRouter       = require('./routes/health');
const gabrielRouter      = require('./routes/gabriel');
const gabrielV3Router    = require('./routes/gabriel-v3');
const voiceRouter        = require('./routes/voice');
const voiceV2Module      = require('./routes/voice-v2');       // ← v2 pipeline
const gabrielV4Module    = require('./routes/gabriel-v4');     // ← 9-agent crew

// Import WebSocket handler
const { handleWebSocket } = require("./websocket/handler");

// Import state manager
const StateManager = require("./core/StateManager");

// Import Heaven bridge
const HeavenClient = require("./core/HeavenClient");

// Import Gabriel orchestrator
const Gabriel = require("./core/Gabriel");
const AnthropicProvider = require("./providers/AnthropicProvider");

// Initialize Express
const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

// Initialize state manager
const stateManager = new StateManager();

// Initialize Heaven bridge
const heaven = new HeavenClient();
if (heaven.enabled) {
  heaven.health().then((h) => {
    if (h)
      logger.info("Heaven kernel connected", {
        status: h.status,
        version: h.version,
      });
    else logger.warn("Heaven kernel unreachable");
  });
}

// Initialize Gabriel — AI orchestration layer
const anthropicKey = process.env.ANTHROPIC_API_KEY;
const anthropicProvider = anthropicKey ? new AnthropicProvider(anthropicKey) : null;
if (!anthropicKey) {
  logger.warn(
    "GABRIEL: ANTHROPIC_API_KEY not set — speak() will be unavailable. Set it in dreamchamber/.env",
  );
}
const gabriel = new Gabriel({
  provider: anthropicProvider,
  heavenClient: heaven,
});
gabriel
  .status()
  .then((s) => {
    logger.info("GABRIEL online", {
      kernelOnline: s.kernelOnline,
      voice: s.voice.voice,
      providerReady: s.providerReady,
    });
  })
  .catch((err) => logger.warn("GABRIEL init check failed:", err.message));

// ─── Optional DC API key auth (set DC_API_KEY in .env to enforce) ────────────
const DC_API_KEY = process.env.DC_API_KEY || null;
function dcAuth(req, res, next) {
  if (!DC_API_KEY) return next(); // No key set = open (dev mode)
  const provided = req.headers["x-dc-key"] || req.headers["authorization"]?.replace("Bearer ", "");
  if (provided !== DC_API_KEY) {
    return res.status(401).json({ error: "Unauthorized — provide X-DC-Key header" });
  }
  next();
}

// ─── Simple in-memory rate limiter ───────────────────────────────────────────
const _rateBuckets = new Map();
function rateLimitMiddleware(limit = 60, windowMs = 60000) {
  return (req, res, next) => {
    const ip = req.ip || "unknown";
    const now = Date.now();
    let bucket = _rateBuckets.get(ip);
    if (!bucket || now - bucket.ts > windowMs) {
      bucket = { ts: now, count: 0 };
      _rateBuckets.set(ip, bucket);
    }
    bucket.count++;
    if (bucket.count > limit) {
      return res.status(429).json({
        error: "Rate limit exceeded",
        retry_after: Math.ceil((windowMs - (now - bucket.ts)) / 1000),
      });
    }
    next();
  };
}

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:7777",
      "http://localhost:9090",
      "http://GOD.local:7777",
      "http://GOD.local:9090",
      "http://10.90.90.10:7777",
      "http://10.90.90.10:9090",
      "http://10.90.90.40:7777",  // DaFixer
      "https://heaven.rsp-5f3.workers.dev",
      "https://noizy.ai",
    ],
    credentials: true,
  }),
);
app.use(express.json({ limit: "50mb" }));
app.use(express.static(path.join(__dirname, "../public")));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  next();
});

// Make state manager + heaven client + gabriel available to routes
app.use((req, res, next) => {
  req.stateManager = stateManager;
  req.heaven = heaven;
  req.gabriel = gabriel;
  next();
});

// Routes — rate-limited; sensitive routes also require DC_API_KEY if set
app.use('/api',              rateLimitMiddleware(120, 60000), dcAuth, apiRouter);
app.use('/api/gabriel/v4',   rateLimitMiddleware(20,  60000), dcAuth, gabrielV4Module.router);  // ← 9-agent
app.use('/api/gabriel/v3',   rateLimitMiddleware(20,  60000), dcAuth, gabrielV3Router);
app.use('/api/gabriel',      rateLimitMiddleware(30,  60000), dcAuth, gabrielRouter);
app.use('/api/voice/v2',     rateLimitMiddleware(30,  60000), dcAuth, voiceV2Module.router);    // ← full pipeline
app.use('/api/voice',        rateLimitMiddleware(30,  60000), dcAuth, voiceRouter);
app.use('/health',           healthRouter);
logger.info('GABRIEL V4 routes mounted → /api/gabriel/v4/{crew,health,speak,mission,missions,agent/:key}');
logger.info('Voice V2 routes mounted  → /api/voice/v2/{transcribe,speak,pipeline,audiohijack,status,log}');

// Inject wss into v2 modules so they can push live events
voiceV2Module.setWss(wss);
gabrielV4Module.setWss(wss);

// WebSocket connections
wss.on('connection', (ws, req) => {
  // WS auth: check X-DC-Key header or ?key= query param
  if (DC_API_KEY) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const provided = req.headers['x-dc-key'] || url.searchParams.get('key');
    if (provided !== DC_API_KEY) {
      ws.send(JSON.stringify({ type: 'error', error: 'Unauthorized' }));
      ws.close(4401, 'Unauthorized');
      return;
    }
  }

  const clientId = req.headers['x-client-id'] || 'anonymous';
  logger.info('WebSocket connection established', { clientId });

  // Welcome message with crew manifest
  ws.send(JSON.stringify({
    type: 'server:hello',
    version:  'DreamChamber v2 — NOIZYBEAST',
    gabriel:  'v4',
    voice:    'v2',
    crew:     ['GABRIEL','CB01','LUCY','DREAM','SHIRLEY','ENGR_KEITH','FAMILY','HEAVEN'],
    ts:       Date.now(),
  }));

  handleWebSocket(ws, clientId, stateManager, heaven);

  ws.on('close', () => {
    logger.info('WebSocket connection closed', { clientId });
  });
});

// Error handling
app.use((err, req, res, next) => {
  logger.error("Unhandled error", { error: err.message, stack: err.stack });
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Start server
const PORT = process.env.PORT || 7777;
server.listen(PORT, "0.0.0.0", () => {
  logger.info(`DreamChamber server running on port ${PORT}`);
  logger.info(`Access at: http://localhost:${PORT}`);
  logger.info(`Network access: http://GOD.local:${PORT}`);
});
