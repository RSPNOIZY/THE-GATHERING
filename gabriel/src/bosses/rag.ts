// GABRIEL · Boss — RAG (cf07-vectorize-rag · the Bass section)
//
// Wraps cf07-vectorize-rag worker. Provides empire-wide semantic search +
// embedding insert + retrieval over the `empire-corpus` Vectorize index.
// Embeddings via Cloudflare's @cf/baai/bge-base-en-v1.5 (free on Workers Paid plan).
//
// Verbs:
//   embed   → POST /embed   { text }  → vector
//   insert  → POST /insert  { id, text, metadata? }
//   search  → POST /search  { query, top_k?, filter? }
//   stats   → GET /stats (index size, last insert)
//   status  → identity + corpus name + embedding model
//   ping|health → boss + cf07 reachability
//
// Per the bootstrap brief: this IS the Bass section. Every other boss should
// consult it before generating long-form content.

import type { Boss, Intent, BossResult } from "./types.js";

const CF07_URL = process.env.CF07_RAG_URL || "https://cf07-vectorize-rag.rsp-5f3.workers.dev";
const NOIZY_API_KEY = process.env.NOIZY_API_KEY ?? "";

function ok(intent: Intent, ack: string, data?: Record<string, unknown>): BossResult {
  return {
    ok: true,
    correlation_id: intent.correlation_id,
    boss: "rag",
    verb: intent.verb,
    ack_message: ack,
    data,
  };
}
function fail(intent: Intent, error: string): BossResult {
  return {
    ok: false,
    correlation_id: intent.correlation_id,
    boss: "rag",
    verb: intent.verb,
    error,
  };
}

async function cf07(path: string, init?: RequestInit, timeoutMs = 30_000): Promise<unknown> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (NOIZY_API_KEY) headers["X-NOIZY-Key"] = NOIZY_API_KEY;
  const res = await fetch(`${CF07_URL}${path}`, {
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
    throw new Error(`cf07 ${path} → ${res.status} ${typeof body === "string" ? body.slice(0, 200) : ""}`);
  }
  return body;
}

export const rag: Boss = {
  name: "rag",
  description:
    "Bass section — Vectorize RAG over empire-corpus (cf07). Semantic recall across every NOIZY doc, session MD, master file.",

  async handle(intent) {
    switch (intent.verb) {
      case "ping":
      case "health": {
        try {
          const body = await cf07("/health", { method: "GET" }, 5_000);
          return ok(intent, "rag online + cf07 healthy.", { health: body });
        } catch (err) {
          return fail(intent, `cf07 unreachable: ${(err as Error).message}`);
        }
      }
      case "embed": {
        const text = typeof intent.args?.text === "string" ? intent.args.text : "";
        if (!text) return fail(intent, "args.text required");
        try {
          const body = await cf07(
            "/embed",
            { method: "POST", body: JSON.stringify({ text }) },
            20_000,
          );
          return ok(intent, "Embedded.", { embed: body });
        } catch (err) {
          return fail(intent, `embed failed: ${(err as Error).message}`);
        }
      }
      case "insert": {
        const id = typeof intent.args?.id === "string" ? intent.args.id : "";
        const text = typeof intent.args?.text === "string" ? intent.args.text : "";
        if (!id || !text) return fail(intent, "args.{id, text} required");
        const metadata = intent.args?.metadata ?? {};
        try {
          const body = await cf07(
            "/insert",
            { method: "POST", body: JSON.stringify({ id, text, metadata }) },
            30_000,
          );
          return ok(intent, `Inserted ${id} into empire-corpus.`, { insert: body });
        } catch (err) {
          return fail(intent, `insert failed: ${(err as Error).message}`);
        }
      }
      case "search": {
        const query = typeof intent.args?.query === "string" ? intent.args.query : "";
        if (!query) return fail(intent, "args.query required");
        const top_k = typeof intent.args?.top_k === "number" ? intent.args.top_k : 8;
        const filter = intent.args?.filter ?? undefined;
        try {
          const body = await cf07(
            "/search",
            {
              method: "POST",
              body: JSON.stringify({ query, top_k, ...(filter ? { filter } : {}) }),
            },
            20_000,
          );
          const matches =
            (body as { matches?: unknown[] }).matches ?? (body as { results?: unknown[] }).results ?? [];
          return ok(
            intent,
            `Search returned ${Array.isArray(matches) ? matches.length : 0} matches.`,
            { search: body },
          );
        } catch (err) {
          return fail(intent, `search failed: ${(err as Error).message}`);
        }
      }
      case "stats": {
        try {
          const body = await cf07("/stats", { method: "GET" }, 8_000);
          return ok(intent, "RAG stats fetched.", { stats: body });
        } catch (err) {
          return fail(intent, `stats failed: ${(err as Error).message}`);
        }
      }
      case "status":
        return ok(intent, "RAG — Bass section · semantic recall over empire-corpus.", {
          cf07_url: CF07_URL,
          embedding_model: "@cf/baai/bge-base-en-v1.5",
          index: "empire-corpus",
          role: "every boss should consult this before long-form generation",
        });
      default:
        return fail(
          intent,
          `unknown verb: ${intent.verb}. Known: embed, insert, search, stats, status, ping.`,
        );
    }
  },
};
