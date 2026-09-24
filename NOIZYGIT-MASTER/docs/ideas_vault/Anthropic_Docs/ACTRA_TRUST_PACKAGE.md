# NOIZY × ACTRA Trust Package

**Purpose**: Union-aligned governance framework for digital voice replicas
**Version**: 1.0.0
**Date**: 2026-04-07
**Contact**: rsp@noizy.ai

---

## Executive Summary

NOIZY provides technical infrastructure that enforces the consent, control, and compensation principles central to ACTRA's AI policy framework.

**We don't ask performers to trust promises. We make consent technically enforceable.**

---

## ACTRA Vocabulary → NOIZY Implementation

| ACTRA Principle | NOIZY Technical Implementation |
|-----------------|-------------------------------|
| **Explicit Consent** | Consent tokens with cryptographic proofs, signed by performer |
| **Scope of Use** | Allowed-use matrix: territory, duration, use-type, exclusivity |
| **Compensation** | 75% performer share (protocol-locked), automatic payout tracking |
| **Revocation** | Instant Kill Switch — performer can revoke at any time, immediate effect |
| **Transparency** | Audit trail visible to performer, replayable receipts |
| **Proof of Consent** | C2PA-embedded proofs in every output, independently verifiable |

---

## 1. Explicit Consent

### How It Works

Every digital replica use requires an active consent token.

```
Consent Token Structure:
├── token_id: Unique identifier
├── actor_id: Performer's sovereign identity
├── granted_at: When consent was given
├── expires_at: When consent expires (if time-bounded)
├── scope: What uses are authorized
│   ├── use_types: [audiobook, podcast, commercial, ...]
│   ├── territories: [CA, US, EU, ...]
│   └── exclusivity: true/false
├── compensation_terms: How performer is paid
└── revocable: Always true (constitutional)
```

### Verification

Before any synthesis:
1. System checks for active consent token
2. System verifies token hasn't expired
3. System verifies token hasn't been revoked
4. System verifies requested use is within scope
5. If any check fails, synthesis is **blocked**

### Proof

Every consent event is logged with:
- Timestamp
- Hash of consent terms
- Performer acknowledgment signature
- Proof ID for independent verification

---

## 2. Scope of Use

### Allowed-Use Matrix

Performers control exactly what their voice can be used for.

| Use Type | Description | Performer Controls |
|----------|-------------|-------------------|
| Audiobook | Book narration | Yes/No, territory, duration |
| Podcast | Podcast voice | Yes/No, territory, duration |
| Commercial | Advertising | Yes/No, territory, duration |
| Game | Video game character | Yes/No, territory, duration |
| Film/TV | Film and television | Yes/No, territory, duration |
| Music | Music production | Yes/No, territory, duration |
| Personal | Non-commercial | Yes/No |
| Enterprise | Internal business use | Yes/No, territory, duration |

### Territory Restrictions

Performers can restrict their voice to specific territories:
- Canada only
- Canada + US
- Global
- Custom territory list

### Duration Limits

- One-time use
- Monthly license
- Annual license
- Project-specific

---

## 3. Compensation

### Revenue Split (Protocol-Locked)

| Share | Percentage | Status |
|-------|------------|--------|
| Performer | 75% | **Locked — cannot be negotiated down** |
| Platform | 24% | Operational costs |
| GORUNFREE | 1% | Children's charity (irremovable) |

### How Payment Works

1. License request is received
2. Price is calculated based on scope and usage
3. Performer share (75%) is calculated automatically
4. Payment is tracked in immutable ledger
5. Performer dashboard shows all earnings
6. Payouts processed automatically via Stripe

### Payout Dashboard

Performers see:
- Total earnings
- Pending payouts
- Payment history
- Per-license breakdown
- Real-time usage tracking

---

## 4. Revocation

### Kill Switch

**Any performer can revoke consent at any time.**

- Revocation is instant
- No usage after revocation timestamp
- System enforces automatically
- No manual intervention required

### What Happens on Revocation

1. Performer clicks "Revoke" in dashboard
2. Consent token is immediately invalidated
3. All future synthesis requests are blocked
4. Existing outputs remain (with revocation noted in metadata)
5. Audit log records revocation event

### Verification

Anyone can verify revocation status:
- Public verification URL
- C2PA manifest shows revocation status
- Independent verification without system access

---

## 5. Audit Trail

### What Gets Logged

| Event | Logged Data |
|-------|-------------|
| Consent granted | Performer ID, scope, timestamp, proof hash |
| Synthesis requested | Requester ID, use type, timestamp |
| Synthesis completed | Output ID, consent token used, proof ID |
| Consent revoked | Performer ID, timestamp, reason (optional) |
| Payment recorded | Amount, split, timestamp, reference |

### Chain Integrity

- Every event is hash-chained to previous event
- Chain integrity is verified on every read
- Tampering is detectable and logged
- Merkle roots anchored for long-term verification

### Performer Access

Performers can:
- View complete audit history
- Export audit records
- Generate compliance reports
- Replay any event with proof

---

## 6. Proof Export

### C2PA Integration

Every synthesized output includes embedded C2PA manifest with:
- Consent proof (policy ID, verification status)
- Performer consent token reference
- Synthesis timestamp
- Verification URL

### Regulator Bundle

On request, system generates compliance bundle:
- All consent records for performer
- All revocation records
- Audit chain export
- Merkle anchor receipts
- Verification script

### Independent Verification

Anyone can verify without system access:
1. Extract C2PA manifest from output file
2. Read NOIZY proof assertion
3. Visit verification URL
4. Confirm consent was active at synthesis time

---

## Public Verification

### Chaos Arena

Live at: `chaos.noizy.ai/verify`

**What you can verify:**
- Consent receipt validation
- Proof bundle integrity
- Revocation status
- Manifest authenticity

**Public challenge:**
"Break the proof if you can."

Bounty program for security researchers who find vulnerabilities.

---

## Demo Script

### Consent → Synthesis → Revocation → Proof

**Step 1: Consent**
```
Performer grants consent for audiobook use in Canada.
→ Consent token issued
→ Proof ID: zkp_consent_001
→ Verify: chaos.noizy.ai/verify?proof=zkp_consent_001
```

**Step 2: Synthesis**
```
Publisher requests synthesis.
→ System checks consent token
→ Consent verified, synthesis proceeds
→ Output includes C2PA manifest with proof
```

**Step 3: Revocation**
```
Performer revokes consent.
→ Consent token invalidated instantly
→ Future synthesis requests blocked
→ Existing outputs marked "consent revoked after [timestamp]"
```

**Step 4: Proof**
```
Anyone verifies the output.
→ Extract C2PA manifest
→ Read NOIZY proof assertion
→ Visit verification URL
→ See: "Consent was ACTIVE at synthesis time"
       "Consent was REVOKED at [later timestamp]"
```

---

## Technical Integration

### For Productions Using ACTRA Performers

1. **Onboard performer** → Create NOIZY actor profile
2. **Enroll voice** → Upload voice samples, create voice model
3. **Set consent** → Performer defines allowed uses, territories, pricing
4. **Request license** → Production submits license request
5. **Verify consent** → System checks all consent conditions
6. **Synthesize** → If consent valid, synthesis proceeds
7. **Embed proof** → C2PA manifest included in output
8. **Track payment** → Performer share calculated and logged
9. **Pay performer** → Automatic payout via Stripe

### API Endpoints

| Endpoint | Purpose |
|----------|---------|
| POST /consent/grant | Issue consent token |
| POST /consent/revoke | Revoke consent |
| GET /consent/status | Check consent status |
| POST /synthesis/request | Request synthesis |
| GET /audit/performer/:id | Get performer audit log |
| GET /verify/:proof_id | Independent verification |

---

## Why ACTRA Should Care

### Problem

AI voice synthesis is happening. Performers need protection that's technical, not just contractual.

### NOIZY Solution

- Consent is **code**, not just paperwork
- Revocation is **instant**, not a legal process
- Compensation is **automatic**, not promised
- Verification is **public**, not hidden

### Alignment

ACTRA's principles of consent, control, and compensation are exactly what NOIZY enforces technically.

We don't replace union agreements. We make them enforceable at the infrastructure level.

---

## Next Steps

### For ACTRA

1. Review this technical framework
2. Schedule demo call
3. Identify pilot performers/productions
4. Validate alignment with current agreements

### For NOIZY

1. Customize trust package for ACTRA requirements
2. Prepare demo environment
3. Draft pilot agreement terms
4. Support ACTRA technical review

---

## Contact

**Robert Stephen Plowman (RSP_001)**
Founder, NOIZYFISH INC.

- Email: rsp@noizy.ai
- Location: Ottawa, Canada
- Verification: chaos.noizy.ai/verify

---

*"Consent as executable code. Provenance as default. Revocation as sacred. Compensation as automatic."*

---

*© 2026 NOIZY Labs. All rights reserved.*
