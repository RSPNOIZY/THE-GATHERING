# NOIZYWORLD Creator Growth Kit

Created: 2026-09-02

Purpose: upgrade NoizyFish.com / NOIZYWORLD from a platform-stack idea into a
creator-owned growth operating system.

This kit is constrained by the Plowman Standard:

- Standard creator/platform split: 75/25.
- RSP_001 founding actor floor: 85/15.
- Consent before synthesis, voice use, identity binding, or rights transfer.
- Creator keeps historical earnings after revocation.
- Sensitive identity, royalty, contract, and catalog data stays local or in a
  controlled vault path.

## Read First

- [2026 creator stack research](research/noizyworld_creator_stack_2026.md)
- [NOIZYWORLD platform contract](architecture/noizyworld_platform_contract.md)
- [HVS rights and consent spec](architecture/hvs_rights_consent_spec.md)
- [Evidence Spine architecture](architecture/evidence_spine_architecture.md)
- [Claims reality register](research/noizyfish_claims_reality_register.md)
- [Source ledger](research/source_ledger.md)
- [90-day upgrade plan](roadmaps/noizyworld_90_day_upgrade_plan.md)
- [Google Earth 3D import contract](geospatial/google_earth_3d_import_contract.md)

## Strategic Rule

NOIZYWORLD should not be another rented audience page.

The owned core is:

- Creator identity.
- Asset provenance.
- Consent records.
- Split sheets.
- Licensing state.
- Collaboration graph.
- First-party analytics.
- Payout receipts.

External platforms are adapters:

- Threads, TikTok, YouTube, Bluesky, ActivityPub, Discord, Twitch, Shopify,
  Stripe, Spotify, and future channels should plug into NOIZYWORLD without
  owning the creator's core relationship or rights graph.

## Three Pillars

1. Collaborative Utility Engine: browser-first creation, asset graph, project
   matching, split sheets, and creator-safe licensing.
2. Viral Community Distribution: create once, distribute carefully, track
   receipts, and route fans into owned guilds.
3. Sovereign Creator Monetization: Stripe Connect-backed splits, storefronts,
   memberships, brand/sync marketplace, and transparent Plowman Standard fees.

## Acceptance Gate

Before implementation work:

- Run the NOIZY Safe Audit Kit.
- Verify claimed artifacts locally.
- Scan source and git history with Gitleaks where a git repository exists.
- Keep secrets in Bitwarden Secrets Manager or an equivalent scoped vault path.
- Do not store social API tokens in browser-visible code, prompts, URLs, logs,
  screenshots, shell history, or fixtures.

Primary gate:

```bash
/bin/bash /Users/m2ultra/NOIZY_SAFE_AUDIT_KIT/scripts/noizy_gitleaks_scan.sh \
  --target /path/to/repo \
  --mode dir \
  --fail-on-leaks
```

Route safety schema:

- [/Users/m2ultra/NOIZY_SAFE_AUDIT_KIT/schemas/gabriel_routes_schema.json](/Users/m2ultra/NOIZY_SAFE_AUDIT_KIT/schemas/gabriel_routes_schema.json)

Core machine-checkable NOIZYWORLD schemas:

- [HVS consent token](schemas/hvs_consent_token.schema.json)
- [Evidence Spine event](schemas/evidence_event.schema.json)
- [Google Earth GLB import manifest](schemas/google_earth_glb_import_manifest.schema.json)
