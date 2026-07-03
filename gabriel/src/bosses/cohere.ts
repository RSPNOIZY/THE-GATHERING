// GABRIEL · Boss — Cohere (AI integration)
//
// Communicates with Cohere APIs for multi-model reasoning or off-machine fallbacks.
// Uses COHERE_API_KEY from the environment.

import type { Boss, Intent, BossResult, BossContext } from "./types.js";

const NAME = "cohere" as const;
const COHERE_API_KEY = process.env.COHERE_API_KEY || "";

function ok(intent: Intent, ack: string, data?: Record<string, unknown>, ledger_id?: string): BossResult {
  return {
    ok: true,
    correlation_id: intent.correlation_id,
    boss: NAME,
    verb: intent.verb,
    ack_message: ack,
    data,
    ledger_id,
  };
}

function fail(intent: Intent, error: string, ledger_id?: string): BossResult {
  return {
    ok: false,
    correlation_id: intent.correlation_id,
    boss: NAME,
    verb: intent.verb,
    error,
    ledger_id,
  };
}

export const cohere: Boss = {
  name: NAME,
  description: "Cohere AI model integration layer.",

  async handle(intent, ctx: BossContext) {
    if (!COHERE_API_KEY) {
      return fail(intent, "COHERE_API_KEY is not configured in .env. Please add it to use Cohere.");
    }

    try {
      switch (intent.verb) {
        case "ping":
        case "health": {
          try {
            const res = await fetch("https://api.cohere.ai/v1/models", {
              headers: {
                "Authorization": `Bearer ${COHERE_API_KEY}`,
              },
              signal: AbortSignal.timeout(5000),
            });
            if (res.ok) {
              return ok(intent, "Cohere API is reachable and authenticated.");
            } else {
              return fail(intent, `Cohere API responded with HTTP ${res.status}`);
            }
          } catch (err) {
            return fail(intent, `Cohere API unreachable: ${(err as Error).message}`);
          }
        }

        case "chat": {
          const message = typeof intent.args?.message === "string" ? intent.args.message : "";
          const preamble = typeof intent.args?.preamble === "string" ? intent.args.preamble : "";
          const model = typeof intent.args?.model === "string" ? intent.args.model : "command-r-plus";

          if (!message) {
            return fail(intent, "args.message is required for chat verb");
          }

          const res = await fetch("https://api.cohere.ai/v1/chat", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${COHERE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message,
              preamble,
              model,
              stream: false,
            }),
            signal: AbortSignal.timeout(60000),
          });

          if (!res.ok) {
            const errBody = await res.text().catch(() => "");
            return fail(intent, `Cohere API returned HTTP ${res.status}: ${errBody}`);
          }

          const responseData = await res.json();
          const replyText = responseData.text || "";

          const ledger_id = await ctx.appendLedger({
            actor_id: intent.from,
            event_kind: "cohere.chat.ok",
            correlation_id: intent.correlation_id,
            payload: {
              model,
              message_len: message.length,
              reply_len: replyText.length,
            },
          });

          return ok(intent, `Cohere [${model}]: ${replyText.slice(0, 100)}...`, { response: responseData, text: replyText }, ledger_id);
        }

        default:
          return fail(intent, `Unknown verb: ${intent.verb}. Supported: ping, health, chat`);
      }
    } catch (err) {
      return fail(intent, `Cohere boss error: ${(err as Error).message}`);
    }
  },
};
