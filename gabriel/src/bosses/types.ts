// GABRIEL · Bosses — type surface
//
// A Boss is the Tier 3 agent that receives intents from Tier 2 (Discord/Slack
// bots via cf01-discord / cf04-slack) and decides what to do. Bosses can
// reason (via the Claude Agent SDK), dispatch to NOIZYARMY soldiers (via the
// orchestrator on :9333), call MCP tools, and post back to Discord/Slack.
//
// Doctrine:
//   - Every intent that triggers a mutating action writes to noizy_ledger.
//   - Never Clauses gate destructive operations — boss MUST check before acting.
//   - Results carry correlation_id for post-mortem tracing.
//   - isError=true is first-class; no silent fallbacks.

export type BossName =
  | "gabriel"
  | "lucy"
  | "pops"
  | "shirl"
  | "shirley"
  | "dream"
  | "engr_keith"
  | "cb01"
  | "voice_specialist"
  | "test_runner"
  | "consent_auditor"
  | "noizyarmy"
  | "ollama"
  | "ai_gateway"
  | "rag"
  | "publisher"
  | "maintenance"
  | "openclaw"
  | "cohere"
  | "nodered";

export type Priority = "normal" | "high" | "critical";

export interface Intent {
  /** Which boss should handle this intent. */
  boss: BossName;
  /** Stable idempotency / tracing key. */
  correlation_id: string;
  /** Who initiated — "RSP_001", "discord:<user_id>", "slack:<user_id>", etc. */
  from: string;
  /** Free-form verb — e.g. "deploy.heaven", "audit.consent", "speak.ack". */
  verb: string;
  /** Optional target identifier — e.g. "worker:heaven", "actor:RSP_001". */
  target?: string;
  /** Verb-specific arguments. */
  args?: Record<string, unknown>;
  /** Source surface — "discord:noizyai", "slack:ops-status", "cli", "ipad:lucy". */
  source: string;
  priority?: Priority;
}

export interface BossResult {
  ok: boolean;
  correlation_id: string;
  boss: BossName;
  verb: string;
  /** Short human-readable summary. Safe to post verbatim to a channel. */
  ack_message?: string;
  /** Structured payload — tool calls, child task ids, etc. */
  data?: Record<string, unknown>;
  /** When ok=false, this explains why. */
  error?: string;
  /** Present if the boss dispatched a NOIZYARMY task. */
  army_task_id?: string;
  /** Heaven ledger entry id for this intent, when written. */
  ledger_id?: string;
}

export interface BossContext {
  /**
   * Called by a boss to append an event to the NOIZY ledger (via Heaven).
   * Returns the ledger entry id.
   */
  appendLedger: (entry: {
    actor_id: string;
    event_kind: string;
    subject?: string;
    correlation_id?: string;
    payload?: Record<string, unknown>;
  }) => Promise<string | undefined>;

  /**
   * Dispatch a task to the NOIZYARMY orchestrator on :9333.
   * Returns the task id if accepted. The boss typically does not wait for
   * completion — the orchestrator emits task.complete back via its event bus
   * and the cf01-discord Worker posts the result to Discord/Slack.
   */
  dispatchArmy: (task: {
    verb: string;
    target: string;
    args?: Record<string, unknown>;
    correlation_id: string;
  }) => Promise<string | undefined>;

  /**
   * Speak `text` in a voice persona via the voice-service on :9799.
   * Fire-and-forget; never throws.
   */
  speak: (text: string, agent?: string) => Promise<void>;
}

export interface Boss {
  name: BossName;
  description: string;
  handle(intent: Intent, ctx: BossContext): Promise<BossResult>;
}
