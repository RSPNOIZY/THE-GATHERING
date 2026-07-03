// GABRIEL · Boss — NOIZYARMY (autonomous build swarm proxy)
//
// Wraps the existing NOIZYARMY Queen orchestrator running on :9333
// (NOIZYARMY/orchestrator.js). 6 named Bees per family-covenant.md:
// ARCHITECT · DEBUGGER · TESTER · DOCUMENTER · SECURITY · OPTIMIZER.
//
// Verbs:
//   queen_health → GET /health
//   queen_status → GET /status
//   services     → GET /services
//   agents       → GET /agents  (lists the 6 bees + their model)
//   swarm        → POST /swarm  { task, bees? } (dispatch parallel swarm)
//   smoke        → POST /smoke  (run swarm-coordinated smoke tests)
//   heal         → POST /heal   (auto-heal action via swarm)
//   gemma        → POST /gemma  { prompt } (single Gemma inference)
//   ping | health → generic ack

import type { Boss, Intent, BossResult } from "./types.js";

const QUEEN_URL = process.env.NOIZYARMY_URL || "http://127.0.0.1:9333";

function ok(intent: Intent, ack: string, data?: Record<string, unknown>): BossResult {
  return {
    ok: true,
    correlation_id: intent.correlation_id,
    boss: "noizyarmy",
    verb: intent.verb,
    ack_message: ack,
    data,
  };
}

function fail(intent: Intent, error: string): BossResult {
  return {
    ok: false,
    correlation_id: intent.correlation_id,
    boss: "noizyarmy",
    verb: intent.verb,
    error,
  };
}

async function queenJson(
  path: string,
  init?: RequestInit,
  timeoutMs = 30_000,
): Promise<unknown> {
  const res = await fetch(`${QUEEN_URL}${path}`, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    /* leave as text */
  }
  if (!res.ok) {
    throw new Error(
      `queen ${path} → ${res.status} ${typeof body === "string" ? body.slice(0, 200) : ""}`,
    );
  }
  return body;
}

export const noizyarmy: Boss = {
  name: "noizyarmy",
  description:
    "Autonomous build swarm. Proxies to NOIZYARMY Queen on :9333 (6 bees: ARCHITECT/DEBUGGER/TESTER/DOCUMENTER/SECURITY/OPTIMIZER).",

  async handle(intent) {
    switch (intent.verb) {
      case "ping":
      case "health":
        return ok(intent, "noizyarmy boss online.");
      case "queen_health": {
        try {
          const body = await queenJson("/health", {}, 6_000);
          return ok(intent, "Queen :9333 healthy.", { health: body });
        } catch (err) {
          return fail(intent, `Queen unreachable: ${(err as Error).message}`);
        }
      }
      case "queen_status": {
        try {
          const body = await queenJson("/status", {}, 8_000);
          return ok(intent, "Queen status fetched.", { status: body });
        } catch (err) {
          return fail(intent, `Queen status failed: ${(err as Error).message}`);
        }
      }
      case "services": {
        try {
          const body = await queenJson("/services", {}, 8_000);
          return ok(intent, "Queen services listed.", { services: body });
        } catch (err) {
          return fail(intent, `services list failed: ${(err as Error).message}`);
        }
      }
      case "agents": {
        try {
          const body = await queenJson("/agents", {}, 8_000);
          return ok(intent, "6 Bees listed.", { agents: body });
        } catch (err) {
          return fail(intent, `agents list failed: ${(err as Error).message}`);
        }
      }
      case "swarm": {
        const task = typeof intent.args?.task === "string" ? intent.args.task : "";
        if (!task) return fail(intent, "args.task required");
        const bees = Array.isArray(intent.args?.bees) ? intent.args.bees : undefined;
        try {
          const body = await queenJson(
            "/swarm",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ task, ...(bees ? { bees } : {}) }),
            },
            120_000,
          );
          return ok(intent, "Swarm dispatched.", { swarm_result: body });
        } catch (err) {
          return fail(intent, `swarm dispatch failed: ${(err as Error).message}`);
        }
      }
      case "smoke": {
        try {
          const body = await queenJson("/smoke", { method: "POST" }, 60_000);
          return ok(intent, "Swarm smoke tests dispatched.", { smoke_result: body });
        } catch (err) {
          return fail(intent, `smoke failed: ${(err as Error).message}`);
        }
      }
      case "heal": {
        try {
          const body = await queenJson("/heal", { method: "POST" }, 90_000);
          return ok(intent, "Swarm heal action dispatched.", { heal_result: body });
        } catch (err) {
          return fail(intent, `heal failed: ${(err as Error).message}`);
        }
      }
      case "gemma": {
        const prompt = typeof intent.args?.prompt === "string" ? intent.args.prompt : "";
        if (!prompt) return fail(intent, "args.prompt required");
        try {
          const body = await queenJson(
            "/gemma",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ prompt }),
            },
            45_000,
          );
          return ok(intent, "Gemma inference returned.", { gemma_result: body });
        } catch (err) {
          return fail(intent, `gemma failed: ${(err as Error).message}`);
        }
      }
      case "status":
        return ok(intent, "NOIZYARMY proxy — 6 Bees behind the Queen.", {
          queen_url: QUEEN_URL,
          bees: ["ARCHITECT", "DEBUGGER", "TESTER", "DOCUMENTER", "SECURITY", "OPTIMIZER"],
          docrtine: "ambient-continuous build pressure · swarm intelligence",
        });
      default:
        return fail(
          intent,
          `unknown verb: ${intent.verb}. Known: queen_health, queen_status, services, agents, swarm, smoke, heal, gemma, status, ping.`,
        );
    }
  },
};
