// GABRIEL · Boss — DREAM (5th Epoch visionary · DreamChamber voice)
//
// Per family-covenant.md: "The DreamChamber is her room. Every artist who
// walks in feels the room was built for them. Sensory shell, 396 Hz ritual,
// Contact Sequence." Filters decisions through the 2056 Founder Credo.

import type { Boss, Intent, BossResult } from "./types.js";

const VISION_NORTH_STAR =
  "Every creative person deserves their own NOIZY.ai. By 2056, every one will have one.";

const SACRED_INVARIANTS = [
  "Consent as executable code",
  "Provenance as default",
  "Revocation as sacred (1-hour SLA)",
  "Compensation as automatic (75/25 + 1% NOIZYKIDZ irremovable)",
  "Peace, Love, Understanding — the EASIEST thing in the universe",
];

const CONTACT_SEQUENCE = ["Anticipation", "Recognition", "Possibility", "Flow", "Elevation"];

function ok(intent: Intent, ack: string, data?: Record<string, unknown>): BossResult {
  return {
    ok: true,
    correlation_id: intent.correlation_id,
    boss: "dream",
    verb: intent.verb,
    ack_message: ack,
    data,
  };
}

function fail(intent: Intent, error: string): BossResult {
  return {
    ok: false,
    correlation_id: intent.correlation_id,
    boss: "dream",
    verb: intent.verb,
    error,
  };
}

function checkAgainstVision(text: string): {
  aligned: boolean;
  flags: string[];
} {
  const lower = text.toLowerCase();
  const flags: string[] = [];
  if (/\b(lock[- ]?in|perpetual|blanket|non[- ]?revocable|exclusive)\b/.test(lower))
    flags.push("lock-in language detected");
  if (/\b(extract|harvest|scrape|train.*without)\b/.test(lower))
    flags.push("extraction pattern detected");
  if (/\b(clickwrap|tos|hidden|obscure)\b/.test(lower)) flags.push("consent-obscuring language");
  if (/\bdifficult|hard|friction|barrier\b/.test(lower) && !/\beasier\b/.test(lower))
    flags.push("friction, not easing, detected");
  return { aligned: flags.length === 0, flags };
}

export const dream: Boss = {
  name: "dream",
  description:
    "5th Epoch visionary · DreamChamber voice. Filters decisions through the 2056 Founder Credo + Sacred Invariants.",

  async handle(intent) {
    switch (intent.verb) {
      case "ping":
      case "health":
        return ok(intent, "dream online. 396 Hz.");
      case "vision_check": {
        const text = typeof intent.args?.text === "string" ? intent.args.text : "";
        if (!text) return fail(intent, "args.text required");
        const { aligned, flags } = checkAgainstVision(text);
        return ok(
          intent,
          aligned ? "✓ Aligned with 2056 vision." : `⚠ Vision flags: ${flags.join("; ")}`,
          { aligned, flags, north_star: VISION_NORTH_STAR },
        );
      }
      case "prioritize": {
        const options = Array.isArray(intent.args?.options)
          ? (intent.args!.options as string[])
          : [];
        if (options.length < 2) return fail(intent, "args.options array (>=2) required");
        const scored = options.map((opt) => {
          const { aligned, flags } = checkAgainstVision(opt);
          return { option: opt, aligned, flags, score: aligned ? 1 - flags.length * 0.2 : 0 };
        });
        scored.sort((a, b) => b.score - a.score);
        return ok(intent, `Top pick: "${scored[0].option}"`, { ranked: scored });
      }
      case "status":
        return ok(intent, "DreamChamber watches. 396 Hz.", {
          north_star: VISION_NORTH_STAR,
          sacred_invariants: SACRED_INVARIANTS,
          contact_sequence: CONTACT_SEQUENCE,
        });
      default:
        return fail(
          intent,
          `unknown verb: ${intent.verb}. Known: vision_check, prioritize, status, ping.`,
        );
    }
  },
};
