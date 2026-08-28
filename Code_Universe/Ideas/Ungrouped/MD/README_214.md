# NOIZY Self-Hosted Voice Platform

Creator-first backend scaffold for NOIZY DreamChamber, Aquarium, AIVA, and NOIZYKIDZ.

This stack is intentionally independent of ElevenLabs.

## Core Goals

- Preserve unique voice identity with creator-owned AVA profiles.
- Keep training + inference transparent and auditable.
- Run local-first voice pipelines (Whisper/DeepSpeech + Piper/Coqui).
- Support Composer Guild and NOIZYKIDZ Teacher tracks.
- Enforce secure defaults (API key auth, allowlisted CORS, no unsafe execution endpoints).

## Stack

- API: FastAPI
- DB: SQLite (default) via SQLAlchemy
- STT adapters: Whisper, DeepSpeech
- TTS adapters: Piper, Coqui
- Audio post layer: AV audio engine adapter
- Workflow orchestration: n8n webhook adapter

## Folder Structure

```text
noizy_platform/
  app/
    main.py
    config.py
    database.py
    models.py
    schemas.py
    security.py
    deps.py
    routers/
      health.py
      ava.py
      composer.py
      pipeline.py
      governance.py
    services/
      stt.py
      tts.py
      audio_engine.py
      orchestrator.py
  requirements.txt
  .env.example
```

## Quick Start

1. Create virtual env and install deps:

```bash
cd noizy_platform
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Configure environment:

```bash
cp .env.example .env
# Set NOIZY_API_KEY and explicit ALLOWED_ORIGINS
```

3. Run the API:

```bash
uvicorn app.main:app --reload --port 8090
```

If you already have an older `noizy_platform.db`, recreate it after schema changes:

```bash
rm -f noizy_platform.db
```

## Security Baseline

- `x-noizy-api-key` required on all non-health endpoints.
- Wildcard CORS is blocked at config validation.
- Allowlisted command model only in workstation command router.
- No arbitrary shell execution endpoint is exposed.

## Key Endpoints

- `GET /healthz`
- `GET/POST /ava/`
- `GET/POST /composer/guild`
- `POST /composer/promote/{handle}`
- `GET /composer/teachers`
- `POST /pipeline/ingest`
- `POST /pipeline/transcribe`
- `POST /pipeline/synthesize`
- `POST /pipeline/audio-engine`
- `POST /pipeline/orchestrate`
- `GET /governance/creative-covenant`
- `GET /onboarding/voice-actor-pathway`
- `GET /onboarding/community-starter-pack`
- `GET /onboarding/actor-launch-journey-map`
- `POST /onboarding/{ava_slug}/initialize`
- `POST /onboarding/{ava_slug}/progress`
- `GET /onboarding/{ava_slug}/progress`
- `POST /profile/{ava_slug}/audio` (multipart upload)
- `GET /profile/{ava_slug}/audio`
- `GET /profile/{ava_slug}/use-profile`
- `GET /profile/{ava_slug}/quality-report`

## Creative Covenant

The platform mission is explicit in `/governance/creative-covenant`:

- Human creativity comes first.
- AI is a collaborator, not a replacement.
- Consent, attribution, and provenance are non-negotiable.
- Next-generation learning pathways stay transparent and safe.

## Actor Enablement

- Practical rollout guide: `docs/voice-actor-onboarding.md`
- Journey map: `docs/noizy-actor-journey-map.md`
- Launch journey map: `docs/noizy-actor-launch-journey.md`
- Community starter pack: `docs/noizy-community-starter-pack.md`
- Audio upload profile flow: `docs/audio-upload-use-profile.md`
- Audio-to-persona visual roadmap: `docs/noizy-actor-audio-to-persona-roadmap.md`
- Client#001 AAA ecosystem map: `docs/noizy-client001-aaa-ecosystem-map.md`
- Client#001 manifesto: `docs/noizy-client001-manifesto.md`
- The 1000 guild doctrine: `docs/noizyvox-the-1000-guild-upgraded.md`
- The 1000 universe map: `docs/noizyvox-the-1000-universe-map.md`
- The 1000 universe source data: `docs/data/noizyvox-the-1000-universe.json`
- RSP_001 recording blueprint: `docs/rsp001-recording-session-blueprint.md`
- RSP_001 full protocol: `docs/rsp001-full-recording-protocol.md`
- RSP_001 recording universe: `docs/rsp001-recording-universe.md`
- NOIZYVOX partner deck: `docs/noizyvox-partner-deck.md`
- Guild application and vetting: `docs/noizyvox-guild-application-vetting.md`
- Guild onboarding system: `docs/noizyvox-guild-member-onboarding-system.md`
- AAA studio licensing model: `docs/noizyvox-aaa-studio-licensing-model.md`
- Guild launch strategy: `docs/noizyvox-guild-launch-strategy.md`
- RSP_001 Python scaffold: `../rsp001_pipeline/README.md`
- RSP_001 sleepy-time recording protocol: `docs/rsp001-sleepy-time-story-recording-protocol.md`
- Sleepy-time story arc template: `docs/noizyvox-sleepy-time-story-arc-template.md`
- NOIZYKIDZ sleepy-time safe variant: `docs/noizykidz-sleepy-time-variant.md`
- Calming voice architecture: `docs/noizyvox-calming-voice-architecture.md`
- Panic Mode technical spec: `docs/noizyvox-panic-mode-technical-spec.md`
- RSP_001 Panic Mode recording session: `docs/rsp001-panic-mode-recording-session.md`
- LIFELUV Panic Mode integration: `docs/lifeluv-panic-mode-integration.md`
- NOIZYKIDZ haptic protocol: `docs/noizykidz-haptic-protocol.md`
- Sonic Aid device brief: `docs/sonic-aid-device-brief.md`
- Sonic Aid triple-vector predictive haptic blueprint: `docs/sonic-aid-triple-vector-predictive-haptic-blueprint.md`
- Clinical research proposal outline (Panic Mode): `docs/clinical-research-proposal-panic-mode.md`
- Claude Health technical integration spec: `docs/noizyvox-claude-health-technical-integration-spec.md`
- Anthropic + open-source integration plan: `docs/anthropic-healthcare-open-integration.md`
- Global calm and healing architecture blueprint: `docs/global-audio-calm-healing-blueprint.md`
- Global calm and healing system diagram: `docs/global-audio-calm-healing-system-diagram.md`
- World healing library architecture: `docs/world-healing-library-architecture.md`
- Cultural consent framework: `docs/cultural-consent-framework.md`
- NOIZYVOX farm ecosystem blueprint (portal + schema + trust loop + weekend prototype): `docs/noizyvox-farm-ecosystem-blueprint.md`
- Product rule: actors learn NOIZY workflows, not ML internals.

## Audio -> Use Profile

When actors upload media to `/profile/{ava_slug}/audio`, NOIZY:

1. Stores original media under `storage/uploads/{ava_slug}/`
2. Builds a future-ready derivative set:
   - analysis WAV (22.05kHz mono)
   - archival WAV (48kHz stereo float)
   - immersive WAV (48kHz stereo float, limiter-safe)
3. Runs STT transcription (Whisper/DeepSpeech adapter) on analysis audio
4. Saves analyzed asset metadata + quality report JSON
5. Updates persistent `use_profile` statistics for the actor (quality profile/version aware)

## Future-Proof Audio Policy

The upload pipeline is intentionally derivative-based, so assets can be re-processed when audio tech changes:

- Keep original source media untouched.
- Keep archival masters for future model upgrades.
- Keep analysis derivatives stable for deterministic ML feature extraction.
- Keep immersive derivatives ready for spatial and real-time runtime engines.
