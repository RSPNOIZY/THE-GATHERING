# NOIZYVOX — Voice Estate / A.I.V.A.

> **Your voice is your empire. We keep the gate.**

[![A.I.V.A.](https://img.shields.io/badge/A.I.V.A.-AI_Voice_Artistry-000?style=flat)](https://noizyvox.com)
[![Split](https://img.shields.io/badge/Creator_Split-75%25-brightgreen?style=flat)](https://noizyvox.com)
[![HVS](https://img.shields.io/badge/HVS-Protected-000?style=flat)](https://humanvoicesovereignty.com)
[![License](https://img.shields.io/badge/License-MIT-000?style=flat)](./LICENSE)

---

## What is NOIZYVOX?

NOIZYVOX is the voice estate and vocal technology division of the NOIZY Empire. It operates on a **creator-first 75/25 model** — 75% of all revenue derived from a creator's voice goes directly to the creator.

The core technology stack is called **A.I.V.A.** — AI Voice Artistry — and it encompasses:
- **Text-to-Speech (TTS):** Consent-native synthetic voice generation
- **Speech-to-Text (STT):** Creator-controlled transcription
- **Voice Cloning:** Opt-in, consent-gated, revocable at any time
- **Voice Estate Management:** Licensing, royalties, revocation infrastructure

**Guardian:** LUCY (Voice Estate Guardian Agent)

---

## A.I.V.A. Technology Stack

| Model | License | Role |
|-------|---------|------|
| XTTS v2 | Apache 2.0 | Primary TTS — highest quality |
| Chatterbox | Apache 2.0 | Emotion-aware TTS |
| RVC | MIT | Real-time voice conversion |
| Librosa | ISC | Audio analysis, feature extraction |

**Blocked (Board Review Required):** MusicGen, MaskGCT, Tango2, FishSpeech

---

## The 75/25 Constitutional Guarantee

Every voice enrolled in NOIZYVOX is protected by Constitution Law #3:

```
75% → Creator
25% → NOIZY Operations
```

This is not a preference. It is not a slider. It is constitutional law.

---

## Creator Rights (Human Voice Sovereignty)

Every creator who enrolls their voice receives:

1. **Full ownership** of their voice IP
2. **Granular scope control** — choose exactly what your voice can be used for
3. **Instant revocation** — remove your voice from all NOIZY systems within 24h
4. **Transparent reporting** — see exactly where, when, and how your voice is used
5. **HVS protection** — your voice cannot be sub-licensed without explicit consent

---

## Repository Structure

```
NOIZYVOX/
├── README.md
├── LICENSE
├── .gitignore
├── package.json
├── src/
│   ├── aiva/
│   │   ├── tts.ts              # Text-to-speech orchestration
│   │   ├── stt.ts              # Speech-to-text pipeline
│   │   ├── clone.ts            # Voice cloning (consent-gated)
│   │   └── estate.ts           # Voice estate management
│   ├── consent/
│   │   └── gate.ts             # Consent check before any voice operation
│   ├── economics/
│   │   └── splits.ts           # 75/25 revenue calculation
│   └── api/
│       └── worker.ts           # Cloudflare Worker API
├── tests/
├── docs/
│   ├── CONSENT_PROTOCOL.md
│   ├── VOICE_ESTATE_GUIDE.md
│   └── API.md
└── scripts/
    └── health-check.sh
```

---

## Consent Protocol (Mandatory)

No voice operation proceeds without:

```typescript
import { consentGate } from './consent/gate';

// Every voice operation must pass through this gate
const allowed = await consentGate.check({
  voiceId: 'creator_voice_001',
  operation: 'tts',  // tts | stt | clone | commercial
  context: 'marketing_spot_001'
});

if (!allowed) throw new Error('CONSENT_DENIED');
```

---

## Getting Started

```bash
git clone https://github.com/RSPNOIZY/NOIZYVOX.git
cd NOIZYVOX
npm install
cp .env.example .env.local
npm run dev
```

---

## Part of the NOIZY Empire

NOIZYVOX is brand #4 of six under [NOIZYFISH](https://noizyfish.com).  
Guardian agent: **LUCY** (Voice Estate Guardian)  
Compliance: **CB01** (Consent & Contracts Bot)

---

## License

MIT — Code is free. Voice IP belongs to its creator.

---

*GORUNFREE. Your voice. Your estate. Your 75%.*
