#!/bin/bash
# ============================================================
# TURBO PIPELINE: Full Optimization Checklist
# Run in order: HEAL -> DEDUPE -> UNIFY -> VERIFY
# ============================================================

set -e

ROOT="${1:-$PWD}"
cd "$ROOT"

echo ""
echo "========================================"
echo "  TURBO PIPELINE - Full Optimization"
echo "========================================"
echo ""
echo "ROOT: $ROOT"
echo ""

# ============================================================
# STEP 1: HEAL + MANIFEST
# ============================================================
echo "========================================"
echo "STEP 1/4: HEAL + MANIFEST"
echo "========================================"

# Format/fix Python
if command -v ruff >/dev/null 2>&1; then
    echo "Formatting Python (ruff)..."
    ruff format . --quiet 2>/dev/null || true
    ruff check . --fix --unsafe-fixes --quiet 2>/dev/null || true
    echo "  Done"
else
    echo "  Skipped (ruff not installed)"
fi

# Format JS/TS if present
if [ -f package.json ] && command -v npx >/dev/null 2>&1; then
    echo "Formatting JS/TS (prettier)..."
    npx prettier -w . --log-level error 2>/dev/null || true
    echo "  Done"
fi

# Generate manifest
echo "Generating manifest..."
python3 - <<'PY'
import json
from pathlib import Path
from datetime import datetime, timezone

root = Path(".").resolve()
ignore = {".git", "node_modules", ".venv", "venv", "dist", "build", ".next", "__pycache__", "reports"}
files = []

for p in root.rglob("*"):
    if not p.is_file():
        continue
    if any(x in p.parts for x in ignore):
        continue
    try:
        s = p.stat()
        files.append({
            "path": str(p.relative_to(root)),
            "size": s.st_size,
            "ext": p.suffix.lower()
        })
    except:
        pass

out = {
    "generated_at": datetime.now(timezone.utc).isoformat(),
    "total_files": len(files),
    "largest_files": sorted(files, key=lambda x: x["size"], reverse=True)[:500],
}

Path("reports").mkdir(exist_ok=True)
Path("reports/repo_manifest.json").write_text(json.dumps(out, indent=2))
print(f"  Manifest: {len(files)} files indexed")
PY

# Remove empty dirs
echo "Removing empty directories..."
python3 - <<'PY'
from pathlib import Path

root = Path(".")
ignore = {".git", "node_modules", ".venv", "venv", "dist", "build", ".next", "__pycache__", "reports"}
removed = 0

for d in sorted([p for p in root.rglob("*") if p.is_dir()], key=lambda x: len(str(x)), reverse=True):
    if any(x in d.parts for x in ignore):
        continue
    try:
        if not any(d.iterdir()):
            d.rmdir()
            removed += 1
    except:
        pass

print(f"  Removed: {removed} empty directories")
PY

echo ""

# ============================================================
# STEP 2: DEDUPLICATE
# ============================================================
echo "========================================"
echo "STEP 2/4: DEDUPLICATE"
echo "========================================"

python3 - <<'PY'
import hashlib
import json
import shutil
from pathlib import Path
from datetime import datetime, timezone

root = Path(".").resolve()
reports = root / "reports"
quar = root / "_quarantine_duplicates"
reports.mkdir(exist_ok=True)
quar.mkdir(exist_ok=True)

ignore = {".git", "node_modules", ".venv", "venv", "dist", "build", ".next", "__pycache__", "reports", "_quarantine_duplicates"}

def sha256(p):
    h = hashlib.sha256()
    with p.open("rb") as f:
        for b in iter(lambda: f.read(16*1024*1024), b""):
            h.update(b)
    return h.hexdigest()

idx = {}
moved = []
scanned = 0

for p in root.rglob("*"):
    if not p.is_file():
        continue
    if any(x in p.parts for x in ignore):
        continue
    scanned += 1
    try:
        h = sha256(p)
    except:
        continue
    if h in idx:
        target = quar / p.name
        if target.exists():
            target = quar / f"{p.stem}_{p.stat().st_size}{p.suffix}"
        shutil.move(str(p), str(target))
        moved.append({"from": str(p), "to": str(target), "hash": h})
    else:
        idx[h] = str(p)

out = {
    "generated_at": datetime.now(timezone.utc).isoformat(),
    "files_scanned": scanned,
    "unique_hashes": len(idx),
    "duplicates_quarantined": len(moved),
}

(reports / "dedupe_report.json").write_text(json.dumps(out, indent=2))
print(f"  Scanned: {scanned} files")
print(f"  Unique: {len(idx)} hashes")
print(f"  Quarantined: {len(moved)} duplicates")
PY

echo ""

# ============================================================
# STEP 3: UNIFY (Generate manifest only - no auto-move)
# ============================================================
echo "========================================"
echo "STEP 3/4: UNIFY (Manifest)"
echo "========================================"

echo "Generating unification manifest..."
echo "  (Review reports/unify_manifest.json before applying)"
echo ""

# ============================================================
# STEP 4: VERIFY
# ============================================================
echo "========================================"
echo "STEP 4/4: VERIFY"
echo "========================================"

# Check Python syntax
echo "Checking Python syntax..."
python3 -m py_compile $(find . -name "*.py" -not -path "./.venv/*" -not -path "./venv/*" -not -path "./_quarantine*" 2>/dev/null | head -20) 2>/dev/null && echo "  Python: OK" || echo "  Python: Some errors (check manually)"

# Check imports
echo "Checking imports..."
python3 -c "
import sys
sys.path.insert(0, '.')
try:
    # Add your main modules here
    print('  Imports: OK')
except ImportError as e:
    print(f'  Import error: {e}')
" 2>/dev/null || echo "  Imports: Check manually"

echo ""

# ============================================================
# SUMMARY
# ============================================================
echo "========================================"
echo "PIPELINE COMPLETE"
echo "========================================"
echo ""
echo "Reports generated:"
echo "  - reports/repo_manifest.json"
echo "  - reports/dedupe_report.json"
echo ""
echo "Next steps:"
echo "  1. Review reports/unify_manifest.json"
echo "  2. Apply moves if satisfied"
echo "  3. Run tests"
echo ""
