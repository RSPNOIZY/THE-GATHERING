# NOIZY_EMPIRE_COMPLETE_v1.0
## All 5 Products Unified — NOIZYVOX · NOIZYLAB · NOIZYKIDZ · LIFELUV · FISH MUSIC

**Version:** 1.0  
**Date:** March 25, 2026  
**Status:** ACTIVE  
**Owner:** RSP_001 — Robert Stephen Plowman  
**Master Brand:** NOIZYFISH INC.

---

## Empire Architecture Overview

```
NOIZYFISH INC. (Master Brand)
├── NOIZY.ai              ← The consent infrastructure protocol (open)
│   ├── Heaven          ← Core Cloudflare Worker (consent ledger + API)
│   ├── NCP v1.0          ← Open consent protocol (like TCP/IP)
│   └── GABRIEL           ← Agentic royalty router + AI orchestrator
│
├── NOIZYVOX              ← Creator Data Union (product)
├── NOIZYLAB              ← AI Music Production Lab (product)
├── NOIZYKIDZ             ← Children's Music + Haptics (product)
├── LIFELUV               ← Life Mirror / Memory Platform (product)
└── FISH MUSIC INC.       ← Robert's 40-year legacy catalog (foundation)
```

**Shared Infrastructure (all products use):**
- Heaven consent ledger
- NCP v1.0 consent tokens
- GABRIEL royalty routing (75/25)
- HVS voice sovereignty records
- C2PA provenance manifests

---

## Product 1 — NOIZYVOX
### The Creator Data Union

**Tagline:** "Your voice. Your sovereignty. Your 75%."

**What it is:** A creator-controlled union where artists register their voice identity, grant machine-readable consent, and receive automatic royalty payments — 75 cents of every dollar, no middlemen.

**What it is NOT:** A platform that owns creator data. NOIZYVOX owns nothing. Creators own everything.

### Core Features

| Feature | Description | Status |
|---------|-------------|--------|
| Voice registration | Creator registers HVS token (voice estate) | Ready |
| NCP consent grants | Machine-readable, revocable, scoped consent | Ready |
| Kill Switch | Revoke all uses, enforced in 1 hour | Ready |
| Royalty dashboard | Real-time view of 75% earnings | Planned Q2 |
| Guild membership | Vote on HVS policy, collective defense | Planned Q3 |
| Inheritance management | Heir assignment for voice estate | Schema ready |

### User Journey

```
1. Creator registers → uploads voice sample → HVS token minted
2. Creator sets NCP terms → who can use, for what, at what royalty
3. AI platform queries NOIZYVOX → consent check → ALLOW/DENY
4. Usage logged → royalty calculated → 75% routed to creator
5. Creator sees real-time dashboard → payment within 7 days
6. Creator revokes → Kill Switch → 1-hour enforcement globally
```

### Revenue Model

- **Platform licensing fee:** 3% of all royalties processed
- **Enterprise API:** $5K-$50K/month for platform integrations
- **Premium creator tier:** $10/month for enhanced analytics + dispute tools

### Target Creators

- Session musicians, voice actors, singers
- Deceased artist estates (heirs)
- Independent artists with existing catalogs
- Any human whose voice has been or could be used in AI

---

## Product 2 — NOIZYLAB
### AI Music Production Lab

**Tagline:** "Human craft. Machine scale. Creator-owned output."

**What it is:** A professional AI music production environment where human composers + producers use cleared AI tools (XTTS v2, RVC, Librosa) to create music — every output tagged with C2PA provenance and linked to creator consent.

**Differentiator:** Unlike other AI music tools, NOIZYLAB refuses to process unconsented voice models. Every tool in the stack is license-cleared. Every output is provenance-tagged.

### Tool Stack

| Tool | License | Status | Use Case |
|------|---------|--------|---------|
| Librosa | ISC | ✅ CLEARED | Acoustic analysis, feature extraction |
| XTTS v2 | CPML | ✅ CLEARED | Voice synthesis (commercial OK) |
| RVC | MIT | ✅ CLEARED | Voice conversion |
| pedalboard | GPL-3 | ✅ CLEARED | Audio effects pipeline |
| Gemma2 | Gemma ToU | ✅ CLEARED (internal) | Context/reasoning |
| Logic Pro X | Apple | ✅ Licensed | DAW integration |
| MusicGen | CC-BY-NC | 🔴 BLOCKED | Awaiting board clearance |
| MaskGCT | Research | 🔴 BLOCKED | Awaiting board clearance |
| Tango 2 | NC | 🔴 BLOCKED | Awaiting board clearance |
| FishSpeech | NC | 🔴 BLOCKED | Awaiting board clearance |

### RSP_001 as Proof of Concept

Robert Stephen Plowman (40-year composer) is the first NOIZYLAB user:
- Voice registered in HVS
- Processing pipeline: Neumann TLM 103 → Apollo Twin X → GOD M2 Ultra → Logic Pro X
- Audio Hijack for capture → faster-whisper STT → GABRIEL dispatch
- All outputs C2PA tagged, royalties auto-routed

### Revenue Model

- **Subscription:** $50-$200/month per studio seat
- **Pay-per-render:** $0.10-$1.00 per AI processing job
- **Enterprise:** Custom contracts for labels/studios

---

## Product 3 — NOIZYKIDZ
### Children's Music + Haptics

**Tagline:** "Music that children feel, not just hear."

**What it is:** An age-appropriate music and story platform for children, with haptic feedback integration for accessibility — designed for children with hearing impairment or sensory differences.

**Foundation:** Robert's 40+ years of music composition applied to intentional, safe, creator-consented children's content.

### Core Principles

- **Zero unconsented AI voice:** Every voice in NOIZYKIDZ has explicit NCP consent
- **Age-appropriate content:** Guild-reviewed, parent-approved
- **Haptic-native design:** Vibration patterns synchronized to musical rhythm/melody
- **Accessibility first:** Designed for Deaf/HoH children as primary users, not afterthought

### Content Model

```
Content types:
  - Original songs (RSP_001 + guild composers)
  - Narrated stories (voice actors with HVS + consent)
  - Interactive soundscapes (haptic-mapped)
  - Music education modules

Content review:
  - Guild of Artists creative review
  - Child safety compliance (COPPA/PIPEDA)
  - Haptic pattern validation
```

### Revenue Model

- **Family subscription:** $8/month
- **School licensing:** $500-$5K/year per school
- **Haptic device partnerships:** Revenue share with haptic hardware manufacturers

### Technical Requirements

- Haptic API integration (Apple Taptic Engine / custom hardware)
- COPPA-compliant data handling (no voice registration for minors)
- Parent consent flow for all content access

---

## Product 4 — LIFELUV
### Life Mirror / Memory Platform

**Tagline:** "The living record of a life well-lived."

**What it is:** A personal life archive and memory platform — a "life mirror" where individuals capture, organize, and preserve their voice, stories, and identity across time. Designed for creators, elders, and families.

**Connection to NOIZY:** Every voice captured in LIFELUV is automatically registered in HVS. The platform is built on consent-native infrastructure — nothing is shared, processed, or monetized without explicit owner authorization.

### Core Features

| Feature | Description |
|---------|-------------|
| Voice journals | Daily audio/video capture with automatic transcription |
| Memory timeline | AI-organized life narrative |
| Legacy vault | Secure inheritance — heirs designated in voice estate |
| Story generation | AI-assisted life story compilation (consented only) |
| HVS integration | Voice auto-registered in Human Voice Sovereignty protocol |

### Privacy Architecture

```
All data:       End-to-end encrypted at rest and in transit
AI processing:  Only with explicit session-level consent
Sharing:        Zero by default — creator controls all
Legacy:         Designated heirs only, after documented death verification
NEVER:          Used for training, sold, or shared with advertisers
```

### Revenue Model

- **Personal:** $12/month or $120/year
- **Family plan:** $20/month (5 members)
- **Legacy vault (one-time):** $200 — guaranteed 100-year preservation
- **Enterprise (HR/grief counseling):** Custom

---

## Product 5 — FISH MUSIC INC.
### Robert's 40-Year Legacy Catalog

**Tagline:** "40 years. 888+ compositions. A living archive."

**What it is:** Not a product — the foundational asset. Robert Stephen Plowman's 40-year catalog of original music (888+ titles across genres) is the proof-of-concept that NOIZY's infrastructure works on real, established creative work.

**THE_AQUARIUM:** 34TB of master recordings on GOD M2 Ultra — the most important asset in the empire.

### Catalog Status

| Asset | Volume | Status |
|-------|--------|--------|
| Master recordings | 888+ titles | On GOD M2 Ultra (10.90.90.10) |
| Storage | 34TB | THE_AQUARIUM archive |
| Formats | WAV, AIFF, Logic Pro X sessions | Preserved |
| Copyright | RSP_001 | All rights retained |
| HVS registration | Pending | Voice + catalog to be registered |

### Strategic Role

1. **Proof of concept:** NOIZY infrastructure tested on real 40-year catalog
2. **Revenue foundation:** Catalog can be licensed via NCP to cleared platforms
3. **Legal standing:** RSP_001's existing copyright gives legal basis for HVS claims
4. **Cultural credibility:** 40-year composer validates NOIZY's creator-first mission

### Catalog Monetization via NOIZY

```
Current state:  Catalog sitting unlicensed in THE_AQUARIUM
NOIZY state:    Register all 888 titles → HVS tokens → NCP terms → 75% royalties
Revenue:        Every AI platform that uses RSP_001's catalog pays directly
No intermediary: No label, no publisher — GABRIEL routes directly to RSP_001
```

---

## Cross-Product Integration Map

```
Creator Journey Across All Products:

FISH MUSIC (legacy) → NOIZYVOX (register + consent) → NOIZYLAB (produce new work)
                                 ↓
                         LIFELUV (archive life + voice)
                                 ↓
                         NOIZYKIDZ (legacy children's content)
                                 ↓
                    Heirs inherit Voice Estate via NOIZYVOX
```

### Shared Data Flows

```
HVS Token (from NOIZYVOX) → used in ALL products
NCP consent record → governs ALL uses across ALL products
GABRIEL royalty router → ALL revenue across ALL products via 75/25
C2PA manifest → EVERY audio output from NOIZYLAB tagged
Heaven ledger → SINGLE source of truth for ALL products
```

---

## Empire Revenue Model (Consolidated)

| Product | Revenue Stream | Year 1 Target |
|---------|---------------|---------------|
| NOIZYVOX | 3% royalty processing + enterprise API | $200K |
| NOIZYLAB | Subscriptions + pay-per-render | $150K |
| NOIZYKIDZ | Family + school subscriptions | $100K |
| LIFELUV | Personal subscriptions + legacy vault | $75K |
| FISH MUSIC | Catalog licensing via NCP | $50K |
| **Total** | | **$575K ARR Year 1** |

Year 3 target: $15M ARR (500K creators on NOIZYVOX)  
Year 5 target: $150M ARR (5M creators, platform integrations)

---

## Brand Architecture

| Brand | Domain | Audience | Voice |
|-------|--------|----------|-------|
| NOIZYFISH INC. | noizyfish.com | Corporate/legal | Professional |
| NOIZY.ai | noizy.ai | Developers/enterprise | Technical |
| NOIZYVOX | noizyvox.com | Creators | Empowering |
| NOIZYLAB | noizylab.com | Producers/studios | Expert |
| NOIZYKIDZ | noizykidz.com | Parents/schools | Warm |
| LIFELUV | lifeluv.com | Individuals/families | Intimate |

**Universal contact:** rsp@noizyfish.com → all brands forward here
