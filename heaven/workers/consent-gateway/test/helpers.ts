// Test helpers for consent-gateway Vitest suite
// RSP_001 | NOIZY Empire | 2026

class MemoryKV {
  private store = new Map<string, string>();
  async get(key: string): Promise<string | null> {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  async put(key: string, value: string, _opts?: unknown): Promise<void> {
    this.store.set(key, value);
  }
  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
  async list(_opts?: unknown): Promise<{ keys: { name: string }[] }> {
    return { keys: Array.from(this.store.keys()).map(k => ({ name: k })) };
  }
}

class MemoryD1Statement {
  private args: unknown[] = [];
  constructor(private query: string) {}
  bind(...args: unknown[]) { this.args = args; return this; }
  async all() { return { results: [], success: true }; }
  async first() { return null; }
  async run() { return { success: true, meta: {} }; }
}

class MemoryD1 {
  // prepare() must be synchronous — worker chains .bind() immediately
  prepare(query: string) { return new MemoryD1Statement(query); }
  async exec(_query: string) { return { count: 0, duration: 0 }; }
  async batch(statements: unknown[]) { return statements.map(() => ({ results: [], success: true })); }
}

// ── Scriptable D1 mock for decision-matrix tests ──────────────────────────────

export interface ConsentRecord {
  id: string;
  creator_id: string;
  claimant_id: string;
  consent_status: string;
  dispute_status: string;
  revoked_at: string | null;
  usage_types_json: string;
  authorized_tools_json: string;
  scope_json: string;
  payment_terms_json: string;
  inheritance_rules_json: string;
  signature_json: string;
  provenance_required: number;
  term_start: string;
  term_end: string;
}

export interface CreatorRecord {
  id: string;
  status: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface ToolRecord {
  tool_name: string;
  clearance_status: string;
}

/** Returns a fully valid consent record with sensible defaults. */
export function makeConsentSeed(overrides: Partial<ConsentRecord> = {}): ConsentRecord {
  return {
    id: "consent-001",
    creator_id: "creator-001",
    claimant_id: "claimant-001",
    consent_status: "active",
    dispute_status: "none",
    revoked_at: null,
    usage_types_json: JSON.stringify(["synthesis", "training"]),
    authorized_tools_json: JSON.stringify([]),
    scope_json: JSON.stringify({ geographic: ["global"], exclusions: [] }),
    payment_terms_json: JSON.stringify({ creator_pct: 75, platform_pct: 25, currency: "USD" }),
    inheritance_rules_json: JSON.stringify({}),
    signature_json: JSON.stringify({}),
    provenance_required: 0,
    term_start: "2026-01-01T00:00:00Z",
    term_end: "2027-12-31T23:59:59Z",
    ...overrides,
  };
}

export interface D1Seed {
  creators?: CreatorRecord[];
  consent_records?: ConsentRecord[];
  revocation_events?: { id: string; consent_record_id: string; enforcement_status: string }[];
  tool_clearance_registry?: ToolRecord[];
  audit_log?: { id: string; object_id: string; [key: string]: unknown }[];
}

/** D1 mock that returns seeded rows based on query pattern matching. */
export function makeD1WithSeed(seed: D1Seed = {}) {
  return {
    prepare(query: string) {
      let boundArgs: unknown[] = [];
      return {
        bind(...args: unknown[]) { boundArgs = args; return this; },
        async first() {
          const q = query.toLowerCase();
          if (q.includes("from creators") && q.includes("hvs_records")) {
            return seed.creators?.find(r => r.hvs_id === boundArgs[0]) ?? null;
          }
          if (q.includes("from creators")) {
            return seed.creators?.find(r => r.id === boundArgs[0]) ?? null;
          }
          if (q.includes("from consent_records") && q.includes("creator_id")) {
            return seed.consent_records?.find(r =>
              r.creator_id === boundArgs[0] && r.claimant_id === boundArgs[1]
            ) ?? null;
          }
          if (q.includes("from consent_records")) {
            return seed.consent_records?.find(r => r.id === boundArgs[0]) ?? null;
          }
          if (q.includes("from revocation_events")) {
            return seed.revocation_events?.find(r =>
              r.consent_record_id === boundArgs[0]
            ) ?? null;
          }
          if (q.includes("from tool_clearance_registry")) {
            return seed.tool_clearance_registry?.find(r => r.tool_name === boundArgs[0]) ?? null;
          }
          return null;
        },
        async all() {
          const q = query.toLowerCase();
          if (q.includes("from audit_log")) {
            const results = (seed.audit_log || []).filter(r => r.object_id === boundArgs[0]);
            return { results, success: true };
          }
          return { results: [], success: true };
        },
        async run() { return { success: true, meta: {} }; },
      };
    },
    async exec() { return { count: 0, duration: 0 }; },
    async batch(statements: unknown[]) {
      return statements.map(() => ({ results: [], success: true }));
    },
  };
}

export function makeEnv(overrides: Record<string, unknown> = {}) {
  return {
    NOIZY_DB:             new MemoryD1() as unknown,
    NOIZY_KV:             new MemoryKV() as unknown,
    NOIZY_ENV:            "test",
    NOIZY_API_KEY:        "test-api-key-noizy",
    ENFORCEMENT_SLA_HOURS: "1",
    JWT_JWKS_URL:         undefined,
    JWT_ISSUER:           undefined,
    JWT_AUDIENCE:         undefined,
    ...overrides,
  };
}

function b64urlEncode(str: string): string {
  return Buffer.from(str, "utf8")
    .toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function makeBearerToken(
  payload: Record<string, unknown>,
  secret = "test-api-key-noizy"
): Promise<string> {
  const { createHmac } = await import("node:crypto");
  const payloadPart = b64urlEncode(JSON.stringify(payload));
  const sigHex = createHmac("sha256", secret).update(payloadPart).digest("hex");
  const sigPart = Buffer.from(sigHex, "hex").toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `Bearer ${payloadPart}.${sigPart}`;
}

export function makeRequest(
  path: string,
  opts: { method?: string; body?: unknown; headers?: Record<string, string> } = {}
): Request {
  const url = `https://consent.noizy.ai${path}`;
  return new Request(url, {
    method: opts.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
}
