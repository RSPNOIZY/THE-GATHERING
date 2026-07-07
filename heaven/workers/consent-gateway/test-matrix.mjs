/**
 * NOIZY Consent Gateway — Decision Matrix Trace Verifier
 *
 * Traces all 10 test cases from consent-decision-cases.json through the
 * decision matrix logic. No network calls — pure logic verification.
 *
 * Run: node test-matrix.mjs
 */

import { readFileSync } from "fs";

const cases = JSON.parse(
  readFileSync("../../tests/runtime/consent-decision-cases.json", "utf-8"),
).cases;

// ── Simulated DB state per test case ──────────────────────────────────────────

const DB_STATE = {
  creators: {
    RSP_001: { id: "RSP_001", legal_name: "Robert Stephen Plowman", status: "active" },
    CREATOR_A: { id: "CREATOR_A", legal_name: "Creator A", status: "active" },
    CREATOR_B: { id: "CREATOR_B", legal_name: "Creator B", status: "active" },
    CREATOR_C: { id: "CREATOR_C", legal_name: "Creator C", status: "active" },
    CREATOR_D: { id: "CREATOR_D", legal_name: "Creator D", status: "active" },
    CREATOR_E: { id: "CREATOR_E", legal_name: "Creator E", status: "active" },
    CREATOR_F: { id: "CREATOR_F", legal_name: "Creator F", status: "active" },
    CREATOR_G: { id: "CREATOR_G", legal_name: "Creator G", status: "active" },
    CREATOR_H: { id: "CREATOR_H", legal_name: "Creator H", status: "active" },
    CREATOR_I: { id: "CREATOR_I", legal_name: "Creator I", status: "active" },
  },

  tool_clearance: {
    XTTS_v2: { clearance_status: "approved" },
    RVC: { clearance_status: "approved" },
    Librosa: { clearance_status: "approved" },
    pedalboard: { clearance_status: "approved" },
    MusicGen: { clearance_status: "pending_review" },
    MaskGCT: { clearance_status: "pending_review" },
    UnknownModel_v1: { clearance_status: "approved" }, // exists in registry but NOT in NCP authorized_tools
  },

  // Consent records keyed by creator_id + claimant_id
  consents: {
    // T01: CREATOR_A — no consent exists (missing from map)
    // T02: CREATOR_B — revoked
    "CREATOR_B:CLAIMANT_001": {
      id: "NCP_B_001",
      consent_status: "revoked",
      revoked_at: "2026-03-25T15:00:00Z",
      dispute_status: "none",
      usage_types: ["synthesis"],
      authorized_tools: ["XTTS_v2"],
      term_start: "2026-01-01T00:00:00Z",
      term_end: "2030-01-01T00:00:00Z",
      scope: {},
      payment_terms: { creator_pct: 75, platform_pct: 25 },
      provenance_required: true,
    },
    // T03: CREATOR_C — active, tool not in authorized_tools
    "CREATOR_C:CLAIMANT_001": {
      id: "NCP_C_001",
      consent_status: "active",
      revoked_at: null,
      dispute_status: "none",
      usage_types: ["synthesis"],
      authorized_tools: ["XTTS_v2", "RVC"],
      term_start: "2026-01-01T00:00:00Z",
      term_end: "2030-01-01T00:00:00Z",
      scope: {},
      payment_terms: { creator_pct: 75, platform_pct: 25 },
      provenance_required: true,
    },
    // T04: CREATOR_D — active, MusicGen in authorized_tools but pending_review in registry
    "CREATOR_D:CLAIMANT_001": {
      id: "NCP_D_001",
      consent_status: "active",
      revoked_at: null,
      dispute_status: "none",
      usage_types: ["synthesis"],
      authorized_tools: ["MusicGen"],
      term_start: "2026-01-01T00:00:00Z",
      term_end: "2030-01-01T00:00:00Z",
      scope: {},
      payment_terms: { creator_pct: 75, platform_pct: 25 },
      provenance_required: true,
    },
    // T05: CREATOR_E — active, provenance required but pipeline unavailable
    "CREATOR_E:CLAIMANT_001": {
      id: "NCP_E_001",
      consent_status: "active",
      revoked_at: null,
      dispute_status: "none",
      usage_types: ["synthesis"],
      authorized_tools: ["XTTS_v2"],
      term_start: "2026-01-01T00:00:00Z",
      term_end: "2030-01-01T00:00:00Z",
      scope: {},
      payment_terms: { creator_pct: 75, platform_pct: 25 },
      provenance_required: true,
      _provenance_pipeline_available: false,
    },
    // T06: CREATOR_F — active, commercial but no payment terms
    "CREATOR_F:CLAIMANT_001": {
      id: "NCP_F_001",
      consent_status: "active",
      revoked_at: null,
      dispute_status: "none",
      usage_types: ["synthesis"],
      authorized_tools: ["XTTS_v2"],
      term_start: "2026-01-01T00:00:00Z",
      term_end: "2030-01-01T00:00:00Z",
      scope: {},
      payment_terms: {},
      provenance_required: true,
    },
    // T07: CREATOR_G — active, dispute pending
    "CREATOR_G:CLAIMANT_001": {
      id: "NCP_G_001",
      consent_status: "active",
      revoked_at: null,
      dispute_status: "pending",
      usage_types: ["synthesis"],
      authorized_tools: ["XTTS_v2"],
      term_start: "2026-01-01T00:00:00Z",
      term_end: "2030-01-01T00:00:00Z",
      scope: {},
      payment_terms: { creator_pct: 75, platform_pct: 25 },
      provenance_required: true,
    },
    // T08: CREATOR_H — active but term expired yesterday
    "CREATOR_H:CLAIMANT_001": {
      id: "NCP_H_001",
      consent_status: "active",
      revoked_at: null,
      dispute_status: "none",
      usage_types: ["synthesis"],
      authorized_tools: ["XTTS_v2"],
      term_start: "2024-01-01T00:00:00Z",
      term_end: "2026-03-24T23:59:59Z",
      scope: {},
      payment_terms: { creator_pct: 75, platform_pct: 25 },
      provenance_required: true,
    },
    // T09: CREATOR_I — active, political_speech in exclusions
    "CREATOR_I:CLAIMANT_001": {
      id: "NCP_I_001",
      consent_status: "active",
      revoked_at: null,
      dispute_status: "none",
      usage_types: ["synthesis", "derivative"],
      authorized_tools: ["XTTS_v2"],
      term_start: "2026-01-01T00:00:00Z",
      term_end: "2030-01-01T00:00:00Z",
      scope: { exclusions: ["political_speech", "deepfake_without_attribution"] },
      payment_terms: { creator_pct: 75, platform_pct: 25 },
      provenance_required: true,
    },
    // T10: RSP_001 — full ALLOW
    "RSP_001:CLAIMANT_001": {
      id: "NCP_RSP_001_CLAIMANT_001",
      consent_status: "active",
      revoked_at: null,
      dispute_status: "none",
      usage_types: ["synthesis", "derivative"],
      authorized_tools: ["XTTS_v2", "RVC"],
      term_start: "2026-03-01T00:00:00Z",
      term_end: "2030-03-25T00:00:00Z",
      scope: { geographic: ["global"], exclusions: ["political_speech", "deepfake_without_attribution"] },
      payment_terms: { creator_pct: 75, platform_pct: 25, currency: "USD", payout_window_days: 7 },
      provenance_required: true,
    },
  },
};

// ── Decision Matrix (mirrors src/index.js logic) ─────────────────────────────

function runDecisionMatrix(input, setup) {
  const { creator_id, claimant_id, action_type, tool_name, requested_scope = {}, requested_at } = input;
  const reason_codes = [];

  // Check 1: Identity linked
  if (!creator_id) return { decision: "HOLD", reason_codes: ["IDENTITY_NOT_PROVIDED"] };
  const creator = DB_STATE.creators[creator_id];
  if (!creator) return { decision: "HOLD", reason_codes: ["IDENTITY_NOT_FOUND"] };

  // Check 2: Consent exists
  const consentKey = `${creator_id}:${claimant_id}`;
  const consent = DB_STATE.consents[consentKey];
  if (!consent) return { decision: "DENY", reason_codes: ["CONSENT_NOT_FOUND"] };

  // Check 10: Revocation clear (before status check)
  if (consent.revoked_at) return { decision: "DENY", reason_codes: ["CONSENT_REVOKED"] };

  // Check 3: Consent active
  if (consent.consent_status !== "active") {
    const codeMap = { expired: "CONSENT_EXPIRED", disputed: "CONSENT_DISPUTED", suspended: "CONSENT_INACTIVE" };
    return { decision: "DENY", reason_codes: [codeMap[consent.consent_status] || "CONSENT_INACTIVE"] };
  }

  // Check 9: Dispute clear
  if (consent.dispute_status !== "none") {
    return { decision: "ESCALATE", reason_codes: ["DISPUTED_RIGHTS_ASSERTION"] };
  }

  // Check 4a: Scope exclusions (ALWAYS checked first)
  const exclusions = consent.scope?.exclusions || [];
  if (action_type && exclusions.includes(action_type)) {
    return { decision: "DENY", reason_codes: ["USAGE_EXCLUDED_BY_SCOPE"] };
  }

  // Check 4b: Usage types
  if (action_type && consent.usage_types.length > 0 && !consent.usage_types.includes(action_type)) {
    return { decision: "DENY", reason_codes: ["USAGE_NOT_IN_SCOPE"] };
  }

  // Check 4c: Territory
  if (requested_scope.territory) {
    const geo = consent.scope?.geographic || [];
    if (!geo.includes("global") && !geo.includes(requested_scope.territory)) {
      return { decision: "DENY", reason_codes: ["TERRITORY_NOT_AUTHORIZED"] };
    }
  }

  // Check 5: Time valid
  if (requested_at) {
    const reqTime = new Date(requested_at);
    if (reqTime < new Date(consent.term_start)) return { decision: "DENY", reason_codes: ["CONSENT_NOT_YET_EFFECTIVE"] };
    if (reqTime > new Date(consent.term_end)) return { decision: "DENY", reason_codes: ["CONSENT_EXPIRED"] };
  }

  // Check 6: Tool authorized
  if (tool_name) {
    const toolInNcp = consent.authorized_tools.length === 0 || consent.authorized_tools.includes(tool_name);
    const clearance = DB_STATE.tool_clearance[tool_name];
    if (!clearance) return { decision: "HOLD", reason_codes: ["TOOL_UNKNOWN"] };
    if (clearance.clearance_status === "blocked") return { decision: "DENY", reason_codes: ["TOOL_BLOCKED"] };
    if (clearance.clearance_status === "pending_review") return { decision: "HOLD", reason_codes: ["TOOL_PENDING_REVIEW"] };
    if (!toolInNcp) return { decision: "HOLD", reason_codes: ["TOOL_NOT_AUTHORIZED"] };
  }

  // Check 7: Provenance ready
  if (consent.provenance_required && consent._provenance_pipeline_available === false) {
    return { decision: "HOLD", reason_codes: ["PROVENANCE_PIPELINE_UNAVAILABLE"] };
  }

  // Check 8: Royalty route ready
  const monetized = requested_scope?.commercial === true;
  if (monetized && typeof consent.payment_terms?.creator_pct !== "number") {
    return { decision: "HOLD", reason_codes: ["ROYALTY_ROUTE_NOT_READY"] };
  }

  // All checks pass → ALLOW
  reason_codes.push("CONSENT_VALID", "SCOPE_VALID");
  if (tool_name) reason_codes.push("TOOL_AUTHORIZED");
  if (consent.provenance_required) reason_codes.push("PROVENANCE_READY");
  if (monetized) reason_codes.push("ROYALTY_ROUTE_READY");

  return { decision: "ALLOW", reason_codes };
}

// ── Run Tests ────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

for (const tc of cases) {
  const result = runDecisionMatrix(tc.input, tc.setup);
  const decisionOk = result.decision === tc.expected_decision;
  const codesOk = (tc.expected_reason_codes || []).every((c) => result.reason_codes.includes(c));
  const ok = decisionOk && codesOk;

  if (ok) {
    console.log(`✅ ${tc.id} — ${tc.name}: ${result.decision} [${result.reason_codes.join(", ")}]`);
    passed++;
  } else {
    console.log(`❌ ${tc.id} — ${tc.name}`);
    console.log(`   Expected: ${tc.expected_decision} [${(tc.expected_reason_codes || []).join(", ")}]`);
    console.log(`   Got:      ${result.decision} [${result.reason_codes.join(", ")}]`);
    failed++;
  }
}

console.log(`\n─── Results: ${passed}/${passed + failed} passed ───`);
process.exit(failed > 0 ? 1 : 0);
