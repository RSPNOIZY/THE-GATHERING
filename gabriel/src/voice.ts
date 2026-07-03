// GABRIEL · voice output bridge
// Posts text to the local NOIZY voice-service (:9799) so GABRIEL's replies are
// spoken aloud in Jamie Premium en-GB on GOD.local.
//
// Service: ops/voice-service/server.js (bind 127.0.0.1)
// Persona registry: DEVICES.md §5
//
// Fire-and-forget: errors are logged but never thrown — voice is a nice-to-have,
// not a correctness requirement, so a broken speaker never breaks a reply.

import { env } from "node:process";

const HOST = env.NOIZY_VOICE_HOST || "127.0.0.1";
const PORT = Number(env.NOIZY_VOICE_PORT || 9799);
const AUTH = env.NOIZY_API_KEY || "";
const ENABLED = env.GABRIEL_VOICE !== "off";

export type VoiceAgent =
  | "gabriel"
  | "lucy"
  | "pops"
  | "shirl"
  | "shirley"
  | "dream"
  | "engr_keith"
  | "cb01";

/**
 * Speak `text` via the NOIZY voice-service. Defaults to GABRIEL (Jamie).
 * Returns quickly — does not wait for the audio to finish. Never throws.
 */
export async function speak(text: string, agent: VoiceAgent = "gabriel"): Promise<void> {
  if (!ENABLED || !text) return;
  // Cap extremely long replies so Jamie doesn't monologue.
  const payload = text.length > 3500 ? text.slice(0, 3500) + "..." : text;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (AUTH) headers["Authorization"] = `Bearer ${AUTH}`;
  try {
    await fetch(`http://${HOST}:${PORT}/speak`, {
      method: "POST",
      headers,
      body: JSON.stringify({ agent, text: payload }),
    });
  } catch (err) {
    // Voice service offline → silently skip. Log to stderr only in debug mode.
    if (env.GABRIEL_VOICE_DEBUG) {
      console.error(`[gabriel/voice] speak failed: ${(err as Error).message}`);
    }
  }
}

/** Strip markdown/code fences so TTS doesn't say "asterisk asterisk". */
export function prepareForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " [code block] ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^#+\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}
