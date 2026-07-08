#!/usr/bin/env python3
"""
gabriel_core.py
GABRIEL — The Dispatcher v1.0
NOIZY Empire / RSP_001

"Fleet orchestrator · mission decomposition · crew coordination"
— NOIZYWORLD.pptx, Slide 13

GABRIEL is the async nervous system. He:
  1. Receives voice or text commands
  2. Classifies intent via local Ollama (gemma3:27b — offline, private)
  3. Routes to the right crew member
  4. Dispatches tasks asynchronously (non-blocking)
  5. Aggregates results and formats response
  6. Hands off to TTS for voice reply

CREW MANIFEST (from NOIZYWORLD.pptx):
  LUCY        → file intelligence, tagging, catalogue
  GOD_NODE    → 24-core batch vacuum
  ENGR_KEITH  → HEAVEN, Cloudflare, infrastructure
  DREAM       → vision alignment, 5th Epoch doctrine
  SHIRL       → wellbeing, burnout detection, STOP veto
  CB01        → deployment, health check, smoke test
  SHIRLEY     → code manager, codebase stats

ARCHITECTURE:
  Voice/Text → IntentClassifier (gemma3:27b) → Intent
  Intent → CrewRouter → async Task
  Task → CrewMember.execute() → TaskResult
  TaskResult → GABRIEL.aggregate() → Response string
  Response → TTS (macOS say / mlx-whisper output)
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import time
import uuid
from dataclasses import dataclass, field, asdict
from enum import Enum
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Tuple

logger = logging.getLogger("GABRIEL")

# ── Ollama ────────────────────────────────────────────────────────────────────
try:
    import ollama
    HAS_OLLAMA = True
except ImportError:
    HAS_OLLAMA = False

OLLAMA_MODEL = "gemma3:27b"   # confirmed on GOD.local

# ── TTS (macOS native — zero deps, RSP voice requirement) ────────────────────
async def _speak(text: str, voice: str = "Daniel") -> None:
    """Async TTS via macOS 'say' command. Daniel = GABRIEL's voice."""
    await asyncio.create_subprocess_exec(
        "say", "-v", voice, text,
        stdout=asyncio.subprocess.DEVNULL,
        stderr=asyncio.subprocess.DEVNULL,
    )


# ─────────────────────────────────────────────────────────────────────────────
# INTENT TAXONOMY
# ─────────────────────────────────────────────────────────────────────────────

class Intent(str, Enum):
    """All actions GABRIEL can route. Maps to crew members."""
    # LUCY — file intelligence
    SCAN_VOLUME        = "scan_volume"
    ANALYZE_FILE       = "analyze_file"
    BATCH_VACUUM       = "batch_vacuum"
    ASSIGN_ISRC        = "assign_isrc"
    TAG_FILE           = "tag_file"
    SEARCH_CATALOGUE   = "search_catalogue"
    FIND_DUPLICATES    = "find_duplicates"
    # ENGR_KEITH — infrastructure
    HEALTH_CHECK       = "health_check"
    DEPLOY_HEAVEN      = "deploy_heaven"
    SCHEMA_CHECK       = "schema_check"
    # DREAM — vision
    VISION_CHECK       = "vision_check"
    ROADMAP            = "roadmap"
    # SHIRL — wellbeing
    WELLBEING_CHECK    = "wellbeing_check"
    BREAK_REMINDER     = "break_reminder"
    # CB01 — deployment
    SMOKE_TEST         = "smoke_test"
    STATUS_CHECK       = "status_check"
    # SHIRLEY — code
    CODE_STATS         = "code_stats"
    FIND_TODOS         = "find_todos"
    # Unknown
    UNKNOWN            = "unknown"


INTENT_DESCRIPTIONS = {
    Intent.SCAN_VOLUME:      "scan a drive or volume for audio files",
    Intent.ANALYZE_FILE:     "analyze an audio file for metadata and fingerprint",
    Intent.BATCH_VACUUM:     "batch process all files in a directory using 24 cores",
    Intent.ASSIGN_ISRC:      "assign ISRC codes to files",
    Intent.TAG_FILE:         "tag a file with TagSpaces metadata",
    Intent.SEARCH_CATALOGUE: "search the MC96 catalogue or database",
    Intent.FIND_DUPLICATES:  "find duplicate audio files",
    Intent.HEALTH_CHECK:     "check system health, HEAVEN API, or infrastructure",
    Intent.DEPLOY_HEAVEN:    "deploy or update the HEAVEN consent kernel",
    Intent.SCHEMA_CHECK:     "verify database schema integrity",
    Intent.VISION_CHECK:     "check if a decision aligns with 5th Epoch doctrine",
    Intent.ROADMAP:          "show the current NOIZY Empire roadmap",
    Intent.WELLBEING_CHECK:  "check wellbeing, burnout signals, or work session duration",
    Intent.BREAK_REMINDER:   "set a break reminder",
    Intent.SMOKE_TEST:       "run deployment smoke tests",
    Intent.STATUS_CHECK:     "show empire status, active services, or MCP health",
    Intent.CODE_STATS:       "show codebase statistics or find TODO items",
    Intent.FIND_TODOS:       "find all TODO and FIXME items in the codebase",
    Intent.UNKNOWN:          "unclear or out-of-scope request",
}


# ─────────────────────────────────────────────────────────────────────────────
# TASK & RESULT
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class GabrielTask:
    """One unit of work dispatched by GABRIEL."""
    task_id:   str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    intent:    Intent = Intent.UNKNOWN
    command:   str = ""
    args:      Dict[str, Any] = field(default_factory=dict)
    created:   float = field(default_factory=time.time)
    crew:      str = "UNKNOWN"


@dataclass
class TaskResult:
    """Result returned by a crew member to GABRIEL."""
    task_id:   str = ""
    crew:      str = ""
    success:   bool = False
    summary:   str = ""          # spoken by GABRIEL via TTS
    data:      Any = None        # full result for logging
    elapsed_ms: float = 0.0
    error:     Optional[str] = None


# ─────────────────────────────────────────────────────────────────────────────
# INTENT CLASSIFIER  (Ollama — gemma3:27b — local, private, offline)
# ─────────────────────────────────────────────────────────────────────────────

class IntentClassifier:
    """Classify free-form voice commands into structured Intents.

    Uses gemma3:27b locally. Zero network calls. RSP voice stays on-device.
    Fallback: keyword matching when Ollama is unavailable.
    """

    SYSTEM_PROMPT = (
        "You are GABRIEL, the dispatcher for the NOIZY Empire AI crew.\n"
        "Classify the user's command into exactly ONE intent from the list.\n"
        "Also extract any path, filename, or argument mentioned.\n"
        "Respond with ONLY valid JSON: "
        '{"intent": "<intent_name>", "args": {"path": "...", "query": "..."}}\n'
        "No explanation. No markdown. JSON only.\n\n"
        "Available intents:\n" +
        "\n".join(f"  {i.value}: {d}" for i, d in INTENT_DESCRIPTIONS.items())
    )

    def __init__(self):
        self.available = False
        if HAS_OLLAMA:
            try:
                resp = ollama.list()
                models = [m.model for m in resp.models]
                self.available = any(OLLAMA_MODEL in m for m in models)
                if self.available:
                    logger.info(f"IntentClassifier: {OLLAMA_MODEL} ready")
                else:
                    logger.warning(
                        f"IntentClassifier: {OLLAMA_MODEL} not in Ollama. "
                        f"Installed: {models[:3]}"
                    )
            except Exception as e:
                logger.warning(f"IntentClassifier: Ollama unavailable: {e}")

    async def classify(self, command: str) -> Tuple[Intent, Dict[str, Any]]:
        """Classify a command. Returns (Intent, args_dict)."""
        if self.available:
            try:
                return await asyncio.get_event_loop().run_in_executor(
                    None, self._classify_sync, command
                )
            except Exception as e:
                logger.warning(f"Ollama classify failed: {e} — using keywords")

        return self._keyword_classify(command)

    def _classify_sync(self, command: str) -> Tuple[Intent, Dict]:
        """Synchronous Ollama call — run in executor to avoid blocking event loop."""
        response = ollama.chat(
            model=OLLAMA_MODEL,
            messages=[
                {"role": "system", "content": self.SYSTEM_PROMPT},
                {"role": "user",   "content": command},
            ],
            options={"temperature": 0.0, "num_predict": 100},
        )
        raw = response.message.content.strip()

        # Strip any accidental markdown
        if "```" in raw:
            raw = raw.split("```")[1].strip()
            if raw.startswith("json"):
                raw = raw[4:].strip()

        parsed = json.loads(raw)
        intent_str = parsed.get("intent", "unknown")
        args = parsed.get("args", {})

        try:
            intent = Intent(intent_str)
        except ValueError:
            intent = Intent.UNKNOWN

        return intent, args

    @staticmethod
    def _keyword_classify(command: str) -> Tuple[Intent, Dict]:
        """Fast keyword fallback — no Ollama needed."""
        cmd = command.lower()
        args: Dict[str, Any] = {}

        # Extract path-like tokens
        words = command.split()
        for w in words:
            if w.startswith("/") or "Volumes" in w or w.endswith(".wav"):
                args["path"] = w
                break

        if any(k in cmd for k in ("vacuum", "batch", "24 core", "all files")):
            return Intent.BATCH_VACUUM, args
        if any(k in cmd for k in ("scan", "index volume", "scan drive")):
            return Intent.SCAN_VOLUME, args
        if any(k in cmd for k in ("analyze", "fingerprint", "extract")):
            return Intent.ANALYZE_FILE, args
        if any(k in cmd for k in ("isrc", "assign code", "register")):
            return Intent.ASSIGN_ISRC, args
        if any(k in cmd for k in ("tag", "label", "mark")):
            return Intent.TAG_FILE, args
        if any(k in cmd for k in ("search", "find", "query", "lookup")):
            if any(k in cmd for k in ("duplicate", "copy", "dupe")):
                return Intent.FIND_DUPLICATES, args
            return Intent.SEARCH_CATALOGUE, args
        if any(k in cmd for k in ("health", "status", "alive", "running")):
            return Intent.HEALTH_CHECK, args
        if any(k in cmd for k in ("deploy", "heaven", "worker")):
            return Intent.DEPLOY_HEAVEN, args
        if any(k in cmd for k in ("smoke", "test", "verify")):
            return Intent.SMOKE_TEST, args
        if any(k in cmd for k in ("vision", "doctrine", "epoch")):
            return Intent.VISION_CHECK, args
        if any(k in cmd for k in ("break", "stop", "rest", "burnout")):
            return Intent.BREAK_REMINDER, args
        if any(k in cmd for k in ("todo", "fixme", "hack")):
            return Intent.FIND_TODOS, args
        if any(k in cmd for k in ("code stats", "file count", "codebase")):
            return Intent.CODE_STATS, args

        return Intent.UNKNOWN, args


# ─────────────────────────────────────────────────────────────────────────────
# CREW HANDLERS  (async functions — one per crew member)
# ─────────────────────────────────────────────────────────────────────────────

async def _lucy_scan_volume(task: GabrielTask) -> TaskResult:
    """LUCY: Scan a volume with FishnetScanner."""
    t0 = time.perf_counter()
    path = task.args.get("path", str(Path.home() / "NOIZYANTHROPIC"))
    try:
        from mc96_pipeline import FishnetScanner
        scanner = FishnetScanner([path])
        count = await asyncio.get_event_loop().run_in_executor(
            None, scanner.count_estimate
        )
        return TaskResult(
            task_id=task.task_id, crew="LUCY", success=True,
            summary=f"LUCY found {count:,} audio files in {Path(path).name}.",
            data={"path": path, "count": count},
            elapsed_ms=round((time.perf_counter() - t0) * 1000),
        )
    except Exception as e:
        return TaskResult(task_id=task.task_id, crew="LUCY", success=False,
                         summary="LUCY could not complete the scan.", error=str(e))


async def _lucy_batch_vacuum(task: GabrielTask) -> TaskResult:
    """GOD_NODE: 24-core parallel vacuum via GodNodeOrchestrator."""
    t0 = time.perf_counter()
    path = task.args.get("path", "/Volumes/SOUND_DESIGN")
    try:
        from mc96_god_node import GodNodeOrchestrator
        node = GodNodeOrchestrator()
        results = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: node.vacuum_directory(path, dry_run=True)
        )
        ok = sum(1 for r in results if r.status == "analyzed")
        return TaskResult(
            task_id=task.task_id, crew="GOD_NODE", success=True,
            summary=f"GOD NODE processed {ok} of {len(results)} files in {Path(path).name}.",
            data={"ok": ok, "total": len(results)},
            elapsed_ms=round((time.perf_counter() - t0) * 1000),
        )
    except Exception as e:
        return TaskResult(task_id=task.task_id, crew="GOD_NODE", success=False,
                         summary="GOD NODE vacuum failed.", error=str(e))


async def _engr_health_check(task: GabrielTask) -> TaskResult:
    """ENGR_KEITH: Health check via supersonic or CB01 MCP."""
    t0 = time.perf_counter()
    try:
        proc = await asyncio.create_subprocess_exec(
            "curl", "-s", "--max-time", "5",
            "https://heaven.rsp-5f3.workers.dev/health",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.DEVNULL,
        )
        stdout, _ = await proc.communicate()
        healthy = proc.returncode == 0 and b'"status"' in stdout
        summary = (
            "HEAVEN consent kernel is online." if healthy
            else "HEAVEN is not responding. NOI-90 may still be blocking deployment."
        )
        return TaskResult(
            task_id=task.task_id, crew="ENGR_KEITH", success=healthy,
            summary=summary,
            data={"response": stdout.decode()[:200]},
            elapsed_ms=round((time.perf_counter() - t0) * 1000),
        )
    except Exception as e:
        return TaskResult(task_id=task.task_id, crew="ENGR_KEITH", success=False,
                         summary="HEAVEN health check failed.", error=str(e))


async def _dream_vision_check(task: GabrielTask) -> TaskResult:
    """DREAM: Quick 5th Epoch doctrine alignment check."""
    return TaskResult(
        task_id=task.task_id, crew="DREAM", success=True,
        summary=(
            "DREAM says: We are a living breathing time capsule. "
            "Consent as executable code. Provenance as default. "
            "Revocation as sacred. Compensation as automatic. "
            "Does your action serve the 396 Hz? If yes — proceed."
        ),
        elapsed_ms=0,
    )


async def _shirl_wellbeing(task: GabrielTask) -> TaskResult:
    """SHIRL: Session check and burnout signal."""
    try:
        proc = await asyncio.create_subprocess_exec(
            "date", "+%s",
            stdout=asyncio.subprocess.PIPE,
        )
        stdout, _ = await proc.communicate()
        return TaskResult(
            task_id=task.task_id, crew="SHIRL", success=True,
            summary="SHIRL says: How's the C3 today? You've been at it hard. Take 10.",
        )
    except Exception as e:
        return TaskResult(task_id=task.task_id, crew="SHIRL", success=True,
                         summary="SHIRL: Breathe. You're doing enough.")


async def _lucy_search(task: GabrielTask) -> TaskResult:
    """LUCY: Query mc96_catalog.db."""
    t0 = time.perf_counter()
    import sqlite3
    query = task.args.get("query", "")
    db = Path.home() / "mc96_catalog.db"
    try:
        if not db.exists():
            return TaskResult(task_id=task.task_id, crew="LUCY", success=False,
                             summary="Catalogue database not found. Run a scan first.")
        con = sqlite3.connect(db)
        rows = con.execute(
            "SELECT file_name, source_path FROM files "
            "WHERE file_name LIKE ? OR source_path LIKE ? LIMIT 10",
            (f"%{query}%", f"%{query}%"),
        ).fetchall()
        con.close()
        if rows:
            files = ", ".join(r[0] for r in rows[:5])
            summary = f"LUCY found {len(rows)} matches for '{query}': {files}"
        else:
            summary = f"LUCY: No results for '{query}' in the catalogue."
        return TaskResult(task_id=task.task_id, crew="LUCY", success=True,
                         summary=summary, data=rows,
                         elapsed_ms=round((time.perf_counter() - t0) * 1000))
    except Exception as e:
        return TaskResult(task_id=task.task_id, crew="LUCY", success=False,
                         summary="Catalogue search failed.", error=str(e))


async def _unknown_intent(task: GabrielTask) -> TaskResult:
    return TaskResult(
        task_id=task.task_id, crew="GABRIEL", success=False,
        summary=(
            f"GABRIEL: I didn't understand '{task.command[:80]}'. "
            "Try: scan SOUND_DESIGN, batch vacuum, health check, or search catalogue."
        ),
    )


# ─────────────────────────────────────────────────────────────────────────────
# CREW ROUTER
# ─────────────────────────────────────────────────────────────────────────────

CREW_HANDLERS: Dict[Intent, Callable] = {
    Intent.SCAN_VOLUME:        _lucy_scan_volume,
    Intent.BATCH_VACUUM:       _lucy_batch_vacuum,
    Intent.SEARCH_CATALOGUE:   _lucy_search,
    Intent.FIND_DUPLICATES:    _lucy_search,
    Intent.HEALTH_CHECK:       _engr_health_check,
    Intent.DEPLOY_HEAVEN:      _engr_health_check,    # same check for now
    Intent.VISION_CHECK:       _dream_vision_check,
    Intent.WELLBEING_CHECK:    _shirl_wellbeing,
    Intent.BREAK_REMINDER:     _shirl_wellbeing,
    Intent.UNKNOWN:            _unknown_intent,
}

CREW_NAMES: Dict[Intent, str] = {
    Intent.SCAN_VOLUME:      "LUCY",
    Intent.ANALYZE_FILE:     "LUCY",
    Intent.BATCH_VACUUM:     "GOD_NODE",
    Intent.ASSIGN_ISRC:      "LUCY",
    Intent.TAG_FILE:         "LUCY",
    Intent.SEARCH_CATALOGUE: "LUCY",
    Intent.FIND_DUPLICATES:  "LUCY",
    Intent.HEALTH_CHECK:     "ENGR_KEITH",
    Intent.DEPLOY_HEAVEN:    "ENGR_KEITH",
    Intent.SCHEMA_CHECK:     "ENGR_KEITH",
    Intent.VISION_CHECK:     "DREAM",
    Intent.ROADMAP:          "DREAM",
    Intent.WELLBEING_CHECK:  "SHIRL",
    Intent.BREAK_REMINDER:   "SHIRL",
    Intent.SMOKE_TEST:       "CB01",
    Intent.STATUS_CHECK:     "CB01",
    Intent.CODE_STATS:       "SHIRLEY",
    Intent.FIND_TODOS:       "SHIRLEY",
    Intent.UNKNOWN:          "GABRIEL",
}


# ─────────────────────────────────────────────────────────────────────────────
# GABRIEL CORE
# ─────────────────────────────────────────────────────────────────────────────

class Gabriel:
    """The Dispatcher. Async. Non-blocking. Routes to crew. Speaks results.

    Usage
    -----
    gabriel = Gabriel()
    await gabriel.start()

    # Single command:
    result = await gabriel.dispatch("scan my SOUND_DESIGN drive")
    print(result.summary)

    # Voice loop:
    await gabriel.voice_loop()
    """

    def __init__(
        self,
        voice: str = "Daniel",
        speak_responses: bool = True,
        task_timeout: float = 120.0,
    ):
        self.voice = voice
        self.speak = speak_responses
        self.timeout = task_timeout
        self.classifier = IntentClassifier()
        self._task_queue: asyncio.Queue = asyncio.Queue()
        self._results: Dict[str, TaskResult] = {}
        self._running = False

    async def start(self) -> None:
        """Start GABRIEL's background task processor."""
        self._running = True
        logger.info("GABRIEL: Online. Fleet ready.")
        if self.speak:
            await _speak("GABRIEL online. Crew standing by.", self.voice)

    async def stop(self) -> None:
        self._running = False
        if self.speak:
            await _speak("GABRIEL signing off.", self.voice)

    async def dispatch(self, command: str) -> TaskResult:
        """Classify command → route to crew → return result.

        The core GABRIEL loop. Awaitable — callers don't block.
        """
        t0 = time.perf_counter()

        # Step 1: Classify intent
        intent, args = await self.classifier.classify(command)
        crew = CREW_NAMES.get(intent, "GABRIEL")

        task = GabrielTask(
            intent=intent,
            command=command,
            args=args,
            crew=crew,
        )

        logger.info(
            f"GABRIEL [{task.task_id}]: '{command[:60]}' → {intent.value} → {crew}"
        )

        # Step 2: Announce dispatch (non-blocking TTS)
        if self.speak:
            asyncio.create_task(
                _speak(f"Routing to {crew}.", self.voice)
            )

        # Step 3: Execute via crew handler
        handler = CREW_HANDLERS.get(intent, _unknown_intent)
        try:
            result = await asyncio.wait_for(handler(task), timeout=self.timeout)
        except asyncio.TimeoutError:
            result = TaskResult(
                task_id=task.task_id, crew=crew, success=False,
                summary=f"{crew} timed out after {self.timeout:.0f}s.",
                error="timeout",
            )
        except Exception as e:
            result = TaskResult(
                task_id=task.task_id, crew=crew, success=False,
                summary=f"{crew} encountered an error.",
                error=str(e),
            )

        result.elapsed_ms = round((time.perf_counter() - t0) * 1000)
        self._results[task.task_id] = result

        # Step 4: Speak result
        if self.speak and result.summary:
            asyncio.create_task(_speak(result.summary, self.voice))

        logger.info(
            f"GABRIEL [{task.task_id}]: {'✓' if result.success else '✗'} "
            f"{result.elapsed_ms}ms — {result.summary[:80]}"
        )
        return result

    async def dispatch_parallel(self, commands: List[str]) -> List[TaskResult]:
        """Dispatch multiple commands concurrently — non-blocking gather."""
        tasks = [self.dispatch(cmd) for cmd in commands]
        return await asyncio.gather(*tasks, return_exceptions=False)

    async def voice_loop(self) -> None:
        """GABRIEL voice command loop.

        Listens for transcribed commands (from Whisper pipe or stdin),
        dispatches each, speaks result. Runs until Ctrl+C.

        In production: replace stdin with mlx-whisper microphone stream.
        """
        logger.info("GABRIEL: Voice loop started. Type command or Ctrl+C to exit.")
        await self.start()

        try:
            while True:
                # Production: replace with async Whisper microphone read
                command = await asyncio.get_event_loop().run_in_executor(
                    None, input, "RSP → GABRIEL: "
                )
                command = command.strip()
                if not command:
                    continue
                if command.lower() in ("quit", "exit", "stop"):
                    break
                await self.dispatch(command)
        except (KeyboardInterrupt, EOFError):
            pass
        finally:
            await self.stop()


# ─────────────────────────────────────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────────────────────────────────────

async def _main():
    import argparse
    p = argparse.ArgumentParser(prog="gabriel", description="GABRIEL — The Dispatcher")
    p.add_argument("command", nargs="?", help="Single command to dispatch")
    p.add_argument("--no-voice", action="store_true", help="Disable TTS")
    p.add_argument("--loop", action="store_true", help="Start voice command loop")
    args = p.parse_args()

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(name)s] %(message)s",
    )

    gabriel = Gabriel(speak_responses=not args.no_voice)

    if args.command:
        await gabriel.start()
        result = await gabriel.dispatch(args.command)
        print(f"\n{result.summary}")
        if result.error:
            print(f"Error: {result.error}")
    elif args.loop:
        await gabriel.voice_loop()
    else:
        # Demo: dispatch a set of parallel commands
        await gabriel.start()
        demo_commands = [
            "health check",
            "vision check — should I run the ISRC pipeline today?",
            "how is SHIRL doing today",
        ]
        print("GABRIEL: Running demo dispatch...")
        results = await gabriel.dispatch_parallel(demo_commands)
        for r in results:
            print(f"\n[{r.crew}] {r.summary}")
        await gabriel.stop()


if __name__ == "__main__":
    asyncio.run(_main())
