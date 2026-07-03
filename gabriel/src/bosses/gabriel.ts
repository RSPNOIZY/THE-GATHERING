// GABRIEL · Boss — the warrior executor and lead orchestrator.
//
// GABRIEL is the default boss for the NOIZY.AI Discord bot and the Slack
// master identity. Most intents that arrive from the Worker land here first.
// GABRIEL reasons via the Claude Agent SDK when a decision is open-ended;
// for well-defined verbs it dispatches directly (consent check, army task,
// delegation to another boss).

import type { Boss, Intent, BossResult, BossContext } from "./types.js";

const NAME = "gabriel" as const;

async function handle(intent: Intent, ctx: BossContext): Promise<BossResult> {
  const corr = intent.correlation_id;

  // 1. Always write the intent to the ledger first.
  const ledger_id = await ctx.appendLedger({
    actor_id: intent.from,
    event_kind: `intent.received.${intent.verb}`,
    subject: intent.target,
    correlation_id: corr,
    payload: {
      boss: NAME,
      verb: intent.verb,
      args: intent.args ?? {},
      source: intent.source,
      priority: intent.priority ?? "normal",
    },
  });

  // 2. Route by verb. Each branch returns a BossResult with a human-readable
  //    ack_message that is safe to post to Discord/Slack verbatim.
  try {
    switch (intent.verb) {
      case "ping":
      case "health": {
        return {
          ok: true,
          correlation_id: corr,
          boss: NAME,
          verb: intent.verb,
          ack_message: "GABRIEL online. Warrior executor standing by.",
          ledger_id,
        };
      }

      case "speak": {
        const text = (intent.args?.text as string) ?? "";
        const agent = (intent.args?.agent as string) ?? "gabriel";
        if (!text) {
          return {
            ok: false,
            correlation_id: corr,
            boss: NAME,
            verb: intent.verb,
            error: "args.text required",
            ledger_id,
          };
        }
        await ctx.speak(text, agent);
        return {
          ok: true,
          correlation_id: corr,
          boss: NAME,
          verb: intent.verb,
          ack_message: `Spoken as ${agent}.`,
          ledger_id,
        };
      }

      case "army.dispatch": {
        const verb = intent.args?.verb as string | undefined;
        const target = intent.args?.target as string | undefined;
        if (!verb || !target) {
          return {
            ok: false,
            correlation_id: corr,
            boss: NAME,
            verb: intent.verb,
            error: "args.verb and args.target required",
            ledger_id,
          };
        }
        const army_task_id = await ctx.dispatchArmy({
          verb,
          target,
          args: (intent.args?.args as Record<string, unknown>) ?? {},
          correlation_id: corr,
        });
        if (!army_task_id) {
          return {
            ok: false,
            correlation_id: corr,
            boss: NAME,
            verb: intent.verb,
            error: "NOIZYARMY orchestrator unreachable",
            ledger_id,
          };
        }
        return {
          ok: true,
          correlation_id: corr,
          boss: NAME,
          verb: intent.verb,
          ack_message: `Dispatched to NOIZYARMY. task_id=${army_task_id}.`,
          army_task_id,
          ledger_id,
        };
      }

      default: {
        // Unknown verb — in Phase 2 this will route to Claude via the SDK for
        // open-ended reasoning. For now, refuse cleanly so nothing silent
        // happens.
        return {
          ok: false,
          correlation_id: corr,
          boss: NAME,
          verb: intent.verb,
          error: `unknown verb for boss=${NAME}: ${intent.verb}. (SDK-backed free-form reasoning is Phase 2.)`,
          ledger_id,
        };
      }
    }
  } catch (err) {
    return {
      ok: false,
      correlation_id: corr,
      boss: NAME,
      verb: intent.verb,
      error: (err as Error).message,
      ledger_id,
    };
  }
}

export const gabriel: Boss = {
  name: NAME,
  description: "Warrior executor + lead orchestrator. Default boss for NOIZY.AI bot.",
  handle,
};
