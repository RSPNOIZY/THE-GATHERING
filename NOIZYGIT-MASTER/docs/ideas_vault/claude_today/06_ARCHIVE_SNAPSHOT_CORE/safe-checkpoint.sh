#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  NOIZY Empire — SAFE CHECKPOINT
#  Commits your working tree on the CURRENT branch after scanning for secrets.
#  It does NOT push, force, rebase, or touch history. Worst case: it refuses.
#
#  Usage:
#     bash safe-checkpoint.sh                 # uses default repo path below
#     bash safe-checkpoint.sh /path/to/repo   # or point it at a repo
#     ALLOW_SECRETS=1 bash safe-checkpoint.sh # override the secret guard (NOT advised)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO="${1:-/Users/m2ultra/NOIZYANTHROPIC}"
TS="$(date '+%Y-%m-%d %H:%M')"

say()  { printf '%s\n' "$*"; }
rule() { printf '═%.0s' {1..62}; printf '\n'; }

rule
say "  NOIZY EMPIRE · SAFE CHECKPOINT"
say "  $TS"
rule

# 1) Validate repo ------------------------------------------------------------
if [[ ! -d "$REPO/.git" ]]; then
  say "✗ Not a git repo: $REPO"
  say "  Pass the correct path:  bash safe-checkpoint.sh /path/to/repo"
  exit 1
fi
cd "$REPO"

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
say "Repo:   $REPO"
say "Branch: $BRANCH"

# 2) Count changes ------------------------------------------------------------
CHANGED="$(git status --porcelain | wc -l | tr -d ' ')"
if [[ "$CHANGED" == "0" ]]; then
  say "✓ Working tree is already clean. Nothing to checkpoint."
  exit 0
fi
say "Pending changes: $CHANGED files"
rule

# 3) Secret guard — refuse to commit obvious credentials ----------------------
# Scans the *names* of changed files AND the staged diff for high-risk patterns.
say "Scanning changed files for secrets…"

# 3a. Risky filenames not covered by .gitignore
RISKY_NAMES="$(git status --porcelain \
  | awk '{ $1=""; sub(/^ /,""); print }' \
  | grep -Ei '(^|/)(\.env)([.][a-z]+)?$|\.(pem|key|p12|pfx|keystore)$|(^|/)(id_rsa|id_ed25519)$|secrets?\.(json|ya?ml|txt)$|credentials(\.json)?$|wrangler\.toml$' \
  || true)"

# 3b. High-entropy / token-looking content in the diff
RISKY_CONTENT="$(git diff --cached --no-color 2>/dev/null; git diff --no-color 2>/dev/null)"
CONTENT_HITS="$(printf '%s' "$RISKY_CONTENT" \
  | grep -Ein '(CLOUDFLARE_API_TOKEN|SOVEREIGNTY|HEAVEN_API_KEY|AWS_SECRET|PRIVATE KEY|BEGIN RSA|xox[baprs]-|sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16})' \
  | head -20 || true)"

BLOCK=0
if [[ -n "$RISKY_NAMES" ]]; then
  say "⚠  Risky FILES staged for commit:"
  printf '   • %s\n' $RISKY_NAMES
  BLOCK=1
fi
if [[ -n "$CONTENT_HITS" ]]; then
  say "⚠  Possible SECRETS inside the diff (line : match):"
  printf '%s\n' "$CONTENT_HITS" | sed 's/^/   /'
  BLOCK=1
fi

if [[ "$BLOCK" == "1" && "${ALLOW_SECRETS:-0}" != "1" ]]; then
  rule
  say "✗ CHECKPOINT ABORTED — potential secrets detected."
  say ""
  say "  Recommended fix before re-running:"
  say "    1. Add them to .gitignore:        echo '.env' >> .gitignore"
  say "    2. Unstage if already tracked:    git rm --cached <file>"
  say "    3. Re-run:                        bash safe-checkpoint.sh"
  say ""
  say "  To override anyway (only if you've reviewed every hit):"
  say "    ALLOW_SECRETS=1 bash safe-checkpoint.sh"
  exit 2
fi
say "✓ No obvious secrets detected."
rule

# 4) Snapshot a manifest (so the checkpoint is self-documenting) --------------
git status --porcelain > .checkpoint-manifest.txt
say "Wrote .checkpoint-manifest.txt ($CHANGED entries)"

# 5) Commit (no push) ---------------------------------------------------------
git add -A
git commit -m "checkpoint: $TS — $CHANGED files (safe-checkpoint.sh)" \
           -m "Automated safety checkpoint. No push/rebase. Secret scan passed." \
  || { say "✗ commit failed"; exit 3; }

NEW="$(git rev-parse --short HEAD)"
rule
say "✓ CHECKPOINT COMPLETE"
say "  Commit:  $NEW  on  $BRANCH"
say "  Pushed:  NO (local only — review, then 'git push' when ready)"
rule
say "Undo this checkpoint (keep your files):   git reset --soft HEAD~1"
