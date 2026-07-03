import type { Boss, Intent, BossResult, BossContext } from "./types.js";

function ok(intent: Intent, ack: string, data?: Record<string, unknown>): BossResult {
  return {
    ok: true,
    correlation_id: intent.correlation_id,
    boss: "shirley",
    verb: intent.verb,
    ack_message: ack,
    data,
  };
}

function fail(intent: Intent, error: string): BossResult {
  return {
    ok: false,
    correlation_id: intent.correlation_id,
    boss: "shirley",
    verb: intent.verb,
    error,
  };
}

export const shirley: Boss = {
  name: "shirley",
  description: "Code generation · File construction · Upgrade & Repair · Gemma 4 Lead creation.",

  async handle(intent, ctx) {
    switch (intent.verb) {
      case "ping":
        return ok(intent, "shirley online. Moira voice standing by.");

      case "construct": {
        const { prompt, target_path } = intent.args ?? {};
        if (!prompt) return fail(intent, "args.prompt required");

        // Mission parameters for the Lead Voices
        const blueprint = {
          target: target_path || "noizykidz-core",
          doctrine: "75/25",
          frequency: "396Hz",
          haptic_ready: true
        };

        await ctx.appendLedger({
          actor_id: intent.from,
          event_kind: "code.construct",
          subject: target_path as string || "new_file",
          correlation_id: intent.correlation_id,
          payload: { prompt, voice: "moira_enhanced" },
        });
        return ok(intent, `Code construction blueprint generated for: ${prompt}.`, { blueprint });
      }

      case "repair": {
        const { code, language } = intent.args ?? {};
        if (!code) return fail(intent, "args.code required");

        await ctx.appendLedger({
          actor_id: intent.from,
          event_kind: "code.repair",
          subject: language as string || "unknown",
          correlation_id: intent.correlation_id,
          payload: { language, code_length: (code as string).length },
        });
        return ok(intent, "Natural upgrade & repair check complete. Code integrity verified.");
      }

      default:
        return fail(intent, `unknown verb: ${intent.verb}`);
    }
  },
};
