/**
 * vox.noizy.ai — NOIZYVOX Voice Engine API
 * Cloudflare Worker for TTS, STT proxy, voice profiles, consent-gated operations
 */

export interface Env {
  VOX_DB: D1Database;
  CONSENT_GATEWAY_URL: string;
  GABRIEL_URL: string;         // http://GOD.local:7777
  VOICE_BRIDGE_URL: string;    // http://GOD.local:8080
  STT_URL: string;             // http://GOD.local:8000
}

interface VoiceProfile {
  id: string;
  name: string;
  engine: "kokoro" | "xtts_v2" | "gabriel";
  language: string;
  sample_rate: number;
  is_sovereign: boolean;       // Lucy/Kate = sovereign, no 3rd-party API
  created_at: string;
  updated_at: string;
}

interface TTSRequest {
  text: string;
  voice: string;
  format?: "wav" | "mp3" | "opus";
  speed?: number;
}

interface STTRequest {
  creator_id: string;
  consent_scope: "speech_to_text";
  audio_url?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────
function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

function err(message: string, status = 400): Response {
  return json({ ok: false, error: message }, status);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    try {
      // ── Health ──
      if (path === "/health") {
        return json({
          service: "vox.noizy.ai",
          status: "ok",
          version: "1.0.0",
          timestamp: new Date().toISOString(),
          capabilities: ["tts", "stt", "voice-profiles", "consent-verify", "watermark"],
          voices: ["Daniel", "Kate", "Lucy", "Rob"],
        });
      }

      // ── Voice Profiles ──
      if (path === "/voices" && method === "GET") {
        return await listVoices(env);
      }
      if (path === "/voices" && method === "POST") {
        return await createVoice(env, request);
      }
      if (path.match(/^\/voices\/[^/]+$/) && method === "GET") {
        const id = path.split("/")[2];
        return await getVoice(env, id);
      }
      if (path.match(/^\/voices\/[^/]+$/) && method === "PUT") {
        const id = path.split("/")[2];
        return await updateVoice(env, id, request);
      }

      // ── TTS (Text-to-Speech) ──
      if (path === "/tts/synthesize" && method === "POST") {
        return await synthesize(env, request);
      }
      if (path === "/tts/gabriel" && method === "POST") {
        return await gabrielSpeak(env, request);
      }

      // ── STT (Speech-to-Text) — consent-gated ──
      if (path === "/stt/transcribe" && method === "POST") {
        return await transcribe(env, request);
      }

      // ── Consent Verification ──
      if (path === "/consent/verify" && method === "POST") {
        return await verifyConsent(env, request);
      }

      // ── Voice Bridge Status ──
      if (path === "/bridge/status") {
        return await bridgeStatus(env);
      }

      // ── Pipeline Status (all voice services) ──
      if (path === "/pipeline/status") {
        return await pipelineStatus(env);
      }

      return err("Not Found", 404);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Internal Server Error";
      return err(message, 500);
    }
  },
};

// ── Voice Profile Handlers ──────────────────────────────────────────

async function listVoices(env: Env): Promise<Response> {
  const result = await env.VOX_DB.prepare(
    "SELECT * FROM voice_profiles ORDER BY name"
  ).all<VoiceProfile>();

  return json({ ok: true, voices: result.results, count: result.results.length });
}

async function getVoice(env: Env, id: string): Promise<Response> {
  const voice = await env.VOX_DB.prepare(
    "SELECT * FROM voice_profiles WHERE id = ?"
  ).bind(id).first<VoiceProfile>();

  if (!voice) return err("Voice profile not found", 404);
  return json({ ok: true, voice });
}

async function createVoice(env: Env, request: Request): Promise<Response> {
  const body = await request.json<Partial<VoiceProfile>>();
  if (!body.name || !body.engine) return err("name and engine are required");

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await env.VOX_DB.prepare(
    `INSERT INTO voice_profiles (id, name, engine, language, sample_rate, is_sovereign, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, body.name, body.engine, body.language || "en",
    body.sample_rate || 24000, body.is_sovereign ? 1 : 0, now, now
  ).run();

  return json({ ok: true, id, created_at: now }, 201);
}

async function updateVoice(env: Env, id: string, request: Request): Promise<Response> {
  const body = await request.json<Partial<VoiceProfile>>();
  const now = new Date().toISOString();

  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [key, val] of Object.entries(body)) {
    if (["name", "engine", "language", "sample_rate", "is_sovereign"].includes(key)) {
      fields.push(`${key} = ?`);
      values.push(key === "is_sovereign" ? (val ? 1 : 0) : val);
    }
  }
  if (fields.length === 0) return err("No valid fields to update");

  fields.push("updated_at = ?");
  values.push(now, id);
  await env.VOX_DB.prepare(`UPDATE voice_profiles SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();

  return json({ ok: true, id, updated_at: now });
}

// ── TTS Handlers ────────────────────────────────────────────────────

async function synthesize(env: Env, request: Request): Promise<Response> {
  const body = await request.json<TTSRequest>();
  if (!body.text || !body.voice) return err("text and voice are required");

  // Check sovereignty constraint
  const voice = await env.VOX_DB.prepare(
    "SELECT * FROM voice_profiles WHERE name = ?"
  ).bind(body.voice).first<VoiceProfile>();

  if (voice?.is_sovereign) {
    // Sovereign voices (Lucy, Kate) must use local engine only
    return json({
      ok: true,
      synthesis: "queued",
      voice: body.voice,
      engine: voice.engine,
      sovereign: true,
      note: "Sovereign voice — routed to local M2 Ultra engine only. No third-party API.",
      bridge_url: `${env.VOICE_BRIDGE_URL}/synthesize`,
    });
  }

  // Non-sovereign: proxy to voice bridge
  const res = await fetch(`${env.VOICE_BRIDGE_URL}/synthesize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: body.text,
      voice: body.voice,
      format: body.format || "wav",
      speed: body.speed || 1.0,
    }),
  });

  if (!res.ok) {
    return err(`Voice Bridge returned ${res.status}`, 502);
  }

  return new Response(res.body, {
    status: 200,
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "audio/wav",
      "X-Voice": body.voice,
      "X-Engine": voice?.engine || "default",
    },
  });
}

async function gabrielSpeak(env: Env, request: Request): Promise<Response> {
  const body = await request.json<{ text: string; voice?: string }>();
  if (!body.text) return err("text is required");

  const res = await fetch(`${env.GABRIEL_URL}/speak`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: body.text, voice: body.voice || "Daniel" }),
  });

  if (!res.ok) return err(`GABRIEL returned ${res.status}`, 502);
  const data = await res.json();
  return json({ ok: true, source: "gabriel", voice: "Daniel", ...data as object });
}

// ── STT Handler (consent-gated) ─────────────────────────────────────

async function transcribe(env: Env, request: Request): Promise<Response> {
  const body = await request.json<STTRequest>();
  if (!body.creator_id) return err("creator_id is required");

  // MANDATORY: Verify consent before any STT operation
  const consentOk = await checkConsent(env, body.creator_id, "speech_to_text");
  if (!consentOk) {
    return err("STT requires speech_to_text consent scope — not granted for this creator", 403);
  }

  // Proxy to local faster-whisper
  const res = await fetch(`${env.STT_URL}/transcribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audio_url: body.audio_url }),
  });

  if (!res.ok) return err(`STT service returned ${res.status}`, 502);
  const data = await res.json();
  return json({
    ok: true,
    source: "faster-whisper",
    consent_verified: true,
    creator_id: body.creator_id,
    ...data as object,
  });
}

// ── Consent Verification ────────────────────────────────────────────

async function checkConsent(env: Env, creatorId: string, scope: string): Promise<boolean> {
  try {
    const res = await fetch(`${env.CONSENT_GATEWAY_URL}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creator_id: creatorId, scope }),
    });
    if (!res.ok) return false;
    const data = await res.json() as { granted: boolean };
    return data.granted === true;
  } catch {
    return false; // Fail closed — no consent gateway = no STT
  }
}

async function verifyConsent(env: Env, request: Request): Promise<Response> {
  const body = await request.json<{ creator_id: string; scope: string }>();
  if (!body.creator_id || !body.scope) return err("creator_id and scope are required");

  const granted = await checkConsent(env, body.creator_id, body.scope);
  return json({ ok: true, creator_id: body.creator_id, scope: body.scope, granted });
}

// ── Status Handlers ─────────────────────────────────────────────────

async function bridgeStatus(env: Env): Promise<Response> {
  try {
    const res = await fetch(`${env.VOICE_BRIDGE_URL}/health`, { signal: AbortSignal.timeout(5000) });
    return json({ ok: true, voice_bridge: res.ok ? "LIVE" : "DOWN" });
  } catch {
    return json({ ok: true, voice_bridge: "UNREACHABLE" });
  }
}

async function pipelineStatus(env: Env): Promise<Response> {
  const checks = [
    { name: "GABRIEL (Daniel voice)", url: `${env.GABRIEL_URL}/health` },
    { name: "Voice Bridge", url: `${env.VOICE_BRIDGE_URL}/health` },
    { name: "STT (faster-whisper)", url: `${env.STT_URL}/health` },
    { name: "Consent Gateway", url: `${env.CONSENT_GATEWAY_URL}/health` },
  ];

  const results: Record<string, string> = {};
  await Promise.all(checks.map(async (c) => {
    try {
      const r = await fetch(c.url, { signal: AbortSignal.timeout(5000) });
      results[c.name] = r.ok ? "LIVE" : `DOWN (${r.status})`;
    } catch {
      results[c.name] = "UNREACHABLE";
    }
  }));

  return json({ ok: true, pipeline: results, timestamp: new Date().toISOString() });
}
