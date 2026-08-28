# GABRIEL VOICE RECORDING PIPELINE
## NOIZY.AI Project Documentation
**Author:** Robert Stephen Plowman  
**Date:** 2026-04-13  
**Project:** NOIZY.AI | Gabriel AI Voice Agent  
**Hardware Base:** GOD.local (M2 Ultra, 24-core, 192GB RAM, 1.8TB SSD)

---

## 1. HARDWARE CHAIN ARCHITECTURE

### Physical Topology
```
┌─────────────────────────────────────────────────────────┐
│ GOD.local (M2 Ultra Mac Studio)                         │
│ - 24-core ARM processor                                 │
│ - 192GB unified memory                                  │
│ - 1.8TB SSD storage                                     │
│ - macOS (latest)                                        │
└────────────────┬────────────────────────────────────────┘
                 │
        [Thunderbolt 3/4 Cable]
                 │
         ┌───────▼────────┐
         │ Micky-P        │
         │ Apollo Twin    │
         │ (UAD)          │
         │ - 2 In, 6 Out  │
         │ - 192kHz 24-bit│
         │ - Preamps      │
         └───────┬────────┘
                 │
        ┌────────┴────────┐
        │                 │
    ┌───▼──┐        ┌─────▼─────┐
    │Monitors│      │Headphones │
    └────────┘      │(Reference)│
                    └───────────┘

### Input Chain (if recording voice for Gabriel):
┌─────────────────┐
│ Microphone      │
└────────┬────────┘
         │
    [XLR/USB]
         │
    ┌────▼─────────┐
    │ Apollo Twin  │
    │ Preamp       │
    └────┬─────────┘
         │ [Thunderbolt]
         │
    ┌────▼──────────┐
    │ GOD.local     │
    │ CoreAudio     │
    └───────────────┘
```

### Audio Routing Paths
- **System Audio Output** → CoreAudio → Apollo Twin digital/analog outputs
- **Recording Input** → Apollo Twin preamps → GOD.local (Thunderbolt PCIe)
- **Monitor Output** → Apollo Twin main outputs → studio monitors + headphones
- **Metering** → Apollo Twin → UAD Console real-time display

---

## 2. SOFTWARE STACK

### Core Audio Infrastructure
| Component | Purpose | Status |
|-----------|---------|--------|
| **CoreAudio** | macOS audio kernel framework | System daemon |
| **Audio MIDI Setup** | Aggregate device configuration | Built-in utility |
| **Universal Audio Console (UAD)** | Apollo Twin control panel | Third-party app |
| **Thunderbolt drivers** | Apollo Twin connectivity | System kext |

### Virtual Audio Routing
| Tool | Purpose | Installation |
|------|---------|--------------|
| **BlackHole** | Virtual audio device (free) | brew install blackhole-2ch |
| **Loopback** (Rogue Amoeba) | Advanced virtual mixer | Purchase from Rogue Amoeba |
| **Audio Hijack** (Rogue Amoeba) | System audio capture + routing | Purchase from Rogue Amoeba |

### DAW & Recording
| Tool | Purpose | Notes |
|------|---------|-------|
| **Logic Pro** | Multi-track recording & editing | Full DAW with ADC plugins |
| **Final Cut Pro** | Video post-processing | If exporting video with audio |
| **Audacity** | Lightweight audio editing | Free alternative |
| **ffmpeg** | Command-line audio encoding | brew install ffmpeg |

### AI & Voice Generation
| Component | Purpose | Running |
|-----------|---------|---------|
| **Ollama** | Local LLM inference engine | 19 models active |
| **Gemma3** | Text generation (via Ollama) | Container-based |
| **Coqui TTS** | Open-source TTS | Optional Docker container |
| **Bark (Suno)** | Neural codec TTS | Python package |
| **XTTS v2** | Voice cloning capable TTS | Python/Docker |

### NOIZY.AI Integration
| Component | Purpose | Status |
|-----------|---------|--------|
| **noizy-gemma3 MCP** | Gabriel text generation | Server running |
| **Whisper (OpenAI)** | Speech-to-text (optional) | Optional local/API |
| **Voice cloning scripts** | Custom voice modeling | Custom scripts |

---

## 3. TTS OPTIONS FOR GABRIEL'S VOICE

### Option 1: macOS Built-in `say` Command
**Pros:** Zero setup, instant, system-integrated  
**Cons:** Robotic, limited voice quality  
**Command:**
```bash
say -v "Daniel" "Hello, I am Gabriel" -r 150 -o gabriel_message.m4a
```
**Available Voices:** Use `say -v '?' | head -20` to list  
**Best For:** Quick testing, fallback option

### Option 2: Coqui TTS (Docker)
**Pros:** Fast, high-quality, multi-language, self-hosted  
**Cons:** GPU accelerated recommended, larger model sizes  
**Setup:**
```bash
docker pull coqui/tts
docker run --rm -it -p 5002:5002 coqui/tts
curl "http://localhost:5002/api/tts?text=Gabriel&speaker_idx=p225&language_idx=en"
```
**Best For:** Production voice, local control, real-time generation

### Option 3: Ollama + TTS Models
**Pros:** Integrated with existing Ollama infrastructure  
**Cons:** Limited TTS-specific models  
**Available Models:**
```bash
ollama list | grep -i voice
# Check for: piper-tts, espeak-ng, festival
```

### Option 4: Bark (Suno)
**Pros:** Emotional control, speaker cloning, fast  
**Cons:** GPU recommended, larger model (7GB+)  
**Installation:**
```bash
pip install bark
python -c "from bark import generate_audio, SAMPLE_RATE; from scipy.io import wavfile; audio = generate_audio('Hello Gabriel'); wavfile.write('gabriel.wav', SAMPLE_RATE, audio)"
```
**Voice Control:** Supports custom speaker embeddings  
**Best For:** Character-driven voice, emotional variation

### Option 5: XTTS v2 (Coqui Advanced)
**Pros:** Voice cloning, multiple languages, excellent quality  
**Cons:** Requires reference voice sample, slower than Bark  
**Installation:**
```bash
pip install TTS
python -c "from TTS.api import TTS; tts = TTS(model_name='tts_models/multilingual/multi-speaker/xtts_v2', gpu=True); tts.tts_to_file(text='Hello Gabriel', speaker_wav='reference_voice.wav', language='en', file_path='gabriel.wav')"
```
**Best For:** Voice cloning, professional voice matching

### Option 6: ElevenLabs API (Cloud)
**Pros:** Highest quality, shortest latency, enterprise-grade  
**Cons:** API-based (cloud), requires API key, cost per minute  
**Setup:**
```bash
curl -X POST "https://api.elevenlabs.io/v1/text-to-speech/{voice_id}" \
  -H "xi-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello Gabriel","model_id":"eleven_monolingual_v1"}' \
  --output gabriel.mp3
```
**Voice Cloning:** Via Voice Lab  
**Best For:** Final delivery, broadcast quality

### Option 7: OpenAI TTS API
**Pros:** Simple, excellent quality, fast  
**Cons:** Cloud-based, API cost, rate limits  
**Setup:**
```bash
curl -X POST https://api.openai.com/v1/audio/speech \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model":"tts-1",
    "input":"Hello Gabriel",
    "voice":"nova",
    "response_format":"mp3"
  }' \
  --output gabriel.mp3
```
**Voice Options:** alloy, echo, fable, onyx, nova, shimmer  
**Best For:** Quick integration, API-friendly

### RECOMMENDATION FOR GABRIEL
**Primary:** Coqui TTS (self-hosted, high quality, local control)  
**Secondary:** Bark (for character variation)  
**Production:** XTTS v2 (voice cloning to match reference)  
**Fallback:** macOS `say` command (instant)

---

## 4. RECORDING PIPELINE ARCHITECTURE

### Data Flow Diagram
```
┌──────────────────────────────────────────────────────────────────┐
│ TEXT GENERATION LAYER                                            │
├──────────────────────────────────────────────────────────────────┤
│ User Input → Ollama (Gemma3) → Gabriel Script Output             │
│                                      │                            │
│                                      ▼                            │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ TTS LAYER                                                        │
├──────────────────────────────────────────────────────────────────┤
│ Script Text → TTS Engine → WAV/MP3 Audio                        │
│ (Coqui/Bark/XTTS/OpenAI/ElevenLabs)                            │
│                                      │                            │
│                                      ▼                            │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ AUDIO ROUTING LAYER                                              │
├──────────────────────────────────────────────────────────────────┤
│ Audio File Playback (afplay/mpv/player)                         │
│         │                                                        │
│         ▼                                                        │
│ [Virtual Audio Bus: BlackHole]                                  │
│         │                                                        │
│         ▼                                                        │
│ Audio Hijack: Capture + Route                                   │
│         │                                                        │
│         ▼                                                        │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ APOLLO TWIN LAYER (Micky-P)                                      │
├──────────────────────────────────────────────────────────────────┤
│ Digital Input (Thunderbolt) → UAD Console Processing            │
│         │                                                        │
│         ├─────────────► Main Outputs → Studio Monitors         │
│         │                                                        │
│         └─────────────► Headphone Outputs → Reference Headphone│
│                                                                 │
│ [Real-time Level Monitoring via UAD Console]                  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ DAW RECORDING LAYER                                              │
├──────────────────────────────────────────────────────────────────┤
│ Apollo Twin → Logic Pro Audio Input                             │
│         │                                                        │
│         ▼                                                        │
│ Multi-track Recording Session (24-bit / 48kHz)                  │
│         │                                                        │
│         ├─────────► Track 1: Gabriel Voice (main)              │
│         ├─────────► Track 2: Ambient noise (optional)          │
│         └─────────► Track 3: Metadata/timecode                 │
│         │                                                        │
│         ▼                                                        │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ POST-PROCESSING LAYER                                            │
├──────────────────────────────────────────────────────────────────┤
│ Logic Pro:                                                       │
│   - EQ & Compression (UAD plugins available)                    │
│   - Noise gate / De-esser                                       │
│   - Reverb / Echo (contextual)                                  │
│   - Gain normalization (-3dB target peak)                       │
│         │                                                        │
│         ▼                                                        │
│ Export: WAV (master) → MP3 (distribution) → M4A (archive)      │
│         │                                                        │
│         ▼                                                        │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ ASSET STORAGE LAYER                                              │
├──────────────────────────────────────────────────────────────────┤
│ Cloudflare R2 Bucket:                                            │
│   /gabriel-recordings/{date}/{take_number}/{format}            │
│         │                                                        │
│         ├─────────► WAV (original, lossless)                   │
│         ├─────────► MP3 (streaming, 320kbps)                   │
│         └─────────► JSON metadata (timestamp, speaker, take)   │
│                                                                 │
│ Local Archive:                                                  │
│   /Volumes/Archive/GABRIEL/                                    │
│         │                                                        │
│         ├─────────► Logic projects (.logicx)                   │
│         ├─────────► Session recordings (organized by date)     │
│         └─────────► Reference files & metadata                 │
└──────────────────────────────────────────────────────────────────┘
```

### Critical Sample Rates & Formats
- **Recording Format:** 24-bit, 48kHz (industry standard, matches Apollo Twin)
- **Archive Format:** 24-bit, 48kHz WAV (lossless master)
- **Distribution:** 320kbps MP3 or 48kHz AAC
- **Backup:** Redundant WAV on external SSD + R2 cloud
- **Metadata:** JSON with timestamp, speaker, take number, notes

---

## 5. PRE-FLIGHT CHECKLIST (Before Recording Session)

### Hardware Verification
- [ ] **Apollo Twin Power:** Verify Micky-P is powered on (LED indicator lit)
- [ ] **Thunderbolt Connection:** Check GOD.local→Thunderbolt→Micky-P cable (no damage)
- [ ] **Physical Audio Outputs:** Confirm XLR/TRS cables connected to monitors
- [ ] **Headphone Output:** Headphones connected to Micky-P or adapter ready
- [ ] **Microphone (if needed):** Mic powered, phantom power available, levels set

### macOS Audio System
- [ ] **CoreAudio Status:** Run `pgrep coreaudiod` → should return PID (not empty)
- [ ] **Audio MIDI Setup:** Open → verify Apollo Twin listed as device
- [ ] **Sample Rate Alignment:** All devices set to 48kHz (Apollo Twin native rate)
- [ ] **Aggregate Device:** If using virtual routing, aggregate device created
- [ ] **System Audio Output:** Set to Apollo Twin (System Preferences → Sound)

### Universal Audio Console (UAD)
- [ ] **UAD App Launched:** Open Universal Audio Console app
- [ ] **Apollo Twin Recognized:** Console shows Micky-P device status
- [ ] **Firmware Check:** No update notifications (or update completed)
- [ ] **Monitor Outputs:** Main output levels visible in real-time
- [ ] **Preamp Status:** If recording, verify preamp mode (line/mic) correct

### Virtual Audio Routing
- [ ] **BlackHole Installed:** `ls /Library/Audio/Plug-Ins/HAL/BlackHole.driver` exists
- [ ] **Audio Hijack (if using):** App installed, test session created
- [ ] **Loopback (if using):** App open, virtual mixing setup verified
- [ ] **Routing Test:** Audio plays through → Hijack/Loopback → Apollo Twin

### TTS Engine
- [ ] **TTS System Ready:** One of (macOS say / Coqui / Bark / OpenAI / ElevenLabs) configured
- [ ] **Test Generation:** Run sample: `say "Gabriel test"` or equivalent
- [ ] **Audio Output:** TTS test audio audible in headphones/monitors
- [ ] **File Encoding:** Output format correct (WAV / MP3)

### Ollama & Gabriel AI
- [ ] **Ollama Running:** `curl http://localhost:11434/api/tags` returns model list
- [ ] **Gemma3 Available:** Gemma3 model loaded and responsive
- [ ] **API Response Time:** Test prompt execution < 5 seconds (adjust expectations)
- [ ] **noizy-gemma3 MCP:** Server accessible (if using MCP)
- [ ] **Text Output Format:** Gabriel responses formatted for TTS (clean text)

### DAW Setup (Logic Pro)
- [ ] **Logic Pro Launched:** App open and responsive
- [ ] **Audio Device Set:** Preferences → Audio/MIDI → Apollo Twin selected
- [ ] **Sample Rate:** Logic project set to 48kHz, 24-bit
- [ ] **Recording Tracks:** Multiple audio tracks created (Apollo Twin input selected)
- [ ] **Monitoring:** Monitor mix set up (input monitoring active)
- [ ] **Template Project:** Ready-to-record project template opened
- [ ] **Levels:** Input meters showing green (not red on peaks)

### Software Status
- [ ] **Disk Space:** `df -h` → at least 50GB free on SSD
- [ ] **System Load:** Activity Monitor → CPU < 60%, Memory < 120GB used
- [ ] **Background Apps:** Close non-essential apps (Safari, Mail, Slack)
- [ ] **Spotlight Indexing:** macOS not reindexing (Activity Monitor → Disk I/O)
- [ ] **Automatic Updates:** Disabled during recording session

### Recording Session Prep
- [ ] **Take Log Sheet:** Text file or spreadsheet ready to log takes
- [ ] **Directory Structure:** `/Volumes/Archive/GABRIEL/{DATE}/` created
- [ ] **Backup Drive:** External SSD connected (if backing up to external)
- [ ] **R2 Credentials:** AWS CLI or upload script configured (if using cloud)
- [ ] **Session Notes:** Markdown file for recording notes and timestamps

### Final Verification
- [ ] **End-to-End Test:** Generate Gabriel text → TTS → record 5-second sample
- [ ] **Playback Check:** Review recorded sample for quality/noise
- [ ] **Level Check:** Peaks at -6dB to -3dB (headroom for processing)
- [ ] **Latency Check:** Monitor latency in Logic Pro < 100ms (acceptable)
- [ ] **Safety Copy:** Test backup/upload process before full session

---

## 6. TROUBLESHOOTING GUIDE

### Apollo Twin Not Recognized
**Symptom:** UAD Console doesn't show Micky-P, System Preferences → Sound doesn't list Apollo Twin

**Solutions:**
```bash
# 1. Restart Thunderbolt drivers
sudo killall -9 coreaudiod
sleep 2

# 2. Reset Thunderbolt connection
# Physically disconnect Thunderbolt cable, wait 10 seconds, reconnect

# 3. Reset Apollo Twin firmware
# Open Universal Audio Console → Device → Reset

# 4. Check Thunderbolt connection
system_profiler SPThunderboltDataType | grep -i apollo

# 5. Force refresh audio devices
killall coreaudiod  # Will auto-restart

# 6. Restart Mac (last resort)
```

### No Audio Output / Silent Playback
**Symptom:** Playing audio produces no sound

**Solutions:**
```bash
# 1. Verify output device selected
system_profiler SPAudioDataType | grep -A10 "Output"

# 2. Check output volume (not muted)
osascript -e 'output volume of (get volume settings)'

# 3. Verify Audio MIDI Setup aggregate device
# Open Audio MIDI Setup → check Apollo Twin master volume

# 4. Check UAD Console output routing
# UAD Console → Main Output → verify enabled

# 5. Test system audio directly
afplay /System/Library/Sounds/Glass.aiff
# Should hear beep through headphones/monitors

# 6. Re-seat audio cables (XLR/TRS)
# Physically disconnect and reconnect all audio outputs
```

### CoreAudio Kernel Panic / Crash
**Symptom:** Audio stops working, system requires restart

**Solutions:**
```bash
# 1. Kill and restart CoreAudio daemon
sudo killall -9 coreaudiod
sleep 3
# coreaudiod will auto-restart

# 2. Clear CoreAudio cache
rm -rf ~/Library/Caches/com.apple.audio.CoreAudio*

# 3. Check system logs for audio errors
log stream --predicate 'process == "coreaudiod"' --level debug

# 4. Verify no USB audio devices causing conflicts
system_profiler SPUSBDataType | grep -i audio

# 5. Disable Bluetooth audio temporarily
# System Preferences → Bluetooth → disconnect all devices

# 6. Safe boot and restart (last resort)
# Restart holding Shift during startup
```

### Latency Issues / Audio Dropouts
**Symptom:** Audible latency (delay), clicking/popping sounds during recording

**Solutions:**
```bash
# 1. Reduce buffer size in UAD Console
# UAD Console → Settings → Buffer Size → reduce to 64 or 32 samples

# 2. Check system CPU load
top -l 1 | head -20
# If CPU > 80%, close background applications

# 3. Disable Spotlight indexing temporarily
sudo mdutil -a -i off

# 4. Update Apollo Twin drivers
# Universal Audio Console → About → Check for Updates

# 5. Reduce Logic Pro buffer size
# Logic Pro → Preferences → Audio/MIDI → Buffer Size → 256 or less

# 6. Disable unnecessary Logic Pro plugins
# Remove or bypass non-essential plugins during recording

# 7. Increase sample rate latency budget (if acceptable)
# May reduce dropout risk on lower-end hardware
```

### Recording Captures Silent Audio
**Symptom:** Recording device shows levels during playback, but recorded file is silent

**Solutions:**
```bash
# 1. Verify Logic Pro input device selected
# Logic Pro → Preferences → Audio/MIDI → Input → Apollo Twin

# 2. Enable input monitoring in track
# Logic Pro → Track → Input Monitoring → ON

# 3. Verify Audio MIDI Setup routing
# Audio MIDI Setup → Apollo Twin → verify clock source (internal)

# 4. Check CoreAudio input device mapping
system_profiler SPAudioDataType | grep -A5 "Apollo Twin"

# 5. Test input directly with built-in command
sox -d -r 48000 -b 24 -c 2 test_input.wav  # Record 5 seconds
# Press Ctrl+C to stop

# 6. Verify channel assignment in Logic Pro
# Track header → Input → select stereo pair (not mono)

# 7. Reset Logic Pro audio settings
# Logic Pro → Preferences → Audio/MIDI → Reset to Defaults
```

### TTS Audio Quality Issues
**Symptom:** Generated speech is robotic, has artifacts, wrong voice

**Solutions:**
```bash
# For macOS say command:
# Increase speech rate (default 150, try 120-140 for clarity)
say -v "Daniel" -r 120 "Test message"

# Change voice
say -v "?" | head -20  # List available voices
say -v "Victoria" "Test message"

# For Coqui TTS:
# Verify model downloaded and speaker selected
docker logs coqui_tts_container | tail -20

# For Bark:
# Increase inference steps (quality vs speed trade-off)
python generate_bark.py --steps 50  # higher = better quality

# For XTTS v2:
# Verify reference voice file quality (44.1kHz+ recommended)
# Ensure speaker matches desired output

# For ElevenLabs:
# Clone new voice from reference recording if needed
# Verify API key and rate limits not exceeded

# Test TTS chain end-to-end
echo "Test message" | tts_command > test.wav && afplay test.wav
```

### Virtual Audio Routing Not Working
**Symptom:** Audio doesn't pass through BlackHole/Loopback/Audio Hijack

**Solutions:**
```bash
# 1. Verify BlackHole installed correctly
ls -la /Library/Audio/Plug-Ins/HAL/BlackHole.driver

# 2. Restart CoreAudio to reload audio plugins
sudo killall -9 coreaudiod

# 3. Check Audio MIDI Setup shows BlackHole device
open /System/Library/CoreServices/Audio\ MIDI\ Setup.app

# 4. Test audio flow directly to BlackHole
afplay -d "BlackHole 2ch" /System/Library/Sounds/Glass.aiff

# 5. If using Audio Hijack, verify:
# - Source device: correct (system audio / app)
# - Destination: Apollo Twin
# - Recording enabled
# - Levels showing in real-time

# 6. Reset Audio Hijack session
# Quit and reopen Audio Hijack app

# 7. Check for audio device conflicts
# System Preferences → Sound → verify no disabled devices
```

### R2 Upload Failing
**Symptom:** Cloudflare R2 upload errors, credentials rejected

**Solutions:**
```bash
# 1. Verify AWS credentials configured
cat ~/.aws/credentials | grep -i cloudflare

# 2. Test R2 connectivity
aws s3 ls s3://your-bucket --endpoint-url https://your-account-id.r2.cloudflarestorage.com

# 3. Check file permissions
ls -l gabriel_recording.wav  # Should show read permissions

# 4. Verify R2 bucket policy (if private)
# Cloudflare Dashboard → R2 → Bucket Settings → Permissions

# 5. Upload manually to test
aws s3 cp gabriel_recording.wav s3://your-bucket/ \
  --endpoint-url https://your-account-id.r2.cloudflarestorage.com

# 6. Check file size limits (R2 max 5TB per file)
du -sh gabriel_recording.wav
```

### Recording Session Best Practices
- **Consistent timing:** Schedule same time daily for circadian audio quality
- **Room temperature:** Keep constant (thermal noise in preamps changes with heat)
- **Monitor levels:** Keep peaks at -6dB to -3dB during all takes
- **Multiple takes:** Record 3-5 takes of critical sections
- **Metadata:** Log timestamp, speaker, take number for each session
- **Backup immediately:** Upload to R2 + external SSD same day
- **Listen on multiple devices:** Verify quality on headphones, monitors, and consumer speakers

---

## 7. QUICK START COMMAND SEQUENCE

### Minimal Setup (Testing Only)
```bash
# 1. Verify Apollo Twin
system_profiler SPThunderboltDataType | grep -i apollo

# 2. Test macOS audio
say -v "Daniel" "Gabriel test"

# 3. Check Ollama
curl http://localhost:11434/api/tags | grep gemma

# 4. Generate and record sample (5 seconds)
# Option A: Using say command
say -v "Daniel" "Hello I am Gabriel" | afplay -d "Apollo Twin"

# Option B: Using Coqui TTS
curl http://localhost:5002/api/tts?text=Gabriel | afplay -d "Apollo Twin"
```

### Production Recording Session
```bash
# 1. Pre-flight
./gabriel-recording-setup.sh --check

# 2. Start Ollama + gabrielAgent
ollama serve &
source activate gabrielenv
python gabriel_agent.py &

# 3. Open DAW
open -a "Logic Pro"
# Create new 48kHz/24-bit session

# 4. Begin recording loop
while true; do
  TEXT=$(python -c "from gabriel import generate; print(generate())")
  ffplay -nodisp "${TEXT}.wav" &
  sleep 1  # Delay for recording
  # Manually save take in Logic Pro
  read -p "Save take? (y/n): "
done

# 5. Post-process and backup
./gabriel-recording-upload.sh /Volumes/Archive/GABRIEL/$(date +%Y-%m-%d)
```

---

## 8. FILE ORGANIZATION

### On-Disk Structure
```
/Volumes/Archive/GABRIEL/
├── 2026-04-13/
│   ├── 001_morning_session/
│   │   ├── gabriel_001.logicx       (Logic Pro project)
│   │   ├── gabriel_001_master.wav   (24-bit, 48kHz)
│   │   ├── gabriel_001_master.mp3   (320kbps distribution)
│   │   ├── gabriel_001_master.m4a   (backup format)
│   │   ├── metadata.json            (session info)
│   │   └── notes.txt                (recording notes)
│   └── 002_afternoon_session/
│       ├── gabriel_002.logicx
│       └── ...
├── 2026-04-14/
│   └── ...
└── ARCHIVE_INDEX.md

GOD.local: ~/Library/Caches/GABRIEL/
├── generated_scripts/
│   ├── 2026-04-13_001.txt
│   └── ...
├── tts_cache/
│   ├── sample_001.wav
│   └── ...
└── session_logs/
    └── 2026-04-13.log
```

### R2 Bucket Structure
```
s3://noizy-gabriel/
├── recordings/2026/04/13/
│   ├── 001/
│   │   ├── master.wav
│   │   ├── master.mp3
│   │   ├── master.m4a
│   │   └── metadata.json
│   └── 002/
│       └── ...
├── backups/
│   └── full_archive_2026-04-13.tar.gz
└── metadata/
    └── recording_index.json
```

---

## 9. PERFORMANCE TARGETS

### Recording Quality Standards
- **SNR (Signal-to-Noise Ratio):** >60dB (industrial standard)
- **THD (Total Harmonic Distortion):** <0.1% (at -6dB)
- **Frequency Response:** 20Hz–20kHz (human hearing range)
- **Peak Level:** -3dB to -6dB (headroom for processing)
- **Latency:** <100ms (acceptable for speech)

### File Size Estimates
- **24-bit/48kHz WAV:** ~5.75 MB per minute
- **320kbps MP3:** ~2.4 MB per minute
- **1-hour session:** ~345MB WAV + 144MB MP3
- **Daily backup:** 1-2GB (including Logic projects)

### Speed Benchmarks
- **Text generation (Gemma3):** 2-5 seconds per 100 words
- **TTS (Coqui):** 1-3 seconds per 10 seconds of audio
- **TTS (Bark):** 3-10 seconds per 10 seconds of audio
- **TTS (OpenAI API):** <1 second per request (cloud latency)
- **Logic Pro import/process:** <5 seconds per take

---

## 10. PRODUCTION DEPLOYMENT CHECKLIST

### Before Public Release
- [ ] Multiple takes recorded (minimum 3 per script)
- [ ] A/B tested on consumer speakers (not studio monitors)
- [ ] Noise floor measured and acceptable
- [ ] Spectral analysis performed (no unwanted frequencies)
- [ ] Metadata complete (timestamp, speaker, version)
- [ ] Backup verified on two independent drives
- [ ] R2 upload confirmed and accessible
- [ ] Version control: git commit with recording session details
- [ ] Legal: Usage rights confirmed for all software/models
- [ ] Documentation: Updated Gabriel voice profile with session info

---

## CONTACTS & RESOURCES

**Project Lead:** Robert Stephen Plowman  
**Hardware Support:** Universal Audio (Apollo Twin)  
**AI Framework:** Ollama documentation  
**TTS Engines:**
- Coqui: https://github.com/coqui-ai/TTS
- Bark: https://github.com/suno-ai/bark
- ElevenLabs: https://elevenlabs.io/api

**Emergency Contacts:**
- macOS Audio Issues: Apple Support Communities
- Apollo Twin Hardware: Universal Audio Support
- Thunderbolt Issues: Apple Thunderbolt Documentation

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-13  
**Status:** READY FOR DEPLOYMENT
