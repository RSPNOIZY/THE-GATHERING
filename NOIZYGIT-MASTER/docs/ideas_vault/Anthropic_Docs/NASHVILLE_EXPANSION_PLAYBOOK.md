# Nashville Expansion Playbook

**Status**: Active Pilot
**Version**: 1.0.0
**Date**: 2026-04-07
**Lead**: Robert Stephen Plowman (RSP_001)

---

## Strategic Position

Nashville is the proving ground for Trust Engine v1.1.

Every artist onboarded, every consent granted, every synthesis verified becomes **evidence** that the governance stack works under real creative pressure.

**Core principle**: Nashville succeeds *because* the Trust Engine exists, not alongside it.

---

## Current State

### Infrastructure (Live)

| Component | Status | Location |
|-----------|--------|----------|
| Label Onboarding API | Built | `src/nashville/label-onboarding.js` |
| Trust Engine v1.0 | Live | `src/trust-engine/index.js` |
| Custom Policy SDK | Built | `src/trust-engine/custom-policy-sdk.js` |
| C2PA Export | Built | `src/edge-core/c2pa_proof_export.js` |
| Audit Gates | Live | 4 gates in CI pipeline |

### Workflow Templates (Ready)

| Template | Description | Status |
|----------|-------------|--------|
| `FAITH_HILL_PILOT` | Single artist onboarding with full consent flow | Ready |
| `NASHVILLE_LABEL` | Multi-artist label registration | Ready |
| `HERITAGE_ARTIST` | Legacy catalog integration | Spec'd |

---

## Expansion Phases

### Phase 1: Validated Pilot (Current)

**Timeline**: Now → April 17, 2026

**Objective**: Prove the stack with 3-5 verified artists

**Actions**:
1. Complete Faith Hill workflow end-to-end
2. Generate first C2PA-embedded voice synthesis
3. Produce first regulator bundle
4. Document friction points for v1.1 refinement

**Success Metrics**:
- [ ] 3+ artists with active consent tokens
- [ ] 1+ label with complete onboarding
- [ ] 0 governance violations in audit
- [ ] 100% policy coverage on all syntheses

### Phase 2: Label Cohort (April 17 → May 15)

**Objective**: Onboard first full label roster

**Actions**:
1. Deploy bulk registration workflow
2. Enable label-level consent management
3. Activate revenue tracking (75/25 split + 1% GORUNFREE)
4. Launch operator approval dashboard

**Target**: 50 artists across 3 labels

### Phase 3: Nashville Network (May 15 → July 1)

**Objective**: Multi-label interoperability

**Actions**:
1. Cross-label collaboration consents
2. Sample provenance tracking across catalogs
3. Shared governance surface for operators
4. Public verification page for Nashville artists

**Target**: 200 artists, 10 labels

---

## Operational Workflows

### Workflow 1: Faith Hill Pilot

**Purpose**: Single high-profile artist as reference case

```
Step 1: Artist Registration
├── Create actor record (RSP creates, artist confirms)
├── Enroll voice model with spectral fingerprint
├── Set consent preferences (territories, use types)
└── Generate initial consent token

Step 2: Label Association
├── Register label as operator
├── Set artist→label permissions
├── Configure revenue split (default 75/25)
└── Enable operator dashboard access

Step 3: First Synthesis
├── Operator requests synthesis
├── Trust Engine validates consent
├── Generate audio with C2PA manifest
└── Log to audit chain with proofs

Step 4: Verification
├── Public verification URL generated
├── Coverage badge available
├── Regulator bundle exportable
└── All policies show passing
```

### Workflow 2: Nashville Label Onboarding

**Purpose**: Full label roster registration

```javascript
// Using label-onboarding.js
import { registerLabel, executeWorkflow } from './src/nashville/label-onboarding.js';

// Step 1: Register label
const label = registerLabel({
  label_id: 'curb-records',
  label_name: 'Curb Records',
  tier: 'PROFESSIONAL',
  primary_contact: 'legal@curbrecords.com',
  territories: ['US', 'CA', 'EU']
});

// Step 2: Execute Nashville workflow
const result = await executeWorkflow(env, 'NASHVILLE_LABEL', {
  label_id: 'curb-records',
  artists: [
    { name: 'Artist 1', actor_id: 'act_xxx' },
    { name: 'Artist 2', actor_id: 'act_yyy' }
  ],
  consent_defaults: {
    voice_synthesis: true,
    sample_licensing: true,
    commercial_use: true
  }
});
```

### Workflow 3: Heritage Artist Integration

**Purpose**: Existing catalog with new governance layer

```
Step 1: Catalog Audit
├── Inventory existing voice recordings
├── Map current licensing agreements
├── Identify consent gaps
└── Flag recordings needing artist confirmation

Step 2: Retroactive Consent
├── Artist reviews historical uses
├── Grants or denies retroactive consent
├── System generates gap report
└── Proof bundle documents status

Step 3: Forward Governance
├── All new uses require active consent
├── Legacy uses marked as "historical"
├── Clear audit trail distinguishes eras
└── Regulator bundle shows full timeline
```

---

## Trust Engine Integration Points

### Every Nashville Action Validates a Policy

| Nashville Action | Trust Engine Policy |
|-----------------|---------------------|
| Voice synthesis request | `CONSENT_ACTIVE_ON_USE` |
| Consent revocation | `REVOCATION_HONORED` |
| Operator approval | `HUMAN_APPROVAL_REQUIRED` |
| Token issuance | `TOKEN_TIME_BOUNDED` |
| Audit write | `HASH_CHAIN_INTACT` |

### Nashville as Evidence

Each successful Nashville transaction produces:
1. **Audit event** — logged to D1 with hash chain
2. **Policy proof** — evaluated and timestamped
3. **C2PA assertion** — embeddable in manifest
4. **Coverage data** — feeds public badge

This evidence validates Trust Engine claims for partner conversations.

---

## Revenue Model

### Artist Split

```
Synthesis Revenue: 100%
├── Artist Share:    75%
├── Platform Share:  24%
└── GORUNFREE Tithe:  1%
```

### Label Tiers

| Tier | Artists | Monthly | Features |
|------|---------|---------|----------|
| PILOT | 1-5 | Free | Basic consent, manual onboarding |
| PROFESSIONAL | 6-50 | $500 | Bulk registration, operator dashboard |
| ENTERPRISE | 51+ | Custom | API access, custom policies, dedicated support |

### Revenue Tracking

```javascript
// From label-onboarding.js
trackRevenue({
  label_id: 'curb-records',
  artist_id: 'act_faith_hill',
  synthesis_id: 'synth_xxx',
  gross_revenue: 1000,
  artist_share: 750,      // 75%
  platform_share: 240,    // 24%
  gorunfree_tithe: 10     // 1%
});
```

---

## Risk Management

### Operational Risks

| Risk | Mitigation |
|------|------------|
| Artist drops out mid-pilot | Clear exit process, no lock-in |
| Label disputes consent | All decisions logged with timestamps |
| Synthesis quality issues | Separate from governance (quality ≠ consent) |
| Regulator inquiry | Bundle generation on demand |

### Governance Risks

| Risk | Mitigation |
|------|------------|
| Consent violated | Trust Engine blocks action pre-emptively |
| Audit tampered | Hash chain integrity check on every read |
| Proof disputed | C2PA manifest provides independent verification |
| Policy gap | Chaos tests prove gates catch violations |

---

## Success Criteria

### Phase 1 (Pilot)

- [ ] Faith Hill workflow executed end-to-end
- [ ] First C2PA voice synthesis delivered
- [ ] First regulator bundle generated
- [ ] Zero consent violations in audit
- [ ] Trust Engine partner brief validates Nashville as reference

### Phase 2 (Label Cohort)

- [ ] 50+ artists with active consent
- [ ] 3+ labels with complete onboarding
- [ ] Revenue tracking operational
- [ ] Operator dashboard deployed
- [ ] Public verification page live

### Phase 3 (Nashville Network)

- [ ] 200+ artists across 10+ labels
- [ ] Cross-label collaboration enabled
- [ ] Sample provenance tracking active
- [ ] Nashville becomes Partner Brief reference case

---

## Action Items (Next 10 Days)

### Immediate (Days 1-3)

1. [ ] Finalize Faith Hill pilot consent flow
2. [ ] Test C2PA export with real synthesis
3. [ ] Verify all 4 audit gates pass
4. [ ] Generate first regulator bundle

### Short-term (Days 4-7)

5. [ ] Document pilot learnings
6. [ ] Update Partner Brief with Nashville evidence
7. [ ] Prepare second artist onboarding
8. [ ] Deploy coverage badge for Nashville

### Pre-Deadline (Days 8-10)

9. [ ] Validate all Phase 1 success criteria
10. [ ] Package Nashville as Trust Engine reference
11. [ ] Brief for second label conversation
12. [ ] Lock infrastructure for April 17

---

## Contacts

| Role | Name | Email |
|------|------|-------|
| Lead | Robert Stephen Plowman | rsp@noizy.ai |
| Technical | GABRIEL (AI Orchestrator) | — |
| Nashville Pilot | Faith Hill | TBD via label |
| Label Contact | Curb Records | TBD |

---

## Appendix: API Reference

### Label Registration

```javascript
POST /nashville/labels
{
  "label_id": "string",
  "label_name": "string",
  "tier": "PILOT|PROFESSIONAL|ENTERPRISE",
  "primary_contact": "email",
  "territories": ["US", "CA", "EU"]
}
```

### Artist Registration (via Label)

```javascript
POST /nashville/labels/:label_id/artists
{
  "artist_name": "string",
  "actor_id": "string (existing) or null (create)",
  "voice_model_id": "string or null"
}
```

### Workflow Execution

```javascript
POST /nashville/workflows/:workflow_id/execute
{
  "label_id": "string",
  "artists": [...],
  "consent_defaults": {...}
}
```

### Revenue Tracking

```javascript
POST /nashville/revenue
{
  "label_id": "string",
  "artist_id": "string",
  "synthesis_id": "string",
  "gross_revenue": number
}
```

---

*Nashville proves the Trust Engine. The Trust Engine enables Nashville.*

*Both paths. One mission.*

---

*© 2026 NOIZY Labs. All rights reserved.*
