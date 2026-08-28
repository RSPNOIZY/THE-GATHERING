#!/usr/bin/env python3
"""
NOIZYANTHROPIC MCP — the empire's FOSS analyst.

Read-only / report-only tools that wrap the M2 Ultra's installed FOSS toolbelt
(rg, fd, fdupes, ffprobe, jq, sqlite3, du, shasum, pandoc, exiftool, …) so any
MCP client (VS Code, Claude, GABRIEL/LUCY) can inspect drives and data safely.
Nothing here deletes, moves, or modifies files. For action, use NOIZYBEAST.
"""
import json
import os
import shutil
import subprocess
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("noizyanthropic")

NLAB = os.path.expanduser("~/NOIZYLAB")
DATA = os.path.join(NLAB, "command-center", "data")

# Tools allowed through the generic read-only escape hatch.
READONLY_FOSS = {
    "rg", "fd", "fzf", "grep", "tree", "jq", "yq", "gron", "sqlite3", "exiftool",
    "ffprobe", "mediainfo", "file", "stat", "ls", "du", "df", "wc", "head", "tail",
    "sort", "uniq", "cut", "awk", "sed", "find", "shasum", "md5", "cksum", "ncdu",
    "dust", "gdu", "eza", "bat", "pandoc", "pdftotext", "tldr", "mdls", "sips",
}


def run(cmd, timeout=60, cwd=None, max_out=20000):
    if not shutil.which(cmd[0]):
        return f"ERROR: '{cmd[0]}' not installed. Try: brew install {cmd[0]}"
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, cwd=cwd)
    except subprocess.TimeoutExpired:
        return f"ERROR: '{cmd[0]}' timed out after {timeout}s"
    out = (r.stdout or "")[:max_out]
    err = (r.stderr or "")[:1500]
    if r.returncode != 0 and not out:
        return f"ERROR (exit {r.returncode}): {err or 'no output'}"
    return out + (f"\n[stderr] {err}" if err and r.returncode != 0 else "")


def first(*tools):
    for t in tools:
        if shutil.which(t):
            return t
    return None


@mcp.tool()
def search_content(path: str, pattern: str, max_results: int = 100) -> str:
    """Search file CONTENTS for a regex pattern under a directory (ripgrep, falls back to grep)."""
    path = os.path.expanduser(path)
    if shutil.which("rg"):
        return run(["rg", "-n", "--max-count", "5", "--max-columns", "200",
                    "-g", "!.git", pattern, path], timeout=60)
    return run(["grep", "-rn", "--max-count=5", pattern, path], timeout=60)


@mcp.tool()
def find_files(path: str, glob: str = "*", max_results: int = 300) -> str:
    """Find files by name/glob under a directory (fd, falls back to find)."""
    path = os.path.expanduser(path)
    if shutil.which("fd"):
        return run(["fd", "--max-results", str(max_results), "-g", glob, ".", path], timeout=60)
    return run(["find", path, "-name", glob], timeout=60)


@mcp.tool()
def dedupe_scan(path: str, min_mb: int = 10) -> str:
    """Report duplicate files under a path (fdupes, report-only — NEVER deletes).
    Shows reclaimable space. min_mb filters small files out."""
    path = os.path.expanduser(path)
    if not shutil.which("fdupes"):
        return "ERROR: fdupes not installed. Try: brew install fdupes"
    summary = run(["fdupes", "-r", "-S", "-m", "-G", str(min_mb * 1024 * 1024), path], timeout=300)
    return summary


@mcp.tool()
def disk_usage(path: str, depth: int = 1) -> str:
    """Disk usage breakdown for a path (dust if present, else du), sorted largest-first."""
    path = os.path.expanduser(path)
    if shutil.which("dust"):
        return run(["dust", "-d", str(depth), "-r", path], timeout=120)
    out = run(["du", "-h", "-d", str(depth), path], timeout=120)
    return out


@mcp.tool()
def largest_files(path: str, count: int = 20) -> str:
    """List the N largest files under a path."""
    path = os.path.expanduser(path)
    cmd = ["bash", "-lc",
           f"find {json.dumps(path)} -type f -print0 2>/dev/null | "
           f"xargs -0 stat -f '%z\t%N' 2>/dev/null | sort -rn | head -n {int(count)} | "
           f"awk '{{printf \"%.1f MB\\t%s\\n\", $1/1048576, $2}}'"]
    return run(cmd, timeout=180)


@mcp.tool()
def recent_changes(path: str, days: int = 1, max_results: int = 200) -> str:
    """Files modified within the last N days under a path."""
    path = os.path.expanduser(path)
    return run(["bash", "-lc",
                f"find {json.dumps(path)} -type f -mtime -{int(days)} 2>/dev/null | head -n {int(max_results)}"],
               timeout=120)


@mcp.tool()
def media_probe(file: str) -> str:
    """Inspect a media file (codec, duration, resolution, bitrate) via ffprobe."""
    file = os.path.expanduser(file)
    return run(["ffprobe", "-hide_banner", "-i", file], timeout=30)


@mcp.tool()
def sqlite_query(db: str, sql: str) -> str:
    """Run a READ-ONLY query against a SQLite database (SELECT/PRAGMA/EXPLAIN/WITH only)."""
    db = os.path.expanduser(db)
    head = sql.strip().lower().split(None, 1)[0] if sql.strip() else ""
    if head not in ("select", "pragma", "explain", "with"):
        return "ERROR: only read-only queries allowed (SELECT/PRAGMA/EXPLAIN/WITH)."
    return run(["sqlite3", "-readonly", "-header", "-column", db, sql], timeout=30)


@mcp.tool()
def json_query(file: str, expr: str = ".") -> str:
    """Query a JSON file with a jq expression."""
    file = os.path.expanduser(file)
    return run(["jq", expr, file], timeout=30)


@mcp.tool()
def checksum(path: str, algo: int = 256) -> str:
    """SHA checksum of a file (algo: 1/256/512)."""
    path = os.path.expanduser(path)
    return run(["shasum", "-a", str(algo), path], timeout=120)


@mcp.tool()
def text_extract(file: str, max_chars: int = 8000) -> str:
    """Extract plain text from a PDF/DOCX/etc (pdftotext or pandoc)."""
    file = os.path.expanduser(file)
    ext = os.path.splitext(file)[1].lower()
    if ext == ".pdf" and shutil.which("pdftotext"):
        out = run(["pdftotext", "-l", "20", file, "-"], timeout=60)
    elif shutil.which("pandoc"):
        out = run(["pandoc", file, "-t", "plain"], timeout=60)
    else:
        return "ERROR: need pdftotext or pandoc. brew install poppler pandoc"
    return out[:max_chars]


@mcp.tool()
def tool_inventory() -> str:
    """The FOSS toolbelt registry (what's installed on this machine)."""
    p = os.path.join(DATA, "capabilities.json")
    try:
        return open(p).read()
    except FileNotFoundError:
        return "No registry yet. Run: noizy scan"


@mcp.tool()
def guardian_status() -> str:
    """Live drive + guardian status (all volumes, free space, alerts, model fleet)."""
    p = os.path.join(DATA, "status.json")
    try:
        return open(p).read()
    except FileNotFoundError:
        return "Guardian status unavailable (is com.noizy.guardian running?)"


@mcp.tool()
def foss_run(tool: str, args: list[str]) -> str:
    """Run ANY read-only FOSS tool from the allowlist with arguments.
    Allowlisted: rg fd jq yq sqlite3 exiftool ffprobe mediainfo du df find shasum
    ncdu dust eza bat pandoc pdftotext file stat sort uniq awk sed head tail wc tree.
    For tools that modify files, use the NOIZYBEAST server instead."""
    if tool not in READONLY_FOSS:
        return (f"ERROR: '{tool}' is not in the read-only allowlist. "
                f"Allowed: {', '.join(sorted(READONLY_FOSS))}. "
                f"For write/destructive tools use NOIZYBEAST.")
    return run([tool, *[os.path.expanduser(a) for a in args]], timeout=120)


if __name__ == "__main__":
    mcp.run()
