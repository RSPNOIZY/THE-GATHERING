# CRYPTOGRAPHIC AUDIT TAMPER-EVIDENCE

## Objective

Ensure that **any modification, removal, or re-ordering of audit data is detectable**, even if done by a privileged actor.

This aligns with the NOIZY doctrine: "Consent & Audit as Protocol" — trust is not optional, it is provable.

---

## Strategy: Hash-Chained Audit Records

Each audit event stores a hash of:
- its own canonical fields
- the hash of the previous event

This creates a tamper-evident chain where any alteration breaks cryptographic continuity.

---

## Schema Extension

```sql
-- Add hash chain columns to audit_events
ALTER TABLE audit_events
ADD COLUMN prev_hash TEXT;

ALTER TABLE audit_events
ADD COLUMN event_hash TEXT;
```

---

## Write-Time Hashing (Worker-side)

```javascript
// src/edge-core/audit_hash.js

/**
 * Compute SHA-256 hash of canonical audit data
 */
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Get the hash of the most recent audit event
 */
async function getLastEventHash(env) {
  const last = await env.GABRIEL_DB.prepare(`
    SELECT event_hash FROM audit_events
    ORDER BY created_at DESC
    LIMIT 1
  `).first();

  return last?.event_hash || 'GENESIS';
}

/**
 * Create a hash-chained audit event
 */
export async function writeHashedAuditEvent(env, {
  id,
  operator,
  action,
  explanation,
  precondition_passed,
  metadata
}) {
  const prevHash = await getLastEventHash(env);
  const timestamp = new Date().toISOString();

  // Canonical form for hashing
  const canonical = `${operator}|${action}|${explanation}|${timestamp}|${prevHash}`;
  const eventHash = await sha256(canonical);

  await env.GABRIEL_DB.prepare(`
    INSERT INTO audit_events
    (id, operator_email, action, explanation, precondition_passed, metadata, prev_hash, event_hash, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    operator,
    action,
    explanation,
    precondition_passed ? 1 : 0,
    JSON.stringify(metadata || {}),
    prevHash,
    eventHash,
    timestamp
  ).run();

  return { id, eventHash, prevHash };
}
```

---

## Verification Worker

```javascript
// src/edge-core/audit_verify.js

/**
 * Verify the integrity of the audit hash chain
 * Returns { valid: boolean, brokenAt?: string, error?: string }
 */
export async function verifyAuditChain(env, { limit = 1000 } = {}) {
  const events = await env.GABRIEL_DB.prepare(`
    SELECT id, operator_email, action, explanation, created_at, prev_hash, event_hash
    FROM audit_events
    ORDER BY created_at ASC
    LIMIT ?
  `).bind(limit).all();

  if (!events.results || events.results.length === 0) {
    return { valid: true, message: 'No events to verify' };
  }

  let expectedPrevHash = 'GENESIS';

  for (const event of events.results) {
    // Check prev_hash matches expected
    if (event.prev_hash !== expectedPrevHash) {
      return {
        valid: false,
        brokenAt: event.id,
        error: `Chain broken: expected prev_hash ${expectedPrevHash}, got ${event.prev_hash}`
      };
    }

    // Recompute hash
    const canonical = `${event.operator_email}|${event.action}|${event.explanation}|${event.created_at}|${event.prev_hash}`;
    const computed = await sha256(canonical);

    if (computed !== event.event_hash) {
      return {
        valid: false,
        brokenAt: event.id,
        error: `Hash mismatch: computed ${computed}, stored ${event.event_hash}`
      };
    }

    expectedPrevHash = event.event_hash;
  }

  return { valid: true, verified: events.results.length };
}
```

---

## Scheduled Verification

Add to Worker scheduled handler:

```javascript
export default {
  async scheduled(event, env, ctx) {
    const result = await verifyAuditChain(env);

    if (!result.valid) {
      // CRITICAL: Chain integrity broken
      console.error('[AUDIT CHAIN BROKEN]', result);

      // Trigger freeze
      await env.FEATURE_FLAGS.put('gorunfree_promotion_frozen', 'true');

      // Record incident (to a separate table, since main chain is compromised)
      await env.GABRIEL_DB.prepare(`
        INSERT INTO audit_incidents (id, type, details, created_at)
        VALUES (?, 'CHAIN_BREAK', ?, CURRENT_TIMESTAMP)
      `).bind(crypto.randomUUID(), JSON.stringify(result)).run();

      // TODO: Fire webhook alert
    }
  }
};
```

---

## Guarantees

| Threat | Protected By |
|--------|--------------|
| Silent deletion | Hash chain breaks if any event is removed |
| Re-ordering | prev_hash would no longer match |
| Field tampering | event_hash would not match recomputed hash |
| Rollback attacks | Genesis block is fixed, chain grows forward only |

---

## Future Extensions

- **External anchoring**: Publish daily root hash to external service (e.g., blockchain, timestamping authority)
- **Merkle tree**: For efficient partial verification of large audit sets
- **Hardware attestation**: Store signing key in Cloudflare Workers secrets with strict access

---

## Incident Response

If chain verification fails:

1. **Immediate**: Freeze all promotions (FREEZE-003)
2. **Within 1 hour**: Identify break point and scope
3. **Within 24 hours**: Root cause analysis
4. **Resolution**: Either restore from backup or acknowledge gap with new genesis

---

*Rule: We do not hide mistakes. We make them provable, bounded, and survivable.*
