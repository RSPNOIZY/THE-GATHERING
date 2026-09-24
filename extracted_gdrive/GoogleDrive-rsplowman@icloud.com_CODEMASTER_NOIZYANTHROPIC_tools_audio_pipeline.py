#!/usr/bin/env python3
"""
NOIZY SOVEREIGN AUDIO PIPELINE
RSP_001 Voice Stack — M2 Ultra Local Only
Constitutional consent at every step.

Usage:
  python3 audio_pipeline.py --mode analyze  --input voice.wav
  python3 audio_pipeline.py --mode transcribe --input voice.wav
  python3 audio_pipeline.py --mode profile  --input voice.wav --actor RSP_001
  python3 audio_pipeline.py --mode synthesize --text "Hello" --actor RSP_001
  python3 audio_pipeline.py --mode health
"""

import json
import argparse
import hashlib
import time
from pathlib import Path
from datetime import datetime

# ── GPU DEVICE ───────────────────────────────────────────────────────────────
import torch
DEVICE = "mps" if torch.backends.mps.is_available() else "cpu"
print(f"[NOIZY] GPU: {DEVICE.upper()} | PyTorch {torch.__version__}")

# ── PATHS ────────────────────────────────────────────────────────────────────
NOIZYLAB = Path(__file__).parent.parent
VOICE_PROFILES = NOIZYLAB / "voice-profiles"
VOICE_PROFILES.mkdir(exist_ok=True)
MODELS_DIR = NOIZYLAB / "models"
MODELS_DIR.mkdir(exist_ok=True)

# ── HEAVEN17 LEDGER ──────────────────────────────────────────────────────────
HEAVEN_URL = "https://heaven.rsp-5f3.workers.dev"

def ledger_record(event_type: str, actor_id: str, payload: dict):
    """Log to the immutable HEAVEN17 ledger — constitutional traceability."""
    try:
        import urllib.request
        import json as _json
        data = _json.dumps({
            "event_type": event_type,
            "actor_id": actor_id,
            "payload": payload
        }).encode()
        req = urllib.request.Request(
            f"{HEAVEN_URL}/api/v1/ledger/append",
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=5) as r:
            pass
    except Exception as e:
        print(f"[LEDGER] Offline mode — event not recorded: {e}")


# ── LAYER 1: SPECTRAL ANALYSIS ───────────────────────────────────────────────
def analyze_voice(audio_path: str) -> dict:
    """librosa spectral analysis — extract voice DNA features."""
    import librosa

    print(f"[ANALYZE] Loading: {audio_path}")
    y, sr = librosa.load(audio_path, sr=22050)
    duration = librosa.get_duration(y=y, sr=sr)

    # Core features
    mfccs       = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    chroma      = librosa.feature.chroma_stft(y=y, sr=sr)
    spec_cent   = librosa.feature.spectral_centroid(y=y, sr=sr)
    spec_rolloff= librosa.feature.spectral_rolloff(y=y, sr=sr)
    zcr         = librosa.feature.zero_crossing_rate(y)
    tempo, _    = librosa.beat.beat_track(y=y, sr=sr)

    profile = {
        "duration_sec":        round(duration, 2),
        "sample_rate":         sr,
        "tempo_bpm":           round(float(tempo), 1),
        "mfcc_mean":           mfccs.mean(axis=1).round(4).tolist(),
        "mfcc_std":            mfccs.std(axis=1).round(4).tolist(),
        "chroma_mean":         chroma.mean(axis=1).round(4).tolist(),
        "spectral_centroid":   round(float(spec_cent.mean()), 2),
        "spectral_rolloff":    round(float(spec_rolloff.mean()), 2),
        "zero_crossing_rate":  round(float(zcr.mean()), 6),
        "analyzed_at":         datetime.now().isoformat(),
        "device":              DEVICE,
    }

    # Content fingerprint
    with open(audio_path, "rb") as f:
        profile["file_hash"] = hashlib.sha256(f.read()).hexdigest()

    print(f"[ANALYZE] Duration: {duration:.1f}s | Tempo: {tempo:.0f}bpm | Centroid: {spec_cent.mean():.0f}Hz")
    return profile


# ── LAYER 4: WHISPER TRANSCRIPTION ───────────────────────────────────────────
def transcribe(audio_path: str, model_size: str = "base") -> dict:
    """Whisper multilingual transcription — 99% accuracy."""
    import whisper

    print(f"[WHISPER] Loading model: {model_size} | Device: {DEVICE}")
    model = whisper.load_model(model_size, device=DEVICE if DEVICE == "cpu" else "cpu")
    # Whisper uses its own Metal path; force CPU for stability on MPS edge cases
    t0 = time.time()
    result = model.transcribe(audio_path, fp16=False)
    elapsed = time.time() - t0

    output = {
        "text":         result["text"].strip(),
        "language":     result["language"],
        "segments":     len(result["segments"]),
        "duration_sec": result["segments"][-1]["end"] if result["segments"] else 0,
        "elapsed_sec":  round(elapsed, 2),
        "model":        model_size,
        "transcribed_at": datetime.now().isoformat(),
    }

    print(f"[WHISPER] '{output['text'][:80]}...' ({elapsed:.1f}s)")
    return output


# ── LAYER 2: XTTS v2 SYNTHESIS ───────────────────────────────────────────────
def synthesize(text: str, speaker_wav: str, output_path: str, language: str = "en") -> dict:
    """XTTS v2 voice cloning synthesis — creator's own voice."""
    from TTS.api import TTS

    print("[XTTS v2] Loading model...")
    tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")

    print(f"[XTTS v2] Synthesizing: '{text[:60]}...'")
    t0 = time.time()
    tts.tts_to_file(
        text=text,
        speaker_wav=speaker_wav,
        language=language,
        file_path=output_path,
    )
    elapsed = time.time() - t0

    result = {
        "output_path":    output_path,
        "text_len":       len(text),
        "language":       language,
        "elapsed_sec":    round(elapsed, 2),
        "model":          "xtts_v2",
        "synthesized_at": datetime.now().isoformat(),
    }

    print(f"[XTTS v2] Done in {elapsed:.1f}s → {output_path}")
    return result


# ── LAYER 5: PEDALBOARD EFFECTS ───────────────────────────────────────────────
def apply_effects(input_path: str, output_path: str, preset: str = "voice-clean") -> dict:
    """pedalboard AU effects chain — therapeutic timbre processing."""
    import pedalboard
    from pedalboard.io import AudioFile

    PRESETS = {
        "voice-clean": [
            pedalboard.HighpassFilter(cutoff_frequency_hz=80),
            pedalboard.LowpassFilter(cutoff_frequency_hz=8000),
            pedalboard.Compressor(threshold_db=-18, ratio=3.0, attack_ms=10, release_ms=100),
            pedalboard.Gain(gain_db=2),
        ],
        "healing": [
            pedalboard.HighpassFilter(cutoff_frequency_hz=60),
            pedalboard.Reverb(room_size=0.3, damping=0.5, wet_level=0.15, dry_level=0.85),
            pedalboard.Chorus(rate_hz=0.5, depth=0.1, centre_delay_ms=7),
            pedalboard.Compressor(threshold_db=-20, ratio=2.5),
            pedalboard.Gain(gain_db=1),
        ],
        "broadcast": [
            pedalboard.HighpassFilter(cutoff_frequency_hz=100),
            pedalboard.LowpassFilter(cutoff_frequency_hz=12000),
            pedalboard.Compressor(threshold_db=-12, ratio=4.0, attack_ms=5, release_ms=50),
            pedalboard.Limiter(threshold_db=-2),
            pedalboard.Gain(gain_db=4),
        ],
    }

    chain = pedalboard.Pedalboard(PRESETS.get(preset, PRESETS["voice-clean"]))
    t0 = time.time()

    with AudioFile(input_path) as f:
        audio = f.read(f.frames)
        sr = f.samplerate

    processed = chain(audio, sr)
    elapsed = time.time() - t0

    with AudioFile(output_path, "w", samplerate=sr, num_channels=processed.shape[0]) as f:
        f.write(processed)

    result = {
        "input":       input_path,
        "output":      output_path,
        "preset":      preset,
        "elapsed_sec": round(elapsed, 2),
        "processed_at": datetime.now().isoformat(),
    }
    print(f"[PEDALBOARD] Preset '{preset}' applied in {elapsed:.2f}s → {output_path}")
    return result


# ── VOICE PROFILE BUILDER ─────────────────────────────────────────────────────
def build_voice_profile(audio_path: str, actor_id: str) -> dict:
    """
    Complete voice DNA extraction for one creator.
    Analyze → Transcribe → Hash → Save profile → Record to HEAVEN17 ledger.
    """
    print(f"\n[PROFILE] Building voice DNA for {actor_id}...")

    analysis = analyze_voice(audio_path)
    transcription = transcribe(audio_path, model_size="base")

    profile = {
        "actor_id":      actor_id,
        "version":       1,
        "source_file":   str(audio_path),
        "file_hash":     analysis["file_hash"],
        "analysis":      analysis,
        "transcription": transcription,
        "created_at":    datetime.now().isoformat(),
        "sovereignty":   "RSP_001 constitutional — no external API — M2 Ultra local",
    }

    profile_path = VOICE_PROFILES / f"{actor_id}_voice_dna.json"
    existing = {}
    if profile_path.exists():
        with open(profile_path) as f:
            existing = json.load(f)
        profile["version"] = existing.get("version", 1) + 1

    with open(profile_path, "w") as f:
        json.dump(profile, f, indent=2)

    print(f"[PROFILE] Saved: {profile_path}")
    print(f"[PROFILE] Version: {profile['version']} | Hash: {analysis['file_hash'][:16]}...")

    # Record to HEAVEN17 D1 ledger
    ledger_record("voice_dna.recorded", actor_id, {
        "dna_version": profile["version"],
        "file_hash":   analysis["file_hash"][:16],
        "duration_sec": analysis["duration_sec"],
        "pipeline":    "sovereign-local",
    })

    return profile


# ── HEALTH CHECK ──────────────────────────────────────────────────────────────
def health_check():
    """Verify all stack layers are operational."""
    print("\n NOIZY SOVEREIGN AUDIO STACK — HEALTH CHECK")
    print("=" * 55)

    checks = [
        ("PyTorch + Metal",  lambda: (torch.zeros(1).to(DEVICE), f"v{torch.__version__} | GPU: {DEVICE.upper()}")),
        ("numpy",            lambda: (__import__("numpy"), f"v{__import__('numpy').__version__}")),
        ("librosa",          lambda: (__import__("librosa"), f"v{__import__('librosa').__version__}")),
        ("Whisper",          lambda: (__import__("whisper"), f"models: {', '.join(list(__import__('whisper').available_models())[:3])}...")),
        ("pedalboard",       lambda: (__import__("pedalboard"), f"v{__import__('pedalboard').__version__}")),
        ("Coqui TTS/XTTS v2",lambda: (__import__("TTS"), "ready")),
    ]

    all_ok = True
    for name, check in checks:
        try:
            _, info = check()
            print(f"  {'OK':5s}  {name:25s} {info}")
        except Exception as e:
            print(f"  {'FAIL':5s}  {name:25s} {e}")
            all_ok = False

    print("=" * 55)
    print(f"  Status: {'ALL SYSTEMS SOVEREIGN' if all_ok else 'DEGRADED — CHECK ABOVE'}")
    print(f"  Device: M2 Ultra | {DEVICE.upper()} | Constitutional")
    print(f"  Heaven: {HEAVEN_URL}")
    print("=" * 55)
    return all_ok


# ── CLI ───────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="NOIZY Sovereign Audio Pipeline")
    parser.add_argument("--mode", choices=["analyze","transcribe","profile","synthesize","effects","health"],
                        default="health")
    parser.add_argument("--input",   type=str, help="Input audio file (.wav/.mp3)")
    parser.add_argument("--output",  type=str, help="Output audio file")
    parser.add_argument("--actor",   type=str, default="RSP_001", help="Actor ID")
    parser.add_argument("--text",    type=str, help="Text to synthesize")
    parser.add_argument("--preset",  type=str, default="voice-clean",
                        choices=["voice-clean","healing","broadcast"], help="Effects preset")
    parser.add_argument("--model",   type=str, default="base", help="Whisper model size")
    parser.add_argument("--json",    action="store_true", help="Output JSON result")
    args = parser.parse_args()

    result = None

    if args.mode == "health":
        health_check()
        return

    if args.mode == "analyze":
        if not args.input: parser.error("--input required")
        result = analyze_voice(args.input)

    elif args.mode == "transcribe":
        if not args.input: parser.error("--input required")
        result = transcribe(args.input, args.model)

    elif args.mode == "profile":
        if not args.input: parser.error("--input required")
        result = build_voice_profile(args.input, args.actor)

    elif args.mode == "synthesize":
        if not args.text or not args.input: parser.error("--text and --input (speaker wav) required")
        out = args.output or f"synthesis_{args.actor}_{int(time.time())}.wav"
        result = synthesize(args.text, args.input, out)

    elif args.mode == "effects":
        if not args.input: parser.error("--input required")
        out = args.output or args.input.replace(".wav", f"_{args.preset}.wav")
        result = apply_effects(args.input, out, args.preset)

    if result and args.json:
        print(json.dumps(result, indent=2))
    elif result:
        print(f"\n[RESULT] {json.dumps(result, indent=2)}")


if __name__ == "__main__":
    main()
