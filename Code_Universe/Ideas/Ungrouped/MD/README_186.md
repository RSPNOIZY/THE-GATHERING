# prompts/

System and user prompt library for the mesh.

## Convention
- One subfolder per agent: `prompts/gabriel/`, `prompts/pops/`, etc.
- Shared prompts live at the root: `system.md`, `six-risk-scan.md`,
  `charter-check.md`.
- Each prompt file starts with a frontmatter block: `agent`, `purpose`,
  `version`, `last_updated`.

## First prompts to author
- [ ] `system.md` — baseline system prompt shared by every Claude surface
- [ ] `six-risk-scan.md` — Keith's review scan
- [ ] `pops/veto.md` — Pops' intervention template
- [ ] `gabriel/capture.md` — voice capture framing
