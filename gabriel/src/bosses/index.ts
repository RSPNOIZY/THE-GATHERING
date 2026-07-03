// GABRIEL · Bosses — registry + dispatch
//
// Single entry point the daemon uses:
//   import { dispatch } from "./bosses/index.js";
//   const result = await dispatch(intent);
//
// Adding a boss: implement Boss interface, import here, add to REGISTRY.
//
// Healed 2026-04-28: this file was overwritten with NOIZYKIDZ haptic worker
// code — preserved at cloudflare/workers/noizykidz-haptic-core/src/index.ts.
// Restored to its proper registry+dispatch role here.

import type { Boss, BossName, Intent, BossResult } from "./types.js";
import { createBossContext } from "./context.js";
import { gabriel } from "./gabriel.js";
import { lucy } from "./lucy.js";
import { cb01 } from "./cb01.js";
import { shirley } from "./shirley.js";
import { pops } from "./pops.js";
import { shirl } from "./shirl.js";
import { dream } from "./dream.js";
import { engr_keith } from "./engr_keith.js";
import { voice_specialist } from "./voice_specialist.js";
import { test_runner } from "./test_runner.js";
import { consent_auditor } from "./consent_auditor.js";
import { noizyarmy } from "./noizyarmy.js";
import { ollama } from "./ollama.js";
import { ai_gateway } from "./ai_gateway.js";
import { rag } from "./rag.js";
import { publisher } from "./publisher.js";
import { maintenance } from "./maintenance.js";
import { openclaw } from "./openclaw.js";
import { cohere } from "./cohere.js";
import { nodered } from "./nodered.js";

const REGISTRY: Record<BossName, Boss> = {
  gabriel,
  lucy,
  pops,
  shirl,
  shirley,
  dream,
  engr_keith,
  cb01,
  voice_specialist,
  test_runner,
  consent_auditor,
  noizyarmy,
  ollama,
  ai_gateway,
  rag,
  publisher,
  maintenance,
  openclaw,
  cohere,
  nodered,
};

// One shared context, created lazily. Lives for the life of the daemon.
let _ctx: ReturnType<typeof createBossContext> | null = null;
function ctx() {
  if (!_ctx) _ctx = createBossContext();
  return _ctx;
}

/** List registered boss names + descriptions. */
export function listBosses(): Array<{ name: BossName; description: string }> {
  return Object.values(REGISTRY).map((b) => ({ name: b.name, description: b.description }));
}

/** Route an intent to its boss. Returns a structured BossResult — never throws. */
export async function dispatch(intent: Intent): Promise<BossResult> {
  const boss = REGISTRY[intent.boss];
  if (!boss) {
    return {
      ok: false,
      correlation_id: intent.correlation_id,
      boss: intent.boss,
      verb: intent.verb,
      error: `unknown boss: ${intent.boss}. Registered: ${Object.keys(REGISTRY).join(", ")}.`,
    };
  }
  try {
    return await boss.handle(intent, ctx());
  } catch (err) {
    return {
      ok: false,
      correlation_id: intent.correlation_id,
      boss: intent.boss,
      verb: intent.verb,
      error: `boss=${intent.boss} threw: ${(err as Error).message}`,
    };
  }
}

export type { Boss, BossName, Intent, BossResult } from "./types.js";
