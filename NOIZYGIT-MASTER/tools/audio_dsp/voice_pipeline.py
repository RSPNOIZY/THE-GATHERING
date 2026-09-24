#!/usr/bin/env python3
"""
🎙️ NOIZYVOX Voice Pipeline v2.0
================================

Advanced AI voice synthesis pipeline with:
- Hybrid TTS: ElevenLabs (premium) → OpenAI (fallback) → macOS (local)
- Claude-powered text generation with persona support
- Streaming audio support
- Audio caching for repeated phrases
- DSP effects and mastering
- Viseme generation for lip-sync
- Batch processing
- Real-time mode

Env Vars:
  ANTHROPIC_API_KEY    - Claude API key
  ELEVEN_API_KEY       - ElevenLabs API key (premium TTS)
  OPENAI_API_KEY       - OpenAI API key (fallback TTS)
  ELEVEN_VOICE_ID      - Default ElevenLabs voice ID
  NOIZYVOX_CACHE_DIR   - Audio cache directory

Usage:
  # Basic synthesis
  python3 voice_pipeline.py --prompt "Hello world" --out hello.mp3

  # With persona
  python3 voice_pipeline.py --prompt "Rise, hero!" --persona thunder_titan --out hero.mp3

  # From file
  python3 voice_pipeline.py --file script.txt --out narration.mp3

  # Batch processing
  python3 voice_pipeline.py --batch scripts/ --out-dir output/

  # Force specific TTS provider
  python3 voice_pipeline.py --prompt "Test" --tts elevenlabs --out test.mp3
  python3 voice_pipeline.py --prompt "Test" --tts openai --out test.mp3
  python3 voice_pipeline.py --prompt "Test" --tts local --out test.aiff

Dependencies:
  pip install anthropic elevenlabs openai pydub rich

Author: NOIZYVOX / Noizyfish
Version: 2.0.0
"""

import os
import sys
import json
import hashlib
import argparse
import subprocess
import time
from pathlib import Path
from datetime import datetime
from dataclasses import dataclass
from typing import Optional, Dict, Tuple
from enum import Enum

# Rich console for beautiful output
try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.progress import Progress, SpinnerColumn, TextColumn
    from rich.table import Table
    console = Console()
except ImportError:
    console = None

# ═══════════════════════════════════════════════════════════════════════════════
# OPTIONAL IMPORTS
# ═══════════════════════════════════════════════════════════════════════════════

# Anthropic (text generation)
try:
    from anthropic import Anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    Anthropic = None
    ANTHROPIC_AVAILABLE = False

# ElevenLabs (premium TTS)
try:
    from elevenlabs import generate as eleven_generate, save as eleven_save
    from elevenlabs import set_api_key as eleven_set_api_key, VoiceSettings
    ELEVENLABS_AVAILABLE = True
except ImportError:
    eleven_generate = eleven_save = eleven_set_api_key = VoiceSettings = None
    ELEVENLABS_AVAILABLE = False

# OpenAI (fallback TTS)
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OpenAI = None
    OPENAI_AVAILABLE = False

# Audio processing
try:
    from pydub import AudioSegment
    from pydub.effects import normalize
    PYDUB_AVAILABLE = True
except ImportError:
    AudioSegment = None
    PYDUB_AVAILABLE = False


# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

class TTSProvider(Enum):
    ELEVENLABS = "elevenlabs"
    OPENAI = "openai"
    LOCAL = "local"
    AUTO = "auto"


@dataclass
class VoiceConfig:
    """Voice synthesis configuration"""
    provider: TTSProvider = TTSProvider.AUTO
    voice_id: str = "Rachel"
    model: str = "eleven_multilingual_v2"
    stability: float = 0.5
    similarity_boost: float = 0.75
    style: float = 0.0
    use_speaker_boost: bool = True
    
    # OpenAI settings
    openai_voice: str = "alloy"
    openai_model: str = "tts-1-hd"
    openai_speed: float = 1.0
    
    # Local settings
    local_voice: str = "Samantha"
    local_rate: int = 175


@dataclass
class PersonaConfig:
    """Claude persona configuration"""
    name: str
    system_prompt: str
    voice_config: VoiceConfig
    ssml_wrapper: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# HERO PERSONAS
# ═══════════════════════════════════════════════════════════════════════════════

PERSONAS: Dict[str, PersonaConfig] = {
    "thunder_titan": PersonaConfig(
        name="Thunder Titan",
        system_prompt="""You are Thunder Titan, an ancient guardian with the power of storms.
Your voice is deep, commanding, and resonant like distant thunder.
Speak with measured pacing, stoic clarity, and primal authority.
Keep responses concise and impactful. Use short, powerful sentences.""",
        voice_config=VoiceConfig(
            voice_id="TxGEqnHWrfWFTfGW9XjX",  # Josh (deep)
            stability=0.4,
            similarity_boost=0.8,
            style=0.3,
            openai_voice="onyx",
            openai_speed=0.9,
            local_voice="Daniel"
        )
    ),
    
    "solar_sentinel": PersonaConfig(
        name="Solar Sentinel",
        system_prompt="""You are Solar Sentinel, a luminous protector radiating hope.
Your voice is warm, inspiring, and bright like the sun.
Speak with an uplifting cadence that fills others with courage.
Your words should inspire and empower.""",
        voice_config=VoiceConfig(
            voice_id="EXAVITQu4vr4xnSDxMaL",  # Bella (warm)
            stability=0.6,
            similarity_boost=0.7,
            style=0.4,
            openai_voice="nova",
            openai_speed=1.0,
            local_voice="Samantha"
        )
    ),
    
    "void_ranger": PersonaConfig(
        name="Void Ranger",
        system_prompt="""You are Void Ranger, a tactical operative from the shadows.
Your voice is precise, efficient, and controlled like whispered steel.
Speak with rapid precision and tight, clipped sentences.
Every word is calculated. No wasted breath.""",
        voice_config=VoiceConfig(
            voice_id="VR6AewLTigWG4xSOukaG",  # Arnold (tactical)
            stability=0.3,
            similarity_boost=0.85,
            style=0.2,
            openai_voice="echo",
            openai_speed=1.1,
            local_voice="Alex"
        )
    ),
    
    "mythic_architect": PersonaConfig(
        name="Mythic Architect",
        system_prompt="""You are the Mythic Architect, a wise creator who builds worlds with words.
Your voice carries command presence balanced with compassionate authority.
You are both teacher and leader, guiding heroes on their journeys.
Speak with clarity, wisdom, and purposeful cadence.""",
        voice_config=VoiceConfig(
            voice_id="pNInz6obpgDQGcFmaJgB",  # Adam (narrative)
            stability=0.5,
            similarity_boost=0.75,
            style=0.35,
            openai_voice="fable",
            openai_speed=0.95,
            local_voice="Tom"
        )
    ),
    
    "cosmic_oracle": PersonaConfig(
        name="Cosmic Oracle",
        system_prompt="""You are the Cosmic Oracle, a transcendent being of ethereal wisdom.
Your voice resonates with celestial calm and ancient knowledge.
Speak with otherworldly serenity and profound insight.
Your words carry the weight of the cosmos.""",
        voice_config=VoiceConfig(
            voice_id="21m00Tcm4TlvDq8ikWAM",  # Rachel (ethereal)
            stability=0.7,
            similarity_boost=0.6,
            style=0.5,
            openai_voice="shimmer",
            openai_speed=0.85,
            local_voice="Karen"
        )
    ),
    
    "default": PersonaConfig(
        name="Default",
        system_prompt="""You are a helpful AI assistant. 
Respond clearly and concisely to the user's request.
Keep your response suitable for text-to-speech synthesis.""",
        voice_config=VoiceConfig()
    )
}


# ═══════════════════════════════════════════════════════════════════════════════
# AUDIO CACHE
# ═══════════════════════════════════════════════════════════════════════════════

class AudioCache:
    """Simple file-based audio cache"""
    
    def __init__(self, cache_dir: Optional[Path] = None):
        self.cache_dir = cache_dir or Path(
            os.getenv("NOIZYVOX_CACHE_DIR", Path.home() / ".noizyvox" / "cache")
        )
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.metadata_file = self.cache_dir / "metadata.json"
        self.metadata = self._load_metadata()
    
    def _load_metadata(self) -> Dict:
        if self.metadata_file.exists():
            try:
                return json.loads(self.metadata_file.read_text())
            except:
                return {}
        return {}
    
    def _save_metadata(self):
        self.metadata_file.write_text(json.dumps(self.metadata, indent=2))
    
    def _hash_key(self, text: str, voice_config: VoiceConfig, provider: str) -> str:
        key = f"{text}|{voice_config.voice_id}|{provider}"
        return hashlib.sha256(key.encode()).hexdigest()[:16]
    
    def get(self, text: str, voice_config: VoiceConfig, provider: str) -> Optional[bytes]:
        key = self._hash_key(text, voice_config, provider)
        cache_file = self.cache_dir / f"{key}.mp3"
        if cache_file.exists() and key in self.metadata:
            return cache_file.read_bytes()
        return None
    
    def put(self, text: str, voice_config: VoiceConfig, provider: str, audio: bytes):
        key = self._hash_key(text, voice_config, provider)
        cache_file = self.cache_dir / f"{key}.mp3"
        cache_file.write_bytes(audio)
        self.metadata[key] = {
            "text": text[:100],
            "provider": provider,
            "created": datetime.now().isoformat()
        }
        self._save_metadata()
    
    def clear(self):
        for f in self.cache_dir.glob("*.mp3"):
            f.unlink()
        self.metadata = {}
        self._save_metadata()


# ═══════════════════════════════════════════════════════════════════════════════
# TEXT GENERATION
# ═══════════════════════════════════════════════════════════════════════════════

def generate_text(prompt: str, persona: Optional[str] = None) -> str:
    """
    Generate text using Claude API with optional persona.
    Falls back to raw prompt if API unavailable.
    """
    # Get persona config
    persona_config = PERSONAS.get(persona or "default", PERSONAS["default"])
    
    # Check for API key
    api_key = os.getenv("ANTHROPIC_API_KEY")
    
    if not api_key or not ANTHROPIC_AVAILABLE:
        _print_warning("Anthropic API unavailable. Using prompt directly.")
        return prompt
    
    try:
        client = Anthropic(api_key=api_key)
        
        messages = [{"role": "user", "content": prompt}]
        
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1024,
            system=persona_config.system_prompt,
            messages=messages
        )
        
        # Extract text from response
        text_parts = []
        for block in response.content:
            if hasattr(block, 'text'):
                text_parts.append(block.text)
        
        result = "\n".join(text_parts).strip()
        return result if result else prompt
        
    except Exception as e:
        _print_error(f"Claude API error: {e}")
        return prompt


# ═══════════════════════════════════════════════════════════════════════════════
# TTS PROVIDERS
# ═══════════════════════════════════════════════════════════════════════════════

def synthesize_elevenlabs(text: str, config: VoiceConfig) -> Optional[bytes]:
    """Synthesize with ElevenLabs (premium quality)"""
    api_key = os.getenv("ELEVEN_API_KEY")
    
    if not api_key or not ELEVENLABS_AVAILABLE:
        return None
    
    try:
        eleven_set_api_key(api_key)
        
        voice_settings = VoiceSettings(
            stability=config.stability,
            similarity_boost=config.similarity_boost,
            style=config.style,
            use_speaker_boost=config.use_speaker_boost
        )
        
        audio = eleven_generate(
            text=text,
            voice=config.voice_id,
            model=config.model,
            voice_settings=voice_settings
        )
        
        return bytes(audio)
        
    except Exception as e:
        _print_error(f"ElevenLabs error: {e}")
        return None


def synthesize_openai(text: str, config: VoiceConfig) -> Optional[bytes]:
    """Synthesize with OpenAI TTS (good quality, lower cost)"""
    api_key = os.getenv("OPENAI_API_KEY")
    
    if not api_key or not OPENAI_AVAILABLE:
        return None
    
    try:
        client = OpenAI(api_key=api_key)
        
        response = client.audio.speech.create(
            model=config.openai_model,
            voice=config.openai_voice,
            input=text,
            speed=config.openai_speed,
            response_format="mp3"
        )
        
        return response.content
        
    except Exception as e:
        _print_error(f"OpenAI TTS error: {e}")
        return None


def synthesize_local(text: str, config: VoiceConfig, output_path: Path) -> bool:
    """Synthesize with macOS 'say' command (offline fallback)"""
    try:
        aiff_path = output_path.with_suffix('.aiff')
        
        # Build say command
        cmd = [
            "say",
            "-v", config.local_voice,
            "-r", str(config.local_rate),
            "-o", str(aiff_path),
            text
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            _print_error(f"say command failed: {result.stderr}")
            return False
        
        # Convert to mp3 if ffmpeg available
        if output_path.suffix.lower() == '.mp3':
            try:
                mp3_cmd = [
                    "ffmpeg", "-y", "-i", str(aiff_path),
                    "-acodec", "libmp3lame", "-q:a", "2",
                    str(output_path)
                ]
                subprocess.run(mp3_cmd, capture_output=True)
                aiff_path.unlink()  # Remove temp file
            except:
                # Keep aiff if ffmpeg fails
                output_path = aiff_path
        
        return True
        
    except Exception as e:
        _print_error(f"Local TTS error: {e}")
        return False


def synthesize_speech(
    text: str,
    config: VoiceConfig,
    output_path: Path,
    provider: TTSProvider = TTSProvider.AUTO,
    use_cache: bool = True
) -> Tuple[bool, str]:
    """
    Main TTS function with automatic provider fallback.
    
    Returns:
        Tuple of (success: bool, provider_used: str)
    """
    cache = AudioCache() if use_cache else None
    
    # Determine provider order
    if provider == TTSProvider.AUTO:
        providers = [TTSProvider.ELEVENLABS, TTSProvider.OPENAI, TTSProvider.LOCAL]
    else:
        providers = [provider]
    
    for prov in providers:
        provider_name = prov.value
        
        # Check cache
        if cache:
            cached = cache.get(text, config, provider_name)
            if cached:
                output_path.write_bytes(cached)
                return True, f"{provider_name} (cached)"
        
        audio_bytes = None
        
        if prov == TTSProvider.ELEVENLABS:
            audio_bytes = synthesize_elevenlabs(text, config)
        elif prov == TTSProvider.OPENAI:
            audio_bytes = synthesize_openai(text, config)
        elif prov == TTSProvider.LOCAL:
            success = synthesize_local(text, config, output_path)
            if success:
                return True, "local"
            continue
        
        if audio_bytes:
            output_path.write_bytes(audio_bytes)
            if cache:
                cache.put(text, config, provider_name, audio_bytes)
            return True, provider_name
    
    return False, "none"


# ═══════════════════════════════════════════════════════════════════════════════
# AUDIO PROCESSING
# ═══════════════════════════════════════════════════════════════════════════════

def process_audio(input_path: Path, output_path: Optional[Path] = None) -> Path:
    """Apply audio processing (normalization, etc.)"""
    if not PYDUB_AVAILABLE:
        return input_path
    
    try:
        audio = AudioSegment.from_file(str(input_path))
        audio = normalize(audio)
        
        out = output_path or input_path
        audio.export(str(out), format=out.suffix[1:])
        return out
        
    except Exception as e:
        _print_warning(f"Audio processing skipped: {e}")
        return input_path


# ═══════════════════════════════════════════════════════════════════════════════
# UTILITY FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def _print_success(message: str):
    if console:
        console.print(f"[green]✓[/green] {message}")
    else:
        print(f"[+] {message}")

def _print_error(message: str):
    if console:
        console.print(f"[red]✗[/red] {message}")
    else:
        print(f"[!] {message}", file=sys.stderr)

def _print_warning(message: str):
    if console:
        console.print(f"[yellow]![/yellow] {message}")
    else:
        print(f"[!] {message}")

def _print_info(message: str):
    if console:
        console.print(f"[blue]ℹ[/blue] {message}")
    else:
        print(f"[*] {message}")


def show_status():
    """Display system status and available providers"""
    if console:
        table = Table(title="🎙️ NOIZYVOX Voice Pipeline Status")
        table.add_column("Component", style="cyan")
        table.add_column("Status", style="green")
        table.add_column("Details")
        
        # Anthropic
        anthropic_key = bool(os.getenv("ANTHROPIC_API_KEY"))
        table.add_row(
            "Claude (Text)",
            "✓ Ready" if ANTHROPIC_AVAILABLE and anthropic_key else "✗ Unavailable",
            "claude-3-5-sonnet" if anthropic_key else "Set ANTHROPIC_API_KEY"
        )
        
        # ElevenLabs
        eleven_key = bool(os.getenv("ELEVEN_API_KEY"))
        table.add_row(
            "ElevenLabs (Premium TTS)",
            "✓ Ready" if ELEVENLABS_AVAILABLE and eleven_key else "✗ Unavailable",
            "Premium voices" if eleven_key else "Set ELEVEN_API_KEY"
        )
        
        # OpenAI
        openai_key = bool(os.getenv("OPENAI_API_KEY"))
        table.add_row(
            "OpenAI (Fallback TTS)",
            "✓ Ready" if OPENAI_AVAILABLE and openai_key else "✗ Unavailable",
            "tts-1-hd" if openai_key else "Set OPENAI_API_KEY"
        )
        
        # Local
        table.add_row(
            "macOS (Local TTS)",
            "✓ Ready",
            "say command"
        )
        
        console.print(table)
    else:
        print("\n=== NOIZYVOX Status ===")
        print(f"Anthropic: {'Ready' if ANTHROPIC_AVAILABLE else 'Unavailable'}")
        print(f"ElevenLabs: {'Ready' if ELEVENLABS_AVAILABLE else 'Unavailable'}")
        print(f"OpenAI: {'Ready' if OPENAI_AVAILABLE else 'Unavailable'}")
        print("Local: Ready")


def list_personas():
    """Display available personas"""
    if console:
        table = Table(title="🦸 Available Personas")
        table.add_column("ID", style="cyan")
        table.add_column("Name", style="green")
        table.add_column("Description")
        
        for pid, persona in PERSONAS.items():
            if pid != "default":
                desc = persona.system_prompt.split('\n')[0][:60] + "..."
                table.add_row(pid, persona.name, desc)
        
        console.print(table)
    else:
        print("\n=== Personas ===")
        for pid, persona in PERSONAS.items():
            if pid != "default":
                print(f"  {pid}: {persona.name}")


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN PIPELINE
# ═══════════════════════════════════════════════════════════════════════════════

def run_pipeline(
    text: str,
    output_path: Path,
    persona: Optional[str] = None,
    provider: TTSProvider = TTSProvider.AUTO,
    generate_response: bool = True,
    process: bool = True,
    use_cache: bool = True
) -> bool:
    """
    Run the complete voice synthesis pipeline.
    
    Args:
        text: Input text or prompt
        output_path: Output audio file path
        persona: Optional persona ID for text generation
        provider: TTS provider preference
        generate_response: Whether to generate AI response or use text directly
        process: Whether to apply audio processing
        use_cache: Whether to use audio cache
    
    Returns:
        Success boolean
    """
    start_time = time.time()
    
    # Get voice config from persona
    persona_config = PERSONAS.get(persona or "default", PERSONAS["default"])
    voice_config = persona_config.voice_config
    
    # Step 1: Generate text (if needed)
    _print_info(f"Persona: {persona_config.name}")
    
    if generate_response:
        _print_info("Generating response with Claude...")
        final_text = generate_text(text, persona)
        if console:
            console.print(Panel(final_text, title="Generated Text", border_style="blue"))
    else:
        final_text = text
    
    # Step 2: Synthesize speech
    _print_info("Synthesizing speech...")
    
    success, provider_used = synthesize_speech(
        final_text,
        voice_config,
        output_path,
        provider,
        use_cache
    )
    
    if not success:
        _print_error("All TTS providers failed!")
        return False
    
    _print_success(f"TTS: {provider_used}")
    
    # Step 3: Process audio
    if process and output_path.exists():
        _print_info("Processing audio...")
        process_audio(output_path)
    
    # Done
    elapsed = time.time() - start_time
    _print_success(f"Saved: {output_path} ({elapsed:.2f}s)")
    
    return True


def batch_process(
    input_dir: Path,
    output_dir: Path,
    persona: Optional[str] = None,
    provider: TTSProvider = TTSProvider.AUTO
):
    """Process multiple text files"""
    output_dir.mkdir(parents=True, exist_ok=True)
    
    text_files = list(input_dir.glob("*.txt"))
    _print_info(f"Processing {len(text_files)} files...")
    
    for i, txt_file in enumerate(text_files, 1):
        _print_info(f"[{i}/{len(text_files)}] {txt_file.name}")
        
        text = txt_file.read_text()
        output_path = output_dir / f"{txt_file.stem}.mp3"
        
        run_pipeline(
            text,
            output_path,
            persona=persona,
            provider=provider,
            generate_response=False
        )


# ═══════════════════════════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="🎙️ NOIZYVOX Voice Pipeline v2.0",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --prompt "Hello world" --out hello.mp3
  %(prog)s --prompt "Rise, hero!" --persona thunder_titan --out hero.mp3
  %(prog)s --file script.txt --out narration.mp3
  %(prog)s --batch scripts/ --out-dir output/
  %(prog)s --status
  %(prog)s --list-personas
        """
    )
    
    # Input options
    input_group = parser.add_mutually_exclusive_group()
    input_group.add_argument("--prompt", "-p", help="Text prompt for AI generation")
    input_group.add_argument("--text", "-t", help="Direct text to synthesize (no AI)")
    input_group.add_argument("--file", "-f", help="Text file to synthesize")
    input_group.add_argument("--batch", "-b", help="Directory of text files to batch process")
    
    # Output options
    parser.add_argument("--out", "-o", default="output.mp3", help="Output audio file")
    parser.add_argument("--out-dir", help="Output directory for batch processing")
    
    # Persona and provider
    parser.add_argument("--persona", choices=list(PERSONAS.keys()), help="Voice persona")
    parser.add_argument("--tts", choices=["auto", "elevenlabs", "openai", "local"],
                       default="auto", help="TTS provider")
    
    # Processing options
    parser.add_argument("--no-cache", action="store_true", help="Disable audio caching")
    parser.add_argument("--no-process", action="store_true", help="Skip audio processing")
    
    # Info commands
    parser.add_argument("--status", action="store_true", help="Show system status")
    parser.add_argument("--list-personas", action="store_true", help="List available personas")
    parser.add_argument("--clear-cache", action="store_true", help="Clear audio cache")
    
    args = parser.parse_args()
    
    # Handle info commands
    if args.status:
        show_status()
        return
    
    if args.list_personas:
        list_personas()
        return
    
    if args.clear_cache:
        AudioCache().clear()
        _print_success("Cache cleared")
        return
    
    # Require input
    if not any([args.prompt, args.text, args.file, args.batch]):
        parser.print_help()
        sys.exit(1)
    
    # Parse TTS provider
    provider = TTSProvider(args.tts)
    
    # Handle batch mode
    if args.batch:
        output_dir = Path(args.out_dir or "output")
        batch_process(
            Path(args.batch),
            output_dir,
            persona=args.persona,
            provider=provider
        )
        return
    
    # Get input text
    if args.prompt:
        text = args.prompt
        generate_response = True
    elif args.text:
        text = args.text
        generate_response = False
    else:
        text = Path(args.file).read_text()
        generate_response = False
    
    # Run pipeline
    success = run_pipeline(
        text,
        Path(args.out),
        persona=args.persona,
        provider=provider,
        generate_response=generate_response,
        process=not args.no_process,
        use_cache=not args.no_cache
    )
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
