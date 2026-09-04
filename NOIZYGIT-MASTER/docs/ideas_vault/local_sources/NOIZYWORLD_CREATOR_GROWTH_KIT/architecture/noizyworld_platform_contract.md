# NOIZYWORLD Platform Contract

Created: 2026-09-02

## Mission

NOIZYWORLD is the creator-owned operating system for collaboration, distribution,
and monetization.

It must make creators more powerful without turning identity, consent, culture,
or royalties into rented platform data.

## Non-Negotiable Invariants

- Consent is required before synthesis, voice use, identity binding, public
  publishing, rights assignment, or payout-rule changes.
- Provenance is recorded by default.
- Revocation never erases historical earnings.
- Compensation is automatic where the payout rail permits it.
- Standard split is 75/25 creator/platform.
- RSP_001 founding actor split floor is 85/15.
- Sensitive catalog, royalties, contracts, identity, keys, and secrets stay
  local or in a scoped vault path.
- External platforms are adapters, never sources of truth.

## Core Domain Objects

### Creator

Required fields:

- `creator_id`
- `display_name`
- `verified_handles`
- `roles`
- `skills`
- `region`
- `languages`
- `consent_profile_id`
- `payout_account_status`
- `trust_level`
- `created_at`
- `updated_at`

### Asset

Required fields:

- `asset_id`
- `content_hash`
- `asset_type`
- `owner_creator_id`
- `project_id`
- `license_id`
- `provenance_id`
- `consent_record_ids`
- `storage_uri`
- `visibility`
- `created_at`
- `updated_at`

Asset types:

- `stem`
- `sample`
- `track`
- `video`
- `image`
- `preset`
- `template`
- `code`
- `lyrics`
- `metadata`

### Project Room

Required fields:

- `project_id`
- `title`
- `creator_ids`
- `roles`
- `asset_ids`
- `split_sheet_id`
- `license_scope`
- `status`
- `challenge_id`
- `created_at`
- `updated_at`

### Split Sheet

Required fields:

- `split_sheet_id`
- `project_id`
- `participants`
- `creator_percentages`
- `platform_percentage`
- `founding_actor_floor_applied`
- `signatures`
- `effective_at`
- `revoked_at`
- `version`
- `dispute_status`

Rules:

- Percentages must sum to 100.
- Default creator pool must be at least 75%.
- RSP_001 allocation must not fall below 85% when RSP_001 is the founding actor
  under the founding-floor rule.
- Changes require a new signed version.
- Prior accepted versions remain valid for historical earnings.

### Consent Record

Required fields:

- `consent_id`
- `subject_creator_id`
- `scope`
- `allowed_uses`
- `forbidden_uses`
- `expires_at`
- `revoked_at`
- `signature`
- `created_at`

Consent scopes:

- `identity`
- `voice`
- `likeness`
- `training`
- `collaboration`
- `distribution`
- `sync_license`
- `payout`

### Distribution Receipt

Required fields:

- `distribution_receipt_id`
- `project_id`
- `asset_ids`
- `platform`
- `adapter_version`
- `publish_mode`
- `publish_state`
- `creator_approval_id`
- `external_post_id`
- `external_url`
- `utm_slug`
- `metrics_snapshot`
- `created_at`
- `updated_at`

Publish modes:

- `draft`
- `proposal`
- `manual_handoff`
- `api_post`

No adapter may publish without recorded creator approval.

### Payout Receipt

Required fields:

- `payout_receipt_id`
- `project_id`
- `split_sheet_id`
- `gross_amount`
- `fees`
- `creator_net_amounts`
- `platform_net_amount`
- `processor`
- `processor_object_ids`
- `status`
- `created_at`
- `settled_at`

## Adapter Contract

Every external adapter must declare:

- Capabilities.
- Required scopes.
- Required user consent.
- Token storage path.
- API rate limits or quota constraints.
- Review/audit requirements.
- Data imported into NOIZYWORLD.
- Data forbidden from export.
- Failure and retry behavior.

## Initial Adapter Boundaries

### Threads

Allowed:

- Draft public posts.
- Publish after user consent and valid API scope.
- Read post/account insights where approved.
- Track community/challenge attribution.

Forbidden:

- Treating Threads as creator identity source of truth.
- Publishing without creator approval.
- Storing long-lived tokens in browser code or logs.

### TikTok

Allowed:

- Direct post video/photo after app audit and creator authorization.
- Pull creator posting constraints before creating a publish request.
- Store publish status and public URL.

Forbidden:

- Assuming unaudited clients can publish publicly.
- Ignoring privacy/comment/duet/stitch constraints.
- Posting on behalf of a creator without current authorization.

### YouTube

Allowed:

- Upload/draft/status/analytics within quota and API review constraints.
- Capture video IDs and performance snapshots.

Forbidden:

- Assuming API uploads from unverified projects are public.
- Building a business model dependent only on Shorts revenue.
- Hiding quota or compliance-review failures from creators.

### Spotify

Allowed:

- Link to tracks, artists, albums, playlists, and public metadata under Spotify
  developer policy.
- Build playlist and discovery experiences where policy permits.

Forbidden:

- Uploading music through Spotify Web API.
- Syncing Spotify audio into videos.
- Remixing, mixing, or overlapping Spotify content.
- Training AI on Spotify content.

### Discord

Allowed:

- Guild onboarding.
- Event rooms.
- Role gating after entitlement verification.
- Premium app or activity experiments where eligible.

Forbidden:

- Making Discord the split-sheet or payout source of truth.
- Mirroring private creator data into Discord messages.
- Bypassing Discord monetization rules for paid app features.

### Shopify

Allowed:

- Merch and storefront acceleration.
- Shop Pay where eligible.
- Digital products when rights and tax handling are clear.

Forbidden:

- Making Shopify the identity, licensing, or royalty ledger.
- Selling unverified samples, stems, voices, or templates.

### Stripe

Allowed:

- Connect onboarding.
- Direct charges, destination charges, or separate charges and transfers chosen
  by business model.
- Payout and dispute receipts.

Forbidden:

- Paying a collaborator without a signed split sheet.
- Calling an amount "instant" without checking eligibility, reserves,
  settlement timing, and region.
- Logging processor secrets or raw account tokens.

### ActivityPub And AT Protocol

Allowed:

- Public creator profile syndication.
- Open social updates.
- Portable public graph experimentation.

Forbidden:

- Publishing private rooms, unreleased assets, raw split sheets, or sensitive
  identity data into public/federated records.

## Build Acceptance Checklist

- Source files exist locally or in a known repo.
- Commit SHA and lockfiles are recorded where a git repo exists.
- NOIZY Safe Audit Kit has a fresh current-tree scan.
- Git history scan exists for each git repository.
- Adapter token scopes are documented.
- Consent path is implemented before any publish path.
- Split-sheet validation exists before any payout path.
- Negative tests exist for forbidden exports, missing consent, stale grants,
  token leakage, quota failure, and revoked collaborator state.

