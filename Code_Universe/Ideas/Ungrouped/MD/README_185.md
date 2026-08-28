# build-artifacts/

Compiled, packaged, or signed outputs. Staging area before deploy.

*(The term "build artifacts" replaces the speech-to-text rendering
"blu-ray artifacts" from the original consolidation request — architect
to confirm the rename.)*

## Pattern
- One subfolder per artifact type: `pwa/`, `worker/`, `mcp/`.
- Each artifact is timestamped and tagged with the commit it came from.
- Nothing in this folder is a source of truth — always rebuildable from
  the source directories.
