# REGULATOR_BUNDLE_GATE.md

## Purpose

This gate ensures that **regulatory compliance bundles can be generated and are valid before deploy**.

The gate covers five things:

1. EU compliance profile generation
2. US compliance profile generation
3. Bundle schema validation
4. Required artifact presence
5. Export path verification

If a regulator asks for a compliance bundle and we can't generate one, the system is not production-ready.

---

## Core Law

> **If you can't prove compliance on demand, you can't claim compliance at all.**

Compliance readiness is a deploy prerequisite, not an incident response activity.

---

## Scope

This gate applies to:

- GDPR (EU) compliance bundles
- CCPA (US-CA) compliance bundles
- SOC2-style audit evidence exports
- Any regulatory jurisdiction where consent audit is required

---

## 1. EU Compliance Profile

### Required artifacts

| Artifact | Description | Schema |
|----------|-------------|--------|
| `data_processing_agreement.json` | DPA terms and lawful basis | ISO 27701 aligned |
| `consent_records.json` | All consent events with timestamps | GDPR Art. 7 |
| `revocation_records.json` | All revocation events | GDPR Art. 7(3) |
| `retention_policy.json` | Data retention periods | GDPR Art. 5(1)(e) |
| `dsar_log.json` | Data subject access requests | GDPR Art. 15-22 |
| `merkle_anchors.json` | Audit integrity proof | Tamper evidence |
| `controller_processor.json` | Controller/processor identification | GDPR Art. 26-28 |

### EU-specific requirements

1. Consent must be freely given, specific, informed, unambiguous (Art. 4(11))
2. Revocation must be as easy as giving consent (Art. 7(3))
3. Audit trail must demonstrate both
4. Data subjects must be identifiable for DSAR response

### Generation command

```bash
node scripts/edge-core/generate-compliance-bundle.js --profile eu --output bundles/eu/
```

### Validation checks

```javascript
function validateEUBundle(bundle) {
  const required = [
    'data_processing_agreement',
    'consent_records',
    'revocation_records',
    'retention_policy',
    'merkle_anchors'
  ];

  for (const artifact of required) {
    if (!bundle[artifact]) {
      return { valid: false, error: `Missing EU artifact: ${artifact}` };
    }
  }

  // Check consent records have required fields
  for (const consent of bundle.consent_records) {
    if (!consent.timestamp || !consent.purpose || !consent.lawful_basis) {
      return { valid: false, error: 'Consent record missing required fields' };
    }
  }

  return { valid: true };
}
```

---

## 2. US Compliance Profile

### Required artifacts

| Artifact | Description | Schema |
|----------|-------------|--------|
| `ccpa_notice.json` | Notice at collection | CCPA 1798.100 |
| `opt_out_records.json` | Opt-out requests and honors | CCPA 1798.120 |
| `sale_records.json` | Records of data sales (if any) | CCPA 1798.115 |
| `consumer_requests.json` | Consumer request log | CCPA 1798.130 |
| `verification_log.json` | Identity verification for requests | CCPA 1798.140 |
| `merkle_anchors.json` | Audit integrity proof | SOC2 evidence |

### US-specific requirements

1. "Do Not Sell My Personal Information" must be honored
2. Consumer requests must be fulfilled within 45 days
3. Verification must be documented
4. Records must be retained for 24 months minimum

### Generation command

```bash
node scripts/edge-core/generate-compliance-bundle.js --profile us --output bundles/us/
```

### Validation checks

```javascript
function validateUSBundle(bundle) {
  const required = [
    'ccpa_notice',
    'opt_out_records',
    'consumer_requests',
    'merkle_anchors'
  ];

  for (const artifact of required) {
    if (!bundle[artifact]) {
      return { valid: false, error: `Missing US artifact: ${artifact}` };
    }
  }

  // Check opt-out records have response within 45 days
  for (const optOut of bundle.opt_out_records) {
    if (!optOut.responded_at) continue;
    const requestDate = new Date(optOut.requested_at);
    const responseDate = new Date(optOut.responded_at);
    const days = (responseDate - requestDate) / (1000 * 60 * 60 * 24);
    if (days > 45) {
      return { valid: false, error: `Opt-out response exceeded 45 days: ${optOut.id}` };
    }
  }

  return { valid: true };
}
```

---

## 3. Bundle Schema Validation

### Universal schema requirements

All compliance bundles must include:

```json
{
  "bundle_id": "uuid",
  "generated_at": "ISO8601",
  "profile": "eu|us|custom",
  "version": "1.0.0",
  "generator": "noizy-compliance-exporter",
  "merkle_root": "sha256-hex",
  "artifacts": {
    "artifact_name": {
      "count": 0,
      "checksum": "sha256-hex"
    }
  },
  "validation": {
    "schema_valid": true,
    "artifacts_present": true,
    "integrity_verified": true
  }
}
```

### Schema validation command

```bash
node scripts/edge-core/validate-compliance-bundle.js bundles/eu/bundle.json
```

---

## 4. Required Artifact Presence

### Presence matrix

| Artifact | EU Required | US Required | Always Required |
|----------|-------------|-------------|-----------------|
| consent_records | ✓ | | |
| revocation_records | ✓ | | |
| opt_out_records | | ✓ | |
| consumer_requests | | ✓ | |
| merkle_anchors | ✓ | ✓ | ✓ |
| audit_events_sample | | | ✓ |
| hash_chain_proof | | | ✓ |

### Presence check

```javascript
function checkArtifactPresence(bundle, profile) {
  const always = ['merkle_anchors', 'audit_events_sample', 'hash_chain_proof'];
  const euRequired = ['consent_records', 'revocation_records', 'retention_policy'];
  const usRequired = ['opt_out_records', 'consumer_requests', 'ccpa_notice'];

  let required = [...always];
  if (profile === 'eu') required = [...required, ...euRequired];
  if (profile === 'us') required = [...required, ...usRequired];

  const missing = required.filter(r => !bundle.artifacts?.[r]);

  return {
    valid: missing.length === 0,
    missing
  };
}
```

---

## 5. Export Path Verification

### Goal

Verify that compliance bundles can actually be generated from current audit state.

### Verification steps

1. Query audit_events for consent/revocation actions
2. Query audit_anchors for Merkle roots
3. Transform to compliance schema
4. Validate against profile requirements
5. Package as downloadable bundle

### Export path test

```bash
# Generate test bundle without writing files
node scripts/edge-core/generate-compliance-bundle.js --profile eu --dry-run
node scripts/edge-core/generate-compliance-bundle.js --profile us --dry-run
```

### Expected output

```
Generating EU compliance bundle (dry-run)...
  ✓ consent_records: 142 records
  ✓ revocation_records: 8 records
  ✓ merkle_anchors: 30 anchors
  ✓ audit_events_sample: 100 events
  ✓ hash_chain_proof: verified
Bundle would contain 5 artifacts, 12.4KB total
EU compliance bundle validation: PASSED
```

---

## CI Integration

### GitHub Actions job

```yaml
regulator-bundle-gate:
  name: Regulator Bundle Gate
  runs-on: ubuntu-latest
  needs: [audit-readiness-gate, d1-time-travel-audit]

  steps:
    - uses: actions/checkout@v4

    - uses: actions/setup-node@v4
      with:
        node-version: '20'

    - name: Install Wrangler
      run: npm install -g wrangler

    - name: Generate EU bundle (dry-run)
      env:
        CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      run: node scripts/edge-core/generate-compliance-bundle.js --profile eu --dry-run

    - name: Generate US bundle (dry-run)
      env:
        CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      run: node scripts/edge-core/generate-compliance-bundle.js --profile us --dry-run

    - name: Validate bundle schemas
      run: node scripts/edge-core/validate-compliance-bundle.js --all-profiles

    - name: Gate passed
      run: |
        echo "═══════════════════════════════════════════════════════════════════"
        echo "  ✅ REGULATOR BUNDLE GATE PASSED"
        echo "  Compliance bundles can be generated on demand."
        echo "═══════════════════════════════════════════════════════════════════"
```

---

## Local Gate Script

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "═══════════════════════════════════════════════════════════════════"
echo "  REGULATOR BUNDLE GATE"
echo "  If you can't prove compliance on demand, you can't claim it."
echo "═══════════════════════════════════════════════════════════════════"

FAILED=0

echo "→ Generating EU compliance bundle (dry-run)..."
node scripts/edge-core/generate-compliance-bundle.js --profile eu --dry-run || FAILED=1

if [[ "$FAILED" -eq 0 ]]; then
  echo "→ Generating US compliance bundle (dry-run)..."
  node scripts/edge-core/generate-compliance-bundle.js --profile us --dry-run || FAILED=1
fi

if [[ "$FAILED" -eq 0 ]]; then
  echo "→ Validating bundle schemas..."
  node scripts/edge-core/validate-compliance-bundle.js --all-profiles || FAILED=1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"

if [[ "$FAILED" -eq 0 ]]; then
  echo "  ✅ REGULATOR BUNDLE GATE: PASSED"
  echo "  Compliance bundles can be generated on demand."
  exit 0
else
  echo "  ❌ REGULATOR BUNDLE GATE: FAILED"
  echo "  Deploy must not proceed until compliance export is verified."
  exit 1
fi
```

---

## On-Demand Generation

### API endpoint

```
POST /compliance/export
{
  "profile": "eu" | "us" | "custom",
  "date_range": { "start": "ISO8601", "end": "ISO8601" },
  "include_pii": false,
  "format": "json" | "zip"
}
```

### Response

```json
{
  "success": true,
  "bundle_id": "uuid",
  "download_url": "https://...",
  "expires_at": "ISO8601",
  "artifacts": ["consent_records", "revocation_records", "..."],
  "merkle_root": "sha256-hex"
}
```

---

## Regulatory Mapping

### GDPR (EU)

| GDPR Article | Audit Artifact | Verification |
|--------------|----------------|--------------|
| Art. 7 (Consent) | consent_records | Consent timestamp + purpose |
| Art. 7(3) (Withdrawal) | revocation_records | Revocation honored |
| Art. 17 (Erasure) | deletion_log | Deletion completed |
| Art. 30 (Records) | full_audit_trail | Complete record |

### CCPA (US-CA)

| CCPA Section | Audit Artifact | Verification |
|--------------|----------------|--------------|
| 1798.100 (Notice) | ccpa_notice | Notice provided |
| 1798.120 (Opt-out) | opt_out_records | Opt-out honored |
| 1798.130 (Response) | consumer_requests | Response within 45 days |
| 1798.185 (Records) | full_audit_trail | 24-month retention |

---

## Enforcement Summary

### Deploy allowed only when:

- EU bundle can be generated with all required artifacts
- US bundle can be generated with all required artifacts
- Bundle schemas are valid
- Merkle anchors are present and verifiable
- Export path produces valid output

### Deploy blocked when:

- Any required artifact cannot be generated
- Bundle schema validation fails
- Merkle anchors are missing or inconsistent
- Export path fails for any profile

---

## Final Statement

Compliance is not paperwork you generate after an audit request.

It is infrastructure that proves readiness before the question is asked.

**If you can't prove compliance on demand, you can't claim compliance at all.**

---

*This gate ensures that regulatory response capability is always present, not scrambled together during incident response.*
