# GORUNFREE UX Specification

## Core Principle

> Creators move faster, with higher confidence, and with less cognitive overhead—because NOIZY absorbs the risk, legality, and history for them.

This is systems design, not marketing.

---

## The Three Primitives

### 1. Pre-Flight Insight Panel

**Purpose:** Compress creator thought-to-output latency by surfacing context BEFORE generation.

**Shows:**
- What exists (relevant to intent)
- What's missing (explicit gap detection)
- Why it's missing (consent, rarity, never recorded)
- Consent state (can you use this?)

**UX Pattern:**
```
┌─────────────────────────────────────────────────────────────┐
│  PRE-FLIGHT INSIGHT                              [Generate] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  YOUR INTENT: "90s R&B female vocal, Faith Hill style"      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ✅ WHAT EXISTS                                      │    │
│  │                                                     │    │
│  │ • 847 consented vocal samples in range              │    │
│  │ • 12 Faith Hill-adjacent voice profiles             │    │
│  │ • 3 explicit "90s R&B female" style models          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ⚠️  WHAT'S MISSING                                  │    │
│  │                                                     │    │
│  │ • Faith Hill herself (no consent on file)           │    │
│  │ • Breathy upper-register samples (gap in archive)   │    │
│  │ • Live room reverb character (studio only)          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 💡 RECOMMENDATIONS                                  │    │
│  │                                                     │    │
│  │ • Use "Alicia Keys style" (consented, similar range)│    │
│  │ • Archive rescue: unreleased 1997 Elektra sessions  │    │
│  │ • Commission opportunity: breathy vocal capture     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  CONSENT STATUS: ✅ All paths lead to consented sources     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Key Behavior:**
- Appears BEFORE generation, not after
- Shows alternatives, not just blockers
- Quantifies what's available
- Suggests archive rescue over generation when appropriate

---

### 2. Provenance Trail

**Purpose:** Make provenance useful, not just compliant. Turn "where did this come from?" into creative power.

**Shows:**
- Why this result worked
- What you DIDN'T copy (differentiating)
- Consent chain (who said yes, when, how)
- Exportable proof bundle

**UX Pattern:**
```
┌─────────────────────────────────────────────────────────────┐
│  PROVENANCE TRAIL                               [Export ↓]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  RESULT: "Summer Nights" vocal track                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ✨ WHY THIS WORKED                                  │    │
│  │                                                     │    │
│  │ Voice DNA: Maria Santos (Actor #A-2847)             │    │
│  │ Style influence: 90s R&B harmonic patterns          │    │
│  │ Technique: Consented vocal synthesis v3.2           │    │
│  │                                                     │    │
│  │ Maria's consent: Explicit, commercial, perpetual    │    │
│  │ Royalty: 75% to Maria on all derivative works       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 🚫 WHAT YOU DIDN'T COPY                             │    │
│  │                                                     │    │
│  │ • NOT Faith Hill's voice (no consent)               │    │
│  │ • NOT any uncredited sample                         │    │
│  │ • NOT trained on scraped data                       │    │
│  │ • NOT derivative of unlicensed recordings           │    │
│  │                                                     │    │
│  │ This is original work with consented DNA.           │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 📋 CONSENT CHAIN                                    │    │
│  │                                                     │    │
│  │ Maria Santos                                        │    │
│  │ └─ Consent token: CT-2847-A (verified)              │    │
│  │    └─ Issued: 2025-11-14                            │    │
│  │    └─ Scope: Commercial synthesis, all territories  │    │
│  │    └─ Royalty: 75/25 (artist/platform)              │    │
│  │    └─ Revocable: Yes (Kill Switch active)           │    │
│  │                                                     │    │
│  │ [View full consent document]                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  [Export Proof Bundle]  [Share with Collaborator]           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Export formats:**
- PDF (for labels, lawyers)
- JSON (for systems integration)
- C2PA manifest (for content credentials)
- Human-readable summary (for collaborators)

---

### 3. Absence Intelligence Panel

**Purpose:** Detect what DOESN'T exist yet. Surface gaps as opportunities, not failures.

**Shows:**
- Cultural gaps (underserved sonic spaces)
- Archive rescue candidates
- Commission opportunities
- Over-representation warnings

**UX Pattern:**
```
┌─────────────────────────────────────────────────────────────┐
│  ABSENCE INTELLIGENCE                          [Explore →]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  DETECTED GAPS IN YOUR CREATIVE SPACE                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 🔍 THIS SOUND DOESN'T EXIST YET                     │    │
│  │                                                     │    │
│  │ "Breathy alto + trap hi-hats + gospel harmony"      │    │
│  │                                                     │    │
│  │ Similar attempts: 3 (all abandoned/incomplete)      │    │
│  │ Closest match: 67% similarity (missing alto)        │    │
│  │ Archive candidates: 0                               │    │
│  │                                                     │    │
│  │ RECOMMENDATION: This is pioneer territory.          │    │
│  │ Consider commissioning original vocal capture.      │    │
│  │                                                     │    │
│  │ [Commission Workflow →]                             │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 📼 ARCHIVE RESURRECTION CANDIDATES                  │    │
│  │                                                     │    │
│  │ We found unreleased material that matches your gap: │    │
│  │                                                     │    │
│  │ • 1997 Elektra Sessions (uncredited alto, 89% match)│    │
│  │   Status: Consent available, rights cleared         │    │
│  │   [Resurrect →]                                     │    │
│  │                                                     │    │
│  │ • 2003 Gospel choir outtakes (harmony, 76% match)   │    │
│  │   Status: Consent pending, contact available        │    │
│  │   [Request Access →]                                │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ⚖️  REPRESENTATION BALANCE                          │    │
│  │                                                     │    │
│  │ Your recent work leans heavily on:                  │    │
│  │ • Male vocals (78%)                                 │    │
│  │ • Western pop structures (91%)                      │    │
│  │ • 2010-2020 production styles (84%)                 │    │
│  │                                                     │    │
│  │ Consider exploring:                                 │    │
│  │ • Underrepresented: West African vocal techniques   │    │
│  │ • Underrepresented: Pre-1980 analog character       │    │
│  │ • Underrepresented: Non-binary voice profiles       │    │
│  │                                                     │    │
│  │ [Discover underrepresented voices →]                │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Key Behavior:**
- Proactive, not reactive
- Suggests archive rescue BEFORE generation
- Surfaces cultural responsibility without lecturing
- Creates commission pathways (GORUNFREE revenue)

---

## Integration Points

### With METABEAST

```
Creator Intent
     ↓
METABEAST Analysis
     ↓
┌────────────────┬────────────────┬────────────────┐
│ What Exists    │ What's Missing │ Why Missing    │
│ (positive)     │ (negative)     │ (reason)       │
└────────────────┴────────────────┴────────────────┘
     ↓                  ↓                ↓
Pre-Flight Panel   Absence Intel    Recommendations
```

### With EdgeGovernor

Before any generation that touches gaps or archive resurrection:
1. Check consent state via EdgeGovernor
2. Issue time-bounded token for archive access
3. Log provenance chain for audit

### With Webhook Notifications

New event types:
- `gap_detected` — New absence identified
- `archive_resurrected` — Historical material activated
- `commission_requested` — Creator initiated commission workflow
- `representation_alert` — Significant imbalance detected

---

## API Endpoints (Heaven)

```
GET  /preflight/:intent          → Pre-flight insight for intent
GET  /provenance/:result_id      → Full provenance trail
GET  /absence/gaps               → Current detected gaps
GET  /absence/archive            → Resurrection candidates
POST /absence/commission         → Initiate commission workflow
GET  /absence/representation     → Balance analysis
```

---

## Success Metrics

| Metric | Target | Why |
|--------|--------|-----|
| Time to first insight | <2s | Creators shouldn't wait to think |
| Pre-flight usage rate | >80% | If they skip it, it's not useful |
| Archive resurrection rate | >5% | Rescue over generation |
| Commission conversion | >1% | Gaps become opportunities |
| "What you didn't copy" shares | >10% | Provenance as differentiator |

---

## What This Changes

| Before GORUNFREE | After GORUNFREE |
|------------------|-----------------|
| Generate → hope it's legal | Know before you start |
| Provenance = compliance burden | Provenance = creative power |
| Gaps = failures | Gaps = opportunities |
| AI generator | Trusted creative system |
| Content mill | Culture-shaping instrument |

---

*GORUNFREE: Creators run free because the system carries the weight.*
