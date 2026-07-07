#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<EOF
Usage: $0 [SOURCE_ROOT] [TARGET_ROOT] [DRY_RUN]

SOURCE_ROOT defaults to /Users/m2ultra/Library/CloudStorage/GoogleDrive-rsplowman@icloud.com/My Drive/NOIZYLAB_WORKSPACES
TARGET_ROOT defaults to SOURCE_ROOT/../NOIZYANTHROPIC
DRY_RUN defaults to true

Example:
  $0 "/Users/.../NOIZYLAB_WORKSPACES" "/path/to/NOIZYANTHROPIC" false
EOF
}

SOURCE_ROOT="${1:-/Users/m2ultra/Library/CloudStorage/GoogleDrive-rsplowman@icloud.com/My Drive/NOIZYLAB_WORKSPACES}"
TARGET_ROOT="${2:-$(dirname "$SOURCE_ROOT")/NOIZYANTHROPIC}"
DRY_RUN="${3:-true}"

if [ "$DRY_RUN" != "true" ] && [ "$DRY_RUN" != "false" ]; then
  echo "DRY_RUN must be true or false"
  usage
  exit 1
fi

if [ ! -d "$SOURCE_ROOT" ]; then
  echo "Source root not found: $SOURCE_ROOT"
  exit 1
fi

mkdir -p "$TARGET_ROOT" "$TARGET_ROOT/agents" "$TARGET_ROOT/projects" "$TARGET_ROOT/platform" "$TARGET_ROOT/infrastructure" "$TARGET_ROOT/docs" "$TARGET_ROOT/scripts" "$TARGET_ROOT/deploy" "$TARGET_ROOT/data" "$TARGET_ROOT/media" "$TARGET_ROOT/archive" "$TARGET_ROOT/tools" "$TARGET_ROOT/tests"

log_file="$TARGET_ROOT/scripts/organize_projects_$(date +%Y%m%d_%H%M%S).log"

printf "Source: %s\nTarget: %s\nDry run: %s\nLog: %s\n" "$SOURCE_ROOT" "$TARGET_ROOT" "$DRY_RUN" "$log_file"
printf "BEGIN ORGANIZATION\n" > "$log_file"

for item in "$SOURCE_ROOT"/*; do
  [ ! -e "$item" ] && continue
  name=$(basename "$item")
  if [ "$item" = "$TARGET_ROOT" ]; then
    printf "SKIP target root: %s\n" "$item" | tee -a "$log_file"
    continue
  fi

  if [ -d "$item/.git" ] || [ -f "$item/.git" ]; then
    dst="$TARGET_ROOT/agents/$name"
  elif [ -d "$item" ] && find "$item" -maxdepth 3 -type f \( -iname '*.py' -o -iname '*.js' -o -iname '*.ts' -o -iname '*.go' -o -iname '*.rs' -o -iname '*.java' -o -iname '*.sh' \) | read; then
    dst="$TARGET_ROOT/projects/$name"
  elif [ -d "$item" ] && find "$item" -maxdepth 3 -type f \( -iname '*.md' -o -iname '*.pdf' -o -iname '*.txt' -o -iname '*.yaml' -o -iname '*.yml' -o -iname '*.json' \) | read; then
    dst="$TARGET_ROOT/docs/$name"
  elif [ -d "$item" ] && find "$item" -maxdepth 3 -type f \( -iname '*.tf' -o -iname '*.yml' -o -iname '*.yaml' \) | read; then
    dst="$TARGET_ROOT/infrastructure/$name"
  elif [ -d "$item" ] && find "$item" -maxdepth 3 -type f \( -iname '*.csv' -o -iname '*.db' -o -iname '*.sqlite' \) | read; then
    dst="$TARGET_ROOT/data/$name"
  elif [ -d "$item" ] && find "$item" -maxdepth 3 -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.mp4' -o -iname '*.mov' \) | read; then
    dst="$TARGET_ROOT/media/$name"
  else
    dst="$TARGET_ROOT/archive/$name"
  fi

  if [ -e "$dst" ]; then
    dst="$TARGET_ROOT/archive/${name}_dup_$(date +%Y%m%d_%H%M%S)"
  fi

  printf "POTENTIAL MOVE: %s -> %s\n" "$item" "$dst" | tee -a "$log_file"
  if [ "$DRY_RUN" = false ]; then
    mv -n "$item" "$dst"
    printf "MOVED: %s -> %s\n" "$item" "$dst" | tee -a "$log_file"
  fi
done

printf "END ORGANIZATION\n" | tee -a "$log_file"
