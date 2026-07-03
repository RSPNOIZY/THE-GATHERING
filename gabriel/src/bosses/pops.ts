// GABRIEL · Boss — POPS (R.K. Plowman · grounded paternal wisdom)
//
// Inline-content boss. Wisdom lines mirror mcp/family-mcp/index.js POPS_WISDOM.
// Source of truth remains family-mcp; this is a local mirror so the daemon
// serves pops wisdom even if family-mcp isn't reachable. Drift-check: keep
// this array in sync with the MCP's POPS_WISDOM on any doctrinal update.

import type { Boss, Intent, BossResult } from "./types.js";

const POPS_WISDOM = [
  "The simplest solution is usually the right one.",
  "Sleep on big decisions — urgency is usually an illusion.",
  "Measure twice, cut once.",
  "Take care of yourself first — you can't build an empire on empty.",
  "The work will be there tomorrow — but you need to be too.",
  "Good enough today beats perfect never.",
  "Every cathedral was built one stone at a time.",
  "If you're frustrated, step back. The answer comes when you're not forcing it.",
  "Your mother would tell you to eat something. So eat something.",
  "Pride in craft means knowing when to stop as much as knowing when to push.",
];

function ok(intent: Intent, ack: string, data?: Record<string, unknown>): BossResult {
  return {
    ok: true,
    correlation_id: intent.correlation_id,
    boss: "pops",
    verb: intent.verb,
    ack_message: ack,
    data,
  };
}

function fail(intent: Intent, error: string): BossResult {
  return {
    ok: false,
    correlation_id: intent.correlation_id,
    boss: "pops",
    verb: intent.verb,
    error,
  };
}

export const pops: Boss = {
  name: "pops",
  description:
    "Grounded paternal wisdom (R.K. Plowman lineage). 100-year frame. Serves Pops wisdom + long-horizon checks.",

  async handle(intent) {
    switch (intent.verb) {
      case "ping":
      case "health":
        return ok(intent, "pops online.");
      case "wisdom": {
        const line = POPS_WISDOM[Math.floor(Math.random() * POPS_WISDOM.length)];
        const context = typeof intent.args?.context === "string" ? intent.args.context : null;
        return ok(intent, `Pops says: "${line}"`, { wisdom: line, context });
      }
      case "status":
        return ok(intent, "Pops watches the 100-year frame.", {
          doctrine: "every decision filtered through 'does this still matter in 50 years?'",
          wisdom_count: POPS_WISDOM.length,
        });
      default:
        return fail(intent, `unknown verb: ${intent.verb}. Known: wisdom, status, ping.`);
    }
  },
};
