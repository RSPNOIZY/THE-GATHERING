// Decision Matrix unit tests — all 10 checks + ALLOW path
// RSP_001 | NOIZY Empire | 2026
//
// Strategy: POST /verify with a seeded D1. Each test exercises one
// decision branch of runDecisionMatrix() via the full HTTP handler.
// Covers every outcome: DENY · HOLD · ESCALATE · ALLOW

import { describe, it, expect } from "vitest";
import { makeEnv, makeRequest, makeConsentSeed, makeD1WithSeed } from "./helpers";

import worker from "../src/index.js";

const API_KEY = "test-api-key-noizy";
const CREATOR  = { id: "creator-001", status: "active", updated_at: "2026-01-01T00:00:00Z" };
const BASE_BODY = {
  creator_id:  "creator-001",
  claimant_id: "claimant-001",
  action_type: "synthesis",
};

function makeVerifyReq(body: Record<string, unknown>) {
  return makeRequest("/verify", {
    method: "POST",
    headers: { "X-NOIZY-Key": API_KEY },
    body,
  });
}

async function verify(seed: Parameters<typeof makeD1WithSeed>[0], body = BASE_BODY) {
  const env = makeEnv({ NOIZY_DB: makeD1WithSeed(seed) });
  const res = await (worker as any).fetch(makeVerifyReq(body), env);
  const json = await res.json() as any;
  return { status: res.status, json };
}

// ── DENY paths ────────────────────────────────────────────────────────────────

describe("Check 1 — identity not found → HOLD", () => {
  it("returns HOLD when creator does not exist in DB", async () => {
    const { status, json } = await verify({ creators: [] });
    expect(status).toBe(200);
    expect(json.decision).toBe("HOLD");
    expect(json.reason_codes).toContain("IDENTITY_NOT_FOUND");
  });
});

describe("Check 2 — consent not found → DENY", () => {
  it("returns DENY when no consent record exists for this creator+claimant pair", async () => {
    const { status, json } = await verify({
      creators: [CREATOR],
      consent_records: [], // no record
    });
    expect(status).toBe(200);
    expect(json.decision).toBe("DENY");
    expect(json.reason_codes).toContain("CONSENT_NOT_FOUND");
  });
});

describe("Check 10 — revocation overrides status → DENY", () => {
  it("returns DENY when revoked_at is set on the consent record", async () => {
    const { status, json } = await verify({
      creators: [CREATOR],
      consent_records: [makeConsentSeed({ revoked_at: "2026-02-01T00:00:00Z" })],
    });
    expect(status).toBe(200);
    expect(json.decision).toBe("DENY");
    expect(json.reason_codes).toContain("CONSENT_REVOKED");
  });

  it("returns DENY when an active revocation event exists", async () => {
    const { status, json } = await verify({
      creators: [CREATOR],
      consent_records: [makeConsentSeed()],
      revocation_events: [
        { id: "rev-001", consent_record_id: "consent-001", enforcement_status: "pending" },
      ],
    });
    expect(status).toBe(200);
    expect(json.decision).toBe("DENY");
    expect(json.reason_codes).toContain("CONSENT_REVOKED");
  });
});

describe("Check 3 — consent status not active → DENY", () => {
  it("returns DENY with CONSENT_EXPIRED for expired status", async () => {
    const { status, json } = await verify({
      creators: [CREATOR],
      consent_records: [makeConsentSeed({ consent_status: "expired" })],
    });
    expect(status).toBe(200);
    expect(json.decision).toBe("DENY");
    expect(json.reason_codes).toContain("CONSENT_EXPIRED");
  });

  it("returns DENY with CONSENT_INACTIVE for draft status", async () => {
    const { status, json } = await verify({
      creators: [CREATOR],
      consent_records: [makeConsentSeed({ consent_status: "draft" })],
    });
    expect(status).toBe(200);
    expect(json.decision).toBe("DENY");
    expect(json.reason_codes).toContain("CONSENT_INACTIVE");
  });
});

describe("Check 9 — dispute present → ESCALATE", () => {
  it("returns ESCALATE when dispute_status is not 'none'", async () => {
    const { status, json } = await verify({
      creators: [CREATOR],
      consent_records: [makeConsentSeed({ dispute_status: "open" })],
    });
    expect(status).toBe(200);
    expect(json.decision).toBe("ESCALATE");
    expect(json.reason_codes).toContain("DISPUTED_RIGHTS_ASSERTION");
  });
});

describe("Check 4 — scope validation → DENY", () => {
  it("returns DENY when action_type is in the exclusions list", async () => {
    const { status, json } = await verify({
      creators: [CREATOR],
      consent_records: [makeConsentSeed({
        scope_json: JSON.stringify({ geographic: ["global"], exclusions: ["synthesis"] }),
      })],
    });
    expect(status).toBe(200);
    expect(json.decision).toBe("DENY");
    expect(json.reason_codes).toContain("USAGE_EXCLUDED_BY_SCOPE");
  });

  it("returns DENY when action_type is not in usage_types", async () => {
    const { status, json } = await verify({
      creators: [CREATOR],
      consent_records: [makeConsentSeed({
        usage_types_json: JSON.stringify(["training"]), // synthesis NOT allowed
      })],
    });
    expect(status).toBe(200);
    expect(json.decision).toBe("DENY");
    expect(json.reason_codes).toContain("USAGE_NOT_IN_SCOPE");
  });

  it("returns DENY when territory is not authorized", async () => {
    const { status, json } = await verify(
      {
        creators: [CREATOR],
        consent_records: [makeConsentSeed({
          scope_json: JSON.stringify({ geographic: ["US"], exclusions: [] }),
        })],
      },
      { ...BASE_BODY, requested_scope: { territory: "CA" } },
    );
    expect(status).toBe(200);
    expect(json.decision).toBe("DENY");
    expect(json.reason_codes).toContain("TERRITORY_NOT_AUTHORIZED");
  });
});

describe("Check 5 — time validity → DENY", () => {
  it("returns DENY when consent has not yet taken effect", async () => {
    const { status, json } = await verify({
      creators: [CREATOR],
      consent_records: [makeConsentSeed({
        term_start: "2030-01-01T00:00:00Z",
        term_end:   "2031-01-01T00:00:00Z",
      })],
    });
    expect(status).toBe(200);
    expect(json.decision).toBe("DENY");
    expect(json.reason_codes).toContain("CONSENT_NOT_YET_EFFECTIVE");
  });

  it("returns DENY when consent term has ended", async () => {
    const { status, json } = await verify({
      creators: [CREATOR],
      consent_records: [makeConsentSeed({
        term_start: "2020-01-01T00:00:00Z",
        term_end:   "2021-01-01T00:00:00Z",
      })],
    });
    expect(status).toBe(200);
    expect(json.decision).toBe("DENY");
    expect(json.reason_codes).toContain("CONSENT_EXPIRED");
  });
});

// ── HOLD paths ────────────────────────────────────────────────────────────────

describe("Check 6 — tool authorization → HOLD/DENY", () => {
  it("returns HOLD when tool is not in the clearance registry", async () => {
    const { status, json } = await verify(
      {
        creators: [CREATOR],
        consent_records: [makeConsentSeed()],
        tool_clearance_registry: [], // tool unknown
      },
      { ...BASE_BODY, tool_name: "UnknownTool_v9" },
    );
    expect(status).toBe(200);
    expect(json.decision).toBe("HOLD");
    expect(json.reason_codes).toContain("TOOL_UNKNOWN");
  });

  it("returns DENY when tool is explicitly blocked", async () => {
    const { status, json } = await verify(
      {
        creators: [CREATOR],
        consent_records: [makeConsentSeed()],
        tool_clearance_registry: [{ tool_name: "BlockedSynth_v1", clearance_status: "blocked" }],
      },
      { ...BASE_BODY, tool_name: "BlockedSynth_v1" },
    );
    expect(status).toBe(200);
    expect(json.decision).toBe("DENY");
    expect(json.reason_codes).toContain("TOOL_BLOCKED");
  });
});

describe("Check 8 — royalty route → HOLD", () => {
  it("returns HOLD when commercial use is requested but no creator_pct defined", async () => {
    const { status, json } = await verify(
      {
        creators: [CREATOR],
        consent_records: [makeConsentSeed({
          payment_terms_json: JSON.stringify({}), // missing creator_pct
        })],
      },
      { ...BASE_BODY, requested_scope: { commercial: true } },
    );
    expect(status).toBe(200);
    expect(json.decision).toBe("HOLD");
    expect(json.reason_codes).toContain("ROYALTY_ROUTE_NOT_READY");
  });
});

// ── ALLOW path ────────────────────────────────────────────────────────────────

describe("Full ALLOW — all 10 checks pass", () => {
  it("returns ALLOW with correct royalty terms on a clean consent record", async () => {
    const { status, json } = await verify({
      creators: [CREATOR],
      consent_records: [makeConsentSeed()],
    });
    expect(status).toBe(200);
    expect(json.decision).toBe("ALLOW");
    expect(json.reason_codes).toContain("CONSENT_VALID");
    expect(json.reason_codes).toContain("SCOPE_VALID");
    // Royalty terms always present on ALLOW
    expect(json.payment_terms.creator_pct).toBe(75);
    expect(json.payment_terms.platform_pct).toBe(25);
  });

  it("ALLOW includes ROYALTY_ROUTE_READY for commercial use with valid payment_terms", async () => {
    const { status, json } = await verify(
      {
        creators: [CREATOR],
        consent_records: [makeConsentSeed()],
      },
      { ...BASE_BODY, requested_scope: { commercial: true } },
    );
    expect(status).toBe(200);
    expect(json.decision).toBe("ALLOW");
    expect(json.reason_codes).toContain("ROYALTY_ROUTE_READY");
  });

  it("ALLOW includes TOOL_AUTHORIZED when tool passes clearance", async () => {
    const { status, json } = await verify(
      {
        creators: [CREATOR],
        consent_records: [makeConsentSeed()],
        tool_clearance_registry: [{ tool_name: "XTTS_v2", clearance_status: "approved" }],
      },
      { ...BASE_BODY, tool_name: "XTTS_v2" },
    );
    expect(status).toBe(200);
    expect(json.decision).toBe("ALLOW");
    expect(json.reason_codes).toContain("TOOL_AUTHORIZED");
  });
});
