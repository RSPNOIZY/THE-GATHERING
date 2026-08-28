# Stage 02 — Shared Contracts

## Goal

Stabilize shared data shapes and structural primitives before page divergence begins.

## Deliverables

### TypeScript types for:

- Archive items (NOIZYFISH)
- Lineage entries
- Featured works
- Voice profiles (NOIZYVOX)
- Consent states
- Trust blocks
- CTA groups
- Metadata groups

### Mock data

- 6-8 NOIZYFISH archive items
- 5-6 NOIZYVOX voice profiles
- Default consent state template

### Content utilities

- `formatDuration()`
- `formatDate()`
- Any shared helpers

### Content folder structure

- Document what belongs in `packages/content/` vs app-local `lib/`

### Backend mapping notes

- How types map to future D1 schemas
- What stays static vs becomes dynamic

## Exit criteria

- Archive-related shapes are stable
- Voice/consent-related shapes are stable
- Shared types are readable
- App-local content is clearly separated
- Future D1/Workers mapping is plausible

## Checkpoint

After completion:

1. List files created
2. Confirm type exports work
3. State unresolved weak spots
4. Confirm readiness for Stage 03
