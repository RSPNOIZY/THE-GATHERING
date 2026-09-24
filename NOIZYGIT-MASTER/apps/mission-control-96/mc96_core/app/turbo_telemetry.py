"""turbo_telemetry — lightweight timing instrumentation for Gabriel.

Single-process, in-memory timer registry with optional JSONL log to
~/NOIZYANTHROPIC/NOIZYLAB/ops/logs/telemetry.jsonl.
"""
from __future__ import annotations

import json
import time
from pathlib import Path
from threading import Lock

LOG_PATH = Path.home() / "NOIZYANTHROPIC" / "NOIZYLAB" / "ops" / "logs" / "telemetry.jsonl"
LOG_PATH.parent.mkdir(parents=True, exist_ok=True)


class Telemetry:
    def __init__(self) -> None:
        self._timers: dict[str, float] = {}
        self._lock = Lock()

    def start(self, name: str) -> None:
        with self._lock:
            self._timers[name] = time.perf_counter()

    def stop(self, name: str, category: str = "default") -> float:
        with self._lock:
            t0 = self._timers.pop(name, None)
        if t0 is None:
            return 0.0
        elapsed = time.perf_counter() - t0
        try:
            with open(LOG_PATH, "a") as f:
                f.write(
                    json.dumps(
                        {
                            "ts": time.strftime("%Y-%m-%dT%H:%M:%S"),
                            "name": name,
                            "category": category,
                            "elapsed_ms": round(elapsed * 1000, 2),
                        }
                    )
                    + "\n"
                )
        except Exception:
            pass
        return elapsed


# Singleton expected by turbo_gabriel_omega.py
telemetry = Telemetry()
