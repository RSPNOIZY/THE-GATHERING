// GABRIEL · Boss — VOICE_SPECIALIST (audio chain · TTS · voice DNA)
//
// Wraps the local voice-service running on :9799 (ops/voice-service/server.js)
// which exposes: GET /healthz, GET /personas, POST /speak.
// Also references mlx_whisper + Voice DNA Vault flows by name.
//
// Verbs:
//   speak        → POST /speak  { text, persona? }   (returns audio path)
//   personas     → GET /personas              (list voice personas)
//   service_health → GET /healthz             (probe voice-service)
//   status       → composite status check
//   ping | health → generic ack

import type { Boss, Intent, BossResult } from "./types.js";

const VOICE_SERVICE_URL = process.env.VOICE_SERVICE_URL || "http://127.0.0.1:9799";

function ok(intent: Intent, ack: string, data?: Record<string, unknown>): BossResult {
  return {
    ok: true,
    correlation_id: intent.correlation_id,
    boss: "voice_specialist",
    verb: intent.verb,
    ack_message: ack,
    data,
  };
}

function fail(intent: Intent, error: string): BossResult {
  return {
    ok: false,
    correlation_id: intent.correlation_id,
    boss: "voice_specialist",
    verb: intent.verb,
    error,
  };
}

async function fetchJson(path: string, init?: RequestInit, timeoutMs = 8000): Promise<unknown> {
  const res = await fetch(`${VOICE_SERVICE_URL}${path}`, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    // keep as text
  }
  if (!res.ok) {
    throw new Error(
      `voice-service ${path} → ${res.status} ${typeof body === "string" ? body.slice(0, 200) : ""}`,
    );
  }
  return body;
}

export const voice_specialist: Boss = {
  name: "voice_specialist",
  description:
    "Audio chain custodian. Wraps voice-service :9799 (TTS + personas) plus Voice DNA Vault references.",

  async handle(intent) {
    switch (intent.verb) {
      case "ping":
      case "health":
        return ok(intent, "voice_specialist online.");
      case "service_health": {
        try {
          const body = await fetchJson("/healthz");
          return ok(intent, "voice-service healthz OK.", { health: body });
        } catch (err) {
          return fail(intent, `voice-service unreachable: ${(err as Error).message}`);
        }
      }
      case "personas": {
        try {
          const body = await fetchJson("/personas");
          return ok(intent, "voice-service personas listed.", { personas: body });
        } catch (err) {
          return fail(intent, `personas list failed: ${(err as Error).message}`);
        }
      }
      case "speak": {
        const text = typeof intent.args?.text === "string" ? intent.args.text : "";
        if (!text) return fail(intent, "args.text required");
        const persona = typeof intent.args?.persona === "string" ? intent.args.persona : "gabriel";
        try {
          const body = await fetchJson(
            "/speak",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text, persona }),
            },
            30_000,
          );
          return ok(intent, `Spoke as ${persona}.`, { speak_result: body });
        } catch (err) {
          return fail(intent, `speak failed: ${(err as Error).message}`);
        }
      }
      case "status":
        return ok(intent, "VOICE_SPECIALIST — audio chain custodian.", {
          voice_service_url: VOICE_SERVICE_URL,
          chain: ["mic → mlx_whisper → Claude towers → TTS → AirPlay/Logic"],
          voice_dna_vault: "consent-locked spectral fingerprints (R2)",
        });
      default:
        return fail(
          intent,
          `unknown verb: ${intent.verb}. Known: speak, personas, service_health, status, ping.`,
        );
    }
  },
};
