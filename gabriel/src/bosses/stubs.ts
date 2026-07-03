// GABRIEL · Bosses — all 8 now have real implementations.
//
// This file previously held stubs for bosses whose MCPs weren't yet wired.
// All have been replaced:
//   ./lucy.ts        — DAZEFLOW + tasks (shared substrate with lucy-mcp)
//   ./cb01.ts        — Cloudflare fleet ops (wraps ops/cloudflare-deploy.sh)
//   ./shirley.ts     — Turbo scripts (vitals / net / recall / speed)
//   ./pops.ts        — Grounded paternal wisdom (inline mirror of family-mcp)
//   ./shirl.ts       — Wellbeing watchdog (session timing + break reminders)
//   ./dream.ts       — 5th Epoch visionary (2056 Founder Credo + vision filter)
//   ./engr_keith.ts  — Heaven HTTP probe + architecture snapshot
//   ./gabriel.ts     — Native Claude Agent SDK orchestrator
//
// This file is retained as documentation + fallback makeStub helper for any
// future boss added to BossName that hasn't been implemented yet.

import type { Boss, Intent, BossResult, BossContext, BossName } from "./types.js";

export function makeStub(name: BossName, description: string): Boss {
  return {
    name,
    description,
    async handle(intent: Intent, ctx: BossContext): Promise<BossResult> {
      const corr = intent.correlation_id;
      const ledger_id = await ctx.appendLedger({
        actor_id: intent.from,
        event_kind: `intent.stubbed.${intent.verb}`,
        subject: intent.target,
        correlation_id: corr,
        payload: { boss: name, verb: intent.verb, args: intent.args ?? {} },
      });

      if (intent.verb === "ping" || intent.verb === "health") {
        return {
          ok: true,
          correlation_id: corr,
          boss: name,
          verb: intent.verb,
          ack_message: `${name} acknowledged (stub — real MCP wire pending).`,
          ledger_id,
        };
      }

      return {
        ok: false,
        correlation_id: corr,
        boss: name,
        verb: intent.verb,
        error: `boss=${name} is a stub. verb=${intent.verb} not yet implemented. Intent ledgered for replay when the real handler lands.`,
        ledger_id,
      };
    },
  };
}
