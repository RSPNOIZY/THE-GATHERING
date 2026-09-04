# Implementation Plan

## P0: Stop Known Bad Connections

1. Search active configs, deployment manifests, scripts, secrets references, and registry files for rejected D1 database IDs.
2. Replace any live references with the approved active database ID only after confirming the canonical target.
3. Add a CI or preflight check that fails on rejected IDs.

## P0: Recover Voice Assets

1. Transfer the three biometric voice recordings from iPhone 15 Pro Max.
2. Verify file sizes, duration, format, and hashes.
3. Replace the 0-byte stubs in the governed voice asset store.
4. Write provenance receipts for the transfer and replacement events.

## P1: Validate Downloads Assets

1. Review `noizy-schema-v2-complete.sql`.
2. Validate whether it matches the active HEAVEN schema and migration conventions.
3. Review `dreamchamber-audio-mcp.py` for secrets, unsafe paths, dependency assumptions, and transport behavior.
4. Move accepted files into the appropriate repo only after review.

## P1: Archive Intake

1. Run deduplication only against mounted archival drives that are explicitly selected.
2. Generate manifests before deletion or movement.
3. Classify assets as `candidate`, `duplicate`, `dead`, `rejected`, or `imported`.
4. Keep SHA-256 hashes and source paths in the ledger.

## P2: Channel Passport Rollout

1. Confirm Slack IDs for `all-noizyfishcom`, `proj-noizyfish`, Claude DM, GitHub Bot DM, and GitHub Bot user.
2. Create one passport per channel, DM, bot, or communications endpoint.
3. Assign steward, trust level, data classification, permission policy, and receipt policy.
4. Block write/delete actions unless approval policy is explicit.

## P2: Thunderbird Resource Model

1. Inventory mailboxes, folders, address books, calendars, and Gloda indexes.
2. Create Thunderbird resource passports.
3. Treat mail, contact, and calendar mutations as governed actions requiring receipts.

## P3: Provenance Graph

1. Use `governance/graph/provenance-graph.seed.yaml` as the graph contract.
2. Ingest passports.
3. Ingest receipts.
4. Link receipts to assets, channels, identities, and approvals.
5. Expose read-only graph queries before enabling write actions.

## Non-Negotiables

- Rejected infrastructure is denylisted, not merely deprecated.
- Biometric voice assets require verification before import.
- Communications writes require approval and receipts.
- Dashboard or assistant summaries are not source of truth; registries are.
