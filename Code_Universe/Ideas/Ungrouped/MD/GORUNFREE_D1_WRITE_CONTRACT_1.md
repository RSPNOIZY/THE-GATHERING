# GORUNFREE D1 Write Contract

## Core Principle

> **KV is allowed to speculate.
> D1 is allowed only to confirm.**

D1 must never contain:
- Guesses
- Preflight summaries
- Unobserved gaps
- Unverified provenance

---

## Signal Classes (Ranked)

| Class | Description | Source |
|-------|-------------|--------|
| S0 | UX interaction | Client |
| S1 | KV fast-path evaluation | Worker |
| S2 | Worker metrics present | Cloudflare analytics |
| S3 | Metrics stable over window | SLO gate |
| S4 | Promotion state >= Canary | Versions/deploy |
| S5 | Consent verified | D1 (read) |
| S6 | Provenance derivable | Runtime |

**D1 writes require: S3 + S4 + (S5 if sensitive)**

---

## Allowed D1 Writes (Matrix)

| Table | Write Allowed When |
|-------|-------------------|
| `gap_records` | S3 + S4 |
| `gap_solutions` | S3 + S4 |
| `provenance_explanations` | S5 + S6 |
| `resurrection_priorities` | S3 + S4 + human/system approval |
| `creator_speed_events` | S3 + S4 |
| `commission_requests` | Always (user-initiated, append-only) |
| `noizy_ledger` | Always (audit trail, append-only) |

---

## Implementation

### Contract Guard (src/gorunfree/d1-write-contract.js)

```javascript
import { assertD1WriteAllowed } from './d1-write-contract.js';

// Before any D1 mutation:
assertD1WriteAllowed('gap_records', {
  metricsStable: env.GORUNFREE_METRICS_OK,
  versionPromoted: env.GORUNFREE_CANARY_ACTIVE
});

// If signals aren't satisfied → write hard-fails
```

### Signal State (read from KV)

```javascript
// FEATURE_FLAGS KV keys:
// - gorunfree_metrics_stable: "true" | "false"
// - gorunfree_canary_active: "true" | "false"
```

---

## Signal Sources

### S3 - Metrics Stable

Set automatically when Cloudflare analytics shows:
- Error rate < 0.1% for 15+ minutes
- P95 latency < 200ms for 15+ minutes
- No SLO violations in observation window

```bash
# Manual override (for testing only):
npx wrangler kv key put --binding FEATURE_FLAGS gorunfree_metrics_stable true
```

### S4 - Version Promoted

Set when version reaches canary (1%+) with:
- No rollback signals
- Metrics observed
- At least 100 requests processed

```bash
# Check current promotion state:
npx wrangler versions list heaven
```

### S5 - Consent Verified

Read from D1 before any consent-sensitive write:
```javascript
const consent = await env.GABRIEL_DB.prepare(`
  SELECT status FROM hvs_consent_tokens WHERE actor_id = ?
`).bind(actorId).first();
signals.consentVerified = consent?.status === 'active';
```

---

## Error Handling

When a write is blocked:

```javascript
{
  "error": "D1WriteContractViolation",
  "table": "gap_records",
  "missingSignals": ["S3", "S4"],
  "message": "D1 write blocked: gap_records requires [S3, S4]"
}
```

The write does NOT proceed. The data remains in KV for later promotion.

---

## Appendix: Full Signal Matrix

| Table | S3 | S4 | S5 | S6 | APPROVAL |
|-------|----|----|----|----|----------|
| gap_records | ✓ | ✓ | - | - | - |
| gap_solutions | ✓ | ✓ | - | - | - |
| provenance_explanations | - | - | ✓ | ✓ | - |
| resurrection_priorities | ✓ | ✓ | - | - | ✓ |
| creator_speed_events | ✓ | ✓ | - | - | - |
| commission_requests | - | - | - | - | - |
| noizy_ledger | - | - | - | - | - |

---

## Enforcement Location

`src/gorunfree/d1-write-contract.js`

This file is the single source of truth for D1 write permissions. All GORUNFREE D1 mutations MUST import and use `assertD1WriteAllowed()` before executing.

---

*Let KV run free. Make D1 earn its writes.*
