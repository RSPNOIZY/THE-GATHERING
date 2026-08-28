# Stage 12 — QA and Lock

## Goal

Perform final QA pass and lock the MVP for founder review.

## QA Checklist

### Routes

- [ ] All NOIZYFISH routes load
- [ ] All NOIZYVOX routes load
- [ ] No 404s on valid paths
- [ ] Navigation links work

### Imports

- [ ] No broken imports
- [ ] Shared packages resolve
- [ ] No circular dependencies

### Types

- [ ] `pnpm typecheck` passes
- [ ] No `any` types in critical paths
- [ ] Mock data matches type definitions

### Build

- [ ] `pnpm build` succeeds
- [ ] No build warnings for critical issues
- [ ] Output is reasonable size

### Hydration

- [ ] No hydration mismatches
- [ ] Client components marked correctly
- [ ] Server/client boundary is clean

### Accessibility

- [ ] Heading hierarchy makes sense
- [ ] Links have discernible text
- [ ] Form inputs have labels
- [ ] Color contrast is acceptable

### Mobile

- [ ] No horizontal scroll
- [ ] Tap targets are adequate
- [ ] Text is readable

### Copy

- [ ] No lorem ipsum
- [ ] No obvious placeholder text
- [ ] Headlines make sense

### Dead code

- [ ] Remove unused imports
- [ ] Remove unused components
- [ ] Remove commented-out code

## Final invariant

These conditions must be true:

- Nothing should be presented as voice-ready without an explicit consent state.
- No archive asset should be presented without lineage/provenance status.
- No revocation flow should exist without a defined effect on availability, readiness, or usage state.

## Deliverables

- All QA issues fixed
- READMEs updated to reflect reality
- Final file tree documented
- Install/dev/build commands verified

## Exit criteria

- Repo installs cleanly (`pnpm install`)
- Both apps run locally (`pnpm dev`)
- Both apps build (`pnpm build`)
- No obvious dead weight
- README reflects truth

## Final checkpoint

1. Confirm all QA items checked
2. List remaining known issues
3. State ship-readiness verdict
4. Document exact commands:

```bash
pnpm install
pnpm dev
pnpm build
```

## Ship signal

If all criteria pass:

**NOIZY BUILD COMPLETE — GORUNFREE.**
