# HVS Rights And Consent Spec

Created: 2026-09-03

HVS means Harmony Verification System. Its job is to make creative use
permissioned, explainable, revocable for future controlled uses, and payable.

It is not magic DRM. It is a layered rights, consent, provenance, audit, and
payout system.

## Reality Corrections

### C2PA And Data-Mining Metadata

C2PA and IPTC data-mining metadata are rights and provenance signals. They are
not an unbypassable technical barrier. Metadata can be stripped by unaware or
hostile tools, so NOIZYWORLD must combine embedded metadata with server-side
policy, signed manifests, soft binding, monitoring, and takedown workflows.

Correct claim:

- "NOIZYWORLD embeds C2PA/IPTC training and data-mining preferences and enforces
  those preferences inside NOIZYWORLD-controlled systems."

Unsafe claim:

- "C2PA Do Not Train flags are unbypassable."

### Watermarking

Spectral or perceptual watermarking is traceability, deterrence, and evidence.
It does not prevent scraping by itself. Watermarks can fail under hostile
transforms, lossy capture, re-recording, or adversarial removal.

Correct claim:

- "Per-session preview watermarks help trace leaks and support enforcement."

Unsafe claim:

- "Watermarks prevent automated scraping."

### Voice And Biometric Gates

Continuous biometric clearance is risky, invasive, and hard to make reliable.
Use liveness or identity proof only at grant issuance or renewal, then issue
short-lived capability tokens. Revoke future use immediately inside NOIZYWORLD.
Do not claim the platform can freeze copies, exports, or third-party models it
does not control.

Correct claim:

- "Short-lived voice-use grants can be revoked for future NOIZYWORLD-controlled
  inference and licensing."

Unsafe claim:

- "Creator revocation freezes every downstream model execution everywhere."

### Cloud Custody

Cloudflare R2 is cloud object storage. It can be creator-friendly storage, but it
is not "physical custody" by the creator. For sovereignty, store original
masters locally or in creator-controlled encrypted storage. Use R2 for encrypted
distribution objects, previews, derivatives, and edge delivery where appropriate.

## Storage Authority Model

Authoritative:

- Local encrypted master vault.
- Postgres or D1 metadata only when schema and limits fit the workload.
- Durable Objects for ordered writes that need per-creator or per-project
  serialization.
- Evidence Spine append-only event log.

Non-authoritative:

- KV cache.
- CDN cache.
- External social platform state.
- Discord roles.
- Shopify product state.
- Spotify metadata.

Cloudflare notes:

- R2 is a strong fit for large objects and global delivery, with S3-compatible
  APIs and strong consistency for object operations.
- D1 is useful for small, SQLite-shaped edge data, but each paid database is
  capped at 10 GB and individual databases are single-threaded for write
  throughput.
- D1 read replication improves read latency but uses asynchronous replicas and
  requires the Sessions API for sequential consistency.
- KV is eventually consistent and should not be used for consent, revocation,
  split sheets, or payout authority.

## HVS Consent Token

HVS Consent Tokens are signed capability grants.

Use Ed25519 / EdDSA signatures. Do not use HMAC for founder, creator, or rights
authority signatures unless every verifier is intentionally trusted with signing
material.

Required token fields:

- `iss`: issuer identity.
- `sub`: creator, project, or asset subject.
- `aud`: exact service or broker allowed to consume the token.
- `jti`: unique token ID.
- `nbf`: not-before timestamp.
- `exp`: expiry timestamp.
- `scope`: allowed HVS scope.
- `asset_hashes`: content hashes or manifest IDs covered by the grant.
- `allowed_actions`: explicit actions.
- `forbidden_actions`: explicit negative boundaries.
- `split_sheet_id`: required when monetization or payout is involved.
- `consent_record_id`: source consent record.
- `revocation_pointer`: lookup path for revocation status.
- `reason_code`: why this grant exists.
- `proof`: detached or embedded Ed25519 signature metadata.

Token validation rules:

- Reject `alg=none`.
- Reject unsupported or substituted algorithms.
- Validate issuer, subject, audience, expiry, not-before, token ID, and status.
- Validate every asset hash against the project manifest.
- Validate action against both `allowed_actions` and `forbidden_actions`.
- Validate split sheet before monetization.
- Validate revocation status before every controlled use.
- Log a redacted audit event for every approval and denial.

## HVS Scopes

- `asset.preview`
- `asset.download`
- `asset.remix`
- `asset.license.sync`
- `asset.license.sample`
- `asset.train.ai`
- `asset.infer.ai`
- `voice.clone`
- `voice.avatar`
- `identity.bind`
- `distribution.publish`
- `payout.execute`

Default state is denied.

## AI Training And Inference Policy

Default:

- AI training denied.
- Voice cloning denied.
- Identity binding denied.
- Public distribution denied.
- Payout execution denied until split sheet and KYC state are valid.

Allowed only with:

- Explicit consent record.
- Signed HVS token.
- Narrow scope.
- Short expiry.
- Asset hash binding.
- Revocation check.
- Audit receipt.

## Preview Security

Preview delivery is not just speed.

Controls:

- Signed preview URL with short expiry.
- Least-privilege asset rendition, not original master.
- Per-session watermark where practical.
- Rate limits by creator, project, IP, account, and device/session.
- Bot and abuse detection.
- Cache policy that respects takedown and revocation.
- No raw master download unless explicitly licensed.

SLO:

- Sub-150ms TTFB for previews is an experience target, not a security control.

## Rights Metadata

For music assets, collect DDEX-ready fields:

- ISRC.
- ISWC when known.
- IPI/CAE when known.
- writer, composer, performer, producer, engineer, publisher, label, and rights
  controller roles.
- territory.
- release date.
- work and recording relationships.
- recording-session metadata where available.

For media provenance, collect C2PA-ready fields:

- creator or organization identity claim.
- source asset hashes.
- action history.
- software/toolchain.
- training and data-mining assertion when applicable.
- external manifest or soft-binding pointer when embedded metadata is stripped.

## Enforcement Model

HVS can enforce:

- NOIZYWORLD-controlled previews.
- NOIZYWORLD-controlled downloads.
- NOIZYWORLD-controlled licensing.
- NOIZYWORLD-controlled AI inference/training jobs.
- NOIZYWORLD-controlled payout execution.
- NOIZYWORLD-controlled distribution adapters.

HVS cannot guarantee control over:

- Re-recorded audio.
- Screenshots or screen captures.
- Stripped metadata on third-party platforms.
- Third-party models already trained outside NOIZYWORLD.
- Unauthorized copies outside NOIZYWORLD custody.

For those, use provenance, monitoring, evidence, legal process, partner policy,
and takedown workflows.

## Source Anchors

- C2PA specifications and Training/Data Mining assertions:
  https://spec.c2pa.org/faq/
- C2PA provenance limitations and removable metadata:
  https://c2pa.org/specifications/specifications/2.2/explainer/Explainer.html
- IPTC generative AI opt-out best practices:
  https://iptc.org/news/iptc-publishes-best-practice-guidance-on-generative-ai-opt-out-for-publishers/
- IPTC Photo Metadata Data Mining property:
  https://iptc.org/standards/photo-metadata/iptc-standard/
- DDEX standards:
  https://kb.ddex.net/about-ddex-standards/ddex-standards/
- RFC 8032 EdDSA / Ed25519:
  https://www.rfc-editor.org/info/rfc8032/
- RFC 8037 EdDSA for JOSE:
  https://www.rfc-editor.org/info/rfc8037/
- RFC 8725 JWT Best Current Practices:
  https://www.rfc-editor.org/rfc/rfc8725.html
- Cloudflare R2 consistency:
  https://developers.cloudflare.com/r2/reference/consistency/
- Cloudflare D1 limits:
  https://developers.cloudflare.com/d1/platform/limits/
- Cloudflare D1 read replication:
  https://developers.cloudflare.com/d1/best-practices/read-replication/
- Cloudflare KV consistency:
  https://developers.cloudflare.com/kv/concepts/how-kv-works/

