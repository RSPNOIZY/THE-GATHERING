# CREATOR_TRUST_OPERATOR_UX_DEPLOY_SPEC.md

## Purpose

This spec defines the deployable shape for two NOIZY trust surfaces:

- **Creator Trust**
- **Operator Controls**

The goal is simple:

- creators see calm, readable outcomes
- operators see ceremony, accountability, and auditability
- trust-sensitive actions are recorded in durable storage before they are considered valid

This spec assumes a Cloudflare-first runtime using:
- **Workers** for request handling and routing
- **D1** for durable relational audit truth
- **KV** for ordinary read-heavy feature/config state
- **Wrangler** for deploy and migration workflow

Cloudflare documents Workers configuration and deployment through Wrangler, D1 as a serverless SQL database with SQLite semantics, and runtime access to platform resources through Worker `env` bindings.

---

## Product Principles

### Creator side

The creator surface must feel:
- calm
- outcome-focused
- low-anxiety
- readable
- non-technical

Creators should see:
- current trust state
- recent changes that affect them
- provenance and consent outcomes
- what requires no action
- what changed and why

Creators should **not** see:
- dangerous levers
- rollout controls
- migration actions
- override mechanics
- internal operator controls

### Operator side

The operator surface must feel:
- deliberate
- explainable
- auditable
- reversible
- strict

Operators should be required to:
- provide explanations
- pass preconditions
- leave an audit trail
- perform actions through governed endpoints
- respect rollout and trust-surface rules

---

## Deployment Model

### Do not deploy UI folders directly

Cloudflare Workers deploy a configured Worker project, not an arbitrary React or TSX folder by itself. The UI surfaces should live inside the application/workspace, but deployment should happen through the Worker entrypoint and Wrangler configuration that owns the route.

### Deployment rule

Use this pattern:
1. migrate D1
2. deploy the Worker/project
3. promote gradually if needed
4. verify trust and operator routes

### Gradual rollout rule

Use **Workers gradual deployments** for rollout of meaningful changes rather than assuming a direct `wrangler deploy app/... --gradual ...` pattern. Cloudflare documents gradual deployments as part of the versions-and-deployments model for Workers.

---

## App Surfaces

### 1. Creator Trust Dashboard

**Route:** `/trust/status`
**Source:** `src/routes/trust.js`

#### Purpose

Give creators a calm overview of system state and any recent trust-impacting changes.

#### UI shape

```tsx
<TrustOverview>
  <StatusCard status="operating-normally" updated="2min" />
  <EnforcementGrid>
    <Card>Consent Enforcement: ✅ Active</Card>
    <Card>GORUNFREE Mode: ✅ Stable</Card>
  </EnforcementGrid>
  <ActionButtons>
    <Button variant="primary">View Details</Button>
  </ActionButtons>
</TrustOverview>
```

#### Data requirements

The page should read:
- trust status summary
- enforcement state
- recent creator-relevant changes
- provenance/consent summary where relevant

#### Binding expectations
- D1 for durable event/history data
- KV only for low-risk fast config display if needed

---

### 2. Recent Changes

**Route:** `/trust/changes`
**Source:** `src/routes/trust.js`

#### Purpose

Show recent creator-facing changes in plain language.

#### UI shape

```tsx
<ChangesList>
  <ChangeItem date="Apr 6" impact="No action required">
    One archive excluded due to consent update
  </ChangeItem>
</ChangesList>
```

#### Content rules

Each item should explain:
- what changed
- whether action is required
- whether the change affected access, trust, or provenance
- date/time of change

---

### 3. Operator Controls

**Route:** `/operator/status`
**Source:** `src/routes/operator.js`

#### Purpose

Provide a governed control surface for operators only.

#### Requirements
- explanation required for trust-relevant actions
- preconditions visible before action
- action not valid until audit write succeeds
- no silent override path

---

### 4. Manual Override / Approval

**Route:** `/operator/approve`
**Source:** `src/routes/operator.js`

#### UI shape

```tsx
<ApprovalForm action="lift-freeze">
  <ReasonSection>Stability window reset (resolved)</ReasonSection>
  <MetricsGrid>
    <Metric stable="21min" />
    <Metric budget="healthy" />
  </MetricsGrid>
  <TextArea label="Explanation (required)" />
  <ButtonGroup>
    <Button primary>Approve</Button>
    <Button secondary>Cancel</Button>
  </ButtonGroup>
</ApprovalForm>
```

#### Rules
- explanation is required
- action name is explicit
- current stability and budget state are shown
- approval posts to a governed Worker endpoint
- audit entry must exist before state mutation is considered complete

---

### 5. Migration Token Surface

**Route:** `/operator/token/issue`
**Source:** `src/routes/operator.js`

#### UI shape

```tsx
<MigrationAuth domain="noizy.ai">
  <Preconditions allChecked />
  <TokenButton>Issue Token</TokenButton>
  <TokenDisplay>********-**** (expires 1:23 PM)</TokenDisplay>
</MigrationAuth>
```

#### Rules
- token issuance requires preconditions
- token expiry is visible
- token display must be masked
- token issuance event is audited
- secrets must never be written to logs or returned in full

---

## D1 Audit Schema

### Why D1

Cloudflare D1 is the correct durable relational store for audit events because Workers can access D1 directly through Worker bindings, and D1 uses SQLite-compatible semantics rather than PostgreSQL semantics.

### Important compatibility note

Use SQLite-compatible SQL, not PostgreSQL-specific types like:
- UUID → use TEXT
- BOOLEAN → use INTEGER
- JSONB → use TEXT
- NOW() → use CURRENT_TIMESTAMP

### Migration file

**File:** `migrations/002_audit_events.sql`

```sql
CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  operator_email TEXT NOT NULL,
  action TEXT NOT NULL,
  explanation TEXT NOT NULL,
  precondition_passed INTEGER NOT NULL,
  signals_at_approval TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS operator_tokens (
  id TEXT PRIMARY KEY,
  operator_email TEXT NOT NULL,
  action_type TEXT NOT NULL,
  domain TEXT,
  preconditions_met TEXT,
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS freeze_events (
  id TEXT PRIMARY KEY,
  freeze_category TEXT NOT NULL,
  triggered_by TEXT NOT NULL,
  signal_state TEXT,
  resolved INTEGER NOT NULL DEFAULT 0,
  resolved_at TEXT,
  resolved_by TEXT,
  resolution_notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Schema notes
- `id TEXT PRIMARY KEY` for durable event IDs
- `precondition_passed INTEGER` for SQLite-compatible boolean representation
- `CURRENT_TIMESTAMP` for SQLite-compatible timestamps
- `TEXT` for JSON payload serialized by application code

---

## Operator Approval Handler

**File:** `src/routes/operator.js`

### Purpose

Write the audit event first, then perform the controlled action.

### Why this order matters

The audit write should succeed before the operator action is considered valid. D1 is the durable truth layer; state change should not outrun the audit trail.

### Implementation pattern

```javascript
export async function handleOperatorApprove(request, env) {
  const { action, explanation, metadata } = await request.json();
  const id = crypto.randomUUID();

  // AUDIT FIRST
  await env.GABRIEL_DB.prepare(
    `INSERT INTO audit_events (
      id, operator_email, action, explanation,
      precondition_passed, metadata, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
  ).bind(
    id,
    env.OPERATOR_EMAIL || 'rsp@noizy.ai',
    action,
    explanation,
    1,
    JSON.stringify(metadata ?? {})
  ).run();

  // Only after audit succeeds:
  // perform the controlled action here

  return Response.json({
    ok: true,
    audit_event_id: id
  });
}
```

### Requirements
- request must be authenticated before use
- explanation must be non-empty
- metadata must be serialized safely
- no secret values returned
- audit event ID returned for traceability

---

## Worker Bindings

Cloudflare Workers access platform resources through env bindings.

### wrangler.toml bindings

```toml
[[d1_databases]]
binding = "GABRIEL_DB"
database_name = "gabriel_db"
database_id = "a31d68e2-f2d4-4203-a803-8039fdff31cb"

[[kv_namespaces]]
binding = "FEATURE_FLAGS"
id = "FEATURE_FLAGS_ID_HERE"
```

---

## Deploy Sequence

### 1. Apply D1 migration

```bash
npx wrangler d1 execute gabriel_db --remote --file migrations/002_audit_events.sql
```

### 2. Deploy the Worker/project

```bash
npx wrangler deploy
```

### 3. Promote gradually if needed

```bash
npx wrangler versions deploy
```

### 4. Verify creator trust route

```bash
curl https://heaven.rsp-5f3.workers.dev/trust/status
```

### 5. Verify operator approval route

```bash
curl https://heaven.rsp-5f3.workers.dev/operator/approve \
  -H "Content-Type: application/json" \
  -H "X-NOIZY-Key: $NOIZY_API_KEY" \
  -d '{"action":"test","explanation":"verification","metadata":{"source":"launch-check"}}'
```

---

## Verification Criteria

### Creator trust surface is live when:
- `/trust/status` loads successfully
- trust status renders without exposing internal levers
- recent changes appear in readable human language
- no operator-only data leaks into creator views

### Operator controls are live when:
- `/operator/approve` accepts governed actions
- explanation is required
- audit event is written to D1
- controlled action only runs after successful audit write

### Audit substrate is live when:
- D1 table exists
- insert succeeds
- event ID is returned
- audit rows can be queried back for review

---

## Design Principles Enforced

### Creator
- calm
- read-only where possible
- outcome-focused
- no unnecessary friction
- no internal levers

### Operator
- ceremony required
- explanation required
- action must be auditable
- trust-sensitive actions must be reversible or governable

### Separation
- creators never see dangerous controls
- operators never act without explanation
- audit truth exists before trust-sensitive mutations

---

## Recommended Build Order

1. D1 migration
2. approval handler
3. operator approval route
4. operator UI
5. creator trust UI
6. gradual rollout
7. verification and audit review

This order is stronger than UI-first because the trust substrate exists before the trust surface.

---

## Final Statement

NOIZY trust surfaces work only when:
- creators experience calm
- operators experience accountability
- actions become durable audit truth before they become runtime reality

Creator trust is not a theme.
Operator accountability is not a vibe.
Both must be enforced in code.

---

This version is grounded in Cloudflare's documented support for **Workers configuration and deployment**, **D1's SQLite-based model and Worker API**, **Wrangler D1 commands**, **runtime bindings**, and **gradual deployments**.
