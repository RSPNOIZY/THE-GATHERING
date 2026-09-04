# Evidence Spine Architecture

Created: 2026-09-03

The Evidence Spine records what happened, who authorized it, which assets were
involved, which rules applied, and which payout or distribution receipts were
created.

It is an append-only, hash-linked event log. It is not automatically a public
blockchain. External anchoring can be added later if the legal or trust value
justifies the cost and complexity.

## Purpose

- Prove creator consent.
- Prove asset provenance.
- Prove split-sheet versions.
- Prove distribution approvals.
- Prove payout calculations.
- Prove revocation timing.
- Prove denied attempts without leaking secrets.

## Event Rules

Every event:

- Has a unique event ID.
- Has an actor ID.
- Has a reason code.
- Has an object type and object ID.
- Has a previous event hash for its stream.
- Has a canonical payload hash.
- Has an Ed25519 signature from the authorized writer.
- Contains no raw secrets.
- Contains no raw GPS coordinates unless the event type explicitly permits it,
  and the default is to store opaque trip tokens instead.
- References assets by content hash or manifest ID instead of copying raw media.

## Event Streams

Use separate streams so one noisy workflow does not block every other workflow:

- `creator:<creator_id>`
- `project:<project_id>`
- `asset:<asset_id>`
- `split:<split_sheet_id>`
- `consent:<consent_id>`
- `distribution:<distribution_receipt_id>`
- `payout:<payout_receipt_id>`
- `route:<trip_session_id>`

Each stream is independently hash-linked. Cross-stream references are recorded
by object IDs and event hashes.

## Storage Model

Preferred first implementation:

- Postgres or D1 table for events if the selected deployment target fits the
  write/read pattern.
- Durable Object per stream family when strict write ordering is needed at the
  edge.
- R2 for immutable payload blobs or signed manifests that exceed row limits.
- KV only for cached reads and public receipts. KV is not authoritative.

Cloudflare-specific caution:

- D1 has database-size and write-throughput limits. Do not put every media
  fingerprint or high-volume analytics event into one D1 database.
- KV is eventually consistent. Do not use it for revocation, payout, consent, or
  split authority.
- R2 object operations are strongly consistent, but CDN cache behavior can still
  serve old content unless purge/revalidation is handled.

## Event Types

Creator and identity:

- `creator.created`
- `creator.handle.verified`
- `creator.consent_profile.updated`
- `identity.binding.proposed`
- `identity.binding.approved`
- `identity.binding.revoked`

Asset:

- `asset.created`
- `asset.hash.recorded`
- `asset.provenance.attached`
- `asset.license.attached`
- `asset.preview.generated`
- `asset.preview.accessed`
- `asset.download.approved`
- `asset.download.denied`

Consent and HVS:

- `consent.record.created`
- `consent.record.revoked`
- `hvs.token.issued`
- `hvs.token.denied`
- `hvs.token.revoked`
- `hvs.validation.failed`

Split and payout:

- `split_sheet.proposed`
- `split_sheet.signed`
- `split_sheet.revoked_for_future`
- `payout.calculated`
- `payout.executed`
- `payout.failed`
- `payout.disputed`

Distribution:

- `distribution.proposed`
- `distribution.approved`
- `distribution.published`
- `distribution.failed`
- `distribution.metrics.snapshot`

Route handoff:

- `route.proposed`
- `route.handoff_token.issued`
- `route.handoff.denied`
- `route.handoff.opened`

Security:

- `auth.grant.issued`
- `auth.grant.denied`
- `auth.peer_credential.failed`
- `auth.replay.detected`
- `secret.access.denied`
- `secret.access.approved`

## Hashing And Signing

- Canonicalize event JSON before hashing.
- Hash with SHA-256.
- Sign the canonical event body or body hash with Ed25519.
- Reject ambiguous algorithms and unsigned events.
- Validate issuer, key ID, subject, audience, expiry, and revocation status.
- Treat HMAC as internal service authentication only, never as creator or founder
  authority.

## Redaction

Store:

- Opaque IDs.
- Content hashes.
- Manifest IDs.
- Provider object IDs.
- Timestamps.
- Capability IDs.
- Reason codes.
- Approval or denial state.

Do not store:

- Raw API tokens.
- Raw OAuth authorization codes.
- Raw precise GPS.
- Raw biometric samples.
- Raw voiceprints.
- Private key material.
- Full payment card data.
- Private project media unless the event is an R2 object reference.

## Verification Report

Every release should include:

- Fresh Gitleaks current-tree report.
- Git history report where applicable.
- Evidence Spine migration/schema diff.
- Negative tests for redaction, replay, stale grant, missing consent, split
  invalidity, and token leakage.

