/**
 * NOIZY.AI GOVERNANCE — Decision Queue
 * 
 * Anything Claude Code cannot decide alone lands here.
 * Consent conflicts. Schema forks. Storage ambiguity. Branding inconsistency.
 * 
 * Humans decide. Code executes. No exceptions.
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// ─── CONFIG ──────────────────────────────────────────────

const QUEUE_PATH = '/Users/m2ultra/NOIZYLAB/governance/decision-queue.json';

// ─── DECISION TYPES ──────────────────────────────────────

export type DecisionCategory =
  | 'consent_conflict'
  | 'schema_fork'
  | 'storage_ambiguity'
  | 'branding_inconsistency'
  | 'legal_review'
  | 'economic_policy'
  | 'actor_protocol'
  | 'deployment_risk'
  | 'privacy_concern'
  | 'general';

export type DecisionUrgency = 'critical' | 'high' | 'medium' | 'low';
export type DecisionStatus = 'pending' | 'decided' | 'deferred' | 'withdrawn';

// ─── DECISION ────────────────────────────────────────────

export interface Decision {
  id: string;
  title: string;
  category: DecisionCategory;
  urgency: DecisionUrgency;
  status: DecisionStatus;
  blocking: boolean;

  // Context
  reason: string;
  context: string;
  options: DecisionOption[];
  recommendation?: string;

  // Source
  raised_by: 'claude_code' | 'human' | 'system' | 'n8n';
  raised_at: string;
  run_id?: string;

  // Resolution
  decided_by?: string;
  decided_at?: string;
  decision?: string;
  decision_rationale?: string;

  // Audit
  gabriel_ingested: false;
}

export interface DecisionOption {
  label: string;
  description: string;
  risk: 'low' | 'medium' | 'high';
  reversible: boolean;
}

// ─── QUEUE ───────────────────────────────────────────────

export interface DecisionQueue {
  version: string;
  last_updated: string;
  decisions: Decision[];
}

// ─── OPERATIONS ──────────────────────────────────────────

function loadQueue(): DecisionQueue {
  if (!existsSync(QUEUE_PATH)) {
    return {
      version: '1.0.0',
      last_updated: new Date().toISOString(),
      decisions: [],
    };
  }
  return JSON.parse(readFileSync(QUEUE_PATH, 'utf-8'));
}

function saveQueue(queue: DecisionQueue): void {
  queue.last_updated = new Date().toISOString();
  writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
}

/**
 * Raise a new decision. Called by Claude Code when it hits something
 * it cannot or should not decide alone.
 */
export function raiseDecision(params: {
  title: string;
  category: DecisionCategory;
  urgency: DecisionUrgency;
  blocking: boolean;
  reason: string;
  context: string;
  options: DecisionOption[];
  recommendation?: string;
  raised_by?: 'claude_code' | 'human' | 'system' | 'n8n';
  run_id?: string;
}): Decision {
  const queue = loadQueue();

  const decision: Decision = {
    id: uuidv4(),
    title: params.title,
    category: params.category,
    urgency: params.urgency,
    status: 'pending',
    blocking: params.blocking,
    reason: params.reason,
    context: params.context,
    options: params.options,
    recommendation: params.recommendation,
    raised_by: params.raised_by || 'claude_code',
    raised_at: new Date().toISOString(),
    run_id: params.run_id,
    gabriel_ingested: false as const,
  };

  queue.decisions.push(decision);
  saveQueue(queue);
  return decision;
}

/**
 * Resolve a decision. Called by a human in the cockpit.
 */
export function resolveDecision(
  decisionId: string,
  decidedBy: string,
  decision: string,
  rationale: string,
): Decision {
  const queue = loadQueue();
  const d = queue.decisions.find(x => x.id === decisionId);

  if (!d) throw new Error(`Decision not found: ${decisionId}`);
  if (d.status !== 'pending') throw new Error(`Decision already resolved: ${d.status}`);

  d.status = 'decided';
  d.decided_by = decidedBy;
  d.decided_at = new Date().toISOString();
  d.decision = decision;
  d.decision_rationale = rationale;

  saveQueue(queue);
  return d;
}

/**
 * Defer a decision. Not ready to decide yet.
 */
export function deferDecision(decisionId: string, reason: string): Decision {
  const queue = loadQueue();
  const d = queue.decisions.find(x => x.id === decisionId);
  if (!d) throw new Error(`Decision not found: ${decisionId}`);

  d.status = 'deferred';
  d.decision_rationale = `Deferred: ${reason}`;

  saveQueue(queue);
  return d;
}

/**
 * Get all pending decisions, sorted by urgency.
 */
export function getPendingDecisions(): Decision[] {
  const queue = loadQueue();
  const urgencyOrder: Record<DecisionUrgency, number> = {
    critical: 0, high: 1, medium: 2, low: 3,
  };
  return queue.decisions
    .filter(d => d.status === 'pending')
    .sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
}

/**
 * Get blocking decisions only.
 */
export function getBlockingDecisions(): Decision[] {
  return getPendingDecisions().filter(d => d.blocking);
}

/**
 * Full queue summary for standup.
 */
export function getQueueSummary(): {
  total: number;
  pending: number;
  blocking: number;
  decided: number;
  by_category: Record<string, number>;
} {
  const queue = loadQueue();
  const pending = queue.decisions.filter(d => d.status === 'pending');
  const blocking = pending.filter(d => d.blocking);
  const decided = queue.decisions.filter(d => d.status === 'decided');

  const byCategory: Record<string, number> = {};
  for (const d of pending) {
    byCategory[d.category] = (byCategory[d.category] || 0) + 1;
  }

  return {
    total: queue.decisions.length,
    pending: pending.length,
    blocking: blocking.length,
    decided: decided.length,
    by_category: byCategory,
  };
}
