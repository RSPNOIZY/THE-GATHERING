# NOIZYVOX Client#001 AAA Ecosystem Map

Artist-owned, consent-locked, premium voice library pipeline.

## End-to-End Flow

```mermaid
flowchart LR
  A[Client#001 Source Capture<br/>48kHz/32-bit float dry booth] --> B[Ingest + Normalize]
  B --> C[Analysis Derivative<br/>22.05k mono]
  B --> D[Archival Master<br/>48k stereo float]
  B --> E[Immersive Derivative<br/>48k stereo float]

  C --> F[STT + Feature Extraction<br/>Whisper/DeepSpeech + Librosa]
  F --> G[Voice Genome + Use Profile<br/>tone/range/emotion/persona]
  D --> G
  E --> G

  G --> H[Model Training Layer<br/>XTTS v2 / RVC / Bark / OpenVoice]
  H --> I[AAA FX + Post<br/>pedalboard + AV audio engine]
  I --> J[Multilingual Character Renders<br/>Hero / Villain / Narrator]

  J --> K[NOIZYVOX Premium Library]
  K --> L[Consent-as-Code Cert + Metadata]
  L --> M[Licensing + Monetization]

  M --> N[Studio/Game/Film Integrations]
  N --> O[Usage Telemetry + Royalty Routing]
  O --> P[Actor Earnings + Profile Evolution]
  P --> G
```

## Productized Asset Layout

```text
RSP_001_AAA/
├── HERO/                # multilingual + emotional renders
├── VILLAIN/             # multilingual + emotional renders
├── NARRATOR/            # multilingual + broadcast variants
├── PHONEME_STEMS/       # source units for custom synthesis
└── CONSENT_CERT/        # rights + policy + usage constraints
```

## Control Points (non-negotiable)

1. Consent locked at source.
2. Raw upload retained for reprocessing as models improve.
3. Derivative strategy preserved (analysis + archival + immersive).
4. Use-profile and quality report versioned over time.
5. Rights metadata attached to every exported asset.

## Delivery Targets

- Runtime-ready voice assets for game/film pipelines.
- Future-ready masters for retraining and new immersive formats.
- Transparent usage records for revenue attribution and audits.

## Bootstrap Client#001 (API)

```bash
curl -X POST http://localhost:8090/ava/ \
  -H "Content-Type: application/json" \
  -H "x-noizy-api-key: YOUR_KEY" \
  -d '{
    "slug":"client001-rsp001",
    "display_name":"Client#001 RSP_001",
    "voice_provider":"piper",
    "stt_provider":"whisper",
    "tone_preset":"heroic"
  }'
```

```bash
curl -X POST http://localhost:8090/onboarding/client001-rsp001/initialize \
  -H "x-noizy-api-key: YOUR_KEY"
```

```bash
curl -X POST http://localhost:8090/profile/client001-rsp001/audio \
  -H "x-noizy-api-key: YOUR_KEY" \
  -F "file=@/absolute/path/to/source.wav"
```

```bash
curl http://localhost:8090/profile/client001-rsp001/quality-report \
  -H "x-noizy-api-key: YOUR_KEY"
```
