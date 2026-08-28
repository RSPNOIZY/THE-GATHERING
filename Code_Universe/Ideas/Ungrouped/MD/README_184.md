# react-components/

Shared UI components across the Lucy, Gabriel, and future PWAs.

## Pattern
- Tailwind + React function components.
- No default props that differ across surfaces — surface identity comes
  from build-time env, not runtime guessing.

## First components to extract from `agents/lucy/pwa/`
- [ ] `<MeshPanel />` — the 3-panel agent list
- [ ] `<ChatScroll />` — conversation autoscroll
- [ ] `<SystemState />` — right-rail status card
