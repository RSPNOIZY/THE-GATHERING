# NOIZY CONSTITUTION v2.0
**Status:** Binding Design Doctrine
**Date:** March 25, 2026
**Author:** Robert Stephen Plowman (RSP_001) — rsp@noizyfish.com
**Supersedes:** All prior NOIZY operating principles

---

## Preamble

NOIZY is consent-native infrastructure for creator sovereignty in the age of generative AI.
It does not ask creators to trust platform promises.
It encodes identity, consent, provenance, revocation, and royalties into the operating system itself.

This Constitution is the immovable layer. Policy derives from it. Runtime enforces it.
Nothing in NOIZY may contradict these Articles.

---

## Article I — Creator Sovereignty

A creator's voice, identity, style, and acoustic signature are sovereign assets.

They are never presumed to be public utility, generic data, or platform property.

No entity — platform, partner, AI system, or automated process — acquires any claim
over a creator's sovereign assets without explicit authorization by the creator.

The burden of proof for any claimed right to use a creator asset lies with the claimant,
not with the creator.

---

## Article II — Consent is Structural

No use of a creator asset may proceed without explicit, verifiable, auditable consent.

Consent must be:
- **Machine-readable** — expressible as a structured data record
- **Time-bounded** — tied to a defined term unless explicitly set otherwise
- **Revocable** — withdrawable by the creator at any time
- **Queryable** — inspectable by the creator, by NOIZY agents, and by authorized parties
- **Scoped** — limited to the usage types, tools, and territories explicitly authorized

Consent is not implied by registration. Consent is not implied by prior use.
Every use case requires its own valid authorization.

---

## Article III — Provenance is Mandatory

Any output derived from creator-linked assets must carry provenance metadata sufficient to:
- identify the source creator asset
- identify the authorization path (consent record)
- identify the processing system and model version
- establish the timestamp and processing sequence
- establish current provenance status

An output with missing or unverifiable provenance may not be distributed as a trusted asset.
It must be held, flagged, or rejected until provenance is confirmed.

---

## Article IV — Royalties Route by Default

When creator assets generate economic value, creator compensation must be routed automatically.

The NOIZY default economic standard is **75% to the creator, 25% to the platform**.

This default may only be modified by:
- explicit creator approval
- explicit claimant approval
- a contract-scoped NCP override with signed record, time-bounded term, and visible audit trail

A contract-scoped override applies **only to that agreement**. It does not mutate the platform default.

Royalty events are logged to an append-only ledger. Logged entries may not be modified.

---

## Article V — Revocation is Real

Revocation is not symbolic. It is an operational enforcement action.

When a creator revokes consent for a covered scope, all of the following must occur
within the platform enforcement SLA (default: 1 hour):

- new synthesis requests denied
- new training jobs denied
- new derivative generation denied
- active routing eligibility invalidated
- API requests tied to revoked scope rejected
- pending jobs marked for cancellation
- creator dashboard status updated
- revocation event written to audit log
- historical royalty records preserved
- historical provenance records preserved
- dependent agents and services notified

Historical payments earned before revocation are not clawed back.
The creator retains what they earned.

---

## Article VI — Infrastructure Over Extraction

NOIZY is infrastructure for creator protection, not a system of ownership transfer
disguised as tooling.

NOIZY does not acquire rights over creator assets by operating the infrastructure.
NOIZY does not treat creator registration as consent to use.
NOIZY does not profit from creator assets beyond the platform share defined in Article IV.

The platform exists to protect and route value, not to capture it.

---

## Article VII — Auditability Over Ambiguity

Every economically or creatively meaningful action touching creator assets must be:
- **Attributable** — linked to a specific actor, consent record, and decision
- **Queryable** — inspectable by creators, NOIZY administrators, and authorized auditors
- **Reviewable** — retrievable from the audit log for dispute resolution

When a decision cannot be fully attributed and traced, the correct outcome is HOLD or ESCALATE.
Proceeding under ambiguity is prohibited.

---

## Enforcement Hierarchy

| Layer | Responsibility |
|---|---|
| Constitution | What NOIZY will never violate |
| Policy | What the system allows, blocks, holds, or escalates |
| Runtime | What services check before processing |
| Data Contracts | What must exist in D1 / KV / logs / manifests |
| Audit | What creators, admins, and agents can inspect |

Each lower layer must be consistent with all layers above it.

---

## Amendment

This Constitution may only be amended by RSP_001 (Robert Stephen Plowman).
Amendments require a new signed version with explicit change log.
Runtime systems must be updated to reflect any amendment within 30 days.

**Version:** 2.0
**Status:** Constitution Ready
