// GABRIEL · Boss — Node-RED (workflow automation bridge)
//
// Communicates with Node-RED instance on port 1880 for executing hot-rod file mover operations
// and inspecting jobs progress.

import type { Boss, Intent, BossResult, BossContext } from "./types.js";

const NAME = "nodered" as const;
const NODERED_URL = process.env.NODERED_URL || "http://127.0.0.1:1880";

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

export const nodered: Boss = {
  name: NAME,
  description: "Node-RED integration. Triggers and monitors file-mover flows.",

  async handle(intent, ctx: BossContext) {
    try {
      switch (intent.verb) {
        case "ping":
        case "health": {
          try {
            const res = await fetch(`${NODERED_URL}/api/jobs`, {
              signal: AbortSignal.timeout(3000),
            });
            if (res.ok) {
              return ok(intent, "Node-RED file-mover endpoint is online & reachable.");
            } else {
              return fail(intent, `Node-RED returned HTTP ${res.status}`);
            }
          } catch (err) {
            return fail(intent, `Node-RED unreachable at ${NODERED_URL}: ${(err as Error).message}`);
          }
        }

        case "file_mover.move": {
          const src = typeof intent.args?.src === "string" ? intent.args.src : "";
          const dst = typeof intent.args?.dst === "string" ? intent.args.dst : "";
          const name = typeof intent.args?.name === "string" ? intent.args.name : "job";

          if (!src || !dst) {
            return fail(intent, "args.src and args.dst are required for file_mover.move");
          }

          // Path sanitization: must start with /Users/m2ultra or /Volumes
          if (!src.startsWith("/Users/m2ultra") && !src.startsWith("/Volumes")) {
            return fail(intent, "Path must be under /Users/m2ultra or /Volumes");
          }
          if (!dst.startsWith("/Users/m2ultra") && !dst.startsWith("/Volumes")) {
            return fail(intent, "Path must be under /Users/m2ultra or /Volumes");
          }

          const res = await fetch(`${NODERED_URL}/api/move`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ src, dst, name }),
            signal: AbortSignal.timeout(10000),
          });

          if (!res.ok) {
            const errBody = await res.text().catch(() => "");
            return fail(intent, `Node-RED move request failed (HTTP ${res.status}): ${errBody}`);
          }

          const data = await res.json();
          const jobId = data.job_id || "unknown";

          const ledger_id = await ctx.appendLedger({
            actor_id: intent.from,
            event_kind: "nodered.move.triggered",
            correlation_id: intent.correlation_id,
            payload: { src, dst, name, job_id: jobId },
          });

          return ok(intent, `File move triggered successfully (job_id: ${jobId}).`, { job_id: jobId, src, dst, name }, ledger_id);
        }

        case "file_mover.jobs": {
          const res = await fetch(`${NODERED_URL}/api/jobs`, {
            signal: AbortSignal.timeout(5000),
          });

          if (!res.ok) {
            return fail(intent, `Failed to fetch jobs list: HTTP ${res.status}`);
          }

          const jobs = await res.json();
          return ok(intent, `Fetched ${Object.keys(jobs).length || 0} file-mover jobs.`, { jobs });
        }

        default:
          return fail(intent, `Unknown verb: ${intent.verb}. Supported: ping, health, file_mover.move, file_mover.jobs`);
      }
    } catch (err) {
      return fail(intent, `Node-RED boss error: ${(err as Error).message}`);
    }
  },
};
