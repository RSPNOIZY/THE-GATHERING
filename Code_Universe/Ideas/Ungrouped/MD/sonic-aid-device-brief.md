# Sonic Aid Device Brief

## Scope

Concept brief for two hardware paths that pair with NOIZYVOX Panic/Calm pipelines.

## Device A — Mastoid Patch (Concept)

### Functions
- low-intensity haptic grounding
- optional bone-conduction cue channel
- skin-safe adhesive form factor

### Core Requirements
- gentle vibration profiles (non-startling)
- configurable intensity limits
- battery + thermal safety constraints

## Device B — Neural Earbuds (Concept)

### Functions
- binaural audio output
- optional in-ear PPG stream input
- synchronized haptic micro-cues

### Core Requirements
- low-latency audio/haptic sync
- secure device pairing
- profile-based safety caps

## Integration API (Draft)

- receive plan payload:
  - protocol
  - beat config
  - haptic sequence
- return telemetry:
  - session started
  - cue delivered
  - user stop

## Safety + Regulatory Notes

- hardware claims must remain non-medical until validated
- all therapeutic marketing copy gated by legal review
- device deployment requires risk assessment documentation
