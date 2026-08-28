# RSP_001 Recording Session Blueprint
## AAA Source Capture Protocol (Client#001)

## Objective

Capture source audio once at a standard that remains usable for:
- current TTS/LLM training
- future re-training
- immersive render pipelines

## Session Specs (non-negotiable)

- Sample rate: **48kHz**
- Bit depth: **32-bit float**
- Booth: dry, low-noise, no FX
- Signal chain: transparent preamp, no compression printed
- Loudness target: consistent performance level, no clipping

## Capture Blocks

1. **Phoneme Coverage**
   - Full language phoneme inventory
   - Isolated syllables + connected words
   - Minimum 20–30 minutes clean takes

2. **Emotional Matrix**
   - Neutral
   - Commanding
   - Heroic
   - Villain
   - Whisper
   - Angry
   - Weary
   - Comedic dry

3. **Character Arcs**
   - Hero persona block
   - Antagonist persona block
   - Narrator persona block
   - Each block includes opening, conflict, escalation, resolution

4. **Multilingual Seed Phrases**
   - 6–30 seconds per language target
   - Keep same intent line across language variants
   - Include regional cadence examples where needed

## File Naming Convention

```text
RSP001_<persona>_<emotion>_<language>_<take>.wav
RSP001_hero_neutral_enUS_t01.wav
RSP001_villain_command_esMX_t02.wav
```

## On-Set QA Checklist

- Noise floor validated before each block
- Peak headroom preserved (no clipping)
- Pronunciation consistency checked per language block
- Persona continuity checked every 10 takes
- Session notes logged for retake markers

## Ingest Handoff Package

```text
/session_export/
├── audio_wav/
├── session_notes.csv
├── pronunciation_notes.md
└── consent_manifest.json
```

## Post-Capture Ingest (NOIZY Pipeline)

1. Store raw masters unchanged.
2. Build derivatives: analysis / archival / immersive.
3. Run transcription + feature extraction.
4. Update use-profile and quality report.
5. Mark session status: `ready_for_training`.

## Acceptance Criteria

- Complete phoneme coverage confirmed
- Emotional matrix completed and tagged
- 3 persona arcs captured and approved
- Metadata and consent manifest attached
- Ingest quality report generated without critical errors
