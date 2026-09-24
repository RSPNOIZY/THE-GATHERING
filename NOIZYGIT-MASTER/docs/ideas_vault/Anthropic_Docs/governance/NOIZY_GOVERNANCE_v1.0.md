# NOIZY_GOVERNANCE_v1.0
## Board Authority · License Flag Enforcement · Revenue Engine · Creator Protection

**Version:** 1.0  
**Date:** March 25, 2026  
**Status:** OPERATIVE  
**Authority:** Robert Stephen Plowman (RSP_001) — Board Chair

---

## 1. Board of Aligned Minds

### Composition

| Role | Seat | Status | Authority |
|------|------|--------|-----------|
| Board Chair | RSP_001 — Robert Stephen Plowman | ✅ Active | Full executive + veto |
| Technical Lead | ENGR_KEITH (R.K. Plowman) | ✅ Active | Architecture decisions |
| Creative Lead | TBD | ✅ Active | Product + creator experience |
| Legal/Compliance | TBD | ✅ Active | Regulatory + licensing |
| License Review | **VACANT — Alex replacement required** | ❌ Blocked | Commercial license flags |

### Quorum Rules

- **Standard decisions:** 3/5 board members (simple majority)
- **License flag decisions:** 4/5 board members (supermajority)
- **Never Clause modifications:** IMPOSSIBLE — immovable by design
- **Board override of consent:** 2/5 minimum + chair signature (see `enterprise/board-override-api.md`)
- **Emergency decisions (P0):** Chair-only with 24h ratification

### Authority Matrix

| Decision Type | Chair | Board Majority | Supermajority | Immovable |
|---------------|-------|----------------|---------------|-----------|
| Royalty split adjustment | ❌ | ❌ | ✅ (contract-scoped only) | Default 75/25 is immovable |
| License flag clearance | ❌ | ❌ | ✅ | — |
| Never Clause modification | ❌ | ❌ | ❌ | ✅ Always |
| Board member rotation | ✅ + 2/5 | — | — | — |
| Emergency consent override | ✅ | — | — | Never Clauses still block |
| Product launch | ✅ | — | — | — |
| External partnership | ✅ | — | — | — |
| Investor/fundraise | ✅ + majority | — | — | — |

---

## 2. License Flag System

### Current Status

| Model/Tool | License | Commercial | Status | Decision Path |
|------------|---------|-----------|--------|---------------|
| XTTS v2 | CPML | ✅ Yes | ✅ CLEARED | Ready to use |
| RVC | MIT | ✅ Yes | ✅ CLEARED | Ready to use |
| Librosa | ISC | ✅ Yes | ✅ CLEARED | Ready to use |
| pedalboard | GPL-3 | ✅ Yes | ✅ CLEARED | Ready to use |
| Gemma2 | Gemma ToU | ⚠️ Restricted | ✅ CLEARED (non-commercial) | Ready for internal use |
| MusicGen | CC-BY-NC | ❌ No | 🔴 BLOCKED | Requires board supermajority |
| MaskGCT | Research | ❌ No | 🔴 BLOCKED | Requires board supermajority |
| Tango 2 | Non-commercial | ❌ No | 🔴 BLOCKED | Requires board supermajority |
| FishSpeech | Non-commercial | ❌ No | 🔴 BLOCKED | Requires board supermajority |

### License Flag Clearance Process

1. **Nomination:** Any board member nominates a model for commercial review
2. **Legal review:** Compliance officer reviews license terms (14-day window)
3. **Board vote:** Supermajority (4/5) required to clear for commercial use
4. **Documentation:** Clearance logged in `workers/consent-gateway/schema.sql` `tool_clearance_registry`
5. **Runtime enforcement:** Consent Gateway CHECK-8 enforces tool clearance list
6. **Blocker resolution:** Replacing Alex unblocks this process

### GABRIEL Runtime Enforcement

```javascript
// Consent Gateway CHECK-8
const toolRegistry = await db.prepare(
  "SELECT cleared_for_commercial FROM tool_clearance_registry WHERE tool_name = ?"
).bind(tool_name).first();

if (!toolRegistry?.cleared_for_commercial) {
  return { decision: "DENY", reason_code: "TOOL_NOT_CLEARED" };
}
```

---

## 3. Revenue Engine — 75/25 Split

### Default Split (Immovable)

```
Creator:  75% of all revenue generated from their voice
Platform: 25% (NOIZY ops + infrastructure)
```

This is the **constitutional default** (Article 4 of `docs/constitution/noizy-constitution.md`). It cannot be lowered below 75% for the creator without creator's explicit written consent.

### Override Conditions

| Scenario | Override Allowed | Minimum Creator % | Requires |
|----------|-----------------|-------------------|---------|
| Creator-negotiated project deal | ✅ | 51% | Creator's signed NCP with modified `royalty_split` |
| Platform emergency fund (capped) | ✅ temporary | 70% (6-month max) | Board supermajority + creator notice |
| Sub-agent licensing (creator sublicenses) | ✅ | 50% of their share | Creator initiative only |
| NEVER below 51% to creator | ❌ | 51% hard floor | Never Clause NC-06 |

### Payment Mechanics

```
Trigger:         Synthesis usage event logged in usage_events
Calculation:     gross_revenue × 0.75 → creator_wallet
                 gross_revenue × 0.25 → platform_account
Frequency:       Calculated hourly, settled daily
Payment method:  Creator's registered payment method (Stripe/ACH/crypto)
Audit:           Every royalty_event logged with: creator_id, amount, usage_event_id, timestamp
SLA:             Creator sees real-time dashboard; payment within 7 days of month end
Dispute:         Creator flags via NOIZYVOX → board review within 48h
```

### Royalty Event Schema

```sql
-- From workers/consent-gateway/schema.sql
CREATE TABLE royalty_events (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL,
  usage_event_id TEXT NOT NULL,
  gross_amount REAL NOT NULL,
  creator_amount REAL NOT NULL,   -- gross × 0.75
  platform_amount REAL NOT NULL,  -- gross × 0.25
  consent_record_id TEXT NOT NULL,
  paid_at TIMESTAMP,
  status TEXT DEFAULT 'pending',  -- pending | paid | disputed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. Creator Protection Framework

### The 9 Never Clauses (Immovable)

These cannot be overridden by any board action, API call, or governance vote:

| # | Never Clause | Runtime Check | Enforcement |
|---|-------------|---------------|-------------|
| NC-01 | Never synthesize without valid NCP token | CHECK-1 | Deny |
| NC-02 | Never allow consent token transfer between actors | CHECK-3 | Deny |
| NC-03 | Never process after Kill Switch without re-consent | CHECK-7 | Deny |
| NC-04 | Never store biometric voice data without storage consent | Intake validation | Block |
| NC-05 | Never use voice commercially without commercial scope in token | CHECK-5 | Deny |
| NC-06 | Never route creator share below 51% | Royalty engine | Hard floor |
| NC-07 | Never retain synthesis beyond license term without archival consent | CHECK-6 | Purge |
| NC-08 | Never modify royalties after ledger append | Audit log immutability | Block |
| NC-09 | Never expose Voice DNA via public endpoints | API auth layer | 403 |

### Kill Switch

```
Creator triggers:   POST /consent/revoke (Heaven or NOIZYVOX portal)
Enforcement SLA:    1 hour from revocation timestamp
Scope:              All active synthesis stopped; new requests blocked
Historical:         Past royalties honored; completed work untouched
Audit:              revocation_events table; permanent record
Appeal:             Creator can re-grant consent; creates new NCP token
```

### Voice Estate Inheritance

```json
{
  "governance_rules": {
    "revocation_on_death": false,
    "heir_can_grant_new": true,
    "dispute_resolution": "guild_arbitration",
    "dormancy_period_years": 5,
    "dormancy_action": "freeze_not_delete"
  }
}
```

- Creator's heirs inherit full voice estate governance rights
- Heirs can grant new NCP tokens but cannot retroactively revoke historical use
- Estate governed by `schemas/voice-estate.v1.json`

---

## 5. Guild of Artists — Democratic Structure

### Founding Principle

The Guild of Artists is not a corporation. It is a creator-controlled democratic body that sets policy for NOIZYVOX collectively.

### Governance Layers

| Layer | Body | Composition | Decisions |
|-------|------|-------------|-----------|
| Operational | Board of Aligned Minds | 5 members | Technical + license + emergency |
| Policy | Guild Assembly | All verified members (1 voice = 1 vote) | HVS policy, royalty floor |
| Legal | Legal Council | 3 appointed members | Regulatory compliance |
| Arbitration | Dispute Panel | 3 rotating members | Creator disputes |

### Guild Assembly Votes

- **Policy change:** Simple majority of quorum (30% participation threshold)
- **Royalty floor change:** 2/3 supermajority
- **Never Clause amendment:** IMPOSSIBLE (constitutionally protected)
- **Dissolve the Guild:** Unanimous + board + legal council

### HVS Protocol Authority

The HVS protocol is governed jointly by:
1. The Board of Aligned Minds (technical enforcement)
2. The Guild Assembly (creator policy)
3. Neither body alone can weaken creator protections

---

## 6. Governance Change Log

| Date | Change | Authority | Notes |
|------|--------|-----------|-------|
| 2026-03-25 | v1.0 established | RSP_001 | Founding governance document |
| TBD | Alex seat filled | RSP_001 + board | Unblocks commercial license flags |
| TBD | First Guild Assembly vote | Guild members | HVS Phase 2 activation |
