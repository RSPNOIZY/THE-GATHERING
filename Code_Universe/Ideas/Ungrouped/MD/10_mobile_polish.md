# Stage 10 — Mobile Polish

## Goal

Perform mobile-first refinement passes on both apps.

## NOIZYFISH Audit

- [ ] Hero text balance (4xl → sm:5xl → md:7xl)
- [ ] Section spacing (py-20 → sm:py-32 → md:py-40)
- [ ] Line length control
- [ ] Archive card sizing
- [ ] Filter button horizontal scroll on mobile
- [ ] Tap targets (min 44px)
- [ ] Image ratios
- [ ] Typography scaling
- [ ] Footer clarity
- [ ] Metadata wrapping

## NOIZYVOX Audit

- [ ] Hero text balance
- [ ] Section spacing
- [ ] Onboarding usability (not cramped)
- [ ] Dashboard stacking
- [ ] Consent panel clarity
- [ ] Casting card legibility
- [ ] Filter interactions
- [ ] CTA placement
- [ ] Status chip readability
- [ ] Form input sizing

## Rules

- Mobile is not shrunken desktop
- Preserve premium feel on small screens
- Preserve calm pacing
- Avoid stacked clutter
- Rights settings must remain understandable

## Deliverables

- Updated pages with mobile breakpoints
- CSS adjustments in globals.css
- Mobile-specific utility classes if needed

## Exit criteria

- Both apps feel intentional on mobile
- No cramped layouts
- No unreadable text
- Filter/form interactions work

## Checkpoint

After completion:

1. List files changed
2. State biggest mobile wins
3. Note remaining compromises
4. Confirm readiness for Stage 11
