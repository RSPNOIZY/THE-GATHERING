/**
 * NOIZYARMY Tiered Agent Gating & Policy Engine
 * Clearance: T0_PUBLIC (0) -> T1_SANDBOX (1) -> T2_INTERNAL (2) -> T3_PRODUCTION (3) -> T4_SOVEREIGN (4)
 */

export type ClearanceTier =
  | 'T0_PUBLIC'
  | 'T1_SANDBOX'
  | 'T2_INTERNAL'
  | 'T3_PRODUCTION'
  | 'T4_SOVEREIGN';

export interface GatingDecision {
  allowed: boolean;
  policyCode: string;
  requiredTier: ClearanceTier;
  agentTier: ClearanceTier;
  reason: string;
  timestamp: string;
}

export interface ActionPayload {
  actionType: 'READ' | 'WRITE' | 'DEPLOY' | 'PAYOUT' | 'INGEST' | 'MUTATE_SCHEMA';
  targetResource: string;
  parameters?: Record<string, any>;
}

export class AgentGatingEngine {
  private static readonly TIER_LEVELS: Record<ClearanceTier, number> = {
    T0_PUBLIC: 0,
    T1_SANDBOX: 1,
    T2_INTERNAL: 2,
    T3_PRODUCTION: 3,
    T4_SOVEREIGN: 4,
  };

  /**
   * Evaluate whether an agent action is permitted
   */
  public static evaluate(
    agentClearance: ClearanceTier,
    payload: ActionPayload
  ): GatingDecision {
    const timestamp = new Date().toISOString();

    // 1. NEVER CLAUSE: Creator split invariant check (< 75% is strictly forbidden)
    if (payload.parameters?.creator_split_pct !== undefined) {
      const split = Number(payload.parameters.creator_split_pct);
      if (split < 75.0) {
        return {
          allowed: false,
          policyCode: 'NEVER_CLAUSE_75_25',
          requiredTier: 'T4_SOVEREIGN',
          agentTier: agentClearance,
          reason: `FATAL GATING VIOLATION: Creator split (${split}%) is below sacred 75% floor.`,
          timestamp,
        };
      }
    }

    // 2. Consent Revocation Check
    if (payload.parameters?.consent_revoked === true) {
      return {
        allowed: false,
        policyCode: 'CONSENT_REVOKED_SACRED',
        requiredTier: 'T4_SOVEREIGN',
        agentTier: agentClearance,
        reason: 'ACTION BLOCKED: Creator consent was revoked. Ingestion or processing is illegal.',
        timestamp,
      };
    }

    // 3. Determine Required Tier by Action Type
    let requiredTier: ClearanceTier = 'T0_PUBLIC';

    switch (payload.actionType) {
      case 'READ':
        requiredTier = 'T0_PUBLIC';
        break;
      case 'INGEST':
        requiredTier = 'T1_SANDBOX';
        break;
      case 'WRITE':
        requiredTier = 'T2_INTERNAL';
        break;
      case 'DEPLOY':
        requiredTier = 'T3_PRODUCTION';
        break;
      case 'PAYOUT':
      case 'MUTATE_SCHEMA':
        requiredTier = 'T4_SOVEREIGN';
        break;
      default:
        requiredTier = 'T2_INTERNAL';
    }

    const hasClearance =
      this.TIER_LEVELS[agentClearance] >= this.TIER_LEVELS[requiredTier];

    if (!hasClearance) {
      return {
        allowed: false,
        policyCode: 'INSUFFICIENT_CLEARANCE',
        requiredTier,
        agentTier: agentClearance,
        reason: `PERMISSION DENIED: Action '${payload.actionType}' on '${payload.targetResource}' requires ${requiredTier}, agent has ${agentClearance}.`,
        timestamp,
      };
    }

    return {
      allowed: true,
      policyCode: 'POLICY_PASSED',
      requiredTier,
      agentTier: agentClearance,
      reason: 'Action validated and authorized by SENTINEL gating engine.',
      timestamp,
    };
  }
}
