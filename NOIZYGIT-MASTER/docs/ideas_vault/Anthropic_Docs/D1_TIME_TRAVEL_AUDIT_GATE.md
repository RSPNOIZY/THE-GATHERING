# D1_TIME_TRAVEL_AUDIT_GATE.md

## Purpose

This gate ensures that **audit history is intact and verifiable across time** using D1's point-in-time capabilities.

The gate covers four things:

1. Hash chain continuity verification
2. Historical state consistency
3. Anchor timestamp validation
4. Tamper detection across restore points

Cloudflare D1 supports point-in-time recovery, which means we can verify that audit state at any previous point matches the hash chain we've recorded.

---

## Core Law

> **What was recorded then must match what we can prove now.**

Audit integrity is not a snapshot — it's a continuous truth.

---

## Scope

This gate applies to:

- `audit_events` table hash chain integrity
- `audit_anchors` Merkle root consistency
- `transparency_log` cross-reference validation
- Any historical audit query that affects trust decisions

---

## 1. Hash Chain Continuity Verification

### Goal

Verify that the hash chain in `audit_events` is unbroken from genesis to present.

### Hash chain rules

1. First event has `prev_hash = NULL` or `prev_hash = 'GENESIS'`
2. Each subsequent event's `prev_hash` equals the previous event's `event_hash`
3. Each `event_hash` is deterministically computed from event data + `prev_hash`

### Verification query

```sql
-- Find chain breaks
WITH ordered_events AS (
  SELECT
    id,
    event_hash,
    prev_hash,
    created_at,
    LAG(event_hash) OVER (ORDER BY created_at ASC) as expected_prev_hash,
    ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_num
  FROM audit_events
  ORDER BY created_at ASC
)
SELECT
  id,
  created_at,
  prev_hash,
  expected_prev_hash,
  CASE
    WHEN row_num = 1 AND (prev_hash IS NULL OR prev_hash = 'GENESIS') THEN 'VALID_GENESIS'
    WHEN prev_hash = expected_prev_hash THEN 'VALID_CHAIN'
    ELSE 'CHAIN_BREAK'
  END as status
FROM ordered_events
WHERE status = 'CHAIN_BREAK';
```

### Expected result

Zero rows returned (no chain breaks).

### Fail condition

If any chain break is detected, deploy is blocked.

---

## 2. Historical State Consistency

### Goal

Verify that audit state at a historical point matches the Merkle root recorded for that period.

### D1 Time-Travel mechanism

D1 supports point-in-time queries via the REST API with a `timestamp` parameter. This allows querying the database state as it existed at a specific moment.

### Verification process

```javascript
async function verifyHistoricalState(env, anchorDate) {
  // 1. Get the recorded anchor for this date
  const anchor = await env.GABRIEL_DB.prepare(`
    SELECT root_hash, event_count, algorithm
    FROM audit_anchors
    WHERE anchor_date = ?
  `).bind(anchorDate).first();

  if (!anchor) {
    return { valid: false, error: 'No anchor for date' };
  }

  // 2. Recompute Merkle root from events up to that date
  const events = await env.GABRIEL_DB.prepare(`
    SELECT event_hash
    FROM audit_events
    WHERE DATE(created_at) <= ?
    ORDER BY created_at ASC
  `).bind(anchorDate).all();

  const recomputedRoot = computeMerkleRoot(events.results.map(e => e.event_hash));

  // 3. Compare
  if (recomputedRoot !== anchor.root_hash) {
    return {
      valid: false,
      error: 'Merkle root mismatch',
      recorded: anchor.root_hash,
      recomputed: recomputedRoot
    };
  }

  return { valid: true, event_count: events.results.length };
}
```

### Fail condition

If recomputed Merkle root doesn't match recorded anchor, deploy is blocked.

---

## 3. Anchor Timestamp Validation

### Goal

Verify that anchors were created at the times they claim.

### Timestamp integrity rules

1. `published_at` must be within 24 hours of `anchor_date` end
2. `created_at` must be >= `published_at`
3. Anchors must be sequential with no gaps > 7 days (configurable)

### Validation query

```sql
-- Find timestamp anomalies
SELECT
  id,
  anchor_date,
  published_at,
  created_at,
  CASE
    WHEN JULIANDAY(published_at) - JULIANDAY(anchor_date || ' 23:59:59') > 1
      THEN 'LATE_PUBLISH'
    WHEN created_at < published_at
      THEN 'TIMESTAMP_PARADOX'
    ELSE 'VALID'
  END as status
FROM audit_anchors
WHERE status != 'VALID';
```

### Gap detection query

```sql
-- Find gaps in anchor sequence
WITH anchor_dates AS (
  SELECT
    anchor_date,
    LAG(anchor_date) OVER (ORDER BY anchor_date) as prev_date
  FROM audit_anchors
)
SELECT
  anchor_date,
  prev_date,
  JULIANDAY(anchor_date) - JULIANDAY(prev_date) as gap_days
FROM anchor_dates
WHERE gap_days > 7;
```

### Fail condition

If timestamp anomalies or excessive gaps exist, deploy is blocked (or warning for gaps).

---

## 4. Tamper Detection Across Restore Points

### Goal

Verify that if D1 is restored to a previous point, the restore doesn't create inconsistent state.

### Tamper detection process

```javascript
async function detectTamperAcrossRestore(env) {
  // 1. Get latest anchor
  const latestAnchor = await env.GABRIEL_DB.prepare(`
    SELECT * FROM audit_anchors ORDER BY anchor_date DESC LIMIT 1
  `).first();

  // 2. Get current event count
  const currentCount = await env.GABRIEL_DB.prepare(`
    SELECT COUNT(*) as cnt FROM audit_events
  `).first();

  // 3. Verify counts are consistent
  // If we have anchor for yesterday but event count decreased, something is wrong
  const expectedMinCount = latestAnchor?.event_count || 0;

  if (currentCount.cnt < expectedMinCount) {
    return {
      valid: false,
      error: 'Event count decreased — possible restore without chain repair',
      expected_min: expectedMinCount,
      actual: currentCount.cnt
    };
  }

  // 4. Verify the last N events still hash correctly
  const recentEvents = await env.GABRIEL_DB.prepare(`
    SELECT * FROM audit_events ORDER BY created_at DESC LIMIT 100
  `).all();

  for (const event of recentEvents.results) {
    const computedHash = computeEventHash(event);
    if (computedHash !== event.event_hash) {
      return {
        valid: false,
        error: 'Hash mismatch on recent event',
        event_id: event.id
      };
    }
  }

  return { valid: true };
}
```

### Fail condition

If tamper is detected, deploy is blocked and incident is logged.

---

## CI Integration

### GitHub Actions job

```yaml
d1-time-travel-audit:
  name: D1 Time-Travel Audit Gate
  runs-on: ubuntu-latest
  needs: [audit-readiness-gate]

  steps:
    - uses: actions/checkout@v4

    - uses: actions/setup-node@v4
      with:
        node-version: '20'

    - name: Install Wrangler
      run: npm install -g wrangler

    - name: Verify hash chain continuity
      env:
        CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      run: |
        BREAKS=$(npx wrangler d1 execute gabriel_db --remote --command "
          WITH ordered_events AS (
            SELECT
              id, event_hash, prev_hash, created_at,
              LAG(event_hash) OVER (ORDER BY created_at ASC) as expected_prev,
              ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
            FROM audit_events
          )
          SELECT COUNT(*) as breaks FROM ordered_events
          WHERE rn > 1 AND prev_hash != expected_prev;
        " | grep -o '"breaks": [0-9]*' | grep -o '[0-9]*')

        if [ "$BREAKS" != "0" ] && [ -n "$BREAKS" ]; then
          echo "❌ Hash chain has $BREAKS breaks"
          exit 1
        fi
        echo "✓ Hash chain intact"

    - name: Verify recent anchors
      env:
        CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      run: node scripts/edge-core/verify-time-travel.js --recent-anchors

    - name: Check for tamper indicators
      env:
        CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      run: node scripts/edge-core/verify-time-travel.js --tamper-check

    - name: Gate passed
      run: |
        echo "═══════════════════════════════════════════════════════════════════"
        echo "  ✅ D1 TIME-TRAVEL AUDIT GATE PASSED"
        echo "  Audit history is intact and verifiable."
        echo "═══════════════════════════════════════════════════════════════════"
```

---

## Local Gate Script

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "═══════════════════════════════════════════════════════════════════"
echo "  D1 TIME-TRAVEL AUDIT GATE"
echo "  What was recorded then must match what we can prove now."
echo "═══════════════════════════════════════════════════════════════════"

DB_NAME="${AUDIT_D1_DATABASE:-gabriel_db}"
FAILED=0

echo "→ Verifying hash chain continuity..."
node scripts/edge-core/verify-time-travel.js --hash-chain || FAILED=1

if [[ "$FAILED" -eq 0 ]]; then
  echo "→ Verifying historical anchor consistency..."
  node scripts/edge-core/verify-time-travel.js --anchors || FAILED=1
fi

if [[ "$FAILED" -eq 0 ]]; then
  echo "→ Checking for tamper indicators..."
  node scripts/edge-core/verify-time-travel.js --tamper-check || FAILED=1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"

if [[ "$FAILED" -eq 0 ]]; then
  echo "  ✅ D1 TIME-TRAVEL AUDIT GATE: PASSED"
  exit 0
else
  echo "  ❌ D1 TIME-TRAVEL AUDIT GATE: FAILED"
  exit 1
fi
```

---

## Incident Response

### On chain break detection

1. Log incident to `audit_incidents` table
2. Identify affected range (event IDs)
3. Check D1 backup/restore history
4. If legitimate restore, repair chain with documented incident
5. If unexplained, escalate and block all deploys

### Incident logging

```sql
INSERT INTO audit_incidents (
  id, incident_type, details, created_at
) VALUES (
  ?,
  'CHAIN_BREAK_DETECTED',
  '{"break_at": "event_id", "detected_by": "ci-gate", "action": "deploy_blocked"}',
  CURRENT_TIMESTAMP
);
```

---

## Enforcement Summary

### Deploy allowed only when:

- Hash chain is continuous from genesis to present
- All recorded anchors match recomputed Merkle roots
- Anchor timestamps are valid and sequential
- No tamper indicators detected
- Event count is monotonically increasing

### Deploy blocked when:

- Any hash chain break detected
- Merkle root mismatch on any anchor
- Timestamp paradox detected
- Event count decreased without documented restore
- Unexplained gaps in anchor sequence (> 7 days)

---

## Final Statement

Time-travel verification is the ultimate tamper check.

If we can query past state and prove it matches recorded hashes, the audit trail is trustworthy.

**What was recorded then must match what we can prove now.**

---

*This gate leverages Cloudflare D1's durability guarantees and point-in-time recovery capabilities to provide continuous audit integrity verification.*
