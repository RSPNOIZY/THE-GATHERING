# NOIZY Board Override API

**Version:** 1.0  
**Base URL:** `https://heaven.rsp-5f3.workers.dev`  
**Auth:** `X-NOIZY-Key: <NOIZY_API_KEY>` + `X-Board-Token: <BOARD_JWT>`

Board overrides allow Guild of Artists board members with sufficient quorum to override consent gateway decisions, escalate stuck records, or rotate board membership. All overrides are **immutably logged** in the audit trail.

---

## Authentication

Board endpoints require two headers:

| Header | Value |
|--------|-------|
| `X-NOIZY-Key` | Standard NOIZY API key |
| `X-Board-Token` | JWT issued by Heaven `/board/auth`, signed with board member private key |

Board JWT payload:
```json
{
  "sub": "board_member_id",
  "email": "member@noizy.ai",
  "role": "board_member | board_chair",
  "iat": 1700000000,
  "exp": 1700086400
}
```

---

## Endpoints

### `POST /board/auth`
Authenticate a board member and receive a Board JWT.

**Request:**
```json
{
  "member_email": "rsp@noizyfish.com",
  "signature": "<Ed25519 signature of challenge>",
  "challenge_id": "chall_abc123"
}
```

**Response `200`:**
```json
{
  "board_token": "eyJhbGciOiJFZERTQSJ9...",
  "expires_at": "2026-01-02T00:00:00Z",
  "member_id": "board_rsp_001",
  "role": "board_chair"
}
```

**Response `401`:**
```json
{ "error": "invalid_signature", "message": "Board member signature verification failed" }
```

---

### `POST /board/override/consent`
Override a consent gateway DENY or HOLD decision. Requires **2-of-N quorum** (configured in wrangler.toml `BOARD_QUORUM_SIZE`).

**Request:**
```json
{
  "intake_id": "ingest_1700000000_abc123",
  "target_creator_email": "artist@example.com",
  "override_decision": "ALLOW",
  "reason": "Creator verified via out-of-band identity check. Manual NCP token created.",
  "expires_at": "2026-06-01T00:00:00Z",
  "supporting_members": ["board_member_002", "board_member_003"]
}
```

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `intake_id` | string | yes | The intake or consent record ID to override |
| `target_creator_email` | string | yes | Creator whose record is being overridden |
| `override_decision` | enum | yes | `ALLOW` \| `DENY` \| `ESCALATE` |
| `reason` | string | yes | Mandatory audit justification (min 20 chars) |
| `expires_at` | ISO8601 | no | If set, override auto-expires |
| `supporting_members` | string[] | yes | Other board member IDs co-signing |

**Response `200`:**
```json
{
  "override_id": "ovr_1700000001_xyz789",
  "status": "applied",
  "override_decision": "ALLOW",
  "applied_at": "2026-01-01T12:00:00Z",
  "expires_at": "2026-06-01T00:00:00Z",
  "audit_entry_id": "audit_9900001",
  "quorum_met": true,
  "quorum_count": 3,
  "quorum_required": 2
}
```

**Response `409` — Quorum not met:**
```json
{
  "error": "quorum_not_met",
  "message": "Board override requires 2 co-signers. 1 provided.",
  "quorum_required": 2,
  "quorum_provided": 1
}
```

**Response `403` — Never Clause block:**
```json
{
  "error": "never_clause_block",
  "message": "Override blocked: Never Clause NC-03 (no_biometric_resale) is immovable. Board override does not apply to Never Clauses.",
  "clause_id": "NC-03"
}
```

---

### `POST /board/member/rotate`
Replace or remove a board member. Requires **chair** role + quorum.

**Request:**
```json
{
  "action": "replace",
  "outgoing_member_id": "board_alex_001",
  "outgoing_reason": "License flag conflict — MusicGen/MaskGCT clearance blocked",
  "incoming_member": {
    "email": "newmember@noizy.ai",
    "name": "New Board Member",
    "role": "board_member",
    "public_key_ed25519": "base64_encoded_public_key"
  },
  "supporting_members": ["board_rsp_001", "board_member_003"]
}
```

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | enum | yes | `add` \| `remove` \| `replace` |
| `outgoing_member_id` | string | if replace/remove | Member being removed |
| `outgoing_reason` | string | yes | Audit reason for removal |
| `incoming_member` | object | if add/replace | New member details |
| `incoming_member.public_key_ed25519` | string | yes | Ed25519 public key for Board JWT signing |

**Response `200`:**
```json
{
  "rotation_id": "rot_1700000002_def456",
  "status": "applied",
  "outgoing_member_id": "board_alex_001",
  "incoming_member_id": "board_newmember_004",
  "applied_at": "2026-01-01T12:00:00Z",
  "audit_entry_id": "audit_9900002",
  "active_board_members": 4
}
```

---

### `GET /board/members`
List all active board members.

**Response `200`:**
```json
{
  "board": [
    {
      "member_id": "board_rsp_001",
      "email": "rsp@noizyfish.com",
      "name": "Robert Stephen Plowman",
      "role": "board_chair",
      "joined_at": "2025-01-01T00:00:00Z",
      "active": true
    }
  ],
  "quorum_size": 2,
  "total_members": 4
}
```

---

### `GET /board/overrides`
List all board overrides (audit trail).

**Query params:** `?limit=50&offset=0&creator_email=filter`

**Response `200`:**
```json
{
  "overrides": [
    {
      "override_id": "ovr_1700000001_xyz789",
      "intake_id": "ingest_1700000000_abc123",
      "target_creator_email": "artist@example.com",
      "override_decision": "ALLOW",
      "applied_by": "board_rsp_001",
      "applied_at": "2026-01-01T12:00:00Z",
      "expires_at": "2026-06-01T00:00:00Z",
      "reason": "Creator verified via out-of-band identity check.",
      "quorum_count": 3,
      "status": "active"
    }
  ],
  "total": 1
}
```

---

## Never Clause Protection

**Board overrides CANNOT override Never Clauses.** The following are immovable regardless of quorum:

| Clause | Description |
|--------|-------------|
| NC-01 | No synthesis without explicit consent |
| NC-02 | No data sale or transfer |
| NC-03 | No biometric resale |
| NC-04 | Revocation within 1 hour |
| NC-05 | No secret processing |
| NC-06 | Creator compensation enforced |
| NC-07 | No identity forgery |
| NC-08 | No jurisdiction evasion |
| NC-09 | No override of creator's self |

Any override request that touches a Never Clause returns `403 never_clause_block`.

---

## Audit Trail

Every board action is written to `audit_log` with `event_type = board_override | board_rotation` and is **immutable** — no DELETE endpoint exists.

---

## Implementation Notes (Heaven Worker)

Add these routes to `src/index.js`:

```javascript
// Board auth — issue JWT
router.post('/board/auth', handleBoardAuth);

// Board overrides — require board JWT middleware
router.post('/board/override/consent', requireBoardAuth, handleConsentOverride);
router.post('/board/member/rotate', requireBoardChair, handleMemberRotate);
router.get('/board/members', requireBoardAuth, handleListMembers);
router.get('/board/overrides', requireBoardAuth, handleListOverrides);
```

Environment vars to add to `wrangler.toml`:
```toml
BOARD_QUORUM_SIZE = "2"
BOARD_JWT_SECRET = ""   # set via wrangler secret put BOARD_JWT_SECRET
```
