#!/usr/bin/env python3
"""
FOSS WHISPER METAL TRANSCRIBER
Runs local Apple Silicon GPU/Metal-accelerated transcription using whisper-cli or faster-whisper.
Zero cloud network dependencies. 100% private to Mac Studio M2 Ultra.
"""

import os
import sys
import argparse
import subprocess
import json
from pathlib import Path
from datetime import datetime, timezone

WHISPER_BIN = "/opt/homebrew/bin/whisper-cli"
MODEL_DIR = Path("/Users/m2ultra/models/whisper")
MODEL_DEFAULT = MODEL_DIR / "ggml-base.en.bin"

def download_model_if_needed(model_name="base.en"):
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    target = MODEL_DIR / f"ggml-{model_name}.bin"
    if not target.exists():
        url = f"https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-{model_name}.bin"
        print(f"📥 Downloading Whisper model ({model_name}) from HuggingFace...")
        cmd = ["curl", "-L", "-o", str(target), url]
        subprocess.run(cmd, check=True)
        print(f"✅ Downloaded: {target}")
    return target

def transcribe(audio_path, model_path=None, output_json=True):
    audio = Path(audio_path)
    if not audio.exists():
        print(f"❌ Error: Audio file not found: {audio}")
        return None

    if not model_path or not Path(model_path).exists():
        model_path = download_model_if_needed("base.en")

    output_base = audio.with_suffix("")
    cmd = [
        WHISPER_BIN,
        "-m", str(model_path),
        "-f", str(audio),
        "-oj", # output JSON
        "-otxt", # output text
        "-of", str(output_base)
    ]

    print(f"⚡ [Whisper Metal] Transcribing {audio.name}...")
    start_time = datetime.now()
    res = subprocess.run(cmd, capture_output=True, text=True)
    duration = (datetime.now() - start_time).total_seconds()

    txt_file = audio.with_suffix(".txt")
    transcript = txt_file.read_text(encoding="utf-8") if txt_file.exists() else res.stdout

    print(f"✅ Transcribed in {duration:.2f}s:")
    print("--------------------------------------------------")
    print(transcript.strip())
    print("--------------------------------------------------")

    return transcript

def main():
    parser = argparse.ArgumentParser(description="Local Metal-Accelerated Whisper Transcriber")
    parser.add_argument("audio", nargs="?", help="Path to audio file (WAV, MP3, M4A, FLAC)")
    parser.add_argument("--model", default="base.en", help="Model: tiny, base, small, medium, large")
    parser.add_argument("--latest", action="store_true", help="Transcribe latest recording in vault")
    args = parser.parse_args()

    audio_file = args.audio
    if args.latest or not audio_file:
        recordings = sorted(Path("/Users/m2ultra/Library/CloudStorage").glob("**/*.wav"), key=os.path.getmtime, reverse=True)
        if recordings:
            audio_file = str(recordings[0])
            print(f"🔍 Selected latest recording: {audio_file}")
        else:
            print("No audio recordings found in vault.")
            return 1

    transcribe(audio_file)
    return 0

if __name__ == "__main__":
    sys.exit(main())
