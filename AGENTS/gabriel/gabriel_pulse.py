#!/usr/bin/env python3
"""
gabriel_pulse.py
THE PULSE — Gabriel Core v1
NOIZY Empire / RSP_001

"Gabriel should know when you are producing music and back off."

The Pulse layer is the machine-awareness brain between GABRIEL and GOD.local.
It answers one question before any job runs:

    Is it safe to run this job RIGHT NOW without disturbing RSP_001?

PRIORITY MODES:
  STUDIO     → RSP_001 is producing. Back off completely.
               max_cpu=5%, no disk writes, read-only only.
               Trigger: Logic Pro / Pro Tools / Ableton / LUNA / Audio Hijack is running

  QUIET      → Background processes detected. Tread lightly.
               max_cpu=20%, light reads, no batch jobs.
               Trigger: CPU > 70% or RAM < 8GB free

  OVERNIGHT  → GOD.local is idle. Full power.
               max_cpu=85%, full I/O, all batch jobs allowed.
               Trigger: No DAW, CPU < 30%, RAM > 16GB free, after 10pm or before 8am

  EMERGENCY  → RSP_001 explicitly triggered. Override all throttles.
               max_cpu=100%, all operations allowed, immediate.
               Trigger: Gabriel dispatch command "EMERGENCY"

DETECTS:
  - Logic Pro X / Logic Pro
  - Pro Tools
  - Ableton Live
  - GarageBand
  - LUNA Recording System
  - Reaper
  - Cubase
  - Nuendo
  - Reason Studios
  - Audio Hijack (Rogue Amoeba) — records audio sessions
  - Loopback (Rogue Amoeba) — routes virtual audio (active but no DAW = safe)
  - DreamChamber port 7777 (internal marker that RSP is in a session)
"""

from __future__ import annotations

import asyncio
import logging
import os
import subprocess
import time
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple

logger = logging.getLogger("PULSE")

try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False
    logger.warning("PULSE: psutil not installed — pip install psutil==7.2.2")


# ─────────────────────────────────────────────────────────────────────────────
# DAW PROCESS REGISTRY
# ─────────────────────────────────────────────────────────────────────────────

# These process names trigger STUDIO mode — RSP_001 is making music
DAW_PROCESSES: Set[str] = {
    "Logic Pro X",
    "Logic Pro",
    "Pro Tools",
    "Ableton Live",
    "Live",              # Ableton short name
    "GarageBand",
    "LUNA",
    "LUNA Recording System",
    "Reaper",
    "REAPER",
    "Cubase",
    "Cubase 13",
    "Nuendo",
    "Reason",
    "Reason Studios",
    "Studio One",
    "FL Studio",
    "Digital Performer",
    "Bitwig Studio",
}

# Audio Hijack specifically — if recording is active, treat as STUDIO
AUDIO_CAPTURE_PROCESSES: Set[str] = {
    "Audio Hijack",
    "Farrago",           # Rogue Amoeba soundboard
    "Piezo",             # Rogue Amoeba quick capture
    "SoundSource",       # Rogue Amoeba volume/EQ
}

# These indicate active work but not necessarily music production
# Loopback alone doesn't mean DAW is running
AUDIO_ROUTING_PROCESSES: Set[str] = {
    "Loopback",
    "BlackHole",
}

# If DreamChamber API is actively serving RSP (check port 7777)
DREAMCHAMBER_PORT = 7777


# ─────────────────────────────────────────────────────────────────────────────
# PRIORITY MODES
# ─────────────────────────────────────────────────────────────────────────────

class PriorityMode(str, Enum):
    STUDIO    = "STUDIO"     # music production in progress — back off
    QUIET     = "QUIET"      # system under load — tread lightly
    OVERNIGHT = "OVERNIGHT"  # idle — full power
    EMERGENCY = "EMERGENCY"  # RSP override — no limits

MODE_LIMITS = {
    PriorityMode.STUDIO: {
        "max_cpu_pct":       5.0,
        "max_workers":       1,
        "disk_writes":       False,
        "batch_jobs":        False,
        "analysis_depth":    "metadata_only",
        "emoji":             "🎹",
        "message":           "Studio mode — RSP_001 is producing. Read-only. Whisper quiet.",
    },
    PriorityMode.QUIET: {
        "max_cpu_pct":       20.0,
        "max_workers":       2,
        "disk_writes":       True,
        "batch_jobs":        False,
        "analysis_depth":    "basic",
        "emoji":             "🔇",
        "message":           "Quiet mode — system under load. Light operations only.",
    },
    PriorityMode.OVERNIGHT: {
        "max_cpu_pct":       85.0,
        "max_workers":       12,
        "disk_writes":       True,
        "batch_jobs":        True,
        "analysis_depth":    "deep",
        "emoji":             "🌙",
        "message":           "Overnight mode — GOD.local is idle. Full power authorized.",
    },
    PriorityMode.EMERGENCY: {
        "max_cpu_pct":       100.0,
        "max_workers":       24,
        "disk_writes":       True,
        "batch_jobs":        True,
        "analysis_depth":    "deep",
        "emoji":             "⚡",
        "message":           "Emergency mode — RSP override. No limits. GORUNFREE.",
    },
}


# ─────────────────────────────────────────────────────────────────────────────
# PULSE READING
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class PulseReading:
    """A snapshot of GOD.local's current state."""
    timestamp:          float = field(default_factory=time.time)

    # CPU
    cpu_pct:            float = 0.0      # system-wide CPU %
    cpu_pct_per_core:   List[float] = field(default_factory=list)
    load_avg_1m:        float = 0.0

    # RAM
    ram_total_gb:       float = 0.0
    ram_used_gb:        float = 0.0
    ram_free_gb:        float = 0.0
    ram_pct:            float = 0.0

    # Disk I/O
    disk_read_mbs:      float = 0.0
    disk_write_mbs:     float = 0.0

    # Internal SSD (the critical one — 183MB free last check)
    ssd_free_mb:        float = 0.0
    ssd_pct_used:       float = 0.0

    # DAW detection
    daw_running:        bool = False
    daw_process:        Optional[str] = None
    audio_capture:      bool = False
    audio_capture_proc: Optional[str] = None
    audio_routing:      bool = False

    # Time
    is_night_hours:     bool = False     # 10pm–8am Ottawa time
    is_weekend:         bool = False

    # Derived
    mode:               PriorityMode = PriorityMode.OVERNIGHT
    safe_to_run_batch:  bool = True
    safe_to_write:      bool = True
    reason:             str = ""


# ─────────────────────────────────────────────────────────────────────────────
# PULSE ENGINE
# ─────────────────────────────────────────────────────────────────────────────

class Pulse:
    """GOD.local machine awareness engine.

    Reads system state and returns a PulseReading with mode determination.
    Called by Gabriel Worker before dispatching any job.

    Usage:
        pulse = Pulse()
        reading = pulse.read()
        print(reading.mode)         # OVERNIGHT
        print(reading.safe_to_run_batch)  # True
    """

    def __init__(
        self,
        ssd_mount: str = "/",
        cache_ttl_seconds: float = 5.0,
    ):
        self.ssd_mount = ssd_mount
        self.cache_ttl = cache_ttl_seconds
        self._last_reading: Optional[PulseReading] = None
        self._last_read_time: float = 0
        self._override: Optional[PriorityMode] = None
        self._disk_io_baseline: Optional[dict] = None

    def override(self, mode: PriorityMode) -> None:
        """Force a specific mode (RSP_001 can override)."""
        self._override = mode
        logger.info(f"PULSE: Mode override → {mode.value} by RSP_001")

    def clear_override(self) -> None:
        self._override = None

    def read(self) -> PulseReading:
        """Read GOD.local's current state. Cached for cache_ttl seconds."""
        now = time.time()
        if (self._last_reading and
                (now - self._last_read_time) < self.cache_ttl):
            return self._last_reading

        reading = PulseReading()

        # ── CPU ────────────────────────────────────────────────────────────────
        if HAS_PSUTIL:
            reading.cpu_pct = psutil.cpu_percent(interval=0.5)
            reading.cpu_pct_per_core = psutil.cpu_percent(percpu=True)
            reading.load_avg_1m = os.getloadavg()[0]

            # ── RAM ────────────────────────────────────────────────────────────
            mem = psutil.virtual_memory()
            reading.ram_total_gb = mem.total / 1e9
            reading.ram_used_gb  = mem.used  / 1e9
            reading.ram_free_gb  = mem.available / 1e9
            reading.ram_pct      = mem.percent

            # ── DISK (SSD free space) ──────────────────────────────────────────
            try:
                usage = psutil.disk_usage(self.ssd_mount)
                reading.ssd_free_mb  = usage.free / 1e6
                reading.ssd_pct_used = usage.percent
            except Exception:
                pass

            # ── DISK I/O RATE ─────────────────────────────────────────────────
            try:
                io = psutil.disk_io_counters()
                if self._disk_io_baseline and io:
                    dt = now - self._disk_io_baseline["time"]
                    if dt > 0:
                        dr = io.read_bytes  - self._disk_io_baseline["read"]
                        dw = io.write_bytes - self._disk_io_baseline["write"]
                        reading.disk_read_mbs  = dr / dt / 1e6
                        reading.disk_write_mbs = dw / dt / 1e6
                if io:
                    self._disk_io_baseline = {
                        "time":  now,
                        "read":  io.read_bytes,
                        "write": io.write_bytes,
                    }
            except Exception:
                pass

            # ── DAW DETECTION ──────────────────────────────────────────────────
            try:
                for proc in psutil.process_iter(["name"]):
                    pname = proc.info.get("name", "")
                    if pname in DAW_PROCESSES:
                        reading.daw_running = True
                        reading.daw_process = pname
                    if pname in AUDIO_CAPTURE_PROCESSES:
                        reading.audio_capture = True
                        reading.audio_capture_proc = pname
                    if pname in AUDIO_ROUTING_PROCESSES:
                        reading.audio_routing = True
            except Exception:
                pass
        else:
            # Fallback: use shell commands
            reading = self._read_via_shell(reading)

        # ── TIME AWARENESS ─────────────────────────────────────────────────────
        import datetime
        now_dt = datetime.datetime.now()
        hour = now_dt.hour
        reading.is_night_hours = hour >= 22 or hour < 8
        reading.is_weekend     = now_dt.weekday() >= 5

        # ── MODE DETERMINATION ─────────────────────────────────────────────────
        reading.mode, reading.reason = self._determine_mode(reading)

        if self._override:
            reading.mode   = self._override
            reading.reason = f"RSP_001 override → {self._override.value}"

        limits = MODE_LIMITS[reading.mode]
        reading.safe_to_run_batch = limits["batch_jobs"]
        reading.safe_to_write     = limits["disk_writes"]

        self._last_reading  = reading
        self._last_read_time = now
        return reading

    def _determine_mode(self, r: PulseReading) -> Tuple[PriorityMode, str]:
        """Determine priority mode from system state."""
        # STUDIO: DAW or audio capture running
        if r.daw_running:
            return PriorityMode.STUDIO, f"{r.daw_process} is running"
        if r.audio_capture:
            return PriorityMode.STUDIO, f"{r.audio_capture_proc} is capturing audio"

        # STUDIO: SSD dangerously low (< 500MB — protect production)
        if r.ssd_free_mb < 500 and r.ssd_free_mb > 0:
            return PriorityMode.STUDIO, f"SSD critically low: {r.ssd_free_mb:.0f}MB free"

        # QUIET: Heavy CPU load
        if r.cpu_pct > 70:
            return PriorityMode.QUIET, f"CPU at {r.cpu_pct:.0f}%"

        # QUIET: Low RAM (M2 Ultra has 192GB — if < 8GB free something is wrong)
        if r.ram_free_gb < 8 and r.ram_total_gb > 0:
            return PriorityMode.QUIET, f"RAM low: {r.ram_free_gb:.1f}GB free"

        # OVERNIGHT: idle, night hours, or explicit idle conditions
        if r.cpu_pct < 30 and r.ram_free_gb > 16:
            return PriorityMode.OVERNIGHT, f"CPU={r.cpu_pct:.0f}% RAM_free={r.ram_free_gb:.1f}GB"

        # Default: QUIET (safe fallback)
        return PriorityMode.QUIET, f"CPU={r.cpu_pct:.0f}% RAM_free={r.ram_free_gb:.1f}GB"

    def _read_via_shell(self, reading: PulseReading) -> PulseReading:
        """Fallback when psutil is not installed — use macOS system commands."""
        try:
            # CPU via top
            result = subprocess.run(
                ["top", "-l", "1", "-n", "0"],
                capture_output=True, text=True, timeout=3
            )
            for line in result.stdout.splitlines():
                if "CPU usage:" in line:
                    import re
                    m = re.search(r"([\d.]+)% user.*?([\d.]+)% sys.*?([\d.]+)% idle", line)
                    if m:
                        user = float(m.group(1))
                        sys_  = float(m.group(2))
                        reading.cpu_pct = user + sys_
        except Exception:
            pass

        try:
            # RAM via vm_stat
            result = subprocess.run(
                ["vm_stat"], capture_output=True, text=True, timeout=2
            )
            # Parse pages free * 16384 (4K page size on Apple Silicon)
            for line in result.stdout.splitlines():
                if "Pages free:" in line:
                    pages = int(line.split(":")[1].strip().rstrip("."))
                    reading.ram_free_gb = pages * 16384 / 1e9
        except Exception:
            pass

        try:
            # SSD free
            result = subprocess.run(
                ["df", "-k", "/"], capture_output=True, text=True, timeout=2
            )
            lines = result.stdout.strip().splitlines()
            if len(lines) > 1:
                parts = lines[1].split()
                if len(parts) >= 4:
                    free_kb = int(parts[3])
                    reading.ssd_free_mb = free_kb / 1024
        except Exception:
            pass

        try:
            # DAW detection via pgrep
            for daw in DAW_PROCESSES:
                r = subprocess.run(
                    ["pgrep", "-x", daw],
                    capture_output=True, timeout=1
                )
                if r.returncode == 0:
                    reading.daw_running = True
                    reading.daw_process = daw
                    break
        except Exception:
            pass

        return reading

    def report(self) -> str:
        """Human-readable Pulse report for GABRIEL TTS or dashboard."""
        r = self.read()
        lim = MODE_LIMITS[r.mode]
        lines = [
            f"{lim['emoji']}  PULSE → {r.mode.value}",
            f"   {lim['message']}",
            f"   CPU:  {r.cpu_pct:.1f}%  |  RAM free: {r.ram_free_gb:.1f}GB  |  SSD free: {r.ssd_free_mb:.0f}MB",
        ]
        if r.daw_running:
            lines.append(f"   🎹  DAW: {r.daw_process}")
        if r.audio_capture:
            lines.append(f"   🎙  Capture: {r.audio_capture_proc}")
        if r.audio_routing:
            lines.append(f"   🔊  Audio routing active (Loopback)")
        lines.append(f"   Workers: ≤{lim['max_workers']}  |  Batch: {lim['batch_jobs']}  |  Writes: {lim['disk_writes']}")
        return "\n".join(lines)

    async def watch(self, interval: float = 10.0, callback=None):
        """Async watcher — calls callback when mode changes.

        Usage:
            async def on_mode_change(old_mode, new_mode, reading):
                await gabriel.dispatch(f"Mode changed to {new_mode.value}")

            await pulse.watch(interval=10, callback=on_mode_change)
        """
        last_mode = None
        while True:
            reading = self.read()
            if reading.mode != last_mode:
                if last_mode is not None:
                    logger.info(
                        f"PULSE: Mode changed {last_mode.value} → {reading.mode.value} "
                        f"({reading.reason})"
                    )
                    if callback:
                        await callback(last_mode, reading.mode, reading)
                last_mode = reading.mode
            await asyncio.sleep(interval)

    def throttle_workers(self, requested: int) -> int:
        """How many workers can we actually use right now?"""
        reading = self.read()
        limit = MODE_LIMITS[reading.mode]["max_workers"]
        actual = min(requested, limit)
        if actual < requested:
            logger.info(
                f"PULSE: Throttling workers {requested} → {actual} "
                f"({reading.mode.value}: {reading.reason})"
            )
        return actual

    def check_ssd_safety(self, min_free_mb: float = 1024.0) -> bool:
        """Is there enough SSD space to safely proceed?"""
        reading = self.read()
        safe = reading.ssd_free_mb > min_free_mb
        if not safe:
            logger.warning(
                f"PULSE: SSD critically low — {reading.ssd_free_mb:.0f}MB free "
                f"(need {min_free_mb:.0f}MB). Run SSD cleanup first."
            )
        return safe


# ─────────────────────────────────────────────────────────────────────────────
# GLOBAL SINGLETON — imported by Worker and Gabriel
# ─────────────────────────────────────────────────────────────────────────────

_pulse: Optional[Pulse] = None

def get_pulse() -> Pulse:
    global _pulse
    if _pulse is None:
        _pulse = Pulse()
    return _pulse


# ─────────────────────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(name)s] %(message)s"
    )

    p = argparse.ArgumentParser(prog="pulse", description="Gabriel Pulse — machine awareness")
    sub = p.add_subparsers(dest="cmd")

    sub.add_parser("read",  help="Take a single Pulse reading")
    sub.add_parser("watch", help="Watch for mode changes (Ctrl+C to stop)")

    ov = sub.add_parser("override", help="Force a priority mode")
    ov.add_argument("mode", choices=["STUDIO","QUIET","OVERNIGHT","EMERGENCY"])

    args = p.parse_args()
    pulse = Pulse()

    if args.cmd == "read" or not args.cmd:
        print(pulse.report())
        r = pulse.read()
        print(f"\n  safe_to_run_batch : {r.safe_to_run_batch}")
        print(f"  safe_to_write     : {r.safe_to_write}")
        print(f"  reason            : {r.reason}")

    elif args.cmd == "watch":
        print("PULSE WATCH — monitoring GOD.local (Ctrl+C to stop)\n")
        import signal
        signal.signal(signal.SIGINT, lambda *_: exit(0))
        while True:
            print(pulse.report())
            print()
            time.sleep(10)

    elif args.cmd == "override":
        mode = PriorityMode(args.mode)
        pulse.override(mode)
        print(pulse.report())
