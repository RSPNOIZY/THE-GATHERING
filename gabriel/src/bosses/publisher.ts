import type { Boss, Intent, BossResult, BossContext } from "./types.js";

function ok(intent: Intent, ack: string, data?: Record<string, unknown>): BossResult {
  return {
    ok: true,
    correlation_id: intent.correlation_id,
    boss: "publisher",
    verb: intent.verb,
    ack_message: ack,
    data,
  };
}

function fail(intent: Intent, error: string): BossResult {
  return {
    ok: false,
    correlation_id: intent.correlation_id,
    boss: "publisher",
    verb: intent.verb,
    error,
  };
}

export const publisher: Boss = {
  name: "publisher",
  description: "Contributor flow · artifacts registry · royalty routing · revenue reinvestment law.",

  async handle(intent, ctx) {
    switch (intent.verb) {
      case "ping":
        return ok(intent, "publisher online.");

      case "register": {
        const { email, name, creator_class = "code" } = intent.args ?? {};
        if (!email || !name) return fail(intent, "args.email and args.name required");

        await ctx.appendLedger({
          actor_id: intent.from,
          event_kind: "publisher.register",
          subject: email as string,
          correlation_id: intent.correlation_id,
          payload: { name, creator_class },
        });
        return ok(intent, `Registered creator estate for ${email}.`, { email, creator_class });
      }

      case "submit": {
        const { estate_id, kind, title, content_url } = intent.args ?? {};
        if (!estate_id || !kind || !title || !content_url) {
          return fail(intent, "args {estate_id, kind, title, content_url} required");
        }

        // Note: Real implementation would dispatch to 'dream' for vision_check
        // and 'rag' for insertion before ledgering.
        return ok(intent, `Contribution '${title}' received for review.`, { title, status: "pending" });
      }

      default:
        return fail(intent, `unknown verb: ${intent.verb}`);
    }
  },
};
