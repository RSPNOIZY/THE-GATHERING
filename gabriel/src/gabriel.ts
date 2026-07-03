import { query } from "@anthropic-ai/claude-agent-sdk";
import { buildSystemPrompt } from "./character.js";
import { route, tierOf, type ModelTier } from "./router.js";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GABRIEL_HOME = join(__dirname, "..");
const GABRIEL_OTEL_SERVICE_NAME = "gabriel-agent";

export interface GabrielTurnOptions {
  input: string;
  /** Override model tier (FAST/NORM/HEAVY). If omitted, router decides. */
  tier?: ModelTier;
  /** If true, router prefers FAST regardless of other signals. */
  isVoice?: boolean;
  /** Stream chunks to this handler as they arrive. */
  onChunk?: (text: string) => void;
}

export interface GabrielTurnResult {
  model: string;
  tier: ModelTier;
  output: string;
  durationMs: number;
}

function stringEnv(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
}

function appendResourceAttributes(existing: string | undefined, attributes: Record<string, string>): string {
  const encoded = Object.entries(attributes).map(
    ([key, value]) => `${key}=${encodeURIComponent(value)}`,
  );
  return [existing, ...encoded].filter(Boolean).join(",");
}

function buildTelemetryEnv(model: string, tier: ModelTier): Record<string, string> | undefined {
  if (process.env.CLAUDE_CODE_ENABLE_TELEMETRY !== "1") {
    return undefined;
  }

  const env = stringEnv();
  env.CLAUDE_CODE_ENABLE_TELEMETRY = "1";
  env.OTEL_SERVICE_NAME = env.OTEL_SERVICE_NAME || GABRIEL_OTEL_SERVICE_NAME;
  env.OTEL_RESOURCE_ATTRIBUTES = appendResourceAttributes(env.OTEL_RESOURCE_ATTRIBUTES, {
    "gabriel.model": model,
    "gabriel.tier": tier,
    "deployment.environment": env.NODE_ENV || "development",
  });

  if (env.OTEL_TRACES_EXPORTER && !env.CLAUDE_CODE_ENHANCED_TELEMETRY_BETA) {
    env.CLAUDE_CODE_ENHANCED_TELEMETRY_BETA = "1";
  }

  return env;
}

/**
 * Run a single GABRIEL turn through the Claude Agent SDK.
 *
 * The SDK handles:
 *   - MCP server spawning (per .mcp.json in GABRIEL_HOME)
 *   - tool-use loops
 *   - prompt caching (character + memory cached across turns)
 *   - streaming
 *
 * What we add:
 *   - GABRIEL character as system prompt
 *   - model routing (Haiku / Sonnet / Opus per task shape)
 *   - simple timing + tier tagging for observability
 */
export async function runTurn(opts: GabrielTurnOptions): Promise<GabrielTurnResult> {
  const model = route(opts.input, opts.tier, opts.isVoice);
  const tier = tierOf(model);
  const systemPrompt = buildSystemPrompt();
  const started = Date.now();
  const telemetryEnv = buildTelemetryEnv(model, tier);

  let output = "";

  if (process.env.GABRIEL_FOSS_ONLY === "true" || !process.env.ANTHROPIC_API_KEY) {
    const localModel = tier === "FAST" ? "gemma3:latest" : "phi4:latest";
    const payload = {
      model: localModel,
      prompt: opts.input,
      system: systemPrompt,
      stream: false,
    };
    try {
      const res = await fetch("http://127.0.0.1:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(300000),
      });
      if (!res.ok) {
        throw new Error(`Ollama returned HTTP ${res.status}`);
      }
      const data = await res.json() as { response?: string };
      output = (data.response ?? "").trim();
      opts.onChunk?.(output);
    } catch (err) {
      output = `[FOSS Mode Error] Unable to generate response via local Ollama (${(err as Error).message}). Is Ollama running?`;
      opts.onChunk?.(output);
    }
    return {
      model: localModel,
      tier,
      output,
      durationMs: Date.now() - started,
    };
  }

  const response = query({
    prompt: opts.input,
    options: {
      model,
      systemPrompt,
      cwd: GABRIEL_HOME,
      ...(telemetryEnv ? { env: telemetryEnv } : {}),
      // .mcp.json in cwd is picked up automatically by the SDK
    },
  });

  for await (const message of response) {
    if (message.type === "assistant") {
      for (const block of message.message.content) {
        if (block.type === "text") {
          output += block.text;
          opts.onChunk?.(block.text);
        }
      }
    }
  }

  return {
    model,
    tier,
    output,
    durationMs: Date.now() - started,
  };
}
