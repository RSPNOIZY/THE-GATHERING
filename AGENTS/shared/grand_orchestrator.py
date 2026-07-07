#!/usr/bin/env python3
"""
THE GRAND ORCHESTRATOR — Master cmd for NOIZY doc vacuum & routing
GABRIEL calls this. n8n calls this. Both trigger the full pipeline.

Usage:
    python3 grand_orchestrator.py                    # full dry-run catalog
    python3 grand_orchestrator.py --execute          # actually route files
    python3 grand_orchestrator.py --search QUERY     # search existing catalog
    python3 grand_orchestrator.py --stats            # show catalog stats
    python3 grand_orchestrator.py --status           # live scan status
    python3 grand_orchestrator.py --expose-api       # start searchable endpoint
"""

import os
import sys
import json
import argparse
import subprocess
from pathlib import Path
from datetime import datetime

HOME = Path.home()
EMPIRE_ROOT = HOME / "NOIZY_EMPIRE"
ARCHIVIST = HOME / "NOIZYLAB" / "tools" / "archivist.py"
CATALOG = EMPIRE_ROOT / ".archivist_catalog.json"

def run_archivist(execute=False, force=False):
    """Execute archivist.py and return catalog."""
    cmd = [
        "python3",
        str(ARCHIVIST),
        "--output", str(CATALOG),
        "--empire-root", str(EMPIRE_ROOT),
        "--report",
    ]
    if execute:
        cmd.append("--execute")

    print(f"\n{'='*70}")
    print(f"  GRAND ORCHESTRATOR — Starting Doc Vacuum")
    print(f"  Mode: {'EXECUTE' if execute else 'DRY-RUN (catalog only)'}")
    print(f"  Empire root: {EMPIRE_ROOT}")
    print(f"  Catalog: {CATALOG}")
    print(f"{'='*70}\n")

    result = subprocess.run(cmd, capture_output=True, text=True)
    print(result.stdout)
    if result.returncode != 0:
        print(f"ERROR: {result.stderr}")
        return None

    if CATALOG.exists():
        return json.load(open(CATALOG))
    return None


def search_catalog(query, project=None, limit=20):
    """Search the existing catalog."""
    if not CATALOG.exists():
        print(f"❌ Catalog not found at {CATALOG}")
        print("   Run: grand_orchestrator.py (no args) to generate it")
        return

    catalog = json.load(open(CATALOG))
    files = catalog.get("files", [])

    query_lower = query.lower()
    results = [
        f for f in files
        if query_lower in f["filename"].lower()
        or query_lower in f["source"].lower()
        or (project and f["project"] != project)
    ]

    if project:
        results = [r for r in results if r["project"] == project]

    results = results[:limit]

    print(f"\n{'='*70}")
    print(f"  SEARCH: '{query}'")
    if project:
        print(f"  Project: {project}")
    print(f"  Found: {len(results)}")
    print(f"{'='*70}\n")

    for r in results:
        print(f"  [{r['project']:25s}] {r['filename']}")
        print(f"    Source: {r['source']}")
        print(f"    Dest:   {r['dest']}")
        print(f"    Confidence: {r['confidence']}\n")


def show_stats():
    """Display catalog statistics."""
    if not CATALOG.exists():
        print("❌ Catalog not found")
        return

    catalog = json.load(open(CATALOG))

    print(f"\n{'='*70}")
    print(f"  CATALOG STATISTICS")
    print(f"  Generated: {catalog.get('generated_at', 'unknown')}")
    print(f"{'='*70}\n")

    stats = catalog.get("stats", {})
    print(f"  Total files scanned:    {stats.get('total', 0)}")
    print(f"  Successfully classified: {stats.get('classified', 0)}")
    print(f"  Unclassified:            {stats.get('unclassified', 0)}")
    print(f"  Conflicts (ties):        {stats.get('conflicts', 0)}")
    print(f"  Duplicates found:        {stats.get('duplicates', 0)}")

    print(f"\n  BY PROJECT:")
    project_counts = catalog.get("project_counts", {})
    for proj, count in sorted(project_counts.items(), key=lambda x: -x[1]):
        pct = (count / stats.get('total', 1)) * 100
        print(f"    {proj:30s} {count:4d} files ({pct:5.1f}%)")


def expose_api(port=9099):
    """Start a local HTTP server with doc search endpoint."""
    try:
        from http.server import HTTPServer, BaseHTTPRequestHandler
        import json
        import urllib.parse

        CATALOG_DATA = None
        if CATALOG.exists():
            CATALOG_DATA = json.load(open(CATALOG))

        class DocSearchHandler(BaseHTTPRequestHandler):
            def do_GET(self):
                parsed_path = urllib.parse.urlparse(self.path)

                if parsed_path.path == "/health":
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({"status": "ok", "catalog_loaded": CATALOG_DATA is not None}).encode())
                    return

                if parsed_path.path.startswith("/search"):
                    query = urllib.parse.parse_qs(parsed_path.query).get("q", [""])[0]
                    project = urllib.parse.parse_qs(parsed_path.query).get("project", [None])[0]
                    limit = int(urllib.parse.parse_qs(parsed_path.query).get("limit", ["20"])[0])

                    if not CATALOG_DATA:
                        self.send_response(404)
                        self.send_header("Content-Type", "application/json")
                        self.end_headers()
                        self.wfile.write(json.dumps({"error": "Catalog not found"}).encode())
                        return

                    files = CATALOG_DATA.get("files", [])
                    query_lower = query.lower()
                    results = [
                        f for f in files
                        if query_lower in f["filename"].lower()
                        or query_lower in f["source"].lower()
                    ]
                    if project:
                        results = [r for r in results if r["project"] == project]

                    results = results[:limit]

                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    response = {
                        "query": query,
                        "project_filter": project,
                        "found": len(results),
                        "results": results
                    }
                    self.wfile.write(json.dumps(response, indent=2).encode())
                    return

                self.send_response(404)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Not found"}).encode())

            def log_message(self, format, *args):
                pass  # silence logs

        server = HTTPServer(("127.0.0.1", port), DocSearchHandler)
        print(f"\n{'='*70}")
        print(f"  DOC SEARCH API — ONLINE")
        print(f"{'='*70}")
        print(f"  Listening: http://127.0.0.1:{port}")
        print(f"  Health:    GET http://127.0.0.1:{port}/health")
        print(f"  Search:    GET http://127.0.0.1:{port}/search?q=QUERY[&project=PROJECT][&limit=20]")
        print(f"\n  Examples:")
        print(f"    curl 'http://127.0.0.1:{port}/search?q=NOIZYVOX'")
        print(f"    curl 'http://127.0.0.1:{port}/search?q=vocal&project=GABRIEL'")
        print(f"\n  Press Ctrl+C to stop.\n")

        server.serve_forever()
    except KeyboardInterrupt:
        print("\n\nShutdown.")


def main():
    parser = argparse.ArgumentParser(
        description="THE GRAND ORCHESTRATOR — NOIZY Empire doc sync & search"
    )
    parser.add_argument("--execute", action="store_true",
                        help="Actually move files (default: dry-run)")
    parser.add_argument("--force", action="store_true",
                        help="Force full re-scan")
    parser.add_argument("--search", type=str,
                        help="Search catalog by keyword")
    parser.add_argument("--project", type=str,
                        help="Filter search by project")
    parser.add_argument("--stats", action="store_true",
                        help="Show catalog statistics")
    parser.add_argument("--expose-api", action="store_true",
                        help="Start searchable HTTP endpoint")
    parser.add_argument("--port", type=int, default=9099,
                        help="Port for API endpoint (default: 9099)")
    args = parser.parse_args()

    if args.search:
        search_catalog(args.search, args.project)
    elif args.stats:
        show_stats()
    elif args.expose_api:
        expose_api(args.port)
    else:
        catalog = run_archivist(execute=args.execute, force=args.force)
        if catalog and args.execute:
            print(f"\n✅ Docs organized into {EMPIRE_ROOT}")


if __name__ == "__main__":
    main()
