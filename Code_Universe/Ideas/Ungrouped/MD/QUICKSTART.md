# MC 96 Audio Hub - Quick Start Guide

## 🎙️ What This Does
Creates a **private audio broadcast hub** on your static IP (192.168.1.100) that allows:
- iPhone/iPad to stream audio from your Mac
- Mac to receive audio from your iPhone/iPad
- Noizyanthropic IDE to process all audio streams
- Everything on a secure local network (no cloud required)

---

## ⚡ 5-Minute Setup

### On Your Mac

#### 1. Set Static IP
```bash
# Auto-detected, but verify:
ifconfig | grep "inet 192.168.1"
# Should show: inet 192.168.1.100
```

#### 2. Start Audio Hijack Broadcast
1. Open **Audio Hijack 3**
2. Create a new session: "Noizy Hub Broadcast"
3. Add inputs:
   - Microphone
   - System Audio Capture
4. Add output: **Network → Broadcast**
   - Type: **SHOUTcast**
   - Port: **8000**
   - Bitrate: **128 kbps**
   - Password: **noisy123**
5. Click **Record** to start broadcasting

#### 3. Start Noizyanthropic Audio Receiver
```bash
cd /Users/m2ultra/NOIZYANTHROPIC/NOIZYLAB/audio-hub
node audio-receiver.js
```

**Output should show:**
```
🎙️  Noizyanthropic Audio Hub Receiver Starting...
📍 Audio Hub URL: http://192.168.1.100:8000/stream
📡 Receiver Port: 9000
🚀 Receiver server listening on port 9000
```

---

### On An iOS Device (iPhone/iPad)

#### Option A: Quick Test (Safari)
1. Open Safari
2. Navigate to: `http://192.168.1.100:8000/stream`
3. You should hear audio

#### Option B: Use Siri Shortcut (Recommended)
1. Open **Shortcuts** app
2. Tap **"+"** to create new
3. Add action: **"Get contents of URL"**
   - URL: `http://192.168.1.100:8000/stream`
4. Add action: **"Play sound"**
   - Select "Result from previous action"
5. Save as **"Connect to Noisy Hub"**
6. Add to Siri: "Hey Siri, connect to Noisy Hub"

---

## 🧪 Test Everything

### From Mac Terminal
```bash
# Check Audio Hub is online
curl http://127.0.0.1:9000/status

# Listen to the stream
ffplay http://192.168.1.100:8000/stream

# Or with VLC
vlc http://192.168.1.100:8000/stream
```

### From iPhone/iPad
- Say "Hey Siri, connect to Noisy Hub"
- You should hear your Mac's audio

---

## 📱 Device Connection Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   Wi-Fi Network                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐      Port 8000      ┌─────────────┐  │
│  │  Audio       │  ◄──────────────────┤  Noizy Hub  │  │
│  │  Hijack      │  (broadcast stream) │  Receiver   │  │
│  │  (Mac)       │                     │  (Mac)      │  │
│  └──────┬───────┘                     └─────────────┘  │
│         │                                   ▲           │
│         │ Port 8000                         │           │
│    Stream URL                          Port 9000        │
│         │                                   │           │
│    ┌────▼──────────┐               ┌───────┴────┐      │
│    │  iPhone       │               │ Noisy IDE  │      │
│    │  iPad        │               │ (VS Code)  │      │
│    └───────────────┘               └────────────┘      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔗 Stream URLs Reference

| Purpose | URL | Device |
|---------|-----|--------|
| **Receive Audio** | `http://192.168.1.100:8000/stream` | iPhone/iPad |
| **Receiver Status** | `http://127.0.0.1:9000/status` | Mac Terminal |
| **Receiver Web UI** | `http://127.0.0.1:9000/` | Mac Browser |

---

## ⚙️ Configuration

### Audio Hijack Settings
```
Port: 8000
Protocol: SHOUTcast
Bitrate: 128 kbps (adjustable)
Password: noisy123
Encoding: MP3
```

### Network Requirements
- Mac IP: `192.168.1.100`
- Subnet Mask: `255.255.255.0`
- Router: `192.168.1.1`
- DNS: `8.8.8.8`, `8.8.4.4`

---

## 🆘 Troubleshooting

### "Cannot connect to hub"
```bash
# Test Mac is on static IP
ping 192.168.1.100

# Check Audio Hijack is broadcasting
lsof -i :8000

# Verify firewall allows Audio Hijack
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate
```

### "Audio is cutting out"
- Increase bitrate to 192 or 256 kbps in Audio Hijack
- Check Wi-Fi signal strength
- Move closer to router

### "Receiver not starting"
```bash
# Make sure port 9000 is free
lsof -i :9000

# Kill any process using it
kill -9 <PID>

# Try again
node audio-receiver.js
```

---

## 🚀 Advanced: Send Audio FROM iPhone Back to Mac

Create a second Siri Shortcut:

1. In **Shortcuts**, create new
2. Add: **"Ask for Audio"** (request microphone)
3. Add: **"HTTP Request"**
   - URL: `http://192.168.1.100:9000/upload`
   - Method: POST
   - Body: [audio from step 2]
4. Save as **"Send Audio to Noisy"**
5. Add to Siri: "Hey Siri, send to Noisy"

---

## 📊 Monitoring

Watch real-time connections:
```bash
# In Terminal, watch for new clients
watch -n 1 'curl -s http://127.0.0.1:9000/status | jq .'
```

---

## 🔄 Next Steps

1. ✅ static IP running
2. ✅ Audio Hijack broadcasting
3. ✅ Noizyanthropic Receiver running
4. ✅ iOS devices connected
5. **Next:** Integrate with Noizyanthropic IDE for processing
6. **Next:** Add Claude API for voice-to-text
7. **Next:** Create the full Dream Chamber experience

---

## 📝 Files Created

```
audio-hub/
├── audio-receiver.js    # Main receiver server
├── package.json        # Node.js dependencies
├── iOS-SETUP.md        # Detailed iOS guide
├── QUICKSTART.md       # This file
└── audio-cache/        # Saved audio files
```

---

**Need help?** Check the individual guide files in this directory.
