#!/usr/bin/env python3
import sys
import argparse
from pathlib import Path

HERE = Path(__file__).resolve()
ROOT = HERE.parent.parent  # project root

if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

try:
    from ingest.ingest_stems import run_ingestion_canary
except ImportError as e:
    print("❌ [ERROR] Could not import ingest.ingest_stems")
    print(f"   Python path: {sys.path}")
    print(f"   Import error: {e}")
    sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="NOIZY Audio RAG Orchestrator")
    subparsers = parser.add_subparsers(dest="command", required=True)

    sync_p = subparsers.add_parser("sync", help="Sync audio stems to local FAISS and Firestore")
    sync_p.add_argument("--input", required=True, help="Target directory of raw stems")
    sync_p.add_argument("--canary", type=int, default=50, help="Absolute limit for stems to process")
    sync_p.add_argument("--dry-run", action="store_true", help="Execute without actual mutations")

    args = parser.parse_args()

    if args.command == "sync":
        run_ingestion_canary(args.input, limit=args.canary, dry_run=args.dry_run)

if __name__ == "__main__":
    main()
