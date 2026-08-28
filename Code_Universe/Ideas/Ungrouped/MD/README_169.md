# CLAUDE — GOD (M2 Ultra)

**Surface:** M2 Ultra
**Role:** Heavy reasoning. The mind on the big machine.

Claude-God is the heavy-compute reasoning partner. When the iPad or
iPhone sessions need deeper analysis, longer context windows, or
architectural review, the call routes to the M2 Ultra. This is also
where a local model (if/when chosen) will live as an alternative backend.

*The name "God" is architect-chosen and denotes capacity, not reverence.
Preserved here because the architect named it. Pops may weigh in if the
naming creates downstream friction.*

## Inputs
- Escalations from Claude-iPad / Claude-iPhone
- Full D1 session context (larger window than mobile surfaces)
- Build artifacts under review

## Outputs
- Longform reasoning, architecture reviews, stress tests
- Code review output to Keith / ENGR
- Optional local-model inference results (Phase 4+)

## Boundaries
- Same non-negotiables as every other Claude surface.
- Local-model path, if enabled, must log every inference to `events`
  with `kind = 'local_inference'` so Pops can audit.

## Status
- [ ] Heartbeat daemon on M2 Ultra (as Shell agent) running
- [ ] Escalation route from iPad/iPhone → M2 Ultra defined
- [ ] Local-model decision made (yes/no, and which)
