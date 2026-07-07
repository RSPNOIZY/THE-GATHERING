// Vitest unit tests — claude-proxy (noizy-claude-proxy)
// RSP_001 | NOIZY Empire | Dream Chamber — FULL CREW
// Tests: auth, tower routing, CORS, voice, crew, status, NCP, models, auto-detection
// Towers: max, code, work, fast, lucy, pops, dream, shirl, cb01, heaven

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock Env ──────────────────────────────────────────────────────────
class MemoryKV {
  private store = new Map<string, string>();
  async get(key: string) { return this.store.get(key) ?? null; }
  async put(key: string, value: string, _opts?: unknown) { this.store.set(key, value); }
}

class MemoryD1Statement {
  constructor(private query: string) {}
  bind(..._args: unknown[]) { return this; }
  async first() { return null; }
  async run() { return { success: true, meta: {} }; }
}

class MemoryD1 {
  prepare(query: string) { return new MemoryD1Statement(query); }
}

function makeEnv(overrides: Record<string, unknown> = {}) {
  return {
    ANTHROPIC_API_KEY: "test-anthropic-key",
    NOIZY_SECRET: "test-secret-key",
    NOIZY_DB: new MemoryD1(),
    NOIZY_KV: new MemoryKV(),
    VOICE_BUCKET: null,
    ENVIRONMENT: "test",
    ...overrides,
  };
}

function makeRequest(
  path: string,
  opts: { method?: string; body?: unknown; headers?: Record<string, string> } = {}
): Request {
  return new Request(`https://noizy-claude-proxy.workers.dev${path}`, {
    method: opts.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
}

function mockAnthropicFetch(model?: string) {
  const mockFetch = vi.fn(async () =>
    new Response(JSON.stringify({
      content: [{ text: "hello" }],
      model: model ?? "claude-sonnet-4-5-20250220",
      usage: { input_tokens: 100, output_tokens: 50 },
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  );
  vi.stubGlobal("fetch", mockFetch);
  return mockFetch;
}

// ── Import worker ─────────────────────────────────────────────────────
import worker from "../src/index.ts";

const ENV = makeEnv();
const SECRET = "test-secret-key";

// ── Auth Tests ────────────────────────────────────────────────────────

describe("Auth enforcement", () => {
  it("rejects /claude/messages without auth header", async () => {
    const req = makeRequest("/claude/messages", {
      method: "POST",
      body: { messages: [{ role: "user", content: "test" }] },
    });
    const res = await (worker as any).fetch(req, ENV);
    expect(res.status).toBe(401);
  });

  it("accepts /claude/messages with X-NOIZY-Secret", async () => {
    const mockFetch = mockAnthropicFetch();
    const req = makeRequest("/claude/messages", {
      method: "POST",
      headers: { "X-NOIZY-Secret": SECRET },
      body: { tower: "max", messages: [{ role: "user", content: "test" }] },
    });
    const res = await (worker as any).fetch(req, ENV);
    expect(res.status).toBe(200);
    vi.restoreAllMocks();
  });

  it("accepts /claude/messages with Bearer token", async () => {
    const mockFetch = mockAnthropicFetch();
    const req = makeRequest("/claude/messages", {
      method: "POST",
      headers: { "Authorization": `Bearer ${SECRET}` },
      body: { tower: "code", messages: [{ role: "user", content: "test" }] },
    });
    const res = await (worker as any).fetch(req, ENV);
    expect(res.status).toBe(200);
    vi.restoreAllMocks();
  });
});

// ── Public Endpoints ──────────────────────────────────────────────────

describe("Public endpoints — no auth required", () => {
  it("GET /health returns alive status with API version", async () => {
    const req = makeRequest("/health");
    const res = await (worker as any).fetch(req, ENV);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.status).toBe("alive");
    expect(body.ts).toBeDefined();
    expect(body.api_version).toBeDefined();
  });

  it("GET /status returns empire info with all 10 towers", async () => {
    const req = makeRequest("/status");
    const res = await (worker as any).fetch(req, ENV);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.empire).toBe("NOIZY.AI");
    expect(body.protocol).toContain("GORUNFREE");
    expect(body.services).toBeDefined();
    expect(body.towers).toBeDefined();
    expect(body.api_version).toBe("2023-06-01");
    // Verify all 10 towers are present
    const towerNames = Object.keys(body.towers);
    expect(towerNames).toContain("max");
    expect(towerNames).toContain("code");
    expect(towerNames).toContain("work");
    expect(towerNames).toContain("fast");
    expect(towerNames).toContain("lucy");
    expect(towerNames).toContain("pops");
    expect(towerNames).toContain("dream");
    expect(towerNames).toContain("shirl");
    expect(towerNames).toContain("cb01");
    expect(towerNames).toContain("heaven");
    expect(towerNames.length).toBe(10);
  });

  it("GET / returns empire routing info with all tower names", async () => {
    const req = makeRequest("/");
    const res = await (worker as any).fetch(req, ENV);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.empire).toBe("NOIZY.AI");
    expect(body.towers).toContain("max");
    expect(body.towers).toContain("lucy");
    expect(body.towers).toContain("pops");
    expect(body.towers).toContain("heaven");
    expect(body.routes).toContain("/models");
  });

  it("GET /models returns full model catalog and tower configs", async () => {
    const req = makeRequest("/models");
    const res = await (worker as any).fetch(req, ENV);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.api_version).toBeDefined();
    expect(body.models).toBeDefined();
    expect(body.models.length).toBeGreaterThanOrEqual(3); // at least opus, sonnet, haiku
    expect(body.towers.length).toBe(10); // all towers
    // Verify model tiers
    const modelKeys = body.models.map((m: any) => m.key);
    expect(modelKeys).toContain("claude-opus-4-5");
    expect(modelKeys).toContain("claude-sonnet-4-5");
    expect(modelKeys).toContain("claude-haiku-3-5");
  });
});

// ── CORS ──────────────────────────────────────────────────────────────

describe("CORS handling", () => {
  it("OPTIONS returns 204 with CORS headers", async () => {
    const req = new Request("https://noizy-claude-proxy.workers.dev/claude/messages", {
      method: "OPTIONS",
    });
    const res = await (worker as any).fetch(req, ENV);
    expect(res.status).toBe(204);
  });

  it("responses include CORS headers", async () => {
    const req = makeRequest("/health");
    const res = await (worker as any).fetch(req, ENV);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});

// ── Voice Ingest ──────────────────────────────────────────────────────

describe("POST /voice/ingest — voice pipeline", () => {
  it("requires auth", async () => {
    const req = makeRequest("/voice/ingest", {
      method: "POST",
      body: { transcript: "test", source: "iphone" },
    });
    const res = await (worker as any).fetch(req, ENV);
    expect(res.status).toBe(401);
  });

  it("accepts voice transcript with auth and auto-detects tower", async () => {
    const req = makeRequest("/voice/ingest", {
      method: "POST",
      headers: { "X-NOIZY-Secret": SECRET },
      body: { transcript: "deploy the consent gateway", source: "iphone", duration: 3.2 },
    });
    const res = await (worker as any).fetch(req, ENV);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.received).toBe(true);
    expect(body.transcript).toBe("deploy the consent gateway");
    expect(body.tower).toBe("code"); // "deploy" triggers code tower
  });
});

// ── Crew Broadcast ────────────────────────────────────────────────────

describe("POST /crew/broadcast — crew coordination", () => {
  it("requires auth", async () => {
    const req = makeRequest("/crew/broadcast", {
      method: "POST",
      body: { message: "test", from: "max" },
    });
    const res = await (worker as any).fetch(req, ENV);
    expect(res.status).toBe(401);
  });

  it("broadcasts to ALL crew members with auth", async () => {
    const req = makeRequest("/crew/broadcast", {
      method: "POST",
      headers: { "X-NOIZY-Secret": SECRET },
      body: { message: "status check all towers", from: "RSP_001" },
    });
    const res = await (worker as any).fetch(req, ENV);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.broadcast).toBe(true);
    expect(body.crew).toContain("max");
    expect(body.crew).toContain("code");
    expect(body.crew).toContain("work");
  });
});

// ── NCP Consent Check ─────────────────────────────────────────────────

describe("POST /ncp/consent — consent enforcement", () => {
  it("requires auth", async () => {
    const req = makeRequest("/ncp/consent", {
      method: "POST",
      body: { actor_id: "RSP_001", use_case: "synthesis", tool: "XTTS_v2" },
    });
    const res = await (worker as any).fetch(req, ENV);
    expect(res.status).toBe(401);
  });

  it("returns consent decision with auth", async () => {
    const req = makeRequest("/ncp/consent", {
      method: "POST",
      headers: { "X-NOIZY-Secret": SECRET },
      body: { actor_id: "RSP_001", use_case: "synthesis", tool: "XTTS_v2" },
    });
    const res = await (worker as any).fetch(req, ENV);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.actor_id).toBe("RSP_001");
    expect(body.decision).toBeDefined();
    expect(["ALLOW", "DENY", "HOLD"]).toContain(body.decision);
    expect(body.ts).toBeDefined();
  });
});

// ── Tower Auto-Detection ──────────────────────────────────────────────

describe("Tower auto-detection — all 10 towers", () => {
  it("detects CODE tower from build/deploy keywords", async () => {
    const mock = mockAnthropicFetch();
    const req = makeRequest("/claude/messages", {
      method: "POST",
      headers: { "X-NOIZY-Secret": SECRET },
      body: { messages: [{ role: "user", content: "deploy the typescript worker" }] },
    });
    await (worker as any).fetch(req, ENV);
    const calledBody = JSON.parse(mock.mock.calls[0][1].body);
    expect(calledBody.model).toMatch(/claude-sonnet/); // code tower = sonnet
    vi.restoreAllMocks();
  });

  it("detects LUCY tower from design/brand keywords", async () => {
    const mock = mockAnthropicFetch();
    const req = makeRequest("/claude/messages", {
      method: "POST",
      headers: { "X-NOIZY-Secret": SECRET },
      body: { messages: [{ role: "user", content: "design the landing page hero section" }] },
    });
    await (worker as any).fetch(req, ENV);
    const calledBody = JSON.parse(mock.mock.calls[0][1].body);
    expect(calledBody.model).toMatch(/claude-opus/); // lucy = opus
    vi.restoreAllMocks();
  });

  it("detects CB01 tower from consent keywords", async () => {
    const mock = mockAnthropicFetch();
    const req = makeRequest("/claude/messages", {
      method: "POST",
      headers: { "X-NOIZY-Secret": SECRET },
      body: { messages: [{ role: "user", content: "check consent status for voice DNA revocation" }] },
    });
    await (worker as any).fetch(req, ENV);
    // CB01 routes to Ollama (local, FREE) by default
    // The mock fetch catches Ollama's /api/chat call
    const calledBody = JSON.parse(mock.mock.calls[0][1].body);
    expect(calledBody.model).toBe("llama3.2"); // cb01 = ollama local
    vi.restoreAllMocks();
  });

  it("detects SHIRL tower from audit/review keywords", async () => {
    const mock = mockAnthropicFetch();
    const req = makeRequest("/claude/messages", {
      method: "POST",
      headers: { "X-NOIZY-Secret": SECRET },
      body: { messages: [{ role: "user", content: "audit the deployment checklist for quality regression" }] },
    });
    await (worker as any).fetch(req, ENV);
    const calledBody = JSON.parse(mock.mock.calls[0][1].body);
    expect(calledBody.model).toMatch(/claude-sonnet/); // shirl = sonnet
    vi.restoreAllMocks();
  });

  it("detects POPS tower from wisdom keywords", async () => {
    const mock = mockAnthropicFetch();
    const req = makeRequest("/claude/messages", {
      method: "POST",
      headers: { "X-NOIZY-Secret": SECRET },
      body: { messages: [{ role: "user", content: "I need your wisdom and perspective on this legacy decision" }] },
    });
    await (worker as any).fetch(req, ENV);
    const calledBody = JSON.parse(mock.mock.calls[0][1].body);
    expect(calledBody.model).toMatch(/claude-opus/); // pops = opus
    vi.restoreAllMocks();
  });

  it("detects DREAM tower from vision keywords", async () => {
    const mock = mockAnthropicFetch();
    const req = makeRequest("/claude/messages", {
      method: "POST",
      headers: { "X-NOIZY-Secret": SECRET },
      body: { messages: [{ role: "user", content: "synthesize the big picture roadmap for the future" }] },
    });
    await (worker as any).fetch(req, ENV);
    const calledBody = JSON.parse(mock.mock.calls[0][1].body);
    expect(calledBody.model).toMatch(/claude-opus/); // dream = opus
    vi.restoreAllMocks();
  });

  it("detects HEAVEN tower from sovereignty keywords", async () => {
    const mock = mockAnthropicFetch();
    const req = makeRequest("/claude/messages", {
      method: "POST",
      headers: { "X-NOIZY-Secret": SECRET },
      body: { messages: [{ role: "user", content: "what does the sovereign doctrine say about this protocol" }] },
    });
    await (worker as any).fetch(req, ENV);
    const calledBody = JSON.parse(mock.mock.calls[0][1].body);
    expect(calledBody.model).toMatch(/claude-opus/); // heaven = opus
    vi.restoreAllMocks();
  });

  it("defaults to MAX tower for unmatched queries", async () => {
    const mock = mockAnthropicFetch();
    const req = makeRequest("/claude/messages", {
      method: "POST",
      headers: { "X-NOIZY-Secret": SECRET },
      body: { messages: [{ role: "user", content: "tell me something interesting about octopuses" }] },
    });
    await (worker as any).fetch(req, ENV);
    const calledBody = JSON.parse(mock.mock.calls[0][1].body);
    expect(calledBody.model).toMatch(/claude-opus/); // max fallback = opus
    vi.restoreAllMocks();
  });
});

// ── Extended Thinking ─────────────────────────────────────────────────

describe("Extended thinking support", () => {
  it("enables extended thinking for MAX tower by default", async () => {
    const mock = mockAnthropicFetch();
    const req = makeRequest("/claude/messages", {
      method: "POST",
      headers: { "X-NOIZY-Secret": SECRET },
      body: { tower: "max", messages: [{ role: "user", content: "think deeply" }] },
    });
    await (worker as any).fetch(req, ENV);
    const calledBody = JSON.parse(mock.mock.calls[0][1].body);
    expect(calledBody.thinking).toBeDefined();
    expect(calledBody.thinking.type).toBe("enabled");
    expect(calledBody.thinking.budget_tokens).toBe(10000);
    expect(calledBody.temperature).toBe(1); // required for thinking
    // Check beta header
    const calledHeaders = mock.mock.calls[0][1].headers;
    expect(calledHeaders["anthropic-beta"]).toContain("thinking");
    vi.restoreAllMocks();
  });

  it("does NOT enable extended thinking for FAST tower", async () => {
    const mock = mockAnthropicFetch();
    const req = makeRequest("/claude/messages", {
      method: "POST",
      headers: { "X-NOIZY-Secret": SECRET },
      body: { tower: "fast", messages: [{ role: "user", content: "quick check" }] },
    });
    await (worker as any).fetch(req, ENV);
    const calledBody = JSON.parse(mock.mock.calls[0][1].body);
    expect(calledBody.thinking).toBeUndefined();
    vi.restoreAllMocks();
  });

  it("allows explicit model override via body.model", async () => {
    const mock = mockAnthropicFetch();
    const req = makeRequest("/claude/messages", {
      method: "POST",
      headers: { "X-NOIZY-Secret": SECRET },
      body: {
        tower: "fast",
        model: "claude-opus-4-5",
        provider: "anthropic", // force cloud to test model override
        messages: [{ role: "user", content: "use opus explicitly" }],
      },
    });
    await (worker as any).fetch(req, ENV);
    const calledBody = JSON.parse(mock.mock.calls[0][1].body);
    expect(calledBody.model).toBe("claude-opus-4-5-20250220"); // resolved from catalog via forced anthropic
    vi.restoreAllMocks();
  });
});

// ── Response Headers ──────────────────────────────────────────────────

describe("Response headers — tower and model info", () => {
  it("includes x-noizy-tower and x-noizy-model headers", async () => {
    const mock = mockAnthropicFetch();
    const req = makeRequest("/claude/messages", {
      method: "POST",
      headers: { "X-NOIZY-Secret": SECRET },
      body: { tower: "lucy", messages: [{ role: "user", content: "test" }] },
    });
    const res = await (worker as any).fetch(req, ENV);
    expect(res.headers.get("x-noizy-tower")).toBe("lucy");
    expect(res.headers.get("x-noizy-model")).toMatch(/claude-opus/);
    vi.restoreAllMocks();
  });
});

// ── Service Binding Status ────────────────────────────────────────────

describe("Service binding status reporting", () => {
  it("reports all services bound when env is complete", async () => {
    const req = makeRequest("/status");
    const res = await (worker as any).fetch(req, ENV);
    const body = await res.json() as any;
    expect(body.services.anthropic).toBe("key_present");
    expect(body.services.d1).toBe("bound");
    expect(body.services.kv).toBe("bound");
    expect(body.models.length).toBeGreaterThanOrEqual(3);
  });

  it("reports missing services when env is incomplete", async () => {
    const sparseEnv = makeEnv({
      ANTHROPIC_API_KEY: "",
      NOIZY_DB: null,
      NOIZY_KV: null,
    });
    const req = makeRequest("/status");
    const res = await (worker as any).fetch(req, sparseEnv);
    const body = await res.json() as any;
    expect(body.services.anthropic).toBe("missing");
    expect(body.services.d1).toBe("unbound");
    expect(body.services.kv).toBe("unbound");
  });
});

// ── Gospel Endpoints ──────────────────────────────────────────────────

describe("Gospel — NOIZY Doctrine", () => {
  it("GET /gospel returns mission, Never Clauses, and Plowman Standard (no auth)", async () => {
    const req = makeRequest("/gospel");
    const res = await (worker as any).fetch(req, ENV);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.mission).toContain("NOIZY.AI");
    expect(body.mission).toContain("Consent-native");
    expect(body.mission).toContain("Your voice matters");
    expect(body.standard).toContain("75%");
    expect(body.protocol).toBe("GORUNFREE");
    expect(body.founder).toContain("RSP_001");
    expect(body.never_clauses).toBeDefined();
    expect(body.never_clauses.length).toBe(9);
    expect(body.enforced_by).toContain("HEAVEN");
    expect(body.enforced_by).toContain("CB01");
  });

  it("GET /never-clauses returns all 9 immovable clauses (no auth)", async () => {
    const req = makeRequest("/never-clauses");
    const res = await (worker as any).fetch(req, ENV);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.count).toBe(9);
    expect(body.enforcement).toContain("no exception");
    expect(body.clauses.length).toBe(9);
    // Every clause is immovable
    expect(body.clauses.every((c: any) => c.immovable === true)).toBe(true);
    // Key clauses present
    const texts = body.clauses.map((c: any) => c.clause);
    expect(texts.some((t: string) => t.includes("consent"))).toBe(true);
    expect(texts.some((t: string) => t.includes("75%"))).toBe(true);
    expect(texts.some((t: string) => t.includes("provenance"))).toBe(true);
    expect(texts.some((t: string) => t.includes("revoke"))).toBe(true);
  });

  it("/gospel endpoint is public (no auth required)", async () => {
    // No X-NOIZY-Secret header — should still return 200
    const env = makeEnv();
    const req = new Request("https://noizy-claude-proxy.workers.dev/gospel");
    const res = await (worker as any).fetch(req, env);
    expect(res.status).toBe(200);
  });

  it("root / route includes gospel and never-clauses in routes list", async () => {
    const req = makeRequest("/");
    const res = await (worker as any).fetch(req, ENV);
    const body = await res.json() as any;
    expect(body.routes).toContain("/gospel");
    expect(body.routes).toContain("/never-clauses");
  });
});
