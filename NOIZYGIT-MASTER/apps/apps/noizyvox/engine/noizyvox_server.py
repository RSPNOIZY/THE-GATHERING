#!/usr/bin/env python3
"""NOIZYVOX ENGINE - Voice Cloning API Server"""
import os
import uuid
os.environ["COQUI_TOS_AGREED"] = "1"
os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from TTS.api import TTS

VOICES_DIR = Path.home() / "Documents/NOIZYVOX_ENGINE/voices"
OUTPUT_DIR = Path.home() / "Documents/NOIZYVOX_ENGINE/output"
VOICES_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="NOIZYVOX Engine", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

print("🔄 Loading XTTS v2 model...")
# XTTS v2 HiFi-GAN vocoder uses conv1d >65536 channels — MPS unsupported
# CPU on M2 Ultra 24-core is fast enough for real-time synthesis
device = "cpu"

tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)
print(f"✅ Model loaded on {device}")

@app.get("/")
async def root():
    return {"status": "🔥 NOIZYVOX ENGINE RUNNING", "device": device}

@app.get("/voices")
async def get_voices():
    return {"voices": [f.stem for f in VOICES_DIR.glob("*.wav")]}

@app.post("/voice/upload")
async def upload_voice(name: str = Form(...), file: UploadFile = File(...)):
    voice_path = VOICES_DIR / f"{name}.wav"
    content = await file.read()
    with open(voice_path, "wb") as f:
        f.write(content)
    return {"status": "success", "message": f"Voice '{name}' uploaded"}

@app.post("/speak")
async def speak(text: str = Form(...), voice: str = Form("default"), language: str = Form("en")):
    voice_path = VOICES_DIR / f"{voice}.wav"
    if not voice_path.exists():
        raise HTTPException(status_code=404, detail=f"Voice '{voice}' not found")
    output_id = str(uuid.uuid4())[:8]
    output_path = OUTPUT_DIR / f"speech_{output_id}.wav"
    tts.tts_to_file(text=text, speaker_wav=str(voice_path), language=language, file_path=str(output_path))
    return FileResponse(output_path, media_type="audio/wav", filename=f"noizyvox_{output_id}.wav")

if __name__ == "__main__":
    print("🎤 NOIZYVOX ENGINE - http://localhost:8420")
    uvicorn.run(app, host="0.0.0.0", port=8420)
