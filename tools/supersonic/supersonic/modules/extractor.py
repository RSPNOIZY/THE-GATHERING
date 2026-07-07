"""
SUPERSONIC Metadata Extractor — Reads the Soul of Every Sound
==============================================================
Uses mutagen for file tags, librosa for audio analysis,
and raw waveform inspection for quality fingerprinting.
"""

from __future__ import annotations
import os
import struct
import json
from pathlib import Path
from typing import Optional
from datetime import datetime

import mutagen
from mutagen.mp3 import MP3
from mutagen.flac import FLAC
from mutagen.mp4 import MP4
from mutagen.oggvorbis import OggVorbis
from mutagen.aiff import AIFF
from mutagen.wave import WAVE

from ..models import AudioAsset, AudioQuality, AudioFormat


class MetadataExtractor:
    """
    Reads every tag, every technical detail, every hidden signal
    from an audio file. Nothing escapes SUPERSONIC.
    """

    def __init__(self, use_librosa: bool = True):
        self.use_librosa = use_librosa
        self._librosa = None
        self._soundfile = None
        if use_librosa:
            try:
                import librosa
                import soundfile
                self._librosa = librosa
                self._soundfile = soundfile
            except ImportError:
                self.use_librosa = False

    def extract(self, asset: AudioAsset) -> AudioAsset:
        """Extract all available metadata from an audio file."""
        if asset.is_empty:
            return asset

        filepath = asset.file_path

        # Phase 1: Tag metadata via mutagen
        asset = self._extract_tags(asset, filepath)

        # Phase 2: Technical quality via mutagen + raw inspection
        asset = self._extract_quality(asset, filepath)

        # Phase 3: Deep audio analysis via librosa (if enabled)
        if self.use_librosa and asset.file_size_bytes > 0:
            asset = self._extract_librosa(asset, filepath)

        return asset

    def _extract_tags(self, asset: AudioAsset, filepath: str) -> AudioAsset:
        """Extract ID3/Vorbis/MP4 tags from the audio file."""
        try:
            audio = mutagen.File(filepath, easy=True)
            if audio is None:
                return asset

            # Standard tag fields
            if "title" in audio:
                asset.title = str(audio["title"][0]) if audio["title"] else None
            if "artist" in audio:
                asset.artist = str(audio["artist"][0]) if audio["artist"] else None
            if "album" in audio:
                asset.album = str(audio["album"][0]) if audio["album"] else None
            if "genre" in audio:
                asset.genre = str(audio["genre"][0]) if audio["genre"] else None
            if "date" in audio:
                try:
                    asset.year = int(str(audio["date"][0])[:4])
                except (ValueError, IndexError):
                    pass
            if "tracknumber" in audio:
                try:
                    tn = str(audio["tracknumber"][0])
                    asset.project.track_number = int(tn.split("/")[0])
                except (ValueError, IndexError):
                    pass

            # Populate project association from tags
            if asset.title:
                asset.project.track_title = asset.title
            if asset.artist:
                asset.project.artist = asset.artist
            if asset.album:
                asset.project.album = asset.album

        except Exception:
            asset.tags.append("tag_read_error")

        return asset

    def _extract_quality(self, asset: AudioAsset, filepath: str) -> AudioAsset:
        """Extract technical quality information."""
        try:
            audio = mutagen.File(filepath)
            if audio is None:
                return asset

            quality = asset.quality

            # Duration
            if hasattr(audio, "info") and audio.info:
                info = audio.info
                if hasattr(info, "length"):
                    quality.duration_seconds = round(info.length, 3)
                if hasattr(info, "sample_rate"):
                    quality.sample_rate = info.sample_rate
                if hasattr(info, "channels"):
                    quality.channels = info.channels
                if hasattr(info, "bitrate"):
                    quality.bitrate = info.bitrate
                if hasattr(info, "bits_per_sample"):
                    quality.bit_depth = info.bits_per_sample

            # Format-specific extraction
            if asset.format in (AudioFormat.WAV, AudioFormat.AIF, AudioFormat.AIFF):
                quality.is_lossless = True
                quality.codec = "pcm"
                # Try to get bit depth from WAV header
                if asset.format == AudioFormat.WAV and quality.bit_depth is None:
                    quality.bit_depth = self._read_wav_bit_depth(filepath)
            elif asset.format == AudioFormat.FLAC:
                quality.is_lossless = True
                quality.codec = "flac"
            elif asset.format == AudioFormat.MP3:
                quality.is_lossless = False
                quality.codec = "mp3"
            elif asset.format == AudioFormat.M4A:
                quality.is_lossless = False
                quality.codec = "aac"
            elif asset.format == AudioFormat.OGG:
                quality.is_lossless = False
                quality.codec = "vorbis"

            asset.quality = quality

        except Exception:
            asset.tags.append("quality_read_error")

        return asset

    def _extract_librosa(self, asset: AudioAsset, filepath: str) -> AudioAsset:
        """Deep audio analysis with librosa — tempo, key, energy, spectral."""
        if not self._librosa or not self._soundfile:
            return asset

        try:
            # Load audio (limited to 60 seconds for speed on large files)
            duration_limit = min(asset.quality.duration_seconds or 60, 60)
            y, sr = self._librosa.load(filepath, sr=None, duration=duration_limit, mono=True)

            if y is None or len(y) == 0:
                asset.waveform.is_silence = True
                return asset

            import numpy as np

            # Check for silence
            rms = float(np.sqrt(np.mean(y**2)))
            asset.waveform.rms_energy = round(rms, 6)
            if rms < 0.0001:
                asset.waveform.is_silence = True
                return asset

            # Peak amplitude in dB
            peak = float(np.max(np.abs(y)))
            if peak > 0:
                asset.waveform.peak_db = round(20 * np.log10(peak), 2)

            # Spectral centroid (brightness)
            centroid = self._librosa.feature.spectral_centroid(y=y, sr=sr)
            asset.waveform.spectral_centroid = round(float(np.mean(centroid)), 2)

            # Tempo detection
            try:
                tempo = self._librosa.beat.tempo(y=y, sr=sr)
                if len(tempo) > 0:
                    asset.waveform.tempo_bpm = round(float(tempo[0]), 1)
            except Exception:
                pass

            # Key detection via chroma
            try:
                chroma = self._librosa.feature.chroma_cqt(y=y, sr=sr)
                key_idx = int(np.argmax(np.mean(chroma, axis=1)))
                key_names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
                asset.waveform.key = key_names[key_idx]
            except Exception:
                pass

        except Exception as e:
            asset.tags.append(f"librosa_error:{str(e)[:50]}")

        return asset

    def _read_wav_bit_depth(self, filepath: str) -> Optional[int]:
        """Read bit depth directly from WAV file header."""
        try:
            with open(filepath, "rb") as f:
                riff = f.read(4)
                if riff != b"RIFF":
                    return None
                f.read(8)  # skip size + WAVE
                while True:
                    chunk_id = f.read(4)
                    if len(chunk_id) < 4:
                        break
                    chunk_size = struct.unpack("<I", f.read(4))[0]
                    if chunk_id == b"fmt ":
                        fmt_data = f.read(min(chunk_size, 40))
                        if len(fmt_data) >= 16:
                            bits = struct.unpack("<H", fmt_data[14:16])[0]
                            return bits
                        break
                    else:
                        f.seek(chunk_size, 1)
        except Exception:
            pass
        return None
