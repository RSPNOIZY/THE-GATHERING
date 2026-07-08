// ═══════════════════════════════════════════════════════════════════════
// HEAVEN v18 — Consent Engine (Pure Function)
//
// 2036 Constraint #3: This MUST be a pure function.
// No side effects. No runtime coupling. No Worker globals.
// Testable with `node --test`. Deployable to any edge.
// ═══════════════════════════════════════════════════════════════════════

import type { NeverClause, NeverClauseCode, ConsentToken, ConsentDecision, Actor } from './types';

/** Input to the consent check — everything needed to make a decision */
export interface ConsentCheckInput {
  actor: Actor;
  token: ConsentToken | null;
  never_clauses: NeverClause[];
  requested_use_case: string;
  requested_jurisdiction: string;
  requested_medium: string;
  licensee_id: string;
  timestamp: string;
}

/**
 * checkConsent — The core decision function.
 *
 * This function determines whether a synthesis request is allowed.
 * It is the single source of truth for consent in the NOIZY empire.
 *
 * Rules (in order of precedence):
 * 1. Actor must exist and be active
 * 2. Never clauses are constitutional — they override everything
 * 3. A valid, active consent token must exist
 * 4. The token must cover the requested scope
 * 5. The token must not be expired
 * 6. Jurisdiction must be covered
 *
 * This function has ZERO side effects. It reads data and returns a decision.
 */
export function checkConsent(input: ConsentCheckInput): ConsentDecision {
  const start = performance.now();
  const baseDecision: Omit<ConsentDecision, 'allowed' | 'reason' | 'violated_clauses' | 'latency_ms'> = {
    actor_id: input.actor.actor_id,
    token_id: input.token?.token_id ?? null,
    checked_at: input.timestamp,
  };

  // --- Rule 1: Actor must be active ---
  if (input.actor.status !== 'active') {
    return {
      ...baseDecision,
      allowed: false,
      reason: `Actor ${input.actor.actor_id} status is '${input.actor.status}', not 'active'. All synthesis blocked.`,
      violated_clauses: [],
      latency_ms: performance.now() - start,
    };
  }

  // --- Rule 2: Never clauses are constitutional ---
  const violated = checkNeverClauses(input.never_clauses, input.requested_use_case, input.requested_medium);
  if (violated.length > 0) {
    return {
      ...baseDecision,
      allowed: false,
      reason: `Never clause violation: ${violated.join(', ')}. Constitutional law — cannot be overridden.`,
      violated_clauses: violated,
      latency_ms: performance.now() - start,
    };
  }

  // --- Rule 3: Consent token must exist ---
  if (!input.token) {
    return {
      ...baseDecision,
      allowed: false,
      reason: 'No consent token provided. NC_SYSTEM_INTEGRITY requires a valid token for all synthesis.',
      violated_clauses: ['NC_SYSTEM_INTEGRITY'],
      latency_ms: performance.now() - start,
    };
  }

  // --- Rule 4: Token must be active ---
  if (input.token.status !== 'active') {
    return {
      ...baseDecision,
      allowed: false,
      reason: `Consent token ${input.token.token_id} status is '${input.token.status}'. Synthesis denied.`,
      violated_clauses: [],
      latency_ms: performance.now() - start,
    };
  }

  // --- Rule 5: Token must not be expired ---
  if (input.token.expires_at && new Date(input.token.expires_at) < new Date(input.timestamp)) {
    return {
      ...baseDecision,
      allowed: false,
      reason: `Consent token ${input.token.token_id} expired at ${input.token.expires_at}.`,
      violated_clauses: [],
      latency_ms: performance.now() - start,
    };
  }

  // --- Rule 6: Token must match the licensee ---
  if (input.token.licensee_id !== input.licensee_id) {
    return {
      ...baseDecision,
      allowed: false,
      reason: `Token licensee '${input.token.licensee_id}' does not match requesting licensee '${input.licensee_id}'.`,
      violated_clauses: [],
      latency_ms: performance.now() - start,
    };
  }

  // --- Rule 7: Scope must cover the use case ---
  if (!input.token.scope.use_cases.includes(input.requested_use_case) &&
      !input.token.scope.use_cases.includes('*')) {
    return {
      ...baseDecision,
      allowed: false,
      reason: `Use case '${input.requested_use_case}' not in token scope: [${input.token.scope.use_cases.join(', ')}].`,
      violated_clauses: [],
      latency_ms: performance.now() - start,
    };
  }

  // --- Rule 8: Scope must cover the jurisdiction ---
  if (!input.token.scope.jurisdictions.includes(input.requested_jurisdiction) &&
      !input.token.scope.jurisdictions.includes('*')) {
    return {
      ...baseDecision,
      allowed: false,
      reason: `Jurisdiction '${input.requested_jurisdiction}' not in token scope: [${input.token.scope.jurisdictions.join(', ')}].`,
      violated_clauses: [],
      latency_ms: performance.now() - start,
    };
  }

  // --- Rule 9: Scope must cover the medium ---
  if (!input.token.scope.mediums.includes(input.requested_medium) &&
      !input.token.scope.mediums.includes('*')) {
    return {
      ...baseDecision,
      allowed: false,
      reason: `Medium '${input.requested_medium}' not in token scope: [${input.token.scope.mediums.join(', ')}].`,
      violated_clauses: [],
      latency_ms: performance.now() - start,
    };
  }

  // --- All checks passed. Consent granted. ---
  return {
    ...baseDecision,
    allowed: true,
    reason: 'All checks passed. Consent granted.',
    violated_clauses: [],
    latency_ms: performance.now() - start,
  };
}

/**
 * checkNeverClauses — Map use cases and mediums to never clause violations.
 *
 * This is a keyword-based classifier. In production, this should be
 * upgraded to a semantic classifier, but the rule-based approach is
 * constitutional — it always runs first.
 */
function checkNeverClauses(
  clauses: NeverClause[],
  useCase: string,
  medium: string
): NeverClauseCode[] {
  const violated: NeverClauseCode[] = [];
  const combined = `${useCase} ${medium}`.toLowerCase();

  const clauseMap: Record<NeverClauseCode, string[]> = {
    NC_POLITICAL: ['political', 'campaign', 'propaganda', 'partisan', 'election', 'candidate', 'lobby'],
    NC_SEXUAL: ['sexual', 'adult', 'pornograph', 'explicit', 'erotic', 'nsfw'],
    NC_WEAPONS: ['weapon', 'violence', 'firearm', 'bomb', 'harm', 'kill', 'attack'],
    NC_DECEPTION: ['deceive', 'impersonat', 'fraud', 'scam', 'phishing', 'deepfake', 'fake'],
    NC_HATE: ['hate', 'demean', 'slur', 'supremac', 'discriminat', 'bigot'],
    NC_TRANSFER: ['transfer', 'sublicense', 'assign', 'resell'],
    NC_SURVEILLANCE: ['surveillance', 'tracking', 'biometric', 'facial', 'monitor'],
    NC_SYSTEM_INTEGRITY: [], // Checked structurally, not by keyword
    NC_SYSTEM_TRANSFER: ['export_dna', 'transfer_model', 'extract_voice'],
  };

  for (const clause of clauses) {
    const keywords = clauseMap[clause.clause_code as NeverClauseCode];
    if (keywords && keywords.some(kw => combined.includes(kw))) {
      violated.push(clause.clause_code as NeverClauseCode);
    }
  }

  return violated;
}

/**
 * calculateRoyalty — Enforce the 75/15/10 split.
 * Pure function. No side effects.
 *
 * With union member:    75% artist / 15% NOIZY / 10% union
 * Without union member: 85% artist / 15% NOIZY / 0% union
 *
 * NOIZY never takes more than 15%. The artist's share absorbs
 * the union's portion when no union is involved.
 */
export function calculateRoyalty(
  grossAmount: number,
  isUnionMember: boolean
): { actor: number; noizy: number; union: number } {
  const noizy = Math.round(grossAmount * 0.15 * 100) / 100;
  const union = isUnionMember ? Math.round(grossAmount * 0.10 * 100) / 100 : 0;
  const actor = Math.round((grossAmount - noizy - union) * 100) / 100;
  return { actor, noizy, union };
}
