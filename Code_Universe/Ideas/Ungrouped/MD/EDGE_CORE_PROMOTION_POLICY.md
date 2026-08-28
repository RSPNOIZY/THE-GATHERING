# EDGE CORE Promotion Policy

This document defines the **mechanically enforced rules** for promoting changes through NOIZY infrastructure.

---

## Core Law

> **If the edge cannot observe itself, choose restraint, and roll back safely, the edge cannot be trusted.**

---

## Promotion Order

Changes must flow through these gates **in order**:

```
1. Observability     → Can we measure this?
2. Version Canary    → Gradual deployment (1% → 10% → 100%)
3. Route Canary      → Optional: isolate risky paths
4. Error Budget      → Do we have permission to ship?
5. Production        → Full traffic
```

**Skipping steps is forbidden.**

---

## 1. Observability Before Promotion

No version may be promoted unless it emits the required telemetry needed to judge safety.

**Required telemetry must be emitted by the new Worker version itself, not inferred from aggregate or upstream metrics.**

Minimum required telemetry:
- request volume
- success rate
- error rate
- exception rate
- latency signal appropriate to the service
- deployment/version identifier
- route or surface identifier where applicable

Without version-specific observability, the deployment is flying blind.

---

## 2. Gradual Deployments (Primary Mechanism)

Cloudflare Workers gradual deployments are the **primary progressive delivery primitive**.

**Rule:**
All promotions begin as gradual deployments unless an explicit exemption is documented, justified, and approved.

### Required

- Use `wrangler versions deploy --percentage` for traffic splitting
- Monitor at each stage before expanding
- Rollback must be available at every percentage

### Progression

Default: `1% → 10% → 50% → 100%`

| Stage | Duration | Action if errors spike |
|-------|----------|------------------------|
| 1% | 30 min | Rollback immediately |
| 10% | 1 hour | Rollback immediately |
| 50% | 2 hours | Investigate, rollback if needed |
| 100% | Stable | Monitor, postmortem if issues |

---

## 3. Route Canaries (Secondary Mechanism)

**Route canaries are invalid unless a version-split gradual deployment is already in place or explicitly introduced in the same change.**

**Rule:**
Route canaries do not satisfy the requirement for version-based gradual deployment.

### Why This Rule Exists

Route canaries isolate traffic by path (e.g., `/api/*` → canary worker).
They do **not** provide version comparison, metrics splitting, or automatic rollback.

Using route canaries alone bypasses Cloudflare's primary safety mechanism.

### Valid Configurations

| Version Canary | Route Canary | Valid? |
|----------------|--------------|--------|
| ✅ | ❌ | ✅ Yes — gradual deployment |
| ✅ | ✅ | ✅ Yes — full progressive delivery |
| ❌ | ✅ | ❌ **No — EDGE CORE violation** |
| ❌ | ❌ | ✅ Yes — direct deploy (if budget healthy) |

### Route Canary Use Cases (When Valid)

- Isolate `/api/*` to canary worker for additional blast-radius control
- Test high-risk paths separately from homepage
- Path-specific feature experiments

---

## 4. Flags Are Not Governance by Themselves

Feature flags (KV-backed) enable <1ms runtime behavior changes. They are useful but **insufficient for governance**.

### Normal Flags (KV)
- Enable/disable features
- A/B experimentation
- Gradual rollout by percentage

### Restricted Flags (Hard-Stop Controls)
- Consent validation
- Kill Switch
- Never Clause enforcement

**Rule:**
Any control capable of unblocking prohibited or trust-critical compute must be treated as a hard-stop control, not an ordinary feature flag.

Hard-stop controls use Durable Objects and require explicit RSP_001 authorization.

---

## 5. Error Budget Authority

Error budget gates **promotion**, not publication.

### When Budget Is Healthy

- Feature deployments proceed
- Gradual rollout expands on schedule
- Route canaries can be activated

### When Budget Is Exhausted

- Feature deployments **freeze**
- Rollbacks remain allowed
- Reliability fixes bypass freeze
- Route canaries cannot expand risk

---

## Enforcement

These rules are enforced in CI via:

- `scripts/edge-core/check-route-canary-order.sh`
- `scripts/edge-core/check-error-budget.sh`
- `.github/workflows/edge-core-compliance.yml`

**There is no override.** Changes that violate promotion policy do not ship.

---

## Quick Reference

| Action | Allowed When |
|--------|--------------|
| Publish new version | Always |
| Expand to 10% | 1% stable, budget healthy |
| Expand to 100% | 50% stable, budget healthy |
| Activate route canary | Version canary active |
| Rollback | Always |
| Reliability fix | Always (bypasses freeze) |

---

## Doctrine Reference

- `docs/NOIZY_EDGE_CORE.md` — Core law and architecture
- `docs/EDGE_CORE_AUDIT_CHECKLIST.md` — Pre-merge verification
- `docs/DR-PLAYBOOK.md` — Recovery procedures

---

*This is not policy. This is mechanically enforced behavior.*
