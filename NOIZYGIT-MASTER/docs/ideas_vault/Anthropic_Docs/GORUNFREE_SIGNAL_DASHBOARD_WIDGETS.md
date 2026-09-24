# GORUNFREE Signal Dashboard Widgets

## Purpose

Expose **live, human-readable governance signals** so operators and leads can see why GORUNFREE is allowed to proceed — or why it is frozen.

These widgets are **informational** and do not control state.

---

## Widget 1: Promotion Readiness

### Signals Displayed

| Signal | State |
|--------|-------|
| Metrics stable | ✅ / ⏳ / ❌ |
| Canary active | ✅ / ⏳ / ❌ |
| Consent clean | ✅ / ❌ |
| Error budget available | ✅ / ⚠️ / ❌ |

### Aggregate State

| State | Meaning |
|-------|---------|
| **READY** | All signals green, promotions allowed |
| **HOLD** | Some signals pending, promotions paused |
| **FROZEN** | Critical signal failed, manual intervention needed |

### Implementation

```javascript
async function getPromotionReadiness(env) {
  const signals = await readSignals(env);

  const state = (signals.metricsStable && signals.canaryActive && signals.consentClean)
    ? 'READY'
    : (!signals.consentClean || !signals.errorBudgetAvailable)
      ? 'FROZEN'
      : 'HOLD';

  return {
    state,
    signals: {
      metricsStable: signals.metricsStable,
      canaryActive: signals.canaryActive,
      consentClean: signals.consentClean,
      errorBudgetAvailable: signals.errorBudgetAvailable
    },
    lastUpdated: new Date().toISOString()
  };
}
```

---

## Widget 2: KV → D1 Promotion Queue

### Fields

| Field | Description |
|-------|-------------|
| candidate_id | Unique identifier for the candidate |
| type | Gap type (SOFT_GAP, HARD_GAP, etc.) |
| seen_count | Number of times observed |
| first_seen_at | When first detected |
| age | Time since first seen |
| eligible | Yes/No - meets thresholds? |
| promoted | Yes/No - already in D1? |

### Purpose

Visualize which insights are *about* to become truth.

### Sample Output

```json
{
  "queue": [
    {
      "candidate_id": "gap:90s_rnb_female_alto",
      "type": "HARD_GAP",
      "seen_count": 12,
      "first_seen_at": "2026-04-07T10:00:00Z",
      "age_minutes": 45,
      "eligible": true,
      "promoted": false
    },
    {
      "candidate_id": "gap:afrobeat_male_tenor",
      "type": "CULTURAL_GAP",
      "seen_count": 3,
      "first_seen_at": "2026-04-07T11:00:00Z",
      "age_minutes": 15,
      "eligible": false,
      "promoted": false
    }
  ],
  "summary": {
    "total": 2,
    "eligible": 1,
    "pending": 1
  }
}
```

### Implementation

```javascript
async function getPromotionQueue(env) {
  const list = await env.GAP_SOLVER.list({
    prefix: 'gorunfree:candidate:'
  });

  const queue = [];

  for (const key of list.keys) {
    const candidate = await env.GAP_SOLVER.get(key.name, 'json');
    if (!candidate) continue;

    const age = Date.now() - candidate.first_seen_at;
    const eligible = candidate.seen_count >= 5 && age >= 30 * 60 * 1000;

    queue.push({
      candidate_id: candidate.key,
      type: candidate.type,
      seen_count: candidate.seen_count,
      first_seen_at: new Date(candidate.first_seen_at).toISOString(),
      age_minutes: Math.floor(age / 60000),
      eligible,
      promoted: candidate.promoted || false
    });
  }

  return {
    queue: queue.slice(0, 50),
    summary: {
      total: queue.length,
      eligible: queue.filter(c => c.eligible && !c.promoted).length,
      pending: queue.filter(c => !c.eligible && !c.promoted).length
    }
  };
}
```

---

## Widget 3: GORUNFREE Health Timeline

### Charts

| Chart | Data Source |
|-------|-------------|
| P95 Latency | Workers Analytics |
| Error Rate | Workers Analytics |
| Promotion Attempts | Audit events |
| Rollbacks / Freezes | Audit events |

### Overlay

Version promotion boundaries marked as vertical lines.

### Time Ranges

- Last 1 hour (default)
- Last 6 hours
- Last 24 hours
- Last 7 days

### Sample Data Structure

```json
{
  "timeline": {
    "range": "1h",
    "datapoints": [
      {
        "timestamp": "2026-04-07T11:00:00Z",
        "p95_latency_ms": 145,
        "error_rate": 0.0002,
        "promotion_attempts": 2,
        "promotions_success": 2,
        "rollbacks": 0
      }
    ],
    "version_events": [
      {
        "timestamp": "2026-04-07T10:30:00Z",
        "event": "VERSION_PROMOTED",
        "version": "17.8.0",
        "percentage": 10
      }
    ]
  }
}
```

---

## Widget 4: Trust Surface Integrity

### Signals

| Metric | Description |
|--------|-------------|
| Consent checks executed | Total consent verifications |
| Consent blocks | Synthesis blocked by consent |
| Never Clause blocks | Synthesis blocked by Never Clause |
| Provenance coverage | % of outputs with full provenance |

### Health Indicator

| State | Criteria |
|-------|----------|
| **HEALTHY** | 0 unauthorized accesses, 100% provenance coverage |
| **WARNING** | >0 blocked attempts (expected), <100% provenance |
| **CRITICAL** | Any unauthorized bypass detected |

### Sample Output

```json
{
  "trust_surface": {
    "state": "HEALTHY",
    "last_hour": {
      "consent_checks": 1247,
      "consent_blocks": 3,
      "never_clause_blocks": 0,
      "unauthorized_attempts": 0,
      "provenance_coverage": 100
    },
    "last_24h": {
      "consent_checks": 28945,
      "consent_blocks": 47,
      "never_clause_blocks": 2,
      "unauthorized_attempts": 0,
      "provenance_coverage": 100
    }
  }
}
```

---

## Data Sources

| Widget | Primary Source |
|--------|----------------|
| Promotion Readiness | KV `FEATURE_FLAGS` |
| Promotion Queue | KV `GAP_SOLVER` |
| Health Timeline | Workers Analytics API + D1 `audit_events` |
| Trust Surface | D1 `noizy_ledger` + `audit_events` |

---

## API Endpoint

```
GET /internal/dashboard/gorunfree
```

Returns all widget data in a single response:

```json
{
  "promotion_readiness": { ... },
  "promotion_queue": { ... },
  "health_timeline": { ... },
  "trust_surface": { ... },
  "generated_at": "2026-04-07T11:30:00Z"
}
```

---

## Refresh Rate

| Widget | Recommended Refresh |
|--------|---------------------|
| Promotion Readiness | 30 seconds |
| Promotion Queue | 60 seconds |
| Health Timeline | 60 seconds |
| Trust Surface | 60 seconds |

---

## Visual Design Guidelines

### Color Coding

| State | Color |
|-------|-------|
| READY / HEALTHY | `#10b981` (green) |
| HOLD / WARNING | `#f59e0b` (amber) |
| FROZEN / CRITICAL | `#ef4444` (red) |

### Icons

- ✅ Signal passing
- ⏳ Signal pending
- ❌ Signal failed
- ⚠️ Signal warning

### Layout

1. Promotion Readiness - top banner
2. Trust Surface - sidebar
3. Promotion Queue - main panel (list)
4. Health Timeline - main panel (chart)

---

## Access Control

Dashboard is **internal only**:
- Requires `X-NOIZY-Key` header
- Not exposed publicly
- Read-only (no state mutation from dashboard)
