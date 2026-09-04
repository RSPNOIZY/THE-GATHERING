# NOIZYFISH Deep Research Report Source

Date: 2026-09-03

Audience: RSP and NOIZY operators.

Scope: pressure-test the NOIZYFISH vision and upgrade the three pillars into an
implementable architecture for creator ownership, rights, distribution,
monetization, and route handoff safety.

Assumptions:

- NOIZYWORLD starts from a U.S./Canada operating base but aims globally.
- Plowman Standard is non-negotiable.
- Sensitive creator identity, royalties, contracts, and secrets must remain
  local or in scoped vault systems.
- External platforms are adapters, not sources of truth.

## Direct Answer

NOIZYFISH should become a creator-owned operating system, not a social network
clone and not a Meta-first funnel. Its strongest wedge is the room-to-revenue
loop:

1. Creator identity.
2. Project room.
3. Asset graph.
4. Consent record.
5. Split sheet.
6. Distribution receipt.
7. Payout receipt.
8. Evidence Spine event.

The pasted vision is strategically right but needs four corrections:

- C2PA/IPTC "Do Not Train" signals are not unbypassable enforcement.
- Watermarking supports traceability, not scrape prevention by itself.
- Cloudflare R2 is cloud object storage, not creator physical custody.
- Revocation only reliably freezes future NOIZYWORLD-controlled uses.

## Evidence-Backed Architecture

Cloudflare R2 is appropriate for large encrypted objects, previews, and
distribution derivatives because it supports S3-compatible object storage and
strong object-operation consistency. D1 can support bounded edge metadata, but
its 10 GB paid database size and write-throughput characteristics require
careful sharding. KV should only cache non-authoritative data because it is
eventually consistent.

C2PA and IPTC are useful for provenance and data-mining preference expression.
They should be embedded where possible and paired with server-side enforcement,
TDM policy, monitoring, and takedown workflows. They should not be described as
unbypassable.

Ed25519/EdDSA is the right default for creator, consent, evidence, and founder
authority signatures. HMAC can authenticate internal service calls only when all
verifiers are trusted with signing material. Token validators must reject
algorithm substitution and unsigned tokens.

Stripe Connect supports charge models for marketplaces and multi-party payouts,
including separate charges and transfers for multiple connected accounts.
NOIZYWORLD should validate split sheets before creating payout instructions.

Apple Maps, Google Maps, and Waze support URL/deep-link handoff patterns.
CarPlay remains entitlement-gated and template-based, so the MCP layer should
produce read-only route proposals and opaque handoff tokens, not control CarPlay
or system navigation UI.

## Deliverables Created

- `architecture/hvs_rights_consent_spec.md`
- `architecture/evidence_spine_architecture.md`
- `research/noizyfish_claims_reality_register.md`
- `schemas/hvs_consent_token.schema.json`
- `schemas/evidence_event.schema.json`
- `/Users/m2ultra/NOIZY_SAFE_AUDIT_KIT/schemas/gabriel_routes_schema.json`

## Gaps

- Need selected implementation repository.
- Need real API app approvals and developer accounts for TikTok, YouTube,
  Threads, Discord, Shopify, and Stripe.
- Need legal review for voice, likeness, licensing, sync, and mentor tail-bond
  clauses before production money moves.
- Need Bitwarden Secrets Manager installation and a non-production machine
  account test before platform tokens are integrated.

## Stop Reason

Research stopped after current official docs and standards covered the
consequential architectural choices: Cloudflare storage consistency, C2PA/IPTC
provenance limits, DDEX metadata, Ed25519/JWT security, Stripe Connect payout
models, platform API consent constraints, and maps/deep-link boundaries.

