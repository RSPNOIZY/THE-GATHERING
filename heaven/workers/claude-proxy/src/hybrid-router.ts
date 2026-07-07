/**
 * NOIZY.AI — Hybrid Model Router (Cost Optimizer)
 * Routes towers to LOCAL Ollama models (FREE) or CLOUD Anthropic (paid)
 *
 * Cost strategy:
 *   LOCAL (Ollama @ localhost:11434) — $0/request:
 *     fast  → gemma3:4b        (lightning fast, trivial queries)
 *     work  → llama3.2         (coordination, task routing)
 *     shirl → llama3.2         (audits, checklists — rule-based)
 *     cb01  → llama3.2         (consent checks — mostly deterministic)
 *
 *   CLOUD (Anthropic API) — paid, only when needed:
 *     max    → claude-opus-4-5   (strategic decisions, complex reasoning)
 *     code   → claude-sonnet-4-5 (code generation needs precision)
 *     lucy   → claude-opus-4-5   (creative requires nuance)
 *     pops   → claude-opus-4-5   (wisdom needs depth)
 *     dream  → claude-opus-4-5   (vision needs full context)
 *     heaven → claude-opus-4-5   (sovereign authority)
 *
 * Estimated savings: 40-60% of API costs
 * Force cloud: pass { provider: "anthropic" } in request body
 * Force local: pass { provider: "ollama" } in request body
 */

export interface HybridConfig {
  ollamaUrl: string;
  anthropicUrl: string;
  anthropicVersion: string;
}

export type Provider = 'ollama' | 'anthropic' | 'auto';

// Tower → default provider mapping
const TOWER_PROVIDER: Record<string, Provider> = {
  // LOCAL — FREE (Ollama on M2 Ultra)
  fast:  'ollama',
  work:  'ollama',
  shirl: 'ollama',
  cb01:  'ollama',

  // CLOUD — Anthropic API (paid, high-quality)
  max:    'anthropic',
  code:   'anthropic',
  lucy:   'anthropic',
  pops:   'anthropic',
  dream:  'anthropic',
  heaven: 'anthropic',
};

// Ollama model mapping for local towers (matched to loaded models on M2 Ultra)
const OLLAMA_MODELS: Record<string, string> = {
  fast:  'gemma3:latest',        // 3.3GB — loaded ✅
  work:  'llama3.2',             // 2.0GB — loaded ✅
  shirl: 'llama3.2',             // 2.0GB — loaded ✅
  cb01:  'llama3.2',             // 2.0GB — loaded ✅
  // Fallback for any tower forced to local
  max:    'llama3.1:70b',        // 42.5GB — loaded ✅ (M2 Ultra can handle it)
  code:   'qwen2.5-coder:7b',   // 4.7GB — loaded ✅
  lucy:   'mistral:latest',      // 4.4GB — loaded ✅
  pops:   'llama3.1:70b',        // 42.5GB — loaded ✅
  dream:  'llama3.1:70b',        // 42.5GB — loaded ✅
  heaven: 'llama3.1:70b',        // 42.5GB — loaded ✅
};

/**
 * Resolve which provider and model to use for a given tower + request
 */
export function resolveProvider(
  tower: string,
  explicitProvider?: Provider,
  explicitModel?: string,
): { provider: Provider; model: string } {
  // Explicit override always wins
  if (explicitProvider && explicitProvider !== 'auto') {
    if (explicitProvider === 'ollama') {
      return { provider: 'ollama', model: explicitModel ?? OLLAMA_MODELS[tower] ?? 'llama3.2' };
    }
    return { provider: 'anthropic', model: explicitModel ?? tower };
  }

  // Auto-route based on tower defaults
  const defaultProvider = TOWER_PROVIDER[tower] ?? 'anthropic';
  if (defaultProvider === 'ollama') {
    return { provider: 'ollama', model: OLLAMA_MODELS[tower] ?? 'llama3.2' };
  }
  return { provider: 'anthropic', model: explicitModel ?? tower };
}

/**
 * Call Ollama (local) — Anthropic Messages API compatible format → Ollama chat format
 */
export async function callOllama(
  ollamaUrl: string,
  model: string,
  system: string,
  messages: Array<{ role: string; content: string }>,
  maxTokens: number,
): Promise<{ response: Record<string, unknown>; provider: 'ollama'; cost: 0 }> {
  const ollamaMessages = [
    { role: 'system', content: system },
    ...messages,
  ];

  const res = await fetch(`${ollamaUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: ollamaMessages,
      stream: false,
      options: {
        num_predict: maxTokens,
        temperature: 0.7,
      },
    }),
  });

  const data = await res.json() as {
    message?: { content: string };
    eval_count?: number;
    prompt_eval_count?: number;
  };

  // Convert Ollama response → Anthropic Messages API format
  return {
    response: {
      id: `ollama-${Date.now()}`,
      type: 'message',
      role: 'assistant',
      model,
      content: [{ type: 'text', text: data.message?.content ?? '' }],
      usage: {
        input_tokens: data.prompt_eval_count ?? 0,
        output_tokens: data.eval_count ?? 0,
      },
      stop_reason: 'end_turn',
      _provider: 'ollama',
      _cost: 0,
    },
    provider: 'ollama',
    cost: 0,
  };
}

/**
 * Estimate API cost for an Anthropic request (rough, for logging)
 * Prices as of 2026-03: Opus $15/$75, Sonnet $3/$15, Haiku $0.25/$1.25
 * Per million tokens
 */
export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const pricing: Record<string, [number, number]> = {
    'opus':   [15.0, 75.0],
    'sonnet': [3.0, 15.0],
    'haiku':  [0.25, 1.25],
  };

  let tier: [number, number] = [3.0, 15.0]; // default to sonnet
  if (model.includes('opus')) tier = pricing['opus'];
  else if (model.includes('sonnet')) tier = pricing['sonnet'];
  else if (model.includes('haiku')) tier = pricing['haiku'];

  return (inputTokens * tier[0] / 1_000_000) + (outputTokens * tier[1] / 1_000_000);
}

/**
 * Generate a cost savings report
 */
export function costReport(stats: {
  ollamaCalls: number;
  anthropicCalls: number;
  totalCost: number;
  savedCost: number;
}): string {
  const totalCalls = stats.ollamaCalls + stats.anthropicCalls;
  const localPct = totalCalls > 0 ? (stats.ollamaCalls / totalCalls * 100).toFixed(0) : '0';
  return [
    `📊 NOIZY Cost Report`,
    `Local (Ollama):    ${stats.ollamaCalls} calls — $0.00`,
    `Cloud (Anthropic): ${stats.anthropicCalls} calls — $${stats.totalCost.toFixed(4)}`,
    `Savings:           $${stats.savedCost.toFixed(4)} (${localPct}% routed local)`,
    `Total calls:       ${totalCalls}`,
  ].join('\n');
}
