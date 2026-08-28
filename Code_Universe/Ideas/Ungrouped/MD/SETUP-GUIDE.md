# NOIZY.AI — iPad → M2 Ultra Audio Routing

## Overview

Route audio from your iPad to the M2 Ultra Mac using Audio Hijack.
Two methods: **USB (wired)** for lowest latency, **AirPlay (wireless)** for flexibility.

---

## Prerequisites

1. **Audio Hijack 4** — https://rogueamoeba.com/audiohijack/
2. **Loopback** (optional) — https://rogueamoeba.com/loopback/
3. **ACE** (Audio Capture Engine) — Audio Hijack will prompt you to install this on first run

### For USB Mode
- iPad connected to M2 Ultra via USB-C or Lightning cable
- iPad must be **trusted** on the Mac (tap "Trust" on iPad when prompted)
- iPad appears as audio input device automatically

### For AirPlay Mode
- Both devices on the same WiFi network
- **System Settings → General → AirDrop & Handoff → AirPlay Receiver: ON**
- From iPad: Control Center → Screen Mirroring → select your Mac

---

## Quick Start

```bash
# Generate all scripts
chmod +x setup-ipad-audio.sh
./setup-ipad-audio.sh

# Or choose a specific mode
./setup-ipad-audio.sh usb
./setup-ipad-audio.sh airplay
```

Then use the runner scripts:
```bash
./start-usb-capture.sh       # Start USB capture
./start-airplay-capture.sh   # Start AirPlay capture
./audio-control.sh           # Launch control panel
```

---

## Audio Chain

### USB Mode
```
iPad (USB) → Audio Hijack [Input Device: iPad] → Volume → Recorder → Output
```

### AirPlay Mode
```
iPad (AirPlay) → Mac System Audio → Audio Hijack [System Audio] → EQ → Recorder → Output
```

### DAW Routing (Logic Pro / Ableton / etc.)
```
iPad → Audio Hijack → Loopback [NOIZY iPad Bridge] → DAW Input
```

1. Run `loopback-routing.applescript` to create "NOIZY iPad Bridge" virtual device
2. In Audio Hijack: change Output Device block to "NOIZY iPad Bridge"
3. In your DAW: set audio input to "NOIZY iPad Bridge"

---

## Capture Directories

All recordings are saved to:
```
~/Music/NOIZY-AI/
├── iPad-Captures/       # USB recordings
├── AirPlay-Captures/    # AirPlay recordings
└── TALESPIN/            # Voice performances
```

Format: Apple Lossless (.m4a) — lossless quality, smaller than WAV

---

## Manual Audio Hijack Setup (if scripts don't work)

1. Open Audio Hijack
2. Click **+ New Session** → **New Blank Session**
3. Name it "NOIZY — iPad USB Input"
4. Drag blocks into the session:

### USB Session Blocks:
```
[Input Device: iPad] → [Volume] → [Recorder] → [Output Device]
```

### AirPlay Session Blocks:
```
[System Audio] → [10-Band EQ] → [Recorder] → [Output Device]
```

5. In the Recorder block:
   - Format: Apple Lossless
   - Output folder: ~/Music/NOIZY-AI/
6. Click the **Record** button to start

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| iPad not showing as input device | Reconnect USB cable, tap "Trust" on iPad |
| No audio from AirPlay | Check System Settings → AirPlay Receiver is ON |
| Audio Hijack can't capture system audio | Install ACE (Audio Hijack prompts for this) |
| AppleScripts fail | Open in Script Editor first, grant permissions in System Settings → Privacy → Automation |
| DAW doesn't see NOIZY iPad Bridge | Install Loopback, run loopback-routing.applescript |
| Latency too high on AirPlay | Switch to USB mode for near-zero latency |

---

## TALESPIN Voice Performances

Your TALESPIN audio files should be placed in `~/Music/NOIZY-AI/TALESPIN/`.
These can then be referenced in the NOIZY.AI website's HEAVEN page audio visualizer.

To add them to the ARCHIVE repo:
```bash
cp ~/Music/NOIZY-AI/TALESPIN/*.wav ./public/audio/talespin/
git add public/audio/talespin/
git commit -m "feat: Add TALESPIN voice performance audio assets"
git push
```
