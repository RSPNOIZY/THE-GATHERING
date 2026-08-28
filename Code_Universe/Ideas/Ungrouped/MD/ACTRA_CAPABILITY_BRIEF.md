# NOIZY Consent Infrastructure
## Technical Capability Brief for Union Review

**Prepared for**: ACTRA Technical Review
**Date**: April 2026
**Contact**: Robert Stephen Plowman, rsp@noizy.ai

---

## What This Document Is

A functional description of NOIZY's consent layer in terms relevant to collective agreement enforcement. Not a product pitch. Not a partnership proposal. A technical capability mapping.

---

## 1. Consent Scope

**What the system records:**
- Specific use types authorized (audiobook, podcast, commercial, film, etc.)
- Territory restrictions (Canada, US, EU, or custom list)
- Duration limits (one-time, monthly, annual, project-specific)
- Exclusivity terms
- Compensation requirements

**How scope is enforced:**
- Every synthesis request is checked against the consent record before execution
- If the requested use falls outside the recorded scope, the request is blocked
- No override mechanism exists for blocked requests

**Verification:**
- Consent scope is queryable by the performer at any time
- Scope changes require new consent record (no silent modification)

---

## 2. Revocation Mechanism

**Performer control:**
- Performer can revoke consent at any time through dashboard or API
- Revocation is immediate — no grace period, no review process
- System enforces revocation automatically on all future requests

**What happens on revocation:**
- Consent token is invalidated instantly
- All pending requests using that token are blocked
- All future requests are blocked
- Existing outputs remain (with revocation timestamp in metadata)

**Verification:**
- Revocation status is independently verifiable via public URL
- No system access required to verify revocation occurred

---

## 3. Audit Trail

**What is logged:**
- Every consent grant (who, what scope, when)
- Every synthesis request (who requested, what use, when)
- Every synthesis completion (what was produced, which consent authorized it)
- Every revocation (when, by whom)
- Every payment event (amount, split, recipient)

**Integrity guarantees:**
- Each event is hash-chained to the previous event
- Chain integrity is verified on every read
- Tampering is detectable and logged
- No UPDATE or DELETE operations permitted on audit tables

**Performer access:**
- Performer can view complete audit history
- Performer can export records in standard formats
- Performer can generate compliance reports on demand

---

## 4. Compensation Record

**Split structure:**
- 75% to performer (fixed at system level)
- 24% to platform operations
- 1% to charitable trust (irremovable)

**What is tracked:**
- Gross amount per transaction
- Performer share calculation
- Payment status (pending, processed, completed)
- Payment reference (external system ID)

**Performer visibility:**
- Real-time dashboard showing earnings
- Per-transaction breakdown available
- Payment history exportable

---

## 5. Proof Export

**For regulatory or legal review:**
- System generates compliance bundle on request
- Bundle contains: consent records, revocation records, audit chain, payment records
- Bundle includes verification script for independent validation
- No system access required to verify bundle contents

**For embedded provenance:**
- Synthesized outputs include C2PA manifest
- Manifest contains consent proof reference
- Manifest is independently verifiable via public URL

---

## 6. Current Status

**Live infrastructure:**
- Consent kernel deployed on Cloudflare edge network
- Database with audit triggers preventing record modification
- Public verification endpoint operational
- First performer enrolled: Robert Stephen Plowman (system architect)

**Not yet deployed:**
- Public marketplace (gated behind trust verification phase)
- Label/studio operator consoles (in development)

---

## 7. Alignment Question

We are seeking to understand whether this technical architecture aligns with what ACTRA members need in synthetic voice agreements.

This is not a partnership proposal. This is a technical alignment conversation.

**Specific questions:**
- Does the consent scope model capture the authorization dimensions your members require?
- Does the revocation mechanism meet the control expectations in current agreements?
- Does the audit trail satisfy the transparency requirements for synthetic voice use?
- Are there additional capabilities your members would need that this architecture does not address?

---

## Contact

**Robert Stephen Plowman**
Founding Member, NOIZY
rsp@noizy.ai

Ottawa, Canada

---

*One page. Capability mapping. No sales language.*
