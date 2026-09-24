"""turbo_memcell — bridges mc96/turbo_gabriel_omega.py to MemCell V3."""
import sys
from pathlib import Path

_CORE = Path.home() / "NOIZYANTHROPIC" / "NOIZYLAB" / "scripts" / "core"
if str(_CORE) not in sys.path:
    sys.path.insert(0, str(_CORE))

from MemCell_V3 import MemCell  # noqa: F401,E402
