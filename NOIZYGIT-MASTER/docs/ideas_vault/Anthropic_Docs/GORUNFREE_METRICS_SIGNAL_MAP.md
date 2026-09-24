# GORUNFREE Metrics → Signal Map

## Purpose

Convert raw Workers metrics into **binary gating signals** used by:

- D1 write-contract
- KV → D1 promotion
- Rollout advancement
- Freeze / rollback

---

## Raw Metrics (Source: Cloudflare Workers Analytics)

| Metric | Source |
|--------|--------|
| Request count | Workers analytics |
| P95 latency | Workers analytics |
| Error rate | Workers analytics |
| Exception count | Workers logs |
| Consent denials | D1 query stats |
| Active version | Versions / deploy |
| Route | Worker route |

---

## Derived Signals (Consumed by Code)

| Signal | Definition | Threshold |
|--------|------------|-----------|
| `METRICS_PRESENT` | Metrics reporting for version | Any data present |
| `LATENCY_OK` | P95 ≤ threshold | P95 ≤ 200ms |
| `ERROR_RATE_OK` | Error rate ≤ threshold | Error rate ≤ 0.1% |
| `NO_EXCEPTIONS_SPIKE` | Exceptions within baseline | < 2x baseline |
| `CONSENT_ZERO_BYPASS` | 0 unauthorized accesses | Exactly 0 |
| `VERSION_CANARY_ACTIVE` | ≥1% gradual deploy | Deployment ≥ 1% |
| `METRICS_STABLE` | All above true for N-minute window | 15 minutes |

---

## Signal to D1 Contract Mapping

| Signal Code | D1 Write Contract Signal |
|-------------|--------------------------|
| `METRICS_STABLE` | S3 |
| `VERSION_CANARY_ACTIVE` | S4 |
| `CONSENT_ZERO_BYPASS` | S5 |
| Combined provenance derivation | S6 |

---

## D1 Write Eligibility

**D1 writes are allowed only when:**

```
METRICS_PRESENT
AND METRICS_STABLE
AND VERSION_CANARY_ACTIVE
(+ CONSENT_ZERO_BYPASS for trust surfaces)
```

Anything else → **hard failure**.

---

## Promotion Examples

| Action | Required Signals |
|--------|------------------|
| Insert gap record | `METRICS_STABLE` + `VERSION_CANARY_ACTIVE` |
| Insert solution | `METRICS_STABLE` + `VERSION_CANARY_ACTIVE` |
| Insert provenance | `CONSENT_ZERO_BYPASS` |
| Promote KV → D1 | `METRICS_STABLE` for ≥N occurrences |
| Advance rollout | `METRICS_STABLE` + `NO_EXCEPTIONS_SPIKE` |

---

## Failure Semantics

| Condition | Action |
|-----------|--------|
| Missing signal | **BLOCK** - Write does not proceed |
| Degraded signal | **FREEZE** - Promotion halts |
| Regression | **ROLLBACK** - Automatic version rollback |

Signals are **boolean gates**, not advisory hints.

---

## Signal Evaluation Implementation

### KV Flag Storage

Signals are stored in `FEATURE_FLAGS` KV namespace:

```bash
# Set signal flags
npx wrangler kv key put --binding FEATURE_FLAGS gorunfree_metrics_stable "true"
npx wrangler kv key put --binding FEATURE_FLAGS gorunfree_canary_active "true"
npx wrangler kv key put --binding FEATURE_FLAGS gorunfree_latency_ok "true"
npx wrangler kv key put --binding FEATURE_FLAGS gorunfree_error_rate_ok "true"
```

### Signal Evaluation (Worker)

```javascript
async function evaluateSignals(env) {
  const flags = env.FEATURE_FLAGS;

  return {
    METRICS_PRESENT: true,  // We're running, so metrics exist
    LATENCY_OK: await flags.get('gorunfree_latency_ok') === 'true',
    ERROR_RATE_OK: await flags.get('gorunfree_error_rate_ok') === 'true',
    NO_EXCEPTIONS_SPIKE: await flags.get('gorunfree_no_exceptions') !== 'false',
    CONSENT_ZERO_BYPASS: await flags.get('gorunfree_consent_ok') !== 'false',
    VERSION_CANARY_ACTIVE: await flags.get('gorunfree_canary_active') === 'true',
    METRICS_STABLE: await flags.get('gorunfree_metrics_stable') === 'true'
  };
}
```

---

## Automated Signal Updates

### Recommended Cron Schedule

| Check | Frequency | Source |
|-------|-----------|--------|
| Latency | Every 5 min | Cloudflare Analytics API |
| Error rate | Every 5 min | Cloudflare Analytics API |
| Exceptions | Every 5 min | Workers Logs |
| Stability window | Every 15 min | Rolling aggregation |
| Version state | On deploy | Versions API |

### Signal Update Endpoint

```bash
# Internal endpoint (protected)
POST /internal/signals/update
{
  "signal": "gorunfree_metrics_stable",
  "value": true,
  "reason": "15-minute window clear"
}
```

---

## Dashboard Indicators

| Signal | Green | Yellow | Red |
|--------|-------|--------|-----|
| `LATENCY_OK` | P95 < 150ms | P95 < 200ms | P95 ≥ 200ms |
| `ERROR_RATE_OK` | < 0.05% | < 0.1% | ≥ 0.1% |
| `METRICS_STABLE` | 15+ min stable | 5-15 min | < 5 min |
| `VERSION_CANARY_ACTIVE` | Deployed | Deploying | Not deployed |

---

## Manual Override (Emergency Only)

```bash
# DANGER: Only use in emergencies
# Forces signals to allow writes regardless of metrics

npx wrangler kv key put --binding FEATURE_FLAGS gorunfree_manual_override "true"
npx wrangler kv key put --binding FEATURE_FLAGS gorunfree_override_reason "Emergency hotfix 2026-04-07"
npx wrangler kv key put --binding FEATURE_FLAGS gorunfree_override_by "RSP_001"
```

Manual overrides:
- Expire after 1 hour
- Are logged to audit trail
- Trigger alert to monitoring

---

## Final Principle

> **Metrics earn trust.
> Trust earns writes.
> Writes earn permanence.**

Signals are the gatekeepers. They do not negotiate.
