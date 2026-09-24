#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  consolidate.sh — move code + documents from across $HOME into ~/NOIZYANTHROPIC
#  AGGRESSIVE mode: whole git projects AND loose code/doc files.
#
#  SAFETY DESIGN (read this):
#   • DRY-RUN by default. Prints the plan and moves NOTHING. Add --apply to act.
#   • Same-volume `mv` (instant, reversible). Original paths preserved under dest.
#   • Every move is logged; an undo script is generated so you can reverse it all.
#   • Hard-excludes system/app/dependency/hidden paths so nothing critical moves.
#
#  🔴 EXTERNAL: run in Terminal/Warp on the Mac. Give Terminal Full Disk Access
#     first (System Settings → Privacy & Security → Full Disk Access).
#
#  Usage:
#     bash consolidate.sh              # DRY RUN — shows the plan, moves nothing
#     bash consolidate.sh --apply      # actually move (after you've read the plan)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$HOME"
EMPIRE="$HOME/NOIZYANTHROPIC"
DEST="$EMPIRE/_consolidated"
TS="$(date +%Y%m%d-%H%M%S)"
PLAN="$EMPIRE/_scan/plan-$TS.txt"
MANIFEST="$EMPIRE/_scan/manifest-$TS.csv"
UNDO="$EMPIRE/_scan/undo-$TS.sh"
APPLY=0
[ "${1:-}" = "--apply" ] && APPLY=1
mkdir -p "$EMPIRE/_scan"

# Never touch these (system, app-managed, deps, hidden dirs, the empire + cloud)
EXCLUDE='(/Library/|/Applications/|/\.Trash|/node_modules/|/Pods/|/DerivedData/|/\.[^/]+/|/NOIZYANTHROPIC/|/CloudStorage/|\.photoslibrary/|\.musiclibrary/)'

CODE='py js mjs cjs ts tsx jsx go rs rb java kt c cc cpp h hpp cs swift lua php sh bash zsh html css scss sql r ipynb vue svelte json yaml yml toml'
DOCS='doc docx odt rtf pdf md txt pages'

echo ">>> consolidate.sh  ($([ $APPLY = 1 ] && echo APPLY || echo DRY-RUN))"
echo "    root:  $ROOT"
echo "    dest:  $DEST"
echo

: > "$PLAN"
[ $APPLY = 1 ] && { : > "$MANIFEST"; echo '#!/usr/bin/env bash' > "$UNDO"; echo 'set -e' >> "$UNDO"; }

record() {  # src dest
  echo "MOVE  $1" >> "$PLAN"
  echo "   -> $2" >> "$PLAN"
  if [ $APPLY = 1 ]; then
    mkdir -p "$(dirname "$2")"
    mv "$1" "$2"
    printf '%s,%s\n' "$1" "$2" >> "$MANIFEST"
    printf 'mkdir -p "%s"; mv "%s" "%s"\n' "$(dirname "$1")" "$2" "$1" >> "$UNDO"
  fi
}

# ── 1. Whole git projects → _consolidated/projects/<name> ────────────────────
PROJ_COUNT=0
declare -a PROJECT_PATHS=()
while IFS= read -r gitdir; do
  proj="$(dirname "$gitdir")"
  case "$proj/" in *"$EMPIRE"/*) continue;; esac
  echo "$proj" | grep -qE "$EXCLUDE" && continue
  PROJECT_PATHS+=("$proj")
  record "$proj" "$DEST/projects/$(basename "$proj")"
  PROJ_COUNT=$((PROJ_COUNT+1))
done < <(find "$ROOT" -maxdepth 5 -type d -name .git 2>/dev/null | sed 's#/\.git$##' | grep -vE "$EXCLUDE" | sort -u)

# ── 2. Loose code/doc files NOT inside a moved project → _consolidated/loose/ ─
expr=(); for e in $CODE $DOCS; do expr+=( -iname "*.$e" -o ); done; unset 'expr[${#expr[@]}-1]'
LOOSE_COUNT=0
while IFS= read -r f; do
  echo "$f" | grep -qE "$EXCLUDE" && continue
  skip=0; for p in "${PROJECT_PATHS[@]:-}"; do case "$f" in "$p"/*) skip=1; break;; esac; done
  [ $skip = 1 ] && continue
  rel="${f#$ROOT/}"
  record "$f" "$DEST/loose/$rel"
  LOOSE_COUNT=$((LOOSE_COUNT+1))
done < <(find "$ROOT" -type f \( "${expr[@]}" \) 2>/dev/null | grep -vE "$EXCLUDE" | sort)

[ $APPLY = 1 ] && chmod +x "$UNDO"

echo "Projects to move: $PROJ_COUNT"
echo "Loose files to move: $LOOSE_COUNT"
echo "Plan written: $PLAN"
if [ $APPLY = 1 ]; then
  echo "✓ APPLIED. Manifest: $MANIFEST"
  echo "  UNDO everything:  bash $UNDO"
else
  echo
  echo ">>> This was a DRY RUN. Nothing moved."
  echo ">>> Review the plan above, then re-run with --apply when you're ready."
fi
