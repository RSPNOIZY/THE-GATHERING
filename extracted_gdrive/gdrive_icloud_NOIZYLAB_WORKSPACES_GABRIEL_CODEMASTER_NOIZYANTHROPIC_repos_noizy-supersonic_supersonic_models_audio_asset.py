"""
SUPERSONIC Data Models — The DNA of Every Sound
================================================
"""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum
import hashlib
import uuid


class AudioFormat(str, Enum):
    WAV = "wav"
    MP3 = "mp3"
    FLAC = "flac"
    AIF = "aif"
    AIFF = "aiff"
    M4A = "m4a"
    OGG = "ogg"
    OPUS = "opus"
    AU = "au"
    CAF = "caf"
    WMA = "wma"
    VST_PRESET = "vst_preset"
    AU_PLUGIN = "au_plugin"
    UNKNOWN = "unknown"


class AudioCategory(str, Enum):
    """What IS this sound?"""
    MUSIC_MASTER = "music_master"           # Final mastered track
    MUSIC_MIX = "music_mix"                 # Final mix, pre-master
    MUSIC_STEM = "music_stem"               # Individual instrument/vocal stem
    MUSIC_DEMO = "music_demo"               # Work in progress
    VOICE_RECORDING = "voice_recording"     # Spoken word, podcast, interview
    VOICE_PERSONA = "voice_persona"         # Character voice for DreamChamber
    VOICE_TRAINING = "voice_training"       # Training data for voice models
    SFX = "sfx"                             # Sound effect
    AMBIENT = "ambient"                     # Atmosphere, background
    SAMPLE = "sample"                       # Loop, one-shot, sample pack
    PLUGIN_PRESET = "plugin_preset"         # VST/AU preset audio preview
    SYSTEM_AUDIO = "system_audio"           # OS/app sounds (beeps, alerts)
    TEST_DATA = "test_data"                 # Unit test / library test files
    LOGIC_PROJECT = "logic_project"         # Audio inside Logic Pro project
    PODCAST_SESSION = "podcast_session"     # DreamChamber / Audio Hijack session
    LEGACY = "legacy"                       # Historical files, pre-NOIZY
    UNKNOWN = "unknown"


class AudioQuality(BaseModel):
    """Technical quality fingerprint."""
    sample_rate: Optional[int] = None       # e.g., 44100, 48000, 96000
    bit_depth: Optional[int] = None         # e.g., 16, 24, 32
    channels: Optional[int] = None          # 1=mono, 2=stereo, 6=5.1
    bitrate: Optional[int] = None           # kbps for compressed formats
    codec: Optional[str] = None             # e.g., "pcm_s24le", "mp3", "aac"
    duration_seconds: Optional[float] = None
    is_lossless: bool = False


class ConsentRecord(BaseModel):
    """NCP (NOIZY Consent Protocol) tracking for every audio asset."""
    owner_id: str = "RSP_001"               # Default: Robert Stephen Plowman
    owner_name: str = "Robert Stephen Plowman"
    consent_granted: bool = True
    consent_date: Optional[datetime] = None
    split_artist: float = 0.75              # The Plowman Standard
    split_platform: float = 0.25
    license_type: str = "full_ownership"
    revocable: bool = True
    governing_law: str = "Canada"
    notes: Optional[str] = None


class WaveformSignature(BaseModel):
    """Audio fingerprint for duplicate detection and identification."""
    chromaprint: Optional[str] = None       # Acoustid fingerprint
    rms_energy: Optional[float] = None      # Average loudness
    spectral_centroid: Optional[float] = None  # Brightness measure
    tempo_bpm: Optional[float] = None       # Detected BPM
    key: Optional[str] = None               # Detected musical key
    is_silence: bool = False                # True if file is empty/silent
    peak_db: Optional[float] = None         # Peak amplitude in dB


class ProjectAssociation(BaseModel):
    """Which NOIZY project does this belong to?"""
    project: Optional[str] = None           # e.g., "DESIGN-ALBUM", "DREAMCHAMBER"
    sub_project: Optional[str] = None       # e.g., "VOICE-UNIVERSE", "SESSIONS"
    artist: Optional[str] = None
    album: Optional[str] = None
    track_number: Optional[int] = None
    track_title: Optional[str] = None


class AudioAsset(BaseModel):
    """
    The complete DNA of a single audio file.
    Every sound in the NOIZY universe gets one of these.
    """
    # Identity
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    file_path: str
    file_name: str
    file_extension: str
    file_size_bytes: int
    sha256: Optional[str] = None

    # Classification
    format: AudioFormat = AudioFormat.UNKNOWN
    category: AudioCategory = AudioCategory.UNKNOWN
    category_confidence: float = 0.0        # 0.0-1.0 confidence in classification

    # Technical
    quality: AudioQuality = Field(default_factory=AudioQuality)
    waveform: WaveformSignature = Field(default_factory=WaveformSignature)

    # Metadata (from file tags)
    title: Optional[str] = None
    artist: Optional[str] = None
    album: Optional[str] = None
    genre: Optional[str] = None
    year: Optional[int] = None
    comment: Optional[str] = None
    tags: list[str] = Field(default_factory=list)

    # Project
    project: ProjectAssociation = Field(default_factory=ProjectAssociation)

    # Consent
    consent: ConsentRecord = Field(default_factory=ConsentRecord)

    # Duplicate tracking
    duplicate_group_id: Optional[str] = None
    is_primary_copy: bool = True
    duplicate_paths: list[str] = Field(default_factory=list)

    # Location
    source_machine: str = "GOD"             # GOD, GABRIEL, DaFixer
    original_path: str = ""                 # Where it was found
    canonical_path: Optional[str] = None    # Where it SHOULD live
    cloud_r2_key: Optional[str] = None      # Cloudflare R2 object key

    # Timestamps
    file_created: Optional[datetime] = None
    file_modified: Optional[datetime] = None
    scanned_at: datetime = Field(default_factory=datetime.now)
    last_verified: Optional[datetime] = None

    # Flags
    is_empty: bool = False                  # 0-byte file
    is_noise: bool = False                  # System/test/junk audio
    needs_review: bool = False              # Flagged for human attention
    needs_consent: bool = False             # Missing consent chain

    def compute_sha256(self, filepath: str) -> str:
        """Compute SHA-256 hash for duplicate detection."""
        sha = hashlib.sha256()
        with open(filepath, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                sha.update(chunk)
        self.sha256 = sha.hexdigest()
        return self.sha256


class ScanReport(BaseModel):
    """Summary of a SUPERSONIC scan operation."""
    scan_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    started_at: datetime = Field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
    machine: str = "GOD"
    scan_paths: list[str] = Field(default_factory=list)
    total_files_found: int = 0
    total_audio_files: int = 0
    total_size_bytes: int = 0
    total_duplicates: int = 0
    total_empty: int = 0
    total_noise: int = 0
    total_real_audio: int = 0
    categories: dict[str, int] = Field(default_factory=dict)
    formats: dict[str, int] = Field(default_factory=dict)
    errors: list[str] = Field(default_factory=list)
    assets: list[AudioAsset] = Field(default_factory=list)
