# NOIZYWORLD 90-Day Upgrade Plan

Created: 2026-09-02

## North Star

Within 90 days, a creator should be able to:

1. Create a NOIZYWORLD profile.
2. Start or join a project room.
3. Upload or link assets.
4. Sign a split sheet.
5. Generate platform-specific distribution drafts.
6. Approve publishing or manual handoff.
7. Sell or license a verified asset.
8. See payout and attribution receipts.

## Success Metrics

Activation:

- Profile plus first asset within 15 minutes.
- First project invite sent within 30 minutes.
- First split sheet proposed within one session.

Collaboration:

- Project rooms created.
- Asset reuse per project.
- Split-sheet completion rate.
- Time from invite to accepted role.

Distribution:

- Drafts generated per asset.
- Creator-approved publishes or handoffs.
- Click-through from external platforms to NOIZYWORLD attribution pages.
- Fans joining guilds from attribution links.

Monetization:

- Gross creator GMV.
- Creator net payout.
- Platform net revenue.
- Payout delay by processor and country.
- Disputed split rate.

Trust:

- Percent of public assets with consent records.
- Percent of sellable assets with license metadata.
- Percent of media assets with provenance records where practical.
- Secret-scan pass rate before release.

## Phase 0: Evidence And Safety Gate, Days 1-7

Deliver:

- Repository map and chosen implementation repo.
- Fresh NOIZY Safe Audit Kit report.
- Fresh Gitleaks current-tree report.
- Git history scan for any selected git repo.
- Bitwarden machine-account plan for platform API tokens.
- Minimal threat model for identity, publishing, payout, and asset storage.

Do not build platform adapters until token storage and consent records are
defined.

## Phase 1: Creator Identity And Project Rooms, Days 8-21

Deliver:

- `creator_id` model.
- Profile page with handles, skills, language, region, portfolio links, and
  trust status.
- Project room model.
- Invite flow.
- Roles: owner, collaborator, reviewer, rights admin, distributor.
- Basic asset upload/linking with content hash and owner.
- Private/public visibility.

Acceptance:

- Creator can create a room and invite another creator.
- Asset cannot be published, sold, or licensed without owner and consent state.
- No platform tokens are required for this phase.

## Phase 2: Asset Graph And Split Sheets, Days 22-35

Deliver:

- Asset graph for stems, samples, tracks, videos, images, presets, templates,
  code, lyrics, and metadata.
- Split-sheet model with signed versions.
- Plowman Standard validation.
- Revocation model that preserves historical earnings.
- Dispute state.
- DDEX-ready metadata fields for music assets.
- C2PA-ready provenance fields for media assets.

Acceptance:

- Percentages must sum to 100.
- Creator pool defaults to at least 75%.
- RSP_001 founding-floor rule cannot be violated.
- Split changes create a new version instead of mutating old receipts.

## Phase 3: Browser Creation Surface, Days 36-49

Deliver:

- Stem preview and waveform view.
- Comment markers tied to asset timecodes.
- Lightweight remix room.
- OPFS-backed local draft cache where browser support permits it.
- AudioWorklet-based realtime preview experiments.
- WebCodecs-based render/import experiments for supported media.

Acceptance:

- Creator can review and comment on stems without downloading a full DAW.
- Browser feature checks fall back gracefully.
- Large media processing does not block the main UI.

## Phase 4: Distribution Receipts And First Adapters, Days 50-63

Deliver:

- Distribution receipt model.
- Attribution slug and NOIZYWORLD landing page per project/submission.
- Threads draft/publish adapter design.
- TikTok direct-post readiness checklist.
- YouTube upload/readiness checklist.
- Bluesky/AT Protocol public profile experiment.
- Discord guild role and event-room integration design.

Acceptance:

- Every publish action starts as a proposal.
- Creator approves each platform action separately.
- Receipts store media hashes and URLs, not raw tokens.
- Quota or review failures are visible to the creator.

## Phase 5: Monetization MVP, Days 64-77

Deliver:

- Stripe Connect account onboarding plan.
- Stripe sandbox integration.
- Product listing model for sample packs, templates, tickets, and memberships.
- Split-sheet-to-payout mapping.
- Manual payout review queue for first production transactions.
- Shopify/Shop Pay integration decision memo for merch and storefronts.

Acceptance:

- No payout can execute without a signed split sheet.
- Processor object IDs are logged, secrets are not.
- Refund and dispute ownership is explicit before production.
- Platform fee is transparent before checkout.

## Phase 6: Challenges, Guilds, And Marketplace, Days 78-90

Deliver:

- Monthly challenge workflow.
- Regional/language guild pages.
- Submission voting with anti-abuse controls.
- Featured creator and collaborator leaderboards.
- Brand/sync brief intake.
- Rights filter: usable assets only.
- Pilot cohort dashboard.

Acceptance:

- A challenge can move from prompt to room to submission to attribution page.
- Winning assets can become sellable or licensable only after rights checks.
- Brand briefs cannot access private assets or unreleased works.

## Platform Priority

Build first:

1. Owned NOIZYWORLD profiles, rooms, assets, split sheets, and receipts.
2. Stripe sandbox for payouts and fees.
3. Discord guild/event workflows.
4. Threads drafts and public conversation loops.
5. TikTok and YouTube adapters after approval/audit readiness.
6. Shopify/Shop Pay for merch and commerce acceleration.
7. AT Protocol and ActivityPub for portable public identity.

Delay:

- Full DAW.
- Full AI agent marketplace.
- Automated cross-posting without per-platform consent.
- Sync marketplace payouts before rights verification.
- Direct DSP distribution before DDEX metadata quality is strong.

## Pilot Offer

Start with a single creator-facing promise:

"Make a collaboration, prove the split, publish the drop, and get paid without
arguing in DMs."

Pilot cohort:

- 25 musicians.
- 10 visual/video creators.
- 5 developers.
- 5 producer/curator moderators.
- 5 brand/sync scouts.

First paid products:

- Challenge pass.
- Sample pack.
- Remix pack.
- Creator membership.
- Sponsored brief.
- Sync shortlist fee.

## Open Questions

- Which repository becomes the implementation source of truth?
- Which creator accounts are approved for TikTok/YouTube/Threads API testing?
- Which Stripe account owns marketplace liability?
- Which regions need first-language guilds first?
- Which rights templates will be reviewed by counsel before production sales?

