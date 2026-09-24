# GORUNFREE_LAUNCH_SEQUENCE.md

## Purpose
GORUNFREE is the next-wave launch sequence for NOIZYAI.

Its purpose is to ship three creator-facing advantages in the right order:
- **creator-perceived speed**
- **provenance as power**
- **negative space intelligence**

This launch sequence is designed to stay aligned with **EDGE CORE** so speed never outruns trust, observability, or rollback safety.

---

## Launch Thesis
GORUNFREE succeeds when creators experience:

- faster decisions
- clearer trust signals
- stronger understanding of provenance
- useful gap detection
- safer routes to action

The system should feel:
- fast before generation
- trustworthy before export
- helpful when something is missing

---

## Core Rule
**Lock config first.
Lock runtime second.
Lock routing third.
Expand traffic gradually.**

---

## Release Surfaces

### 1. Creator-Perceived Speed
Surface:
- `src/routes/preflight.js`

Primary user outcome:
- the creator knows what exists, what is missing, and whether consent is clear **before** generation begins

Minimum UI outputs:
- existence check
- match count
- gap warning
- consent state
- confidence state

### 2. Provenance as Power
Surface:
- `src/routes/provenance.js`

Primary user outcome:
- the creator can see why the result is safe, where it came from, and what was not copied

Minimum outputs:
- source lineage
- rights / consent state
- proof bundle export hook
- explanation field

### 3. Negative Space Intelligence
Surface:
- `src/routes/absence.js`

Primary user outcome:
- if something is missing, the system proposes actionable next moves instead of silently failing

Minimum outputs:
- gap detected
- ranked options
- resurrection candidate
- commission path
- safe synthetic path if allowed

---

## Architecture Split

### Fast Config Layer
Use **KV** for:
- launch toggles
- UI mode flags
- non-critical gap solver modes
- staged exposure flags

### Durable Truth Layer
Use **D1** for:
- provenance records
- gap records
- resurrection priorities
- trust-surface explanations
- audit trail references

### Runtime Layer
Use **Workers** for:
- request handling
- preflight evaluation
- provenance explanation delivery
- launch gating logic

---

## Pre-Launch Requirements

Before any GORUNFREE traffic expansion:

1. `FEATURE_FLAGS` namespace exists
2. `GAP_SOLVER` namespace exists
3. D1 tables for provenance and gaps exist
4. version-tagged observability is live
5. rollback path is documented
6. EDGE CORE checks pass

---

## Recommended D1 Tables

See: `migrations/gorunfree_schema.sql`

- `provenance_explanations`
- `gap_records`
- `gap_solutions`
- `resurrection_priorities`
- `creator_speed_events`

---

## KV Namespace Setup

```bash
npx wrangler kv namespace create FEATURE_FLAGS
npx wrangler kv namespace create FEATURE_FLAGS --preview
npx wrangler kv namespace create GAP_SOLVER
npx wrangler kv namespace create GAP_SOLVER --preview
```

---

## Initial Flag Seeding

```bash
npx wrangler kv key put --binding FEATURE_FLAGS gorunfree_ui on
npx wrangler kv key put --binding FEATURE_FLAGS provenance_power on
npx wrangler kv key put --binding GAP_SOLVER gap_mode on
```

---

## Deployment Sequence

### Stage 0 — Prepare
- confirm bindings
- confirm D1 migrations
- confirm observability
- confirm route impact
- confirm EDGE CORE status

### Stage 1 — Deploy New Version
```bash
npx wrangler deploy
```

### Stage 2 — Gradual Promotion
Recommended progression:
- 1%
- 5%
- 10%
- 25%
- 50%
- 100%

Do not skip stages unless explicitly approved.

### Stage 3 — Verify at Each Step
Check:
- request volume
- success rate
- error rate
- exception rate
- latency
- trust-surface regressions

### Stage 4 — Roll Back if Needed
If error thresholds or trust-surface conditions degrade, stop promotion and roll back.

---

## Verification Commands

```bash
# Edge doctrine
./scripts/edge-core/check-all.sh

# Health check
curl https://heaven.rsp-5f3.workers.dev/health

# GORUNFREE endpoints
curl "https://heaven.rsp-5f3.workers.dev/preflight?intent=90s+R%26B+female"
curl https://heaven.rsp-5f3.workers.dev/absence/gaps
curl https://heaven.rsp-5f3.workers.dev/absence/representation

# Flag check
curl https://heaven.rsp-5f3.workers.dev/flags/gorunfree_ui
```

---

## Acceptance Criteria

### Creator-Perceived Speed
- preflight panel renders without blocking
- existence check returns in <500ms
- consent state is visible before generation
- missing elements are surfaced without dead-end failure

### Provenance as Power
- creator can see what source was used
- creator can see what was not copied
- consent/rights state is attached to result
- proof-bundle export path exists

### Negative Space Intelligence
- missing assets are detected
- at least 3 solution paths returned when relevant
- gap recorded in structured storage
- resurrection priorities can be queried

---

## Launch Metrics

### Operational
- request success rate
- exception rate
- latency
- rollout stage health

### Product
- preflight completion rate
- proof bundle export count
- gap resolution rate
- resurrection candidate conversion rate

---

## Freeze Conditions

GORUNFREE promotion freezes when:
- EDGE CORE fails
- required observability is missing
- error budget policy says stop
- provenance/trust surfaces regress
- rollback path is uncertain

---

## Rollback Triggers

Rollback is mandatory when:
- error rate spikes materially
- exceptions increase materially
- provenance output becomes incorrect
- trust surface regresses
- binding configuration invalidates runtime safety

---

## Immediate Execution Block

```bash
# 1. Create KV namespaces
npx wrangler kv namespace create FEATURE_FLAGS
npx wrangler kv namespace create GAP_SOLVER

# 2. Run D1 migrations
npx wrangler d1 execute gabriel_db --remote --file migrations/gorunfree_schema.sql

# 3. Seed launch flags
npx wrangler kv key put --binding FEATURE_FLAGS gorunfree_ui on
npx wrangler kv key put --binding FEATURE_FLAGS provenance_power on
npx wrangler kv key put --binding GAP_SOLVER gap_mode on

# 4. Deploy new Worker version
npx wrangler deploy

# 5. Verify
./scripts/edge-core/check-all.sh
curl https://heaven.rsp-5f3.workers.dev/health
```

---

## Final Statement

GORUNFREE launches in the right order:
- fast config first
- structured truth second
- runtime deploy third
- gradual promotion fourth
- rollback before bravado

The system wins when creators feel:
- faster
- safer
- clearer
- more capable

**NOIZYAI does not copy the field. NOIZYAI changes what creators expect from it.**
