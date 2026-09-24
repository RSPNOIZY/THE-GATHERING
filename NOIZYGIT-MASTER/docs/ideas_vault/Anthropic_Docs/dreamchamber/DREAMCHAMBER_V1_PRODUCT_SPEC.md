# DreamChamber v1 Product Spec

**Date:** 2026-04-10  
**Target Platform:** M2 Ultra Mac Studio (local-first)  
**Mission:** Expand creative capability for creators with diverse physical abilities by pairing human intent with AI execution.

---

## 1) Feature Matrix by Persona

| Persona | Primary Goal | Accessibility Needs | Core v1 Features | Success Signal |
| --- | --- | --- | --- | --- |
| Film Creator | Rapid pre-production + shot planning | Voice-first navigation, low-precision input tolerance | Script-to-storyboard, shot list generator, scene mood references, continuity assistant | Storyboard + shot list generated in < 15 min |
| Music Producer | Fast composition and arrangement | Switch control, keyboard-only parity, captioned audio feedback | Stem ideation, arrangement assistant, lyric co-write, mix preset suggestions | Demo track created in one session |
| Writer / Narrative Designer | Build cohesive long-form stories | Dyslexia-friendly typography, reading mode, dictation | Outline-to-draft, tone consistency checker, branching narrative map | 2,000+ coherent words from outline in < 45 min |
| Visual Designer | Concept exploration and iteration | High-contrast mode, scalable UI density, one-hand workflows | Prompt boards, style-lock iterations, brand kit generator, export packs | 20+ usable concept variants per sprint |
| Accessibility-First Creator (cross-domain) | Execute ideas without motor/cognitive friction | Eye-gaze compatibility, adaptive timing, multimodal redundancy | Action palettes with voice aliases, macro recipes, guided creation flows | Task completion rate >= 95% without external assistance |
| Creative Director / Team Lead | Align outputs across collaborators | Role-based dashboard clarity, captioned review artifacts | Shared creative memory, review queues, provenance audit trail, approval workflows | Review cycle time reduced by >= 30% |

---

## 2) M2 Ultra Technical Architecture

### 2.1 System Overview

- **Local orchestration layer (Node.js + TypeScript):** workflow graph, queueing, permission checks.
- **Model runtime layer (Apple Silicon native):** MLX / Core ML / Metal-accelerated inference.
- **Multimodal services:** text, image, audio, and video helper services exposed behind one API gateway.
- **State and memory:**
  - Fast local cache: SQLite + vector index
  - Project state: append-only event log
  - Optional sync: Cloudflare D1/KV/R2 for collaboration + backup
- **Client surfaces:** desktop app + web control panel + assistive input adapters.

### 2.2 Data Flow (v1)

1. User intent captured (voice, text, switch, gaze).
2. Intent normalizer maps to structured task graph.
3. Orchestrator selects local model/tool path first.
4. Generation runs on-device (M2 Ultra) with fallback to edge/cloud only when policy allows.
5. Output stored with provenance metadata (prompt hash, model id, timestamp, source assets).
6. Review/approve/export pipeline emits creative artifact package.

### 2.3 M2 Ultra Optimization Targets

- Use **unified memory-aware batching** to avoid memory thrash under concurrent media tasks.
- Prioritize **low-latency assistive interactions** (< 300 ms perceived response for command feedback).
- Dedicate background workers for non-interactive jobs (render/transcode/training updates).
- Apply model quantization tiers:
  - Tier A: real-time assistive actions
  - Tier B: ideation quality
  - Tier C: offline high-fidelity renders

### 2.4 Reliability + Security

- Local-first secret handling with keychain integration.
- Consent/provenance hooks at every generation boundary.
- Signed audit records for edits, exports, and collaboration events.
- Graceful degradation when cloud sync unavailable.

---

## 3) Accessibility Acceptance Criteria (v1 Gate)

### 3.1 Input Accessibility

- Full keyboard navigation for all primary workflows.
- Voice command coverage for top 30 actions per persona.
- Switch-control compatibility for creation, review, and export flows.
- Eye-gaze interaction mode for core canvas commands.

### 3.2 UI/UX Accessibility

- WCAG 2.2 AA contrast baseline across UI themes.
- Resizable UI (100% to 200%) without loss of controls or clipping.
- Motion-reduced mode with no blocking animations.
- Readability presets: dyslexia-friendly and high-clarity typography.

### 3.3 Media Accessibility

- Auto-captions for generated audio/video previews.
- Transcript export for all voice interactions.
- Audio cues paired with visual alternatives (never audio-only state changes).

### 3.4 Verification Criteria

- >= 95% task completion rate across assistive cohorts.
- <= 2 critical accessibility defects per release candidate.
- 100% of severity-1 accessibility issues fixed before GA.

---

## 4) Pilot Plan

### 4.1 Cohort Design

- **Pilot size:** 24 creators
- **Cohorts:** film (6), music (6), writing (6), design (6)
- **Accessibility representation:** minimum 50% of cohort requiring assistive workflows

### 4.2 Timeline (8 Weeks)

- **Week 1:** onboarding, baseline productivity + accessibility benchmarks
- **Weeks 2–3:** guided workflow usage (persona-specific missions)
- **Weeks 4–5:** open creation sprints, instrumentation-heavy capture
- **Week 6:** workflow tuning + bug triage
- **Week 7:** regression + acceptance retest
- **Week 8:** final outcomes, launch recommendations

### 4.3 Pilot Exit Gates

- Core KPI thresholds met (see dashboard).
- No open severity-1 accessibility defects.
- At least 3 validated “real-world” publishable outputs per persona cohort.

---

## 5) KPI Dashboard (v1)

### 5.1 Product Velocity KPIs

| KPI | Definition | Target |
| --- | --- | --- |
| Time-to-first-artifact | Minutes from project open to first usable output | <= 10 min |
| Idea-to-export cycle | Minutes from prompt to export package | <= 30 min |
| Iteration throughput | Variants generated per 30 min session | >= 12 |

### 5.2 Accessibility KPIs

| KPI | Definition | Target |
| --- | --- | --- |
| Assistive completion rate | Completed tasks without external intervention | >= 95% |
| Input parity score | Command success parity across keyboard/voice/switch/gaze | >= 0.9 |
| Accessibility defect escape rate | Accessibility bugs found after RC | <= 5% |

### 5.3 Quality + Trust KPIs

| KPI | Definition | Target |
| --- | --- | --- |
| Creator satisfaction (CSAT) | Average post-session score | >= 4.5 / 5 |
| Output acceptance rate | Artifacts accepted without major rework | >= 70% |
| Provenance completeness | Outputs with full provenance metadata | 100% |
| Consent policy compliance | Policy checks passed before export | 100% |

### 5.4 Platform KPIs (M2 Ultra)

| KPI | Definition | Target |
| --- | --- | --- |
| Assistive response latency | Command acknowledgement latency | <= 300 ms perceived |
| Local inference ratio | % of generations done on-device | >= 80% |
| Crash-free sessions | Sessions without app/runtime crash | >= 99% |

---

## 6) Cloudflare Contact Standard (Updated)

For all Cloudflare operational references, use:

- `rsp@noizy.ai` (primary)
- `rsp@noizyfish.com` (alternate)

Deprecated for Cloudflare contact references in this repo: `rsplowman@icloud.com`.
