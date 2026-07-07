// workers/consent-gateway/policy.ts — 12-step eligibility engine
// NOIZY doctrine: tools STRICT (deny if empty), usage types STRICT (deny if empty)
// 2026-03-27 | RSP_001 | GORUNFREE

export type Decision = "ALLOW" | "HOLD" | "DENY" | "ESCALATE";

export type EligibilityRequest = {
  creator_id: string;
  claimant_id: string;
  action_type: string;
  tool_name: string;
  requested_scope: { media?: string; channel?: string; territory?: string; };
  requested_at: string;
};

export type EligibilityResponse = {
  decision: Decision;
  reason_codes: string[];
  consent_record_id?: string;
  provenance_required?: boolean;
  royalty_route_status?: "ready" | "blocked" | "held" | "unknown";
};

export interface Env { DB: D1Database; }

// ── Helpers ───────────────────────────────────────────────────
function safeJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}
function isoNow(): string { return new Date().toISOString(); }
function uid(prefix = "NCP"): string {
  const rand = Math.random().toString(16).slice(2);
  return `${prefix}_${Date.now().toString(16)}_${rand}`;
}

function isWithinTerm(requestedAt: string, termStart: string, termEnd?: string | null): boolean {
  const ra = Date.parse(requestedAt), ts = Date.parse(termStart);
  if (isNaN(ra) || isNaN(ts) || ra < ts) return false;
  if (!termEnd) return true;
  const te = Date.parse(termEnd);
  return !isNaN(te) && ra <= te;
}

type ScopeJson = { media?: string[]; channel?: string[]; territory?: string[]; };
function scopeAllows(scope: ScopeJson, req: EligibilityRequest["requested_scope"]): boolean {
  return (!req.media || !scope.media || scope.media.includes(req.media))
    && (!req.channel || !scope.channel || scope.channel.includes(req.channel))
    && (!req.territory || !scope.territory || scope.territory.includes(req.territory));
}

// STRICT: deny if empty (NOIZY doctrine — specificity is consent)
function actionAllowed(typesJson: string, action: string): boolean {
  const types = safeJson<string[]>(typesJson, []);
  return types.length > 0 && types.includes(action);
}
function toolAllowed(toolsJson: string, tool: string): boolean {
  const tools = safeJson<string[]>(toolsJson, []);
  return tools.length > 0 && tools.includes(tool);
}

type PaymentTerms = { monetized?: boolean; royalty_route_id?: string; payout_destination?: string; };
function payoutReady(paymentJson: string): { ready: boolean; status: "ready" | "blocked" | "held" } {
  const p = safeJson<PaymentTerms>(paymentJson, {});
  if (p.monetized === false) return { ready: true, status: "ready" };
  if (p.royalty_route_id || p.payout_destination) return { ready: true, status: "ready" };
  return { ready: false, status: "held" };
}

// ── DB Reads ──────────────────────────────────────────────────
async function getCreator(env: Env, id: string) {
  return env.DB.prepare(`SELECT * FROM creators WHERE id=? LIMIT 1`).bind(id).first<any>();
}
async function getActiveHvs(env: Env, creatorId: string) {
  return env.DB.prepare(`SELECT * FROM hvs_records WHERE creator_id=? AND estate_status='active' LIMIT 1`).bind(creatorId).first<any>();
}
async function getActiveEstate(env: Env, creatorId: string, hvsId: string) {
  return env.DB.prepare(`SELECT * FROM voice_estates WHERE creator_id=? AND hvs_id=? AND estate_status='active' LIMIT 1`).bind(creatorId, hvsId).first<any>();
}
async function getLatestConsent(env: Env, creatorId: string, claimantId: string) {
  return env.DB.prepare(`SELECT * FROM consent_records WHERE creator_id=? AND claimant_id=? ORDER BY created_at DESC LIMIT 1`).bind(creatorId, claimantId).first<any>();
}
async function hasRevocationBlock(env: Env, consentId: string, requestedAt: string): Promise<boolean> {
  const row = await env.DB.prepare(
    `SELECT id FROM revocation_events WHERE consent_record_id=? AND effective_at<=? ORDER BY effective_at DESC LIMIT 1`
  ).bind(consentId, requestedAt).first<any>();
  return !!row;
}

// ── Audit ─────────────────────────────────────────────────────
export async function writeAudit(env: Env, entry: {
  id?: string; actor_type: string; actor_id: string; action: string;
  object_type: string; object_id: string; decision?: string; reason?: string;
  metadata_json?: string; created_at?: string;
}): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO audit_log (id,actor_type,actor_id,action,object_type,object_id,decision,reason,metadata_json,created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)`
  ).bind(
    entry.id ?? uid("AUD"), entry.actor_type, entry.actor_id, entry.action,
    entry.object_type, entry.object_id, entry.decision ?? null,
    entry.reason ?? null, entry.metadata_json ?? null,
    entry.created_at ?? isoNow()
  ).run();
}

// ── 12-Step Eligibility Engine ────────────────────────────────
export async function checkEligibility(body: EligibilityRequest, env: Env): Promise<EligibilityResponse> {
  const rc: string[] = [];

  // 1) Creator exists + active
  const creator = await getCreator(env, body.creator_id);
  if (!creator) return { decision: "DENY", reason_codes: ["CREATOR_NOT_FOUND"], royalty_route_status: "blocked" };
  if (creator.status !== "active") return { decision: "DENY", reason_codes: ["CREATOR_INACTIVE"], royalty_route_status: "blocked" };
  rc.push("CREATOR_OK");

  // 2) HVS record exists + estate active
  const hvs = await getActiveHvs(env, body.creator_id);
  if (!hvs) return { decision: "HOLD", reason_codes: [...rc, "HVS_NOT_FOUND"], royalty_route_status: "unknown" };
  rc.push("HVS_OK");

  // 3) Voice estate exists
  const estate = await getActiveEstate(env, body.creator_id, hvs.id);
  if (!estate) return { decision: "HOLD", reason_codes: [...rc, "VOICE_ESTATE_NOT_FOUND"], royalty_route_status: "unknown" };
  rc.push("VOICE_ESTATE_OK");

  // 4) Consent exists
  const consent = await getLatestConsent(env, body.creator_id, body.claimant_id);
  if (!consent) return { decision: "DENY", reason_codes: [...rc, "CONSENT_NOT_FOUND"], royalty_route_status: "blocked" };

  // 5) Consent active
  if (consent.consent_status !== "active") {
    return { decision: consent.consent_status === "pending" ? "HOLD" : "DENY", reason_codes: [...rc, "CONSENT_NOT_ACTIVE"], consent_record_id: consent.id, royalty_route_status: "blocked" };
  }
  if (consent.revoked_at) {
    return { decision: "DENY", reason_codes: [...rc, "CONSENT_REVOKED"], consent_record_id: consent.id, royalty_route_status: "blocked" };
  }
  rc.push("CONSENT_ACTIVE");

  // 6) Term valid
  if (!isWithinTerm(body.requested_at, consent.term_start, consent.term_end)) {
    return { decision: "DENY", reason_codes: [...rc, "TERM_INVALID"], consent_record_id: consent.id, royalty_route_status: "blocked" };
  }
  rc.push("TERM_VALID");

  // 7) Scope valid
  if (!scopeAllows(safeJson<ScopeJson>(consent.scope_json, {}), body.requested_scope)) {
    return { decision: "DENY", reason_codes: [...rc, "SCOPE_INVALID"], consent_record_id: consent.id, royalty_route_status: "blocked" };
  }
  rc.push("SCOPE_VALID");

  // 8) Action in scope (STRICT)
  if (!actionAllowed(consent.usage_types_json, body.action_type)) {
    return { decision: "DENY", reason_codes: [...rc, "ACTION_NOT_AUTHORIZED"], consent_record_id: consent.id, royalty_route_status: "blocked" };
  }
  rc.push("ACTION_AUTHORIZED");

  // 9) Tool cleared (STRICT)
  if (!toolAllowed(consent.authorized_tools_json, body.tool_name)) {
    return { decision: "DENY", reason_codes: [...rc, "TOOL_NOT_AUTHORIZED"], consent_record_id: consent.id, royalty_route_status: "blocked" };
  }
  rc.push("TOOL_AUTHORIZED");

  // 10) No active dispute
  if (consent.dispute_status && consent.dispute_status !== "none") {
    return { decision: "ESCALATE", reason_codes: [...rc, "DISPUTE_BLOCK"], consent_record_id: consent.id, provenance_required: !!consent.provenance_required, royalty_route_status: "held" };
  }
  rc.push("NO_DISPUTE");

  // 11) No revocation event block
  if (await hasRevocationBlock(env, consent.id, body.requested_at)) {
    return { decision: "DENY", reason_codes: [...rc, "REVOCATION_EVENT_BLOCK"], consent_record_id: consent.id, provenance_required: !!consent.provenance_required, royalty_route_status: "blocked" };
  }
  rc.push("NO_REVOCATION_BLOCK");

  // 12) Payout route ready
  const payout = payoutReady(consent.payment_terms_json);
  if (!payout.ready) {
    return { decision: "HOLD", reason_codes: [...rc, "ROYALTY_ROUTE_NOT_READY"], consent_record_id: consent.id, provenance_required: !!consent.provenance_required, royalty_route_status: payout.status };
  }
  rc.push("ROYALTY_ROUTE_READY");

  const provenance_required = !!consent.provenance_required;
  rc.push(provenance_required ? "PROVENANCE_REQUIRED" : "PROVENANCE_NOT_REQUIRED");

  return { decision: "ALLOW", reason_codes: rc, consent_record_id: consent.id, provenance_required, royalty_route_status: "ready" };
}
