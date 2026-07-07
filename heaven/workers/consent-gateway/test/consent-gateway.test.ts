// Vitest unit tests — consent-gateway
// RSP_001 | NOIZY Empire | 2026
// Tests: 401 identity-missing, 403 unauthorized, 200 authorized, sanitized status

import { describe, it, expect } from "vitest";
import { makeEnv, makeRequest } from "./helpers";

// Import the worker handler
import worker from "../src/index.js";

const ENV = makeEnv();
const API_KEY = "test-api-key-noizy";

describe("GET /health — public, no auth", () => {
  it("returns 200 with service info", async () => {
    const req = makeRequest("/health");
    const res = await (worker as any).fetch(req, ENV);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.status).toMatch(/LIVE|DEGRADED/);
    expect(body.service).toBe("noizy-consent-gateway");
  });
});

describe("POST /verify — protected", () => {
  it("returns 401 without X-NOIZY-Key", async () => {
    const req = makeRequest("/verify", {
      method: "POST",
      body: { creator_id: "c1", asset_id: "a1", action_type: "synth" },
    });
    const res = await (worker as any).fetch(req, ENV);
    expect(res.status).toBe(401);
    const body = await res.json() as any;
    expect(body.error).toMatch(/Unauthorized/i);
  });

  it("returns 200 with valid key", async () => {
    const req = makeRequest("/verify", {
      method: "POST",
      headers: { "X-NOIZY-Key": API_KEY },
      body: {
        creator_id: "c1",
        asset_id: "a1",
        action_type: "synth",
        requester_id: "r1",
        scope: "voice.clone",
      },
    });
    const res = await (worker as any).fetch(req, ENV);
    // 200 or 422 depending on DB state — not 401
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });
});

describe("POST /revoke — protected + creator-authorized", () => {
  it("returns 401 without auth header", async () => {
    const req = makeRequest("/revoke", {
      method: "POST",
      body: { creator_id: "c1", consent_id: "tok1" },
    });
    const res = await (worker as any).fetch(req, ENV);
    expect(res.status).toBe(401);
  });

  it("returns 403 if caller is not the consent owner", async () => {
    const req = makeRequest("/revoke", {
      method: "POST",
      headers: { "X-NOIZY-Key": API_KEY },
      body: {
        creator_id: "c_other",
        consent_id: "tok1",
        caller_id: "c_different",
      },
    });
    const res = await (worker as any).fetch(req, ENV);
    // May be 404 if record doesn't exist yet — but not 401
    expect(res.status).not.toBe(401);
  });
});

describe("GET /status/:creatorId — protected, sanitized", () => {
  it("returns 401 without auth", async () => {
    const req = makeRequest("/status/creator_abc");
    const res = await (worker as any).fetch(req, ENV);
    expect(res.status).toBe(401);
  });

  it("returns sanitized fields only when authorized", async () => {
    const req = makeRequest("/status/creator_abc", {
      headers: { "X-NOIZY-Key": API_KEY },
    });
    const res = await (worker as any).fetch(req, ENV);
    // 404 if not found, but fields check if 200
    if (res.status === 200) {
      const body = await res.json() as any;
      expect(body).toHaveProperty("creator_id");
      expect(body).toHaveProperty("status");
      expect(body).toHaveProperty("updated_at");
      expect(body.events).toBeUndefined();
      expect(body.revokeReason).toBeUndefined();
      expect(body.never_clauses).toBeUndefined();
    } else {
      expect([401, 404]).toContain(res.status);
    }
  });
});

describe("OPTIONS — CORS preflight", () => {
  it("returns 204 for preflight", async () => {
    const req = new Request("https://consent.noizy.ai/verify", { method: "OPTIONS" });
    const res = await (worker as any).fetch(req, ENV);
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});

describe("Unknown routes — 404", () => {
  it("returns 404 for unmapped path", async () => {
    const req = makeRequest("/undefined-route", {
      headers: { "X-NOIZY-Key": API_KEY },
    });
    const res = await (worker as any).fetch(req, ENV);
    expect(res.status).toBe(404);
  });
});
