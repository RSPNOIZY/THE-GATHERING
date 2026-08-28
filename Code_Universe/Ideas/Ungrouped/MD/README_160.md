# Claude Stage Prompts

This folder contains staged prompts for building the NOIZY monorepo with Claude Code / Claude Terminal.

## Operating laws

- Shared structure first.
- Route structure before page volume.
- Brand system before copy polish.
- Checkpoint after every stage.
- Use Cloudflare-compatible assumptions only.

## Execution order

1. `00_superprompt.md`
2. `01_scaffold.md`
3. `02_shared_contracts.md`
4. `03_route_map.md`
5. `04_noizyfish_design.md`
6. `05_noizyvox_design.md`
7. `06_noizyfish_models.md`
8. `07_noizyvox_models.md`
9. `08_noizyfish_pages.md`
10. `09_noizyvox_pages.md`
11. `10_mobile_polish.md`
12. `11_cloudflare_prep.md`
13. `12_qa_and_lock.md`

## How to use

For each stage:

1. Open the prompt file.
2. Paste it into Claude Code.
3. Let Claude complete only that stage.
4. Review the result.
5. Commit the checkpoint.
6. Move to the next stage.

## Checkpoint discipline

After each stage, capture:

- files created or changed
- commands that currently work
- unresolved weak spots
- readiness for the next stage

## Do not do this

- Do not skip route planning.
- Do not build page volume before shared contracts.
- Do not centralize brand identity into shared packages.
- Do not make fake Cloudflare deployment claims.
- Do not claim enforcement that is not implemented.

## Folder intent

- `00_superprompt.md` → global operating mode
- `01_scaffold.md` → repo structure only
- `02_shared_contracts.md` → shared content/types/contracts
- `03_route_map.md` → route ownership and layout plan
- `04_noizyfish_design.md` → NOIZYFISH visual system
- `05_noizyvox_design.md` → NOIZYVOX visual system
- `06_noizyfish_models.md` → archive models
- `07_noizyvox_models.md` → creator/voice/consent models
- `08_noizyfish_pages.md` → NOIZYFISH MVP pages
- `09_noizyvox_pages.md` → NOIZYVOX MVP pages
- `10_mobile_polish.md` → responsive refinement
- `11_cloudflare_prep.md` → Cloudflare readiness, Workers, D1 sketch
- `12_qa_and_lock.md` → final QA and shipping lock

## Success condition

The system is ready for founder review when:

- the monorepo installs cleanly
- both apps run locally
- both apps build
- route ownership is clear
- shared contracts are stable
- NOIZYFISH feels archival and distinct
- NOIZYVOX feels creator-first and distinct
- mobile layouts are intentional
- Cloudflare notes are practical
- QA has removed obvious dead weight
