# AUDIT_READINESS_GATE.md

## Purpose

This gate ensures that **no trust-sensitive surface or operator authority ships unless durable audit storage is ready first**.

The gate covers five things:

1. Migration check
2. Table existence check
3. Startup binding assertion
4. CI fail condition
5. Dry-run approval verification

Cloudflare D1 is the durable SQL layer for Workers, and Workers can execute SQL against D1 through the Worker Binding API after the database is bound in config. Wrangler also provides direct D1 commands for migrations and execution.

---

## Core Law

> **If a user can see authority, the system must already be able to remember it.**

Audit readiness is a deploy prerequisite, not a cleanup task.

---

## Scope

This gate applies to:

- operator approval endpoints
- migration token issuance
- freeze / lift-freeze flows
- creator trust surfaces that display trust state derived from audited actions
- any Worker route that can trigger or expose trust-sensitive state

---

## Required Table

The canonical minimum audit table is:

```sql
CREATE TABLE audit_events (
  id TEXT PRIMARY KEY,
  operator_email TEXT NOT NULL,
  action TEXT NOT NULL,
  explanation TEXT NOT NULL,
  precondition_passed INTEGER NOT NULL,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT
);
```

Use SQLite-compatible SQL because D1 is SQLite-based. Cloudflare's D1 docs make clear that D1 uses SQLite semantics and Wrangler D1 commands operate against that database model.

---

## 1. Migration Check

### Goal

Verify the audit migration file exists and can be applied to the target D1 database.

### Required migration file

```
ops/migrations/001_audit_events.sql
```

### Apply migration

Use Wrangler D1 execute against the remote database:

```bash
npx wrangler d1 execute CONSENT_D1 --remote --file ops/migrations/001_audit_events.sql
```

Wrangler documents `d1 execute` for executing SQL against remote D1 databases.

### Required outcome

- command exits successfully
- no SQL syntax error
- no binding/config resolution error
- remote database accepts the schema

### Fail condition

If migration execution fails, all UX deploys and trust-surface promotions stop.

---

## 2. Table Existence Check

### Goal

Verify that the `audit_events` table actually exists in the target D1 database after migration.

### Check command

```bash
npx wrangler d1 execute CONSENT_D1 --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name='audit_events';"
```

### Expected success

The result includes:

```
audit_events
```

### Fail condition

If the result is empty, null, or the command fails, the audit substrate is not ready and:

- operator routes must not ship
- creator trust surfaces must not ship
- CI must fail closed

---

## 3. Startup Binding Assertion

### Goal

Ensure the Worker refuses to operate trust-sensitive flows if the audit binding is missing or unusable.

Workers access bound resources through `env`, and D1 must be bound before the Worker can query it. Cloudflare documents this binding model for both D1 and Workers generally.

### Required binding

Example Wrangler config fragment:

```json
{
  "d1_databases": [
    {
      "binding": "AUDIT_D1",
      "database_name": "consent_audit",
      "database_id": "REPLACE_WITH_REAL_ID"
    }
  ]
}
```

### Required runtime assertion

At startup or on first protected request, the Worker must confirm:

- `env.AUDIT_D1` exists
- a trivial query can run
- failures disable trust-sensitive mutations

### Recommended implementation

```javascript
export async function assertAuditReady(env) {
  if (!env.AUDIT_D1) {
    throw new Error("AUDIT_READINESS_GATE: AUDIT_D1 binding missing");
  }

  await env.AUDIT_D1
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='audit_events'")
    .run();
}
```

### Runtime rule

If audit readiness assertion fails:

- operator actions return 503 or equivalent controlled failure
- creator trust surfaces may render a degraded safe state
- no mutation proceeds

---

## 4. CI Fail Condition

### Goal

Make CI block deploys when audit readiness is missing.

Cloudflare's CI/CD guidance for Workers uses GitHub Actions with Wrangler commands and secret-backed auth, so this gate should run before deploy steps in CI.

### Required CI policy

CI must fail if any of the following is true:

- migration file missing
- D1 binding missing from config
- table existence check fails
- dry-run approval verification fails

### Example gate script

```
./scripts/audit-readiness-gate.sh
```

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "Checking audit migration file..."
test -f ops/migrations/001_audit_events.sql

echo "Checking Wrangler config contains AUDIT_D1 binding..."
grep -R "\"binding\"[[:space:]]*:[[:space:]]*\"AUDIT_D1\"" wrangler.jsonc wrangler.toml 2>/dev/null >/dev/null

echo "Checking audit_events table exists remotely..."
OUTPUT="$(npx wrangler d1 execute CONSENT_D1 --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name='audit_events';" 2>/dev/null || true)"
echo "$OUTPUT" | grep "audit_events" >/dev/null

echo "Audit readiness gate passed."
```

### Example GitHub Actions step

```yaml
- name: Audit readiness gate
  run: ./scripts/audit-readiness-gate.sh
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### CI rule

If this step fails, deploy steps do not run.

---

## 5. Dry-Run Approval Verification

### Goal

Prove that the approval endpoint can write an audit event before any real operator use.

### Endpoint behavior requirement

The approval endpoint must:

1. validate request
2. write audit row first
3. only then perform controlled action
4. support a dry-run/test mode for readiness verification

Because D1 writes happen through the Worker Binding API, the endpoint should use prepared statements and a structured insert.

### Example verification request

```bash
curl https://noizy.ai/operator/approval \
  -H "content-type: application/json" \
  -d '{
    "action":"test",
    "explanation":"audit readiness verification",
    "metadata":{"mode":"dry-run","source":"ci"}
  }'
```

### Expected success response

```json
{
  "ok": true,
  "audit_event_id": "..."
}
```

### Post-check query

```bash
npx wrangler d1 execute CONSENT_D1 --remote --command "SELECT action, explanation FROM audit_events ORDER BY timestamp DESC LIMIT 1;"
```

### Expected result

Latest row contains:

- `action` = `test`
- `explanation` = `audit readiness verification`

### Fail condition

If dry-run approval cannot create a durable audit row:

- operator UI must not ship
- creator trust UI must not ship
- CI must fail

---

## Recommended Deploy Order

1. apply audit migration
2. verify table exists
3. verify Worker binding
4. verify dry-run approval write
5. deploy Worker/project
6. promote gradually if needed

Wrangler supports D1 execution and Workers deployment as separate steps, which is exactly why this gate should run before deployment/promotion.

---

## Human Review Checklist

Before approving deploy, reviewer must confirm:

- [ ] migration file present
- [ ] `audit_events` exists remotely
- [ ] `AUDIT_D1` binding present in config
- [ ] startup assertion enabled
- [ ] dry-run approval writes a row
- [ ] CI gate is active

---

## Enforcement Summary

### Deploy allowed only when:

- migration succeeds
- `audit_events` exists
- `AUDIT_D1` binding is configured
- startup assertion is active
- dry-run approval succeeds
- CI gate passes

### Deploy blocked when:

- audit migration missing or broken
- table missing
- binding missing
- approval write path broken
- CI cannot prove readiness

---

## Hardening Addenda (Locked 2026-04-07)

### A. Assertive Table Existence Check

A successful query is not sufficient.
The gate must fail if `audit_events` is absent.

```sql
-- CORRECT: Returns a row only if table exists
SELECT 1 FROM sqlite_master WHERE type='table' AND name='audit_events'

-- WRONG: Query can succeed with empty result
SELECT name FROM sqlite_master WHERE type='table' AND name='audit_events'
```

The difference: `SELECT 1` with `.first()` returns `null` if no row matches, which can be asserted against. A query that "succeeds" with no rows is not readiness.

### B. Committed Dry-Run Proof

Dry-run approval verification is valid only if:
- the endpoint returns success, AND
- a new `audit_events` row is queryable afterward

```javascript
// 1. Write test event
await env.GABRIEL_DB.prepare(`INSERT INTO audit_events ...`).run();

// 2. Verify committed (not just accepted)
const count = await env.GABRIEL_DB.prepare(
  `SELECT COUNT(*) as cnt FROM audit_events WHERE id = ?`
).bind(testId).first();

if (!count || count.cnt !== 1) {
  throw new Error("AUDIT_READINESS_GATE: dry-run write not committed");
}
```

### C. Minimum Required Table

`audit_events` is the non-optional minimum audit table.
Additional audit tables may exist (`operator_tokens`, `freeze_events`, `audit_anchors`, `transparency_log`, `audit_incidents`), but `audit_events` must exist for readiness to pass.

### D. Strongest Runtime Assertion Pattern

```javascript
export async function assertAuditReady(env) {
  if (!env.GABRIEL_DB) {
    throw new Error("AUDIT_READINESS_GATE: GABRIEL_DB binding missing");
  }

  const result = await env.GABRIEL_DB
    .prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='audit_events'")
    .first();

  if (!result) {
    throw new Error("AUDIT_READINESS_GATE: audit_events table missing");
  }
}
```

This pattern uses Cloudflare's documented D1 binding/query model and converts "query succeeded" into "readiness proved."

---

## Final Locked Checklist

- [ ] Migration file exists (`ops/migrations/001_audit_events.sql`)
- [ ] `wrangler d1 execute --remote --file ...` succeeds
- [ ] `audit_events` exists in `sqlite_master` (assertive check)
- [ ] `GABRIEL_DB` binding exists in Worker config
- [ ] Runtime startup assertion fails closed if table/binding is missing
- [ ] CI fails if migration, binding, or table check fails
- [ ] Dry-run approval creates a committed row that can be queried back

---

## Final Statement

Audit readiness is not optional ceremony.

It is the minimum condition for trustworthy authority.

**If the system can act, it must already be able to remember.**

The stronger operational version:

**If a trust-sensitive action cannot produce a committed audit row, it is not allowed to exist.**

---

*This gate is grounded in Cloudflare's documented support for Wrangler D1 commands like `d1 create` and `d1 execute`, the Worker Binding API for executing SQL from a Worker after binding the database, the general bindings (`env`) model for Workers, and GitHub Actions-based CI/CD for Workers deployments.*
