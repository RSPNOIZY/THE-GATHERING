# NOIZY.AI — The Mothership

> **AI-powered music production platform. Built for creators who think in sound.**

[![Status](https://img.shields.io/badge/Status-Building-orange?style=flat)](https://noizy.ai)
[![Part of](https://img.shields.io/badge/MC96_Ecosystem-NOIZYFISH-000?style=flat)](https://noizyfish.com)
[![Stack](https://img.shields.io/badge/Stack-TypeScript_%7C_Python_%7C_Cloudflare-000?style=flat)](https://cloudflare.com)
[![License](https://img.shields.io/badge/License-MIT-000?style=flat)](./LICENSE)

---

## What is NOIZY.AI?

NOIZY.AI is the central platform of the MC96 Ecosystem — an AI-powered music production environment that gives every creator, from bedroom producers to seasoned engineers, access to tools previously reserved for major labels.

### Core Pillars

| Pillar | Description |
|--------|-------------|
| **AI Production** | Stem separation, beat generation, arrangement assistance |
| **Voice Intelligence** | Consent-native voice cloning, TTS, STT via A.I.V.A. (NOIZYVOX) |
| **Creator Economics** | 75/25 splits. Always. No exceptions. |
| **Accessibility** | Haptic-ready, deaf-first design standards inherited from NOIZYKIDZ |
| **Sovereignty** | Human Voice Sovereignty built-in — creators own their voice IP |

---

## Architecture

```
noizy.ai
├── apps/
│   ├── web/                    # Next.js frontend (Cloudflare Pages)
│   ├── api/                    # Cloudflare Workers API layer
│   └── studio/                 # DreamChamber UI (command interface)
├── packages/
│   ├── voice-engine/           # NOIZYVOX core (XTTS v2, Chatterbox, RVC)
│   ├── stem-engine/            # Stem separation (Spleeter / Demucs)
│   ├── consent/                # CB01 consent module
│   ├── economics/              # Revenue split calculator
│   └── ui/                     # Shared component library
├── workers/
│   └── api-gateway/            # Edge routing via Cloudflare Workers
└── infra/
    └── d1/                     # Cloudflare D1 database schemas
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript |
| Edge API | Cloudflare Workers |
| Database | Cloudflare D1 (SQLite at the edge) |
| Storage | Cloudflare R2 |
| AI Models | XTTS v2, Chatterbox, RVC, Spleeter (all Apache 2.0 / MIT) |
| Orchestration | n8n (GABRIEL node), CrewAI (DREAMCHAMBER) |
| Auth | Cloudflare Access |

---

## The 6 Brands Under NOIZY.AI

| Brand | Role |
|-------|------|
| **NOIZYFISH** | Master brand — production mapping, global rollout |
| **NOIZYKIDZ** | Haptic music education — deaf-first, autism-calm |
| **NOIZYVOX** | Voice estate — TTS, STT, cloning, A.I.V.A. |
| **NOIZYLAB** | $89 flat-rate repair, Ottawa + R&D |
| **HVS** | Human Voice Sovereignty — IP rights & domain strategy |
| **NOIZY.AI** | ← You are here. The mothership. |

---

## AI Model Clearances

**CLEARED (Apache 2.0 / MIT):**  
XTTS v2 · Librosa · RVC · Chatterbox · Gemma 4

**BLOCKED (Board Review Required):**  
MusicGen · MaskGCT · Tango2 · FishSpeech

---

## Constitutional Laws

All NOIZY.AI features must honour the 12 Constitutional Laws:

1. Consent is sacred
2. Creators own their voice
3. 75/25 is constitutional law
4. HVS is a right, not a mark
5. No DREED — ever
6. Lucy adapts with compassion
7. Humanity Weight rewards craft
8. Transparency by default
9. Privacy is sovereign
10. Community before commerce
11. Build forward continuously
12. Leave it more humane

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/NOIZYLAB-io/NOIZY.ai.git
cd NOIZY.ai

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Add Cloudflare API keys, n8n URL, etc.

# Run locally
npm run dev
```

---

## Part of the MC96 Ecosystem

```
RSP_001 → CLAUDE → GABRIEL → Agent Mesh (LUCY, SHIRL, DREAM, POPS, KEITH, CB01, HEAVEN)
```

**Machine:** Mac Studio M2 Ultra · 192GB · `GOD.local`  
**Stack:** Cloudflare Workers · D1 · TypeScript · Python · Claude API · n8n  

---

## License

MIT — See [LICENSE](./LICENSE)

---

*GORUNFREE. NOIZY.AI. Technicolor Fireworks.*
