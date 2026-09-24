#!/usr/bin/env python3
"""
enroll_voice_dna.py — Build the v0.1 HVS prototype vector for an actor.

Mirrors the Swift HVSFeatureExtractor (Sources/NOIZYHVSLiveContour/HVSFeatures.swift)
EXACTLY so cosine distance is meaningful when the Swift side loads the prototype.

The 5-dimensional feature vector matches Swift AuthenticityScorer.score():
    [rms, peak, spectral_centroid / 10000, zero_crossing_rate, pitch_hz / 1000]

Usage:
    python3 enroll_voice_dna.py <samples_dir> [--actor RSP_001] [--out prototype.json]

Reads every .wav/.aif/.aiff in <samples_dir>, extracts the 5-dim feature vector
PER WINDOW (4 Hz analysis rate, matching Swift), averages everything into a
single prototype vector, and writes a JSON file the Swift loader consumes.

Output JSON shape:
{
  "actor_id": "RSP_001",
  "feature_dim": 5,
  "feature_names": ["rms", "peak", "centroid_norm", "zcr", "pitch_norm"],
  "prototype": [0.041, 0.183, 0.272, 0.087, 0.114],
  "sample_count": 6,
  "windows_analyzed": 1842,
  "built_at": "2026-04-09T16:10:00",
  "sources": ["RSP_001_wizard.wav", "..."],
  "version": "0.1.0"
}
"""
from __future__ import annotations

import argparse
import datetime
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

# ── Constants — MUST match Swift HVSFeatureExtractor ──────────────────────
TARGET_SR = 48000          # Same as Swift default
WINDOW_SIZE = 512          # Same as Swift bufferSize
HOP_SIZE = 12000           # 4 Hz analysis rate at 48kHz (matches Swift Task loop)
CENTROID_NORMALIZE = 10000.0
PITCH_NORMALIZE = 1000.0


def load_audio(path: Path) -> tuple[np.ndarray, int]:
    """Load audio as mono float32 at native sample rate."""
    data, sr = sf.read(str(path), always_2d=False)
    if data.ndim > 1:
        data = data.mean(axis=1)
    return data.astype(np.float32), sr


def resample(samples: np.ndarray, src_sr: int, target_sr: int) -> np.ndarray:
    """Linear resample to target_sr. Good enough for v0.1 — librosa not required."""
    if src_sr == target_sr:
        return samples
    ratio = target_sr / src_sr
    new_len = int(round(len(samples) * ratio))
    if new_len == 0:
        return np.zeros(0, dtype=np.float32)
    indices = np.linspace(0, len(samples) - 1, new_len)
    return np.interp(indices, np.arange(len(samples)), samples).astype(np.float32)


def extract_window_features(window: np.ndarray, sr: int) -> np.ndarray:
    """Extract the 5-dim feature vector from a single window.

    Mirror of Swift HVSFeatureExtractor.extract():
        [0] rms              — sqrt(mean(x^2))
        [1] peak             — max(abs(x))
        [2] centroid_norm    — spectral_centroid_hz / 10000
        [3] zcr              — zero crossings / window length
        [4] pitch_norm       — pitch_hz / 1000   (v0.1 stub: 0)
    """
    n = len(window)
    if n == 0:
        return np.zeros(5, dtype=np.float32)

    rms = float(np.sqrt(np.mean(window ** 2)))
    peak = float(np.max(np.abs(window)))

    # Hanning window before FFT (matches Swift vDSP.window(.hanningDenormalized))
    hann = np.hanning(n).astype(np.float32)
    windowed = window * hann

    # Real FFT
    spectrum = np.fft.rfft(windowed)
    magnitudes = np.abs(spectrum)
    freqs = np.fft.rfftfreq(n, d=1.0 / sr)

    total = magnitudes.sum()
    centroid_hz = float((magnitudes * freqs).sum() / total) if total > 0 else 0.0
    centroid_norm = centroid_hz / CENTROID_NORMALIZE

    # Zero-crossing rate (vDSP_nzcros equivalent)
    crossings = int(np.sum(np.diff(np.signbit(window)).astype(int)))
    zcr = crossings / n

    # Pitch — stubbed in Swift v0.1 too, set to 0 here for parity
    pitch_norm = 0.0

    return np.array([rms, peak, centroid_norm, zcr, pitch_norm], dtype=np.float32)


def extract_file_features(path: Path) -> tuple[np.ndarray, int]:
    """Process one file. Returns (mean_vector, num_windows)."""
    if path.stat().st_size == 0:
        print(f"  ⚠ {path.name}: empty placeholder (0 bytes) — skipping", file=sys.stderr)
        return np.zeros(5, dtype=np.float32), 0
    try:
        samples, native_sr = load_audio(path)
    except Exception as e:
        print(f"  ⚠ {path.name}: load failed ({e}) — skipping", file=sys.stderr)
        return np.zeros(5, dtype=np.float32), 0
    samples = resample(samples, native_sr, TARGET_SR)

    if len(samples) < WINDOW_SIZE:
        print(f"  ⚠ {path.name}: too short ({len(samples)} samples)", file=sys.stderr)
        return np.zeros(5, dtype=np.float32), 0

    vectors = []
    pos = 0
    while pos + WINDOW_SIZE <= len(samples):
        window = samples[pos : pos + WINDOW_SIZE]
        vectors.append(extract_window_features(window, TARGET_SR))
        pos += HOP_SIZE

    if not vectors:
        return np.zeros(5, dtype=np.float32), 0

    arr = np.stack(vectors)
    return arr.mean(axis=0), len(vectors)


def build_prototype(samples_dir: Path, actor_id: str) -> dict:
    audio_files = sorted(
        [p for p in samples_dir.rglob("*") if p.suffix.lower() in (".wav", ".aif", ".aiff", ".flac")]
    )
    if not audio_files:
        raise FileNotFoundError(f"No audio files in {samples_dir}")

    print(f"⚡ Found {len(audio_files)} audio files in {samples_dir}", file=sys.stderr)

    file_vectors = []
    total_windows = 0
    sources = []

    for f in audio_files:
        print(f"  → {f.name}", file=sys.stderr)
        vec, nwin = extract_file_features(f)
        if nwin > 0:
            file_vectors.append(vec)
            total_windows += nwin
            sources.append(f.name)

    if not file_vectors:
        raise RuntimeError("No usable audio after feature extraction")

    # Mean across files (each file weighted equally — matches v0.1 spec)
    prototype = np.stack(file_vectors).mean(axis=0)

    return {
        "actor_id": actor_id,
        "feature_dim": 5,
        "feature_names": ["rms", "peak", "centroid_norm", "zcr", "pitch_norm"],
        "prototype": [round(float(x), 6) for x in prototype],
        "sample_count": len(file_vectors),
        "windows_analyzed": total_windows,
        "built_at": datetime.datetime.now().isoformat(timespec="seconds"),
        "sources": sources,
        "version": "0.1.0",
        "swift_compat": {
            "extractor": "HVSFeatureExtractor",
            "scorer": "AuthenticityScorer",
            "expected_dim": 5,
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Build a v0.1 HVS prototype vector")
    parser.add_argument("samples_dir", type=Path, help="Directory containing actor audio samples")
    parser.add_argument("--actor", default="RSP_001", help="Actor ID (default: RSP_001)")
    parser.add_argument(
        "--out",
        type=Path,
        default=Path.home() / "NOIZYANTHROPIC/auv3-hvs-live-contour/Resources/prototype_RSP_001.json",
        help="Output JSON path",
    )
    args = parser.parse_args()

    if not args.samples_dir.exists():
        print(f"✗ samples directory not found: {args.samples_dir}", file=sys.stderr)
        return 1

    proto = build_prototype(args.samples_dir, args.actor)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    with open(args.out, "w") as f:
        json.dump(proto, f, indent=2)

    print("", file=sys.stderr)
    print("════════════════════════════════════════════════════", file=sys.stderr)
    print(f"  ACTOR:    {proto['actor_id']}", file=sys.stderr)
    print(f"  SAMPLES:  {proto['sample_count']} files, {proto['windows_analyzed']} windows", file=sys.stderr)
    print("  VECTOR:", file=sys.stderr)
    for name, val in zip(proto["feature_names"], proto["prototype"]):
        bar = "▓" * max(0, min(40, int(abs(val) * 100)))
        print(f"    {name:15s} {val:+.4f}  {bar}", file=sys.stderr)
    print("════════════════════════════════════════════════════", file=sys.stderr)
    print(f"  → {args.out}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
