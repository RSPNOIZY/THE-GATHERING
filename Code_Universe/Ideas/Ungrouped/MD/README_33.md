# HVS — Human Voice Sovereignty

> **Your voice is not a product. It is a right.**

[![HVS](https://img.shields.io/badge/HVS-Human_Voice_Sovereignty-000?style=flat)](https://humanvoicesovereignty.com)
[![Constitutional](https://img.shields.io/badge/Law_%234-HVS_is_a_right-brightgreen?style=flat)](https://github.com/RSPNOIZY/DREAMCHAMBER)
[![License](https://img.shields.io/badge/License-MIT-000?style=flat)](./LICENSE)

---

## What is HVS?

**Human Voice Sovereignty (HVS)** is the legal, philosophical, and technical framework that establishes every human being's inalienable right to control their own voice — its use, its likeness, its reproduction, and its commercial exploitation.

HVS is **Constitutional Law #4** of the NOIZY Empire:

> *HVS is a right, not a mark.*

In practice, HVS is three things:
1. **A legal position** — creators own their voice IP, period.
2. **A technical standard** — every NOIZY product enforces HVS by design, not by policy.
3. **A domain strategy** — strategic acquisition and stewardship of HVS-related domains.

---

## The HVS Manifesto

In the age of synthetic media, your voice can be cloned, translated, sold, and used without your knowledge — unless you establish sovereignty over it first.

HVS exists to change this. We hold that:

- **No voice can be cloned without consent.** Full stop.
- **No voice clone can be used commercially** without the creator receiving their 75% share.
- **Revocation is always possible.** A creator can remove their voice from any system, at any time, without penalty.
- **HVS is not a product.** It cannot be bought, licensed away, or waived by contract.
- **Children's voices are doubly protected.** See NOIZYKIDZ consent standards.

---

## Domain Portfolio

| Domain | Purpose | Status |
|--------|---------|--------|
| humanvoicesovereignty.com | Primary HVS home | 🟡 Verify |
| hvs.ai | Short-form AI context | 🟡 Verify |
| voicesovereign.com | Creator rights landing | 🟡 Verify |

All HVS domains are held at Cloudflare. Guardian: **HEAVEN** (DNS Sovereign).

---

## Technical Standards

HVS is enforced at the code level across all NOIZY products:

### Consent Gate (NOIZYVOX)
Every voice operation passes through the consent gate:
```typescript
// No voice synthesis without active, documented consent
await consentGate.check({ voiceId, operation, context });
```

### Scope Control
Creators define exactly what their voice can do:
```json
{
  "scope": ["tts", "sts"],
  "excluded_scope": ["political", "adult", "third_party_sync"],
  "commercial": true,
  "revocable": true
}
```

### Revocation (24h SLA)
```bash
# Creator requests revocation — must complete within 24 hours
REVOKE voice_id=creator_001
# → Removes from all synthesis queues
# → Archives consent record (immutable log)
# → Notifies creator with confirmation
```

---

## Repository Structure

```
HVS/
├── README.md
├── LICENSE
├── MANIFESTO.md              # Full HVS philosophical declaration
├── LEGAL/
│   ├── CREATOR_RIGHTS.md     # Creator rights framework
│   ├── REVOCATION_POLICY.md  # Revocation protocol and SLA
│   └── CONSENT_TEMPLATE.md   # Standard consent agreement
├── TECHNICAL/
│   ├── CONSENT_SPEC.md       # Technical consent implementation spec
│   └── ENFORCEMENT_GUIDE.md  # How HVS is enforced in NOIZY products
├── DOMAINS/
│   └── PORTFOLIO.md          # Domain acquisition strategy
└── POLICY/
    └── CHILDREN_VOICE.md     # Enhanced protection for minors
```

---

## Relationship to Other NOIZY Brands

| Brand | HVS Role |
|-------|---------|
| **NOIZYVOX** | Primary technical enforcer of HVS |
| **CB01** | Legal compliance and contract enforcement |
| **LUCY** | Voice estate guardian — front-line HVS defender |
| **NOIZYKIDZ** | Extended HVS standards for children |
| **NOIZY.AI** | Platform-wide HVS by design |

---

## Getting Involved

HVS is open to contribution from legal scholars, technologists, musicians, and advocates who believe voice sovereignty is a fundamental right.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## License

MIT — The principles are free. The rights are yours.

---

*HVS is a right, not a mark. GORUNFREE.*
