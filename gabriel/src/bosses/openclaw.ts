// GABRIEL · Boss — OpenClaw (master orchestrator bridge)
//
// GABRIEL communicates with the Heaven router to constitutionalize and dispatch Claws.
// Emulates the behavior of noizybeast/integrations/openclaw.mjs.

import type { Boss, Intent, BossResult, BossContext } from "./types.js";
import crypto from "crypto";

const NAME = "openclaw" as const;
const HEAVEN_URL = process.env.HEAVEN_URL || "https://heaven.rsp-5f3.workers.dev";
const NOIZY_API_KEY = process.env.NOIZY_API_KEY || "";

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

export const openclaw: Boss = {
  name: NAME,
  description: "OpenClaw 36 dispatcher and receipt auditor. Communicates with Heaven.",

  async handle(intent, ctx: BossContext) {
    if (!NOIZY_API_KEY) {
      return fail(intent, "NOIZY_API_KEY is not configured in environment");
    }

    try {
      switch (intent.verb) {
        case "ping":
        case "health": {
          try {
            const res = await fetch(`${HEAVEN_URL}/health`, {
              headers: { "X-NOIZY-Key": NOIZY_API_KEY },
              signal: AbortSignal.timeout(5000),
            });
            if (res.ok) {
              return ok(intent, "Heaven OpenClaw endpoint is online & reachable.");
            } else {
              return fail(intent, `Heaven returned HTTP ${res.status}`);
            }
          } catch (err) {
            return fail(intent, `Heaven unreachable: ${(err as Error).message}`);
          }
        }

        case "dispatch": {
          const clawSurface = typeof intent.args?.clawSurface === "string" ? intent.args.clawSurface : "";
          const targetVerb = typeof intent.args?.verb === "string" ? intent.args.verb : "";
          const payload = (intent.args?.payload as Record<string, unknown>) ?? {};

          if (!clawSurface || !targetVerb) {
            return fail(intent, "args.clawSurface and args.verb are required");
          }

          // Build OpenClaw command envelope
          const command = {
            id: `gabriel-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
            source: "dashboard",
            actor: {
              id: intent.from,
              displayName: "Gabriel Daemon Dispatcher",
              role: "orchestrator",
            },
            verb: targetVerb,
            target: intent.target,
            payload,
            created_at: new Date().toISOString(),
          };

          const res = await fetch(`${HEAVEN_URL}/api/claw/dispatch`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-NOIZY-Key": NOIZY_API_KEY,
              "X-Claw-Surface": clawSurface,
            },
            body: JSON.stringify(command),
            signal: AbortSignal.timeout(30000),
          });

          const data = await res.json().catch(() => ({}));

          if (!res.ok) {
            const reason = data.error || data.reason || `HTTP ${res.status}`;
            return fail(intent, `Heaven rejected claw ${targetVerb}: ${reason}`);
          }

          const ledger_id = await ctx.appendLedger({
            actor_id: intent.from,
            event_kind: "openclaw.dispatch.ok",
            correlation_id: intent.correlation_id,
            payload: { clawSurface, verb: targetVerb, command_id: command.id },
          });

          return ok(intent, `Claw ${targetVerb} successfully dispatched.`, { response: data }, ledger_id);
        }

        case "receipts": {
          const targetVerb = typeof intent.args?.verb === "string" ? intent.args.verb : "";
          const limit = typeof intent.args?.limit === "number" ? intent.args.limit : 10;

          if (!targetVerb) {
            return fail(intent, "args.verb is required to fetch receipts");
          }

          const res = await fetch(
            `${HEAVEN_URL}/api/claw/receipts?verb=${encodeURIComponent(targetVerb)}&limit=${limit}`,
            {
              headers: { "X-NOIZY-Key": NOIZY_API_KEY },
              signal: AbortSignal.timeout(10000),
            }
          );

          if (!res.ok) {
            return fail(intent, `Failed to query receipts: HTTP ${res.status}`);
          }

          const receipts = await res.json();
          return ok(intent, `Fetched ${receipts.length || 0} receipts for ${targetVerb}.`, { receipts });
        }

        default:
          return fail(intent, `Unknown verb: ${intent.verb}. Supported: ping, health, dispatch, receipts`);
      }
    } catch (err) {
      return fail(intent, `OpenClaw boss error: ${(err as Error).message}`);
    }
  },
};
