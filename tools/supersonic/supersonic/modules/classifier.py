"""
SUPERSONIC AI Classifier — Knows What Every Sound IS
=====================================================
Multi-signal classification using path patterns, filename patterns,
metadata tags, audio characteristics, and NOIZY project context.
"""

from __future__ import annotations
import re
from pathlib import Path
from ..models import AudioAsset, AudioCategory, ProjectAssociation


# Classification rules — ordered by priority
# Each rule: (check_function, category, confidence, project_hint)

class AudioClassifier:
    """
    Classifies every audio file into its purpose and project.
    Uses a cascading rule engine — path, filename, metadata, then audio features.
    No ML required. Pattern recognition + domain knowledge from the DREAMCHAMBER.
    """

    def classify(self, asset: AudioAsset) -> AudioAsset:
        """Run all classification passes on an asset."""
        # Pass 1: Path-based classification (highest confidence)
        asset = self._classify_by_path(asset)

        # Pass 2: Filename-based classification
        if asset.category == AudioCategory.UNKNOWN:
            asset = self._classify_by_filename(asset)

        # Pass 3: Metadata-based (tags from mutagen)
        if asset.category == AudioCategory.UNKNOWN:
            asset = self._classify_by_metadata(asset)

        # Pass 4: Audio feature-based (librosa results)
        if asset.category == AudioCategory.UNKNOWN:
            asset = self._classify_by_features(asset)

        # Pass 5: Default fallback
        if asset.category == AudioCategory.UNKNOWN:
            asset = self._classify_fallback(asset)

        # Assign project association
        asset = self._assign_project(asset)

        # Flag items needing review
        if asset.category_confidence < 0.5:
            asset.needs_review = True

        return asset

    def _classify_by_path(self, asset: AudioAsset) -> AudioAsset:
        """Classify based on where the file lives."""
        p = asset.file_path.lower()

        # DESIGN Album — The crown jewels
        if "design final wavs" in p or ("design" in p and "current" in p):
            if "master" in p:
                asset.category = AudioCategory.MUSIC_MASTER
                asset.category_confidence = 0.98
            elif asset.format.value in ("wav", "aif", "aiff", "flac"):
                asset.category = AudioCategory.MUSIC_MIX
                asset.category_confidence = 0.95
            else:
                asset.category = AudioCategory.MUSIC_MIX
                asset.category_confidence = 0.90
            return asset

        # DreamChamber voice universe
        if "voice-universe" in p or "voice_universe" in p:
            asset.category = AudioCategory.VOICE_PERSONA
            asset.category_confidence = 0.95
            return asset

        # DreamChamber test voices
        if "test-voices" in p or "test_voices" in p:
            asset.category = AudioCategory.VOICE_PERSONA
            asset.category_confidence = 0.90
            return asset

        # Audio Hijack recordings
        if "audio hijack" in p:
            if "podcast" in p.lower() or "dreamchamber" in p.lower():
                asset.category = AudioCategory.PODCAST_SESSION
                asset.category_confidence = 0.92
            elif ".logicx" in p:
                asset.category = AudioCategory.LOGIC_PROJECT
                asset.category_confidence = 0.90
            else:
                asset.category = AudioCategory.VOICE_RECORDING
                asset.category_confidence = 0.80
            return asset

        # GABRIEL training audio
        if "audio for gabriel" in p or "gabriel" in p.lower():
            if "training" in p.lower() or "input device" in asset.file_name.lower():
                asset.category = AudioCategory.VOICE_TRAINING
                asset.category_confidence = 0.88
            else:
                asset.category = AudioCategory.VOICE_RECORDING
                asset.category_confidence = 0.75
            return asset

        # Logic Pro projects
        if ".logicx" in p or "logic" in p.lower():
            asset.category = AudioCategory.LOGIC_PROJECT
            asset.category_confidence = 0.85
            return asset

        # LUNA Sessions
        if "luna sessions" in p:
            asset.category = AudioCategory.MUSIC_MIX
            asset.category_confidence = 0.80
            return asset

        # NoizyFish legacy
        if "noizyfish" in p.lower() and ("misc_project" in p.lower() or "python_projects" in p.lower()):
            asset.category = AudioCategory.LEGACY
            asset.category_confidence = 0.85
            return asset

        # OneDrive desktop archive
        if "desktop_files_moved" in p:
            asset.category = AudioCategory.LEGACY
            asset.category_confidence = 0.70
            return asset

        # Plugin / app audio
        if any(pat in p for pat in ["plug-ins", ".vst", ".component", "sonnox", "audio music apps"]):
            asset.category = AudioCategory.PLUGIN_PRESET
            asset.category_confidence = 0.90
            return asset

        return asset

    def _classify_by_filename(self, asset: AudioAsset) -> AudioAsset:
        """Classify based on filename patterns."""
        name = asset.file_name.lower()

        # Track number pattern: "01 Song Name" or "1.1 Song Name"
        if re.match(r"^\d+[\.\s\-]", name):
            if "master" in name:
                asset.category = AudioCategory.MUSIC_MASTER
                asset.category_confidence = 0.85
            elif "mix" in name:
                asset.category = AudioCategory.MUSIC_MIX
                asset.category_confidence = 0.80
            elif "stem" in name:
                asset.category = AudioCategory.MUSIC_STEM
                asset.category_confidence = 0.80
            else:
                asset.category = AudioCategory.MUSIC_MIX
                asset.category_confidence = 0.70
            return asset

        # Voice / persona patterns
        if re.match(r"rsp_\d+", name):
            asset.category = AudioCategory.VOICE_PERSONA
            asset.category_confidence = 0.90
            return asset

        # Input device recordings
        if "input device recording" in name:
            asset.category = AudioCategory.VOICE_TRAINING
            asset.category_confidence = 0.85
            return asset

        # Podcast patterns
        if "podcast" in name:
            asset.category = AudioCategory.PODCAST_SESSION
            asset.category_confidence = 0.85
            return asset

        # Recording pattern with timestamp
        if re.match(r"\d{8}\s+\d{4}\s+recording", name):
            asset.category = AudioCategory.VOICE_RECORDING
            asset.category_confidence = 0.75
            return asset

        # Demo patterns
        if "demo" in name or "rough" in name or "scratch" in name:
            asset.category = AudioCategory.MUSIC_DEMO
            asset.category_confidence = 0.75
            return asset

        # Sample / loop patterns
        if "loop" in name or "sample" in name or "one-shot" in name or "oneshot" in name:
            asset.category = AudioCategory.SAMPLE
            asset.category_confidence = 0.80
            return asset

        # SFX patterns
        if "sfx" in name or "effect" in name or "whoosh" in name or "hit" in name:
            asset.category = AudioCategory.SFX
            asset.category_confidence = 0.75
            return asset

        return asset

    def _classify_by_metadata(self, asset: AudioAsset) -> AudioAsset:
        """Classify based on ID3/metadata tags."""
        if asset.album:
            album = asset.album.lower()
            if "design" in album:
                asset.category = AudioCategory.MUSIC_MIX
                asset.category_confidence = 0.80
                return asset

        if asset.genre:
            genre = asset.genre.lower()
            if genre in ("podcast", "speech", "spoken word"):
                asset.category = AudioCategory.VOICE_RECORDING
                asset.category_confidence = 0.70
            else:
                asset.category = AudioCategory.MUSIC_MIX
                asset.category_confidence = 0.60
            return asset

        if asset.artist:
            artist = asset.artist.lower()
            if "plowman" in artist or "noizy" in artist or "rsp" in artist:
                asset.category = AudioCategory.MUSIC_MIX
                asset.category_confidence = 0.65
                return asset

        return asset

    def _classify_by_features(self, asset: AudioAsset) -> AudioAsset:
        """Classify based on audio analysis results."""
        w = asset.waveform

        if w.is_silence:
            asset.category = AudioCategory.UNKNOWN
            asset.category_confidence = 0.0
            asset.needs_review = True
            asset.tags.append("silent_file")
            return asset

        # Very short files (< 3 seconds) are likely SFX or samples
        if asset.quality.duration_seconds and asset.quality.duration_seconds < 3.0:
            asset.category = AudioCategory.SFX
            asset.category_confidence = 0.55
            return asset

        # Music-length files with tempo
        if w.tempo_bpm and w.tempo_bpm > 0:
            if asset.quality.duration_seconds and asset.quality.duration_seconds > 60:
                asset.category = AudioCategory.MUSIC_MIX
                asset.category_confidence = 0.55
            else:
                asset.category = AudioCategory.SAMPLE
                asset.category_confidence = 0.50
            return asset

        # Speech detection: low spectral centroid, no strong tempo
        if w.spectral_centroid and w.spectral_centroid < 2000:
            if not w.tempo_bpm or w.tempo_bpm < 40:
                asset.category = AudioCategory.VOICE_RECORDING
                asset.category_confidence = 0.50
                return asset

        return asset

    def _classify_fallback(self, asset: AudioAsset) -> AudioAsset:
        """Last resort classification."""
        # High quality lossless = probably music
        if asset.quality.is_lossless and asset.quality.sample_rate and asset.quality.sample_rate >= 44100:
            asset.category = AudioCategory.MUSIC_MIX
            asset.category_confidence = 0.40
            asset.needs_review = True
        else:
            asset.category = AudioCategory.UNKNOWN
            asset.category_confidence = 0.0
            asset.needs_review = True

        return asset

    def _assign_project(self, asset: AudioAsset) -> AudioAsset:
        """Map classified assets to NOIZY projects."""
        p = asset.file_path.lower()

        # DESIGN Album
        if asset.category in (AudioCategory.MUSIC_MASTER, AudioCategory.MUSIC_MIX):
            if "design" in p or (asset.album and "design" in asset.album.lower()):
                asset.project.project = "DESIGN-ALBUM"
                if asset.category == AudioCategory.MUSIC_MASTER:
                    asset.project.sub_project = "MASTERS"
                elif asset.quality.is_lossless:
                    asset.project.sub_project = "FINALS-WAV"
                else:
                    asset.project.sub_project = "MP3"

                # Extract track info from filename
                match = re.match(r"(\d+)[\.\s](\d+)?\s*(.*)", asset.file_name)
                if match:
                    asset.project.track_title = match.group(3).rsplit(".", 1)[0].strip()
                    try:
                        disc = int(match.group(1))
                        track = int(match.group(2)) if match.group(2) else 0
                        asset.project.track_number = disc * 100 + track
                    except (ValueError, TypeError):
                        pass

        # DreamChamber
        elif asset.category in (AudioCategory.VOICE_PERSONA, AudioCategory.PODCAST_SESSION):
            asset.project.project = "DREAMCHAMBER"
            if asset.category == AudioCategory.VOICE_PERSONA:
                asset.project.sub_project = "VOICE-UNIVERSE"
            elif asset.category == AudioCategory.PODCAST_SESSION:
                asset.project.sub_project = "SESSIONS"

        # GABRIEL
        elif asset.category == AudioCategory.VOICE_TRAINING:
            asset.project.project = "GABRIEL-TRAINING"

        # Logic projects
        elif asset.category == AudioCategory.LOGIC_PROJECT:
            asset.project.project = "DREAMCHAMBER"
            asset.project.sub_project = "LOGIC-PROJECTS"

        # Legacy
        elif asset.category == AudioCategory.LEGACY:
            asset.project.project = "LEGACY"
            if "noizyfish" in p:
                asset.project.sub_project = "NOIZYFISH"

        # Singles detection
        if "single" in asset.file_name.lower():
            if asset.project.project == "DESIGN-ALBUM":
                asset.project.sub_project = "SINGLES"

        return asset
