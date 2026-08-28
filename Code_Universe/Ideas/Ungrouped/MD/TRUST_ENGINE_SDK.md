# NOIZY Trust Engine™ SDK

## Overview

The NOIZY Trust Engine™ is a **productized governance substrate** that other platforms can license, embed, or audit.

**NOIZYFISH** and **NOIZYVOX** are first-party reference implementations.

---

## SDK Boundary: Open vs. Proprietary

### Open Source (MIT License)

Available on GitHub. Free to use, modify, and redistribute.

| Module | Description |
|--------|-------------|
| **Policy Language Spec** | Formal schema for ZK-verifiable policies |
| **Policy Registry** | Runtime policy evaluation |
| **Coverage Badge** | Public verification badges |
| **Chaos Test Framework** | Prove gates catch violations |

### Licensed (Contact for Terms)

Requires license agreement. Contact rsp@noizy.ai.

| Module | Description |
|--------|-------------|
| **ZK Policy Compiler** | Compile policies to circuits |
| **Audit Gate System** | Full CI/CD gate infrastructure |
| **Time-Travel Verification** | Historical state proofs |
| **Regulator Bundle Generator** | EU/US compliance exports |
| **C2PA Proof Export** | Embed proofs in manifests |
| **Trust Engine Runtime** | Full governance orchestration |

---

## SDK Installation

### Open Source Components

```bash
npm install @noizy/trust-engine-core
```

```javascript
import { POLICIES, evaluatePolicy, evaluateAllPolicies } from '@noizy/trust-engine-core';

// Evaluate a policy
const result = evaluatePolicy('CONSENT_ACTIVE_ON_USE', {
  consent_state: 'CLEARED',
  revocation_timestamp: null,
  event_timestamp: new Date().toISOString()
});

console.log(result.result); // true or false
```

### Licensed Components

```bash
npm install @noizy/trust-engine-pro --registry https://npm.noizy.ai
```

Requires `NOIZY_LICENSE_KEY` environment variable.

```javascript
import { TrustEngine } from '@noizy/trust-engine-pro';

const engine = new TrustEngine({
  licensee: 'your-company',
  licenseKey: process.env.NOIZY_LICENSE_KEY
});

await engine.initialize(env);

// Generate C2PA manifest with proofs
const manifest = engine.generateC2PAManifest(assetData, proofs);

// Get coverage metrics
const coverage = await engine.getCoverage(30);
```

---

## API Reference

### Policy Evaluation

```javascript
// Single policy
evaluatePolicy(policyId: string, data: object, config?: object): EvaluationResult

// All policies for a scope
evaluateAllPolicies(scope: string, data: object): ScopeEvaluationResult
```

### Trust Engine Class

```javascript
class TrustEngine {
  constructor(config: TrustEngineConfig)

  async initialize(env: Env): Promise<InitResult>

  getPolicies(): Policy[]

  evaluatePolicy(policyId: string, data: object, config?: object): EvaluationResult

  evaluateAllPolicies(scope: string, data: object): ScopeEvaluationResult

  async getCoverage(days?: number): Promise<CoverageResult>

  generateC2PAManifest(assetData: AssetData, proofs: Proof[]): C2PAManifest

  generateProofAssertion(proofData: ProofData): C2PAAssertion

  getStatus(): EngineStatus
}
```

### Types

```typescript
interface Policy {
  id: string;
  version: string;
  scope: 'audit_event' | 'consent_token' | 'promotion' | 'freeze';
  description: string;
  verification_mode: 'zk' | 'reportable' | 'hybrid';
  inputs: string[];
}

interface EvaluationResult {
  success: boolean;
  policy_id: string;
  policy_version: string;
  result: boolean;
  verification_mode: string;
  timestamp: string;
  error?: string;
}

interface CoverageResult {
  period_days: number;
  overall_compliance: number;
  policies: Record<string, PolicyCoverage>;
  timestamp: string;
}
```

---

## Policy Definitions

### ZK-Verifiable Policies

| Policy ID | Scope | Description |
|-----------|-------|-------------|
| `CONSENT_ACTIVE_ON_USE` | consent_token | Consent was active when action occurred |
| `REVOCATION_HONORED` | consent_token | No usage after revocation |
| `PROMOTION_WINDOW_MET` | promotion | Required stability window met |
| `AUDIT_BEFORE_AUTHORITY` | audit_event | Audit written before authority granted |
| `HUMAN_APPROVAL_REQUIRED` | audit_event | Governance required human approval |
| `FREEZE_PROPERLY_RESOLVED` | freeze | Freeze resolved with explanation |
| `TOKEN_TIME_BOUNDED` | consent_token | Token TTL within limits |
| `HASH_CHAIN_INTACT` | audit_event | Hash chain continuity |

### Adding Custom Policies

```javascript
import { registerPolicy } from '@noizy/trust-engine-core';

registerPolicy({
  id: 'MY_CUSTOM_POLICY',
  version: '1.0.0',
  scope: 'audit_event',
  description: 'My custom governance rule',
  verification_mode: 'zk',
  inputs: ['field1', 'field2'],
  evaluate: (data, config) => {
    return data.field1 === data.field2;
  }
});
```

---

## Gate Integration

### Audit Readiness Gate

```javascript
import { assertAuditReady } from '@noizy/trust-engine-pro';

export default {
  async fetch(request, env) {
    // Block all requests if audit not ready
    await assertAuditReady(env);

    // ... handle request
  }
};
```

### CI Gate Script

```bash
#!/usr/bin/env bash
# scripts/trust-engine-gate.sh

npx noizy-trust-engine check-syntax
npx noizy-trust-engine compile-circuits
npx noizy-trust-engine run-proofs
npx noizy-trust-engine verify-roundtrip
npx noizy-trust-engine chaos-test
```

### GitHub Actions

```yaml
- name: Trust Engine Gate
  run: npx @noizy/trust-engine-pro gate --all
  env:
    NOIZY_LICENSE_KEY: ${{ secrets.NOIZY_LICENSE_KEY }}
```

---

## C2PA Integration

### Generate Manifest with Proofs

```javascript
import { generateVoiceProofs, generateC2PAManifest } from '@noizy/trust-engine-pro';

// Generate proofs for voice synthesis
const proofs = await generateVoiceProofs(env, synthesisData);

// Create C2PA manifest
const manifest = generateC2PAManifest({
  title: 'My Voice Asset',
  brand: 'NOIZYVOX',
  creator_name: 'Artist Name',
  format: 'audio/wav'
}, proofs);

// manifest.noizy_trust contains all policy proofs
```

### Proof Assertion Schema

```json
{
  "label": "c2pa.noizy.policy_proof",
  "data": {
    "@context": "https://noizy.ai/schemas/c2pa-proof/v1",
    "@type": "NoizyPolicyProof",
    "proof_id": "zkp_94af...",
    "policy_id": "CONSENT_ACTIVE_ON_USE",
    "verification_mode": "zk",
    "result": true,
    "verify_url": "https://noizy.ai/trust/verify?proof=zkp_94af"
  }
}
```

---

## Compliance Bundle Generation

### Generate EU/US Bundles

```javascript
import { generateComplianceBundle } from '@noizy/trust-engine-pro';

// EU bundle (GDPR)
const euBundle = await generateComplianceBundle(env, {
  profile: 'eu',
  dateRange: { start: '2026-01-01', end: '2026-04-07' }
});

// US bundle (CCPA)
const usBundle = await generateComplianceBundle(env, {
  profile: 'us',
  dateRange: { start: '2026-01-01', end: '2026-04-07' }
});
```

### Bundle Contents

Each bundle contains:
- Audit export (filtered for profile)
- Merkle roots and anchor receipts
- `verify.sh` script
- Policy coverage summary
- README with verification instructions

---

## Licensing Tiers

### Open Source (Free)

- Policy Language Spec
- Policy Registry (core)
- Coverage Badge generator
- Chaos Test framework
- Community support

### Professional ($X/month)

- All Open Source features
- ZK Policy Compiler
- Audit Gate System
- Time-Travel Verification
- Regulator Bundle Generator
- Email support + Documentation

### Enterprise (Custom)

- All Professional features
- Custom policy development
- Dedicated support + SLA
- On-premise deployment option
- White-label licensing
- Direct integration assistance

**Contact**: rsp@noizy.ai

---

## Support

### Documentation

- Full docs: https://noizy.ai/trust-engine/docs
- API reference: https://noizy.ai/trust-engine/api
- Examples: https://github.com/noizy/trust-engine-examples

### Community

- GitHub Issues: https://github.com/noizy/trust-engine
- Discord: https://discord.gg/noizy

### Enterprise

- Email: rsp@noizy.ai
- SLA response times available with Enterprise license

---

## Legal

The NOIZY Trust Engine™ provides cryptographic verification tools.

**It does not provide:**
- Legal advice
- Compliance guarantees
- Regulatory certification

Policy proofs are **evidence**, not **legal guarantees**.

Users are responsible for their own regulatory compliance.

---

*NOIZY Trust Engine™ © 2026 NOIZY Labs. All rights reserved.*
