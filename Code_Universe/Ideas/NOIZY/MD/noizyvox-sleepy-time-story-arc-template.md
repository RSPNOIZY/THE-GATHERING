# NOIZYVOX Sleepy Time Story Arc Template

## Goal

Provide a repeatable script + audio timing structure that gently lowers arousal and supports sleep onset.

## Arc Timeline

| Phase | Time Window | Intention | Voice Direction | Audio Direction |
|---|---:|---|---|---|
| Threshold | 0:00–2:00 | Safety + orientation | Soft-spoken intro, stable cadence | Light ambient bed, no beat emphasis |
| Engagement | 2:00–5:00 | Focus narrowing | Warm imagery, short sentences | Introduce subtle binaural layer |
| Drift | 5:00–15:00 | Cognitive offloading | Slower tempo, longer pauses | Theta-support beat prominence rises |
| Dissolution | 15:00–25:00 | Language fade | Repetitive, simple phrasing | Voice gain reduces gradually |
| Maintenance | 25:00–60:00 | Sleep sustain | Optional minimal cue phrases | Ambient + low-intensity beat tail |

## Script Blueprint

### 1. Threshold Prompt (Example)
"You are safe here. Let your breath settle. Nothing to solve right now."

### 2. Engagement Prompt (Example)
"Imagine a quiet shoreline at night. The air is cool, the water steady, and every sound is gentle."

### 3. Drift Prompt (Example)
"Breathing in... and out... each wave arrives, then drifts away."

### 4. Dissolution Prompt (Example)
"Now less words... more quiet... just rest... and stillness."

### 5. Maintenance Prompt (Optional)
"If you hear this, soften your shoulders and return to your breath."

## Trigger Mapping

- Voice triggers:
  - whisper-safe
  - soft-spoken near-field
  - slow deliberate cadence
- Environmental triggers:
  - rain / water
  - soft fabric brush
  - page-turn variants
- Disable by default for sensitive profiles:
  - sharp tapping
  - crinkly transients
  - bright high-frequency textures

## Mix Guidance (Starting Point)

- Narration: `-14 dBFS` target bed level
- Binaural beat bed: `-30 dBFS` to start
- Ambient bed: `-38 dBFS` to start
- Fade:
  - intro attack `2–3s`
  - release `8–12s`

Tune per profile; never hard-code one ratio as universal.

## Personalization Hooks

- Profile dimensions:
  - sensitivity (low / medium / high)
  - preferred voice style (neutral / warm / minimal prosody)
  - banned triggers list
- Feedback capture after session:
  - calmer / same / activated / overstimulated

## Output Metadata (Required)

- actor_id
- language + dialect
- phase timings
- triggers used
- level settings
- safety profile version
