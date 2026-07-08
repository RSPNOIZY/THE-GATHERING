// ═══════════════════════════════════════════════════════════════════════
// HEAVEN v18 — Consent Engine Test Suite
//
// These tests prove that the consent kernel works as designed.
// Every rule in checkConsent() is tested. Every never clause triggers.
// Every edge case is covered. This is the legal proof that HEAVEN
// makes correct decisions.
//
// Run: npx vitest run tests/consent.test.ts
// ═══════════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { checkConsent, calculateRoyalty, type ConsentCheckInput } from '../src/consent';
import type { Actor, ConsentToken, NeverClause, NeverClauseCode, ConsentScope } from '../src/types';

// ═══════════════════════════════════════════════════════════════════════
// TEST FIXTURES — Reusable building blocks
// ═══════════════════════════════════════════════════════════════════════

const NOW = '2026-04-12T12:00:00Z';
const FUTURE = '2027-12-31T23:59:59Z';
const PAST = '2025-01-01T00:00:00Z';

function makeActor(overrides: Partial<Actor> = {}): Actor {
  return {
    actor_id: 'RSP_001',
    display_name: 'Robert Stephen Plowman',
    legal_name: 'Robert Stephen Plowman',
    email: 'rsp@noizy.ai',
    country: 'CA',
    is_founding: 1,
    union_member: 0,
    union_name: null,
    status: 'active',
    onboarded_at: '2026-04-06T00:00:00Z',
    ...overrides,
  };
}

function makeScope(overrides: Partial<ConsentScope> = {}): ConsentScope {
  return {
    use_cases: ['audiobook', 'podcast'],
    jurisdictions: ['CA', 'US'],
    mediums: ['streaming', 'download'],
    duration_days: 365,
    exclusions: [],
    ...overrides,
  };
}

function makeToken(overrides: Partial<ConsentToken> = {}): ConsentToken {
  return {
    token_id: 'TOK-001',
    actor_id: 'RSP_001',
    licensee_id: 'LIC-AUDIBLE-001',
    scope: makeScope(),
    status: 'active',
    granted_at: '2026-04-06T00:00:00Z',
    expires_at: FUTURE,
    revoked_at: null,
    ...overrides,
  };
}

function makeNeverClauses(): NeverClause[] {
  const codes: NeverClauseCode[] = [
    'NC_POLITICAL', 'NC_SEXUAL', 'NC_WEAPONS', 'NC_DECEPTION',
    'NC_HATE', 'NC_TRANSFER', 'NC_SURVEILLANCE',
    'NC_SYSTEM_INTEGRITY', 'NC_SYSTEM_TRANSFER',
  ];
  return codes.map((code, i) => ({
    clause_id: i + 1,
    actor_id: 'RSP_001',
    clause_code: code,
    clause_text: `Never clause: ${code}`,
    category: 'constitutional',
    is_global: 1 as const,
    created_at: '2026-04-06T00:00:00Z',
  }));
}

function makeInput(overrides: Partial<ConsentCheckInput> = {}): ConsentCheckInput {
  return {
    actor: makeActor(),
    token: makeToken(),
    never_clauses: makeNeverClauses(),
    requested_use_case: 'audiobook',
    requested_jurisdiction: 'CA',
    requested_medium: 'streaming',
    licensee_id: 'LIC-AUDIBLE-001',
    timestamp: NOW,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// TEST SUITE: checkConsent()
// ═══════════════════════════════════════════════════════════════════════

describe('checkConsent — The Constitutional Law', () => {

  // --- HAPPY PATH ---
  describe('Happy Path — All checks pass', () => {
    it('grants consent when everything is valid', () => {
      const result = checkConsent(makeInput());
      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('All checks passed. Consent granted.');
      expect(result.violated_clauses).toEqual([]);
      expect(result.actor_id).toBe('RSP_001');
      expect(result.token_id).toBe('TOK-001');
      expect(result.checked_at).toBe(NOW);
      expect(result.latency_ms).toBeGreaterThanOrEqual(0);
    });

    it('grants consent with wildcard use_cases', () => {
      const result = checkConsent(makeInput({
        token: makeToken({ scope: makeScope({ use_cases: ['*'] }) }),
        requested_use_case: 'anything_at_all',
      }));
      expect(result.allowed).toBe(true);
    });

    it('grants consent with wildcard jurisdictions', () => {
      const result = checkConsent(makeInput({
        token: makeToken({ scope: makeScope({ jurisdictions: ['*'] }) }),
        requested_jurisdiction: 'JP',
      }));
      expect(result.allowed).toBe(true);
    });

    it('grants consent with wildcard mediums', () => {
      const result = checkConsent(makeInput({
        token: makeToken({ scope: makeScope({ mediums: ['*'] }) }),
        requested_medium: 'hologram',
      }));
      expect(result.allowed).toBe(true);
    });
  });

  // --- RULE 1: Actor must be active ---
  describe('Rule 1: Actor must be active', () => {
    it('denies suspended actor', () => {
      const result = checkConsent(makeInput({
        actor: makeActor({ status: 'suspended' }),
      }));
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("status is 'suspended'");
    });

    it('denies revoked actor', () => {
      const result = checkConsent(makeInput({
        actor: makeActor({ status: 'revoked' }),
      }));
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("status is 'revoked'");
    });

    it('denies deceased actor', () => {
      const result = checkConsent(makeInput({
        actor: makeActor({ status: 'deceased' }),
      }));
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("status is 'deceased'");
    });
  });

  // --- RULE 2: Never clauses are constitutional ---
  describe('Rule 2: Never clauses — constitutional law', () => {
    it('blocks political use case', () => {
      const result = checkConsent(makeInput({
        requested_use_case: 'political_campaign_ad',
      }));
      expect(result.allowed).toBe(false);
      expect(result.violated_clauses).toContain('NC_POLITICAL');
      expect(result.reason).toContain('Never clause violation');
      expect(result.reason).toContain('Constitutional law');
    });

    it('blocks sexual content', () => {
      const result = checkConsent(makeInput({
        requested_use_case: 'adult_sexual_content',
      }));
      expect(result.allowed).toBe(false);
      expect(result.violated_clauses).toContain('NC_SEXUAL');
    });

    it('blocks weapons content', () => {
      const result = checkConsent(makeInput({
        requested_use_case: 'weapons_training_video',
      }));
      expect(result.allowed).toBe(false);
      expect(result.violated_clauses).toContain('NC_WEAPONS');
    });

    it('blocks deceptive use (deepfake)', () => {
      const result = checkConsent(makeInput({
        requested_use_case: 'deepfake_impersonation',
      }));
      expect(result.allowed).toBe(false);
      expect(result.violated_clauses).toContain('NC_DECEPTION');
    });

    it('blocks hate speech', () => {
      const result = checkConsent(makeInput({
        requested_medium: 'hate_speech_audio',
      }));
      expect(result.allowed).toBe(false);
      expect(result.violated_clauses).toContain('NC_HATE');
    });

    it('blocks unauthorized transfer/sublicense', () => {
      const result = checkConsent(makeInput({
        requested_use_case: 'sublicense_to_third_party',
      }));
      expect(result.allowed).toBe(false);
      expect(result.violated_clauses).toContain('NC_TRANSFER');
    });

    it('blocks surveillance use', () => {
      const result = checkConsent(makeInput({
        requested_use_case: 'biometric_surveillance_system',
      }));
      expect(result.allowed).toBe(false);
      expect(result.violated_clauses).toContain('NC_SURVEILLANCE');
    });

    it('blocks system transfer (voice DNA export)', () => {
      const result = checkConsent(makeInput({
        requested_use_case: 'export_dna_to_external',
      }));
      expect(result.allowed).toBe(false);
      expect(result.violated_clauses).toContain('NC_SYSTEM_TRANSFER');
    });

    it('can trigger multiple never clauses at once', () => {
      const result = checkConsent(makeInput({
        requested_use_case: 'political_campaign_deepfake_attack',
      }));
      expect(result.allowed).toBe(false);
      expect(result.violated_clauses.length).toBeGreaterThan(1);
    });

    it('never clauses override even valid tokens', () => {
      // Perfect token, but political use case — constitutional law wins
      const result = checkConsent(makeInput({
        requested_use_case: 'political_propaganda',
        token: makeToken({
          scope: makeScope({ use_cases: ['*'], jurisdictions: ['*'], mediums: ['*'] }),
        }),
      }));
      expect(result.allowed).toBe(false);
      expect(result.violated_clauses).toContain('NC_POLITICAL');
    });
  });

  // --- RULE 3: Token must exist ---
  describe('Rule 3: Consent token required', () => {
    it('denies when no token provided', () => {
      const result = checkConsent(makeInput({ token: null }));
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('No consent token provided');
      expect(result.violated_clauses).toContain('NC_SYSTEM_INTEGRITY');
      expect(result.token_id).toBeNull();
    });
  });

  // --- RULE 4: Token must be active ---
  describe('Rule 4: Token status', () => {
    it('denies revoked token', () => {
      const result = checkConsent(makeInput({
        token: makeToken({ status: 'revoked' }),
      }));
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("status is 'revoked'");
    });

    it('denies expired-status token', () => {
      const result = checkConsent(makeInput({
        token: makeToken({ status: 'expired' }),
      }));
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("status is 'expired'");
    });
  });

  // --- RULE 5: Token must not be expired by date ---
  describe('Rule 5: Token expiry', () => {
    it('denies token past expiry date', () => {
      const result = checkConsent(makeInput({
        token: makeToken({ expires_at: PAST }),
      }));
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('expired at');
    });

    it('allows token with no expiry (null)', () => {
      const result = checkConsent(makeInput({
        token: makeToken({ expires_at: null }),
      }));
      expect(result.allowed).toBe(true);
    });

    it('allows token expiring in the future', () => {
      const result = checkConsent(makeInput({
        token: makeToken({ expires_at: FUTURE }),
      }));
      expect(result.allowed).toBe(true);
    });
  });

  // --- RULE 6: Licensee must match ---
  describe('Rule 6: Licensee match', () => {
    it('denies when licensee does not match token', () => {
      const result = checkConsent(makeInput({
        licensee_id: 'LIC-WRONG-999',
      }));
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('does not match requesting licensee');
    });
  });

  // --- RULE 7: Use case scope ---
  describe('Rule 7: Use case scope', () => {
    it('denies use case not in token scope', () => {
      const result = checkConsent(makeInput({
        requested_use_case: 'video_game_npc',
      }));
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Use case 'video_game_npc' not in token scope");
    });

    it('allows exact use case match', () => {
      const result = checkConsent(makeInput({
        requested_use_case: 'audiobook',
      }));
      expect(result.allowed).toBe(true);
    });
  });

  // --- RULE 8: Jurisdiction scope ---
  describe('Rule 8: Jurisdiction scope', () => {
    it('denies jurisdiction not in token scope', () => {
      const result = checkConsent(makeInput({
        requested_jurisdiction: 'EU',
      }));
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Jurisdiction 'EU' not in token scope");
    });

    it('allows jurisdiction in scope', () => {
      const result = checkConsent(makeInput({
        requested_jurisdiction: 'US',
      }));
      expect(result.allowed).toBe(true);
    });
  });

  // --- RULE 9: Medium scope ---
  describe('Rule 9: Medium scope', () => {
    it('denies medium not in token scope', () => {
      const result = checkConsent(makeInput({
        requested_medium: 'broadcast_television',
      }));
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Medium 'broadcast_television' not in token scope");
    });

    it('allows medium in scope', () => {
      const result = checkConsent(makeInput({
        requested_medium: 'download',
      }));
      expect(result.allowed).toBe(true);
    });
  });

  // --- PRECEDENCE: Rules execute in order ---
  describe('Rule Precedence — Order matters', () => {
    it('actor status checked before never clauses', () => {
      // Suspended actor + political use case → should get actor error, not clause error
      const result = checkConsent(makeInput({
        actor: makeActor({ status: 'suspended' }),
        requested_use_case: 'political_ad',
      }));
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("status is 'suspended'");
      expect(result.violated_clauses).toEqual([]);
    });

    it('never clauses checked before token validation', () => {
      // No token + political use case → should get clause error, not token error
      const result = checkConsent(makeInput({
        token: null,
        requested_use_case: 'political_campaign',
      }));
      expect(result.allowed).toBe(false);
      expect(result.violated_clauses).toContain('NC_POLITICAL');
    });

    it('token existence checked before token status', () => {
      // No token → system integrity error
      const result = checkConsent(makeInput({ token: null }));
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('No consent token');
    });
  });

  // --- PERFORMANCE ---
  describe('Performance — Sub-millisecond decisions', () => {
    it('returns latency_ms in result', () => {
      const result = checkConsent(makeInput());
      expect(typeof result.latency_ms).toBe('number');
      expect(result.latency_ms).toBeGreaterThanOrEqual(0);
    });

    it('decides in under 5ms', () => {
      const result = checkConsent(makeInput());
      expect(result.latency_ms).toBeLessThan(5);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// TEST SUITE: calculateRoyalty()
// ═══════════════════════════════════════════════════════════════════════

describe('calculateRoyalty — The 75/15/10 Split', () => {

  it('enforces 75/25/0 for non-union member', () => {
    const result = calculateRoyalty(100, false);
    expect(result.actor).toBe(75);
    expect(result.noizy).toBe(25);
    expect(result.union).toBe(0);
  });

  it('enforces 75/15/10 for union member', () => {
    const result = calculateRoyalty(100, true);
    expect(result.actor).toBe(75);
    expect(result.union).toBe(10);
    expect(result.noizy).toBe(15);
  });

  it('handles zero amount', () => {
    const result = calculateRoyalty(0, true);
    expect(result.actor).toBe(0);
    expect(result.noizy).toBe(0);
    expect(result.union).toBe(0);
  });

  it('handles small amounts with proper rounding', () => {
    const result = calculateRoyalty(1, true);
    expect(result.actor).toBe(0.75);
    expect(result.union).toBe(0.10);
    expect(result.noizy).toBe(0.15);
  });

  it('handles fractional amounts — no floating point drift', () => {
    const result = calculateRoyalty(33.33, true);
    expect(result.actor + result.noizy + result.union).toBeCloseTo(33.33, 2);
  });

  it('large amounts — $1M settlement', () => {
    const result = calculateRoyalty(1000000, true);
    expect(result.actor).toBe(750000);
    expect(result.union).toBe(100000);
    expect(result.noizy).toBe(150000);
  });

  it('artist always gets exactly 75%', () => {
    const amounts = [1, 10, 100, 999.99, 50000, 1000000];
    for (const amount of amounts) {
      const result = calculateRoyalty(amount, true);
      expect(result.actor).toBe(Math.round(amount * 0.75 * 100) / 100);
    }
  });

  it('sum always equals gross (within rounding)', () => {
    const amounts = [0.01, 0.99, 1.23, 47.89, 100, 9999.99];
    for (const amount of amounts) {
      const result = calculateRoyalty(amount, true);
      expect(result.actor + result.noizy + result.union).toBeCloseTo(amount, 1);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════
// INTEGRATION-STYLE TESTS: Real-world scenarios
// ═══════════════════════════════════════════════════════════════════════

describe('Real-World Scenarios', () => {

  it('Scenario: Audible wants RSP voice for audiobook in Canada — ALLOWED', () => {
    const result = checkConsent(makeInput());
    expect(result.allowed).toBe(true);
  });

  it('Scenario: Unknown company tries RSP voice with no token — DENIED', () => {
    const result = checkConsent(makeInput({
      token: null,
      licensee_id: 'LIC-SHADY-999',
    }));
    expect(result.allowed).toBe(false);
  });

  it('Scenario: Political party tries to use voice for campaign — CONSTITUTIONAL BLOCK', () => {
    const result = checkConsent(makeInput({
      requested_use_case: 'election_campaign_robocall',
      token: makeToken({
        scope: makeScope({ use_cases: ['*'], jurisdictions: ['*'], mediums: ['*'] }),
      }),
    }));
    expect(result.allowed).toBe(false);
    expect(result.violated_clauses).toContain('NC_POLITICAL');
  });

  it('Scenario: Licensee tries to use token for different actor — licensee mismatch', () => {
    const result = checkConsent(makeInput({
      licensee_id: 'LIC-SPOTIFY-002',
    }));
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('does not match');
  });

  it('Scenario: Token expired yesterday — DENIED', () => {
    const result = checkConsent(makeInput({
      token: makeToken({ expires_at: '2026-04-11T23:59:59Z' }),
    }));
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('expired');
  });

  it('Scenario: Deceased actor — voice estate would handle separately — kernel denies', () => {
    const result = checkConsent(makeInput({
      actor: makeActor({ status: 'deceased' }),
    }));
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("status is 'deceased'");
  });

  it('Scenario: Someone tries deepfake impersonation via any medium — ALWAYS BLOCKED', () => {
    const mediums = ['streaming', 'download', 'broadcast', 'live', 'hologram'];
    for (const medium of mediums) {
      const result = checkConsent(makeInput({
        requested_use_case: 'deepfake_impersonation',
        requested_medium: medium,
      }));
      expect(result.allowed).toBe(false);
      expect(result.violated_clauses).toContain('NC_DECEPTION');
    }
  });

  it('Scenario: Valid request to Japan (not in scope) — DENIED by jurisdiction', () => {
    const result = checkConsent(makeInput({
      requested_jurisdiction: 'JP',
    }));
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Jurisdiction 'JP' not in token scope");
  });

  it('Scenario: Podcast use case (in scope) via broadcast (not in scope) — DENIED by medium', () => {
    const result = checkConsent(makeInput({
      requested_use_case: 'podcast',
      requested_medium: 'broadcast_radio',
    }));
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Medium 'broadcast_radio' not in token scope");
  });
});
