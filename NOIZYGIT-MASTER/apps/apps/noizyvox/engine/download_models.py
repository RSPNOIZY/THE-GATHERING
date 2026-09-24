#!/usr/bin/env python3
"""Download voice cloning models"""
from TTS.api import TTS
import os
print("📥 Downloading XTTS v2 model...")
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
print("✅ XTTS v2 ready!")
print("\n📥 Models downloaded to:", os.path.expanduser("~/.local/share/tts/"))
