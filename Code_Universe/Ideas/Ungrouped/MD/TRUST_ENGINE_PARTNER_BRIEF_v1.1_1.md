# NOIZY Trust Engine v1.1 — Partner Integration Brief

**Status**: Ready for Partner Evaluation
**Version**: 1.1.0
**Date**: 2026-04-07
**Contact**: rsp@noizy.ai

---

## Executive Summary

The NOIZY Trust Engine is a **productized governance substrate** that enables platforms to embed verifiable consent, provenance, and compliance into their existing workflows—without building custom infrastructure.

**What it does:**
- Enforces consent-as-code with cryptographic proof
- Generates regulator-ready compliance bundles (EU/US)
- Embeds policy proofs in C2PA Content Credentials
- Provides public verification without system access

**Who it's for:**
- Sample marketplaces (Splice, Loopcloud)
- Collaboration platforms (BandLab, Soundtrap)
- Distribution services (DistroKid, TuneCore)
- Label infrastructure (Nashville pilot underway)
- AI voice synthesis providers

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR PLATFORM                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Sample Store │  │ Voice Synth  │  │ Collab Tool  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           │                                     │
│                    ┌──────▼──────┐                              │
│                    │ Trust Engine │ ◄── Your integration point  │
│                    │     SDK      │                              │
│                    └──────┬──────┘                              │
└───────────────────────────┼─────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
     ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
     │   Policy    │ │    C2PA     │ │  Regulator  │
     │  Evaluation │ │   Export    │ │   Bundle    │
     └─────────────┘ └─────────────┘ └─────────────┘
```

---

## Integration Patterns

### Pattern 1: Pre-Action Consent Check

Before any voice synthesis, sample use, or remix:

```javascript
import { TrustEngine } from '@noizy/trust-engine';

const engine = new TrustEngine({ licensee: 'your-platform' });

// Check consent before synthesis
const check = engine.evaluatePolicy('CONSENT_ACTIVE_ON_USE', {
  consent_state: user.consentState,
  revocation_timestamp: user.revokedAt,
  event_timestamp: new Date().toISOString()
});

if (!check.result) {
  return { error: 'Consent not active', proof: check };
}

// Proceed with synthesis...
```

### Pattern 2: Provenance Chain Verification

For sample libraries and remix platforms:

```javascript
// Verify complete provenance chain
const chainCheck = engine.evaluatePolicy('HASH_CHAIN_INTACT', {
  chain_length: sample.auditEvents.length,
  expected_hash: sample.expectedTailHash,
  actual_hash: computeChainHash(sample.auditEvents)
});

if (!chainCheck.result) {
  flagForReview(sample.id, 'Provenance chain broken');
}
```

### Pattern 3: C2PA Manifest Generation

Embed proofs in exported audio:

```javascript
// After successful synthesis
const proofs = await engine.generateVoiceProofs(env, {
  synthesis_id: result.id,
  voice_model_id: model.id,
  consent_token_id: token.id
});

const manifest = engine.generateC2PAManifest({
  title: result.title,
  brand: 'YOUR_BRAND',
  creator_name: artist.name,
  format: 'audio/wav'
}, proofs);

// Manifest embeds verifiable proof of consent
```

### Pattern 4: Compliance Bundle Export

On-demand regulator packages:

```javascript
import { generateComplianceBundle } from '@noizy/trust-engine';

// EU regulator request
const euBundle = await generateComplianceBundle(env, {
  profile: 'eu',
  dateRange: { start: '2026-01-01', end: '2026-04-07' },
  partner_id: 'your-platform'
});

// Bundle contains: consent records, revocation audit, Merkle anchors, verify.sh
```

---

## Available Policies

### ZK-Verifiable (Cryptographic Proof)

| Policy ID | What It Proves |
|-----------|----------------|
| `CONSENT_ACTIVE_ON_USE` | Consent was live when action occurred |
| `REVOCATION_HONORED` | No usage after consent revoked |
| `HASH_CHAIN_INTACT` | Audit trail is tamper-free |
| `TOKEN_TIME_BOUNDED` | Consent token TTL was respected |

### Reportable (Transparent Audit)

| Policy ID | What It Shows |
|-----------|---------------|
| `HUMAN_APPROVAL_REQUIRED` | Human operator approved the action |
| `FREEZE_PROPERLY_RESOLVED` | Freeze state was resolved with explanation |
| `AUDIT_BEFORE_AUTHORITY` | Audit written before authority granted |
| `PROMOTION_WINDOW_MET` | Required stability window was met |

---

## Custom Policy SDK

Define your own policies while maintaining NOIZY enforcement:

```javascript
import { registerCustomPolicy, createWhiteLabelInstance } from '@noizy/trust-engine';

// Create white-label instance
const trustLayer = createWhiteLabelInstance('your-platform', {
  branding: {
    name: 'YourTrust',
    domain: 'trust.yourplatform.com'
  }
});

// Register custom policy
trustLayer.registerPolicy({
  id: 'CREATOR_ROYALTY_SET',
  version: '1.0.0',
  scope: 'custom',
  description: 'Creator royalty meets minimum threshold',
  verification_mode: 'reportable',
  inputs: ['royalty_percentage', 'minimum_royalty'],
  evaluate: (data, config = { minimum_royalty: 50 }) => {
    return (data.royalty_percentage || 0) >= config.minimum_royalty;
  }
});

// Policy is now enforced as: YOURPLATFORM_CREATOR_ROYALTY_SET
```

---

## White-Label Options

### What You Control

- **Branding**: Your product name, logo, colors
- **Domain**: trust.yourplatform.com
- **Policies**: Custom policies with your namespace
- **URLs**: Branded verification and badge URLs

### What NOIZY Provides

- Enforcement infrastructure
- ZK proof generation
- Merkle anchoring
- Regulator bundle templates
- C2PA manifest generation
- Coverage badge computation

### Verification URL Example

```
https://trust.yourplatform.com/verify?proof=zkp_94af8b2e
     ↑ Your domain                      ↑ NOIZY proof ID
```

---

## Licensing Tiers

### Open Source (Free)

- Policy Language Spec
- Policy Registry (evaluation only)
- Coverage Badge generator
- Community support

### Professional ($X/month)

- All Open Source features
- ZK Policy Compiler
- Audit Gate System
- Time-Travel Verification
- Regulator Bundle Generator
- C2PA Proof Export
- Email support + Documentation

### Enterprise (Custom Pricing)

- All Professional features
- Custom policy development
- Dedicated support + SLA
- On-premise deployment option
- White-label licensing
- Direct integration assistance

**Contact**: rsp@noizy.ai

---

## Integration Timeline

### Week 1: Evaluation

- [ ] Review this brief
- [ ] Access sandbox environment
- [ ] Identify 2-3 pilot use cases

### Week 2: Technical Spike

- [ ] Install SDK in staging
- [ ] Implement first policy check
- [ ] Test C2PA export

### Week 3: Pilot Integration

- [ ] Connect to production consent data
- [ ] Configure custom policies (if needed)
- [ ] Set up verification URL routing

### Week 4: Go-Live

- [ ] Enable for pilot users
- [ ] Monitor coverage metrics
- [ ] Iterate on UX based on feedback

---

## Reference Implementations

### NOIZYVOX (Voice Estate + Consent Law)

- Full consent lifecycle: grant → use → revoke → audit
- Voice DNA enrollment with spectral fingerprinting
- Operator accountability surfaces
- Proof bundles for every synthesis

### NOIZYFISH (Archive Intelligence + Provenance)

- Sample origin verification
- Gap detection and resurrection priorities
- Lineage explanation engine
- Archive search with provenance context

### Nashville Pilot (Label Scale)

- Major label onboarding workflow
- Bulk artist registration
- Revenue tracking with 75/25 split
- Faith Hill workflow template (active)

---

## Technical Requirements

### SDK Installation

```bash
npm install @noizy/trust-engine-core        # Open source
npm install @noizy/trust-engine-pro         # Licensed (requires key)
```

### Environment Variables

```bash
NOIZY_LICENSE_KEY=xxx          # For Professional/Enterprise
NOIZY_PARTNER_ID=your-platform # Your registered partner ID
```

### Runtime Requirements

- Node.js 18+ (or Cloudflare Workers)
- D1-compatible database (for audit storage)
- KV-compatible store (for config caching)

---

## Support Channels

| Channel | Response Time | Tier |
|---------|---------------|------|
| GitHub Issues | Best effort | Open Source |
| Email (rsp@noizy.ai) | 48 hours | Professional |
| Dedicated Slack | 4 hours | Enterprise |
| Phone | 1 hour | Enterprise SLA |

---

## Next Steps

1. **Request sandbox access**: rsp@noizy.ai
2. **Schedule technical call**: 30-minute integration overview
3. **Identify pilot scope**: Which use cases first?
4. **Sign evaluation agreement**: 30-day no-commitment trial

---

## Appendix: Partner Template Code

### Splice-Style Integration

```javascript
import { SPLICE_INTEGRATION } from '@noizy/trust-engine';

// Pre-built policies for sample marketplaces
// SPLICE_SAMPLE_ORIGIN_VERIFIED
// SPLICE_CREATOR_ROYALTY_SET
```

### BandLab-Style Integration

```javascript
import { BANDLAB_INTEGRATION } from '@noizy/trust-engine';

// Pre-built policies for collaboration platforms
// BANDLAB_VOICE_CONSENT_ACTIVE
// BANDLAB_COLLAB_ATTRIBUTION_SET
```

### Output-Style Integration

```javascript
import { OUTPUT_INTEGRATION } from '@noizy/trust-engine';

// Pre-built policies for remix platforms
// OUTPUT_REMIX_PROVENANCE_CHAIN
// OUTPUT_STEMS_ORIGIN_TRACKED
```

---

*"Your rules. Our enforcement."*

**NOIZY Trust Engine™ v1.1**
**Contact**: rsp@noizy.ai
**Documentation**: https://noizy.ai/trust-engine/docs

---

*© 2026 NOIZY Labs. All rights reserved.*
