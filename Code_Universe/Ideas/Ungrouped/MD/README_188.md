# engr-keys/

Engineering key and secret **manifest** — NOT the secrets themselves.

## Rule
Never commit a secret value. Ever. This folder tracks:

- What secrets exist
- Where they live (1Password, Cloudflare secret store, Apple Keychain)
- When they were last rotated
- Who has access (should be: architect only)

## First files to author
- [ ] `MANIFEST.md` — table of every secret, its home, last rotation
- [ ] `rotation-runbook.md` — exactly how to rotate each one safely
