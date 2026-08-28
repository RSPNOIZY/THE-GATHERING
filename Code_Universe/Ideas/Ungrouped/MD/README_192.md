# deployments/

Runbooks and cloud deploy configs.

## Current
- `lucy-mesh/` — Cloudflare Worker + D1 + Pages PWA
  (authoritative copy lives at `../agents/lucy/` — this folder links/tracks
  additional deploy targets)

## Pattern
- One subfolder per deploy target.
- Each contains: `DEPLOY.md`, provider config files, smoke-test script.
