# session-state/

Specs and contracts for how sessions persist and hand off across
surfaces. This is *not* where live session data lives — that is in Lucy
D1. This folder documents the rules.

## First specs to author
- [ ] `session-id-format.md` — how session IDs are minted
- [ ] `handoff-ipad-to-iphone.md` — when you start on iPad and reply on iPhone
- [ ] `context-window.md` — how many turns Claude gets (see `CONTEXT_TURNS`)
