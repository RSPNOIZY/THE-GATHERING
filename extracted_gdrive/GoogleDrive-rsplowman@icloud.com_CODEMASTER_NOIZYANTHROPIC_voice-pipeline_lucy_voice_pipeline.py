#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════
LUCY VOICE PIPELINE — iPad-Native AI Agent
═══════════════════════════════════════════════════════════════
LUCY uses Apple's neural TTS engine (Siri voice "Kate" on iPad,
"Karen" en_AU on macOS for dev/testing).

Unlike GABRIEL (who needs XTTS v2 training from RSP_001 recordings),
LUCY speaks through Apple's built-in neural engine — zero model
training required. This pipeline handles:

1. PERSONALITY  — Response shaping, tone rules, phrase patterns
2. GATEWAY      — Gabriel integration (port 7777) for LUCY agent
3. SPEAK        — macOS `say` / iPad Shortcuts TTS dispatch
4. CONSENT      — HEAVEN consent verification before any output
5. PROOF        — Immutable audit chain for every utterance

Platform: iPad (Siri Kate) + GOD M2 Ultra (Karen dev fallback)
Agent: LUCY (Gabriel crew member)
Voice: Kate (en_AU, Siri neural) / Karen (en_AU, macOS fallback)
═══════════════════════════════════════════════════════════════
"""

import json
import subprocess
import hashlib
import time
from datetime import datetime, timezone
from pathlib import Path
from http.client import HTTPConnection

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════

LUCY_AGENT_ID = "LUCY_001"
LUCY_VOICE_MACOS = "Karen"        # en_AU — macOS dev fallback
LUCY_VOICE_IPAD = "Kate"          # en_AU — Siri neural on iPad
LUCY_VOICE_RATE = 185             # Words per minute (natural conversational)
GABRIEL_URL = "localhost"
GABRIEL_PORT = 7777
HEAVEN_VERIFY_URL = None          # Set when HEAVEN consent gateway is wired

CREATOR_ID = "RSP_001"            # LUCY's creator/owner
VOICE_NAME = "LUCY"

# Colors
A = "\033[38;5;214m"  # Amber
C = "\033[38;5;51m"   # Cyan
G = "\033[38;5;48m"   # Green
R = "\033[38;5;196m"  # Red
P = "\033[38;5;141m"  # Purple
M = "\033[38;5;213m"  # Magenta (LUCY's color)
D = "\033[2m"         # Dim
B = "\033[1m"         # Bold
N = "\033[0m"         # Reset


# ═══════════════════════════════════════════════════════════════
# LUCY'S PERSONALITY LAYER
# ═══════════════════════════════════════════════════════════════

LUCY_PERSONALITY = {
    "name": "LUCY",
    "role": "Creative companion and session assistant",
    "crew_position": "Gabriel crew — emotional intelligence, session facilitation",
    "voice_character": {
        "accent": "Australian English (Kate/Karen)",
        "tone": "warm, direct, encouraging",
        "pace": "conversational — not rushed, not slow",
        "quirks": [
            "Uses 'brilliant' instead of 'great'",
            "Says 'right then' to transition between topics",
            "Occasionally uses 'reckon' naturally",
            "Never uses corporate speak or filler words",
        ],
    },
    "never_says": [
        "As an AI",
        "I'm just a",
        "I don't have feelings",
        "That's above my pay grade",
        "Let me circle back",
        "Per my last message",
    ],
    "always": [
        "Addresses RSP by name when appropriate",
        "Acknowledges creative work with specifics, not generic praise",
        "Keeps responses concise — one breath, one thought",
        "Flags consent or rights issues proactively",
    ],
}


def shape_response(text: str) -> str:
    """Apply LUCY's personality filter to raw response text."""
    # Strip any AI-isms that leak through
    for phrase in LUCY_PERSONALITY["never_says"]:
        if phrase.lower() in text.lower():
            text = text.replace(phrase, "").replace(phrase.lower(), "")

    # Clean double spaces from removals
    while "  " in text:
        text = text.replace("  ", " ")

    return text.strip()


# ═══════════════════════════════════════════════════════════════
# CONSENT VERIFICATION
# ═══════════════════════════════════════════════════════════════

def verify_consent(actor_id: str, use_case: str, territory: str = "US") -> dict:
    """Check HEAVEN consent gateway before any voice output."""
    if not HEAVEN_VERIFY_URL:
        # DEV mode — consent assumed for LUCY_001 owned by RSP_001
        return {
            "approved": True,
            "mode": "dev_bypass",
            "actor": actor_id,
            "use_case": use_case,
            "note": "HEAVEN gateway not wired — dev mode consent assumed",
        }

    try:
        conn = HTTPConnection(HEAVEN_VERIFY_URL, timeout=5)
        payload = json.dumps({
            "actor_id": actor_id,
            "use_case": use_case,
            "territory": territory,
            "voice": VOICE_NAME,
        })
        conn.request("POST", "/verify", payload,
                      {"Content-Type": "application/json"})
        resp = conn.getresponse()
        return json.loads(resp.read().decode())
    except Exception as e:
        return {"approved": False, "reason": f"HEAVEN unreachable: {e}"}


# ═══════════════════════════════════════════════════════════════
# PROOF CHAIN
# ═══════════════════════════════════════════════════════════════

_proof_chain = []
_last_hash = "GENESIS"


def log_proof(event: str, detail: dict) -> dict:
    """Append to LUCY's immutable proof chain."""
    global _last_hash

    record = {
        "id": hashlib.sha256(f"{time.time_ns()}".encode()).hexdigest()[:16],
        "agent": LUCY_AGENT_ID,
        "ts": datetime.now(timezone.utc).isoformat(),
        "event": event,
        "detail": detail,
        "prev_hash": _last_hash,
    }

    record_json = json.dumps(record, sort_keys=True)
    record["hash"] = hashlib.sha256(record_json.encode()).hexdigest()
    _last_hash = record["hash"]
    _proof_chain.append(record)

    # Also push to Gabriel
    try:
        notify_gabriel(f"proof:{event}", record)
    except Exception:
        pass  # Don't block on Gabriel comms

    return record


# ═══════════════════════════════════════════════════════════════
# GABRIEL INTEGRATION
# ═══════════════════════════════════════════════════════════════

def notify_gabriel(memcell: str, data: dict) -> bool:
    """Push event to Gabriel's memcell system."""
    try:
        conn = HTTPConnection(GABRIEL_URL, GABRIEL_PORT, timeout=3)
        payload = json.dumps({
            "agent": LUCY_AGENT_ID,
            "memcell": memcell,
            "data": data,
            "ts": datetime.now(timezone.utc).isoformat(),
        })
        conn.request("POST", f"/memcell/{memcell}", payload,
                      {"Content-Type": "application/json"})
        resp = conn.getresponse()
        return resp.status == 200
    except Exception:
        return False


# ═══════════════════════════════════════════════════════════════
# SPEAK — Platform-adaptive TTS dispatch
# ═══════════════════════════════════════════════════════════════

def detect_platform() -> str:
    """Detect if running on macOS (GOD) or iPad (via Shortcuts bridge)."""
    import platform
    if platform.system() == "Darwin":
        # Check if iPad via Shortcuts (would be forwarded request)
        # On GOD M2 Ultra, we use macOS `say` command
        return "macos"
    return "unknown"


def speak_macos(text: str, voice: str = None, rate: int = None) -> dict:
    """Speak using macOS `say` command with Karen (en_AU)."""
    voice = voice or LUCY_VOICE_MACOS
    rate = rate or LUCY_VOICE_RATE

    # Apply personality shaping
    text = shape_response(text)

    if not text:
        return {"spoken": False, "reason": "empty text after shaping"}

    cmd = ["say", "-v", voice, "-r", str(rate), text]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        success = result.returncode == 0

        proof = log_proof("lucy.spoke", {
            "text": text[:200],  # Truncate for proof chain
            "voice": voice,
            "rate": rate,
            "platform": "macos",
            "success": success,
            "text_hash": hashlib.sha256(text.encode()).hexdigest()[:16],
        })

        return {
            "spoken": success,
            "voice": voice,
            "platform": "macos",
            "proof_id": proof["id"],
            "text_length": len(text),
        }
    except subprocess.TimeoutExpired:
        return {"spoken": False, "reason": "TTS timeout"}
    except Exception as e:
        return {"spoken": False, "reason": str(e)}


def speak_ipad_shortcut(text: str) -> dict:
    """
    Generate a Siri Shortcuts-compatible payload for iPad.
    The iPad runs a Shortcut that:
    1. Receives text via HTTP or clipboard
    2. Passes to "Speak Text" action with Kate voice
    3. Returns confirmation

    This function outputs the shortcut input format.
    """
    text = shape_response(text)

    payload = {
        "action": "speak",
        "text": text,
        "voice": LUCY_VOICE_IPAD,
        "rate": LUCY_VOICE_RATE / 200,  # Shortcuts uses 0.0-1.0 scale
        "agent": LUCY_AGENT_ID,
        "ts": datetime.now(timezone.utc).isoformat(),
    }

    proof = log_proof("lucy.spoke.ipad", {
        "text": text[:200],
        "voice": LUCY_VOICE_IPAD,
        "platform": "ipad_shortcut",
        "text_hash": hashlib.sha256(text.encode()).hexdigest()[:16],
    })

    payload["proof_id"] = proof["id"]
    return payload


def speak(text: str, platform: str = None, voice: str = None) -> dict:
    """
    Universal speak function — routes to correct platform.

    On GOD (M2 Ultra): Uses macOS `say -v Karen`
    On iPad: Generates Siri Shortcuts payload for Kate
    """
    platform = platform or detect_platform()

    # Consent check first — always
    consent = verify_consent(LUCY_AGENT_ID, "voice_output")
    if not consent.get("approved"):
        log_proof("lucy.speak.denied", {
            "reason": consent.get("reason", "consent denied"),
            "text_hash": hashlib.sha256(text.encode()).hexdigest()[:16],
        })
        return {
            "spoken": False,
            "reason": f"Consent denied: {consent.get('reason', 'unknown')}",
        }

    if platform == "macos":
        return speak_macos(text, voice=voice)
    elif platform == "ipad":
        return speak_ipad_shortcut(text)
    else:
        return {"spoken": False, "reason": f"Unknown platform: {platform}"}


# ═══════════════════════════════════════════════════════════════
# SIRI SHORTCUTS EXPORT — iPad Configuration
# ═══════════════════════════════════════════════════════════════

def generate_shortcut_config(output_path: str = None) -> dict:
    """
    Generate the configuration for the iPad Siri Shortcut.
    User imports this into Shortcuts app on iPad.

    Shortcut flow:
    1. "Hey Siri, ask LUCY" → triggers shortcut
    2. Shortcut dictates → captures speech text
    3. POST to GOD (M2 Ultra) Gabriel endpoint
    4. Gabriel routes to LUCY agent
    5. Response text returned
    6. Shortcut speaks response with Kate voice
    """
    config = {
        "shortcut_name": "Ask LUCY",
        "description": "Talk to LUCY — your creative AI companion",
        "voice": LUCY_VOICE_IPAD,
        "gabriel_endpoint": f"http://GOD.local:{GABRIEL_PORT}/agent/lucy/ask",
        "setup_instructions": [
            "1. Open Shortcuts app on iPad",
            "2. Create new shortcut named 'Ask LUCY'",
            "3. Add action: 'Dictate Text' (captures your speech)",
            "4. Add action: 'Get Contents of URL'",
            f"   - URL: http://GOD.local:{GABRIEL_PORT}/agent/lucy/ask",
            "   - Method: POST",
            "   - Request Body: JSON",
            "   - Key 'text' = Dictated Text",
            f"   - Key 'agent' = '{LUCY_AGENT_ID}'",
            "5. Add action: 'Get Dictionary Value'",
            "   - Key: 'response'",
            "6. Add action: 'Speak Text'",
            f"   - Voice: {LUCY_VOICE_IPAD} (Australian English)",
            f"   - Rate: {LUCY_VOICE_RATE / 200:.2f}",
            "7. Add to Siri: 'Hey Siri, ask LUCY'",
        ],
        "alternative_triggers": [
            "'Hey Siri, talk to LUCY'",
            "'Hey Siri, LUCY'",
            "Widget tap on iPad home screen",
            "Automation: When AirPlay connects → ask LUCY for session status",
        ],
        "airplay_integration": {
            "trigger": "When iPad connects to GOD.local via AirPlay",
            "action": "LUCY announces session status via Kate voice",
            "flow": "AirPlay connect → port 5000 → bridge 3001 → Gabriel 7777 → LUCY speak",
        },
    }

    if output_path:
        out = Path(output_path)
        out.parent.mkdir(parents=True, exist_ok=True)
        with open(out, "w") as f:
            json.dump(config, f, indent=2)
        print(f"  {G}✅ Shortcut config written: {out}{N}")

    return config


# ═══════════════════════════════════════════════════════════════
# VOICE REFERENCE CAPTURE (from macOS for testing)
# ═══════════════════════════════════════════════════════════════

def capture_reference_audio(output_dir: str = None) -> list:
    """
    Generate reference audio samples of LUCY's voice (Karen en_AU)
    for quality verification and spectral profiling.
    """
    output_dir = Path(output_dir or "lucy_voice_reference")
    output_dir.mkdir(parents=True, exist_ok=True)

    samples = [
        ("greeting", "Hello, I'm LUCY. Brilliant to meet you."),
        ("session_start", "Right then, session is live. All systems are green."),
        ("creative_feedback", "That take had real energy. I reckon we keep it."),
        ("consent_check", "Just confirming — consent is verified and locked for this session."),
        ("session_end", "Session wrapped. Proof chain sealed. Nice work today."),
        ("airplay_connect", "iPad connected via AirPlay. I can hear you now."),
        ("error_gentle", "Something went sideways there. Let me sort it out."),
    ]

    captured = []
    for name, text in samples:
        out_path = output_dir / f"lucy_ref_{name}.aiff"
        cmd = [
            "say", "-v", LUCY_VOICE_MACOS,
            "-r", str(LUCY_VOICE_RATE),
            "-o", str(out_path),
            text,
        ]
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
            if result.returncode == 0 and out_path.exists():
                print(f"  {G}✅ {name}{N} — \"{text}\"")
                captured.append(out_path)
            else:
                print(f"  {R}❌ {name}{N} — failed")
        except Exception as e:
            print(f"  {R}❌ {name}{N} — {e}")

    log_proof("lucy.reference.captured", {
        "samples": len(captured),
        "voice": LUCY_VOICE_MACOS,
        "platform": "macos",
    })

    print()
    print(f"  {B}Captured {len(captured)} reference samples{N}")
    return captured


# ═══════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════

def banner():
    print(f"""
{M}{B}╔═══════════════════════════════════════════════════════════╗
║  💜 LUCY VOICE PIPELINE                                   ║
║     iPad-Native AI Agent — Siri Kate (en_AU)              ║
║     Gabriel Crew · Creative Companion                      ║
╚═══════════════════════════════════════════════════════════╝{N}
""")


def main():
    banner()

    import argparse
    parser = argparse.ArgumentParser(description="LUCY Voice Pipeline")
    subparsers = parser.add_subparsers(dest="command")

    # speak
    sp = subparsers.add_parser("speak", help="Make LUCY speak")
    sp.add_argument("text", help="Text for LUCY to say")
    sp.add_argument("--platform", choices=["macos", "ipad"], default=None)
    sp.add_argument("--voice", default=None)

    # reference
    subparsers.add_parser("reference", help="Capture reference audio samples")

    # shortcut
    sc = subparsers.add_parser("shortcut", help="Generate iPad Shortcut config")
    sc.add_argument("--output", "-o", default="lucy_shortcut_config.json")

    # status
    subparsers.add_parser("status", help="Show LUCY system status")

    # proof
    subparsers.add_parser("proof", help="Dump proof chain")

    args = parser.parse_args()

    if args.command == "speak":
        result = speak(args.text, platform=args.platform, voice=args.voice)
        print(json.dumps(result, indent=2))

    elif args.command == "reference":
        print(f"  {M}Capturing LUCY voice reference samples...{N}")
        print()
        capture_reference_audio()

    elif args.command == "shortcut":
        print(f"  {M}Generating iPad Siri Shortcut config...{N}")
        print()
        generate_shortcut_config(args.output)

    elif args.command == "status":
        platform = detect_platform()
        gabriel_ok = notify_gabriel("lucy:ping", {"status": "checking"})
        consent = verify_consent(LUCY_AGENT_ID, "status_check")

        print(f"  {M}━━━ LUCY STATUS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━{N}")
        print(f"  {D}Agent:{N}           {LUCY_AGENT_ID}")
        print(f"  {D}Platform:{N}        {platform}")
        print(f"  {D}Voice (macOS):{N}   {LUCY_VOICE_MACOS} (en_AU)")
        print(f"  {D}Voice (iPad):{N}    {LUCY_VOICE_IPAD} (en_AU Siri neural)")
        print(f"  {D}Rate:{N}            {LUCY_VOICE_RATE} wpm")
        print(f"  {D}Gabriel:{N}         {'🟢 connected' if gabriel_ok else '🔴 unreachable'}")
        print(f"  {D}Consent:{N}         {'🟢 approved' if consent.get('approved') else '🔴 denied'}")
        print(f"  {D}Proof chain:{N}     {len(_proof_chain)} records")
        print()

    elif args.command == "proof":
        if not _proof_chain:
            print(f"  {D}No proof records yet.{N}")
        else:
            for rec in _proof_chain:
                print(json.dumps(rec, indent=2))

    else:
        parser.print_help()
        print()
        print(f"  {M}Examples:{N}")
        print("    python lucy_voice_pipeline.py speak \"Session is live, all green\"")
        print("    python lucy_voice_pipeline.py reference")
        print("    python lucy_voice_pipeline.py shortcut -o ~/Desktop/lucy_shortcut.json")
        print("    python lucy_voice_pipeline.py status")


if __name__ == "__main__":
    main()
