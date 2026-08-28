# Stage 01 — Root Scaffold

## Goal

Create the monorepo base only. Do not over-polish pages. Do not write final copy. Do not over-abstract.

## Deliverables

- `pnpm-workspace.yaml`
- `turbo.json`
- `package.json` (root)
- `apps/noizyfish/` (Next.js app shell)
- `apps/noizyvox/` (Next.js app shell)
- `packages/ui/` (shared UI primitives)
- `packages/config/` (shared Tailwind/TypeScript config)
- `packages/types/` (shared TypeScript types)
- Initial `tsconfig.json` strategy
- Basic `dev`, `build`, `lint` scripts

## Exit criteria

- `pnpm install` succeeds
- Both apps are present and can start
- Shared packages resolve cleanly
- Scripts are readable
- No unnecessary page flourish yet

## Checkpoint

After completion:

1. List files created
2. Confirm working commands
3. State unresolved weak spots
4. Confirm readiness for Stage 02
