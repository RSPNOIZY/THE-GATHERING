# NOIZY C2PA Assertion Specification v1.0

## Status: PROPOSED STANDARD

Submitted for consideration to the C2PA Technical Working Group.

---

## Abstract

This specification defines a C2PA assertion type for embedding cryptographic policy proofs within Content Credentials manifests. It enables verifiable governance claims that survive file distribution, remixing, and archival.

---

## 1. Introduction

### 1.1 Purpose

The NOIZY Policy Proof Assertion provides a standardized method for embedding zero-knowledge policy verification results within C2PA manifests. This enables:

- Verifiable consent claims for voice synthesis
- Provable origin tracking for audio samples
- Tamper-evident governance audit trails
- Independent verification without system access

### 1.2 Scope

This specification covers:

- Assertion label and namespace
- Data model and schema
- Verification requirements
- Interoperability guidelines

### 1.3 Normative References

- C2PA Specification v2.1
- JSON-LD 1.1
- SHA-256 (FIPS 180-4)
- ISO 8601 (Date/Time formats)

---

## 2. Assertion Definition

### 2.1 Label

```
c2pa.noizy.policy_proof
```

### 2.2 Namespace

```
https://noizy.ai/schemas/c2pa-proof/v1
```

### 2.3 CBOR Tag (Optional)

```
55800 (pending IANA registration)
```

---

## 3. Data Model

### 3.1 Assertion Structure

```json
{
  "label": "c2pa.noizy.policy_proof",
  "data": {
    "@context": "https://noizy.ai/schemas/c2pa-proof/v1",
    "@type": "NoizyPolicyProof",
    "version": "1.0.0",

    "proof_id": "<string>",
    "policy_id": "<string>",
    "policy_version": "<semver>",
    "verification_mode": "<enum>",

    "proof_hash": "<hex-string>",
    "merkle_root": "<hex-string>",
    "anchor_date": "<ISO-8601-date>",

    "result": <boolean>,
    "verified_at": "<ISO-8601-datetime>",

    "verify_url": "<uri>",
    "transparency_log_url": "<uri>",

    "external_anchors": [<AnchorReference>],

    "issuer": {
      "name": "<string>",
      "url": "<uri>",
      "public_key_url": "<uri>"
    }
  }
}
```

### 3.2 Field Definitions

#### 3.2.1 Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `proof_id` | string | Unique identifier for this proof instance |
| `policy_id` | string | Identifier of the policy that was evaluated |
| `policy_version` | string | Semantic version of the policy |
| `verification_mode` | enum | Type of verification: `zk`, `reportable`, `hybrid` |
| `result` | boolean | Whether the policy evaluation passed |
| `verified_at` | datetime | ISO 8601 timestamp of verification |

#### 3.2.2 Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `proof_hash` | hex-string | SHA-256 hash of the proof data |
| `merkle_root` | hex-string | Merkle root of the audit chain at anchor time |
| `anchor_date` | date | Date the Merkle root was anchored |
| `verify_url` | uri | URL for independent verification |
| `transparency_log_url` | uri | URL to transparency log entry |
| `external_anchors` | array | References to blockchain anchors |
| `issuer` | object | Information about the proof issuer |

### 3.3 Verification Modes

| Mode | Description | Proof Type |
|------|-------------|------------|
| `zk` | Zero-knowledge proof | Cryptographic circuit |
| `reportable` | Transparent audit | Hash + timestamp |
| `hybrid` | ZK proof + reported metadata | Combined |

### 3.4 External Anchor Reference

```json
{
  "chain": "ethereum|bitcoin|other",
  "txid": "<transaction-id>",
  "block": <block-number>,
  "verify_url": "<uri>"
}
```

---

## 4. Policy Definitions

### 4.1 Standard Policies

The following policies are defined as part of this specification:

| Policy ID | Description | Mode |
|-----------|-------------|------|
| `CONSENT_ACTIVE_ON_USE` | Consent was active when action occurred | zk |
| `REVOCATION_HONORED` | No usage after consent revocation | zk |
| `ORIGIN_VERIFIED` | Asset origin is cryptographically verified | zk |
| `CHAIN_INTACT` | Audit hash chain is unbroken | zk |
| `HUMAN_APPROVAL` | Human approval was obtained | reportable |

### 4.2 Custom Policies

Implementations MAY define custom policies using the namespace:

```
{partner_id}.{policy_id}
```

Example: `splice.SAMPLE_ORIGIN_VERIFIED`

---

## 5. Verification Process

### 5.1 Local Verification

Verifiers SHOULD be able to verify assertions locally by:

1. Extracting the `proof_hash` from the assertion
2. Recomputing the hash from available inputs
3. Comparing computed hash to stored hash

### 5.2 Remote Verification

Verifiers MAY use the `verify_url` for enhanced verification:

```
GET {verify_url}

Response:
{
  "verified": true,
  "proof_id": "...",
  "policy_id": "...",
  "merkle_root": "...",
  "anchor_status": "confirmed"
}
```

### 5.3 Transparency Log Verification

Verifiers MAY check the `transparency_log_url` for public audit trail:

```
GET {transparency_log_url}

Response:
{
  "proof_id": "...",
  "logged_at": "...",
  "merkle_inclusion_proof": [...]
}
```

---

## 6. Security Considerations

### 6.1 Proof Integrity

- Proof data MUST be signed by the issuer
- Proof hash MUST use SHA-256 or stronger
- Merkle roots MUST be anchored within 24 hours

### 6.2 Privacy

- ZK proofs MUST NOT reveal underlying data
- Verify URLs MUST NOT require authentication
- No PII should be embedded in assertions

### 6.3 Replay Prevention

- Each `proof_id` MUST be globally unique
- `verified_at` timestamp prevents replay
- Merkle inclusion proves temporal ordering

---

## 7. Interoperability

### 7.1 C2PA Compatibility

This assertion is compatible with:
- C2PA v1.x manifests
- C2PA v2.x manifests
- JUMBF boxing

### 7.2 Codec Support

Assertions can be embedded in:
- JPEG (APP11 segment)
- PNG (C2PA chunk)
- WAV/AIFF (C2PA chunk)
- MP4/MOV (uuid box)
- PDF (metadata stream)

### 7.3 Tool Support

Reference implementations available for:
- JavaScript/TypeScript
- Python
- Rust
- Go

---

## 8. Examples

### 8.1 Voice Consent Assertion

```json
{
  "label": "c2pa.noizy.policy_proof",
  "data": {
    "@context": "https://noizy.ai/schemas/c2pa-proof/v1",
    "@type": "NoizyPolicyProof",
    "version": "1.0.0",

    "proof_id": "zkp_94af8b2e",
    "policy_id": "CONSENT_ACTIVE_ON_USE",
    "policy_version": "1.0.0",
    "verification_mode": "zk",

    "proof_hash": "a1b2c3d4e5f6...",
    "merkle_root": "b8e3f9a2c1d4...",
    "anchor_date": "2026-04-07",

    "result": true,
    "verified_at": "2026-04-07T18:30:00Z",

    "verify_url": "https://noizy.ai/trust/verify?proof=zkp_94af8b2e",

    "issuer": {
      "name": "NOIZYVOX",
      "url": "https://noizyvox.io",
      "public_key_url": "https://noizyvox.io/.well-known/c2pa-key.pub"
    }
  }
}
```

### 8.2 Sample Origin Assertion

```json
{
  "label": "c2pa.noizy.policy_proof",
  "data": {
    "@context": "https://noizy.ai/schemas/c2pa-proof/v1",
    "@type": "NoizyPolicyProof",
    "version": "1.0.0",

    "proof_id": "zkp_origin_7f3a",
    "policy_id": "ORIGIN_VERIFIED",
    "policy_version": "1.0.0",
    "verification_mode": "zk",

    "proof_hash": "d4e5f6a7b8c9...",
    "merkle_root": "c1d2e3f4a5b6...",
    "anchor_date": "2026-04-07",

    "result": true,
    "verified_at": "2026-04-07T18:35:00Z",

    "verify_url": "https://noizy.ai/trust/verify?proof=zkp_origin_7f3a",

    "external_anchors": [
      {
        "chain": "ethereum",
        "txid": "0x1234...abcd",
        "block": 19500000,
        "verify_url": "https://etherscan.io/tx/0x1234...abcd"
      }
    ],

    "issuer": {
      "name": "NOIZYFISH",
      "url": "https://noizyfish.io",
      "public_key_url": "https://noizyfish.io/.well-known/c2pa-key.pub"
    }
  }
}
```

---

## 9. Reference Implementation

### 9.1 JavaScript

```javascript
import { generateNoizyProofAssertion } from '@noizy/trust-engine';

const assertion = generateNoizyProofAssertion({
  proof_id: 'zkp_' + crypto.randomUUID().slice(0, 8),
  policy_id: 'CONSENT_ACTIVE_ON_USE',
  policy_version: '1.0.0',
  verification_mode: 'zk',
  result: true,
  verified_at: new Date().toISOString()
});

// Embed in C2PA manifest
manifest.assertions.push(assertion);
```

### 9.2 Verification

```javascript
import { verifyNoizyAssertion } from '@noizy/trust-engine';

const result = await verifyNoizyAssertion(assertion);
// { verified: true, policy_id: '...', ... }
```

---

## 10. IANA Considerations

### 10.1 Media Type Registration

```
Type name: application
Subtype name: vnd.noizy.policy-proof+json
Required parameters: none
Optional parameters: version
```

### 10.2 Well-Known URI

```
/.well-known/noizy-trust-key.pub
```

---

## 11. Acknowledgments

This specification was developed by NOIZY Labs in collaboration with the C2PA community.

---

## 12. Authors

- Robert Stephen Plowman (RSP_001), NOIZY Labs
- Contact: rsp@noizy.ai

---

## Appendix A: JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://noizy.ai/schemas/c2pa-proof/v1/policy-proof.json",
  "title": "NOIZY Policy Proof Assertion",
  "type": "object",
  "required": ["proof_id", "policy_id", "policy_version", "verification_mode", "result", "verified_at"],
  "properties": {
    "proof_id": { "type": "string", "pattern": "^[a-z0-9_]+$" },
    "policy_id": { "type": "string", "pattern": "^[A-Z][A-Z0-9_]*$" },
    "policy_version": { "type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+$" },
    "verification_mode": { "enum": ["zk", "reportable", "hybrid"] },
    "proof_hash": { "type": "string", "pattern": "^[a-f0-9]+$" },
    "merkle_root": { "type": "string", "pattern": "^[a-f0-9]+$" },
    "anchor_date": { "type": "string", "format": "date" },
    "result": { "type": "boolean" },
    "verified_at": { "type": "string", "format": "date-time" },
    "verify_url": { "type": "string", "format": "uri" },
    "transparency_log_url": { "type": "string", "format": "uri" }
  }
}
```

---

## Appendix B: Test Vectors

### B.1 Valid Assertion

Input proof data:
```
policy_id: CONSENT_ACTIVE_ON_USE
result: true
verified_at: 2026-04-07T18:30:00Z
```

Expected proof_hash (SHA-256):
```
a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
```

### B.2 Merkle Root Computation

Given event hashes:
```
[hash1, hash2, hash3, hash4]
```

Expected Merkle root:
```
SHA256(SHA256(hash1 || hash2) || SHA256(hash3 || hash4))
```

---

*Specification Version: 1.0.0*
*Last Updated: 2026-04-07*
*Status: Proposed Standard*
