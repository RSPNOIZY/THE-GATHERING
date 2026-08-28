# NOIZY EDGE CORE

NOIZY EDGE CORE is the runtime control plane for creator-safe infrastructure.

It is the production spine responsible for governing how change is introduced,
observed, constrained, and reversed at the edge.

This document defines **doctrine**, **architecture**, and **operational law**.
If a change violates EDGE CORE doctrine, it does not ship.

---

## Core Law

**If the edge cannot observe itself, choose restraint, and roll back safely, the edge cannot be trusted.**

This law is non-negotiable.

---

## What EDGE CORE Guarantees

EDGE CORE exists to ensure that:

- feature flags change behavior **globally at the edge**
- deployments roll out **gradually and reversibly**
- risky surfaces (e.g. `/api/*`) can be **isolated surgically**
- observability is consulted **before rollout expands**
- error-budget policy determines whether promotion continues
- recovery state is always visible in a **separate read-only account**

This is restraint engineered into the runtime.

---

## System Stack Placement

```
CREATOR SOVEREIGNTY
├── VOICE ESTATE
│   ├── consent verification
│   ├── rights state
│   ├── voice rendering / identity controls
│   └── proof bundles
├── SAMPLE INTELLIGENCE
│   ├── SHIRL classification
│   ├── METABEAST archive rescue
│   ├── semantic search
│   └── archive memory
└── EDGE CORE
    ├── feature flags
    ├── gradual deployments
    ├── route canaries
    ├── observability
    ├── error-budget gating
    └── read-only disaster recovery
```

EDGE CORE does not create product value.
It protects the conditions under which product value can exist.

---

## Cloudflare Primitives Used

EDGE CORE is built only on **explicitly supported Cloudflare Workers capabilities**:

| Capability | Cloudflare Primitive |
|-----------|---------------------|
| Feature flags | Workers KV (read-heavy configuration) |
| Gradual deployments | Workers gradual deployments (version traffic splitting) |
| Route isolation | Worker routes and environments |
| Observability | Workers analytics, logs, metrics |
| Rollbacks | Workers deployments / versions |
| Disaster recovery visibility | Workers Platform (Read-only) role |

No undocumented behavior is relied upon.

---

## 1. Feature Flags (Behavior Control)

**Purpose:** Change behavior globally without redeploying code.

**Primitive:** Workers KV
**Constraint:** KV is eventually consistent; flags must tolerate propagation delay.

**Rule:**
- KV is the default for feature flags.
- Critical kill switches may use a stronger control path, but **never bypass EDGE CORE**.

**Properties:**
- Global, low-latency reads
- No compute on write
- Safe defaults required

---

## 2. Gradual Deployments (Primary Rollout Mechanism)

**Purpose:** Introduce new Worker versions safely.

**Primitive:** Cloudflare gradual deployments.

**Rule:**
- **Version canaries come first.**
- No version reaches 100% traffic without surviving observation.
- Rollback must remain available at every stage.

**Default progression (example):**
1% → 10% → 50% → 100%

Gradual deployment is the **first line of safety**, not route isolation.

---

## 3. Route Canaries (Blast-Radius Control)

**Purpose:** Contain risk on known-dangerous surfaces.

**Primitive:** Worker routes and environments.

**Pattern:**
- Production Worker owns `/*`
- Canary Worker owns specific paths:
  - `/api/*`
  - `/search/*`
  - other high-risk endpoints

**Rule:**
- Route canaries refine rollout scope.
- They do not replace version canaries.

---

## 4. Observability (Truth Before Promotion)

**Purpose:** Prevent promotion based on hope or inertia.

**Primitive:** Workers metrics, logs, analytics.

**EDGE CORE will not promote a change unless:**
- request volume is known
- error rate is known
- rollback signals are visible

Without observability, rollout is theater.

---

## 5. Error-Budget Gating (Velocity Control)

**Purpose:** Stop risk expansion when users are hurting.

**Primitive:** Operational policy evaluated in CI, enforced before promotion.

**Rule:**
- While error budget remains: change may proceed.
- When error budget is exhausted:
  - feature deployments freeze
  - rollbacks and reliability fixes remain allowed

Error budgets are not punishment.
They are permission boundaries.

---

## 6. Read-Only Disaster Recovery (Recovery Visibility)

**Purpose:** Prove we can see the system under failure without risking writes.

**Primitive:** Workers Platform (Read-only) role.

**What this provides:**
- visibility into deployments
- visibility into routes and config
- visibility into observability surfaces

**What this does NOT do:**
- it is not active traffic failover
- it does not mutate state

Recovery visibility without write access is deliberate.

---

## Engineering Translation

**Voice Estate**
- no token, no compute
- rights state must be visible
- proof bundle emitted on sensitive actions

**SHIRL / METABEAST**
- classify what exists
- rescue what is buried
- never fake what is missing
- leave the archive more searchable than you found it

**EDGE CORE**
- flags control behavior
- gradual deployments control rollout
- routes control blast radius
- observability gates promotion
- budgets gate velocity
- read-only DR proves preparedness

---

## Final Constraint

If a proposed change:
- cannot be observed,
- cannot be slowed,
- cannot be rolled back,

it is not an EDGE CORE-compliant change.

It does not ship.

---

## Status

EDGE CORE is:
- minimal
- enforceable
- auditable
- designed to say "no" by default

This is not mythology.
This is production law.

---

## Implementation Reference

| Layer | Source | Script |
|-------|--------|--------|
| Feature Flags | `src/flags.js` | `npm run flags:setup` |
| A/B Experiments | `src/experiments.js` | `npm run promote` |
| Error Budget | `src/error-budget.js` | `npm run budget` |
| Traffic Throttling | `src/throttle.js` | KV-controlled |
| Observability | `src/observability.js` | Automatic |
| Change Freeze | - | `npm run change-freeze` |
| DR Drill | - | `npm run dr:quick` |
| Postmortem | - | `npm run postmortem` |

---

*Version: 1.0*
*Effective: 2026-04-07*
*Owner: RSP_001*
*Review: Quarterly*
