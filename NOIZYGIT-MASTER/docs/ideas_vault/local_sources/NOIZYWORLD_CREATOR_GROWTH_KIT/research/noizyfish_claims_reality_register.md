# NOIZYFISH Claims Reality Register

Created: 2026-09-03

Purpose: preserve the ambition of the NOIZYFISH vision while converting risky
or overbroad claims into buildable, testable architecture.

Status meanings:

- Keep: claim is directionally sound and implementation-ready.
- Upgrade: claim is valuable but needs more precise engineering language.
- Reject: claim should not be used in architecture or public positioning.

## Register

| Claim | Status | Smarter Version | Implementation Rule | Evidence |
|-------|--------|-----------------|---------------------|----------|
| NOIZYFISH should invert extractive platform dependence | Keep | Owned creator identity, rights, consent, split, and payout state should live in NOIZYWORLD, while external platforms remain adapters | Never make Threads, TikTok, YouTube, Discord, Spotify, Shopify, or Stripe the source of truth for rights or consent | ActivityPub and AT Protocol support portable/open social strategies; Stripe/Shopify/Discord are external rails, not rights ledgers |
| Every artist gets a sovereign back catalog | Keep | Master catalog becomes a structured asset graph with hashes, rights metadata, consent state, split state, and provenance | Store original masters locally or in creator-controlled encrypted storage; store distribution derivatives and previews in cloud only by policy | C2PA and DDEX support provenance and music metadata; Cloudflare R2 is cloud object storage, not physical custody |
| Human-in-the-loop AI extension | Keep | AI can extend assets only through explicit consent, signed grants, scoped model jobs, and revocation checks | Deny training, inference, voice cloning, and identity binding by default | NIST AI RMF and U.S. Copyright Office digital replica work support explicit risk governance around generative AI |
| Every use is counted, compensated, and explainable | Upgrade | Every NOIZYWORLD-controlled use must be counted, tied to a consent/split record, and given an audit receipt | Do not claim countability for off-platform scraping, screen recording, or stripped metadata | Evidence Spine controls internal use; external enforcement requires monitoring and takedown |
| R2 plus D1 plus KV can hold the portfolio vault | Upgrade | R2 can hold large encrypted objects and derivatives; D1 can hold bounded edge metadata; KV can cache non-authoritative reads | Do not put revocation, payout authority, split sheets, or consent authority in KV | Cloudflare states KV is eventually consistent; D1 has 10 GB paid database limits and single-database write constraints; R2 object ops are strongly consistent |
| Creator retains physical custody over R2 files | Reject | Creator custody means local encrypted masters or creator-controlled storage. R2 is cloud custody | Use R2 for encrypted delivery objects, previews, backups, or replicas, not as the sole master-of-record claim | Cloudflare R2 is S3-compatible cloud object storage |
| HVS uses Ed25519 signatures | Keep | Use Ed25519/EdDSA for creator, founder, consent, and evidence signatures | Reject HMAC, `alg=none`, and algorithm substitution for creator authority | RFC 8032 defines EdDSA/Ed25519; RFC 8037 defines EdDSA for JOSE; RFC 8725 requires algorithm verification and explicit typing |
| Previews require sub-150ms TTFB | Upgrade | Treat sub-150ms preview TTFB as an SLO, not a security control | Security still requires signed URLs, redacted logs, rate limits, watermarking, and revocation-aware cache policy | R2/CDN/D1/KV behavior must be designed around each service's consistency and cache model |
| Spectral watermarks prevent scraping | Reject | Per-session watermarks help trace and deter leaks; they do not prevent scraping by themselves | Never rely on watermarking as the only anti-abuse control | C2PA/IPTC distinguish provenance from watermarking; Google DeepMind notes watermarking has limitations and can be part of a broader toolkit |
| C2PA Do Not Train metadata is unbypassable | Reject | C2PA and IPTC can express training/data-mining preferences and provenance; enforcement depends on participating systems, policy, monitoring, and legal remedies | Embed metadata, publish TDM policy, keep server-side enforcement, and monitor for misuse | C2PA explains metadata can be removed and provenance is not always complete; IPTC frames AI opt-out as best-practice signals |
| Voice cloning requires continuous biometric clearance | Upgrade | Use identity/liveness proof at grant issuance or renewal, then short-lived voice-use grants with revocation checks | Do not store raw biometric samples in Evidence Spine events; deny voice use by default | NIST AI RMF and digital replica law/policy emphasize risk management, consent, and governance |
| Revocation freezes downstream model execution | Upgrade | Revocation freezes future NOIZYWORLD-controlled model jobs and licensing; it cannot recall uncontrolled third-party copies | Make this boundary visible in user-facing terms | Enforcement is only reliable inside systems NOIZYWORLD controls |
| 75/25 covenant is immutable | Keep | Enforce 75/25 default creator/platform split and RSP_001 85/15 floor in split-sheet validation | Split-sheet versions are append-only; historical earnings survive revocation | Golden Principles define Plowman Standard |
| Collaborative derivative works embed parent C2PA credentials | Upgrade | Derivatives should record parent asset hashes, consent IDs, C2PA manifests where practical, and split ancestry | Do not assume third-party tools preserve embedded manifests | C2PA supports ingredient/provenance patterns, but metadata can be stripped |
| Tail bond accrual | Upgrade | Treat mentor/apprentice tail bonds as optional signed split clauses with explicit cap, duration, scope, and revocation rules | Do not route apprentice earnings to mentors without informed consent and visible payout receipts | Plowman Standard permits automatic compensation only when consent and terms are explicit |
| Evidence Spine is permanently immutable | Upgrade | Evidence Spine is append-only and hash-linked; stronger immutability needs external anchoring, backups, write-once storage, or third-party notarization | Do not call it permanent unless anchoring and retention controls exist | Internal hash chains prove tamper evidence, not physical permanence |
| Automated takedowns can immediately enforce all leaks | Upgrade | Watermarks and fingerprints can support detection and takedown packages; legal/platform response times vary | Start with evidence packets and human review for high-risk enforcement | Platform takedown workflows are external dependencies |
| CarPlay routing engine can coordinate Waze and Apple Maps links | Keep | Build read-only route proposals and opaque handoff URLs; user opens supported Maps/Waze links | Never claim background CarPlay UI control from local MCP | Apple and Waze document URL/deep-link flows; CarPlay is entitlement-gated |

## Highest Priority Corrections

1. Replace "unbypassable" with "enforced inside NOIZYWORLD-controlled systems and
   signaled externally through metadata, policy, monitoring, and takedown."
2. Replace "physical custody on R2" with "local encrypted master custody plus
   encrypted R2 replicas/derivatives."
3. Replace "watermark prevents scraping" with "watermark supports leak
   attribution and enforcement."
4. Replace "continuous biometric clearance" with "short-lived voice-use grants
   issued after explicit consent and appropriate identity/liveness checks."
5. Replace "instant freeze everywhere" with "immediate revocation for future
   NOIZYWORLD-controlled operations."

## Source Anchors

- Cloudflare R2 limits and consistency:
  https://developers.cloudflare.com/r2/platform/limits/
  https://developers.cloudflare.com/r2/reference/consistency/
- Cloudflare D1 limits and read replication:
  https://developers.cloudflare.com/d1/platform/limits/
  https://developers.cloudflare.com/d1/best-practices/read-replication/
- Cloudflare KV consistency:
  https://developers.cloudflare.com/kv/concepts/how-kv-works/
- C2PA specifications and provenance explainer:
  https://spec.c2pa.org/faq/
  https://c2pa.org/specifications/specifications/2.2/explainer/Explainer.html
- IPTC generative AI opt-out guidance:
  https://iptc.org/news/iptc-publishes-best-practice-guidance-on-generative-ai-opt-out-for-publishers/
- DDEX standards:
  https://kb.ddex.net/about-ddex-standards/ddex-standards/
- Google DeepMind SynthID limitations:
  https://deepmind.google/blog/watermarking-ai-generated-text-and-video-with-synthid/
- RFC 8032 EdDSA:
  https://www.rfc-editor.org/info/rfc8032/
- RFC 8037 EdDSA for JOSE:
  https://www.rfc-editor.org/info/rfc8037/
- RFC 8725 JWT Best Current Practices:
  https://www.rfc-editor.org/rfc/rfc8725.html
- NIST AI Risk Management Framework:
  https://www.nist.gov/itl/ai-risk-management-framework
- U.S. Copyright Office AI reports:
  https://www.copyright.gov/ai/
- Tennessee ELVIS Act:
  https://www.tn.gov/governor/news/2024/3/21/photos--gov--lee-signs-elvis-act-into-law.html.html
- California digital likeness performer protections:
  https://www.gov.ca.gov/2024/09/17/governor-newsom-signs-bills-to-protect-digital-likeness-of-performers/
- Apple unified Maps URLs:
  https://developer.apple.com/documentation/mapkit/unified-map-urls
- Waze Deep Links:
  https://developers.google.com/waze/deeplinks

