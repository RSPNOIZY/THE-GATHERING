# NOIZY_LEGAL_REGULATORY_v1.0
## NO FAKES Act · EU AI Act · Copyright · Liability · Legislation Roadmap

**Version:** 1.0  
**Date:** March 25, 2026  
**Status:** ACTIVE — Living document  
**Owner:** RSP_001 — Robert Stephen Plowman  
**Full compliance checklist:** docs/compliance/no-fakes-act-eu-ai-act-checklist.md

---

## 1. NO FAKES Act (US Federal)

### What It Is

The Nurture Originals, Foster Art, and Keep Entertainment Safe Act (NO FAKES Act) is proposed US federal legislation that creates a federal right against unauthorized AI-generated replicas of a person's voice or visual likeness.

Key provisions:
- Creates a federal IP right in one's voice and likeness (regardless of fame)
- Prohibits creating, hosting, or distributing unauthorized AI replicas
- Provides right of action against platforms that host violations
- Safe harbor available for platforms with robust consent controls
- Applies to voice, likeness, and visual appearance

### NOIZY's Position

NOIZY is not a passive compliance subject — it is the technical enforcement infrastructure that makes NO FAKES Act enforcement operationally possible.

**NOIZY as the technical door:**
- NCP consent ledger = verifiable proof of consent (or lack thereof)
- C2PA manifests = chain of custody for AI-generated audio
- Revocation system = immediate takedown mechanism (1-hour SLA)
- Audit log = evidence trail for litigation/prosecution
- Voice estate = provable ownership record

### Compliance Status

| Requirement | NOIZY Control | Status |
|-------------|---------------|--------|
| Explicit consent before replica creation | NCP token required; synthesis blocked without ACTIVE token | Compliant |
| Right to revoke at any time | Kill Switch; 1-hour enforcement SLA | Compliant |
| Disclosure that content is AI-generated | C2PA manifest on all outputs | Compliant |
| Creator notice of use | Audit log entry + royalty event | Compliant |
| Deceased estate authorization | Voice Estate governance + heir approval | Compliant |
| Platform liability protection | NCP provides machine-enforceable consent evidence | Positioned |
| Takedown mechanism | POST /consent/revoke; 1-hour SLA | Compliant |
| Creator compensation | 75/25 royalty enforced; logged | Compliant |
| Record retention | Immutable audit_log; no DELETE | Compliant |

### Strategic Action

1. **Castle outreach** (immediate): Position NOIZY as the technical infrastructure partner for NO FAKES enforcement — see `NOIZY_STRATEGIC_ALIGNMENT_v1.0.md` Section 2
2. **Safe harbor documentation**: Prepare technical brief demonstrating NOIZY's consent controls qualify for safe harbor
3. **Legislative monitoring**: Track bill progress; engage counsel when vote timeline firms

---

## 2. EU AI Act

**Regulation (EU) 2024/1689** — In force. Implementation dates staggered 2024-2027.

### NOIZY's AI System Classification

| System | Classification | Compliance Tier |
|--------|---------------|-----------------|
| Voice synthesis pipeline (XTTS v2, RVC) | High-Risk (Annex III — biometric-adjacent) | Full Art. 9-15 requirements |
| Heaven consent gateway | Limited Risk | Transparency obligations only |
| GABRIEL AI orchestration | General-Purpose AI (GPAI) | Art. 53 + systemic risk if >10^25 FLOPs |
| DreamChamber UI | Minimal Risk | Voluntary code of practice |

### High-Risk AI Requirements (Art. 9-15)

| Article | Requirement | NOIZY Status | Evidence |
|---------|-------------|-------------|---------|
| Art. 9 | Risk management system | Never Clauses + 9-check consent matrix | docs/policy/runtime-policy.md |
| Art. 10 | Data governance | No unconsented training data; NCP required | schemas/ncp.v1.1.json |
| Art. 11 | Technical documentation | CLAUDE.md, schemas/, workers/ | Repo docs/ |
| Art. 12 | Record-keeping | Immutable audit_log | workers/consent-gateway/schema.sql |
| Art. 13 | Transparency to users | C2PA manifests; NOIZYVOX disclosure | Heaven C2PA block |
| Art. 14 | Human oversight | Board override API; escalation paths | enterprise/board-override-api.md |
| Art. 15 | Accuracy/robustness | 10-check consent matrix; NCP validation | workers/consent-gateway/src/index.js |

### GPAI Model Requirements (Art. 53)

Applies to GABRIEL as a multi-provider AI orchestration layer:

| Requirement | Status | Notes |
|-------------|--------|-------|
| Technical documentation (model card) | Partial | GABRIEL_EXECUTOR_v1.0.txt exists; formal model card needed |
| Copyright compliance policy | Compliant | NCP blocks unconsented use |
| Training data summary | Delegated | Inherits from Anthropic/OpenAI/Google — verify per provider |
| Adversarial testing | Partial | consent-decision-cases.json exists; red team schedule needed |
| Incident reporting | Pending | Playbook needed; audit log is foundation |

### Transparency Obligations (Art. 50)

| Obligation | NOIZY Control | Status |
|-----------|---------------|--------|
| Disclose AI-generated content | C2PA manifest; synthetic:true metadata | Compliant |
| Deep fake disclosure | content_type: synthetic_voice in C2PA | Compliant |
| Audio watermarking | 3-layer watermarking (planned Q2 2026) | Pending |

### Open Gaps (EU AI Act)

| Gap | Risk | Target Date |
|----|------|-------------|
| 3rd party conformity assessment | High | Q2 2026 |
| EU GPAI registration | Medium | On implementation date |
| Red team adversarial testing | High | Q1 2026 |
| Incident response playbook | Medium | Q1 2026 |
| Audio watermarking (Art. 50) | Medium | Q2 2026 |

---

## 3. Copyright Framework

### Creator Ownership Doctrine

NOIZY's legal architecture assumes and enforces:
1. **Voice as copyrightable expression**: A creator's distinctive vocal performance is copyrightable in most jurisdictions
2. **AI output ownership**: Outputs generated using a creator's consented voice carry attribution and royalty obligations to that creator
3. **No implied license**: Using a voice sample without NCP consent creates no implied license — it creates liability

### Copyright Registration Guidance (for creators)

```
US creators:
  Register voice performances with US Copyright Office
  Register catalog recordings (Form SR)
  Consider personality rights registration where available

Canadian creators (RSP_001):
  Copyright exists on creation (no registration required)
  Register with Access Copyright for collective licensing
  Consider moral rights assertions for identity-adjacent works

EU creators:
  Copyright and performer's rights auto-exist
  Register with national collecting society (ASCAP/PRS equivalent)
  Assert performer's rights explicitly in NCP terms
```

### NOIZY's Copyright-Adjacent Protections

NCP provides protections that go beyond copyright:
- **Consent-based** (not just copyright-based): protects even where copyright is ambiguous
- **Machine-enforced**: doesn't require litigation to activate
- **Revocable**: unlike copyright assignment, consent can be withdrawn
- **Inheritable**: voice estate passes to heirs with explicit governance

---

## 4. Liability Matrix

### Platform Liability (NOIZYVOX as platform)

| Scenario | NOIZYVOX Liability | Mitigation |
|----------|-------------------|------------|
| AI platform uses voice WITH valid NCP | None — consent is documented | NCP ledger is the evidence |
| AI platform uses voice WITHOUT NCP | None — NOIZYVOX blocked it | CHECK-1 denial + audit log |
| NOIZYVOX system failure causes unconsented use | Potentially liable | SLA + insurance + indemnity |
| Royalty routing failure | Contractually liable | Dispute resolution + audit log |
| Revocation not enforced within 1 hour | Potentially liable | SLA monitoring + auto-alerts |

### Creator Liability

| Scenario | Creator Liability |
|----------|------------------|
| Creator grants NCP, later revokes | Zero — revocation is their right |
| Creator grants NCP to party that misuses it | Potentially limited — NCP scopes usage |
| Creator submits fraudulent identity claim | Criminal — fraud, not civil |

### AI Platform Liability (using NOIZYVOX API)

| Scenario | Platform Liability |
|----------|------------------|
| Uses voice after valid NCP | None |
| Uses voice after NCP revocation | Full liability under NO FAKES Act |
| Ignores DENY decision from consent gateway | Full liability |
| Does not implement C2PA manifest | Liability for provenance fraud |

---

## 5. Jurisdiction Coverage

| Jurisdiction | Relevant Law | NOIZY Alignment | Priority |
|-------------|-------------|-----------------|---------|
| United States | NO FAKES Act (proposed) + state right of publicity | Technical infrastructure | P1 |
| European Union | EU AI Act + GDPR + performer's rights | Full compliance roadmap | P1 |
| Canada | Copyright Act + Bill C-27 (proposed AI) | RSP_001 home jurisdiction | P1 |
| United Kingdom | AI whitepaper + CDPA | NCP submission as standard | P2 |
| Australia | Copyright Act + AI consultation | Monitor | P3 |
| International | WIPO AI/IP | NCP as open standard proposal | P2 |

---

## 6. Privacy Law Compliance

### Voice as Biometric Data

Many jurisdictions classify voice prints as biometric data:
- **GDPR (EU)**: Biometric data = special category; explicit consent required
- **CCPA (California)**: Biometric data included in personal information
- **BIPA (Illinois)**: Strict biometric data consent requirements
- **PIPEDA (Canada)**: Sensitive personal information; consent required

NOIZY's compliance approach:
- NCP token explicitly captures biometric data consent
- `storage_consent` field in NCP v1.1 covers biometric storage
- Never Clause NC-04: never store biometric voice data without storage consent
- Creator controls their biometric data scope via NCP terms

### Data Minimization

| Data Element | Retention | Purpose | Creator Control |
|-------------|-----------|---------|-----------------|
| Voice sample | Per NCP term | Synthesis only | Creator can purge |
| Acoustic fingerprint | Per NCP term | Identity verification | Creator-owned |
| Usage events | Permanent (audit) | Royalty + compliance | Read-only audit |
| Royalty transactions | 7 years (tax) | Financial records | Read access |
| NCP consent record | Permanent | Legal evidence | Creator-owned |

---

## 7. Legislation Roadmap 2026–2028

| Milestone | Target | NOIZY Action |
|-----------|--------|-------------|
| NO FAKES Act vote | 2026 | Castle briefing; safe harbor documentation |
| EU AI Act Art. 53 registration | Mid-2026 | Submit GPAI documentation |
| Canada Bill C-27 passage | 2026-2027 | Engage ISED consultation |
| WIPO AI/IP framework | 2026-2027 | Submit NCP as proposed standard |
| UK AI Act (anticipated) | 2027 | NCP submission to DSIT |
| HVS recognition in copyright law | 2027+ | Guild of Artists legislative campaign |
| Platform integration mandate | 2028+ | Spotify/Apple/YouTube compliance lobbying |

---

## 8. Enforcement Playbook

### Level 1 — API Enforcement (automated)

When consent gateway returns DENY:
- Request blocked at API level
- Audit log entry created
- No human intervention required

### Level 2 — Revocation Enforcement (1-hour SLA)

On revocation:
1. `revocation_events` record created
2. All active consent records for creator set to REVOKED
3. Consent gateway returns DENY for all subsequent requests
4. Monitoring alert if any request succeeds after revocation (breach)
5. Royalty routing stopped for new events; historical payments honored

### Level 3 — Platform Non-Compliance

If a platform continues using voice after DENY:
1. NOIZYVOX generates compliance report from audit_log
2. Creator + legal counsel notified
3. Evidence package: NCP record + revocation timestamp + subsequent usage log
4. NO FAKES Act / GDPR complaint filed with appropriate authority
5. Civil action supported by immutable audit trail

### Level 4 — Board Override

For escalated cases requiring board action — see `enterprise/board-override-api.md`
