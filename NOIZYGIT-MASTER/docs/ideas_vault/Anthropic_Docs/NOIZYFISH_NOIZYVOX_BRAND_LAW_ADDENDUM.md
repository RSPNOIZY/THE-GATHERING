# NOIZYFISH + NOIZYVOX — Brand Law Addendum

## Status: CANONICAL + LOCKED

This document defines the governance law that separates platform primitives from NOIZY proof logic across both brands.

---

## Primitive Boundary and Schema Law

### Universal Rules (Both Brands)

1. **All durable schema changes use tracked D1 migrations by default.**
   - Versioned `.sql` files in a migrations folder
   - Never ad hoc SQL for schema changes

2. **`wrangler d1 execute` is for verification, inspection, and controlled remediation — not the default schema path.**

3. **Cloudflare primitives provide:**
   - Storage (D1, KV, R2)
   - Bindings (Worker env)
   - Configuration (wrangler.toml)
   - Deployment surfaces (Workers)

4. **NOIZY higher-order logic provides:**
   - Meaning
   - Proof
   - Governance
   - Institutional law

---

## NOIZYFISH — Brand Law

### Identity

**NOIZYFISH is where archives become living, searchable truth.**

NOIZYFISH is the archive-intelligence and provenance brand.

### Core Law

> **Every archive action must rest on tracked schema law, durable truth, and visible lineage.**

### What This Means

- All NOIZYFISH schema changes go through tracked D1 migrations, not ad hoc SQL
- All archive rescue, resurrection, clustering, and provenance records live in D1-backed truth
- All fast read-only toggles, surfacing modes, and discovery flags can live in KV
- NOIZYFISH never claims that Cloudflare itself provides proof of lineage

### Primitive vs. NOIZY Logic

| Native Cloudflare Primitives | NOIZYFISH Provides |
|------------------------------|-------------------|
| Tracked D1 migrations | Provenance meaning |
| Worker bindings | Archive resurrection logic |
| SQL execution | Gap intelligence |
| Distributed config via KV | Lineage explanations |
| | Proof interpretation |
| | Trust surfaces for creators |

### Schema Rule

Schema changes are tracked through D1 migrations.
Proof claims are made by NOIZYFISH, not assumed from the platform.

### Brand Invariants (ZK-Enforced)

```
NOIZYFISH_REAL_HUMAN_ORIGIN ✅ ZK
NOIZYFISH_DERIVATION_ACK ✅ ZK
NOIZYFISH_PROMOTION_AUDIT ✅ ZK
```

---

## NOIZYVOX — Brand Law

### Identity

**NOIZYVOX is where voice rights become operational law.**

NOIZYVOX is the consent, voice-estate, and operator-trust brand.

### Core Law

> **If a voice can be used, its authority must already be remembered, governed, and auditable.**

### What This Means

- All consent, revoke, voice provenance, and operator-approval tables use tracked D1 migrations
- All trust-sensitive runtime controls start from binding assertions and durable audit truth
- All ordinary UX/config toggles can use KV
- NOIZYVOX clearly separates Cloudflare primitives from NOIZYVOX governance logic

### Primitive vs. NOIZY Logic

| Native Cloudflare Primitives | NOIZYVOX Provides |
|------------------------------|-------------------|
| Tracked D1 migrations | Consent enforcement |
| Worker bindings | Operator accountability |
| SQL-backed audit truth | Voice provenance |
| Distributed config via KV | Proof-bundle logic |
| | Trust interpretation |
| | Creator-visible authority surfaces |

### Schema Rule

If a user can see authority over a voice, the system must already be able to remember it.
Native platform primitives store and route the truth.
NOIZYVOX defines what that truth means.

### Brand Invariants (ZK-Enforced)

```
NOIZYVOX_CONSENT_ACTIVE ✅ ZK
NOIZYVOX_REVOCATION_INSTANT ✅ ZK
NOIZYVOX_PROVENANCE_ATTACHED ✅ ZK
```

---

## Shared Doctrine

### Deploy Blocked If

- Any required ZK circuit is missing
- Audit readiness gate fails
- Time-travel verification fails
- Regulator bundle cannot be generated

### Badge Status

- **GREEN (100%)**: All ZK policies verified
- **YELLOW (90-99%)**: Minor gaps, review required
- **RED (<90%)**: Critical issues, deploy blocked

### Trust Chain

```
Creator rough → NOIZYVOX (provable consent) → NOIZYFISH (provable origin)
→ GORUNFREE (creator speed) → wisdomproject.com (eternal archive)
                    ↓ ZK+D1+REGULATOR GATES
              TRUST NEVER BREAKS
```

---

## What Cloudflare Provides vs. What NOIZY Provides

### Cloudflare (Platform Primitives)

- **D1**: SQLite-compatible SQL database
- **KV**: Global low-latency key-value store
- **R2**: Object storage
- **Workers**: Serverless compute
- **Migrations**: Versioned schema tracking
- **Bindings**: Secure environment access

Cloudflare provides **storage, bindings, configuration, and deployment surfaces**.

### NOIZY (Governance Layer)

- **Policy Language**: Formal ZK-verifiable governance schema
- **Proof Generation**: Cryptographic policy verification
- **Audit Interpretation**: Meaning applied to raw data
- **Trust Surfaces**: Creator-visible verification
- **Compliance Logic**: Regulator bundle generation
- **Institutional Memory**: What the data means, not just what it stores

NOIZY provides **meaning, proof, governance, and institutional law**.

---

## Public Landing Copy

### NOIZYFISH

> **NOIZYFISH: The world's only searchable music archive where every sample's origin is mathematically provable.**

### NOIZYVOX

> **NOIZYVOX: The world's only voice platform where creators revoke consent instantly, with historical proof.**

### Combined

> **Creators don't trust NOIZY. They verify NOIZY.**

---

## Canonical Statement

> **NOIZYFISH and NOIZYVOX are built so policy is not promised, but provable —
> in the interface, in the file, and outside the system.**

---

## Enforcement Summary

| Gate | Applies To | Blocks Deploy If |
|------|-----------|-----------------|
| Audit Readiness | Both | Audit table missing |
| Policy Compiler | Both | ZK circuit missing |
| Time-Travel | Both | Hash chain broken |
| Regulator Bundle | Both | Export fails |
| Chaos Test | Both | Gate doesn't catch violation |

---

## Final Statement

From now on:

- **NOIZYFISH** owns archive truth, provenance, rescue, and lineage
- **NOIZYVOX** owns consent, audit, operator ceremony, and voice authority
- **Both brands** inherit the same hard laws:
  - Tracked D1 migrations are the default schema path
  - Cloudflare primitives are never confused with NOIZY proof logic

That is the cleanest way to keep both brands sharp, credible, and impossible to bullshit.

---

*Locked: 2026-04-07*
*Authority: Robert Stephen Plowman (RSP_001)*
