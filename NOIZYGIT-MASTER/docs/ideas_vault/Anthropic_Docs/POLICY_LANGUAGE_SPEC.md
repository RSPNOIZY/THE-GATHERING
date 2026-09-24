# POLICY LANGUAGE SPECIFICATION

## Purpose

Express policies as **deterministic predicates** that can be evaluated inside a ZK proof or transparently verified.

---

## Design Principles

1. **Deterministic** — no human judgment at proof time
2. **Boolean-reducible** — every rule compiles to `true / false`
3. **Field-scoped** — only committed fields may be referenced
4. **Composable** — policies can be combined with `AND / OR`

---

## Canonical Policy Schema

```yaml
policy_id: string           # Unique identifier (SCREAMING_SNAKE_CASE)
version: string             # Semantic version (e.g., "1.0.0")
scope: enum                 # audit_event | consent_token | promotion | freeze
inputs:                     # List of committed fields this policy reads
  - field_name: type
predicate: expression       # Boolean expression over inputs
description: string         # Human-readable explanation
zk_compatible: boolean      # Can this be compiled to a ZK circuit?
```

---

## Field Types

| Type | Description | ZK-Compatible |
|------|-------------|---------------|
| `string` | Text value (hashed in ZK) | Yes (as hash) |
| `integer` | Numeric value | Yes |
| `boolean` | True/false | Yes |
| `timestamp` | ISO 8601 datetime | Yes (as epoch) |
| `enum` | Fixed set of values | Yes (as integer) |

---

## Predicate Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `==` | Equals | `consent_state == "CLEARED"` |
| `!=` | Not equals | `status != "REVOKED"` |
| `>` | Greater than | `window_minutes > 15` |
| `>=` | Greater or equal | `stability >= THRESHOLD` |
| `<` | Less than | `age_seconds < 86400` |
| `<=` | Less or equal | `error_rate <= 0.01` |
| `IS NULL` | Null check | `revocation_timestamp IS NULL` |
| `IS NOT NULL` | Non-null check | `approval_id IS NOT NULL` |
| `IN` | Set membership | `action IN ["APPROVE", "REJECT"]` |
| `AND` | Logical and | `a == 1 AND b == 2` |
| `OR` | Logical or | `a == 1 OR b == 1` |
| `NOT` | Logical not | `NOT revoked` |

---

## Policy as ZK Statement

Each policy becomes a statement of the form:

```
∃ audit_event ∈ AuditLog
such that:
  - audit_event is included in MerkleRoot R
  - predicate P(audit_event) == true
```

Only **the truth of the statement** is revealed — not the event contents.

---

## Core Policy Definitions

### CONSENT_ACTIVE_ON_USE

```yaml
policy_id: CONSENT_ACTIVE_ON_USE
version: "1.0.0"
scope: audit_event
inputs:
  - consent_state: enum
  - revocation_timestamp: timestamp
  - event_timestamp: timestamp
predicate: |
  consent_state == "CLEARED"
  AND (revocation_timestamp IS NULL
       OR revocation_timestamp > event_timestamp)
description: "Consent was active when the action occurred"
zk_compatible: true
```

### REVOCATION_HONORED

```yaml
policy_id: REVOCATION_HONORED
version: "1.0.0"
scope: consent_token
inputs:
  - revocation_timestamp: timestamp
  - last_use_timestamp: timestamp
predicate: |
  revocation_timestamp IS NULL
  OR last_use_timestamp < revocation_timestamp
description: "No usage occurred after revocation"
zk_compatible: true
```

### PROMOTION_WINDOW_MET

```yaml
policy_id: PROMOTION_WINDOW_MET
version: "1.0.0"
scope: promotion
inputs:
  - stability_window_minutes: integer
  - required_window: integer
predicate: |
  stability_window_minutes >= required_window
description: "Promotion occurred after required stability window"
zk_compatible: true
```

### AUDIT_BEFORE_AUTHORITY

```yaml
policy_id: AUDIT_BEFORE_AUTHORITY
version: "1.0.0"
scope: audit_event
inputs:
  - audit_write_success: boolean
  - authority_granted: boolean
predicate: |
  audit_write_success == true
  OR authority_granted == false
description: "Audit was written before authority was granted"
zk_compatible: true
```

### HUMAN_APPROVAL_REQUIRED

```yaml
policy_id: HUMAN_APPROVAL_REQUIRED
version: "1.0.0"
scope: audit_event
inputs:
  - operator_type: enum
  - action_category: enum
predicate: |
  operator_type != "SYSTEM"
  AND action_category IN ["GOVERNANCE", "CONSENT", "MIGRATION"]
description: "Governance actions required human approval"
zk_compatible: true
```

### FREEZE_PROPERLY_RESOLVED

```yaml
policy_id: FREEZE_PROPERLY_RESOLVED
version: "1.0.0"
scope: freeze
inputs:
  - resolved: boolean
  - resolution_notes_length: integer
  - resolved_by: string
predicate: |
  resolved == true
  AND resolution_notes_length > 10
  AND resolved_by IS NOT NULL
description: "Freeze was resolved with explanation"
zk_compatible: true
```

### TOKEN_TIME_BOUNDED

```yaml
policy_id: TOKEN_TIME_BOUNDED
version: "1.0.0"
scope: consent_token
inputs:
  - expires_at: timestamp
  - created_at: timestamp
  - max_ttl_minutes: integer
predicate: |
  (expires_at - created_at) <= (max_ttl_minutes * 60)
description: "Token expiry is within allowed window"
zk_compatible: true
```

### HASH_CHAIN_INTACT

```yaml
policy_id: HASH_CHAIN_INTACT
version: "1.0.0"
scope: audit_event
inputs:
  - computed_hash: string
  - stored_hash: string
  - prev_hash_matches: boolean
predicate: |
  computed_hash == stored_hash
  AND prev_hash_matches == true
description: "Audit hash chain is intact"
zk_compatible: true
```

---

## Composing Policies

Policies can be combined:

```yaml
policy_id: SAFE_PROMOTION
version: "1.0.0"
scope: promotion
composed_of:
  - AUDIT_BEFORE_AUTHORITY
  - PROMOTION_WINDOW_MET
  - HUMAN_APPROVAL_REQUIRED
composition: AND
description: "All safety checks passed before promotion"
zk_compatible: true
```

---

## ZK Circuit Compilation (Conceptual)

```
Policy YAML
    ↓
Parse predicate to AST
    ↓
Map fields to circuit signals
    ↓
Generate constraints
    ↓
Emit ZK circuit (Circom / Noir / etc.)
```

The predicate `consent_state == "CLEARED"` becomes:
- Signal: `consent_state_hash`
- Constraint: `consent_state_hash === hash("CLEARED")`

---

## Non-ZK Evaluation

For transparent verification, the same policies can be evaluated directly:

```javascript
function evaluatePolicy(policy, event) {
  const predicate = compilePredicate(policy.predicate);
  return predicate(event);
}
```

---

## Policy Registry

All active policies are registered in:
- `src/edge-core/policy_registry.js` — runtime evaluation
- `docs/POLICY_VERIFICATION_MATRIX.md` — verification mode mapping

---

## Versioning

- Policies are versioned semantically
- Breaking changes require major version bump
- Old versions remain valid for historical verification
- New events use latest policy version

---

*Rule: Where correctness matters, we prove it. Where context matters, we explain it.*
