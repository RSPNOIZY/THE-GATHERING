# Ops Playbook: GORUNFREE Freeze Reasons

## Purpose

This playbook defines **standard freeze categories**, **detection signals**, and **operator actions** when GORUNFREE promotion halts.

Freezes are **protective**, not failures.

---

## Freeze Categories

### FREEZE-001: Metrics Degradation

**Severity:** HIGH

**Triggered by:**
- Error rate > 0.1% for 5+ minutes
- P95 latency > 200ms for 5+ minutes
- Exception count > 2x baseline

**Detection Signal:**
```
gorunfree_error_rate_ok = false
OR gorunfree_latency_ok = false
OR gorunfree_no_exceptions = false
```

**Operator Action:**
1. Stop all active promotions immediately
2. Check Workers Analytics for error patterns
3. Review recent code changes
4. Roll back version if regression confirmed
5. Wait for metrics to stabilize before resuming

**Resolution Criteria:**
- Metrics return to green for full stability window
- Root cause documented

---

### FREEZE-002: Observability Missing

**Severity:** HIGH

**Triggered by:**
- Version not reporting metrics
- Route not emitting signals
- Analytics gap > 10 minutes

**Detection Signal:**
```
gorunfree_metrics_present = false
OR analytics.datapoints.length < expected
```

**Operator Action:**
1. Treat version as unobservable (cannot prove safety)
2. Check Cloudflare dashboard for analytics status
3. Verify wrangler.toml has `[observability] enabled = true`
4. Roll back or redeploy with instrumentation

**Resolution Criteria:**
- Metrics flowing normally for 15+ minutes
- No gaps in analytics data

---

### FREEZE-003: Consent Integrity Risk

**Severity:** CRITICAL

**Triggered by:**
- Consent bypass attempt detected
- Inconsistent consent state in D1
- Never Clause violation attempt

**Detection Signal:**
```
gorunfree_consent_ok = false
OR audit_events contains 'consent_violation'
OR audit_events contains 'never_clause_blocked'
```

**Operator Action:**
1. **IMMEDIATE STOP** - No exceptions
2. Halt all D1 writes
3. Initiate full audit trail review
4. Notify RSP_001 directly
5. Do not resume until root cause found

**Resolution Criteria:**
- Audit complete
- Root cause fixed
- 24-hour stability window after fix

---

### FREEZE-004: Promotion Window Reset

**Severity:** LOW

**Triggered by:**
- Signal dip during stability window
- Transient error spike
- Network glitch

**Detection Signal:**
```
window.state = 'RESET'
AND violation.type != 'consent'
```

**Operator Action:**
1. No rollback required
2. Allow window to re-establish naturally
3. Monitor for recurring resets
4. Investigate if same signal resets > 3 times

**Resolution Criteria:**
- New stability window completes successfully
- No recurring violations

---

### FREEZE-005: Manual Override

**Severity:** VARIES

**Triggered by:**
- Authorized operator decision
- Scheduled maintenance
- External dependency issue

**Detection Signal:**
```
gorunfree_manual_override = true
```

**Operator Action:**
1. Document reason in audit log
2. Set expected duration
3. Communicate status via appropriate channel
4. Re-evaluate after conditions normalize

**Resolution Criteria:**
- Override reason resolved
- Manual flag removed
- Normal signals restored

---

## Operator Decision Tree

```
Freeze detected
      ↓
Identify category (FREEZE-001 through FREEZE-005)
      ↓
Is it FREEZE-003 (Consent)?
  YES → CRITICAL STOP, notify RSP_001
  NO  → Continue
      ↓
Is rollback required?
  YES → Execute rollback, document
  NO  → Wait for signals to normalize
      ↓
Signals restored?
  YES → Resume promotion
  NO  → Escalate / investigate further
```

---

## Non-Actions (Explicit)

These are **never acceptable** during a freeze:

| Action | Why Not |
|--------|---------|
| Bypass gates manually | Defeats the purpose of governance |
| Shorten windows ad hoc | Compromises stability guarantees |
| Write to D1 manually | Pollutes authoritative truth |
| Ignore FREEZE-003 | Consent is sacred, no exceptions |
| Delete audit entries | Destroys institutional memory |

---

## Resolution Criteria (Summary)

A freeze lifts **only when**:

1. Original trigger condition is no longer present
2. Stability window has re-completed successfully
3. Audit record exists documenting the freeze and resolution
4. (For FREEZE-003) RSP_001 has approved resumption

---

## Escalation Path

| Severity | Escalation |
|----------|------------|
| LOW | Self-resolve, document |
| HIGH | Notify team, document, monitor |
| CRITICAL | Notify RSP_001 immediately, full stop |

---

## Communication Templates

### Freeze Notification (Internal)

```
GORUNFREE FREEZE ACTIVE
Category: FREEZE-00X
Triggered: [timestamp]
Signal: [signal name]
Status: Investigating
ETA: [estimate or "TBD"]
```

### Resolution Notification (Internal)

```
GORUNFREE FREEZE RESOLVED
Category: FREEZE-00X
Duration: [time]
Root Cause: [brief description]
Action Taken: [brief description]
Promotions: Resumed
```

---

## Monitoring Commands

### Check Current State

```bash
# Via KV
npx wrangler kv key list --binding FEATURE_FLAGS --prefix "gorunfree_"

# Specific signals
npx wrangler kv key get --binding FEATURE_FLAGS gorunfree_metrics_stable
npx wrangler kv key get --binding FEATURE_FLAGS gorunfree_canary_active
```

### View Recent Audit Events

```bash
npx wrangler d1 execute gabriel_db --remote --command \
  "SELECT * FROM audit_events WHERE event_type LIKE 'gorunfree%' ORDER BY created_at DESC LIMIT 20"
```

### Force Signal Refresh (Testing Only)

```bash
npx wrangler kv key put --binding FEATURE_FLAGS gorunfree_metrics_stable "true"
```

---

## Final Principle

> **Freezes are not failures.
> Freezes are the system protecting itself.
> Operators execute the playbook.
> The playbook protects the mission.**
