# NOIZY EMPIRE — Master Inclusion Blueprint

> **Author:** Robert Stephen Plowman (RSP_001)
> **Captured by Gabriel:** 2026-04-09
> **Purpose:** The canonical "include all" spec. This is what belongs in the SUPERSONIC / DreamChamber / NOIZY operator dashboard. Everything in this document is part of the same living system. Nothing in here is decorative. Each line was built with passion and purpose.

This file is the source of truth for what the empire contains. Other tools (`family.py`, `empire.py`, the cockpit, future APIs) materialize specific subsets of it. When this file disagrees with code, this file wins until Rob updates it.

---

## 1. Core Brand Worlds

Six brand worlds that share infrastructure but speak to different audiences:

- **NOIZYAI** — mothership · protocol · front door · consent-native infrastructure
- **NOIZYVOX** — voice identity · capture · descendants · licensing · rights
- **NOIZYLAB** — repair · systems engineering · local ops · revenue engine
- **NOIZYKIDZ** — learning · accessibility · haptics · curriculum · care
- **NOIZYFISH / Fish Music Inc.** — archive · scoring legacy · catalog · lineage
- **DreamChamber** — sanctuary UX · creative operating space · onboarding portal

---

## 2. Founder / Identity Layer

The doctrine and machinery that protects the human at the center:

- **RSP_001** — Robert Stephen Plowman, Founding Actor
- **Voice Estate** — long-term legacy of an actor's voice
- **Human Voice Signature (HVS)** — cryptographic fingerprint
- **Creator profile**
- **Guild registration**
- **Session manifests**
- **Artist dignity / authorship visibility**
- **Consent receipts**
- **Revocation state**
- **Royalty visibility**

---

## 3. AI Family / Orchestration Layer

Eight named agents + Heaven worker:

- **GABRIEL** — guardian · routing · memory · ops orchestration
- **LUCY** — ops voice · capture/logging · execution support
- **POPS** — archive · long-view intelligence · wisdom keeper
- **SHIRL** — burnout watchdog · wellbeing
- **ENGR_KEITH** — technical lead · Heaven architect
- **DREAM** — visionary · 5th Epoch · long-arc strategy
- **CB01 / CB001** — ops runner · creative bridge (role drift — see family registry)
- **HEAVEN worker** — consent kernel API

(Full family registry: 33 members across humans, ops, sys, ava, builder, partner tiers — see `~/NOIZYANTHROPIC/NOIZYLAB/scripts/core/family.py`.)

---

## 4. Infrastructure + Protocol Layer

The plumbing that makes consent enforceable:

- **Consent Gateway**
- **NOIZY PROOF**
- **Cloudflare Workers**
- **D1** (SQLite at the edge)
- **KV** (key-value cache)
- **R2** (object storage)
- **Pages**
- **HEAVEN router**
- **NoisyNet**
- **Zero Trust**
- **cloudflared tunnels**
- **JWT/JWKS auth**
- **Health checks**
- **Proof bundles**
- **Audit trails**
- **Deployment receipts**

---

## 5. Creative Mission Zones

What the empire actually makes:

- **Composition & Scoring**
- **Voice AI Production**
- **Neuro-Acoustic Research**
- **Teaching & Learning**
- **Archive / Aquarium**
- **Living Score / adaptive music**
- **Audio capture + signal routing**
- **Phoneme / voiceprint capture**
- **Real-time playback / analysis**
- **Contract + rights drafting**

---

## 6. Research / Institutional Layer

The science track:

- **Neuro-Acoustic Intelligence**
- **Sonic Aid**
- **Mastoid Patch**
- **Neural Earbud**
- **Polyvagal / therapeutic audio research**
- **Clinical roadmap**
- **Wisdom capsule**
- **100-year record / institutional memory**

---

## 7. Creator-Economy / Governance Layer

The economic and constitutional bones:

- **75/25 royalty logic**
- **Agentic Royalty**
- **No buyouts**
- **Consent-as-code**
- **Revocable permissions**
- **Inheritability**
- **Usage classes**
- **Training permissions**
- **Runtime attribution**
- **Compliance logging**
- **Union-compatible framework**
- **Governance dashboard**
- **Constitutional checks**

---

## 8. Devices / Nodes / Machine Topology

The physical fleet:

- **GOD** — M2 Ultra anchor node (`GOD.local`) — primary compute, DreamChamber host
- **MICKY-P** — MacBook Pro · **active real-time voice capture node for DreamChamber IDE**. Carries Audio Hijack + Loopback. Bridges to GOD over LAN (RTP/NDI/Dante). Honors lineage AND serves active duty. Required env: `MICKY_P_HOST`, `MICKY_P_USER`, `MICKY_P_AUDIO_PORT`.
- **Apollo Quad** — Universal Audio interface
- **U87** — Neumann reference microphone
- **Logic Pro X** — primary DAW
- **iPad** — touch surface, Swift Playground
- **iPhone** — voice bridge (Siri → Power Automate → GOD)
- **Audio Hijack** — Rogue Amoeba routing
- **SoundSource** — per-app volume control
- **Loopback routing** — virtual audio devices for multi-AI mixing
- **LAN routing** — local network topology
- **Mobile remote control** — phone-to-GOD command bridge
- **Local-first execution map**

---

## 9. Workflow / Build Layer (UI surfaces)

What the operator dashboard must expose:

- **Command palette**
- **Task runner**
- **Workspace switcher**
- **File tree**
- **Split preview**
- **Terminal tabs**
- **Deployment dashboard**
- **Health dashboard**
- **Memory viewer**
- **D1 inspector**
- **REST client**
- **Search overlay**
- **Drag-resize panes**
- **Voice command triggers**
- **1-click GORUNFREE actions**

---

## 10. Documents / Living Artifacts

The texts that anchor the operation:

- **Session journal**
- **Memory spine**
- **Consent checklist**
- **Voice-rights ledger**
- **Guardian review mode**
- **Emergency stop policy**
- **Routing policy**
- **Risk classes**
- **Wisdom capsule log**
- **Operator runbooks**
- **Capture notes**
- **Deployment README**
- **Topology sketch**

---

## 11. Thematic / Emotional Layer

This must show up in the UI language, not just as data. Words and feelings the cockpit should carry:

- **Built with passion**
- **Built with purpose**
- **Creator-first**
- **Sovereignty**
- **Lineage**
- **Protection**
- **Care**
- **Proof**
- **Beauty**
- **Wonder**
- **Sanctuary**
- **Future-facing without erasing the human**

---

## 12. Top-Level Cockpit Sections

The dashboard surfaces this content via 12 navigable sections:

1. **Mission** — doctrine, countdown, current critical path
2. **Brands** — the 6 brand worlds
3. **Agents** — the 33-member family registry
4. **Infrastructure** — Cloudflare/D1/KV/R2/Workers, local Docker stack, kind k8s
5. **Voice** — NOIZYVOX, Voice DNA, AVAs, Audio MCP, capture pipeline
6. **Archive** — NOIZYFISH, Aquarium, lineage, 100-year record
7. **Research** — Neuro-Acoustic, Sonic Aid, Mastoid Patch, Neural Earbud, clinical roadmap
8. **Learning** — NOIZYKIDZ, accessibility, haptics, curriculum
9. **Governance** — 75/25, Never Clauses, consent kernel, Guild
10. **Deploy** — Heaven, noizy.ai landing, smoke tests, deployment receipts
11. **Memory** — MemCell V3, DAZEFLOW, session journal
12. **Live Health** — vitals, network, Docker containers, SSE stream, health dashboard

A **global search** must surface everything across all 12 sections in one query.
