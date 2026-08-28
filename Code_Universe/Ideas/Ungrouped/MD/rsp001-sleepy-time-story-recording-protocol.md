# RSP_001 Sleepy Time Story Recording Protocol

## Purpose

Capture voice assets optimized for sleep-support storytelling with ASMR-style delivery, high fidelity, and safe downstream processing.

This protocol is for **supportive relaxation content**, not medical treatment claims.

## Capture Standard

- Format: `48kHz`, `32-bit float`, dry capture
- Room: treated booth, low-noise floor
- Mic options:
  - binaural head / ear-form-factor for proximity realism
  - large-diaphragm spoken-word chain as fallback
- Record no insert FX on source files

## Session Blocks

1. `Phoneme Coverage`
- Full phoneme inventory at low, medium, soft intensity
- Clean consonants at reduced sibilance

2. `Calm Emotion Matrix`
- Neutral calm
- Reassuring
- Sleepy warm
- Whisper-safe
- Soft command (for guided breathing)

3. `Story Arc Takes`
- Threshold intro
- Engagement narrative
- Drift section
- Dissolution section
- Ambient closeout phrases

4. `Binaural Intimacy Pass`
- Ear-to-ear whisper variants
- Near-field soft speech
- Breath-timed cue phrases

## Mic Technique

- Distance target: `15–30 cm` equivalent for near-field intimacy
- Keep head movement minimal for phase stability
- Avoid sudden plosives and transient spikes
- Maintain pacing consistency; use intentional pauses

## Engineering Constraints

- Loudness policy:
  - avoid aggressive compression on source
  - leave dynamic headroom for post layering
- Preserve two masters:
  - archival source (`48kHz float`)
  - analysis derivative (`22.05kHz mono`) for deterministic ML features

## Safety Constraints (Required)

- Sleep-support language only:
  - do not claim cure/treatment for autism, anxiety, insomnia, or medical conditions
- Content rules:
  - no startling transitions
  - no sharp high-frequency bursts
  - no sudden stereo jumps
- Always ship with:
  - volume guidance
  - stop-if-discomfort instruction
  - listener trigger opt-out settings

## Deliverables Per Session

- Raw takes (`.wav`)
- Session slate JSON:
  - actor id
  - block id
  - emotional label
  - trigger tags
  - language/dialect
- Engineer notes:
  - usable / retry markers
  - sibilance flags
  - sensory risk notes

## QA Checklist

- [ ] No clipping
- [ ] No room artifacts above threshold
- [ ] Consistent pacing per block
- [ ] Whisper intelligibility acceptable
- [ ] Metadata complete
- [ ] Safety labels attached
