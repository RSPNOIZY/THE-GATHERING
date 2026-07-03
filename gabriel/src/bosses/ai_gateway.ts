// GABRIEL · Boss — AI_GATEWAY (cf06 · unified LLM routing)
//
// Wraps cf06-ai-gateway worker — empire's caching/observability/fallback layer
// in front of every cloud LLM call. Provider whitelist + retry + cache
// invalidation handled by the Worker; this boss is the typed dispatcher.
//
// Verbs:
//   providers   → GET /providers (list configured cloud LLMs + status)
//   chat        → POST /chat { provider, model, messages }
//   universal   → POST /universal { prompt, context?, hints? } — gateway picks
//   stats       → GET /stats (call count, cache hit rate, p95 latency)
//   ping|health → boss + cf06 reachability
//
// Per Lead Voices brief: this is the section conductor that picks WHICH
// cloud model plays. ollama boss handles the local-only path.

import type { Boss, Intent, BossResult } from "./types.js";

const CF06_URL = process.env.CF06_AI_GATEWAY_URL || "https://cf06-ai-gateway.rsp-5f3.workers.dev";
const NOIZY_API_KEY = process.env.NOIZY_API_KEY ?? "";

function ok(intent: Intent, ack: string, data?: Record<string, unknown>): BossResult {
  return {
    ok: true,
    correlation_id: intent.correlation_id,
    boss: "ai_gateway",
    verb: intent.verb,
    ack_message: ack,
    data,
  };
}
function fail(intent: Intent, error: string): BossResult {
  return {
    ok: false,
    correlation_id: intent.correlation_id,
    boss: "ai_gateway",
    verb: intent.verb,
    error,
  };
}

async function cf06(path: string, init?: RequestInit, timeoutMs = 60_000): Promise<unknown> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (NOIZY_API_KEY) headers["X-NOIZY-Key"] = NOIZY_API_KEY;
  const res = await fetch(`${CF06_URL}${path}`, {
    ...init,
    headers: { ...headers, ...(init?.headers as Record<string, string> | undefined) },
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {}
  if (!res.ok) {
    throw new Error(`cf06 ${path} → ${res.status} ${typeof body === "string" ? body.slice(0, 200) : ""}`);
  }
  return body;
}

export const ai_gateway: Boss = {
  name: "ai_gateway",
  description:
    "Cloud LLM gateway (cf06). Cache + fallback + observability across providers. Cheap or free per CF AI Gateway tier.",

  async handle(intent) {
    switch (intent.verb) {
      case "ping":
      case "health": {
        try {
          const body = await cf06("/health", { method: "GET" }, 5_000);
          return ok(intent, "ai_gateway online + cf06 healthy.", { health: body });
        } catch (err) {
          return fail(intent, `cf06 unreachable: ${(err as Error).message}`);
        }
      }
      case "providers": {
        try {
          const body = await cf06("/providers", { method: "GET" }, 8_000);
          return ok(intent, "Providers listed.", { providers: body });
        } catch (err) {
          return fail(intent, `providers fetch failed: ${(err as Error).message}`);
        }
      }
      case "chat": {
        const provider = typeof intent.args?.provider === "string" ? intent.args.provider : "";
        const model = typeof intent.args?.model === "string" ? intent.args.model : "";
        const messages = Array.isArray(intent.args?.messages) ? intent.args.messages : null;
        if (!provider || !model || !messages)
          return fail(intent, "args.{provider,model,messages[]} all required");
        try {
          const body = await cf06(
            "/chat",
            { method: "POST", body: JSON.stringify({ provider, model, messages }) },
            120_000,
          );
          return ok(intent, `${provider}:${model} responded.`, { chat: body });
        } catch (err) {
          return fail(intent, `chat failed: ${(err as Error).message}`);
        }
      }
      case "universal": {
        const prompt = typeof intent.args?.prompt === "string" ? intent.args.prompt : "";
        if (!prompt) return fail(intent, "args.prompt required");
        const passthrough: Record<string, unknown> = { prompt };
        if (intent.args?.context !== undefined) passthrough.context = intent.args.context;
        if (intent.args?.hints !== undefined) passthrough.hints = intent.args.hints;
        try {
          const body = await cf06(
            "/universal",
            { method: "POST", body: JSON.stringify(passthrough) },
            120_000,
          );
          return ok(intent, "Universal endpoint responded.", { result: body });
        } catch (err) {
          return fail(intent, `universal failed: ${(err as Error).message}`);
        }
      }
      case "stats": {
        try {
          const body = await cf06("/stats", { method: "GET" }, 8_000);
          return ok(intent, "Gateway stats fetched.", { stats: body });
        } catch (err) {
          return fail(intent, `stats failed: ${(err as Error).message}`);
        }
      }
      case "status":
        return ok(intent, "AI_GATEWAY — cloud LLM router (cf06).", {
          cf06_url: CF06_URL,
          role: "Lead Voices conductor — picks which cloud model plays per task",
        });
      default:
        return fail(
          intent,
          `unknown verb: ${intent.verb}. Known: providers, chat, universal, stats, status, ping.`,
        );
    }
  },
};
