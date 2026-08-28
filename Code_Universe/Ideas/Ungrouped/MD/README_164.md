# Phase 5-6 — Session Sealing + Cross-Session Recall

Two small utilities that make sessions tamper-evident and searchable across time.

## Files

```
noizy-session-tools/
├── seal.mjs          # Phase 5 — seal a single session
├── recall-index.mjs  # Phase 6 — index all sessions for recall
└── README.md
```

## Phase 5 — Seal a session

```bash
node seal.mjs <SESSION_ID>
```

Reads `.session/<ID>/notes.ndjson` and `.session/<ID>/manifest.json`, writes `.session/<ID>/seal.sha256`.

**Verify** (once keypair is in place):

```bash
openssl dgst -sha256 -verify seal.pub -signature .session/<ID>/seal.sha256 .session/<ID>/manifest.json
```

### Hardening roadmap (co-architect note)

The current seal is a SHA256 digest — it proves content hasn't changed *relative to the hash*, but anyone who can rewrite both files and the seal can replay. To make it truly tamper-evident:

1. Sign the digest with an asymmetric key (`openssl dgst -sha256 -sign seal.key`).
2. Keep `seal.key` offline (YubiKey-held) and publish `seal.pub` in the repo.
3. Anchor the daily batch of seals in a public transparency log (Rekor / sigstore) for external non-repudiation.

Staged: ship v1 (local-only), harden to v2 (signed) before any session is used as evidence externally.

## Phase 6 — Index + recall

```bash
node recall-index.mjs      # build session-index.json
```

Then use `/recall` slash command in OpenCode, or grep directly:

```bash
grep "chorus" .session/*/notes.ndjson
```

### Indexing trade-off

`recall-index.mjs` is a flat JSON dump — simple, fast, no deps, fine up to a few thousand sessions. Past that, migrate to SQLite FTS5 or a vector index. Keep the NDJSON files as the source of truth in either case.

## Activate in OpenCode

```json
"session_seal": true,
"cross_recall": true
```
