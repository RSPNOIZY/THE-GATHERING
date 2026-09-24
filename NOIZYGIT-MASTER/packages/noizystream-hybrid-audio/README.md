# 🎵 HYBRID AUDIO NOIZYSTREAM — Real-Time 16-Channel Audio Routing Substrate
**Engine for NOIZYBEAST.IDE & MC96ECOUNIVERSE**  
*Existential Audio BlackHole 16ch · SonoBus P2P · Rogue Amoeba Satellite · FOSS Audio Stack*  
*Target Rate: `48,000 Hz / 24-bit` · Latency Target: `< 2.0 ms`*

---

## 🎛️ 16-Channel Virtual Audio Matrix

| Channels | Bus Name | Source -> Destination | Description |
| :---: | :--- | :--- | :--- |
| **CH 01-02** | Master Studio Output | Mix Bus -> Mac Studio / HDMI SAM | Master studio monitoring & listening environment |
| **CH 03-04** | Gabriel Neural Voice (A.I.V.A.) | Gabriel Voice Engine -> BlackHole 3-4 | Real-time generated voice synthesis and stem generation |
| **CH 05-06** | Lucy Voice & OS Tap | Lucy Personal OS -> LUCY-iPad / BlackHole 5-6 | Conversational AI, mobile telemetry, and vehicular CarPlay audio |
| **CH 07-08** | DAW Stems & Samplers | Logic Pro (`NOIZYSTREAM.logicx`) -> BlackHole 7-8 | Live multitrack DAW recording, Kontakt samplers & instruments |
| **CH 09-10** | SonoBus Lossless P2P Stream | SonoBus Client -> BlackHole 9-10 | Lossless peer-to-peer remote collaboration stream |
| **CH 11-12** | Rogue Amoeba Satellite Broadcast | MICKY-P / Airfoil Satellite -> Wireless Remote | Wireless broadcasting to iPhones, iPads, and remote listening rooms |
| **CH 13-14** | Whisper.cpp Local Ingest | Studio Microphones -> Whisper.cpp Metal | Zero-latency local speech recognition & voice command parser |
| **CH 15-16** | Loopback Sidetone & Talkback | Rogue Amoeba Loopback -> BlackHole 15-16 | Direct sidetone monitor, talkback bus, and latency calibration |

---

## 🐧 FOSS DSP Engine Integration
- **`ffmpeg`**: Multi-format streaming, FLAC/WAV real-time piping.
- **`sox`**: Dynamic range limiter, sample rate converter, audio filtering.
- **`whisper.cpp`**: Hardware-accelerated local transcription via Apple Metal GPU.
- **`piper-tts`**: Instant local neural voice synthesis.
- **`sonobus`**: Open-source low-latency peer-to-peer audio transmission.

---

## ⚡ Execution in NOIZYBEAST.IDE

```bash
# Check and audit the 16-channel Hybrid NOIZYSTREAM matrix
python3 packages/noizystream-hybrid-audio/noizystream_audio_router.py
```
