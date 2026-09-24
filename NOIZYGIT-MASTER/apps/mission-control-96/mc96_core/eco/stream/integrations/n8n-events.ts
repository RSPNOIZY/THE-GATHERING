/**
 * NOIZYSTREAM → n8n Event Bridge
 *
 * Wraps ProofLogger.write() so that significant session events automatically
 * fire to n8n webhooks for audit logging, Discord alerts, and downstream automation.
 *
 * Design:
 *   - Non-blocking: HTTP errors are logged but never crash the control server.
 *   - Selective: not every proof event fires (configurable per event type).
 *   - Zero secrets in code: reads N8N_BASE_URL + N8N_AUTH_TOKEN from env.
 *
 * Usage:
 *   import { N8nEventBridge } from './integrations/n8n-events';
 *   const bridge = new N8nEventBridge();
 *   // In control server, after proof.write():
 *   bridge.emit(proofRecord);
 */

import { ProofRecord, ProofEventType } from '../types';

// ── Config ────────────────────────────────────────────────────────────────────

const N8N_BASE_URL   = process.env.N8N_BASE_URL   ?? 'https://noizy.app.n8n.cloud/webhook';
const N8N_AUTH_TOKEN = process.env.N8N_AUTH_TOKEN  ?? '';

// Events that trigger a webhook fire.
// Tune this set to control signal vs noise.
const EMIT_EVENTS = new Set<ProofEventType>([
  'session.created',
  'session.started',
  'session.ended',
  'participant.joined',
  'participant.left',
  'participant.role_changed',
  'route.created',
  'route.deleted',
  'record.armed',
  'record.stopped',
  'talkback.granted',
  'system.error',
]);

// ── Bridge ────────────────────────────────────────────────────────────────────

export class N8nEventBridge {
  private readonly endpoint: string;
  private readonly headers: Record<string, string>;

  constructor(webhookPath = 'noizystream-events') {
    this.endpoint = `${N8N_BASE_URL}/${webhookPath}`;
    this.headers = {
      'Content-Type': 'application/json',
      ...(N8N_AUTH_TOKEN ? { Authorization: `Bearer ${N8N_AUTH_TOKEN}` } : {}),
    };
  }

  /**
   * Emit a proof record to n8n. Fire-and-forget — never throws.
   * Returns true if the event was dispatched (selected + sent), false if skipped.
   */
  emit(record: ProofRecord): boolean {
    if (!EMIT_EVENTS.has(record.event)) return false;

    const payload = {
      source:    'noizystream',
      sessionId: record.sessionId,
      eventId:   record.id,
      event:     record.event,
      actor:     record.actor,
      detail:    record.detail,
      ts:        record.ts,
      ts_iso:    new Date(record.ts).toISOString(),
    };

    // Non-blocking — intentionally not awaited at call site
    this._post(payload).catch(err => {
      console.error(`[n8n-bridge] emit failed for ${record.event}: ${err.message}`);
    });

    return true;
  }

  private async _post(payload: Record<string, unknown>): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(this.endpoint, {
        method:  'POST',
        headers: this.headers,
        body:    JSON.stringify(payload),
        signal:  controller.signal,
      });
      if (!res.ok) {
        console.warn(`[n8n-bridge] HTTP ${res.status} for event: ${payload.event}`);
      }
    } finally {
      clearTimeout(timeout);
    }
  }
}

// ── Singleton (use this in control server) ────────────────────────────────────

export const n8nBridge = new N8nEventBridge();
