#!/usr/bin/env node
/**
 * NOIZY Universal Bot — Discord + Slack in one process.
 *
 * - Voice messages → base64 → JSON-RPC 2.0 POST to MCP /voice (tools/call: voice-ingest)
 * - 6 slash commands on both platforms: status · gospel · consent · brands · never · plowman
 * - Graceful degradation: skip Discord if token missing, skip Slack if tokens missing
 * - In-memory NCP ring buffer (last 1000 events) — queryable via GET /ncp
 * - Health endpoint: GET /health
 *
 * Start:  node --env-file=.env bot.js   (Node ≥ 20.6)
 */

import {
  Client,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
  SlashCommandBuilder,
  Events,
} from "discord.js";
import bolt from "@slack/bolt";
import http from "node:http";
import crypto from "node:crypto";

const { App: SlackApp } = bolt;

// ── Env / config ──────────────────────────────────────────────────────────────
const ENV = process.env;
const HAS_DISCORD = !!(ENV.DISCORD_BOT_TOKEN && ENV.DISCORD_APPLICATION_ID);
const HAS_SLACK = !!(
  ENV.SLACK_BOT_TOKEN &&
  ENV.SLACK_SIGNING_SECRET &&
  ENV.SLACK_APP_TOKEN
);
const MCP_VOICE_URL = ENV.MCP_VOICE_URL || "https://mcp.noizy.ai/voice";
const NOIZY_API_KEY = ENV.NOIZY_API_KEY || "";
const HEALTH_PORT = parseInt(ENV.HEALTH_PORT || "8088", 10);

// ── NCP ring buffer ───────────────────────────────────────────────────────────
const NCP_MAX = 1000;
const ncp = [];
function logEvent(level, type, payload = {}) {
  const event = { ts: new Date().toISOString(), level, type, ...payload };
  ncp.push(event);
  if (ncp.length > NCP_MAX) ncp.splice(0, ncp.length - NCP_MAX);
  // structured stdout for production log collectors
  console.log(JSON.stringify(event));
  return event;
}

// ── Audio detection ───────────────────────────────────────────────────────────
const AUDIO_EXTS = [
  ".ogg",
  ".webm",
  ".m4a",
  ".wav",
  ".mp4",
  ".mp3",
  ".aac",
  ".flac",
];
const AUDIO_MIME_RE = /^audio\/|^video\/(mp4|webm)$/;

function isAudioByName(name) {
  const lower = (name || "").toLowerCase();
  return AUDIO_EXTS.some((ext) => lower.endsWith(ext));
}
function isAudioByMime(mime) {
  return AUDIO_MIME_RE.test((mime || "").toLowerCase());
}

// ── Doctrine content (slash command bodies) ───────────────────────────────────
const PORTALS = [
  "NOIZYVOX",
  "NOIZYFISH",
  "NOIZYKIDZ",
  "NOIZYLAB",
  "WISDOM",
  "myFAMILY",
];

const NEVER_CLAUSES = [
  "NO_SYNTH_WITHOUT_CONSENT — no voice synthesis without an active consent token for the actor + use_type",
  "NO_TRAINING_WITHOUT_CONSENT — no model training on creator data without explicit, scoped consent",
  "NO_IDENTITY_IMPERSONATION — no synth output that misleads as to who is speaking",
  "NO_SUBLICENSING_WITHOUT_ACTOR — no third-party use of consent tokens without the actor in the loop",
  "NO_BYPASS_KILL_SWITCH — Kill Switch is absolute; no actor or process can override it",
  "NO_HIDDEN_PROVENANCE — every synth output carries C2PA content credentials",
  "NO_MINOR_VOICE_SYNTHESIS — under-18 voices are not synthesizable, period",
];

const GOSPEL_PRINCIPLES = [
  "Consent is executable code — every synthesis checked against live consent before it happens",
  "Provenance is the default — C2PA content credentials on every synth output",
  "Revocation is sacred — Kill Switch is instant, no approval required, propagation < 1h SLA",
  "Compensation is automatic — 75% creator floor, never lower, routed at the moment of revenue",
  "1% of all royalties flow to NOIZYKIDZ — the GORUNFREE Trust Clause is irremovable",
  "The ledger is append-only — history is preserved; no UPDATE, no DELETE, ever",
  "Identity is sovereign — RSP_001 retains constitutional authority; founders own their voice",
  "Voice is a 100-year asset — OAIS/PREMIS archival from day one, post-quantum-ready",
  "Auditability over ambiguity — every action attributable to actor + agent + time + route",
  "Infrastructure over extraction — scaling does not extract from creators; zero-egress R2",
  "Doctrine grows, never shrinks — Never Clauses can only be added, not removed",
  "The fusion is the product — human ingenuity + AI partnership, not service-and-customer",
];

function plowmanBar() {
  // 40-cell bar, 75/25 split
  const total = 40;
  const creatorCells = Math.round(total * 0.75); // 30
  const platformCells = total - creatorCells; // 10
  return [
    "PLOWMAN STANDARD — 75/25 royalty split",
    "",
    `CREATOR  ${"█".repeat(creatorCells)}${"░".repeat(platformCells)} 75%`,
    `PLATFORM ${"░".repeat(creatorCells)}${"█".repeat(platformCells)} 25%`,
    "",
    "OF the 75% creator share, 1% routes automatically to the NOIZYKIDZ Trust Clause.",
    "OF the 25% platform share, the empire's operating costs come out — no equity skim.",
    "",
    "The 75% floor is constitutional — NEVER overrideable, even by RSP_001.",
    "Founding-actor floor (RSP_001 only): 85%. Standard creator floor: 75%.",
  ].join("\n");
}

// ── Slash command handlers (return string, never throw) ───────────────────────
function cmdStatus() {
  const up = process.uptime();
  const m = Math.floor(up / 60);
  const s = Math.floor(up % 60);
  const last = ncp[ncp.length - 1];
  return [
    "NOIZY universal bot — status",
    `uptime:        ${m}m ${s}s`,
    `discord:       ${HAS_DISCORD ? "connected" : "disabled (no token)"}`,
    `slack:         ${HAS_SLACK ? "connected" : "disabled (no token)"}`,
    `mcp_voice_url: ${MCP_VOICE_URL}`,
    `noizy_api_key: ${NOIZY_API_KEY ? "set" : "MISSING"}`,
    `ncp_events:    ${ncp.length} / ${NCP_MAX}`,
    `last_event:    ${last ? `${last.ts} · ${last.type}` : "none"}`,
  ].join("\n");
}

function cmdGospel() {
  return [
    "NOIZY Gospel — 12 Principles",
    "",
    ...GOSPEL_PRINCIPLES.map(
      (p, i) => `${String(i + 1).padStart(2, " ")}. ${p}`,
    ),
  ].join("\n");
}

function cmdConsent() {
  return [
    "CONSENT — how it works in NOIZY",
    "",
    "Grant:    POST  /api/v1/consent-tokens",
    "Check:    GET   /api/v1/consent-tokens/:id",
    "Revoke:   POST  /api/v1/consent-tokens/:id/revoke",
    "",
    "Every consent token carries: scope, territory, expiry, royalty split, signed by actor.",
    "Revocation propagates within 1h SLA per Article V (Revocation Real).",
    "Append-only audit — every grant + revoke preserved for legal-grade audit.",
    "Kill Switch (RSP_001 only): revokes ALL active tokens for an actor in one call.",
  ].join("\n");
}

// Command mappings
const COMMANDS = {
  status: {
    description: "NOIZY bot status + connection state",
    handler: cmdStatus,
  },
  gospel: {
    description: "12 principles of the NOIZY Gospel",
    handler: cmdGospel,
  },
  consent: {
    description: "How consent works in NOIZY (grant / check / revoke)",
    handler: cmdConsent,
  },
  brands: {
    description: "The 6 brand directories of the empire",
    handler: () => [
      "NOIZY Empire — 6 brand directories",
      "",
      ...PORTALS.map((p, i) => `${i + 1}. ${p}`),
    ].join("\n"),
  },
  never: {
    description: "7 Never Clauses — immovable doctrine",
    handler: () => [
      "Never Clauses — 7 immovable prohibitions",
      "",
      ...NEVER_CLAUSES.map((c, i) => `${i + 1}. ${c}`),
      "",
      "These cannot be overridden by any actor, including RSP_001. Doctrine grows, never shrinks.",
    ].join("\n"),
  },
  plowman: {
    description: "75/25 royalty split visualization",
    handler: plowmanBar,
  },
};

// ── Voice ingest — POST audio to MCP as JSON-RPC 2.0 ──────────────────────────
async function ingestVoice({
  audioBuffer,
  source,
  user,
  channel,
  format,
  filename,
}) {
  const audio_base64 = audioBuffer.toString("base64");
  const id = crypto.randomUUID();
  const body = {
    jsonrpc: "2.0",
    id,
    method: "tools/call",
    params: {
      name: "voice-ingest",
      arguments: {
        audio_base64,
        source,
        user,
        channel,
        format,
        filename,
        size_bytes: audioBuffer.length,
        ts: new Date().toISOString(),
      },
    },
  };
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (NOIZY_API_KEY) headers["Authorization"] = `Bearer ${NOIZY_API_KEY}`;

  logEvent("info", "voice.ingest.start", {
    source,
    user,
    channel,
    format,
    bytes: audioBuffer.length,
    request_id: id,
  });

  try {
    const res = await fetch(MCP_VOICE_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text };
    }
    if (!res.ok) {
      logEvent("error", "voice.ingest.fail", {
        source,
        user,
        request_id: id,
        status: res.status,
        body: parsed,
      });
      return {
        ok: false,
        status: res.status,
        error: parsed?.error?.message || `HTTP ${res.status}`,
      };
    }
    logEvent("info", "voice.ingest.ok", {
      source,
      user,
      request_id: id,
      status: res.status,
    });
    return { ok: true, status: res.status, result: parsed.result || parsed };
  } catch (e) {
    logEvent("error", "voice.ingest.error", {
      source,
      user,
      request_id: id,
      error: e.message,
    });
    return { ok: false, error: e.message };
  }
}

// ── Discord ───────────────────────────────────────────────────────────────────
function detectDiscordAudio(message) {
  for (const att of message.attachments.values()) {
    if (isAudioByMime(att.contentType) || isAudioByName(att.name)) return att;
  }
  return null;
}

async function startDiscord() {
  if (!HAS_DISCORD) {
    logEvent("info", "discord.skip", {
      reason: "missing DISCORD_BOT_TOKEN or DISCORD_APPLICATION_ID",
    });
    return null;
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel, Partials.Message],
  });

  const commandData = Object.entries(COMMANDS).map(([name, { description }]) =>
    new SlashCommandBuilder()
      .setName(name)
      .setDescription(description)
      .toJSON(),
  );

  client.once(Events.ClientReady, async (c) => {
    logEvent("info", "discord.ready", { tag: c.user.tag, id: c.user.id });
    try {
      const rest = new REST({ version: "10" }).setToken(ENV.DISCORD_BOT_TOKEN);
      const route = ENV.DISCORD_GUILD_ID
        ? Routes.applicationGuildCommands(
            ENV.DISCORD_APPLICATION_ID,
            ENV.DISCORD_GUILD_ID,
          )
        : Routes.applicationCommands(ENV.DISCORD_APPLICATION_ID);
      await rest.put(route, { body: commandData });
      logEvent("info", "discord.commands.registered", {
        count: commandData.length,
        scope: ENV.DISCORD_GUILD_ID ? "guild" : "global",
      });
    } catch (e) {
      logEvent("error", "discord.commands.fail", { error: e.message });
    }
  });

  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    const audio = detectDiscordAudio(message);
    if (!audio) return;
    try {
      await message.react("🎙️").catch(() => {});
      logEvent("info", "discord.audio.detected", {
        channel: message.channelId,
        user: message.author.id,
        name: audio.name,
        bytes: audio.size,
        contentType: audio.contentType,
      });
      const res = await fetch(audio.url);
      if (!res.ok) throw new Error(`audio fetch ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const ext = (audio.name || "").split(".").pop()?.toLowerCase() || "ogg";
      const out = await ingestVoice({
        audioBuffer: buf,
        source: "discord",
        user: message.author.id,
        channel: message.channelId,
        format: ext,
        filename: audio.name || `discord-${audio.id}.${ext}`,
      });
      const reply = out.ok
        ? `✅ ingested (${buf.length} B → MCP ${out.status})`
        : `❌ ingest failed: ${out.error}`;
      await message.reply(reply).catch(() => {});
    } catch (e) {
      logEvent("error", "discord.voice.handler", { error: e.message });
      await message.reply(`error: ${e.message}`).catch(() => {});
    }
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const cmd = COMMANDS[interaction.commandName];
    if (!cmd) return;
    try {
      const out = cmd.handler();
      const body = "```\n" + out.slice(0, 1900) + "\n```";
      await interaction.reply(body);
      logEvent("info", "discord.command", {
        name: interaction.commandName,
        user: interaction.user.id,
      });
    } catch (e) {
      logEvent("error", "discord.command.fail", {
        name: interaction.commandName,
        error: e.message,
      });
      await interaction
        .reply({ content: `error: ${e.message}`, ephemeral: true })
        .catch(() => {});
    }
  });

  client.on("error", (e) =>
    logEvent("error", "discord.client.error", { error: e.message }),
  );

  await client.login(ENV.DISCORD_BOT_TOKEN);
  return client;
}

// ── Slack ─────────────────────────────────────────────────────────────────────
async function startSlack() {
  if (!HAS_SLACK) {
    logEvent("info", "slack.skip", {
      reason:
        "missing SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, or SLACK_APP_TOKEN",
    });
    return null;
  }

  const app = new SlackApp({
    token: ENV.SLACK_BOT_TOKEN,
    signingSecret: ENV.SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: ENV.SLACK_APP_TOKEN,
  });

  app.event("file_shared", async ({ event, client }) => {
    try {
      const info = await client.files.info({ file: event.file_id });
      const file = info.file;
      if (!file) return;
      if (!isAudioByMime(file.mimetype) && !isAudioByName(file.name)) return;

      logEvent("info", "slack.audio.detected", {
        channel: event.channel_id,
        user: event.user_id,
        name: file.name,
        bytes: file.size,
        mimetype: file.mimetype,
      });

      const dlUrl = file.url_private_download || file.url_private;
      if (!dlUrl) throw new Error("no download URL on Slack file");
      const dlRes = await fetch(dlUrl, {
        headers: { Authorization: `Bearer ${ENV.SLACK_BOT_TOKEN}` },
      });
      if (!dlRes.ok) throw new Error(`audio fetch ${dlRes.status}`);
      const buf = Buffer.from(await dlRes.arrayBuffer());
      const ext = (file.name || "").split(".").pop()?.toLowerCase() || "ogg";

      const out = await ingestVoice({
        audioBuffer: buf,
        source: "slack",
        user: event.user_id,
        channel: event.channel_id,
        format: ext,
        filename: file.name || `slack-${file.id}.${ext}`,
      });

      const text = out.ok
        ? `✅ ingested (${buf.length} B → MCP ${out.status})`
        : `❌ ingest failed: ${out.error}`;
      if (event.channel_id) {
        await client.chat
          .postMessage({ channel: event.channel_id, text })
          .catch(() => {});
      }
    } catch (e) {
      logEvent("error", "slack.voice.handler", { error: e.message });
    }
  });

  for (const [name, { handler }] of Object.entries(COMMANDS)) {
    app.command(`/${name}`, async ({ ack, respond, command }) => {
      await ack();
      try {
        const out = handler();
        await respond({ text: "```\n" + out.slice(0, 2900) + "\n```" });
        logEvent("info", "slack.command", { name, user: command.user_id });
      } catch (e) {
        logEvent("error", "slack.command.fail", { name, error: e.message });
        await respond({ text: `error: ${e.message}` });
      }
    });
  }

  app.error(async (err) => {
    logEvent("error", "slack.app.error", { error: err.message });
  });

  await app.start();
  logEvent("info", "slack.ready", { socket_mode: true });
  return app;
}

// ── Health + NCP HTTP server ──────────────────────────────────────────────────
function startHealthServer() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    res.setHeader("Content-Type", "application/json");

    if (url.pathname === "/health") {
      res.writeHead(200);
      res.end(
          JSON.stringify({
            ok: true,
            uptime_s: Math.round(process.uptime()),
            discord: HAS_DISCORD ? "connected" : "disabled",
            slack: HAS_SLACK ? "connected" : "disabled",
            ncp_events: ncp.length,
            ts: new Date().toISOString(),
          }),
      );
      return;
    }

    if (url.pathname === "/ncp") {
      const limit = Math.min(
        parseInt(url.searchParams.get("limit") || "100", 10),
        NCP_MAX,
      );
      const filter = url.searchParams.get("type");
      let events = ncp.slice(-limit);
      if (filter)
        events = events.filter((e) => (e.type || "").startsWith(filter));
      res.writeHead(200);
      res.end(JSON.stringify({ count: events.length, events }));
      return;
    }

    res.writeHead(404);
    res.end(
      JSON.stringify({
        error: "not found",
        try: ["/health", "/ncp?limit&type"],
      }),
    );
  });

  server.listen(HEALTH_PORT, () => {
    logEvent("info", "health.listen", { port: HEALTH_PORT });
  });
  server.on("error", (e) =>
    logEvent("error", "health.error", { error: e.message }),
  );
  return server;
}

// ── Graceful shutdown ─────────────────────────────────────────────────────────
let shuttingDown = false;
async function shutdown(signal, discord, slack, server) {
  if (shuttingDown) return;
  shuttingDown = true;
  logEvent("info", "shutdown.start", { signal });
  const tasks = [];
  if (discord)
    tasks.push(
      discord
        .destroy()
        .catch((e) =>
          logEvent("error", "shutdown.discord", { error: e.message }),
        ),
    );
  if (slack)
    tasks.push(
      slack
        .stop()
        .catch((e) =>
          logEvent("error", "shutdown.slack", { error: e.message }),
        ),
    );
  if (server) tasks.push(new Promise((r) => server.close(() => r())));
  const timeout = new Promise((r) => setTimeout(r, 5000));
  await Promise.race([Promise.all(tasks), timeout]);
  logEvent("info", "shutdown.done", { signal });
  process.exit(0);
}

// ── Boot ──────────────────────────────────────────────────────────────────────
(async () => {
  logEvent("info", "boot.start", {
    has_discord: HAS_DISCORD,
    has_slack: HAS_SLACK,
    mcp_voice_url: MCP_VOICE_URL,
    health_port: HEALTH_PORT,
    api_key_set: !!NOIZY_API_KEY,
    node: process.version,
  });

  if (!HAS_DISCORD && !HAS_SLACK) {
    logEvent("warn", "boot.no_platforms", {
      hint: "set DISCORD_BOT_TOKEN+DISCORD_APPLICATION_ID and/or SLACK_BOT_TOKEN+SLACK_SIGNING_SECRET+SLACK_APP_TOKEN in .env",
    });
  }

  const server = startHealthServer();
  const [discord, slack] = await Promise.all([
    startDiscord().catch((e) => {
      logEvent("error", "discord.start.fail", { error: e.message });
      return null;
    }),
    startSlack().catch((e) => {
      logEvent("error", "slack.start.fail", { error: e.message });
      return null;
    }),
  ]);

  for (const sig of ["SIGINT", "SIGTERM"]) {
    process.on(sig, () => shutdown(sig, discord, slack, server));
  }
  process.on("unhandledRejection", (err) =>
    logEvent("error", "unhandled.rejection", { error: String(err) }),
  );
  process.on("uncaughtException", (err) =>
    logEvent("error", "uncaught.exception", {
      error: err.message,
      stack: err.stack,
    }),
  );

  logEvent("info", "boot.ready", {
    discord: !!discord,
    slack: !!slack,
    health: `http://localhost:${HEALTH_PORT}/health`,
  });
})().catch((err) => {
  logEvent("error", "boot.fatal", { error: err.message, stack: err.stack });
  process.exit(1);
});
