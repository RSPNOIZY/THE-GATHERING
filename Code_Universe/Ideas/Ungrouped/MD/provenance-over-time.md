# Provenance Over Time

## What This Is

A **read-only provenance history** showing how explanations and constraints evolve — without exposing raw training data or internals.

You should be able to answer:

> "Why is this result different than last month?"

---

## How To Access

On any generated output or search result, look for:

**"Provenance History"** link

---

## What You See

| Field | Example |
|-------|---------|
| Date | April 6, 2026 |
| Change | New consent source added |
| Effect | Match accuracy increased |
| Constraint | One source excluded |
| Status | Cleared |

---

## Example Entry

> **April 6, 2026**
>
> This result now excludes a previously adjacent vocal archive because updated consent restrictions were applied.
>
> No action required.

---

## What Changes Get Recorded

### Additions

- New consented sources became available
- Archive materials resurrected with permission
- Style models expanded

### Exclusions

- Consent terms changed or revoked
- Rights holder requested removal
- Quality threshold adjustments

### Adjustments

- Matching confidence improved
- New constraints applied
- Provenance explanation expanded

---

## What You Won't See

- Raw training data
- Internal model weights
- Competitor information
- Unverified claims

---

## Why This Matters

### Trust Accrues Over Time

When you see a consistent, explainable history, you know the system is accountable.

### Silence Becomes Suspicious

Systems that hide their reasoning erode trust. We choose transparency.

### You Learn The Boundaries

Over time, you naturally understand what the system can and cannot do — without reading manuals.

---

## Data Sources

All provenance history comes from:

- `provenance_explanations` (our truth database)
- `audit_events` (our append-only event log)

No speculative data is shown here. Everything displayed has been verified.

---

## Frequency of Updates

Provenance changes are recorded:

- When consent status changes
- When new sources are added
- When constraints are applied
- When explanations are enhanced

You can expect updates roughly weekly, or whenever material changes occur.

---

## Questions?

If you want to understand any specific change, contact us.

Every entry in this history has a full audit trail that we can explain.

**Contact:** [rsp@noizy.ai](mailto:rsp@noizy.ai)

---

*Provenance isn't bureaucracy. It's proof that we respect your work.*
