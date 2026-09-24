#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
# NOIZY Voice Capture — Full Pipeline
# Captures voice → local transcription (mlx-whisper) → tower routing → action
#
# Pipeline:
#   🎤 Audio Hijack → WAV → mlx-whisper (local, FREE) → transcript
#   → auto-detect Dream Chamber tower → route to Ollama or Anthropic
#   → D1 audit log + local manifest
#
# Requirements:
#   - Audio Hijack (/Applications/Audio Hijack.app) with "NOIZY Voice" session
#   - mlx-whisper (pip3 install mlx-whisper) — transcription on M2 Ultra
#   - Ollama (localhost:11434) — local AI processing
#
# Usage:
#   bash scripts/voice-capture.sh start      # Start recording
#   bash scripts/voice-capture.sh stop       # Stop and process
#   bash scripts/voice-capture.sh status     # Check pipeline state
#   bash scripts/voice-capture.sh ingest     # Transcribe + route latest
#   bash scripts/voice-capture.sh ingest-all # Process all unprocessed
#   bash scripts/voice-capture.sh live       # Live mic → instant transcribe
#   bash scripts/voice-capture.sh setup      # Audio Hijack setup guide
#   bash scripts/voice-capture.sh cost       # Show API cost savings
#
# Author: GABRIEL | RSP_001 | GORUNFREE | 2026-03-31
# ═══════════════════════════════════════════════════════════════════════

CAPTURE_DIR="${HOME}/Documents/NOIZY_Voice_Captures"
PROCESSED_DIR="${CAPTURE_DIR}/processed"
TRANSCRIPTS_DIR="${CAPTURE_DIR}/transcripts"
SESSION_NAME="NOIZY Voice"
HEAVEN_URL="https://heaven.rsp-5f3.workers.dev"
CLAUDE_PROXY_URL="http://localhost:8080"  # voice-bridge local, not cloud
OLLAMA_URL="http://localhost:11434"
MANIFEST="${CAPTURE_DIR}/manifest.log"
COST_LOG="${CAPTURE_DIR}/cost.log"

GREEN='\033[0;32m' RED='\033[0;31m' YELLOW='\033[0;33m'
CYAN='\033[0;36m' MAGENTA='\033[0;35m' BOLD='\033[1m' NC='\033[0m'

mkdir -p "$CAPTURE_DIR" "$PROCESSED_DIR" "$TRANSCRIPTS_DIR" 2>/dev/null

# ── Transcription engine (prefer mlx-whisper, fallback to whisper CLI) ──
transcribe() {
  local audio_file="$1"
  local basename_no_ext="${audio_file%.*}"
  local transcript_file="${TRANSCRIPTS_DIR}/$(basename "$basename_no_ext").txt"

  # Try mlx-whisper first (Apple Silicon optimized, runs on M2 Ultra GPU)
  if python3 -c "import mlx_whisper" 2>/dev/null; then
    echo -e "  ${MAGENTA}🧠 Transcribing with mlx-whisper (M2 Ultra, local)...${NC}"
    python3 -c "
import mlx_whisper, json, sys
result = mlx_whisper.transcribe('$audio_file', path_or_hf_repo='mlx-community/whisper-large-v3-turbo')
text = result.get('text', '').strip()
print(text)
with open('$transcript_file', 'w') as f:
    f.write(text)
    f.write('\n')
# Also save segments for timestamped output
segments = result.get('segments', [])
with open('${transcript_file%.txt}.json', 'w') as f:
    json.dump({'text': text, 'segments': segments, 'source': '$(basename "$audio_file")'}, f, indent=2)
" 2>/dev/null
    return $?
  fi

  # Fallback: whisper CLI
  if command -v whisper > /dev/null 2>&1; then
    echo -e "  ${YELLOW}Transcribing with whisper CLI...${NC}"
    whisper "$audio_file" --model base --output_format txt --output_dir "$TRANSCRIPTS_DIR" --language en 2>/dev/null
    cat "$transcript_file" 2>/dev/null
    return $?
  fi

  # Fallback: whisper.cpp
  if command -v whisper-cpp > /dev/null 2>&1; then
    echo -e "  ${YELLOW}Transcribing with whisper.cpp...${NC}"
    whisper-cpp -m "$HOME/.cache/whisper/ggml-base.en.bin" -f "$audio_file" -otxt 2>/dev/null
    return $?
  fi

  echo -e "  ${RED}No transcription engine found${NC}"
  echo -e "  Install: ${YELLOW}pip3 install mlx-whisper${NC} (recommended for M2 Ultra)"
  return 1
}

# ── Auto-detect Dream Chamber tower from transcript ──
detect_tower() {
  local text="$1"
  python3 -c "
import re, sys
t = '''$text'''.lower()
rules = [
    (r'build|code|deploy|typescript|worker|script|api|function|install|git|bash|npm|wrangler|vitest|debug|fix|refactor', 'code'),
    (r'design|brand|ux|ui|logo|color|font|layout|visual|creative|aesthetic|beautiful|style|copy|landing|hero', 'lucy'),
    (r'consent|revoke|allow|deny|hold|escalate|never.clause|hvs|ncp|royalt|split|creator.right|voice.dna', 'cb01'),
    (r'audit|check|verify|test|review|qa|quality|regression|checklist|runbook|post.mortem|inspect', 'shirl'),
    (r'task|assign|route|crew|delegate|schedule|team|channel|meeting|teams|coordinate|priorit', 'work'),
    (r'wisdom|advice|mentor|legacy|long.term|careful|patient|experience|perspective|guidance', 'pops'),
    (r'dream|vision|future|roadmap|strategy|synthesize|big.picture|cathedral|imagine|possibility', 'dream'),
    (r'sovereign|kernel|authority|doctrine|protocol|empire|mission|heaven|gorunfree|plowman', 'heaven'),
    (r'quick|fast|status|ping|how.many|what.is|when.did|list|count', 'fast'),
]
for pattern, tower in rules:
    if re.search(pattern, t):
        print(tower)
        sys.exit()
print('max')
" 2>/dev/null
}

# ── Route to tower (local Ollama for fast/work/shirl/cb01, cloud for others) ──
route_to_tower() {
  local tower="$1" transcript="$2"
  local model="" url=""

  # Local towers → Ollama (FREE)
  case "$tower" in
    fast)  model="gemma3:4b" ;;
    work)  model="llama3.2" ;;
    shirl) model="llama3.2" ;;
    cb01)  model="llama3.2" ;;
    *)     model="" ;; # cloud
  esac

  if [ -n "$model" ]; then
    echo -e "  ${GREEN}⚡ Routing to Ollama: ${model} (FREE)${NC}"
    RESPONSE=$(curl -s -m 30 "${OLLAMA_URL}/api/chat" \
      -d "{\"model\":\"$model\",\"messages\":[{\"role\":\"user\",\"content\":\"$transcript\"}],\"stream\":false}" \
      2>/dev/null)
    REPLY=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('message',{}).get('content','no response'))" 2>/dev/null)
    echo "$tower|ollama|$model|\$0.00" >> "$COST_LOG"
    echo -e "  ${CYAN}${tower} → ${NC}${REPLY:0:200}"
  else
    echo -e "  ${MAGENTA}☁️  Routing to HEAVEN Claude Proxy: tower=$tower${NC}"
    RESPONSE=$(curl -s -m 30 \
      -X POST "${CLAUDE_PROXY_URL}/voice/ingest" \
      -H "Content-Type: application/json" \
      -H "X-NOIZY-Secret: ${NOIZY_SECRET:-}" \
      -d "{
        \"transcript\": \"$(echo "$transcript" | sed 's/"/\\"/g')\",
        \"source\": \"voice-capture\",
        \"tower\": \"$tower\"
      }" 2>/dev/null)
    # Estimate cost (rough)
    TOKENS=$(echo "$transcript" | wc -w | tr -d ' ')
    COST=$(python3 -c "print(f'\${$TOKENS * 4 * 15 / 1000000:.4f}')" 2>/dev/null || echo "\$0.01")
    echo "$tower|anthropic|$tower|$COST" >> "$COST_LOG"
    echo -e "  ${CYAN}Ingested → $tower tower (est. cost: $COST)${NC}"
  fi
}

case "${1:-status}" in
  start)
    echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${CYAN}║  🎤 NOIZY Voice Capture — Starting      ║${NC}"
    echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════╝${NC}"
    echo ""

    if [ ! -d "/Applications/Audio Hijack.app" ]; then
      echo -e "${RED}✗ Audio Hijack not found — run: bash scripts/voice-capture.sh setup${NC}"
      exit 1
    fi

    if ! pgrep -x "Audio Hijack" > /dev/null 2>&1; then
      echo -e "  ${YELLOW}Launching Audio Hijack...${NC}"
      open -a "Audio Hijack"
      sleep 2
    fi

    osascript <<'EOF'
      tell application "Audio Hijack"
        activate
        set sessionList to name of every session
        if "NOIZY Voice" is in sessionList then
          set targetSession to session "NOIZY Voice"
          start hijacking session targetSession
          return "Recording started"
        else
          return "Session 'NOIZY Voice' not found — run: bash scripts/voice-capture.sh setup"
        end if
      end tell
EOF

    echo ""
    echo -e "${GREEN}✓ Voice capture LIVE${NC}"
    echo -e "  Session: ${SESSION_NAME}"
    echo -e "  Output: ${CAPTURE_DIR}"
    echo -e "  Pipeline: Audio → WAV → mlx-whisper → Dream Chamber"
    echo -e "  Stop: ${YELLOW}bash scripts/voice-capture.sh stop${NC}"
    ;;

  stop)
    echo -e "${BOLD}${CYAN}NOIZY Voice Capture — Stopping${NC}"

    osascript <<'EOF'
      tell application "Audio Hijack"
        set sessionList to name of every session
        if "NOIZY Voice" is in sessionList then
          set targetSession to session "NOIZY Voice"
          stop hijacking session targetSession
          return "Recording stopped"
        end if
      end tell
EOF

    echo -e "${GREEN}✓ Voice capture stopped${NC}"

    LATEST=$(find "$CAPTURE_DIR" -maxdepth 1 \( -name "*.wav" -o -name "*.aiff" -o -name "*.m4a" \) 2>/dev/null | sort | tail -1)
    if [ -n "$LATEST" ]; then
      SIZE=$(du -h "$LATEST" | awk '{print $1}')
      echo -e "  Latest: ${CYAN}$(basename "$LATEST")${NC} (${SIZE})"
      echo -e "  Next: ${YELLOW}bash scripts/voice-capture.sh ingest${NC}"
    fi
    ;;

  ingest)
    echo -e "${BOLD}${MAGENTA}╔══════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${MAGENTA}║  🧠 NOIZY Voice Ingest — Full Pipeline   ║${NC}"
    echo -e "${BOLD}${MAGENTA}╚══════════════════════════════════════════╝${NC}"
    echo ""

    LATEST=$(find "$CAPTURE_DIR" -maxdepth 1 \( -name "*.wav" -o -name "*.aiff" -o -name "*.m4a" \) 2>/dev/null | sort | tail -1)
    if [ -z "$LATEST" ]; then
      echo -e "${RED}✗ No recordings found in ${CAPTURE_DIR}${NC}"
      exit 1
    fi

    FILENAME=$(basename "$LATEST")
    SIZE=$(du -h "$LATEST" | awk '{print $1}')
    echo -e "  📁 File: ${CYAN}${FILENAME}${NC} (${SIZE})"

    # Step 1: Transcribe
    TRANSCRIPT=$(transcribe "$LATEST")
    if [ -z "$TRANSCRIPT" ]; then
      echo -e "  ${RED}✗ Transcription failed${NC}"
      exit 1
    fi
    echo -e "  📝 Transcript: ${GREEN}${TRANSCRIPT:0:120}${NC}"

    # Step 2: Detect tower
    TOWER=$(detect_tower "$TRANSCRIPT")
    echo -e "  🏗️  Tower: ${MAGENTA}${TOWER}${NC}"

    # Step 3: Route to tower
    route_to_tower "$TOWER" "$TRANSCRIPT"

    # Step 4: Move to processed
    mv "$LATEST" "$PROCESSED_DIR/" 2>/dev/null
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ)|${FILENAME}|${SIZE}|${TOWER}|${TRANSCRIPT:0:80}" >> "$MANIFEST"
    echo ""
    echo -e "  ${GREEN}✓ Pipeline complete${NC}"
    ;;

  ingest-all)
    echo -e "${BOLD}${MAGENTA}NOIZY Voice Ingest — Batch Processing${NC}"
    FILES=$(find "$CAPTURE_DIR" -maxdepth 1 \( -name "*.wav" -o -name "*.aiff" -o -name "*.m4a" \) 2>/dev/null | sort)
    COUNT=$(echo "$FILES" | grep -c "" 2>/dev/null || echo 0)
    echo -e "  Found: ${COUNT} files"
    echo ""
    echo "$FILES" | while read -r f; do
      [ -z "$f" ] && continue
      echo -e "  ${CYAN}Processing: $(basename "$f")${NC}"
      TRANSCRIPT=$(transcribe "$f")
      TOWER=$(detect_tower "$TRANSCRIPT")
      route_to_tower "$TOWER" "$TRANSCRIPT"
      mv "$f" "$PROCESSED_DIR/" 2>/dev/null
      echo ""
    done
    echo -e "${GREEN}✓ Batch complete${NC}"
    ;;

  live)
    echo -e "${BOLD}${MAGENTA}╔══════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${MAGENTA}║  🎤 NOIZY Live Voice — Real-time         ║${NC}"
    echo -e "${BOLD}${MAGENTA}╚══════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  ${YELLOW}Recording 10 seconds from default mic...${NC}"
    echo -e "  ${YELLOW}Speak now!${NC}"
    echo ""

    TMP_WAV="/tmp/noizy_live_$(date +%s).wav"
    # Record 10 seconds from default mic using sox
    if command -v sox > /dev/null 2>&1; then
      sox -d -r 16000 -c 1 -b 16 "$TMP_WAV" trim 0 10 2>/dev/null
    elif command -v rec > /dev/null 2>&1; then
      rec "$TMP_WAV" trim 0 10 2>/dev/null
    else
      # Fallback: use ffmpeg
      ffmpeg -f avfoundation -i ":0" -t 10 -ar 16000 -ac 1 "$TMP_WAV" -y 2>/dev/null
    fi

    if [ ! -f "$TMP_WAV" ]; then
      echo -e "  ${RED}✗ Recording failed — install sox: brew install sox${NC}"
      exit 1
    fi

    TRANSCRIPT=$(transcribe "$TMP_WAV")
    echo -e "  📝 You said: ${GREEN}${TRANSCRIPT}${NC}"

    TOWER=$(detect_tower "$TRANSCRIPT")
    echo -e "  🏗️  Tower: ${MAGENTA}${TOWER}${NC}"
    echo ""

    route_to_tower "$TOWER" "$TRANSCRIPT"
    rm "$TMP_WAV" 2>/dev/null
    ;;

  status)
    echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${CYAN}║  🎤 NOIZY Voice Pipeline — Status         ║${NC}"
    echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════╝${NC}"
    echo ""

    # Audio Hijack
    if pgrep -x "Audio Hijack" > /dev/null 2>&1; then
      echo -e "  Audio Hijack: ${GREEN}RUNNING${NC}"
    else
      echo -e "  Audio Hijack: ${RED}NOT RUNNING${NC}"
    fi

    # Transcription engine
    if python3 -c "import mlx_whisper" 2>/dev/null; then
      echo -e "  Transcription: ${GREEN}mlx-whisper (M2 Ultra GPU, local)${NC}"
    elif command -v whisper > /dev/null 2>&1; then
      echo -e "  Transcription: ${YELLOW}whisper CLI${NC}"
    else
      echo -e "  Transcription: ${RED}NOT INSTALLED${NC} — pip3 install mlx-whisper"
    fi

    # Ollama
    if curl -s -m 2 "${OLLAMA_URL}/api/tags" > /dev/null 2>&1; then
      MODELS=$(curl -s -m 2 "${OLLAMA_URL}/api/tags" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('models',[])))" 2>/dev/null)
      echo -e "  Ollama: ${GREEN}LIVE${NC} (${MODELS} models)"
    else
      echo -e "  Ollama: ${RED}DOWN${NC}"
    fi

    # Voice Bridge
    if curl -s -m 2 http://localhost:8080/health > /dev/null 2>&1; then
      echo -e "  Voice Bridge: ${GREEN}HEALTHY${NC} (localhost:8080)"
    else
      echo -e "  Voice Bridge: ${RED}DOWN${NC}"
    fi

    # Captures
    COUNT=$(find "$CAPTURE_DIR" -maxdepth 1 \( -name "*.wav" -o -name "*.aiff" -o -name "*.m4a" \) 2>/dev/null | wc -l | tr -d ' ')
    PROCESSED=$(find "$PROCESSED_DIR" -maxdepth 1 \( -name "*.wav" -o -name "*.aiff" -o -name "*.m4a" \) 2>/dev/null | wc -l | tr -d ' ')
    echo -e "  Pending: ${COUNT} | Processed: ${PROCESSED}"

    LATEST=$(find "$CAPTURE_DIR" -maxdepth 1 \( -name "*.wav" -o -name "*.aiff" -o -name "*.m4a" \) 2>/dev/null | sort | tail -1)
    if [ -n "$LATEST" ]; then
      SIZE=$(du -h "$LATEST" | awk '{print $1}')
      MOD=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$LATEST" 2>/dev/null || echo "unknown")
      echo -e "  Latest: $(basename "$LATEST") (${SIZE}, ${MOD})"
    fi
    ;;

  cost)
    echo -e "${BOLD}${MAGENTA}NOIZY Voice — Cost Savings Report${NC}"
    echo ""
    if [ -f "$COST_LOG" ]; then
      OLLAMA_CALLS=$(grep -c "ollama" "$COST_LOG" 2>/dev/null || echo 0)
      CLOUD_CALLS=$(grep -c "anthropic" "$COST_LOG" 2>/dev/null || echo 0)
      TOTAL=$((OLLAMA_CALLS + CLOUD_CALLS))
      SAVED_PCT=$( [ $TOTAL -gt 0 ] && echo "$((OLLAMA_CALLS * 100 / TOTAL))" || echo 0)
      echo -e "  Local (Ollama):    ${GREEN}${OLLAMA_CALLS} calls — \$0.00${NC}"
      echo -e "  Cloud (Anthropic): ${YELLOW}${CLOUD_CALLS} calls${NC}"
      echo -e "  Savings:           ${GREEN}${SAVED_PCT}% routed locally${NC}"
    else
      echo -e "  ${YELLOW}No cost data yet — ingest some voice to see savings${NC}"
    fi
    ;;

  setup)
    echo -e "${BOLD}${CYAN}NOIZY Voice Capture — Setup Guide${NC}"
    echo ""
    echo "1. Install Audio Hijack (rogueamoeba.com/audiohijack)"
    echo "2. Create session 'NOIZY Voice':"
    echo "   → Input: Microphone (or Application → Teams for iPhone)"
    echo "   → Recorder block: WAV, 48kHz, 16-bit"
    echo "   → Output folder: ${CAPTURE_DIR}"
    echo ""
    echo "3. Install transcription (pick one):"
    echo "   pip3 install mlx-whisper    # BEST for M2 Ultra (GPU)"
    echo "   brew install whisper-cpp    # C++ alternative"
    echo ""
    echo "4. Install live recording (optional):"
    echo "   brew install sox            # For 'live' mode"
    echo ""
    echo "5. Commands:"
    echo "   bash scripts/voice-capture.sh start       # Begin capture"
    echo "   bash scripts/voice-capture.sh stop        # End"
    echo "   bash scripts/voice-capture.sh ingest      # Transcribe → route"
    echo "   bash scripts/voice-capture.sh live         # Real-time mic"
    echo "   bash scripts/voice-capture.sh cost        # Cost savings"
    ;;

  *)
    echo "Usage: bash scripts/voice-capture.sh {start|stop|status|ingest|ingest-all|live|cost|setup}"
    ;;
esac
