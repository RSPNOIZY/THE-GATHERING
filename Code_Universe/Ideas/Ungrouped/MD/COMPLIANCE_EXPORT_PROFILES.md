# COMPLIANCE EXPORT PROFILES

## Jurisdiction → Export Profile Mapping

| Jurisdiction | Export Profile | Key Characteristics |
|--------------|----------------|---------------------|
| EU (GDPR, AI Act) | `EU_GDPR_PROFILE` | Pseudonymized actors, consent emphasis, minimal personal data |
| UK (ICO, UK AI regs) | `EU_GDPR_PROFILE` | Same as EU unless otherwise specified |
| US (FTC, FDA-adjacent, NIST) | `US_AUDIT_PROFILE` | Full role visibility, timestamp fidelity, justification chains |
| Canada (PIPEDA) | `EU_GDPR_PROFILE` | Consent-centric, data minimization |
| Australia (Privacy Act) | `EU_GDPR_PROFILE` | APP compliance, pseudonymization |
| Internal / Board | `FULL_INTERNAL_PROFILE` | All fields, hashed identities |

---

## Profile Rules (Non-Negotiable)

### EU_GDPR_PROFILE

**Legal Basis:** GDPR Article 6(1)(f) - Legitimate Interest

**Required Fields:**
- Event ID (pseudonymized)
- Actor (pseudonymized)
- Event type
- Timestamp (date precision acceptable)
- Category (consent/governance/technical)
- Chain index

**Must Include:**
- Consent-state transitions
- Retention policy documentation
- Data subject rights explanation
- DPO contact information

**Must Exclude:**
- Raw operator identifiers
- IP addresses
- Raw logs
- Internal system names

---

### US_AUDIT_PROFILE

**Compliance Frameworks:** NIST CSF, FTC Act Section 5, SOC 2 Type II

**Required Fields:**
- Event ID (full or hashed)
- Actor role classification
- Timestamp with timezone (UTC preferred)
- Action code
- Justification/explanation
- Preconditions met (boolean)
- Control reference

**Must Include:**
- NIST CSF category mapping
- SOC 2 control mapping
- Complete timestamp trail
- Approval reasons

**Control Mappings:**
- NIST CSF: PR.PT-1, DE.CM-1, DE.CM-7, RS.AN-1
- SOC 2: CC6.1, CC7.1, CC7.2, CC7.3
- CIS Controls: 8.2, 8.5, 8.11

---

### FULL_INTERNAL_PROFILE

**Purpose:** Board reporting, internal audit, incident investigation

**Includes:**
- All audit fields
- Hashed (not pseudonymized) identities
- Full metadata
- Chain verification status
- Anchor proofs

**Restrictions:**
- Internal use only
- Must not be shared externally without redaction
- Requires explicit authorization for export

---

## Export Generation Rules

1. **Single Source of Truth**: All profiles are generated from the same audit chain
2. **Filter at Export**: Redaction happens at export time, not at source
3. **No Duplication**: Never maintain separate audit streams per jurisdiction
4. **Immutable Once Generated**: Export packages cannot be modified after creation
5. **Signed**: All exports include checksums for integrity verification

---

## Profile Request Flow

```
Regulator Request → Identify Jurisdiction → Select Profile → Generate Export → Sign Package → Deliver
```

### Example: EU Regulator Request

1. Request received from EU data protection authority
2. Jurisdiction: EU → Profile: `EU_GDPR_PROFILE`
3. Generate export with pseudonymization
4. Include retention policy and GDPR compliance documentation
5. Sign package with checksums
6. Deliver via secure channel

---

## Verification Requirements

Each export must be independently verifiable:

1. **Checksums**: SHA-256 of each component file
2. **Chain Status**: Verification that hash chain is intact
3. **Anchor Proof**: Reference to blockchain anchors (if available)
4. **Timestamp**: Export generation timestamp

---

## Retention of Exports

- Generated exports are logged in audit trail
- Export packages retained for 7 years
- Export metadata retained indefinitely
- Re-generation always possible from source chain

---

*Rule: Each export is generated from the same audit chain, filtered at export time — not duplicated at source.*
