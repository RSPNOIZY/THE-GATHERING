# How We Prove Policy Compliance

## The Short Version

Some rules matter because they were followed — not because of how they were implemented.

For those, we publish cryptographic proofs.

---

## What We Prove Mathematically

These are verified independently, without revealing internal data:

**Consent was active when a voice was used**
- Every use is checked against consent state
- Proof covers: consent existed AND was not revoked

**No generation occurred after revocation**
- Timestamps are compared cryptographically
- Proof covers: last use happened before revocation (or no revocation exists)

**Deployments only advanced after audit checks passed**
- Governance actions require pre-audit
- Proof covers: audit write succeeded before authority was granted

**Promotion stability windows were respected**
- Changes wait for required stability period
- Proof covers: window duration met threshold

**Freeze events were properly resolved**
- Incidents require explanation before resolution
- Proof covers: resolution notes exist and resolver is identified

---

## How These Proofs Work

1. Every audit event is hashed and added to a Merkle tree
2. The tree's root is anchored on public blockchains (Ethereum, Bitcoin)
3. A zero-knowledge proof demonstrates:
   - The event exists in the tree
   - The event satisfies the policy
4. The proof reveals the answer (yes/no) — not the event details

Anyone can verify these proofs using only the public root.

---

## What We Report Transparently

Other information is best conveyed clearly and in plain language:

**Aggregate metrics**
- How many times the system paused
- Average time to resolve incidents
- Percentage of events with proofs

**System health**
- Anchor freshness (last published)
- Cross-chain agreement
- Coverage percentages

These are reported openly but are not part of cryptographic proofs.

---

## Why We Separate the Two

> **Proofs guarantee correctness.**
> **Reports communicate context.**

A proof tells you *that* a rule was followed.
A report tells you *how often* or *how well*.

Using both avoids over-sharing while still enabling scrutiny.

---

## What Is Never Exposed

Even in proofs, we do not reveal:

- Who performed an action (only that the role was appropriate)
- The content of explanations (only that explanations exist)
- Raw audit data (only that it matches the anchored root)
- Internal system names or architecture

---

## Verification Modes

| Question | Mode |
|----------|------|
| "Was consent active?" | Cryptographic proof |
| "How many incidents this month?" | Transparent report |
| "Who approved this change?" | Never disclosed |

---

## Independent Verification

You don't need to trust us to verify these claims.

1. Download the verification bundle for any date
2. Run the included script
3. Compare the computed root to the blockchain anchor
4. Verify any ZK proofs against the public root

No accounts. No credentials. No access required.

---

## One Sentence Summary

> **Where correctness matters, we prove it.**
> **Where context matters, we explain it.**

---

## Learn More

- [Verify an Audit Anchor](/trust/verify-audit-anchor) — step-by-step guide
- [Anchor Status](/trust/anchor-status) — live anchoring health
- [Proof Coverage](/trust/proof-coverage) — current coverage metrics

---

*NOIZY — Consent as executable code. Provenance as default.*
