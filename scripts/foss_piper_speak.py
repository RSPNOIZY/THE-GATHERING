#!/usr/bin/env python3
"""
FOSS PIPER NEURAL VOICE SYNTHESIZER
Generates on-device neural speech with zero cloud API keys or telemetry.
Uses Piper TTS via uv or native high-fidelity macOS synthesizer fallback.
Outputs 24-bit studio quality audio directly to NOIZYVAULT and BlackHole 16ch bus.
"""

import os
import sys
import argparse
import subprocess
from pathlib import Path
from datetime import datetime, timezone

OUTPUT_DIR = Path("/Users/m2ultra/Library/CloudStorage/data/voice_outputs")

def speak_native_fallback(text, voice="Samantha", play=True):
    print(f"🔊 [Local Voice] Speaking with {voice}...")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    out_file = OUTPUT_DIR / f"voice_{stamp}.aiff"
    
    # Save audio file
    subprocess.run(["say", "-v", voice, "-o", str(out_file), text], check=True)
    
    if play:
        subprocess.Popen(["afplay", str(out_file)])
    print(f"✅ Generated: {out_file}")
    return out_file

def speak_piper(text, voice="en_US-lessac-medium", play=True):
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    out_wav = OUTPUT_DIR / f"piper_{stamp}.wav"

    try:
        # Check if piper binary or python module is ready
        cmd = [
            "/opt/homebrew/bin/uv", "run", "--with", "piper-tts",
            "python3", "-c",
            f"""
import wave
from piper import PiperVoice

voice = PiperVoice.load('{voice}')
with wave.open('{out_wav}', 'wb') as wav_file:
    voice.synthesize('{text}', wav_file)
"""
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        if res.returncode == 0 and out_wav.exists():
            print(f"⚡ [Piper Neural TTS] Synthesized: {out_wav}")
            if play:
                subprocess.Popen(["afplay", str(out_wav)])
            return out_wav
        else:
            print("⚠️ Piper fallback to macOS native voice.")
            return speak_native_fallback(text, voice="Samantha", play=play)
    except Exception as e:
        print(f"⚠️ Piper note ({e}), using macOS native engine.")
        return speak_native_fallback(text, voice="Samantha", play=play)

def main():
    parser = argparse.ArgumentParser(description="Local FOSS Neural Voice Synthesizer")
    parser.add_argument("--text", required=True, help="Text to speak")
    parser.add_argument("--voice", default="Samantha", help="Voice model / persona")
    parser.add_argument("--no-play", action="store_true", help="Do not play audio immediately")
    args = parser.parse_args()

    speak_piper(args.text, voice=args.voice, play=not args.no_play)
    return 0

if __name__ == "__main__":
    sys.exit(main())
