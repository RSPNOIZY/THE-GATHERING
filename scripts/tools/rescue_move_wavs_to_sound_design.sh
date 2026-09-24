#!/usr/bin/env zsh
set -euo pipefail

stamp="2026-06-08"
manifest_dir="/Users/m2ultra/_rescue_manifests"
dest="/Volumes/SOUND_DESIGN/M2ULTRA_WAV_RESCUE_${stamp}"
manifest="${manifest_dir}/wav_manifest_${stamp}.null"
report="${manifest_dir}/wav_manifest_${stamp}.txt"

mkdir -p "$manifest_dir" "$dest"

: > "$manifest"

sources=(
  "/Users/m2ultra/Desktop"
  "/Users/m2ultra/Documents"
  "/Users/m2ultra/Downloads"
  "/Users/m2ultra/Music"
  "/Users/m2ultra/Movies"
  "/Users/m2ultra/Library/CloudStorage"
)

for source in "${sources[@]}"; do
  [[ -d "$source" ]] || continue
  find "$source" -type f -iname '*.wav' \
    ! -path '*/.Trash/*' \
    ! -path '*/node_modules/*' \
    ! -path '*/site-packages/*' \
    ! -path '*/venv/*' \
    ! -path '*/.venv/*' \
    ! -path '*/Steam.AppBundle/*' \
    ! -path '*/GitHub Desktop.app/*' \
    -print0 >> "$manifest"
done

python3 - "$manifest" "$report" <<'PY'
import os
import sys

manifest, report = sys.argv[1], sys.argv[2]
with open(manifest, "rb") as f:
    paths = [p.decode("utf-8", "surrogateescape") for p in f.read().split(b"\0") if p]

total = 0
rows = []
for path in paths:
    try:
        size = os.path.getsize(path)
    except OSError:
        size = 0
    total += size
    rows.append((size, path))

with open(report, "w", encoding="utf-8") as f:
    f.write(f"count\t{len(rows)}\n")
    f.write(f"bytes\t{total}\n")
    for size, path in sorted(rows, reverse=True):
        f.write(f"{size}\t{path}\n")

print(f"Manifest: {manifest}")
print(f"Report: {report}")
print(f"Count: {len(rows)}")
print(f"Bytes: {total}")
PY

rsync -aR --remove-source-files --from0 --files-from="$manifest" / "$dest/"

find "/Users/m2ultra/Desktop" "/Users/m2ultra/Documents" "/Users/m2ultra/Downloads" "/Users/m2ultra/Music" "/Users/m2ultra/Movies" "/Users/m2ultra/Library/CloudStorage" \
  -depth -type d -empty \
  ! -path "/Users/m2ultra/Library/CloudStorage" \
  ! -path "/Users/m2ultra/Library/CloudStorage/*/My Drive" \
  -delete 2>/dev/null || true

echo "Moved WAV files into: $dest"
df -h /System/Volumes/Data /Volumes/SOUND_DESIGN
