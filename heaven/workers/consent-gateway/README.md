# NOIZY Consent Gateway v1.0
**Status:** Implementation In Progress
**Service:** `noizy-consent-gateway` (Cloudflare Worker)
**Architecture layer:** Runtime (Layer 3 of 5)

---

## What This Is

The consent-gateway is the first executable slice of the NOIZY consent-native OS.

Every request involving a creator-linked asset passes through here first.
It runs the 10-check NOIZY action decision matrix and returns
**ALLOW / HOLD / DENY / ESCALATE** with structured reason codes.

Nothing synthesizes, trains, or derives without passing this gate.

---

## Endpoints

### POST /v1/check-eligibility

Runs the full 10-check decision matrix for a creator + claimant + action.

**Input:**
```json
{
  "creator_id": "RSP_001",
  "claimant_id": "CLAIMANT_001",
  "action_type": "synthesis",
  "tool_name": "XTTS_v2",
  "requested_scope": {
    "territory": "global",
    "commercial": true
  }
}
```

**Output (ALLOW):**
```json
{
  "decision": "ALLOW",
  "reason_codes": ["CONSENT_VALID", "SCOPE_VALID", "TOOL_AUTHORIZED", "PROVENANCE_READY", "ROYALTY_ROUTE_READY"],
  "consent_record_id": "NCP_123",
  "provenance_required": true,
  "royalty_route_status": "ready",
  "payment_terms": { "creator_pct": 75, "platform_pct": 25, "currency": "USD", "payout_window_days": 7 },
  "executed_at": "2026-03-25T18:00:00Z",
  "gateway_version": "1.0"
}
```

**Output (DENY):**
```json
{
  "decision": "DENY",
  "reason_codes": ["CONSENT_REVOKED"],
  "consent_record_id": "NCP_123",
  "executed_at": "2026-03-25T18:00:00Z",
  "gateway_version": "1.0"
}
```

---

### POST /v1/revoke

Creator revokes consent for a specific consent record.

**Input:**
```json
{
  "consent_record_id": "NCP_123",
  "requested_by": "RSP_001",
  "reason": "creator_request",
  "effective_scope": {}
}
```

**Output:**
```json
{
  "revocation_accepted": true,
  "revocation_id": "REV_UUID",
  "effective_at": "2026-03-25T18:00:00Z",
  "sla_deadline": "2026-03-25T19:00:00Z",
  "enforcement_status": "pending"
}
```

---

### GET /v1/consent/:id

Returns full normalized consent state.

---

### GET /v1/audit/:asset_id

Returns audit history for a creator-linked asset, consent record, or creator ID.
Supports `?limit=N` (max 200).

---

### GET /health

Public. Returns service status and DB connectivity.

---

## The 10-Check Decision Matrix

| # | Check | Pass | Failure |
|---|---|---|---|
| 1 | Identity linked | creator/HVS in registry | HOLD |
| 2 | Consent exists | NCP record found | DENY |
| 3 | Consent active | status = active | DENY |
| 4 | Scope valid | action_type in usage_types | DENY |
| 5 | Time valid | within term | DENY |
| 6 | Tool authorized | tool in clearance registry + NCP | HOLD/DENY |
| 7 | Provenance ready | manifest pipeline available | HOLD |
| 8 | Royalty route ready | payout path configured | HOLD |
| 9 | Dispute clear | dispute_status = none | ESCALATE |
| 10 | Revocation clear | revoked_at is null | DENY |

---

## Deploy

```bash
# Create D1 database
wrangler d1 create noizy_consent_db

# Copy the returned database_id to wrangler.toml

# Apply schema
wrangler d1 execute noizy_consent_db --file=schema.sql

# Set API key secret
wrangler secret put NOIZY_API_KEY

# Deploy
wrangler deploy
```

---

## Auth

All routes except `/health` require:
```
X-NOIZY-Key: <NOIZY_API_KEY>
```

---

## Reason Codes

**DENY:** `CONSENT_NOT_FOUND` · `CONSENT_INACTIVE` · `CONSENT_REVOKED` · `CONSENT_EXPIRED`
· `USAGE_NOT_IN_SCOPE` · `USAGE_EXCLUDED_BY_SCOPE` · `TERRITORY_NOT_AUTHORIZED` · `TOOL_BLOCKED`

**HOLD:** `IDENTITY_NOT_FOUND` · `TOOL_NOT_AUTHORIZED` · `TOOL_PENDING_REVIEW`
· `TOOL_UNKNOWN` · `PROVENANCE_PIPELINE_UNAVAILABLE` · `ROYALTY_ROUTE_NOT_READY`

**ESCALATE:** `DISPUTED_RIGHTS_ASSERTION` · `COMPETING_ESTATE_CLAIMS` · `EXCEPTIONAL_CONDITION`

---

## Status

- **Constitution:** Ready (NOIZY Constitution v2.0)
- **Policy:** Ready (Runtime Policy v2.0)
- **Implementation:** In Progress
- **D1 Schema:** Complete (9 tables + tool clearance registry seeded)
- **Worker:** Complete (4 endpoints + 10-check matrix)
- **Tests:** See `/tests/runtime/consent-decision-cases.json`
