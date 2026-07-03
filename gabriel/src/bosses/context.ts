// GABRIEL · Bosses — runtime context (ledger / army dispatch / voice)
//
// One shared BossContext instance is created at daemon startup and passed into
// each boss's handle() call. Each utility is fire-and-forget where appropriate
// and returns structured results where callers might care (e.g. ledger id).

import { env } from "node:process";
import type { BossContext } from "./types.js";

const HEAVEN_BASE = env.HEAVEN_BASE_URL ?? "https://heaven.rsp-5f3.workers.dev";
const NOIZY_API_KEY = env.NOIZY_API_KEY ?? "";
const ARMY_BASE = env.NOIZYARMY_BASE_URL ?? "http://127.0.0.1:9333";
const VOICE_BASE = env.NOIZY_VOICE_URL ?? "http://127.0.0.1:9799";

// One-time warning flags (reset per daemon process).
let _warnedNoKey = false;
let _warned404 = false;

/**
 * Create the BossContext used by all handlers.
 *
 * When HEAVEN or the NOIZYARMY orchestrator is unreachable we log but do NOT
 * throw — bosses should continue doing whatever local work they can.
 * Mutating operations that REQUIRE a ledger entry must check the returned
 * ledger_id themselves and abort if it is undefined.
 */
export function createBossContext(): BossContext {
  return {
    async appendLedger(entry) {
      if (!NOIZY_API_KEY) {
        // Log once at cold-start only; otherwise noisy.
        if (!_warnedNoKey) {
          console.warn("[bosses/ctx] appendLedger disabled — NOIZY_API_KEY not set");
          _warnedNoKey = true;
        }
        return undefined;
      }
      try {
        // Heaven's canonical external-write endpoint is /api/v1/ledger/append.
        // Map our semantic fields onto its body shape.
        const body = {
          actor_id: entry.actor_id,
          event_type: entry.event_kind,
          payload: {
            ...(entry.payload ?? {}),
            ...(entry.subject ? { subject: entry.subject } : {}),
            ...(entry.correlation_id ? { correlation_id: entry.correlation_id } : {}),
          },
        };
        const res = await fetch(`${HEAVEN_BASE}/api/v1/ledger/append`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-NOIZY-Key": NOIZY_API_KEY,
          },
          body: JSON.stringify(body),
        });
        if (res.status === 404) {
          // Heaven has no POST /api/v1/ledger endpoint yet (architectural —
          // ledger writes happen via domain events, not generic audit). Skip
          // silently after one cold-start warning.
          if (!_warned404) {
            console.warn(
              "[bosses/ctx] Heaven POST /api/v1/ledger = 404. Ledger appends disabled until the endpoint lands.",
            );
            _warned404 = true;
          }
          return undefined;
        }
        if (!res.ok) {
          console.error(`[bosses/ctx] ledger append failed: ${res.status}`);
          return undefined;
        }
        const data = (await res.json()) as { id?: string };
        return data.id;
      } catch (err) {
        console.error(`[bosses/ctx] ledger append error: ${(err as Error).message}`);
        return undefined;
      }
    },

    async dispatchArmy(task) {
      try {
        const res = await fetch(`${ARMY_BASE}/task`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(task),
        });
        if (!res.ok) {
          console.error(`[bosses/ctx] army dispatch failed: ${res.status}`);
          return undefined;
        }
        const data = (await res.json()) as { task_id?: string; id?: string };
        return data.task_id ?? data.id;
      } catch (err) {
        console.error(`[bosses/ctx] army dispatch error: ${(err as Error).message}`);
        return undefined;
      }
    },

    async speak(text, agent = "gabriel") {
      if (!text) return;
      try {
        await fetch(`${VOICE_BASE}/speak`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agent, text }),
        });
      } catch {
        // voice-service offline is non-fatal — silently skip.
      }
    },
  };
}
