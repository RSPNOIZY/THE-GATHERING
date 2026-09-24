#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

if [ ! -d "$ROOT" ]; then
  echo "Root not found: $ROOT"
  exit 1
fi

subdirs=(
  agents/assistant
  agents/execution
  agents/orchestration
  agents/runtime
  agents/integrations
  projects/api
  projects/web
  projects/services
  projects/platform
  projects/experimental
  platform/sdk
  platform/core
  platform/shared
  platform/connectors
  platform/extensions
  infrastructure/cloud
  infrastructure/k8s
  infrastructure/cicd
  infrastructure/security
  infrastructure/observability
  docs/architecture
  docs/design
  docs/onboarding
  docs/operations
  docs/security
  docs/reference
  deploy/automation
  deploy/releases
  deploy/monitoring
  deploy/rollout
  deploy/scripts
  data/raw
  data/processed
  data/metadata
  data/models
  data/artifacts
  media/graphics
  media/video
  media/brand
  media/diagrams
  media/assets
  tools/cli
  tools/devops
  tools/analysis
  tools/local
  tools/utilities
  tests/unit
  tests/integration
  tests/e2e
  tests/performance
  tests/regression
  archive/legacy
  archive/imports
  archive/old-projects
  archive/experimental
  archive/deprecated
)

printf "Rebuilding NOIZYANTHROPIC bottom layer under %s\n" "$ROOT"
for subdir in "${subdirs[@]}"; do
  mkdir -p "$ROOT/$subdir"
  touch "$ROOT/$subdir/.gitkeep"
  printf "Created %s\n" "$subdir"
done

echo "Bottom layer rebuild complete."
