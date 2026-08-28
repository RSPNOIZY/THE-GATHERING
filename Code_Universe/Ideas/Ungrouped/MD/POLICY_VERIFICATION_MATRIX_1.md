# POLICY VERIFICATION MATRIX

## Verification Classes

| Class | Meaning | Use Case |
|-------|---------|----------|
| **ZK-verifiable** | Can be proven cryptographically without disclosure | Binary correctness ("was X true?") |
| **Reportable** | Must be shown explicitly (counts, dates, summaries) | Aggregate context ("how many times?") |
| **Hybrid** | ZK proof for correctness + reported metadata | Correctness with context |
| **Never ZK** | Intentionally excluded from cryptographic proofs | Privacy-sensitive fields |

---

## Policy Verification Matrix

| Policy | ID | Verification Mode | Rationale |
|--------|----|--------------------|-----------|
| Consent active at use | `CONSENT_ACTIVE_ON_USE` | ZK-verifiable | Boolean predicate over committed fields |
| Revocation honored | `REVOCATION_HONORED` | ZK-verifiable | Timestamp comparison (no disclosure) |
| Audit append-only | `HASH_CHAIN_INTACT` | ZK-verifiable | Hash-chain consistency check |
| Promotion window met | `PROMOTION_WINDOW_MET` | ZK-verifiable | Numeric threshold check |
| Human approval required | `HUMAN_APPROVAL_REQUIRED` | ZK-verifiable | Operator type check (role, not identity) |
| Freeze properly resolved | `FREEZE_PROPERLY_RESOLVED` | ZK-verifiable | Resolution requirements met |
| Token time-bounded | `TOKEN_TIME_BOUNDED` | ZK-verifiable | TTL constraint check |
| Number of incidents | — | Reportable | Aggregate count, non-sensitive |
| Time to remediation | — | Reportable | Requires actual values, not truth |
| Anchor freshness | — | Reportable | Timestamp age, public info |
| Policy coverage (%) | — | Hybrid | ZK correctness + reported percentage |
| Operator identity | — | Never ZK | Identity intentionally opaque |
| Event content | — | Never ZK | Raw data never exposed |
| Internal system names | — | Never ZK | Implementation detail |

---

## Decision Tree: ZK vs Reportable

```
Is the question "was policy X followed?" (yes/no)
    ├─ YES → ZK-verifiable
    │
    └─ NO → Is it an aggregate (count, average, duration)?
              ├─ YES → Reportable
              │
              └─ NO → Is it privacy-sensitive?
                        ├─ YES → Never ZK
                        │
                        └─ NO → Hybrid
```

---

## Rule of Thumb

> **If the regulator needs to know *that* a rule was followed → ZK-verifiable.**
> **If they need to know *how often* or *how long* → Reportable.**

This keeps ZK proofs focused on **correctness**, not telemetry.

---

## ZK-Verifiable Policies (Full List)

| Policy ID | Predicate Summary | Public Output |
|-----------|-------------------|---------------|
| `CONSENT_ACTIVE_ON_USE` | consent_state == CLEARED AND not revoked | `{policy: true/false}` |
| `REVOCATION_HONORED` | last_use < revocation OR no revocation | `{policy: true/false}` |
| `HASH_CHAIN_INTACT` | computed == stored AND prev matches | `{policy: true/false}` |
| `PROMOTION_WINDOW_MET` | window >= threshold | `{policy: true/false}` |
| `HUMAN_APPROVAL_REQUIRED` | operator != SYSTEM | `{policy: true/false}` |
| `FREEZE_PROPERLY_RESOLVED` | resolved AND notes > 10 chars | `{policy: true/false}` |
| `TOKEN_TIME_BOUNDED` | ttl <= max_allowed | `{policy: true/false}` |
| `AUDIT_BEFORE_AUTHORITY` | audit_success OR no authority | `{policy: true/false}` |

---

## Reportable Metrics (Full List)

| Metric | Description | Frequency |
|--------|-------------|-----------|
| Incident count (30 days) | Number of freeze events | Dashboard |
| Mean time to resolution | Average freeze duration | Monthly report |
| Anchor coverage | Days with published anchors / total days | Dashboard |
| ZK proof coverage | Events with inclusion proofs / total events | Dashboard |
| Policy compliance rate | Compliant events / total events per policy | Monthly report |
| Cross-anchor agreement | Anchors matching across ETH/BTC/Log | Dashboard |

---

## Hybrid Metrics

| Metric | ZK Component | Reported Component |
|--------|--------------|-------------------|
| Policy coverage | Each event is ZK-provable | Percentage is reported |
| Anchor validity | Root matches (ZK) | Age and chains are reported |
| Compliance timeline | Individual events provable | Timeline is visualized |

---

## What Is Never Exposed

| Field | Reason |
|-------|--------|
| `operator_email` | Privacy — role is sufficient |
| `event.explanation` | Internal context — not correctness |
| `metadata` | Implementation detail |
| Raw audit rows | Over-disclosure risk |
| Sibling hashes | ZK proof hides inclusion path |

---

## Regulator-Ready Summary

For regulators, the verification matrix produces:

**ZK Proofs:**
- Proof that consent was active for every use
- Proof that revocations were honored
- Proof that audit chain is intact
- Proof that governance policies were followed

**Transparent Reports:**
- Incident counts and resolution times
- Coverage percentages
- Anchor timestamps and chain references

**Never Disclosed:**
- Individual operator identities
- Raw event contents
- Internal system architecture

---

## Wiring to Code

| Doc Section | Code Location |
|-------------|---------------|
| ZK-verifiable policies | `src/edge-core/zk_policy_proof.js` |
| Reportable metrics | `src/routes/proof-coverage.js` |
| Policy definitions | `docs/POLICY_LANGUAGE_SPEC.md` |
| Public explanation | `public/trust/policy-verification.md` |

---

*Rule: Proofs guarantee correctness. Reports communicate context.*
