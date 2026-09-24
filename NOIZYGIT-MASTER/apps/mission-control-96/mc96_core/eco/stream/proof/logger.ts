/**
 * NOIZYSTREAM — Proof / Audit Logger
 *
 * Writes an append-only chain of ProofRecords per session.
 * Each record includes the SHA-256 hash of the previous record
 * so the chain can be verified for integrity without a database.
 *
 * At session end, call manifest(session) to produce a SessionManifest
 * with a final integrity hash over the entire proof log.
 */

import * as crypto from 'crypto';
import { ProofRecord, ProofEventType, Session, SessionManifest } from '../types';

function uid(): string {
  return crypto.randomBytes(8).toString('hex');
}

function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export class ProofLogger {
  // sessionId → ordered chain
  private chains = new Map<string, ProofRecord[]>();

  write(
    sessionId: string,
    actor: string,
    event: ProofEventType,
    detail: Record<string, unknown> = {}
  ): ProofRecord {
    if (!this.chains.has(sessionId)) this.chains.set(sessionId, []);
    const chain = this.chains.get(sessionId)!;

    const prev = chain[chain.length - 1];
    const prevHash = prev ? sha256(JSON.stringify(prev)) : undefined;

    const record: ProofRecord = {
      id: uid(),
      sessionId,
      ts: Date.now(),
      actor,
      event,
      detail,
      prevHash,
    };

    chain.push(record);
    return record;
  }

  get(sessionId: string): ProofRecord[] {
    return this.chains.get(sessionId) ?? [];
  }

  /** Verify the hash chain for a session — returns true if intact */
  verify(sessionId: string): boolean {
    const chain = this.chains.get(sessionId) ?? [];
    for (let i = 1; i < chain.length; i++) {
      const expected = sha256(JSON.stringify(chain[i - 1]));
      if (chain[i].prevHash !== expected) return false;
    }
    return true;
  }

  /** Produce a full SessionManifest with integrity hash */
  manifest(session: Session): SessionManifest {
    const proof = this.get(session.id);
    const integrityHash = sha256(JSON.stringify({ session, proof }));
    return {
      version: '1',
      session,
      proof,
      exportedAt: Date.now(),
      integrityHash,
    };
  }

  /** Dump all chains (for debug / backup) */
  dump(): Record<string, ProofRecord[]> {
    const out: Record<string, ProofRecord[]> = {};
    for (const [k, v] of this.chains) out[k] = v;
    return out;
  }
}
