#!/bin/zsh
# git-mirror.sh — Push ALL branches + tags to enterprise for every repo
# Run after git-align.sh, once git.noizy.ai is live and SSH works.
#
# Usage: zsh git-mirror.sh
# This is Phase 3 of the NOIZY enterprise Git migration.

set -euo pipefail

BASE_DIR="${HOME}/NOIZYLAB"
ORG="NOIZYFISH"

REPOS=(
  heaven
  noizyanthropic
  gabriel-v3
  noizylab-portal
  noizyvox-core
  noizy-proof
  mc96-command
  noizykidz
)

echo "══════════════════════════════════════════════"
echo "  NOIZY Git Mirror — Phase 3"
echo "  Pushing all branches + tags → enterprise"
echo "══════════════════════════════════════════════"
echo ""

for repo in "${REPOS[@]}"; do
  repo_dir="${BASE_DIR}/${repo}"
  echo "── ${repo}"

  if [ ! -d "${repo_dir}" ]; then
    echo "  ⚠ Skipped — not found locally"
    echo ""
    continue
  fi

  cd "${repo_dir}"

  if ! git remote get-url enterprise >/dev/null 2>&1; then
    echo "  ⚠ Skipped — enterprise remote not set. Run git-align.sh first."
    echo ""
    cd "${BASE_DIR}"
    continue
  fi

  git fetch --all --prune
  git push enterprise --all
  git push enterprise --tags
  echo "  ✓ All branches + tags pushed to enterprise"
  echo ""

  cd "${BASE_DIR}"
done

echo "✅ Mirror complete. Verify on git.noizy.ai"
