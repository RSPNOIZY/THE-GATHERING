"""turbo_memcell — resilient bridge from turbo_gabriel_omega.py to MemCell V3.

Hardening (2026-06-21): the previous version did a single hard
`from MemCell_V3 import MemCell` against one hardcoded path. When that path was
missing (it was), the import raised and GABRIEL could not boot at all. This
version:
  1. searches several candidate locations for a real MemCell_V3 module,
  2. guarantees the `inject_omniscience()` method the supervisor calls
     (the canonical class only ships track/recall), and
  3. falls back to a working in-memory cell so the brain ALWAYS boots.
"""
from __future__ import annotations

import json
import logging
import sys
import time
from pathlib import Path

log = logging.getLogger("gabriel.memcell")

# Candidate locations for the real MemCell_V3.py, most-canonical first.
_HOME = Path.home()
_CANDIDATE_DIRS = [
    _HOME / "NOIZYANTHROPIC" / "NOIZYLAB" / "scripts" / "core",
    _HOME / "NOIZYANTHROPIC" / "projects" / "RSPNOIZY" / "THE-GATHERING"
          / "Sorted_Archive" / "01_Python_Code" / "Modules",
]

_RealMemCell = None
for _d in _CANDIDATE_DIRS:
    if (_d / "MemCell_V3.py").exists():
        if str(_d) not in sys.path:
            sys.path.insert(0, str(_d))
        try:
            from MemCell_V3 import MemCell as _RealMemCell  # type: ignore  # noqa: E402
            log.info("MemCell V3 loaded from %s", _d)
            break
        except Exception as e:  # pragma: no cover - defensive
            log.warning("MemCell_V3 at %s failed to import: %s", _d, e)
            _RealMemCell = None


class _FallbackMemCell:
    """Minimal, persistent stand-in matching the parts omega uses."""

    def __init__(self):
        self.path = _HOME / "NOIZYANTHROPIC" / "NOIZYLAB" / "ops" / "logs" / "memcell_fallback.json"
        self.path.parent.mkdir(parents=True, exist_ok=True)
        log.warning("MemCell V3 not found — using in-memory fallback at %s", self.path)

    def _load(self):
        try:
            return json.loads(self.path.read_text())
        except Exception:
            return []

    def track(self, action, subject, details=None):
        data = self._load()
        data.append({"ts": time.time(), "action": action, "subject": subject, "details": details})
        try:
            self.path.write_text(json.dumps(data[-500:]))  # keep last 500
        except Exception as e:
            log.warning("MemCell fallback write failed: %s", e)

    def recall(self):
        return self._load()


def _make_memcell_class():
    """Return a MemCell class that ALWAYS provides inject_omniscience()."""
    base = _RealMemCell or _FallbackMemCell

    class MemCell(base):  # type: ignore[misc, valid-type]
        def inject_omniscience(self) -> str:
            """Context string for the supervisor. The canonical class lacks this,
            so we synthesize it from recall() rather than crash."""
            try:
                recall = getattr(self, "recall", None)
                history = recall() if callable(recall) else None
                if not history:
                    return ""
                recent = history[-10:] if isinstance(history, list) else history
                return "Recent context:\n" + json.dumps(recent, default=str)[:4000]
            except Exception as e:
                log.warning("inject_omniscience degraded: %s", e)
                return ""

    return MemCell


MemCell = _make_memcell_class()  # noqa: F811
