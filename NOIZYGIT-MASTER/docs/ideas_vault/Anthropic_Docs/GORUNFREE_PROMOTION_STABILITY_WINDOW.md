# GORUNFREE Promotion Stability Window Spec

## Purpose

This document defines **how long** and **under which conditions** GORUNFREE signals must remain stable before:

- KV → D1 promotion occurs
- Rollout stages advance
- Truth is committed permanently

The goal is to balance **responsiveness** with **institutional memory safety**.

---

## Core Principle

> **Truth must survive time, not just load.**

Stability windows prevent:

- Flash-crowd bias
- Early-traffic distortion
- Truth writes from transient behavior

---

## Stability Window Definitions

| Window | Duration | Use Case |
|--------|----------|----------|
| Micro | 2-5 minutes | UX gating, previews |
| Short | 15 minutes | KV → D1 candidate eligibility |
| Medium | 60 minutes | Broad promotion confidence |
| Long | 24 hours | Archive resurrection priority |

---

## Required Signals During Window

All must remain **continuously true** for the full window duration:

- `METRICS_PRESENT` - Version is emitting metrics
- `LATENCY_OK` - P95 ≤ 200ms
- `ERROR_RATE_OK` - Error rate ≤ 0.1%
- `NO_EXCEPTIONS_SPIKE` - Exceptions within baseline
- `VERSION_CANARY_ACTIVE` - ≥1% traffic via gradual deploy
- `CONSENT_ZERO_BYPASS` - Zero unauthorized accesses *(trust surfaces only)*

**A single violation RESETS the window clock.**

---

## Recommended Defaults (GORUNFREE Wave 5)

| Action | Window | Rationale |
|--------|--------|-----------|
| Gap candidate promotion | 15 minutes | Captures real user behavior without slowing iteration |
| Solution ranking persistence | 15 minutes | Matches gap promotion timing |
| Provenance explanation commit | Immediate | Consent already verified via S5 + S6 |
| Resurrection priority creation | 60 minutes | Filters regional anomalies |
| Full-wave promotion | 60 minutes | Requires broader confidence |
| Archive cultural decisions | 24 hours | Resists hype cycles |

---

## Configuration

Stored in `FEATURE_FLAGS` KV:

```bash
# Set window durations (in milliseconds)
npx wrangler kv key put --binding FEATURE_FLAGS gorunfree_window_short "900000"     # 15 min
npx wrangler kv key put --binding FEATURE_FLAGS gorunfree_window_medium "3600000"   # 60 min
npx wrangler kv key put --binding FEATURE_FLAGS gorunfree_window_long "86400000"    # 24 hours
```

---

## Window State Machine

```
IDLE → OBSERVING → STABLE → PROMOTED
         ↓
      (violation)
         ↓
       RESET → IDLE
```

### States

| State | Description |
|-------|-------------|
| IDLE | No active observation |
| OBSERVING | Window clock running, signals being monitored |
| STABLE | Window completed without violations |
| PROMOTED | D1 write completed |
| RESET | Violation detected, clock restarted |

---

## Implementation

### Tracking Structure (KV)

```json
{
  "candidate_id": "gap:90s_rnb_female",
  "window_type": "short",
  "window_started_at": 1712620800000,
  "window_duration_ms": 900000,
  "violations": [],
  "current_state": "OBSERVING",
  "signals_at_start": {
    "metricsPresent": true,
    "latencyOk": true,
    "errorRateOk": true,
    "canaryActive": true
  }
}
```

### Violation Recording

```javascript
async function recordViolation(env, candidateId, signal, value) {
  const tracking = await env.GAP_SOLVER.get(`window:${candidateId}`, 'json');
  if (!tracking) return;

  tracking.violations.push({
    signal,
    value,
    timestamp: Date.now()
  });

  // Reset window
  tracking.window_started_at = Date.now();
  tracking.current_state = 'RESET';

  await env.GAP_SOLVER.put(`window:${candidateId}`, JSON.stringify(tracking));

  // Log violation
  await logViolation(env, candidateId, signal);
}
```

### Stability Check

```javascript
async function checkStability(env, candidateId) {
  const tracking = await env.GAP_SOLVER.get(`window:${candidateId}`, 'json');
  if (!tracking) return { stable: false, reason: 'Not tracked' };

  const elapsed = Date.now() - tracking.window_started_at;

  if (elapsed < tracking.window_duration_ms) {
    return {
      stable: false,
      reason: 'Window in progress',
      remaining_ms: tracking.window_duration_ms - elapsed
    };
  }

  // Check all signals are still valid
  const currentSignals = await readSignals(env);
  const allGreen = currentSignals.metricsPresent &&
                   currentSignals.latencyOk &&
                   currentSignals.errorRateOk &&
                   currentSignals.canaryActive;

  if (!allGreen) {
    await recordViolation(env, candidateId, 'end_check', currentSignals);
    return { stable: false, reason: 'Signals degraded at window end' };
  }

  return { stable: true, elapsed_ms: elapsed };
}
```

---

## Rationale for Default Timings

### 15 Minutes (Short)

- Typical user session length
- Enough time to capture diverse traffic patterns
- Short enough to keep iteration speed high
- Filters out single-request anomalies

### 60 Minutes (Medium)

- Spans multiple time zones of peak traffic
- Allows regional issues to surface
- Standard SRE observation window
- Matches typical incident detection time

### 24 Hours (Long)

- Full diurnal cycle
- Resists marketing-driven traffic spikes
- Appropriate for decisions that affect cultural archives
- Allows manual review if needed

---

## Enforcement Mechanism

1. **Durable Object tracks window state**
   - Atomic reads/writes prevent race conditions
   - Survives Worker restarts

2. **Scheduled Worker checks signals**
   - Every 5 minutes during observation
   - Records violations immediately

3. **No human override without documented exception**
   - Override requires audit entry
   - Override expires after window duration

---

## Tuning Guidelines

### When to Shorten Windows

- Development/staging environments
- Non-production testing
- Low-risk candidates (e.g., spelling corrections)

### When to Lengthen Windows

- High-stakes cultural decisions
- Archive resurrection approvals
- Changes affecting many creators

### Never Shorten Below

- 2 minutes minimum for any D1 write
- This is the absolute floor

---

## Monitoring

### Metrics to Track

- Average time-to-stability
- Violation frequency by signal type
- Window reset frequency
- Promotion success rate

### Alerts

- Window reset rate > 20% → investigate signal source
- No promotions in 24h → check if stuck
- Same candidate resetting > 5 times → manual review

---

## Final Principle

> **We don't slow down to be safe.
> We observe long enough to be sure.**
