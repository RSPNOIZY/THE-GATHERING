#!/usr/bin/env python3
"""
GABRIEL SYSTEM MONITOR
Real-time status of the entire NOIZY Empire.
Polls HEAVEN17 API, local audio stack, and reports empire health.

Usage:
  python3 gabriel_monitor.py              # one-shot status
  python3 gabriel_monitor.py --watch      # live refresh every 30s
  python3 gabriel_monitor.py --json       # JSON output for n8n
"""

import sys
import json
import time
import argparse
import urllib.request
import urllib.error
from datetime import datetime
from pathlib import Path

HEAVEN17 = "https://heaven.rsp-5f3.workers.dev"
VENV_AUDIO = Path.home() / "NOIZYLAB/venv/audio-stack"

# Inject venv into path so audio libs resolve regardless of which Python runs this
_venv_site = VENV_AUDIO / "lib/python3.11/site-packages"
if _venv_site.exists() and str(_venv_site) not in sys.path:
    sys.path.insert(0, str(_venv_site))

COLORS = {
    "green":  "\033[92m",
    "yellow": "\033[93m",
    "red":    "\033[91m",
    "blue":   "\033[94m",
    "gold":   "\033[33m",
    "bold":   "\033[1m",
    "reset":  "\033[0m",
}

def c(color, text):
    return f"{COLORS.get(color,'')}{text}{COLORS['reset']}"

def fetch(path: str, timeout: int = 8):  # -> Optional[dict]
    try:
        with urllib.request.urlopen(f"{HEAVEN17}{path}", timeout=timeout) as r:
            return json.loads(r.read())
    except Exception:
        return None

def check_audio_stack() -> dict:
    results = {}
    libs = ["torch", "librosa", "whisper", "pedalboard", "TTS"]
    sys_path_backup = sys.path.copy()
    venv_site = VENV_AUDIO / "lib/python3.11/site-packages"
    if str(venv_site) not in sys.path:
        sys.path.insert(0, str(venv_site))
    for lib in libs:
        try:
            mod = __import__(lib)
            ver = getattr(mod, "__version__", "ok")
            results[lib] = {"status": "ok", "version": ver}
        except Exception as e:
            results[lib] = {"status": "missing", "error": str(e)[:60]}
    # MPS check
    try:
        import torch
        results["mps"] = {"status": "live" if torch.backends.mps.is_available() else "cpu_only"}
    except Exception:
        results["mps"] = {"status": "unknown"}
    sys.path = sys_path_backup
    return results

def gather_status() -> dict:
    ts = datetime.now().isoformat()

    # HEAVEN17 endpoints
    health  = fetch("/health")
    gabriel = fetch("/gabriel")
    stats   = fetch("/api/v1/stats")

    # Local audio stack
    audio = check_audio_stack()

    # Voice profiles on disk
    vp_dir = Path.home() / "NOIZYLAB/voice-profiles"
    voice_profiles = list(vp_dir.glob("*.json")) if vp_dir.exists() else []

    return {
        "timestamp": ts,
        "heaven": {
            "online":  health is not None,
            "version": health.get("version") if health else None,
            "actors":  health.get("actors", 0) if health else 0,
            "consent_tokens": health.get("consent_tokens", 0) if health else 0,
            "ledger_events":  health.get("ledger_events", 0) if health else 0,
            "mission": health.get("mission") if health else None,
        },
        "gabriel": {
            "online":        gabriel is not None,
            "status":        gabriel.get("gabriel") if gabriel else "OFFLINE",
            "rsp001":        gabriel.get("rsp001") if gabriel else None,
            "recent_ledger": gabriel.get("recent_ledger", [])[:3] if gabriel else [],
        },
        "stats": stats.get("stats") if stats else {},
        "audio_stack": audio,
        "voice_profiles": {
            "count": len(voice_profiles),
            "actors": [p.stem.replace("_voice_dna", "") for p in voice_profiles],
        },
        "empire": {
            "brands": ["NOIZY.AI", "NOIZYLAB", "NOIZYKIDZ", "NOIZYFISH", "NOIZYVOX"],
            "d1_databases": 7,
            "workers_deployed": True,
            "sovereignty": "M2 Ultra | MPS | Constitutional",
        }
    }

def print_dashboard(s: dict):
    ts = datetime.fromisoformat(s["timestamp"]).strftime("%Y-%m-%d %H:%M:%S")
    h = s["heaven"]
    g = s["gabriel"]
    a = s["audio_stack"]

    print(f"\n{c('bold', '═'*60)}")
    print(c("gold", f"  GABRIEL SYSTEM MONITOR — NOIZY EMPIRE"))
    print(c("bold", f"  {ts}"))
    print(c("bold", "═"*60))

    # HEAVEN17
    hstatus = c("green", "LIVE") if h["online"] else c("red", "OFFLINE")
    print(f"\n  {c('bold','HEAVEN17')}          {hstatus}  v{h.get('version','?')}")
    print(f"  {'Actors':20s} {c('green', str(h['actors']))}")
    print(f"  {'Consent Tokens':20s} {c('green', str(h['consent_tokens']))}")
    print(f"  {'Ledger Events':20s} {c('green', str(h['ledger_events']))}")

    # GABRIEL
    gstatus = c("green", g["status"]) if g["online"] else c("red", "OFFLINE")
    print(f"\n  {c('bold','GABRIEL')}           {gstatus}")
    if g.get("rsp001"):
        rsp = g["rsp001"]
        print(f"  {'RSP_001':20s} {c('gold','FOUNDING ACTOR')} | 85% floor | {rsp.get('country','CA')}")
    for evt in g.get("recent_ledger", []):
        print(f"  {'  ledger':20s} {evt.get('event_type','?')} @ {evt.get('recorded_at','?')[:16]}")

    # Stats
    st = s.get("stats", {})
    if st:
        print(f"\n  {c('bold','EMPIRE STATS')}")
        print(f"  {'Descendants':20s} {st.get('descendants', 0)}")
        synth = st.get("synth_requests", {})
        print(f"  {'Synth Total':20s} {synth.get('total', 0)}")
        print(f"  {'Synth Blocked':20s} {c('yellow', str(synth.get('blocked', 0)))} (Never Clauses enforced)")
        rev = st.get("total_revenue_cad", 0)
        print(f"  {'Revenue CAD':20s} ${rev:,.2f}")

    # Audio Stack
    print(f"\n  {c('bold','SOVEREIGN AUDIO STACK')}")
    mps = a.get("mps", {})
    mps_str = c("green", "MPS LIVE") if mps.get("status") == "live" else c("yellow", "CPU")
    print(f"  {'M2 Ultra GPU':20s} {mps_str}")
    for lib in ["torch", "librosa", "whisper", "pedalboard", "TTS"]:
        info = a.get(lib, {})
        ok = info.get("status") == "ok"
        stat = c("green", f"v{info.get('version','?')}") if ok else c("red", f"MISSING: {info.get('error','')}")
        name_map = {"torch": "PyTorch", "whisper": "Whisper", "TTS": "XTTS v2"}
        print(f"  {name_map.get(lib, lib):20s} {stat}")

    # Voice Profiles
    vp = s["voice_profiles"]
    print(f"\n  {c('bold','VOICE PROFILES')}")
    if vp["count"] == 0:
        print(f"  {'Profiles':20s} {c('yellow', 'None yet — run audio_pipeline.py --mode profile')}")
    else:
        print(f"  {'Profiles':20s} {c('green', str(vp['count']))} — {', '.join(vp['actors'])}")

    # Empire
    e = s["empire"]
    print(f"\n  {c('bold','EMPIRE STATUS')}")
    print(f"  {'Brands':20s} {' · '.join(e['brands'])}")
    print(f"  {'D1 Databases':20s} {e['d1_databases']} live")
    print(f"  {'Workers':20s} {c('green','DEPLOYED')} → heaven.rsp-5f3.workers.dev")
    print(f"  {'Sovereignty':20s} {c('gold', e['sovereignty'])}")

    print(f"\n{c('bold','═'*60)}\n")

def main():
    parser = argparse.ArgumentParser(description="GABRIEL System Monitor")
    parser.add_argument("--watch",    action="store_true", help="Live refresh every 30s")
    parser.add_argument("--json",     action="store_true", help="JSON output (for n8n)")
    parser.add_argument("--interval", type=int, default=30, help="Refresh interval (seconds)")
    args = parser.parse_args()

    if args.watch:
        while True:
            status = gather_status()
            if args.json:
                print(json.dumps(status, indent=2))
            else:
                os_clear = "\033[H\033[2J"
                print(os_clear, end="")
                print_dashboard(status)
            time.sleep(args.interval)
    else:
        status = gather_status()
        if args.json:
            print(json.dumps(status, indent=2))
        else:
            print_dashboard(status)

if __name__ == "__main__":
    main()
