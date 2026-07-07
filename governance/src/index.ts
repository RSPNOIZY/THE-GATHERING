/**
 * NOIZY.AI GOVERNANCE — Operating System v1.0
 * 
 * Capture writes files. Humans bless memory. Gabriel only sees blessed truth.
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

// Daily Standup
export { generateStandup, writeStandupMarkdown, type StandupReport, type StandupItem, type BlockedItem, type SystemHealth } from './daily-standup';

// Decision Queue
export { raiseDecision, resolveDecision, deferDecision, getPendingDecisions, getBlockingDecisions, getQueueSummary, type Decision, type DecisionCategory, type DecisionUrgency, type DecisionStatus, type DecisionOption } from './decision-queue';

// Blessing Gate
export { canBless, bless, canIngest, markIngested, reject, type MemoryRecord, type MemoryStatus, type BlessingResult } from './blessing-gate';

// Memory Promotion
export { stage, promoteToReview, promoteToBlessed, promoteToD1, getRecordsByStatus, getRecord, getManifestSummary } from './memory-promotion';

// Revenue — Royalty Ledger (100-Year Immutable)
export {
  GENESIS_HASH,
  RoyaltyEventTypeSchema,
  RoyaltyLedgerEntrySchema,
  computeEntryHash,
  verifyChain,
  appendEntry,
  getLedger,
  getActorTotal,
  resetLedger,
} from './revenue/royalty-ledger';
