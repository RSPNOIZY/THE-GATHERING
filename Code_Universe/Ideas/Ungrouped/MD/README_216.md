# RSP_001 Pipeline Scaffold
## Voice-First AAA Character Pipeline (Starter)

This scaffold is a build-ready foundation for:
- ingestion + normalization
- feature analysis
- multilingual render orchestration
- FX post chain
- pack deployment

It is intentionally modular so model providers can be swapped without rewriting the whole stack.

## Layout

```text
rsp001_pipeline/
├── config/
│   ├── paths.yml
│   └── voice_profile.json
├── data/
│   ├── raw_audio/
│   ├── processed_audio/
│   └── output/
├── lib/
│   ├── audio_pipeline.py
│   ├── tts_pipeline.py
│   ├── fx_pipeline.py
│   └── gemma_orchestrator.py
├── scripts/
│   ├── ingest_audio.py
│   ├── train_tts.py
│   ├── run_fx.py
│   └── deploy_pack.py
└── tests/
```

## Quick Start

```bash
cd rsp001_pipeline
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Ingest

```bash
python3 scripts/ingest_audio.py \
  --source data/raw_audio/sample.wav \
  --actor rsp001 \
  --session capture01
```

### Train (job manifest scaffold)

```bash
python3 scripts/train_tts.py \
  --actor rsp001 \
  --provider xtts_v2 \
  --language en
```

### FX pass

```bash
python3 scripts/run_fx.py \
  --input data/processed_audio/rsp001/capture01/sample-analysis.wav \
  --output data/output/rsp001/sample-aaa.wav
```

### Deploy pack skeleton

```bash
python3 scripts/deploy_pack.py \
  --actor rsp001 \
  --title RSP_001_AAA
```

### Build sleepy-time ASMR mix (voice + binaural + ambient)

```bash
python3 scripts/build_sleepy_story.py \
  --narration data/processed_audio/rsp001/capture01/sample-immersive.wav \
  --output data/output/rsp001/rsp001-sleepy-story.wav \
  --beat-hz 6.0 \
  --carrier-hz 180 \
  --voice-db -14 \
  --beat-db -30 \
  --ambient-db -38 \
  --tail-seconds 20
```

## Notes

- Heavy model integrations are intentionally adapter-based.
- If `ffmpeg` or `librosa` are unavailable, scripts fall back gracefully.
- Replace placeholders in `tts_pipeline.py` with actual XTTS/RVC/Bark calls.
- Sleepy story pipeline is sleep-support oriented and intentionally avoids medical treatment claims.

### Panic Mode intervention planning (biometric trigger simulation)

```bash
python3 scripts/run_panic_mode.py \
  --snapshot-json data/manifests/demo_snapshot.json \
  --baseline-json data/manifests/demo_baseline.json \
  --profile neurodiversity_support \
  --haptics-enabled \
  --output data/output/rsp001/panic-plan.json
```

### Predictive haptic deceleration flow (episode-memory aware)

```bash
python3 scripts/build_haptic_panic_flow.py \
  --snapshot-json data/manifests/demo_snapshot.json \
  --baseline-json data/manifests/demo_baseline.json \
  --history-json data/manifests/demo_episode_history.json \
  --duration-seconds 240 \
  --step-seconds 30 \
  --output data/output/rsp001/haptic-flow.json
```
