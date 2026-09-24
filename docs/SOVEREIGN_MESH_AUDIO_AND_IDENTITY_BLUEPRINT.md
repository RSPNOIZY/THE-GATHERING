# 🏛️ SOVEREIGN MESH, AUDIO PIPELINE & IDENTITY ARCHITECTURE
**SonoBus · BlackHole 16ch · WireGuard · Tailscale & Headscale · Proton Auth**  
**Nodes: Apple Mac Studio M2 Ultra (192GB) · NOIZYWIN (Windows 11) · iPhone 15 Pro Max · iPad Pro**  
**Date: 2026-09-24 · Single Source of Truth: `THE-GATHERING / NOIZYGIT-MASTER`**

---

## 1. Complete Architecture Map

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                        🔐 IDENTITY ROOT: PROTON AUTH & PASS                             │
│       Master Passkeys • TOTP 2FA • API Keys • Zero Plaintext Secrets in Repos           │
│   (Apple: rsplowman@icloud.com | Google: rsp@fishmusicinc.com | GitHub: RSPNOIZY)      │
└────────────────────────────────────────┬────────────────────────────────────────────────┘
                                         │
┌────────────────────────────────────────▼────────────────────────────────────────────────┐
│                   🛡️ ENCRYPTED MESH: WIREGUARD + TAILSCALE / HEADSCALE                  │
│                                                                                         │
│  [WIREGUARD 10.77.0.0/24]                      [TAILSCALE / HEADSCALE 100.x.x.x]        │
│  • 10.77.0.1 : NOIZYVAULT Hub                  • 100.118.84.40 : m2ultras-mac-studio    │
│  • 10.77.0.2 : Mac Studio M2 Ultra (Control)   • 100.103.17.98 : iphone-15-pro-1        │
│  • 10.77.0.3 : NOIZYWIN Hardware Node          • 100.81.42.1   : ipad-pro-12-9-gen-2-1  │
│  • 10.77.0.4 : iPhone 15 Pro Max               • 100.88.102.10 : rsp-mbp13              │
│  • 10.77.0.5 : iPad Pro Command Surface                                                 │
└────────────────────────────────────────┬────────────────────────────────────────────────┘
                                         │
┌────────────────────────────────────────▼────────────────────────────────────────────────┐
│               🎛️ LOW-LATENCY REAL-TIME AUDIO: SONOBUS + BLACKHOLE 16CH                   │
│                                                                                         │
│   iOS / Mobile Devices ◄───(SonoBus E2EE Opus/PCM over Mesh)───► Mac Studio M2 Ultra    │
│                                                                        │                │
│                                    ┌───────────────────────────────────▼────────────┐   │
│                                    │           BLACKHOLE 16CH VIRTUAL BUS           │   │
│                                    │  Ch 1-2   : Master Stereo / DAW Monitor        │   │
│                                    │  Ch 3-4   : Whisper STT Ingestion (M2 Metal)   │   │
│                                    │  Ch 5-6   : SonoBus P2P Mobile Bridge          │   │
│                                    │  Ch 7-8   : Piper Neural TTS (Gabriel/Lucy)    │   │
│                                    │  Ch 9-10  : Audio Hijack Processing & Rescue   │   │
│                                    │  Ch 11-12 : DreamChamber DAW Submix            │   │
│                                    │  Ch 13-14 : Dashcam & CarPlay Telemetry        │   │
│                                    │  Ch 15-16 : Isolated Diagnostic / Audit        │   │
│                                    └────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Audio Subsystem: BlackHole 16ch & SonoBus

### Verified Active Hardware Status on M2 Ultra:
- **`BlackHole 16ch`**: Installed & verified (`Input Channels: 16`, `Output Channels: 16`, Manufacturer: *Existential Audio Inc.*).
- **`SonoBus.app`**: Installed at `/Applications/SonoBus.app`.
- **`Audio Hijack.app`**: Installed at `/Applications/Audio Hijack.app`.

### Channel Allocation Table (BlackHole 16ch)

| Channels | Purpose | Source | Destination |
| :--- | :--- | :--- | :--- |
| **`Ch 1-2`** | Master Stereo Out | DAW / System Audio | SoundSource / Studio Monitors |
| **`Ch 3-4`** | Local STT Pipe | Mic / Mobile Voice | Whisper Metal GPU (`scripts/foss_whisper_transcribe.py`) |
| **`Ch 5-6`** | SonoBus Network Bridge | SonoBus.app | SonoBus iOS (iPhone / iPad over Mesh) |
| **`Ch 7-8`** | Agent Speech | Piper Neural TTS | Audio Monitor & SonoBus Broadcast |
| **`Ch 9-10`** | Audio Hijack Stream | BlackHole 16ch Ch 1-2 | Live Master Recording & Stem Rescue |
| **`Ch 11-12`** | DreamChamber Synth | Reaper / Logic / Ableton | BlackHole Ch 1-2 Mix |
| **`Ch 13-14`** | Vehicle / Transit Ingest| Road Mode / Dashcam | Lucy Voice / Whisper Filter |
| **`Ch 15-16`** | Diagnostic & Audit | Test Generators | Silent Audit Logger |

### SonoBus P2P Mesh Configuration:
- **Audio Quality**: Uncompressed PCM 24-bit or Opus 510 kbps (Lossless/High-Fidelity).
- **Buffer Size**: 64 to 128 samples (<5ms internal buffer latency).
- **Network Protocol**: Direct peer-to-peer UDP over Tailscale (`100.118.84.40`) or WireGuard (`10.77.0.2`).
- **End-to-End Encryption**: Enabled natively in SonoBus session passwords.

---

## 3. Network Mesh: WireGuard vs. Tailscale vs. Headscale

| Parameter | **WireGuard** (`wg-noizyvault`) | **Tailscale** (`noisytail`) | **Headscale** (Self-Hosted) |
| :--- | :--- | :--- | :--- |
| **Role** | Kernel-speed local studio enclave | Dynamic roaming & mobile road mode | Sovereign replacement for Tailscale control plane |
| **Subnet** | `10.77.0.0/24` | `100.x.x.x` | `100.x.x.x` (custom prefix) |
| **M2 Ultra IP**| `10.77.0.2` | `100.118.84.40` | `100.64.0.2` |
| **iPhone IP** | `10.77.0.4` | `100.103.17.98` | `100.64.0.4` |
| **iPad IP** | `10.77.0.5` | `100.81.42.1` | `100.64.0.5` |
| **NAT Traversal**| Manual port forward (`51820`) | Automated DERP relay | Self-hosted DERP relay |
| **Coordination** | Peer config files | Tailscale Cloud | **100% Self-Hosted (Zero 3rd party)** |

---

## 4. Master Identity Alignment Matrix

| Service | Canonical Login | Role | 2FA / Authentication Method |
| :--- | :--- | :--- | :--- |
| **Google Workspace** | **`rsp@fishmusicinc.com`** | Primary Canonical Mailbox & Super Admin | Proton Authenticator (TOTP) |
| **Google Workspace Alias** | **`rp@fishmusicinc.com`** | Legacy Alias (Inbound audit-only) | Managed via `rsp@fishmusicinc.com` |
| **Google Cloud Console** | **`rspplowman@gmail.com`** | GCP Projects (23 projects active) | Proton Authenticator (TOTP) |
| **Ecosystem Google Drive**| **`rspnoizy@gmail.com`** | Android, AI Studio & Shared Colabs | Proton Authenticator (TOTP) |
| **Apple ID & Developer** | **`rsplowman@icloud.com`** | App Store Connect, iOS fleet, Keychain | Apple Device 2FA + Secure Enclave |
| **GitHub** | **`RSPNOIZY`** | Master Git Repository & Source of Truth | Proton Authenticator (TOTP) + SSH Key |
| **Microsoft** | **NOIZYWIN Account** | Windows 11 Node (`/Volumes/NOIZYWIN`) | Microsoft Authenticator / Proton TOTP |
| **Cloudflare** | **`fishmusicinc.com` admin**| DNS, Workers (`aeon-power`), R2, D1 | Proton Authenticator + API Tokens |
| **Proton Suite** | **Master Proton Account** | Cryptographic Vault for all secrets | Hardware FIDO2 Security Key / Passkey |

---

## 5. Standard Operating Procedures (SOP)

1. **Routing Mobile Audio into Whisper on M2 Ultra**:
   - Open SonoBus on iPhone (`100.103.17.98`).
   - Connect to M2 Ultra SonoBus session on `100.118.84.40`.
   - On M2 Ultra, set SonoBus audio output to `BlackHole 16ch Channels 3-4`.
   - Run `python3 scripts/foss_whisper_transcribe.py` reading from BlackHole Ch 3-4 for instant transcription.

2. **Zero-Trust Credential Maintenance**:
   - When any service (GitHub, Google, Apple) requests 2FA, open **Proton Authenticator** as the sole authority.
   - Never paste plaintext passwords, tokens, or private keys into `.env` or Git files.
