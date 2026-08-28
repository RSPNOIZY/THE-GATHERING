# GORUNFREE KV → D1 Promotion Daemon

## Purpose

This daemon **automatically promotes** provisional GORUNFREE insights from **KV** into **D1** when — and only when — runtime behavior proves they are stable, safe, and repeatable.

The goal is to eliminate:

- Human babysitting
- Accidental truth pollution
- Performance regressions caused by early persistence

---

## Architectural Role

| Layer | Responsibility |
|-------|----------------|
| KV | Provisional insight, counters, thresholds |
| Worker | Evaluation + eligibility signaling |
| Observability | Health truth |
| Durable Object | Serialization + race prevention |
| D1 | Authoritative, explainable records |

---

## Inputs (Promotion Candidates)

Each KV key under `GAP_SOLVER` may emit a candidate record:

```json
{
  "candidate_id": "gap:grit9_140bpm_am",
  "query_signature": "grit9:140:Am",
  "gap_type": "HARD_GAP",
  "seen_count": 7,
  "first_seen_at": 1712620800,
  "data": {
    "description": "No consented source for 140bpm minor key grit",
    "severity": "medium"
  }
}
```

---

## Configuration Constants

```javascript
// Tunable thresholds - stored in FEATURE_FLAGS KV
const PROMOTION_CONFIG = {
  MIN_OBSERVATIONS: 5,        // Minimum times seen
  MIN_AGE_MS: 30 * 60 * 1000, // 30 minutes minimum age
  STABILITY_WINDOW_MS: 15 * 60 * 1000, // 15 minutes of stable metrics
  MAX_ERROR_RATE: 0.001,      // 0.1% max error rate
  MAX_P95_LATENCY_MS: 200     // 200ms P95 max
};
```

---

## Promotion Eligibility Rules

A KV candidate is eligible for D1 promotion **only when ALL are true**:

### 1. Seen Count Threshold Met

```javascript
candidate.seen_count >= PROMOTION_CONFIG.MIN_OBSERVATIONS
```

### 2. Age Threshold Met

```javascript
(Date.now() - candidate.first_seen_at) >= PROMOTION_CONFIG.MIN_AGE_MS
```

### 3. Metrics Stable

All required signals green for ≥ `STABILITY_WINDOW_MS`:
- `LATENCY_OK`: P95 ≤ 200ms
- `ERROR_RATE_OK`: Error rate ≤ 0.1%
- `NO_EXCEPTIONS_SPIKE`: Exceptions within baseline

### 4. Version Canary Active

Worker version receiving traffic via gradual deployment:
- At least 1% traffic routed to current version
- No active rollback signals

### 5. No Consent Violations

Zero restricted-surface violations for candidate class:
- Consent checks passed
- Never Clause checks passed
- No audit flags

---

## Promotion Flow (Authoritative)

```
KV candidate →
Worker evaluation →
Durable Object promotion arbiter →
D1 write →
Promotion recorded →
KV marked as promoted
```

### Detailed Flow

1. **Worker receives request** that generates/updates a gap candidate
2. **Worker increments KV** counter for candidate
3. **Worker checks eligibility** against thresholds
4. **If eligible**, Worker calls Durable Object promotion arbiter
5. **Durable Object** ensures no duplicate promotion (atomic)
6. **D1 write** executes with contract enforcement
7. **Audit event** logged to `audit_events` table
8. **KV marked** as promoted (prevents re-promotion)

---

## Durable Object: Promotion Arbiter

Location: `src/gorunfree/promotion-governor.js`

```javascript
export class GorunfreePromotionGovernor extends DurableObject {
  async promote(candidateId, payload, env) {
    // Check if already promoted (atomic read)
    const existing = await this.state.storage.get(candidateId);
    if (existing === "PROMOTED") {
      return { success: false, reason: "Already promoted" };
    }

    // Verify signals
    if (!payload.metricsStable || !payload.canaryActive) {
      return { success: false, reason: "Signals not met" };
    }

    // Execute D1 write
    try {
      await env.GABRIEL_DB.prepare(`
        INSERT INTO gaps (
          gap_id,
          query_signature,
          gap_type,
          confidence,
          detected_version,
          first_detected_at,
          promoted_at,
          status
        ) VALUES (?, ?, ?, ?, ?, datetime(?), CURRENT_TIMESTAMP, 'ACTIVE')
      `).bind(
        candidateId,
        payload.query_signature,
        payload.gap_type,
        payload.confidence || 0.8,
        payload.detected_version,
        new Date(payload.first_seen_at).toISOString()
      ).run();

      // Log promotion event
      await env.GABRIEL_DB.prepare(`
        INSERT INTO audit_events (event_id, event_type, actor, details, created_at)
        VALUES (?, 'PROMOTION_COMPLETED', 'DAEMON', ?, CURRENT_TIMESTAMP)
      `).bind(
        `promo-${Date.now().toString(36)}`,
        JSON.stringify({ candidate_id: candidateId, signals: payload })
      ).run();

      // Mark as promoted (atomic write)
      await this.state.storage.put(candidateId, "PROMOTED");

      return { success: true, candidateId };

    } catch (error) {
      return { success: false, reason: error.message };
    }
  }

  async checkStatus(candidateId) {
    const status = await this.state.storage.get(candidateId);
    return { candidateId, promoted: status === "PROMOTED" };
  }
}
```

---

## Wrangler Binding

Add to `wrangler.toml`:

```toml
[[durable_objects.bindings]]
name = "PROMOTION_GOVERNOR"
class_name = "GorunfreePromotionGovernor"

[[migrations]]
tag = "v1"
new_classes = ["GorunfreePromotionGovernor"]
```

---

## Sweep Schedule

The promotion daemon runs as a scheduled Worker:

```toml
[triggers]
crons = ["*/15 * * * *"]  # Every 15 minutes
```

### Sweep Logic

```javascript
export default {
  async scheduled(event, env, ctx) {
    // List all candidates in KV
    const candidates = await env.GAP_SOLVER.list({
      prefix: 'gorunfree:candidate:'
    });

    for (const key of candidates.keys) {
      const candidate = await env.GAP_SOLVER.get(key.name, 'json');
      if (!candidate || candidate.promoted) continue;

      // Check eligibility
      const eligible = await checkEligibility(candidate, env);
      if (!eligible.ready) continue;

      // Attempt promotion via Durable Object
      const stub = env.PROMOTION_GOVERNOR.get(
        env.PROMOTION_GOVERNOR.idFromName('global')
      );

      await stub.promote(candidate.key, {
        ...candidate,
        metricsStable: eligible.signals.metricsStable,
        canaryActive: eligible.signals.versionPromoted
      }, env);
    }
  }
};
```

---

## Guarantees

| Guarantee | Mechanism |
|-----------|-----------|
| No duplicate promotions | Durable Object atomic storage |
| No early truth commits | Signal checks before write |
| Metrics-gated durability | D1 write contract enforcement |
| Fully auditable path | Audit events table |
| Race condition prevention | Durable Object serialization |

---

## Monitoring

### Success Metrics

- Promotions per hour
- Average time-to-promotion
- Promotion failure rate

### Alert Conditions

- Promotion queue growing > 100 candidates
- Zero promotions in 24 hours (may indicate signal issues)
- Promotion failure rate > 10%

---

## Manual Operations

### Force Promotion (Emergency Only)

```bash
# Only for ops emergencies
npx wrangler kv key put --binding GAP_SOLVER \
  "gorunfree:force_promote:gap:example_id" "true"
```

### Check Promotion Queue

```bash
npx wrangler kv key list --binding GAP_SOLVER \
  --prefix "gorunfree:candidate:"
```

### Clear Stale Candidates

```bash
# Remove candidates older than 7 days that never promoted
# This is a maintenance operation
```

---

## Final Principle

> **Let KV speculate freely.
> Let the daemon decide when speculation becomes truth.
> Let D1 hold only what has earned its place.**
