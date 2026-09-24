# The Plowman Standard — 75/25

> NOIZY Consent Protocol (NCP) — Economic Foundation
> GABRIEL Self-Healing Loop Knowledge Base
> Author: Robert Stephen Plowman (RSP_001)
> Status: Hard-coded in architecture. Not configurable.
> Last updated: 2026-04-03

---

## The Rule

**Every financial transaction in the NOIZY.AI ecosystem splits at minimum 75% to the creator, 25% to the platform.**

This is not a default. It is not a starting point for negotiation. It is not adjustable per tier, per partner, or per deal. It is a hard floor encoded at every layer of the stack.

---

## Why 75/25

The music and creative industries have historically extracted value from creators through opaque deals, hidden fees, recoupment clauses, and platform-favorable splits. Common industry splits:

| Platform/Model | Creator Share | Platform Share |
|----------------|--------------|----------------|
| Traditional record label | 12-20% | 80-88% |
| Major streaming platforms | 15-30% | 70-85% |
| NFT marketplaces | 85-95% | 5-15% |
| NOIZY.AI (Plowman Standard) | **75% minimum** | **25% maximum** |

The Plowman Standard exists because:

1. **Creators do the work.** The voice, the music, the art — that's the value. The platform is infrastructure, not creation.
2. **75% is the floor, not the ceiling.** Creators can negotiate higher. They cannot receive less.
3. **Transparency is non-negotiable.** The creator sees every line item. (See Never Clause #8.)
4. **Simplicity prevents exploitation.** One rule, universally applied, with no exceptions.

---

## Where It's Enforced

### Database Layer

D1 `creator_splits` table on the consent account:
```sql
CREATE TABLE creator_splits (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL,
  creator_share REAL NOT NULL CHECK (creator_share >= 0.75),
  platform_share REAL NOT NULL CHECK (platform_share <= 0.25),
  effective_date TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  CONSTRAINT shares_sum CHECK (creator_share + platform_share = 1.0)
);
```

The `CHECK (creator_share >= 0.75)` constraint means the database itself will reject any row that violates the standard. This is not application-level validation — it is schema-level enforcement.

### consent-gateway Worker

Check #10 in the 10-check decision matrix:
- Every financial operation (royalty calculation, payment, license fee) passes through the consent-gateway
- Check #10 validates that the `creator_share` in the request is >= 0.75
- If it's below 0.75, the request is rejected with HTTP 403 and error code `PLOWMAN_STANDARD_VIOLATION`

### heaven Worker

The `/royalty/calculate` endpoint:
- Accepts a transaction amount and creator ID
- Looks up the creator's split (defaults to 75/25 if not explicitly set higher)
- Calculates the creator's share and the platform's share
- Returns both values with full calculation breakdown
- Rejects any request that attempts to override the split below 75/25

### KV_ROYALTIES

Every royalty record stored in KV includes:
```json
{
  "transaction_id": "txn_abc123",
  "creator_id": "artist_456",
  "gross_amount": 100.00,
  "creator_share": 0.75,
  "creator_amount": 75.00,
  "platform_share": 0.25,
  "platform_amount": 25.00,
  "calculated_at": "2026-04-03T12:00:00Z",
  "plowman_compliant": true
}
```

The `plowman_compliant` field is computed, not user-supplied. Any record where `creator_share < 0.75` would have `plowman_compliant: false` — but such a record cannot be created due to upstream enforcement.

### GABRIEL Tower 3 (CONSENT)

Tower 3 monitors all consent and financial operations. If any operation produces a split below 75/25, Tower 3:
1. Blocks the operation
2. Logs a NEVER_CLAUSE_VIOLATION (Clause #4)
3. Triggers Tower 9 (HEAL) emergency alert
4. Notifies the operator via Voice Bridge

---

## Revenue Scenarios

### Scenario 1: Voice License Sale

An artist licenses their voice clone for use in a commercial project.

| Line Item | Amount |
|-----------|--------|
| License fee | $1,000.00 |
| Creator share (75%) | $750.00 |
| Platform share (25%) | $250.00 |

### Scenario 2: Streaming Royalty

A track using a NOIZY-synthesized voice generates streaming revenue.

| Line Item | Amount |
|-----------|--------|
| Monthly streaming revenue | $500.00 |
| Creator share (75%) | $375.00 |
| Platform share (25%) | $125.00 |

### Scenario 3: Custom Split (Creator Negotiated Higher)

A high-profile artist negotiates an 85/15 split.

| Line Item | Amount |
|-----------|--------|
| Revenue | $2,000.00 |
| Creator share (85%) | $1,700.00 |
| Platform share (15%) | $300.00 |

This is valid. The 75% is the floor, not the ceiling. The creator can always get more.

### Scenario 4: Attempted Violation

A business partner requests a 60/40 split for a bulk licensing deal.

**Result:** REJECTED. consent-gateway Check #10 returns:
```json
{
  "error": "PLOWMAN_STANDARD_VIOLATION",
  "check": 10,
  "message": "Creator share 0.60 is below the minimum 0.75",
  "minimum_creator_share": 0.75,
  "requested_creator_share": 0.60
}
```

No override. No exception. No escalation path. The answer is no.

---

## What the 25% Platform Share Covers

The platform's 25% (maximum) covers:
- Infrastructure costs (Cloudflare, compute, storage)
- AI model inference (Ollama local, Anthropic cloud)
- Development and maintenance
- Content moderation and consent enforcement
- Payment processing fees
- Legal and compliance

If infrastructure costs decrease, the platform share can decrease. It can never increase beyond 25%.

---

## The Plowman Standard and the 5th Epoch

The Plowman Standard is part of the 5th Epoch framework: infrastructure serves human dignity, not extraction. In the 5th Epoch:

- Technology amplifies human creativity, it doesn't replace it
- Platforms are stewards, not owners
- Economic models default to fairness, not optimization
- The creator's share is the largest share, always

The 75/25 split is the economic expression of this philosophy. It is how NOIZY.AI puts its money where its mouth is.

---

## Immovability

The Plowman Standard is:
- **Hard-coded in the database schema** (CHECK constraint)
- **Enforced at the API edge** (consent-gateway Check #10)
- **Validated in the application layer** (heaven Worker, GABRIEL Tower 3)
- **Monitored in real-time** (Health Monitor, audit logs)
- **Immutable by design** (see Never Clause #4)

To change the Plowman Standard, you would need to:
1. Alter the D1 schema constraint
2. Modify consent-gateway Check #10
3. Update heaven Worker royalty endpoint
4. Change GABRIEL Tower 3 logic
5. Update KV_ROYALTIES validation

And all of those changes would trigger Never Clause violation alerts. The system protects itself.
