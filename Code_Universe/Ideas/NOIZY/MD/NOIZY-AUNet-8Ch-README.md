# Logic Pro X — NOIZY AUNet 8-Channel Recording Template

AU Net Send/Receive enables network audio routing for remote recording,
multi-room capture, or iPad/Mac bridging. 8 stereo channels pre-configured.

## Setup Steps (5 Minutes)

1. File → New → Empty Project
2. Delete default track
3. Follow template recreation below

## Track Stack: 8-Channel AU Net Receive

```
Track 1-8: Audio (Stereo)
├── Input: AU Net Stereo Receive 1-8
├── Named: "NetRx Ch[1-8] - [Mic/Gtr/Kick...]"
├── Color: Blue (Receive group)
└── Arm for Record (R)
```

### AU Net Receive Configuration
```
1. Audio FX → Audio Units → Apple → AU Net Stereo Receive
2. Channel: 1 (Track 1), 2 (Track 2), etc.
3. Bonjour Name: "NOIZY-NetRx" (all channels same)
4. Network: Auto (same LAN/WiFi)
```

### Master Bus Chain
```
Master →
  Gain (-6dB safety)
  Compressor (Platinum Digital)
  Limiter (Adaptive)
```

## Sender Side Template (Remote Mac/iPad)

```
1. Create 8 Audio Tracks
2. Output → AU Net Stereo Send → Channel 1-8
3. Bonjour Name: "NOIZY-NetTx"
4. Arm + Record
```

## Pre-Loaded FX Chains (Per Track)
```
Vocals: Channel EQ → DeEsser2 → Space Designer (small room)
Guitar: Amp Designer → Pedalboard → ChromaVerb
Drums: Drum Kit Designer → Compressor → Tape Delay
Keys: Retro Synth → Ensemble → ChromaVerb
```

## Network Checklist
- [ ] Same WiFi/LAN (no VPN)
- [ ] Bonjour: NOIZY-NetRx/Tx visible
- [ ] Firewall: Allow Logic Pro
- [ ] Buffer: 128-256 samples
- [ ] Sample Rate: 48kHz match

## Export Stems
```
File → Export → Tracks as Files
- Format: 24-bit WAV
- Channels: Separate stereo files
- Naming: "NetRx_Ch1_Vocals_48k.wav"
```

Save as "NOIZY-AUNet-8Ch" template. Zero setup per session.
