# 04_RECEIPT_SPINE.md
# DreamChamber Imperial Charter — Receipt Spine

The Receipt Spine is the truth engine of the empire.
Without it, everything else is vibes.

---

## Schema standard

All receipts, exports, and verifiers are pinned to:
**JSON Schema Draft 2020-12**

This is the canonical base. Every receipt contract is validated against it.
No schema migration proceeds without a versioned receipt migration.

---

## What a receipt records

- Event type
- Timestamp (ISO 8601, UTC)
- Operator of record (RSP_001 or delegate)
- Creator identity (HVS-linked)
- Action taken
- Consent state at time of action
- Lineage reference (parent receipt ID if applicable)
- Revocation status

---

## Core components

### Local event schemas
Machine-readable contracts for every consequential system action.

### Consent state machine
Current consent status per creator, per use type, per agent.
States: GRANTED / PENDING / REVOKED / EXPIRED

### Lineage graph
Parent-child relationship between all receipts.
Enables full audit trail reconstruction.

### Revoke simulation
Every permission grant must pass revoke simulation before being issued.
If revocation path cannot be proven, the grant is blocked.

### Export verifier
Validates any exported receipt package against the schema.
Produces a pass/fail certificate.

---

## Immutability standard

100-year immutable audit trail.
Receipts are append-only. No deletion. No overwrite.

---

## Constitutional note

The Receipt Spine is the system of record.
Cloudflare authenticates access; the Receipt Spine authorizes truth.
These are distinct functions. They must never be conflated.
