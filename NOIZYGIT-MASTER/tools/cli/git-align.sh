#!/bin/zsh
# git-align.sh — NOIZY Enterprise Git Cutover
# Doctrine: noizy.ai is authority. git.noizy.ai is source of truth.
# Push enterprise-first, migrate in phases, retire GitHub safely.
#
# Usage: zsh git-align.sh
# Requires: git.noizy.ai to be live with SSH access configured
# Run on: GOD (10.90.90.10) — M2 Ultra Mac Studio

set -euo pipefail

BASE_DIR="${HOME}/NOIZYLAB"
ORG="NOIZYFISH"
ENTERPRISE_HOST="git@git.noizy.ai:${ORG}"

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
echo "  NOIZY Enterprise Git Alignment"
echo "  Enterprise: ${ENTERPRISE_HOST}"
echo "  Base:       ${BASE_DIR}"
echo "══════════════════════════════════════════════"
echo ""

# ── Global safe defaults ──────────────────────────
git config --global push.default current
git config --global fetch.prune true
git config --global init.defaultBranch main
git config --global user.name "Robert Stephen Plowman"
git config --global user.email "rsp@noizyfish.com"
echo "✓ Global git config set"
echo ""

# ── Per-repo alignment ────────────────────────────
for repo in "${REPOS[@]}"; do
  repo_dir="${BASE_DIR}/${repo}"
  echo "── ${repo}"

  if [ ! -d "${repo_dir}" ]; then
    echo "  ⚠ Not found locally — skipping (clone manually)"
    echo ""
    continue
  fi

  cd "${repo_dir}"

  # Set repo-level identity
  git config user.name "Robert Stephen Plowman"
  git config user.email "rsp@noizyfish.com"

  # Rename origin → github (clarity, keep GitHub as backup)
  if git remote get-url origin >/dev/null 2>&1; then
    current_origin="$(git remote get-url origin)"
    if [[ "${current_origin}" != *"git.noizy.ai"* ]]; then
      git remote rename origin github 2>/dev/null || true
      echo "  ✓ origin renamed → github"
    fi
  fi

  # Add or update enterprise remote
  if git remote get-url enterprise >/dev/null 2>&1; then
    git remote set-url enterprise "${ENTERPRISE_HOST}/${repo}.git"
    echo "  ✓ enterprise remote updated"
  else
    git remote add enterprise "${ENTERPRISE_HOST}/${repo}.git"
    echo "  ✓ enterprise remote added"
  fi

  # Default push → enterprise
  git config remote.pushDefault enterprise
  echo "  ✓ pushDefault = enterprise"

  # Show remotes
  git remote -v | grep -E "(github|enterprise)" | sed 's/^/  /'
  echo ""

  cd "${BASE_DIR}"
done

echo "══════════════════════════════════════════════"
echo "  Phase 3 — Mirror to enterprise (optional)"
echo "  Run for each repo after git.noizy.ai is live:"
echo ""
echo "  git push enterprise --all"
echo "  git push enterprise --tags"
echo "══════════════════════════════════════════════"
echo ""
echo "✅ Alignment complete."
echo "   Push to enterprise:   git push enterprise main"
echo "   Pull from github:     git pull github main"
echo "   One-liner cutover:    zsh ~/NOIZYLAB/git-mirror.sh"
