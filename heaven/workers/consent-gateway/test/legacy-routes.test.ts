// Legacy v1 route tests — coverage for backward-compat endpoints
// RSP_001 | NOIZY Empire | 2026
//
// Routes covered:
//   POST /v1/check-eligibility  (aliases /verify)
//   GET  /v1/consent/:id        (full consent record by ID)
//   GET  /v1/audit/:asset_id    (audit history for creator/asset)

import { describe, it, expect } from "vitest";
import { makeEnv, makeRequest, makeConsentSeed, makeD1WithSeed } from "./helpers";

import worker from "../src/index.js";

const API_KEY = "test-api-key-noizy";

// ── POST /v1/check-eligibility ─────────────────────────────────────────────

describe("POST /v1/check-eligibility — legacy alias for /verify", () => {
  it("returns 401 without X-NOIZY-Key", async () => {
    const req = makeRequest("/v1/check-eligibility", {
      method: "POST",
      body: { creator_id: "c1", claimant_id: "cl1", action_type: "synthesis" },
    });
    const res = await (worker as any).fetch(req, makeEnv());
    expect(res.status).toBe(401);
  });

  it("returns 400 when required fields are missing", async () => {
    const req = makeRequest("/v1/check-eligibility", {
      method: "POST",
      headers: { "X-NOIZY-Key": API_KEY },
      body: { creator_id: "c1" }, // missing claimant_id and action_type
    });
    const res = await (worker as any).fetch(req, makeEnv());
    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body.error).toMatch(/claimant_id|required/i);
  });

  it("returns HOLD (not 401) when authed with unknown creator", async () => {
    const req = makeRequest("/v1/check-eligibility", {
      method: "POST",
      headers: { "X-NOIZY-Key": API_KEY },
      body: { creator_id: "unknown-creator", claimant_id: "cl1", action_type: "synthesis" },
    });
    const env = makeEnv({ NOIZY_DB: makeD1WithSeed({ creators: [] }) });
    const res = await (worker as any).fetch(req, env);
    expect(res.status).toBe(200);
    const json = await res.json() as any;
    // Identity not found → HOLD (not 401 — auth passed)
    expect(json.decision).toBe("HOLD");
    expect(json.reason_codes).toContain("IDENTITY_NOT_FOUND");
  });

  it("produces identical decision to /verify for the same input", async () => {
    const seed = {
      creators: [{ id: "c1", status: "active", updated_at: "2026-01-01T00:00:00Z" }],
      consent_records: [makeConsentSeed({ creator_id: "c1", claimant_id: "cl1" })],
    };
    const body = { creator_id: "c1", claimant_id: "cl1", action_type: "synthesis" };

    const [resVerify, resLegacy] = await Promise.all([
      (worker as any).fetch(
        makeRequest("/verify", { method: "POST", headers: { "X-NOIZY-Key": API_KEY }, body }),
        makeEnv({ NOIZY_DB: makeD1WithSeed(seed) }),
      ),
      (worker as any).fetch(
        makeRequest("/v1/check-eligibility", { method: "POST", headers: { "X-NOIZY-Key": API_KEY }, body }),
        makeEnv({ NOIZY_DB: makeD1WithSeed(seed) }),
      ),
    ]);

    const [jv, jl] = await Promise.all([resVerify.json() as any, resLegacy.json() as any]);
    expect(jv.decision).toBe(jl.decision);
    expect(jv.reason_codes).toEqual(jl.reason_codes);
  });
});

// ── GET /v1/consent/:id ────────────────────────────────────────────────────

describe("GET /v1/consent/:id — full consent record by ID", () => {
  it("returns 401 without auth", async () => {
    const req = makeRequest("/v1/consent/consent-001");
    const res = await (worker as any).fetch(req, makeEnv());
    expect(res.status).toBe(401);
  });

  it("returns 404 for a non-existent consent ID", async () => {
    const req = makeRequest("/v1/consent/nonexistent-id", {
      headers: { "X-NOIZY-Key": API_KEY },
    });
    const env = makeEnv({ NOIZY_DB: makeD1WithSeed({ consent_records: [] }) });
    const res = await (worker as any).fetch(req, env);
    expect(res.status).toBe(404);
  });

  it("returns 200 with normalized consent fields for existing record", async () => {
    const consent = makeConsentSeed({ id: "consent-abc" });
    const req = makeRequest("/v1/consent/consent-abc", {
      headers: { "X-NOIZY-Key": API_KEY },
    });
    const env = makeEnv({ NOIZY_DB: makeD1WithSeed({ consent_records: [consent] }) });
    const res = await (worker as any).fetch(req, env);
    expect(res.status).toBe(200);

    const json = await res.json() as any;
    expect(json.consent_record).toBeDefined();
    // Normalized arrays/objects — not raw JSON strings
    expect(Array.isArray(json.consent_record.usage_types)).toBe(true);
    expect(Array.isArray(json.consent_record.authorized_tools)).toBe(true);
    expect(typeof json.consent_record.scope).toBe("object");
    expect(typeof json.consent_record.payment_terms).toBe("object");
    // Raw JSON fields must NOT be present (sanitization check)
    expect(json.consent_record.usage_types_json).toBeUndefined();
    expect(json.consent_record.scope_json).toBeUndefined();
    expect(json.consent_record.payment_terms_json).toBeUndefined();
  });
});

// ── GET /v1/audit/:asset_id ────────────────────────────────────────────────

describe("GET /v1/audit/:asset_id — audit history", () => {
  it("returns 401 without auth", async () => {
    const req = makeRequest("/v1/audit/some-asset");
    const res = await (worker as any).fetch(req, makeEnv());
    expect(res.status).toBe(401);
  });

  it("returns 200 with empty audit_entries for asset with no history", async () => {
    const req = makeRequest("/v1/audit/asset-xyz", {
      headers: { "X-NOIZY-Key": API_KEY },
    });
    const env = makeEnv({ NOIZY_DB: makeD1WithSeed({ audit_log: [] }) });
    const res = await (worker as any).fetch(req, env);
    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(json.asset_id).toBe("asset-xyz");
    expect(json.audit_entries).toEqual([]);
    expect(json.count).toBe(0);
  });

  it("returns normalized audit entries with reason_codes as array (not JSON string)", async () => {
    const req = makeRequest("/v1/audit/asset-001", {
      headers: { "X-NOIZY-Key": API_KEY },
    });
    const env = makeEnv({
      NOIZY_DB: makeD1WithSeed({
        audit_log: [
          {
            id: "audit-1",
            object_id: "asset-001",
            actor_type: "claimant",
            actor_id: "cl-001",
            action: "check_eligibility:synthesis",
            decision: "ALLOW",
            reason_codes_json: JSON.stringify(["CONSENT_VALID", "SCOPE_VALID"]),
            metadata_json: JSON.stringify({ tool_name: "XTTS_v2" }),
            created_at: "2026-03-30T12:00:00Z",
          },
        ],
      }),
    });
    const res = await (worker as any).fetch(req, env);
    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(json.count).toBe(1);
    const entry = json.audit_entries[0];
    expect(Array.isArray(entry.reason_codes)).toBe(true);
    expect(entry.reason_codes).toContain("CONSENT_VALID");
    expect(typeof entry.metadata).toBe("object");
    // Raw JSON fields must NOT be present
    expect(entry.reason_codes_json).toBeUndefined();
    expect(entry.metadata_json).toBeUndefined();
  });
});
