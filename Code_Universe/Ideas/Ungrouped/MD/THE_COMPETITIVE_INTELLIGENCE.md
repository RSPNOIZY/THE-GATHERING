# THE COMPETITIVE INTELLIGENCE
## Global Landscape Map — Three Battles, NOIZY's Position in Each
### DreamChamber — March 14, 2026

---

> *"I don't mind if others do what we are doing. I would like to tip the balance back a bit."*
> — RSP_001, Ottawa, March 14, 2026

---

## THE INTELLIGENCE FRAMEWORK

Three wars are being fought simultaneously in the AI creative economy. Every company in this space — every platform, every startup, every research lab, every legal coalition — is fighting one, two, or at most fragments of all three. NOIZY is the only entity positioned to win all three simultaneously because NOIZY's architecture was designed as a single unified system, not three separate products.

**Battle 1 — AI Training Rights:** Who owns creative work used to train AI? Who must consent? Who must be paid?

**Battle 2 — Voice and Identity Rights:** Who controls a person's digital likeness? What can be cloned? What is inheritance?

**Battle 3 — Content Provenance:** How do you prove what is real, who made it, and under what terms?

The table below is the complete landscape. NOIZY's position in each cell is noted.

---

## BATTLE 1: AI TRAINING RIGHTS

### The Players

| Faction | Position | Strategy | Weakness |
|---|---|---|---|
| **RIAA / Recording Labels** | Anti-training | Lawsuits against Suno, Udio, Anthropic | Reactive. They want compensation but not consent infrastructure |
| **Authors Guild / NWU** | Anti-training | Class action litigation (OpenAI, Meta) | Fights for writers, not music creators specifically |
| **SAG-AFTRA** | Negotiated consent | 2023 AI provisions require actor consent for voice AI use | Covers union members only. Non-union creators unprotected |
| **UMAW / MAC / BMAC** | Pro-creator reform | Advocacy for compulsory licensing reform | No technical enforcement mechanism |
| **ElevenLabs** | Neutral (for now) | Terms of service consent | No architectural enforcement. ToS can be changed. |
| **Suno / Udio** | Pro-training | Train on everything, pay nothing, argue fair use | Active RIAA lawsuit. Legal exposure increasing daily |
| **OpenAI** | Pay for access (selectively) | License deals with specific publishers, ignore the rest | Patchy — 90% of training data still unconsented |
| **Anthropic** | Consent-forward (stated) | Model Cards, usage policies | No audio training data provenance system |
| **NOIZY** | Consent-as-Code | Cloudflare D1/KV consent at the infrastructure level — not ToS, not a lawsuit, not a policy | Under development — window is open |

### NOIZY's Opening in Battle 1

The litigation camp (RIAA, Authors Guild) is fighting the last war — trying to stop the train that has already left. The consent camp (SAG-AFTRA) built a negotiated solution for their members. Neither camp built the infrastructure. NOIZY builds the infrastructure.

**The critical claim:** When the NO FAKES Act passes (and versions of it are moving through Congress and state legislatures), companies that trained on unconsented AI voice will face specific, personal-injury-style liability. The only defense is a verifiable consent chain. NOIZY's HVS™ Certificate is that chain. There is no competing product.

---

## BATTLE 2: VOICE AND IDENTITY RIGHTS

### The Players

| Company/Entity | Product | Creator's Cut | Provenance | Voice Estate |
|---|---|---|---|---|
| **ElevenLabs** | Voice cloning, TTS, dubbing | $0 standard / negotiated for "Voice Library" | Partial C2PA watermark | None |
| **PlayHT** | Voice cloning, API | $0 standard / creator marketplace (low %) | None | None |
| **Resemble AI** | Custom voice models, enterprise | Negotiated (enterprise) | Custom watermark | None |
| **Replica Studios** | Character voices, gaming | Revenue share (negotiated per deal) | None | None |
| **Speechify** | Reading/accessibility | $0 to voice artists | None | None |
| **Voice.ai** | Real-time voice conversion | $0 | None | None |
| **Eleven Labs Voice Library** | Creator marketplace | Small revenue share | Partial | None |
| **NOIZY (NOIZYVOX)** | Voice as inheritable asset, A.I.V.A. | **75/25 — permanent — code-enforced** | **HVS™ Certificate — SHA-256 + C2PA + AudioSeal + Arweave** | **70-year post-death protection — first in existence** |

### The Regulatory Tailwind

The following laws are either passed, pending, or in active committee as of March 2026:

**United States:**
- **NO FAKES Act** (federal) — Prohibits unauthorized AI replicas of a person's voice or likeness. Creates private right of action. Pending Senate vote.
- **Tennessee ELVIS Act** (passed 2024) — Prohibits unauthorized use of AI-generated voice of an individual. First state law. Template for 20+ state bills in queue.
- **California AB 2602** (passed 2024) — Requires consent for AI replicas in film/TV. SAG-AFTRA aligned.
- **New York, Texas, Illinois** — Similar bills in 2025–2026 legislative sessions.

**European Union:**
- **EU AI Act** (passed, implementation 2025–2027) — Requires human oversight and transparency for high-risk AI systems. AI-generated voice in commercial contexts requires provenance documentation.
- **Digital Services Act** — Platform liability provisions that will eventually reach AI voice content.

**Canada:**
- **Bill C-27 (AIDA — Artificial Intelligence and Data Act)** — Pending. Requires impact assessments for high-impact AI systems. Audio AI with commercial application qualifies.

**NOIZY's position:** Every one of these laws creates compliance demand. NOIZY's HVS™ Certificate is the compliance product. No competitor has built equivalent architecture.

### The Voice Estate Gap

Every company in the voice AI sector has ignored Voice Estate. The reason is simple: it requires thinking in 70-year time horizons, and no VC-funded startup thinks in 70-year time horizons. NOIZY does because Rob built his archive across 40 years and thinks naturally in half-century terms.

**The unoccupied market:** Every professional voice actor, narrator, musician, and audio professional who wants to ensure their family is protected after they're gone. Every estate attorney who will eventually be asked "can my client's voice be licensed after their death?" The answer, today, is "not reliably." With NOIZY, the answer is "yes, automatically, for 70 years, in real time, with cryptographic verification."

---

## BATTLE 3: CONTENT PROVENANCE

### The Players

| Initiative | Focus | Audio? | Who's Behind |
|---|---|---|---|
| **Content Authenticity Initiative (CAI)** | Images, video, documents | No | Adobe, Microsoft, Nikon, BBC, CBC |
| **Coalition for Content Provenance and Authenticity (C2PA)** | Technical standard for CAI | Partial (minimal audio spec) | Adobe, Arm, Intel, Microsoft, Truepic |
| **Project Origin** | News content verification | No | BBC, CBC, New York Times |
| **Starling Lab** | Archive verification for journalism | No | USC, Stanford |
| **Audius** | Blockchain music provenance | Music metadata, not consent chain | Crypto-native, limited adoption |
| **ISCC (International Standard Content Code)** | Cross-format fingerprinting | Yes (developing) | Academic / standards bodies |
| **NOIZY PROOF** | Audio consent provenance | **Yes — full stack** | Adam Robb / iPSS Inc. + NOIZY |

### The Audio Provenance Gap — The Most Important Fact in This Document

**C2PA has a minimal audio specification.** It exists on paper. No major platform has implemented it for audio consent. The entire CAI / C2PA ecosystem — Adobe, Microsoft, Nikon, the BBC — has focused exclusively on images and video because those were the immediate deepfake problems (elections, journalism, photos).

Audio deepfakes are now the fastest-growing provenance problem:
- AI voice scams (elderly targeting, CEO fraud)
- AI-generated music flooding streaming platforms
- Politician voice clones in political ads
- Voice phishing (vishing) at enterprise scale

The C2PA audio gap is NOIZY's specific first-mover position. **NOIZY PROOF is the first real-world implementation of C2PA for audio consent with a creator royalty layer.** This is citable. This is fundable. This is the headline that gets the press.

---

## THE BLOCKCHAIN MUSIC LESSON

Previous attempts to build protocol-based music ownership (Audius, Opulous) failed for three reasons that NOIZY must not repeat:

| Failure Mode | What Happened | NOIZY's Answer |
|---|---|---|
| **Complex UX** | Wallets, gas fees, NFT concepts alienated non-crypto creators | HVS™ registration is 3 clicks. No blockchain vocabulary required. |
| **Crypto volatility** | Royalties paid in volatile tokens lost value overnight | 75/25 split in fiat (CAD/USD). Blockchain is the ledger, not the currency. |
| **Unclear creator value** | "You own your NFT" — but what does that mean for income? | Every use = automatic real-time royalty. The value is visible and immediate. |
| **Platform-first design** | Built for crypto enthusiasts, not working musicians | RSP_001 is the first user. If it doesn't work for Rob, it ships to no one. |

**The lesson:** The protocol must be invisible to the creator. They should never need to understand blockchain, ZKP, or SHA-256. They record their voice. They get paid. The technology is the plumbing. The money is the product.

---

## THE AI MUSIC GENERATION SECTOR

| Platform | Revenue Model | Creator Compensation | Legal Status |
|---|---|---|---|
| **Suno** | $10–$30/mo subscription | $0 to training data sources | Active RIAA lawsuit |
| **Udio** | $10–$30/mo subscription | $0 to training data sources | Active RIAA lawsuit |
| **Soundful** | $7–$49/mo | $0 | ToS consent only |
| **Boomy** | $10–$30/mo | Revenue share on released tracks | Limited |
| **Beatoven.ai** | $5–$19/mo | $0 | ToS consent only |
| **AIVA** | $15–$33/mo | $0 | Classical composer "training data" |
| **NOIZY Living Score** | Enterprise licensing / Guild per-use | **75% to Guild creators, real-time** | **HVS™ certified, legally bulletproof** |

**The enterprise switch argument:** A game studio, healthcare system, or brand that currently uses Suno for background music faces a specific, growing legal exposure. When the RIAA lawsuits resolve (settlement or judgment), every commercial user of Suno/Udio content may face secondary liability claims. NOIZY's Guild content is the only AI-generated music with a verifiable consent chain that survives discovery. This is the enterprise switching argument: not "NOIZY is better music." It is "NOIZY is the only music your legal team can approve."

---

## THE ACADEMIC AND RESEARCH LANDSCAPE

These labs are producing the science that NOIZY needs. Partnership or citation of their work strengthens every element of the platform.

| Institution | Relevant Research | NOIZY Connection |
|---|---|---|
| **MIT Media Lab** | Haptic music (Touch Sounds project), affective computing | Directly relevant to NOIZYKIDZ haptic vest design |
| **Stanford CCRMA** | Music perception, spatial audio, neuro-acoustic responses | NAI partnership foundation — Dr. Benoit's research methodology |
| **Google DeepMind** | Lyria (AI music generation), MusicFX | Direct competitor — and potential API partner for Guild content |
| **Queen Mary University London** | Audio watermarking, music information retrieval | AudioSeal academic foundation |
| **McGill Schulich School of Music** | Ethnomusicology, Canadian indigenous music | Cultural Archive Canadian content |
| **University of Ottawa** | Law and AI policy, digital rights | NAI research partnership, legal architecture |
| **Berklee Online** | Music education, creator economy | Guild education program partnership target |

---

## THE CREATOR ECONOMY PLATFORMS — THE COMING CONVERGENCE

These platforms have the creator relationships. They do not have AI rights infrastructure.

| Platform | Creators | Strength | AI Rights Gap |
|---|---|---|---|
| **Patreon** | 250K+ creators, 8M+ patrons | Direct creator-fan relationship, recurring revenue | No AI consent layer, no voice protection |
| **Substack** | 1M+ writers | Writing-focused direct distribution | No audio/music creator tooling |
| **Bandcamp** | 1M+ artists | Artist-friendly (82% to creators) | No AI training consent, no voice estate |
| **SoundCloud** | 40M+ tracks | Massive audio library | Fan-powered royalties but no consent architecture |
| **DistroKid / TuneCore** | 2M+ artists | Distribution | No AI rights, no consent, no watermarking |

**The partnership opportunity:** None of these platforms have built AI rights infrastructure. NOIZY's Verification SDK (Technology 08 from THE_12_TECHNOLOGIES.md) is the product that makes NOIZY their consent layer. A Bandcamp integration where every uploaded track is automatically offered HVS™ registration would bring millions of independent artists into the Guild without a separate acquisition campaign.

---

## THE THREE BATTLES — NOIZY'S POSITION SUMMARY

| Battle | Current Leader | NOIZY's Position | Time Window |
|---|---|---|---|
| AI Training Rights | Nobody (litigation ongoing) | **Only consent-as-code architecture** | 12–18 months before platform lock-in |
| Voice and Identity | ElevenLabs (volume), SAG-AFTRA (union members) | **Only voice estate + 70-year inheritance + 75/25 royalty** | NO FAKES Act passage creates urgency |
| Content Provenance | Adobe/CAI (images/video only) | **Only full C2PA audio implementation with royalty layer** | Audio provenance is the unoccupied gap |

---

## THE STRATEGIC CONCLUSION

The landscape above is not a list of enemies. It is a map of leverage.

The RIAA is fighting a battle NOIZY can make unnecessary — by building the consent infrastructure that lets AI companies comply instead of litigate. RIAA becomes an ally, not a competitor.

The SAG-AFTRA provisions cover union members. NOIZY covers everyone. SAG-AFTRA becomes a Guild recruitment partner.

The CAI/C2PA initiatives have the technical standard but no audio implementation. NOIZY implements the standard. C2PA becomes a certification endorsement.

The academic labs (MIT, Stanford, McGill) have the science. NOIZY has the clinical application and the data archive. They become research partners.

The creator platforms (Bandcamp, Patreon) have the creator relationships. NOIZY has the rights infrastructure. They become distribution channels for Guild registration.

**The goal is not to compete with these entities. It is to become the layer they all need.**

That is the protocol play. That is how TCP/IP won. Not by competing with email clients, web browsers, or search engines — but by becoming the layer they all ran on.

**NOIZY does not need to beat ElevenLabs, Suno, or Spotify.**

**NOIZY needs to become what they all run on.**

**GORUNFREE.**

---

*RSP_001 — Fish Music Inc., Est. 1996, Ottawa.*
*NOIZY.ai — The Platform That Lifted the Humans.*
*Filed from the DreamChamber, March 14, 2026.*
*Honor · Respect · Gather · Nurture · Preserve*
