// GABRIEL · Boss — OLLAMA (local LLM inference · $0/call)
//
// The "no-money Heaven" inference layer. Wraps the local Ollama daemon at
// http://127.0.0.1:11434 — every call runs on M2 Ultra GPU/CPU, zero outbound
// network, zero per-token cost. Includes Rob's custom-trained models
// (noizy-gabriel-mind, noizy-lucy-g4, noizy-bill-g4) alongside gemma4 / qwen
// / mistral.
//
// Verbs:
//   list       → list installed local models
//   run        → single-shot completion  { model, prompt, system?, stream?:false }
//   ask        → ergonomic alias of run with smart model default
//   ping|health → boss + ollama daemon liveness
//
// Args allow-list: only models discovered live from /api/tags are accepted,
// preventing accidental download of remote models from /intent.

import type { Boss, Intent, BossResult, BossContext } from "./types.js";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";

function ok(
  intent: Intent,
  ack: string,
  data?: Record<string, unknown>,
  ledger_id?: string,
): BossResult {
  return {
    ok: true,
    correlation_id: intent.correlation_id,
    boss: "ollama",
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
    boss: "ollama",
    verb: intent.verb,
    error,
    ledger_id,
  };
}

async function ollamaJson(path: string, init?: RequestInit, timeoutMs = 60_000): Promise<unknown> {
  const res = await fetch(`${OLLAMA_URL}${path}`, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`ollama ${path} → ${res.status} ${txt.slice(0, 200)}`);
  }
  return res.json();
}

async function listModels(): Promise<string[]> {
  const body = (await ollamaJson("/api/tags", { method: "GET" }, 5_000)) as {
    models?: Array<{ name: string }>;
  };
  return (body.models ?? []).map((m) => m.name);
}

function pickDefaultModel(models: string[]): string {
  // Prefer Rob's custom NOIZY-trained models > gemma4 > others
  const order = ["noizy-gabriel-mind", "noizy-lucy-g4", "gemma4:31b", "gemma4:26b", "gemma4:e4b", "phi4", "gemma3"];
  for (const pref of order) {
    const m = models.find((x) => x.startsWith(pref));
    if (m) return m;
  }
  return models[0] ?? "gemma3:latest";
}

async function runCompletion(
  model: string,
  prompt: string,
  system?: string,
): Promise<{ response: string; total_duration_ms?: number; eval_count?: number }> {
  const body: Record<string, unknown> = { model, prompt, stream: false };
  if (system) body.system = system;
  const out = (await ollamaJson(
    "/api/generate",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    300_000, // 5-min cap; 30B-param models can take this on big prompts
  )) as { response?: string; total_duration?: number; eval_count?: number };
  return {
    response: String(out.response ?? "").trim(),
    total_duration_ms: out.total_duration ? Math.floor(out.total_duration / 1_000_000) : undefined,
    eval_count: out.eval_count,
  };
}

export const ollama: Boss = {
  name: "ollama",
  description:
    "Local LLM inference (no-money Heaven). Wraps Ollama :11434 — Rob's custom NOIZY models + gemma4 + qwen + mistral.",

  async handle(intent, ctx: BossContext) {
    try {
      switch (intent.verb) {
        case "ping":
        case "health": {
          // Verify Ollama itself is reachable
          try {
            await ollamaJson("/api/version", { method: "GET" }, 3_000);
            return ok(intent, "ollama online + daemon reachable.");
          } catch (err) {
            return fail(intent, `ollama daemon unreachable: ${(err as Error).message}`);
          }
        }
        case "list": {
          const models = await listModels();
          return ok(intent, `${models.length} local models.`, { models });
        }
        case "run":
        case "ask": {
          const prompt = typeof intent.args?.prompt === "string" ? intent.args.prompt : "";
          if (!prompt) return fail(intent, "args.prompt required");
          const requested = typeof intent.args?.model === "string" ? intent.args.model : "";
          const system = typeof intent.args?.system === "string" ? intent.args.system : undefined;

          // Whitelist: only models actually installed locally
          const installed = await listModels();
          if (requested && !installed.includes(requested)) {
            return fail(
              intent,
              `model '${requested}' not installed locally. Available: ${installed.slice(0, 6).join(", ")}…`,
            );
          }
          const model = requested || pickDefaultModel(installed);
          const t0 = Date.now();
          const { response, total_duration_ms, eval_count } = await runCompletion(
            model,
            prompt,
            system,
          );
          const ledger_id = await ctx.appendLedger({
            actor_id: intent.from,
            event_kind: "ollama.run.ok",
            correlation_id: intent.correlation_id,
            payload: {
              model,
              prompt_len: prompt.length,
              response_len: response.length,
              eval_count,
              wall_ms: Date.now() - t0,
              ollama_total_ms: total_duration_ms,
            },
          });
          return ok(
            intent,
            `${model} · ${response.length} chars · ${total_duration_ms ?? Date.now() - t0}ms`,
            { model, response, total_duration_ms, eval_count, wall_ms: Date.now() - t0 },
            ledger_id,
          );
        }
        case "status":
          return ok(intent, "OLLAMA — local inference layer.", {
            ollama_url: OLLAMA_URL,
            doctrine: "$0 per token · M2 Ultra 192GB · zero outbound · custom NOIZY models live",
          });
        default:
          return fail(intent, `unknown verb: ${intent.verb}. Known: list, run, ask, status, ping.`);
      }
    } catch (err) {
      return fail(intent, `ollama boss error: ${(err as Error).message}`);
    }
  },
};
