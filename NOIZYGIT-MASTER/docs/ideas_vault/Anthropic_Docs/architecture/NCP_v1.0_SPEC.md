# NCP v1.0 — Noizy Consent Protocol
## Open Specification for Machine-Readable Voice Consent in AI

**Version:** 1.0
**Status:** PUBLISHED
**Date:** March 25, 2026
**Author:** Robert Stephen Plowman (RSP_001) — rsp@noizyfish.com
**License:** CC0 1.0 Universal (Public Domain) — No lock-in. Use freely.
**Published at:** noizy.ai/ncp

---

## What is NCP?

NCP (Noizy Consent Protocol) is an open specification for **consent-as-code**
in AI audio and voice synthesis. It defines a machine-readable consent record
that must be verified before any AI system processes, synthesizes, or trains
on a human voice.

NCP is not a license. It is a **verifiable consent ledger** — a technical
contract between a creator and a claimant, enforced in code, not in courts.

**Design philosophy:**
- Consent before synthesis, always
- Revocation is immediate and enforceable (1-hour SLA)
- Royalties are automatic and auditable
- No lock-in — NCP is published as open infrastructure (like TCP/IP)

---

## Core Principle

> "A human voice is not data. It is identity. Consent to use that identity
> must be explicit, machine-readable, revocable, and economically fair."

---

## NCP Token Structure v1.0

```json
{
  "ncp_version": "1.0",
  "creator_voice_id": "HVS_UUID",
  "consent_record": {
    "granted_by": "creator_id",
    "granted_to": "claimant_id",
    "usage_types": ["synthesis", "training", "derivative"],
    "term": {
      "start_date": "2026-03-25T00:00:00Z",
      "end_date": "2030-03-25T00:00:00Z",
      "auto_renew": false
    },
    "scope": {
      "geographic": ["global"],
      "media": ["commercial", "non-commercial"],
      "exclusions": ["political_speech", "deepfake_without_attribution"]
    },
    "royalty_split": {
      "creator_pct": 75,
      "platform_pct": 25
    },
    "revocation_trigger": {
      "grounds": ["creator_request", "copyright_violation", "term_expiration"],
      "notice_period_days": 0,
      "enforcement_sla_hours": 1
    },
    "signature": {
      "creator_signature": "digital_signature",
      "timestamp": "ISO8601",
      "nonce": "UUID"
    }
  }
}
```

---

## Field Definitions

### ncp_version
- Type: string
- Required: yes
- Description: Protocol version. Always "1.0" for this spec.

### creator_voice_id
- Type: UUID string (HVS format)
- Required: yes
- Description: The Human Voice Sovereignty identifier for the creator.
  Issued at registration. Immutable. Corresponds to Voice Estate record.

### consent_record.granted_by
- Type: string (creator_id)
- Required: yes
- Description: The creator granting consent. Must match creator_voice_id owner.

### consent_record.granted_to
- Type: string (claimant_id)
- Required: yes
- Description: The entity receiving consent. Platform, company, or individual UUID.

### consent_record.usage_types
- Type: array of strings
- Required: yes
- Values: "synthesis" | "training" | "derivative" | "live" | "sync" | "broadcast"
- Description: What the claimant is permitted to do with the voice.

### consent_record.term
- Type: object
- Required: yes
- Fields: start_date (ISO8601), end_date (ISO8601), auto_renew (boolean)
- Description: Duration of consent. No perpetual licenses without explicit auto_renew: true.

### consent_record.scope.geographic
- Type: array of strings
- Required: yes
- Values: "global" | ISO 3166-1 alpha-2 country codes | "EU" | "NA" | etc.
- Description: Territory where consent applies.

### consent_record.scope.media
- Type: array of strings
- Values: "commercial" | "non-commercial" | "editorial" | "advertising"
- Description: Commercial usage requires explicit "commercial" in this array.

### consent_record.scope.exclusions
- Type: array of strings
- Values: "political_speech" | "deepfake_without_attribution" | "adult_content" | etc.
- Description: Use cases that are explicitly prohibited regardless of other scope settings.

### consent_record.royalty_split
- Type: object
- Required: yes
- Fields: creator_pct (integer 0-100), platform_pct (integer 0-100)
- Constraint: creator_pct + platform_pct = 100
- Default: { creator_pct: 75, platform_pct: 25 }
- Description: Revenue distribution. Creator receives creator_pct of all revenue
  generated from use of their voice under this token.

### consent_record.revocation_trigger
- Type: object
- Required: yes
- Fields:
  - grounds: array — valid reasons for revocation
  - notice_period_days: integer — 0 means immediate
  - enforcement_sla_hours: integer — maximum time to stop using voice after revocation
- Description: Revocation is the creator's right. enforcement_sla_hours = 1 is the
  NOIZYVOX standard. Implementors MUST honor this SLA.

### consent_record.signature
- Type: object
- Required: yes
- Fields: creator_signature (digital sig), timestamp (ISO8601), nonce (UUID)
- Description: Cryptographic proof that the creator authored this consent record.
  Recommended: Ed25519 signature over the consent_record JSON (excluding signature field).

---

## Validation Rules

An NCP token is VALID if and only if ALL of the following are true:

```
1. ncp_version === "1.0"
2. creator_voice_id exists in the HVS registry
3. granted_by matches the owner of creator_voice_id
4. term.start_date <= NOW <= term.end_date
5. revocation_trigger.grounds does NOT include "creator_request" as triggered
6. No active revocation event for this token in the audit log
7. creator_signature is cryptographically valid
8. usage_types includes the requested operation
9. scope.geographic includes the requesting system's territory
10. The requested use is NOT in scope.exclusions
```

If ANY check fails → REJECT → log reason → do not proceed.

---

## Revocation

Revocation is **absolute** and **immediate**.

When a creator revokes a token:
1. The revocation event is logged with timestamp and grounds
2. All systems using that token MUST stop within `enforcement_sla_hours`
3. New synthesis using that token MUST be blocked immediately
4. Historical royalties already paid to the creator are NOT clawed back
5. In-flight synthesis that started before revocation may complete
   (implementors SHOULD define a grace period of ≤ 60 seconds)

There is no appeal process for revocation. The creator's decision is final.

---

## Royalty Enforcement

NCP tokens include a royalty_split that is legally binding for the term.

Implementors MUST:
- Route creator_pct of all revenue to the creator automatically
- Log every royalty transaction to an append-only audit ledger
- Make the audit ledger queryable by the creator at any time
- NOT allow modification of royalty_split after the token is signed
  (modification requires a new token with re-consent)

The NOIZYVOX default split is 75/25 (creator/platform).
Creators MAY negotiate different splits — the minimum recommended creator
share is 50%.

---

## C2PA Integration

Every audio file generated under an NCP token SHOULD carry a C2PA manifest
binding the following assertions:

```xml
<c2pa:manifest>
  <c2pa:assertion label="ncp.consent">
    <ncp_token_id>[HVS_token_id]</ncp_token_id>
    <consent_uri>[URL to NCP record]</consent_uri>
    <creator_voice_id>[HVS_UUID]</creator_voice_id>
    <synthesis_model>[model_name + version]</synthesis_model>
    <timestamp>[ISO8601]</timestamp>
  </c2pa:assertion>
</c2pa:manifest>
```

This creates an unbreakable chain from audio file → consent token → creator identity.

---

## NOIZYVOX Reference Implementation

NCP v1.0 is live in production at:

- **API**: heaven.rsp-5f3.workers.dev
- **Consent token endpoint**: POST /api/v1/consent-tokens
- **Kill Switch**: POST /api/v1/consent-tokens/:id/revoke
- **Validation**: enforced in POST /api/v1/synth-requests (Never Clause check)
- **Audit ledger**: GET /api/v1/ledger

Source: NOIZYFISH INC. — rsp@noizyfish.com

---

## Relationship to Existing Standards

| Standard | Relationship |
|---|---|
| C2PA | NCP adds consent-layer assertions to C2PA audio manifests |
| W3C DID | HVS creator_voice_id is compatible with DID URI scheme |
| NO FAKES Act (US) | NCP provides the technical consent record the Act requires |
| EU AI Act | NCP satisfies consent documentation requirements for biometric data |
| DMCA | NCP revocation maps to takedown enforcement with audit trail |

---

## What NCP Does NOT Cover

- NCP does not define how Voice DNA (acoustic biometrics) are stored
- NCP does not define payment settlement (that is the implementor's responsibility)
- NCP does not define the HVS registration process (see HVS Protocol)
- NCP is not a DRM system — it is consent infrastructure

---

## Versioning

This is NCP v1.0. The spec is stable.

Future versions will be backwards compatible. A token marked ncp_version: "1.0"
will remain valid under all future NCP implementations.

Proposed v1.1 additions (not yet ratified):
- Collective consent (Guild tokens covering multiple creators)
- Territorial sub-licensing (delegate consent to regional partners)
- Time-locked revocation (creator sets a future revocation date at token creation)

---

## Contributing

NCP is an open spec. Contributions welcome.

- Issues / discussion: github.com/NOIZYFISH/ncp (pending)
- Email: rsp@noizyfish.com
- Lead author: Robert Stephen Plowman (RSP_001)

**License: CC0 1.0 Universal — No rights reserved. Use freely.**
