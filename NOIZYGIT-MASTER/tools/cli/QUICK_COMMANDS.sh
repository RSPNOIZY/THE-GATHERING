#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# 🚀 NOIZYVOX QUICK COMMANDS
# ═══════════════════════════════════════════════════════════════════════════════
# Add to .zshrc:  source /path/to/QUICK_COMMANDS.sh
# ═══════════════════════════════════════════════════════════════════════════════

# Set NOIZYLAB directory
export NOIZYLAB_HOME="${NOIZYLAB_HOME:-$HOME/NOIZYLAB}"
export NOIZYVOX_HOME="${NOIZYVOX_HOME:-$NOIZYLAB_HOME}"

# ─────────────────────────────────────────────────────────────────────────────
# VOICE SYNTHESIS
# ─────────────────────────────────────────────────────────────────────────────

# Quick voice synthesis
vox() {
    python3 "$NOIZYLAB_HOME/scripts/voice_pipeline.py" "$@"
}

# Voice with persona
vox-thunder() {
    vox --prompt "$*" --persona thunder_titan --out thunder.mp3 && afplay thunder.mp3
}

vox-solar() {
    vox --prompt "$*" --persona solar_sentinel --out solar.mp3 && afplay solar.mp3
}

vox-void() {
    vox --prompt "$*" --persona void_ranger --out void.mp3 && afplay void.mp3
}

vox-mythic() {
    vox --prompt "$*" --persona mythic_architect --out mythic.mp3 && afplay mythic.mp3
}

vox-oracle() {
    vox --prompt "$*" --persona cosmic_oracle --out oracle.mp3 && afplay oracle.mp3
}

# Voice status
vox-status() {
    python3 "$NOIZYLAB_HOME/scripts/voice_pipeline.py" --status
}

# List personas
vox-personas() {
    python3 "$NOIZYLAB_HOME/scripts/voice_pipeline.py" --list-personas
}

# ─────────────────────────────────────────────────────────────────────────────
# HERO VOICE ENGINE
# ─────────────────────────────────────────────────────────────────────────────

# Full hero engine
hero() {
    python3 "$NOIZYLAB_HOME/scripts/hero_voice_engine.py" "$@"
}

# Design new persona
hero-design() {
    hero --design "$*"
}

# ─────────────────────────────────────────────────────────────────────────────
# QUICK AUDIO
# ─────────────────────────────────────────────────────────────────────────────

# Say something (local macOS TTS)
say-it() {
    say -v Samantha "$*"
}

# Record audio
rec() {
    local filename="${1:-recording.wav}"
    echo "🎤 Recording... Press Ctrl+C to stop"
    sox -d "$filename"
}

# Play last output
play-last() {
    local latest=$(ls -t *.mp3 *.wav *.aiff 2>/dev/null | head -1)
    if [[ -n "$latest" ]]; then
        echo "▶ Playing: $latest"
        afplay "$latest"
    else
        echo "No audio files found"
    fi
}

# ─────────────────────────────────────────────────────────────────────────────
# NAVIGATION
# ─────────────────────────────────────────────────────────────────────────────

# Go to NOIZYLAB
lab() {
    cd "$NOIZYLAB_HOME" && ls
}

# Go to scripts
scripts() {
    cd "$NOIZYLAB_HOME/scripts" && ls *.py
}

# Go to docs
docs() {
    cd "$NOIZYLAB_HOME/docs" && ls
}

# ─────────────────────────────────────────────────────────────────────────────
# ENVIRONMENT
# ─────────────────────────────────────────────────────────────────────────────

# Activate virtual environment
venv() {
    if [[ -d "$NOIZYLAB_HOME/venv" ]]; then
        source "$NOIZYLAB_HOME/venv/bin/activate"
        echo "✓ Virtual environment activated"
    else
        echo "Creating virtual environment..."
        python3 -m venv "$NOIZYLAB_HOME/venv"
        source "$NOIZYLAB_HOME/venv/bin/activate"
        pip install -r "$NOIZYLAB_HOME/requirements.txt"
    fi
}

# Install dependencies
install-deps() {
    pip install -r "$NOIZYLAB_HOME/requirements.txt"
}

# ─────────────────────────────────────────────────────────────────────────────
# HEALTH CHECKS
# ─────────────────────────────────────────────────────────────────────────────

# Check all API keys
check-keys() {
    echo "🔑 API Key Status:"
    [[ -n "$ANTHROPIC_API_KEY" ]] && echo "  ✓ ANTHROPIC_API_KEY set" || echo "  ✗ ANTHROPIC_API_KEY missing"
    [[ -n "$ELEVEN_API_KEY" ]] && echo "  ✓ ELEVEN_API_KEY set" || echo "  ✗ ELEVEN_API_KEY missing"
    [[ -n "$OPENAI_API_KEY" ]] && echo "  ✓ OPENAI_API_KEY set" || echo "  ✗ OPENAI_API_KEY missing"
}

# System check
noizyvox-check() {
    echo "🎙️ NOIZYVOX System Check"
    echo "========================"
    check-keys
    echo ""
    echo "📦 Python Packages:"
    pip show anthropic elevenlabs openai 2>/dev/null | grep -E "^(Name|Version):" || echo "  Run: install-deps"
    echo ""
    echo "🔧 System Tools:"
    command -v ffmpeg >/dev/null && echo "  ✓ ffmpeg" || echo "  ✗ ffmpeg (brew install ffmpeg)"
    command -v sox >/dev/null && echo "  ✓ sox" || echo "  ✗ sox (brew install sox)"
    command -v say >/dev/null && echo "  ✓ say (macOS built-in)" || echo "  ✗ say"
}

# ─────────────────────────────────────────────────────────────────────────────
# HELP
# ─────────────────────────────────────────────────────────────────────────────

noizyvox-help() {
    cat << 'EOF'
🎙️ NOIZYVOX Quick Commands
===========================

VOICE SYNTHESIS:
  vox [args]              Run voice pipeline
  vox-thunder "text"      Synthesize with Thunder Titan
  vox-solar "text"        Synthesize with Solar Sentinel
  vox-void "text"         Synthesize with Void Ranger
  vox-mythic "text"       Synthesize with Mythic Architect
  vox-oracle "text"       Synthesize with Cosmic Oracle
  vox-status              Show pipeline status
  vox-personas            List available personas

HERO ENGINE:
  hero [args]             Run hero voice engine
  hero-design "desc"      Design new persona

AUDIO:
  say-it "text"           Quick local TTS
  rec [filename]          Record audio
  play-last               Play most recent audio

NAVIGATION:
  lab                     Go to NOIZYLAB
  scripts                 Go to scripts
  docs                    Go to docs

ENVIRONMENT:
  venv                    Activate virtual env
  install-deps            Install dependencies
  check-keys              Check API keys
  noizyvox-check          Full system check

EOF
}

# Aliases
alias nv="noizyvox-help"
alias nvcheck="noizyvox-check"

echo "🎙️ NOIZYVOX commands loaded. Type 'nv' for help."
