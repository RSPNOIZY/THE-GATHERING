#!/usr/bin/env python3
"""
gabriel_ledger.py
THE LEDGER — Gabriel Core v1
NOIZY Empire / RSP_001

"Gabriel does not 'run scripts.'
 Gabriel creates, approves, runs, verifies, and records jobs."

Every scan, tag, move, summary, embedding, thumbnail, and backup
becomes a tracked job with:
  - status       → created | approved | running | done | failed | quarantined | rolled_back
  - timestamp    → created_at, approved_at, started_at, finished_at
  - target       → file path, volume, or directory
  - result       → outcome, files touched, bytes processed
  - error        → exception, traceback, retry count
  - rollback     → what to undo and how

BACKEND: DuckDB 1.5.4 (columnar, fast, no server, zero deps)
SCHEMA:  append-only (jobs never deleted — audit trail is sacred)
SAFETY:  write operations require approval before execution

USAGE:
  ledger = Ledger()

  # Create a job
  jid = ledger.create("tag_file", target="/Volumes/6TB/track.wav",
                       recipe="apply_noizy_tags", approved_by="RSP_001")

  # Start it
  ledger.start(jid)

  # Finish it
  ledger.finish(jid, result={"tags_written": 7})

  # Query
  jobs = ledger.query(status="failed", limit=10)
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import time
import traceback
import uuid
from dataclasses import dataclass, field, asdict
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger("LEDGER")

try:
    import duckdb
    HAS_DUCKDB = True
except ImportError:
    HAS_DUCKDB = False
    logger.warning("LEDGER: duckdb not installed — pip install duckdb==1.5.4")


# ─────────────────────────────────────────────────────────────────────────────
# JOB STATUS
# ─────────────────────────────────────────────────────────────────────────────

class JobStatus(str, Enum):
    CREATED     = "created"      # job created, not yet approved
    APPROVED    = "approved"     # approved by RSP_001, queued for execution
    DRY_RUN     = "dry_run"      # simulated — no actual writes
    RUNNING     = "running"      # actively executing
    DONE        = "done"         # completed successfully
    FAILED      = "failed"       # failed, retry possible
    QUARANTINED = "quarantined"  # failed too many times, needs review
    ROLLED_BACK = "rolled_back"  # successfully undone
    CANCELLED   = "cancelled"    # cancelled before execution


class RiskLevel(str, Enum):
    READ     = "read"    # read-only — no approval needed
    TAG      = "tag"     # write metadata only — auto-approved
    WRITE    = "write"   # create/overwrite files — requires approval
    MOVE     = "move"    # move files — requires approval
    DELETE   = "delete"  # delete files — requires explicit approval + confirm
    CRITICAL = "critical" # system-level — requires RSP override


# ─────────────────────────────────────────────────────────────────────────────
# JOB RECORD
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class Job:
    """One tracked unit of work in the Ledger."""
    job_id:       str = field(default_factory=lambda: str(uuid.uuid4()))
    recipe:       str = ""          # allowed recipe name (e.g. "apply_noizy_tags")
    target:       str = ""          # file path, volume, or directory
    target_type:  str = "file"      # file | directory | volume | batch
    risk_level:   RiskLevel = RiskLevel.READ
    status:       JobStatus = JobStatus.CREATED
    dry_run:      bool = False

    # Provenance
    created_by:   str = "GABRIEL"
    approved_by:  Optional[str] = None
    pulse_mode:   str = "UNKNOWN"   # Studio | Overnight | Emergency | Quiet

    # Params
    params:       Dict[str, Any] = field(default_factory=dict)

    # Timestamps (Unix epoch float)
    created_at:   float = field(default_factory=time.time)
    approved_at:  Optional[float] = None
    started_at:   Optional[float] = None
    finished_at:  Optional[float] = None

    # Result
    result:        Optional[Dict[str, Any]] = None
    files_touched: int = 0
    bytes_processed: int = 0
    error:         Optional[str] = None
    error_trace:   Optional[str] = None
    retry_count:   int = 0
    max_retries:   int = 3

    # Rollback
    rollback_plan: Optional[str] = None  # JSON-encoded rollback instructions
    rolled_back:   bool = False

    # Signature (tamper-evident)
    signature:    str = ""


    def sign(self) -> "Job":
        """Compute a tamper-evident signature over job identity fields."""
        payload = f"{self.job_id}{self.recipe}{self.target}{self.created_at}"
        self.signature = hashlib.sha256(payload.encode()).hexdigest()[:16]
        return self

    @property
    def elapsed_ms(self) -> Optional[float]:
        if self.started_at and self.finished_at:
            return round((self.finished_at - self.started_at) * 1000, 1)
        return None

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["status"] = self.status.value
        d["risk_level"] = self.risk_level.value
        d["result"] = json.dumps(self.result) if self.result else None
        d["params"] = json.dumps(self.params) if self.params else None
        return d


# ─────────────────────────────────────────────────────────────────────────────
# ALLOWED RECIPES
# Recipe = what Gabriel is allowed to do. No ad-hoc shell commands.
# ─────────────────────────────────────────────────────────────────────────────

RECIPES: Dict[str, Dict[str, Any]] = {
    # ── READ ──────────────────────────────────────────────────────────────────
    "scan_volume": {
        "risk": RiskLevel.READ,
        "desc": "Scan a volume and count audio files",
        "auto_approve": True,
    },
    "analyze_file": {
        "risk": RiskLevel.READ,
        "desc": "Extract audio metadata and analysis from a single file",
        "auto_approve": True,
    },
    "checksum_file": {
        "risk": RiskLevel.READ,
        "desc": "Compute SHA256 + MD5 for a file",
        "auto_approve": True,
    },
    "find_duplicates": {
        "risk": RiskLevel.READ,
        "desc": "Find duplicate files by checksum",
        "auto_approve": True,
    },
    "spectrogram_thumbnail": {
        "risk": RiskLevel.READ,
        "desc": "Generate spectrogram PNG thumbnail",
        "auto_approve": True,
    },
    "search_catalogue": {
        "risk": RiskLevel.READ,
        "desc": "Query mc96_catalog.db",
        "auto_approve": True,
    },
    # ── TAG (write metadata only) ──────────────────────────────────────────────
    "apply_noizy_tags": {
        "risk": RiskLevel.TAG,
        "desc": "Write TagSpaces sidecar + NOIZY AI analysis sidecar",
        "auto_approve": True,   # metadata write, no audio touched
    },
    "write_isrc": {
        "risk": RiskLevel.TAG,
        "desc": "Embed ISRC code in audio file metadata (mutagen)",
        "auto_approve": True,
    },
    "update_catalogue": {
        "risk": RiskLevel.TAG,
        "desc": "Upsert file record in mc96_catalog.db",
        "auto_approve": True,
    },
    # ── WRITE (requires approval) ──────────────────────────────────────────────
    "convert_format": {
        "risk": RiskLevel.WRITE,
        "desc": "Convert audio file format (creates new file, keeps original)",
        "auto_approve": False,
    },
    "normalize_loudness": {
        "risk": RiskLevel.WRITE,
        "desc": "Apply loudness normalization to target LUFS",
        "auto_approve": False,
    },
    "generate_embedding": {
        "risk": RiskLevel.WRITE,
        "desc": "Write semantic audio embedding to DuckDB",
        "auto_approve": False,
    },
    # ── MOVE (requires approval) ───────────────────────────────────────────────
    "move_file": {
        "risk": RiskLevel.MOVE,
        "desc": "Move a file to a new location with rollback plan",
        "auto_approve": False,
    },
    "organize_by_project": {
        "risk": RiskLevel.MOVE,
        "desc": "Move files into project-based folder structure",
        "auto_approve": False,
    },
    # ── DELETE (explicit approval required) ───────────────────────────────────
    "quarantine_duplicate": {
        "risk": RiskLevel.DELETE,
        "desc": "Move duplicate to QUARANTINE folder (not permanent delete)",
        "auto_approve": False,
    },
    "purge_quarantine": {
        "risk": RiskLevel.CRITICAL,
        "desc": "Permanently delete files from QUARANTINE — IRREVERSIBLE",
        "auto_approve": False,
    },
    # ── BATCH ─────────────────────────────────────────────────────────────────
    "batch_vacuum": {
        "risk": RiskLevel.TAG,
        "desc": "Full pipeline: scan, analyze, checksum, tag, index for a directory",
        "auto_approve": True,
    },
    "nightly_lucy_analysis": {
        "risk": RiskLevel.READ,
        "desc": "Run Lucy's nightly analysis engine",
        "auto_approve": True,
    },
}


def get_recipe(name: str) -> Optional[Dict[str, Any]]:
    """Look up a recipe. None if not in the allowlist."""
    return RECIPES.get(name)


def is_allowed(recipe: str) -> bool:
    return recipe in RECIPES


def auto_approve(recipe: str) -> bool:
    r = get_recipe(recipe)
    return r.get("auto_approve", False) if r else False


# ─────────────────────────────────────────────────────────────────────────────
# LEDGER
# ─────────────────────────────────────────────────────────────────────────────

DB_PATH = Path.home() / "NOIZYLAB" / "ledger" / "gabriel_ledger.duckdb"

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS jobs (
    job_id          VARCHAR PRIMARY KEY,
    recipe          VARCHAR NOT NULL,
    target          VARCHAR NOT NULL,
    target_type     VARCHAR DEFAULT 'file',
    risk_level      VARCHAR NOT NULL,
    status          VARCHAR NOT NULL DEFAULT 'created',
    dry_run         BOOLEAN DEFAULT FALSE,

    created_by      VARCHAR DEFAULT 'GABRIEL',
    approved_by     VARCHAR,
    pulse_mode      VARCHAR DEFAULT 'UNKNOWN',

    params          JSON,

    created_at      DOUBLE NOT NULL,
    approved_at     DOUBLE,
    started_at      DOUBLE,
    finished_at     DOUBLE,

    result          JSON,
    files_touched   INTEGER DEFAULT 0,
    bytes_processed BIGINT DEFAULT 0,
    error           VARCHAR,
    error_trace     VARCHAR,
    retry_count     INTEGER DEFAULT 0,
    max_retries     INTEGER DEFAULT 3,

    rollback_plan   VARCHAR,
    rolled_back     BOOLEAN DEFAULT FALSE,

    signature       VARCHAR
);

CREATE INDEX IF NOT EXISTS jobs_status_idx    ON jobs (status);
CREATE INDEX IF NOT EXISTS jobs_recipe_idx    ON jobs (recipe);
CREATE INDEX IF NOT EXISTS jobs_created_idx   ON jobs (created_at DESC);
CREATE INDEX IF NOT EXISTS jobs_target_idx    ON jobs (target);
"""


class Ledger:
    """The backbone. Every operation flows through here.

    Thread-safe via DuckDB connection-per-call pattern.
    Append-only — jobs are never deleted.
    """

    def __init__(self, db_path: Path = DB_PATH):
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_schema()
        logger.info(f"LEDGER: Online — {self.db_path}")

    def _conn(self):
        """Return a fresh DuckDB connection (thread-safe pattern)."""
        return duckdb.connect(str(self.db_path))

    def _init_schema(self):
        if not HAS_DUCKDB:
            return
        with self._conn() as con:
            con.execute(SCHEMA_SQL)
            con.commit()

    # ── CREATE ─────────────────────────────────────────────────────────────────

    def create(
        self,
        recipe: str,
        target: str,
        params: Optional[Dict] = None,
        pulse_mode: str = "UNKNOWN",
        dry_run: bool = False,
        created_by: str = "GABRIEL",
    ) -> Optional[str]:
        """Create a new job. Returns job_id or None if recipe not allowed."""
        if not is_allowed(recipe):
            logger.error(
                f"LEDGER: Recipe '{recipe}' is not in the allowlist. "
                f"Available: {', '.join(sorted(RECIPES.keys()))}"
            )
            return None

        r = get_recipe(recipe)
        approved_by = "AUTO" if (auto_approve(recipe) or dry_run) else None
        approved_at = time.time() if approved_by else None

        job = Job(
            recipe=recipe,
            target=str(target),
            target_type="file" if Path(target).is_file() else "directory",
            risk_level=r["risk"],
            status=JobStatus.APPROVED if approved_by else JobStatus.CREATED,
            dry_run=dry_run,
            params=params or {},
            pulse_mode=pulse_mode,
            created_by=created_by,
            approved_by=approved_by,
            approved_at=approved_at,
        ).sign()

        if not HAS_DUCKDB:
            logger.info(f"LEDGER (no-db): Job {job.job_id} created — {recipe} → {Path(target).name}")
            return job.job_id

        with self._conn() as con:
            d = job.to_dict()
            con.execute("""
                INSERT INTO jobs VALUES (
                    ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
                )
            """, [
                d["job_id"], d["recipe"], d["target"], d["target_type"],
                d["risk_level"], d["status"], d["dry_run"],
                d["created_by"], d["approved_by"], d["pulse_mode"],
                d["params"],
                d["created_at"], d["approved_at"], None, None,
                None, 0, 0, None, None, 0, d["max_retries"],
                None, False,
                d["signature"],
            ])
            con.commit()

        logger.info(
            f"LEDGER: [{job.job_id[:8]}] CREATED — {recipe} → {Path(target).name} "
            f"[{r['risk'].value}] {'(dry-run)' if dry_run else ''}"
        )
        return job.job_id

    # ── APPROVE ────────────────────────────────────────────────────────────────

    def approve(self, job_id: str, approved_by: str = "RSP_001") -> bool:
        """Manually approve a job that requires human sign-off."""
        if not HAS_DUCKDB:
            return True
        with self._conn() as con:
            rows = con.execute(
                "SELECT status FROM jobs WHERE job_id = ?", [job_id]
            ).fetchall()
            if not rows or rows[0][0] != "created":
                return False
            con.execute("""
                UPDATE jobs
                SET status = 'approved', approved_by = ?, approved_at = ?
                WHERE job_id = ?
            """, [approved_by, time.time(), job_id])
            con.commit()
        logger.info(f"LEDGER: [{job_id[:8]}] APPROVED by {approved_by}")
        return True

    # ── START ──────────────────────────────────────────────────────────────────

    def start(self, job_id: str) -> bool:
        """Mark a job as running. Returns False if not approved."""
        if not HAS_DUCKDB:
            return True
        with self._conn() as con:
            rows = con.execute(
                "SELECT status FROM jobs WHERE job_id = ?", [job_id]
            ).fetchall()
            if not rows or rows[0][0] not in ("approved", "dry_run"):
                logger.warning(f"LEDGER: [{job_id[:8]}] Cannot start — status={rows[0][0] if rows else 'NOT FOUND'}")
                return False
            con.execute("""
                UPDATE jobs SET status = 'running', started_at = ?
                WHERE job_id = ?
            """, [time.time(), job_id])
            con.commit()
        return True

    # ── FINISH ─────────────────────────────────────────────────────────────────

    def finish(
        self,
        job_id: str,
        result: Optional[Dict] = None,
        files_touched: int = 0,
        bytes_processed: int = 0,
    ) -> bool:
        """Mark a job as done. Records result and timing."""
        if not HAS_DUCKDB:
            return True
        with self._conn() as con:
            con.execute("""
                UPDATE jobs
                SET status = 'done',
                    finished_at = ?,
                    result = ?,
                    files_touched = ?,
                    bytes_processed = ?
                WHERE job_id = ?
            """, [
                time.time(),
                json.dumps(result) if result else None,
                files_touched, bytes_processed,
                job_id,
            ])
            con.commit()
        logger.info(
            f"LEDGER: [{job_id[:8]}] ✓ DONE — "
            f"{files_touched} files, {bytes_processed:,} bytes"
        )
        return True

    # ── FAIL ───────────────────────────────────────────────────────────────────

    def fail(self, job_id: str, error: str, trace: str = "") -> str:
        """Mark a job as failed. Returns new status (failed or quarantined)."""
        if not HAS_DUCKDB:
            return "failed"
        with self._conn() as con:
            rows = con.execute(
                "SELECT retry_count, max_retries FROM jobs WHERE job_id = ?", [job_id]
            ).fetchall()
            if not rows:
                return "unknown"
            retry_count, max_retries = rows[0]
            new_count = retry_count + 1
            new_status = "quarantined" if new_count >= max_retries else "failed"
            con.execute("""
                UPDATE jobs
                SET status = ?, finished_at = ?, error = ?,
                    error_trace = ?, retry_count = ?
                WHERE job_id = ?
            """, [new_status, time.time(), error[:2000], trace[:5000], new_count, job_id])
            con.commit()
        logger.error(
            f"LEDGER: [{job_id[:8]}] ✗ {new_status.upper()} "
            f"(attempt {new_count}/{max_retries}) — {error[:80]}"
        )
        return new_status

    # ── ROLLBACK ───────────────────────────────────────────────────────────────

    def rollback(self, job_id: str, performed_by: str = "GABRIEL") -> bool:
        """Record that a job was rolled back."""
        if not HAS_DUCKDB:
            return True
        with self._conn() as con:
            con.execute("""
                UPDATE jobs SET status = 'rolled_back', rolled_back = TRUE,
                    finished_at = ?
                WHERE job_id = ?
            """, [time.time(), job_id])
            con.commit()
        logger.info(f"LEDGER: [{job_id[:8]}] ROLLED BACK by {performed_by}")
        return True

    def set_rollback_plan(self, job_id: str, plan: Dict) -> bool:
        """Store the rollback plan before a job runs (write before execute)."""
        if not HAS_DUCKDB:
            return True
        with self._conn() as con:
            con.execute(
                "UPDATE jobs SET rollback_plan = ? WHERE job_id = ?",
                [json.dumps(plan), job_id]
            )
            con.commit()
        return True

    # ── QUERY ──────────────────────────────────────────────────────────────────

    def query(
        self,
        status: Optional[str] = None,
        recipe: Optional[str] = None,
        target_like: Optional[str] = None,
        risk_level: Optional[str] = None,
        since_hours: Optional[float] = None,
        limit: int = 50,
    ) -> List[Dict]:
        """Query jobs with filters. Returns list of dicts."""
        if not HAS_DUCKDB:
            return []

        clauses, args = [], []
        if status:
            clauses.append("status = ?")
            args.append(status)
        if recipe:
            clauses.append("recipe = ?")
            args.append(recipe)
        if target_like:
            clauses.append("target LIKE ?")
            args.append(f"%{target_like}%")
        if risk_level:
            clauses.append("risk_level = ?")
            args.append(risk_level)
        if since_hours:
            cutoff = time.time() - (since_hours * 3600)
            clauses.append("created_at >= ?")
            args.append(cutoff)

        where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
        sql = f"""
            SELECT * FROM jobs
            {where}
            ORDER BY created_at DESC
            LIMIT {int(limit)}
        """
        with self._conn() as con:
            rows = con.execute(sql, args).fetchall()
            cols = [d[0] for d in con.description]
        return [dict(zip(cols, row)) for row in rows]

    # ── STATS ──────────────────────────────────────────────────────────────────

    def stats(self, since_hours: float = 24.0) -> Dict[str, Any]:
        """Health summary for the Dashboard."""
        if not HAS_DUCKDB:
            return {"error": "duckdb not installed"}

        cutoff = time.time() - (since_hours * 3600)
        with self._conn() as con:
            rows = con.execute("""
                SELECT status, COUNT(*) AS n,
                       SUM(files_touched) AS files,
                       SUM(bytes_processed) AS bytes
                FROM jobs
                WHERE created_at >= ?
                GROUP BY status
            """, [cutoff]).fetchall()

        summary: Dict[str, Any] = {
            "window_hours": since_hours,
            "total": 0,
        }
        for status, n, files, bytes_ in rows:
            summary[status] = {
                "count": n,
                "files_touched": files or 0,
                "bytes_processed": bytes_ or 0,
            }
            summary["total"] += n

        # Pending approvals
        with self._conn() as con:
            pending = con.execute(
                "SELECT COUNT(*) FROM jobs WHERE status = 'created'"
            ).fetchone()[0]
        summary["pending_approval"] = pending

        return summary

    # ── REVIEW QUEUE ───────────────────────────────────────────────────────────

    def review_queue(self) -> List[Dict]:
        """Jobs waiting for RSP_001 approval."""
        return self.query(status="created", limit=100)

    def quarantine_queue(self) -> List[Dict]:
        """Jobs that have failed too many times and need human review."""
        return self.query(status="quarantined", limit=50)

    # ── CANCEL ─────────────────────────────────────────────────────────────────

    def cancel(self, job_id: str) -> bool:
        """Cancel a job that hasn't started yet."""
        if not HAS_DUCKDB:
            return True
        with self._conn() as con:
            con.execute("""
                UPDATE jobs SET status = 'cancelled', finished_at = ?
                WHERE job_id = ? AND status IN ('created', 'approved')
            """, [time.time(), job_id])
            rows = con.execute(
                "SELECT changes() as c", []
            ).fetchone()
            con.commit()
        return True

    # ── CONTEXT MANAGER ────────────────────────────────────────────────────────

    def job_context(self, recipe: str, target: str, **kwargs):
        """Context manager: creates, starts, finishes/fails a job automatically.

        with ledger.job_context("analyze_file", "/path/to/file.wav") as job_id:
            # do work
            result = analyze(...)
        # ledger.finish() called automatically on exit
        """
        return _JobContext(self, recipe, target, **kwargs)

    def print_stats(self, since_hours: float = 24.0):
        """Print a human-readable stats summary."""
        s = self.stats(since_hours)
        print(f"\nLEDGER — Last {since_hours:.0f}h ({s['total']} jobs)")
        print("─" * 50)
        for k, v in s.items():
            if isinstance(v, dict):
                print(f"  {k:15s}  {v['count']:4d} jobs  {v['files_touched']:6d} files")
        if s.get("pending_approval", 0):
            print(f"\n  ⚠  {s['pending_approval']} jobs awaiting approval")
        print()


class _JobContext:
    """Context manager for clean job lifecycle management."""
    def __init__(self, ledger: Ledger, recipe: str, target: str, **kwargs):
        self.ledger = ledger
        self.recipe = recipe
        self.target = target
        self.kwargs = kwargs
        self.job_id: Optional[str] = None
        self._result: Dict = {}
        self._files: int = 0
        self._bytes: int = 0

    def set_result(self, result: Dict, files: int = 0, bytes_: int = 0):
        self._result = result
        self._files = files
        self._bytes = bytes_

    def __enter__(self) -> "_JobContext":
        self.job_id = self.ledger.create(self.recipe, self.target, **self.kwargs)
        if self.job_id:
            self.ledger.start(self.job_id)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if not self.job_id:
            return False
        if exc_type:
            self.ledger.fail(
                self.job_id,
                error=str(exc_val),
                trace=traceback.format_exc(),
            )
        else:
            self.ledger.finish(
                self.job_id,
                result=self._result,
                files_touched=self._files,
                bytes_processed=self._bytes,
            )
        return False  # don't suppress exceptions


# ─────────────────────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(message)s")

    p = argparse.ArgumentParser(prog="ledger", description="Gabriel Ledger — job audit trail")
    sub = p.add_subparsers(dest="cmd")

    sub.add_parser("stats",   help="Show 24h stats")
    sub.add_parser("queue",   help="Show approval queue")
    sub.add_parser("quarantine", help="Show quarantined jobs")
    sub.add_parser("recipes", help="List allowed recipes")

    q = sub.add_parser("query", help="Query jobs")
    q.add_argument("--status")
    q.add_argument("--recipe")
    q.add_argument("--limit", type=int, default=20)

    a = sub.add_parser("approve", help="Approve a job")
    a.add_argument("job_id")
    a.add_argument("--by", default="RSP_001")

    args = p.parse_args()
    ledger = Ledger()

    if args.cmd == "stats":
        ledger.print_stats()

    elif args.cmd == "queue":
        jobs = ledger.review_queue()
        print(f"\n  ⏳ APPROVAL QUEUE ({len(jobs)} jobs)\n")
        for j in jobs:
            print(f"  [{j['job_id'][:8]}] {j['recipe']:25s} → {Path(j['target']).name}")

    elif args.cmd == "quarantine":
        jobs = ledger.quarantine_queue()
        print(f"\n  🔴 QUARANTINE ({len(jobs)} jobs)\n")
        for j in jobs:
            print(f"  [{j['job_id'][:8]}] {j['recipe']:25s} retries={j['retry_count']} — {j['error'] or ''[:60]}")

    elif args.cmd == "recipes":
        print("\n  ALLOWED RECIPES\n")
        for name, r in sorted(RECIPES.items()):
            auto = "✓ auto" if r["auto_approve"] else "⏳ manual"
            print(f"  {name:30s}  [{r['risk'].value:8s}] {auto}  — {r['desc']}")

    elif args.cmd == "approve":
        ok = ledger.approve(args.job_id, approved_by=args.by)
        print(f"  {'✓ Approved' if ok else '✗ Failed'}: {args.job_id}")

    elif args.cmd == "query":
        jobs = ledger.query(status=args.status, recipe=args.recipe, limit=args.limit)
        print(f"\n  JOBS ({len(jobs)})\n")
        for j in jobs:
            print(f"  [{j['job_id'][:8]}] {j['status']:12s} {j['recipe']:25s} → {Path(j['target']).name}")

    else:
        # Quick demo
        print("\nLEDGER DEMO\n")
        jid = ledger.create("analyze_file", "/Volumes/6TB/test.wav", pulse_mode="OVERNIGHT")
        if jid:
            print(f"  Created: {jid}")
            with ledger.job_context("scan_volume", "/Volumes/6TB", pulse_mode="OVERNIGHT") as ctx:
                ctx.set_result({"files_found": 1234}, files=1234)
                print(f"  Running scan job: {ctx.job_id}")
        ledger.print_stats(since_hours=1)
