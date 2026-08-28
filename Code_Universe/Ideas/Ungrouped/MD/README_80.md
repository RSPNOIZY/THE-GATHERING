# NOIZYWORLD · Propagated Decks
This directory holds copies of canonical empire decks so AI agents operating in NOIZYWORLD context have local access to directives + prompts.

**Decree:** RSP_001 · 2026-04-20 — *"MAKE SURE ALL THE_DREAMCHAMBER.PPTX IS COPIED AND CARRIED IN NOIZYWORLD FOR AI DIRECTIVES & PROMPTS"*

## Files

- `THE_DREAMCHAMBER.pptx` — propagated copy of the canonical deck from OneDrive. Updated automatically by `ops/propagate-deck-to-noizyworld.sh` on every deck rebuild.

## Read order for AI agents

1. `THE_DREAMCHAMBER.pptx` — canonical empire ideas/builds/guild
2. Sibling `../NOIZYWORLD.pptx` — NOIZYWORLD-specific narrative deck

## Sync

```bash
bash ops/propagate-deck-to-noizyworld.sh
```

Hooks into the build pipeline: every `build_master_deck.py` run triggers propagation.

