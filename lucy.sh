#!/usr/bin/env bash
# ==============================================================================
# LUCY v4.0 — Unified Cockpit Launcher & CLI Wrapper
# ==============================================================================
set -e

LUCY_DIR="/Users/m2ultra/THE-GATHERING/LUCY"

if [ ! -d "$LUCY_DIR" ]; then
  echo "Error: Lucy directory not found at $LUCY_DIR"
  exit 1
fi

cd "$LUCY_DIR"

CMD="${1:-score}"
shift || true

case "$CMD" in
  score)
    node --import tsx src/cli.ts score "$@"
    ;;
  ingest)
    node --import tsx src/cli.ts ingest "$@"
    ;;
  graph)
    node --import tsx src/cli.ts graph "$@"
    ;;
  archive)
    node --import tsx src/cli.ts archive "$@"
    ;;
  twin)
    node --import tsx src/cli.ts twin "$@"
    ;;
  test)
    node --import tsx src/smoke-test-v4.ts
    ;;
  nightly)
    node --import tsx src/engine/run-nightly.ts
    ;;
  *)
    node --import tsx src/cli.ts "$CMD" "$@"
    ;;
esac
